import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button, Card, Container, Form, Row, Col, Spinner, Table } from "react-bootstrap";
import { FaLongArrowAltLeft, FaFileExcel, FaFilePdf, FaSearch, FaEraser, FaChartBar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PaginationComponent from "~/utils/Pagination";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from "~/hooks/ThemeContext";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

interface EquipoUsoReporte {
  equipo: string;
  tipo_equipo: string;
  total_cantidad: number;
}

const ReporteUsoEquipos = () => {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipoEquipo, setTipoEquipo] = useState("");
  const [equipos, setEquipos] = useState<EquipoUsoReporte[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const chartRef = useRef<any>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchTiposEquipo = async () => {
      try {
        const res = await api.get("/tipoEquipos");
        setTiposEquipo(res.data.map((t: any) => t.nombre));
      } catch (err) {
        console.error(err);
        toast.error("Error cargando tipos de equipo", { id: "error-tipos-equipo" });
      }
    };

    fetchTiposEquipo();
  }, []);

  const fetchEquipos = async (page = 1) => {
    const ERROR_FILTROS_ID = "error-filtros";
    const ERROR_REPORTE_ID = "error-obtener-reporte";

    if (!desde || !hasta) {
      toast.error("Selecciona ambas fechas", { id: ERROR_FILTROS_ID });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/reportes/uso-equipos", {
        params: {
          from: desde,
          to: hasta,
          tipo_equipo: tipoEquipo || undefined,
          per_page: perPage,
          page,
        },
      });

      setEquipos(res.data.data || res.data);
      setCurrentPage(page);
      setTotalPages(res.data.last_page || 1);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener datos", { id: ERROR_REPORTE_ID });
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarClick = () => {
    setCurrentPage(1);
    fetchEquipos(1);
  };

  const limpiarFiltros = () => {
    setDesde("");
    setHasta("");
    setTipoEquipo("");
    setEquipos([]);
    setCurrentPage(1);
  };

  const exportarExcel = () => {
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
                  const params: any = { from: desde, to: hasta };
                  if (tipoEquipo) params.tipo_equipo = tipoEquipo;

                  const res = await api.get("/reportes/uso-equipos", { params });
                  const all = res.data.data || res.data;

                  if (!all.length) {
                    toast.error("No hay datos para exportar", { id: "excel-download" });
                    return;
                  }

                  const datos = all.map((r: EquipoUsoReporte, i: number) => ({
                    "#": i + 1,
                    "Equipo": r.equipo,
                    "Tipo de Equipo": r.tipo_equipo,
                    "Cantidad Total Reservada": r.total_cantidad,
                  }));

                  const ws = XLSX.utils.json_to_sheet(datos);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "UsoEquipos");
                  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteUsoEquipos.xlsx");

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

  const exportarPDF = () => {
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
                const params: any = { from: desde, to: hasta };
                if (tipoEquipo) params.tipo_equipo = tipoEquipo;

                const res = await api.get("/reportes/uso-equipos", { params });
                const all = res.data.data || res.data;

                if (!all.length) {
                  toast.error("No hay datos para exportar", { id: "pdf-download" });
                  return;
                }

                const doc = new jsPDF();
                const logo = new Image();
                logo.src = "/images/logo.png";

                const fechaHora = new Date();
                const fechaStr = fechaHora.toLocaleDateString("es-ES");
                const horaStr = fechaHora.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                });

                const head = [["#", "Equipo", "Tipo de Equipo", "Cantidad Total Reservada"]];

                const body = all.map((r: EquipoUsoReporte, i: number) => [
                  i + 1,
                  r.equipo,
                  r.tipo_equipo,
                  r.total_cantidad,
                ]);

                doc.addImage(logo, "PNG", 15, 15, 45, 11);
                doc.setFontSize(16).text("Reporte de Uso de Equipos", 60, 18);
                doc.setFontSize(10)
                  .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                  .text(`Rango: ${desde} a ${hasta}`, 60, 30)
                  .text(`Tipo Equipo: ${tipoEquipo || "Todos"}`, 60, 35);

                autoTable(doc, {
                  head,
                  body,
                  startY: 45,
                  styles: { fontSize: 8, cellPadding: 3 },
                  headStyles: {
                    fillColor: [107, 0, 0],
                    textColor: 255,
                    fontStyle: "bold",
                  },
                  margin: { top: 10 },
                  didDrawPage: (data) => {
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = typeof pageSize.getHeight === "function"
                      ? pageSize.getHeight()
                      : pageSize.height;
                    doc.setFontSize(8)
                      .text(`Página ${data.pageNumber} de ${doc.getNumberOfPages()}`,
                        pageSize.width - 40, pageHeight - 10);
                  }
                });

                doc.save("ReporteUsoEquipos.pdf");
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

  const downloadChart = () => {
    if (!chartRef.current) return;

    const toastId = "download-chart";
    toast.dismiss(toastId);

    toast((t) => (
      <div>
        <p>¿Deseas descargar el gráfico como imagen?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              toast.dismiss(t.id);
              const chart = chartRef.current;

              if (chart) {
                const canvas = chart.canvas;
                const ctx = canvas.getContext("2d");

                // Usar darkMode desde el contexto
                const bgColor = darkMode ? '#1e1e1e' : '#ffffff';

                // Guardar imagen actual del canvas
                const original = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Dibujar fondo adecuado
                ctx.save();
                ctx.globalCompositeOperation = "destination-over";
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();

                // Descargar imagen
                const imageLink = document.createElement('a');
                imageLink.download = 'GraficoUsoEquipos.png';
                imageLink.href = chart.toBase64Image();
                imageLink.click();

                // Restaurar canvas
                ctx.putImageData(original, 0, 0);

                toast.success("Gráfico descargado correctamente", { id: toastId });
              }
            }}
          >
            Descargar
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

  const handleBack = () => {
    navigate(-1);
  };

  // Configuración del gráfico
  const chartData = {
    labels: equipos.map(item => item.equipo),
    datasets: [
      {
        label: 'Cantidad Total Reservada',
        data: equipos.map(item => item.total_cantidad),
        backgroundColor: '#6b0000',
        borderColor: '#4a0000',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#fff' : '#333',
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: `Uso de equipos${tipoEquipo ? ` - Tipo: ${tipoEquipo}` : ''}`,
        color: darkMode ? '#fff' : '#333',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: darkMode ? '#333' : '#fff',
        titleColor: darkMode ? '#fff' : '#333',
        bodyColor: darkMode ? '#fff' : '#333',
        borderColor: '#6b0000',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context: any) {
            return `Cantidad: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? '#fff' : '#333'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? '#fff' : '#333',
          precision: 0
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
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
          Reporte de uso de equipos
        </h2>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={2}>
              <Form.Group controlId="desde">
                <Form.Label className="fw-bold">Desde <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  max={hasta || undefined}
                />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group controlId="hasta">
                <Form.Label className="fw-bold">Hasta <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  min={desde || undefined}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="tipoEquipo">
                <Form.Label className="fw-bold">Tipo de equipo</Form.Label>
                <Form.Select
                  value={tipoEquipo}
                  onChange={(e) => setTipoEquipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  {tiposEquipo.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3} className="mt-3">
              <div className="d-flex flex-wrap justify-content-end gap-2">
                <div className="flex-grow-1 flex-sm-grow-0" style={{ minWidth: '120px' }}>
                  <Button
                    variant="primary"
                    onClick={handleBuscarClick}
                    disabled={loading}
                    className="d-flex align-items-center justify-content-center gap-2 w-100"
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
                </div>
                <div className="flex-grow-1 flex-sm-grow-0" style={{ minWidth: '120px' }}>
                  <Button
                    variant="outline-secondary"
                    onClick={limpiarFiltros}
                    disabled={loading}
                    className="d-flex align-items-center justify-content-center gap-2 w-100"
                    style={{ height: '48px' }}
                  >
                    <FaEraser /> Limpiar
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <h5 className="mb-3 mb-md-0">
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
              <Button
                variant="warning"
                onClick={downloadChart}
                disabled={loading || equipos.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaChartBar /> Gráfico
              </Button>
            </div>
          </div>

          {equipos.length > 0 && (
            <div style={{ width: "100%", height: "400px", marginBottom: "30px" }}>
              <Bar
                ref={chartRef}
                data={chartData}
                options={chartOptions}
              />
            </div>
          )}

          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>Tipo de Equipo</th>
                  <th>Cantidad Total Reservada</th>
                </tr>
              </thead>
              <tbody>
                {equipos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      {loading ? (
                        <Spinner animation="border" variant="primary" />
                      ) : (
                        "No hay resultados para mostrar. Realiza una búsqueda para ver los datos."
                      )}
                    </td>
                  </tr>
                ) : (
                  equipos.map((e, i) => (
                    <tr key={i}>
                      <td>{(currentPage - 1) * perPage + i + 1}</td>
                      <td>{e.equipo}</td>
                      <td>{e.tipo_equipo}</td>
                      <td>{e.total_cantidad}</td>
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

export default ReporteUsoEquipos;