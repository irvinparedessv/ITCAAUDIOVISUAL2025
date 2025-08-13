import React, { useEffect, useState } from "react";
import { Table, Button, Form, Spinner, Card, Container, Row, Col } from "react-bootstrap";
import api from "../../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PaginationComponent from "~/utils/Pagination";
import { useNavigate } from "react-router-dom";
import { FaLongArrowAltLeft, FaFileExcel, FaFilePdf, FaSearch, FaEraser } from "react-icons/fa";
import { getEstados } from "~/services/itemService";

interface Caracteristica {
  nombre: string;
  valor: string;
}

interface Estado {
  id: number;
  nombre: string;
}

interface Equipo {
  id: number;
  numero_serie: string;
  comentario: string;
  created_at: string;
  estado_id: number;
  estado_nombre: string;
  tipo_equipo_id: number;
  tipo_nombre: string;
  categoria_nombre: string;
  modelo_id: number;
  modelo_nombre: string;
  marca_nombre: string;
  caracteristicas: Caracteristica[];
}

interface TipoEquipo {
  id: number;
  nombre: string;
}

const ReporteInventarioEquipos = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);
  const [estados, setEstados] = useState<Estado[]>([]);

  const fetchEquipos = async (
    page = 1,
    tipo_id = filtroTipo,
    estado = filtroEstado,
    search = busqueda
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (tipo_id) params.tipo_id = tipo_id;
      if (estado !== "") params.estado = estado;
      if (search) params.busqueda = search;

      const res = await api.get("/reportes/inventario-equipos", { params });

      setEquipos(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.last_page);
    } catch {
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const fetchTipos = async () => {
    try {
      const res = await api.get("/tipoEquipos");
      setTipos(res.data);
    } catch {
      toast.error("Error al cargar los tipos de equipo");
    }
  };

  const fetchEstados = async () => {
    try {
      const estadosData = await getEstados();
      setEstados(estadosData);
    } catch {
      toast.error("Error al cargar los estados");
    }
  };

  useEffect(() => {
    fetchTipos();
    fetchEstados();
    fetchEquipos(1);
  }, []);

  const fetchAllEquipos = async (): Promise<Equipo[]> => {
    const allEquipos: Equipo[] = [];
    let currentPage = 1;
    let totalPages = 1;
    const ERROR_CARGAR_REGISTROS_ID = "error-cargar-registros";

    try {
      do {
        const res = await api.get("/reportes/inventario-equipos", {
          params: {
            tipo_id: filtroTipo || undefined,
            estado: filtroEstado || undefined,
            busqueda: busqueda || undefined,
            per_page: 100,
            page: currentPage,
          },
        });

        allEquipos.push(...res.data.data);
        totalPages = res.data.last_page;
        currentPage++;
      } while (currentPage <= totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar todos los registros", { id: ERROR_CARGAR_REGISTROS_ID });
    }

    return allEquipos;
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
                  const all = await fetchAllEquipos();
                  if (!all.length) {
                    toast.error("No hay datos para exportar", { id: "excel-download" });
                    return;
                  }

                  const datos = all.map((e) => ({
                    "N° Serie": e.numero_serie,
                    "Tipo de Equipo": e.tipo_nombre,
                    "Categoría": e.categoria_nombre,
                    "Modelo": e.modelo_nombre,
                    "Marca": e.marca_nombre,
                    "Estado": e.estado_nombre,
                    "Comentario": e.comentario,
                    "Características": e.caracteristicas.map(c => `${c.nombre}: ${c.valor}`).join(', '),
                    "Fecha Registro": new Date(e.created_at).toLocaleDateString('es-ES')
                  }));

                  const ws = XLSX.utils.json_to_sheet(datos);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "InventarioEquipos");
                  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteInventarioEquipos.xlsx");

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
                const all = await fetchAllEquipos();
                if (!all.length) {
                  toast.error("No hay datos para exportar", { id: "pdf-download" });
                  return;
                }

                // Configuración del documento en orientación horizontal (landscape)
                const doc = new jsPDF('landscape');
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

                      // Obtener nombres para los filtros aplicados
                      const tipoSeleccionado = tipos.find(t => t.id === parseInt(filtroTipo));
                      const estadoSeleccionado = estados.find(e => e.id === parseInt(filtroEstado));

                      const nombreTipo = tipoSeleccionado ? tipoSeleccionado.nombre : "Todos";
                      const nombreEstado = estadoSeleccionado ? estadoSeleccionado.nombre : "Todos";

                      // Definición de anchos de columna personalizados
                      const columnStyles = {
                        0: { cellWidth: 8 },   // #
                        1: { cellWidth: 45 },  // N° Serie
                        2: { cellWidth: 25 },  // Tipo
                        3: { cellWidth: 20 },  // Categoría
                        4: { cellWidth: 45 },  // Modelo
                        5: { cellWidth: 25 },  // Marca
                        6: { cellWidth: 20 },  // Estado
                        7: { cellWidth: 50 },  // Características (más ancho)
                        8: { cellWidth: 20 }   // Fecha Registro
                      };

                      const body = all.map((e, i) => [
                        (i + 1).toString(),
                        e.numero_serie,
                        e.tipo_nombre,
                        e.categoria_nombre,
                        e.modelo_nombre,
                        e.marca_nombre,
                        e.estado_nombre,
                        e.caracteristicas.map(c => `${c.nombre}: ${c.valor}`).join('\n'),
                        new Date(e.created_at).toLocaleDateString('es-ES')
                      ]);

                      let startY = 45;

                      autoTable(doc, {
                        head: [["#", "N° Serie", "Tipo", "Categoría", "Modelo", "Marca", "Estado", "Características", "Fecha Registro"]],
                        body,
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
                            doc.setFontSize(16).text("Reporte de Inventario de Equipos", 60, 18);
                            doc.setFontSize(10)
                              .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                              .text(`Tipo: ${nombreTipo}`, 60, 30)
                              .text(`Estado: ${nombreEstado}`, 60, 35);
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

                      doc.save("ReporteInventarioEquipos.pdf");
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
    fetchEquipos(1, filtroTipo, filtroEstado, busqueda);
  };

  const limpiarFiltros = () => {
    setFiltroTipo("");
    setFiltroEstado("");
    setBusqueda("");
    setCurrentPage(1);
    fetchEquipos(1, "", "");
  };

  const handleBack = () => {
    navigate("/opcionesReportes");
  };

  const getEstadoBadge = (estadoId: number) => {
    switch (estadoId) {
      case 1: return "success";
      case 2: return "warning";
      case 4: return "danger";
      default: return "secondary";
    }
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
          Reporte de inventario de equipos
        </h2>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Container className="mt-4">
            {/* Fila de filtros */}
            <Row className="g-3">
              <Col md={3}>
                <Form.Group controlId="filtroTipo">
                  <Form.Label className="fw-bold">Tipo de Equipo</Form.Label>
                  <Form.Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                    <option value="">Todos los tipos</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

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

              <Col md={6}>
                <Form.Group controlId="busqueda">
                  <Form.Label className="fw-bold">Buscar</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="N° serie, modelo, marca, etc."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscarClick()}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Fila exclusiva para botones alineados a la derecha */}
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
                disabled={loading || equipos.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaFileExcel /> Excel
              </Button>
              <Button
                variant="danger"
                onClick={exportarPDF}
                disabled={loading || equipos.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaFilePdf /> PDF
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>N° Serie</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th>Estado</th>
                  <th>Características</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {equipos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      {loading ? (
                        <Spinner animation="border" variant="primary" />
                      ) : (
                        "No hay resultados para mostrar. Realiza una búsqueda para ver los datos."
                      )}
                    </td>
                  </tr>
                ) : (
                  equipos.map((e, i) => (
                    <tr key={e.id}>
                      <td>{e.id}</td>
                      <td>{e.numero_serie}</td>
                      <td>{e.tipo_nombre}</td>
                      <td>{e.categoria_nombre}</td>
                      <td>{e.modelo_nombre}</td>
                      <td>{e.marca_nombre}</td>
                      <td>
                        <span className={`badge bg-${getEstadoBadge(e.estado_id)}`}>
                          {e.estado_nombre}
                        </span>
                      </td>
                      <td>
                        <ul className="list-unstyled mb-0">
                          {e.caracteristicas.map((c, idx) => (
                            <li key={idx}><small>{c.nombre}: {c.valor}</small></li>
                          ))}
                        </ul>
                      </td>
                      <td>{new Date(e.created_at).toLocaleDateString('es-ES')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {equipos.length > 0 && (
            <div className="mt-3">
              <PaginationComponent
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  fetchEquipos(p, filtroTipo, filtroEstado);
                }}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReporteInventarioEquipos;