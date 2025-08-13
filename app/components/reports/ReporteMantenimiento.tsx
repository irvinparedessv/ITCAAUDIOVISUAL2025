import React, { useEffect, useState } from "react";
import { Table, Button, Form, Spinner, Card, Container, Row, Col, Badge } from "react-bootstrap";
import api from "../../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PaginationComponent from "~/utils/Pagination";
import { useNavigate } from "react-router-dom";
import { FaLongArrowAltLeft, FaFileExcel, FaFilePdf, FaSearch, FaEraser, FaTools, FaCalendarAlt } from "react-icons/fa";
import { getEstados } from "~/services/itemService";
import { getTiposMantenimiento } from "~/services/tipoMantenimientoService";
import { formatDate, formatTo12h } from "~/utils/time";

interface Mantenimiento {
  id: number;
  equipo_id: number;
  equipo?: {
    modelo?: {
      nombre?: string;
      marca?: {
        nombre?: string;
      };
    };
    numero_serie?: string;
    estado?: {
      nombre?: string;
    };
  };
  tipoMantenimiento?: {
    nombre?: string;
  };
  usuario?: {
    first_name?: string;
    last_name?: string;
  };
  fecha_mantenimiento: string;
  fecha_mantenimiento_final: string | null;
  hora_mantenimiento_inicio: string;
  hora_mantenimiento_final: string | null;
  estado_equipo_final: number | null;
  estado: string;
  vida_util: number;
  comentario: string;
  detalles: string;
  created_at: string;
}

interface FuturoMantenimiento {
  id: number;
  equipo_id: number;
  equipo?: {
    modelo?: {
      nombre?: string;
      marca?: {
        nombre?: string;
      };
    };
    numero_serie?: string;
    estado?: {
      nombre?: string;
    };
  };
  tipo_mantenimiento?: {
    nombre?: string;
  };
  usuario?: {
    first_name?: string;
    last_name?: string;
  };
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;   
  fecha_mantenimiento_final: string | null;
  hora_mantenimiento_final: string | null;
  detalles: string;  
  created_at: string;
}

interface TipoMantenimiento {
  id: number;
  nombre: string;
}

interface Estado {
  id: number;
  nombre: string;
}

const ReporteMantenimiento = () => {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [futurosMantenimientos, setFuturosMantenimientos] = useState<FuturoMantenimiento[]>([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"mantenimientos" | "futuros">("mantenimientos");
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);

  const getEquipoNombre = (item: Mantenimiento | FuturoMantenimiento) => {
    if (!item.equipo?.modelo) return 'Equipo desconocido';
    const marca = item.equipo.modelo.marca?.nombre || 'Marca desconocida';
    const modelo = item.equipo.modelo.nombre || 'Modelo desconocido';
    return `${marca} ${modelo}`;
  };

  const getTecnicoNombre = (item: Mantenimiento | FuturoMantenimiento) => {
    if (!item.usuario) return 'Técnico desconocido';
    return `${item.usuario.first_name || ''} ${item.usuario.last_name || ''}`.trim() || 'Técnico desconocido';
  };

  const getTipoMantenimiento = (item: Mantenimiento | FuturoMantenimiento) => {
    return (item as any).tipoMantenimiento?.nombre || 
           (item as any).tipo_mantenimiento?.nombre || 
           'Tipo desconocido';
  };

  const getNumeroSerie = (item: Mantenimiento | FuturoMantenimiento) => {
    return item.equipo?.numero_serie || 'N/A';
  };

  const getEstado = (item: Mantenimiento | FuturoMantenimiento): string => {
  if ('estado_equipo_final' in item && item.estado_equipo_final) {
    // Convertir el número a string o buscar el nombre del estado correspondiente
    const estadoEncontrado = estados.find(e => e.id === item.estado_equipo_final);
    return estadoEncontrado?.nombre || item.estado_equipo_final?.toString() || 'Desconocido';
  }
  return item.equipo?.estado?.nombre || 'Desconocido';
};

  const getEstadoBadge = (estado: string | number) => {
  const estadoStr = typeof estado === 'number' ? estado.toString() : estado;
  if (!estadoStr) return "secondary";

  const estadoLower = estadoStr.toLowerCase();
  
  if (estadoLower.includes('no disponible')) return "secondary";
  if (estadoLower.includes('disponible')) return "success";
  if (estadoLower.includes('dañado')) return "danger";
  if (estadoLower.includes('mantenimiento')) return "warning";
  if (estadoLower.includes('reservado')) return "primary";
  
  return "secondary";
};

  const fetchMantenimientos = async (
    page = 1,
    tipo_id = filtroTipo,
    estado_id = filtroEstado,
    fecha_inicio = filtroFechaInicio,
    fecha_fin = filtroFechaFin,
    search = busqueda
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (tipo_id) params.tipo_id = tipo_id;
      if (estado_id !== "") params.estado_id = estado_id;
      if (fecha_inicio) params.fecha_inicio = fecha_inicio;
      if (fecha_fin) params.fecha_fin = fecha_fin;
      if (search) params.search = search;

      const res = await api.get("/mantenimientos", { params });
      setMantenimientos(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setTotalPages(res.data.last_page || 1);
    } catch {
      toast.error("Error al cargar los mantenimientos");
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFuturosMantenimientos = async (
    page = 1,
    tipo_id = filtroTipo,
    fecha_inicio = filtroFechaInicio,
    fecha_fin = filtroFechaFin,
    search = busqueda
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (tipo_id) params.tipo_id = tipo_id;
      if (fecha_inicio) params.fecha_inicio = fecha_inicio;
      if (fecha_fin) params.fecha_fin = fecha_fin;
      if (search) params.search = search;

      const res = await api.get("/futuroMantenimiento", { params });
      setFuturosMantenimientos(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setTotalPages(res.data.last_page || 1);
    } catch {
      toast.error("Error al cargar los futuros mantenimientos");
      setFuturosMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposMantenimiento = async () => {
    try {
      const res = await getTiposMantenimiento();
      const tipos = Array.isArray(res) ? res : (res.data || []);
      setTiposMantenimiento(tipos);
    } catch {
      toast.error("Error al cargar los tipos de mantenimiento");
      setTiposMantenimiento([]);
    }
  };

  const fetchEstados = async () => {
    try {
      const estadosData = await getEstados();
      setEstados(estadosData);
    } catch {
      toast.error("Error al cargar los estados");
      setEstados([]);
    }
  };

  useEffect(() => {
    fetchTiposMantenimiento();
    fetchEstados();
    if (activeTab === "mantenimientos") {
      fetchMantenimientos(1);
    } else {
      fetchFuturosMantenimientos(1);
    }
  }, [activeTab]);

  const fetchAllMantenimientos = async (): Promise<Mantenimiento[]> => {
    const allMantenimientos: Mantenimiento[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
      do {
        const res = await api.get("/mantenimientos", {
          params: {
            tipo_id: filtroTipo || undefined,
            estado_id: filtroEstado || undefined,
            fecha_inicio: filtroFechaInicio || undefined,
            fecha_fin: filtroFechaFin || undefined,
            search: busqueda || undefined,
            per_page: 100,
            page: currentPage,
          },
        });

        allMantenimientos.push(...(res.data.data || []));
        totalPages = res.data.last_page || 1;
        currentPage++;
      } while (currentPage <= totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar todos los registros");
    }

    return allMantenimientos;
  };

  const fetchAllFuturosMantenimientos = async (): Promise<FuturoMantenimiento[]> => {
    const allFuturos: FuturoMantenimiento[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
      do {
        const res = await api.get("/futuroMantenimiento", {
          params: {
            tipo_id: filtroTipo || undefined,
            fecha_inicio: filtroFechaInicio || undefined,
            fecha_fin: filtroFechaFin || undefined,
            search: busqueda || undefined,
            per_page: 100,
            page: currentPage,
          },
        });

        allFuturos.push(...(res.data.data || []));
        totalPages = res.data.last_page || 1;
        currentPage++;
      } while (currentPage <= totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar todos los registros");
    }

    return allFuturos;
  };

  const exportarExcel = async () => {
    const toastId = "confirmar-excel";
    toast.dismiss(toastId);
    toast.dismiss("confirmar-pdf");

    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el reporte en formato Excel?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={async () => {
                toast.dismiss(t.id);
                toast.loading("Generando Excel...", { id: "excel-download" });

                try {
                  let all: any[] = [];
                  let fileName = "";

                  if (activeTab === "mantenimientos") {
                    all = await fetchAllMantenimientos();
                    fileName = "ReporteMantenimientos.xlsx";
                  } else {
                    all = await fetchAllFuturosMantenimientos();
                    fileName = "ReporteFuturosMantenimientos.xlsx";
                  }

                  if (!all.length) {
                    toast.error("No hay datos para exportar", { id: "excel-download" });
                    return;
                  }

                  const datos = all.map((item) => {
  const baseData = {
    "ID": item.id, // Añadido campo ID
    "Equipo": getEquipoNombre(item),
    "N° Serie": getNumeroSerie(item),
    "Tipo Mantenimiento": getTipoMantenimiento(item),
    "Técnico": getTecnicoNombre(item),
    "Fecha Programada": item.fecha_mantenimiento ? new Date(item.fecha_mantenimiento).toLocaleDateString('es-ES') : 'N/A',
    "Hora Inicio": item.hora_mantenimiento_inicio || 'N/A',
  };

  if (activeTab === "mantenimientos") {
    const mItem = item as Mantenimiento;
    return {
      ...baseData,
      "Fecha Finalización": mItem.fecha_mantenimiento_final ? new Date(mItem.fecha_mantenimiento_final).toLocaleDateString('es-ES') : "Pendiente",
      "Hora Final": mItem.hora_mantenimiento_final || "Pendiente",
      "Estado": getEstado(mItem),
      "Vida Útil (horas)": mItem.vida_util || 0,
      "Comentarios": mItem.comentario || "Ninguno",
      "Detalles": mItem.detalles || "Ninguno",
    };
  } else {
    return {
      ...baseData,
      "Fecha Programada Final": item.fecha_mantenimiento_final ? new Date(item.fecha_mantenimiento_final).toLocaleDateString('es-ES') : 'N/A',
      "Hora Final": item.hora_mantenimiento_final || 'N/A',
      "Descripción": item.detalles || '-'
    };
  }
});

                  const ws = XLSX.utils.json_to_sheet(datos);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, activeTab === "mantenimientos" ? "Mantenimientos" : "FuturosMantenimientos");
                  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);

                  toast.success("Excel descargado correctamente", { id: "excel-download" });
                } catch (error) {
                  console.error(error);
                  toast.error("Error al generar el Excel", { id: "excel-download" });
                }
              }}
            >
              Sí, descargar
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        id: toastId,
      }
    );
  };

  const exportarPDF = async () => {
    const toastId = "confirmar-pdf";
    toast.dismiss(toastId);
    toast.dismiss("confirmar-excel");

    toast((t) => (
      <div>
        <p>¿Estás seguro que deseas descargar el reporte en formato PDF?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.loading("Generando PDF...", { id: "pdf-download" });

              try {
                let all: any[] = [];
                let fileName = "";
                let title = "";

                if (activeTab === "mantenimientos") {
                  all = await fetchAllMantenimientos();
                  fileName = "ReporteMantenimientos.pdf";
                  title = "Reporte de Mantenimientos";
                } else {
                  all = await fetchAllFuturosMantenimientos();
                  fileName = "ReporteFuturosMantenimientos.pdf";
                  title = "Reporte de Futuros Mantenimientos";
                }

                if (!all.length) {
                  toast.error("No hay datos para exportar", { id: "pdf-download" });
                  return;
                }

                const doc = new jsPDF("landscape"); // Cambiado a horizontal para mejor espacio
                const logo = new Image();
                logo.src = "/images/logo.png";

                await new Promise<void>((resolve, reject) => {
                  logo.onload = () => {
                    try {
                      const fechaHora = new Date();
                      const fechaStr = fechaHora.toLocaleDateString("es-ES");
                      const horaStr = fechaHora.toLocaleTimeString("es-ES", {
                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
                      });

                      const tipoSeleccionado = tiposMantenimiento.find(t => t.id === parseInt(filtroTipo));
                      const estadoSeleccionado = estados.find(e => e.id === parseInt(filtroEstado));

                      const nombreTipo = tipoSeleccionado ? tipoSeleccionado.nombre : "Todos";
                      const nombreEstado = estadoSeleccionado ? estadoSeleccionado.nombre : "Todos";

                      // Definición de columnas con anchos personalizados
                      const columnStyles: any = {
                        0: { cellWidth: 10 },  // ID
                        1: { cellWidth: 50 },  // Equipo
                        2: { cellWidth: 50 },  // N° Serie
                        3: { cellWidth: 25 },  // Tipo
                        4: { cellWidth: 25 },  // Técnico
                        5: { cellWidth: 20 },  // Fecha Inicio
                        6: { cellWidth: 15 },  // Hora Inicio
                        7: { cellWidth: 20 },  // Fecha Final
                        8: { cellWidth: 15 },  // Hora Final
                        9: { cellWidth: 25 },  // Estado o Descripción
                      };

                      if (activeTab === "mantenimientos") {
                        columnStyles[10] = { cellWidth: 15 };  // Vida Útil
                      }

                      const headers = activeTab === "mantenimientos"
                        ? [
                            "ID", 
                            "Equipo", 
                            "N° Serie", 
                            "Tipo", 
                            "Técnico", 
                            "Fecha Inicio", 
                            "Hora Inicio", 
                            "Fecha Final", 
                            "Hora Final", 
                            "Estado", 
                            "Vida Útil"
                          ]
                        : [
                            "ID", 
                            "Equipo", 
                            "N° Serie", 
                            "Tipo", 
                            "Técnico", 
                            "Fecha Prog.", 
                            "Hora Inicio", 
                            "Fecha Prog. Final", 
                            "Hora Final", 
                            "Descripción"
                          ];

                      const body = all.map((item) => {
                        const baseData = [
                          item.id.toString(),
                          getEquipoNombre(item),
                          getNumeroSerie(item),
                          getTipoMantenimiento(item),
                          getTecnicoNombre(item),
                          item.fecha_mantenimiento ? new Date(item.fecha_mantenimiento).toLocaleDateString('es-ES') : 'N/A',
                          item.hora_mantenimiento_inicio || 'N/A',
                        ];

                        if (activeTab === "mantenimientos") {
                          const mItem = item as Mantenimiento;
                          return [
                            ...baseData,
                            mItem.fecha_mantenimiento_final ? new Date(mItem.fecha_mantenimiento_final).toLocaleDateString('es-ES') : 'N/A',
                            mItem.hora_mantenimiento_final || 'N/A',
                            getEstado(mItem),
                            (mItem.vida_util || 0) + " h" // Acortado a "h" para ahorrar espacio
                          ];
                        } else {
                          const fmItem = item as FuturoMantenimiento;
                          return [
                            ...baseData,
                            fmItem.fecha_mantenimiento_final ? new Date(fmItem.fecha_mantenimiento_final).toLocaleDateString('es-ES') : 'N/A',
                            fmItem.hora_mantenimiento_final || 'N/A',
                            fmItem.detalles || '-'
                          ];
                        }
                      });

                      let startY = 45;

                      autoTable(doc, {
                        head: [headers],
                        body: body,
                        startY: startY,
                        styles: { 
                          fontSize: 7, 
                          cellPadding: 2,
                          overflow: 'linebreak',
                          valign: 'middle'
                        },
                        columnStyles: columnStyles,
                        headStyles: { 
                          fillColor: [107, 0, 0], 
                          textColor: 255, 
                          fontStyle: "bold",
                          cellPadding: 3
                        },
                        margin: { top: 10 },
                        didDrawPage: (data) => {
                          if (data.pageNumber === 1) {
                            doc.addImage(logo, "PNG", 15, 15, 45, 11);
                            doc.setFontSize(16).text(title, 60, 18);
                            doc.setFontSize(10)
                              .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                              .text(`Tipo: ${nombreTipo}`, 60, 30);
                            
                            if (activeTab === "mantenimientos") {
                              doc.text(`Estado: ${nombreEstado}`, 60, 35);
                            }
                          }

                          const pageSize = doc.internal.pageSize;
                          const pageHeight = typeof pageSize.getHeight === "function"
                            ? pageSize.getHeight()
                            : pageSize.height;
                          const total = doc.getNumberOfPages();
                          doc.setFontSize(8)
                            .text(`Página ${data.pageNumber} de ${total}`, pageSize.width - 40, pageHeight - 10);
                        },
                        willDrawPage: (data) => {
                          if (data.pageNumber > 1) {
                            data.settings.startY = 20;
                          }
                        }
                      });

                      doc.save(fileName);
                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  };

                  logo.onerror = () => {
                    reject(new Error("No se pudo cargar el logo"));
                  };
                });

                toast.success("PDF descargado correctamente", { id: "pdf-download" });
              } catch (error) {
                console.error(error);
                toast.error("Error al generar el PDF", { id: "pdf-download" });
              }
            }}
          >
            Sí, descargar
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      id: toastId,
    });
  };

  const handleBuscarClick = () => {
    setCurrentPage(1);
    if (activeTab === "mantenimientos") {
      fetchMantenimientos(1, filtroTipo, filtroEstado, filtroFechaInicio, filtroFechaFin, busqueda);
    } else {
      fetchFuturosMantenimientos(1, filtroTipo, filtroFechaInicio, filtroFechaFin, busqueda);
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipo("");
    setFiltroEstado("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
    setBusqueda("");
    setCurrentPage(1);
    if (activeTab === "mantenimientos") {
      fetchMantenimientos(1);
    } else {
      fetchFuturosMantenimientos(1);
    }
  };

  const handleBack = () => {
    navigate("/opcionesReportes");
  };

  const handleTabChange = (tab: "mantenimientos" | "futuros") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <Container className="mt-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem'
          }}
        />
        <h2 className="fw-bold m-0">
          Reporte de {activeTab === "mantenimientos" ? "Mantenimientos" : "Futuros Mantenimientos"}
        </h2>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex mb-3 border-bottom">
            <Button
              variant={activeTab === "mantenimientos" ? "primary" : "outline-secondary"}
              onClick={() => handleTabChange("mantenimientos")}
              className="me-2 rounded-0"
            >
              <FaTools className="me-2" /> Mantenimientos
            </Button>
            <Button
              variant={activeTab === "futuros" ? "primary" : "outline-secondary"}
              onClick={() => handleTabChange("futuros")}
              className="rounded-0"
            >
              <FaCalendarAlt className="me-2" /> Futuros Mantenimientos
            </Button>
          </div>

          <Container className="mt-4">
            <Row className="g-3">
              <Col md={3}>
                <Form.Group controlId="filtroTipo">
                  <Form.Label className="fw-bold">Tipo de Mantenimiento</Form.Label>
                  <Form.Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                    <option value="">Todos los tipos</option>
                    {tiposMantenimiento.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {activeTab === "mantenimientos" && (
                <Col md={3}>
                  <Form.Group controlId="filtroEstado">
                    <Form.Label className="fw-bold">Estado</Form.Label>
                    <Form.Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                      <option value="">Todos los estados</option>
                      {estados.map((estado) => (
                        <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={3}>
                <Form.Group controlId="filtroFechaInicio">
                  <Form.Label className="fw-bold">Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={filtroFechaInicio}
                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="filtroFechaFin">
                  <Form.Label className="fw-bold">Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={filtroFechaFin}
                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                    min={filtroFechaInicio}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="busqueda">
                  <Form.Label className="fw-bold">Buscar</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Equipo, técnico, detalles, etc."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscarClick()}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col className="d-flex justify-content-end gap-2">
                <Button
                  variant="primary"
                  onClick={handleBuscarClick}
                  disabled={loading}
                  style={{ minWidth: '120px' }}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Buscar
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-2" /> Buscar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={limpiarFiltros}
                  disabled={loading}
                  style={{ minWidth: '120px' }}
                >
                  <FaEraser className="me-2" /> Limpiar
                </Button>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              Resultados de la búsqueda
            </h5>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={exportarExcel}
                disabled={loading || (activeTab === "mantenimientos" ? mantenimientos.length === 0 : futurosMantenimientos.length === 0)}
                className="d-flex align-items-center gap-2"
              >
                <FaFileExcel /> Excel
              </Button>
              <Button
                variant="danger"
                onClick={exportarPDF}
                disabled={loading || (activeTab === "mantenimientos" ? mantenimientos.length === 0 : futurosMantenimientos.length === 0)}
                className="d-flex align-items-center gap-2"
              >
                <FaFilePdf /> PDF
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-dark">
                {activeTab === "mantenimientos" ? (
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>N° Serie</th>
                    <th>Tipo</th>
                    <th>Técnico</th>
                    <th>Fecha Inicio</th>
                    <th>Hora Inicio</th>
                    <th>Fecha Final</th>
                    <th>Hora Final</th>
                    <th>Estado</th>
                    <th>Vida Útil</th>
                  </tr>
                ) : (
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>N° Serie</th>
                    <th>Tipo</th>
                    <th>Técnico</th>
                    <th>Fecha Programada Inicial</th>
                    <th>Hora Inicio</th>
                    <th>Fecha Programada Final</th>
                    <th>Hora Final</th>
                    <th>Descripción</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td 
                      colSpan={activeTab === "mantenimientos" ? 11 : 7} 
                      className="text-center py-4"
                    >
                      <Spinner animation="border" variant="primary" />
                    </td>
                  </tr>
                ) : activeTab === "mantenimientos" ? (
                  mantenimientos.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-4">
                        No hay resultados para mostrar. Realiza una búsqueda para ver los datos.
                      </td>
                    </tr>
                  ) : (
                    mantenimientos.map((m, i) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{getEquipoNombre(m)}</td>
                        <td>{getNumeroSerie(m)}</td>
                        <td>{getTipoMantenimiento(m)}</td>
                        <td>{getTecnicoNombre(m)}</td>
                        <td>{formatDate(m.fecha_mantenimiento) || 'N/A'}</td>
                        <td>{formatTo12h(m.hora_mantenimiento_inicio) || 'N/A'}</td>
                        <td>{formatDate(m.fecha_mantenimiento_final) || 'N/A'}</td>
                        <td>{formatTo12h(m.hora_mantenimiento_final) || 'N/A'}</td>
                        <td>
                          <Badge bg={getEstadoBadge(getEstado(m))}>
                            {getEstado(m)}
                          </Badge>
                        </td>
                        <td>{m.vida_util || 0} horas</td>
                      </tr>
                    ))
                  )
                ) : futurosMantenimientos.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4">
                      No hay resultados para mostrar. Realiza una búsqueda para ver los datos.
                    </td>
                  </tr>
                ) : (
                  futurosMantenimientos.map((fm, i) => (
                    <tr key={fm.id}>
                      <td>{fm.id}</td>
                      <td>{getEquipoNombre(fm)}</td>
                      <td>{getNumeroSerie(fm)}</td>
                      <td>{getTipoMantenimiento(fm)}</td>
                      <td>{getTecnicoNombre(fm)}</td>
                      <td>{formatDate(fm.fecha_mantenimiento) || 'N/A'}</td>
                      <td>{formatTo12h(fm.hora_mantenimiento_inicio) || 'N/A'}</td>
                      <td>{formatDate(fm.fecha_mantenimiento_final) || 'N/A'}</td>
                      <td>{formatTo12h(fm.hora_mantenimiento_final) || 'N/A'}</td>
                      <td>{fm.detalles || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {(activeTab === "mantenimientos" ? mantenimientos.length > 0 : futurosMantenimientos.length > 0) && (
            <div className="mt-3">
              <PaginationComponent
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  if (activeTab === "mantenimientos") {
                    fetchMantenimientos(p, filtroTipo, filtroEstado, filtroFechaInicio, filtroFechaFin, busqueda);
                  } else {
                    fetchFuturosMantenimientos(p, filtroTipo, filtroFechaInicio, filtroFechaFin, busqueda);
                  }
                }}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReporteMantenimiento;