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
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);

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

                      const body = all.map((e, i) => [
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
                        startY: startY,
                        styles: { fontSize: 8, cellPadding: 3 },
                        headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                        margin: { top: 10 },
                        didDrawPage: (data) => {
                          if (data.pageNumber === 1) {
                            doc.addImage(logo, "PNG", 15, 15, 45, 11);
                            doc.setFontSize(16).text("Reporte de Inventario de Equipos", 60, 18);
                            doc.setFontSize(10)
                              .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                              .text(`Tipo: ${filtroTipo || "Todos"}`, 60, 30)
                              .text(`Estado: ${filtroEstado ? (filtroEstado === "1" ? "Disponible" : "No disponible") : "Todos"}`, 60, 35);
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
    ), {
      duration: 5000,
      id: toastId,
    });
  };

  const handleBuscarClick = () => {
    setCurrentPage(1);
    fetchEquipos(1);
  };

  const limpiarFiltros = () => {
    setFiltroTipo("");
    setFiltroEstado("");
    setEquipos([]);
  };

  const handleBack = () => {
    navigate("/opcionesReportes");
  };

  const getEstadoBadge = (estado: number) => {
    return estado === 1 ? "success" : "danger";
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
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group controlId="filtroTipo">
                <Form.Label className="fw-bold">Tipo de Equipo</Form.Label>
                <Form.Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="filtroEstado">
                <Form.Label className="fw-bold">Estado</Form.Label>
                <Form.Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="1">Disponible</option>
                  <option value="0">No disponible</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={5} className="d-flex align-items-end gap-2">
              <Button
                variant="primary"
                onClick={handleBuscarClick}
                disabled={loading}
                className="d-flex align-items-center justify-content-center gap-2 flex-grow-1"
                style={{ height: '48px' }}
              >
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  <>
                    <FaSearch /> Buscar
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={limpiarFiltros}
                disabled={loading}
                className="d-flex align-items-center justify-content-center gap-2 flex-grow-1"
                style={{ height: '48px' }}
              >
                <FaEraser /> Limpiar
              </Button>
            </Col>
          </Row>
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
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {equipos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
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
                      <td>{i + 1}</td>
                      <td>{e.nombre}</td>
                      <td>{e.tipo_nombre}</td>
                      <td>{e.cantidad}</td>
                      <td>
                        <span className={`badge bg-${getEstadoBadge(e.estado)}`}>
                          {e.estado === 1 ? "Disponible" : "No disponible"}
                        </span>
                      </td>
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
                  fetchEquipos(p);
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