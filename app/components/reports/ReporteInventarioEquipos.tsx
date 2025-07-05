import React, { useEffect, useState } from "react";
import { Table, Button, Form, Spinner } from "react-bootstrap";
import api from "../../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PaginationComponent from "~/utils/Pagination";
import { useNavigate } from "react-router-dom";
import { FaLongArrowAltLeft } from "react-icons/fa";

interface Equipo {
  id: number;
  nombre: string;
  tipo_nombre: string;
  cantidad: number;
  estado: number;
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20); // puedes hacer esto configurable

  const fetchEquipos = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (filtroTipo) params.tipo_id = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;

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

  useEffect(() => {
    fetchTipos();
    fetchEquipos(1);
  }, []);

  const limpiarFiltros = () => {
    setFiltroTipo("");
    setFiltroEstado("");
    setEquipos([]);
    setCurrentPage(1);
  };

  const exportarExcel = async () => {
    toast((t) => (
      <div>
        <p>¿Deseas descargar todos los equipos en formato Excel?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.loading("Generando Excel...", { id: "excel" });

              try {
                const allData: Equipo[] = [];
                let page = 1;
                let last = 1;

                do {
                  const res = await api.get("/reportes/inventario-equipos", {
                    params: {
                      page,
                      per_page: 100,
                      tipo_id: filtroTipo || undefined,
                      estado: filtroEstado || undefined,
                    },
                  });

                  allData.push(...res.data.data);
                  last = res.data.last_page;
                  page++;
                } while (page <= last);

                if (!allData.length) {
                  toast.error("No hay datos para exportar", { id: "excel" });
                  return;
                }

                const datos = allData.map((e) => ({
                  Nombre: e.nombre,
                  "Tipo de Equipo": e.tipo_nombre,
                  Cantidad: e.cantidad,
                  Estado: e.estado === 1 ? "Disponible" : "No disponible",
                }));

                const ws = XLSX.utils.json_to_sheet(datos);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "InventarioEquipos");
                const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteInventarioEquipos.xlsx");

                toast.success("Excel generado correctamente", { id: "excel" });
              } catch {
                toast.error("Error al generar Excel", { id: "excel" });
              }
            }}
          >
            Sí, descargar
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const handleBack = () => {
    navigate(-1); // Redirige a la ruta de inicio
  };

  const exportarPDF = async () => {
    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el reporte en formato PDF?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={async () => {
                toast.dismiss(t.id);
                toast.loading("Generando PDF...", { id: "pdf-download" });

                try {
                  // Traer todos los datos sin paginación
                  const res = await api.get("/reportes/inventario-equipos", {
                    params: {
                      tipo_id: filtroTipo || undefined,
                      estado: filtroEstado || undefined,
                      per_page: 1000,
                    },
                  });

                  const allEquipos = res.data.data || res.data; // si no hay paginación

                  if (!allEquipos.length) {
                    toast.error("No hay datos para exportar", { id: "pdf-download" });
                    return;
                  }

                  const doc = new jsPDF();
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

                        const body = allEquipos.map((e: any, i: number) => [
                          i + 1,
                          e.nombre,
                          e.tipo_nombre,
                          e.cantidad,
                          e.estado === 1 ? "Disponible" : "No disponible",
                        ]);

                        let startY = 45;

                        autoTable(doc, {
                          head: [["#", "Nombre", "Tipo", "Cantidad", "Estado"]],
                          body,
                          startY,
                          styles: { fontSize: 8, cellPadding: 3 },
                          headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                          margin: { top: 10 },
                          didDrawPage: (data) => {
                            if (data.pageNumber === 1) {
                              doc.addImage(logo, "PNG", 15, 15, 40, 11);
                              doc.setFontSize(16).text("Reporte de Inventario de Equipos", 60, 18);
                              doc.setFontSize(10)
                                .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                                .text(`Tipo: ${filtroTipo || "Todos"} | Estado: ${filtroEstado || "Todos"}`, 60, 30);
                            }

                            if (data.pageNumber > 1) {
                              startY = 20;
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
      ),
      { duration: 10000 }
    );
  };


  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
            marginTop: '2px' // Ajuste fino para alinear visualmente el icono con el texto
          }}
        />
        <h3 className="mb-0">Reporte de inventario de equipos</h3>
      </div>

      <div className="row g-3 align-items-end mb-4">
        {/* Filtro Tipo de Equipo */}
        <div className="col-md-4">
          <Form.Group controlId="filtroTipo">
            <Form.Label>Tipo de Equipo</Form.Label>
            <Form.Select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              disabled={loading}
              size="sm"
            >
              <option value="">Todos los tipos</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        {/* Filtro Estado */}
        <div className="col-md-3">
          <Form.Group controlId="filtroEstado">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              disabled={loading}
              size="sm"
            >
              <option value="">Todos los estados</option>
              <option value="1">Disponible</option>
              <option value="0">No disponible</option>
            </Form.Select>
          </Form.Group>
        </div>

        {/* Botones de Acción */}
        <div className="col-md-5 d-flex align-items-end gap-2">
          <Button
            variant="primary"
            onClick={() => fetchEquipos(1)}
            disabled={loading}
            size="sm"
            className="flex-grow-1"
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Filtrando...
              </>
            ) : (
              <>
                <i className="bi bi-funnel-fill me-2"></i> Aplicar Filtros
              </>
            )}
          </Button>
          <Button variant="outline-secondary" onClick={limpiarFiltros} disabled={loading}>
            Limpiar
          </Button>



          <div className="col-md-2 d-flex gap-2 ms-auto">
            <Button variant="success" onClick={exportarExcel} disabled={loading}>
              Exportar Excel
            </Button>
            <Button variant="danger" onClick={exportarPDF} disabled={loading}>
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {equipos.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center">
                No hay datos
              </td>
            </tr>
          ) : (
            equipos.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td>{e.nombre}</td>
                <td>{e.tipo_nombre}</td>
                <td>{e.cantidad}</td>
                <td>{e.estado === 1 ? "Disponible" : "No disponible"}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {equipos.length > 0 && (
        <PaginationComponent
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => {
            setCurrentPage(p);
            fetchEquipos(p);
          }}
        />
      )}
    </div>
  );
};

export default ReporteInventarioEquipos;
