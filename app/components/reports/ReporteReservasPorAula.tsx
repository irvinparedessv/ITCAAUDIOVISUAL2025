import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Table, Button, Form, Spinner, Card, Container, Row, Col } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import PaginationComponent from "~/utils/Pagination";
import { FaLongArrowAltLeft, FaFileExcel, FaFilePdf, FaSearch, FaEraser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { formatTimeRangeTo12h } from "~/utils/time";
import { useAuth } from "../../hooks/AuthContext"; // Asegúrate de importar useAuth
import { Role } from "~/types/roles";

interface ReservaAulaReporte {
  id: number;
  usuario: string;
  aula: string;
  fecha: string;
  horario: string;
  estado: string;
}

interface Aula {
  id: number;
  name: string;
}

const ReporteReservasPorAula = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState("");
  const [aulaId, setAulaId] = useState<number | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [reservas, setReservas] = useState<ReservaAulaReporte[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth(); // Obtén el usuario del contexto de autenticación

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);

  useEffect(() => {
    const fetchAulas = async () => {
      try {
        const res = await api.get("/aulas");
        setAulas(res.data);
      } catch (error) {
        console.error("Error cargando aulas", error);
        toast.error("Error cargando aulas", { id: "error-cargar-aulas" });
      }
    };

    fetchAulas();
  }, []);

  const fetchReservas = async (page = 1) => {
    const ERROR_FILTROS_ID = "error-filtros";
    const ERROR_REPORTE_ID = "error-obtener-reporte";

    if (!fechaInicio || !fechaFin || !aulaId) {
      toast.error("Selecciona aula y ambas fechas", { id: ERROR_FILTROS_ID });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/reportes/reservas-por-aula", {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          estado: estado || undefined,
          aula_id: aulaId,
          per_page: perPage,
          page,
        },
      });

      setReservas(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener el reporte", { id: ERROR_REPORTE_ID });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReservas = async (): Promise<ReservaAulaReporte[]> => {
    const allReservas: ReservaAulaReporte[] = [];
    let currentPage = 1;
    let totalPages = 1;
    const ERROR_CARGAR_REGISTROS_ID = "error-cargar-registros";

    try {
      do {
        const res = await api.get("/reportes/reservas-por-aula", {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: estado || undefined,
            aula_id: aulaId,
            per_page: 100,
            page: currentPage,
          },
        });

        allReservas.push(...res.data.data);
        totalPages = res.data.last_page;
        currentPage++;
      } while (currentPage <= totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar todos los registros", { id: ERROR_CARGAR_REGISTROS_ID });
    }

    return allReservas;
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
                  const all = await fetchAllReservas();
                  if (!all.length) {
                    toast.error("No hay datos para exportar", { id: "excel-download" });
                    return;
                  }

                  const datos = all.map((r) => ({
                    ID: r.id,
                    Usuario: r.usuario,
                    Aula: r.aula,
                    Fecha: r.fecha,
                    Horario: r.horario,
                    Estado: r.estado,
                  }));

                  const ws = XLSX.utils.json_to_sheet(datos);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Uso de Aulas por Aula");
                  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteReservasPorAula.xlsx");

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
                const all = await fetchAllReservas();
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

                      const aulaNombre = aulas.find((a) => a.id === aulaId)?.name || "";

                      const body = all.map((r) => [
                        r.id,
                        r.usuario,
                        r.aula,
                        r.fecha,
                        formatTimeRangeTo12h(r.horario),
                        r.estado,
                      ]);

                      let startY = 45;

                      autoTable(doc, {
                        head: [["#", "Usuario", "Aula", "Fecha", "Horario", "Estado"]],
                        body,
                        startY: startY,
                        styles: { fontSize: 8, cellPadding: 3 },
                        headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                        margin: { top: 10 },
                        didDrawPage: (data) => {
                          if (data.pageNumber === 1) {
                            doc.addImage(logo, "PNG", 15, 15, 45, 11);
                            doc.setFontSize(16).text("Reporte de Uso de Aulas por Aula", 60, 18);
                            doc.setFontSize(10)
                              .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                              .text(`Aula: ${aulaNombre}`, 60, 30)
                              .text(`Estado: ${estado || "Todos"}`, 60, 35)
                              .text(`Rango: ${fechaInicio || "N/A"} a ${fechaFin || "N/A"}`, 60, 40);
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

                      doc.save("ReporteReservasPorAula.pdf");
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
    fetchReservas(1);
  };

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setEstado("");
    setAulaId(null);
    setReservas([]);
  };

  const handleBack = () => {
    if (user?.role === Role.EspacioEncargado) {
      navigate("/");
    } else {
      navigate("/opcionesReportes");
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      "Pendiente": "warning",
      "Aprobado": "success",
      "Rechazado": "danger",
      "Cancelado": "secondary",
      "Devuelto": "info"
    };
    return estados[estado as keyof typeof estados] || "light";
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
          Reporte de uso de aulas
        </h2>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group controlId="aulaId">
                <Form.Label className="fw-bold">Aula</Form.Label>
                <label className="form-label d-flex align-items-center">
                  Seleccionar Aula <span className="text-danger">*</span>
                </label>
                <Select
                  options={aulas.map((a) => ({
                    value: a.id.toString(),
                    label: a.name,
                  }))}
                  value={
                    aulaId
                      ? {
                        value: aulaId.toString(),
                        label: aulas.find((a) => a.id === aulaId)?.name || "",
                      }
                      : null
                  }
                  onChange={(selected) => setAulaId(selected ? parseInt(selected.value) : null)}
                  placeholder="Selecciona un aula"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  isDisabled={false}
                  menuPortalTarget={document.body}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px',
                      height: '48px',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      height: '48px',
                      padding: '0 8px',
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: '0px',
                    }),
                  }}
                />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group controlId="estado">
                <Form.Label className="fw-bold">Estado</Form.Label>
                <Form.Select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="">Todos</option>
                  {["Pendiente", "Aprobado", "Rechazado", "Cancelado", "Devuelto"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group controlId="fechaInicio">
                <Form.Label className="fw-bold">Desde <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  max={fechaFin || undefined}
                />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group controlId="fechaFin">
                <Form.Label className="fw-bold">Hasta <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio || undefined}
                />
              </Form.Group>
            </Col>

            <Col md={3} className="mt-3">
              <div className="d-flex flex-wrap gap-2 justify-content-end">
                <Button
                  variant="primary"
                  onClick={handleBuscarClick}
                  disabled={loading}
                  className="d-flex align-items-center justify-content-center gap-2"
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
                  className="d-flex align-items-center justify-content-center gap-2"
                  style={{ height: '48px' }}
                >
                  <FaEraser /> Limpiar
                </Button>
              </div>
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
                disabled={loading || reservas.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaFileExcel /> Excel
              </Button>
              <Button
                variant="danger"
                onClick={exportarPDF}
                disabled={loading || reservas.length === 0}
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
                  <th>Usuario</th>
                  <th>Aula</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      {loading ? (
                        <Spinner animation="border" variant="primary" />
                      ) : (
                        "No hay resultados para mostrar. Realiza una búsqueda para ver los datos."
                      )}
                    </td>
                  </tr>
                ) : (
                  reservas.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.usuario}</td>
                      <td>{r.aula}</td>
                      <td>{r.fecha}</td>
                      <td>{formatTimeRangeTo12h(r.horario)}</td>
                      <td>
                        <span className={`badge bg-${getEstadoBadge(r.estado)}`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {reservas.length > 0 && (
            <div className="mt-3">
              <PaginationComponent
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  fetchReservas(p);
                }}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReporteReservasPorAula;