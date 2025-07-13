import React, { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import {
  getPrediccion,
  getPrediccionesPorTipo,
} from "../../services/prediccionService";
import type { PrediccionData } from "app/types/predict";
import type { TipoEquipo } from "app/types/tipoEquipo";
import { useTheme } from "../../hooks/ThemeContext";
import {
  Button,
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Table,
  Badge,
  Form,
} from "react-bootstrap";
import html2canvas from "html2canvas";
import { FaChartBar, FaFileExcel, FaFileImage, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PrediccionPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<PrediccionData[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number | undefined>();
  const [precision, setPrecision] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRL, setShowRL] = useState(true);
  const [showSVR, setShowSVR] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const cargarPrediccion = async (tipo?: number) => {
    setLoading(true);
    try {
      const result = await getPrediccion(tipo);
      setData(
        [...result.historico, ...result.predicciones].sort(
          (a, b) => a.mes_numero - b.mes_numero
        )
      );
      setPrecision(result.precision);
    } catch (error: any) {
      console.error("Error al cargar predicciones:", error);
      const errorMessage =
        error?.response?.data?.message || "Error al cargar los datos de predicción";
      toast.error(errorMessage);
      setData([]);
      setPrecision(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarTipos = async () => {
    try {
      const result = await getPrediccionesPorTipo();
      setTipos(result.map((item: any) => item.tipo_equipo));
    } catch (error) {
      console.error("Error al cargar tipos:", error);
      toast.error("Error al cargar los tipos de equipo");
    }
  };

  useEffect(() => {
    cargarPrediccion();
    cargarTipos();
  }, []);

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipo = e.target.value ? parseInt(e.target.value) : undefined;
    setTipoSeleccionado(tipo);
    cargarPrediccion(tipo);
  };

  const confirmarExportacionExcel = () => {
    toast.dismiss('confirmar-excel');
    toast.dismiss('confirmar-imagen');

    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el reporte en formato Excel?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                toast.dismiss(t.id);
                exportarExcel();
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
        id: 'confirmar-excel',
      }
    );
  };

  const exportarExcel = () => {
    if (!data || data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      toast.loading("Generando Excel...", { id: "excel-download" });

      const encabezados = ["Mes", "Cantidad", "Tipo", "Regresión Lineal", "SVR"];
      const filas = data.map((d) => [
        d.mes,
        d.cantidad,
        d.tipo,
        d.detalle?.regresion_lineal ?? "",
        d.detalle?.svr ?? "",
      ]);

      const datos = [encabezados, ...filas];
      const ws = XLSX.utils.aoa_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Predicción Reservas");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }), "Prediccion_Reservas.xlsx");

      toast.success("Excel exportado correctamente", { id: "excel-download" });
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al exportar Excel", { id: "excel-download" });
    }
  };

  const confirmarExportacionImagen = () => {
    toast.dismiss('confirmar-imagen');
    toast.dismiss('confirmar-excel');

    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el gráfico como imagen?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                toast.dismiss(t.id);
                exportarImagen();
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
        id: 'confirmar-imagen',
      }
    );
  };

  const exportarImagen = async () => {
    if (!chartRef.current) {
      toast.error("No se encontró el gráfico para exportar");
      return;
    }

    try {
      toast.loading("Generando imagen...", { id: "imagen-download" });
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement("a");
      link.download = "prediccion_reservas.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.dismiss("imagen-download");
      toast.success("Imagen exportada correctamente");
    } catch (error) {
      console.error("Error al exportar imagen:", error);
      toast.error("Error al exportar imagen", { id: "imagen-download" });
    }
  };

  const handleBack = () => {
    navigate("/opcionesAnalisis");
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === "Histórico" ? "info" : "warning";
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
          Predicción de Reservas
        </h2>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="text-center fw-bold">🔎 Predicción por tipo equipo</Card.Header>
        <Card.Body>
          <Row className="g-3 align-items-end mb-4">
            <Col md={8}>
              <Form.Group controlId="tipoEquipoSelect">
                <Form.Label className="fw-bold">Filtrar por tipo de equipo</Form.Label>
                <Form.Select
                  value={tipoSeleccionado ?? ""}
                  onChange={handleTipoChange}
                  className={darkMode ? "bg-dark text-light" : ""}
                  disabled={loading}
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {loading && data.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando datos de predicción...</p>
            </div>
          ) : (
            <>
              <Row className="align-items-center mb-3">
                <Col>
                  <h4 className="mb-0">
                    Predicción de reservas
                    {tipoSeleccionado && tipos.find(t => t.id === tipoSeleccionado) && (
                      <span className="ms-2">
                        - {tipos.find(t => t.id === tipoSeleccionado)?.nombre}
                      </span>
                    )}
                  </h4>
                </Col>
                <Col md="auto">
                  {precision !== null && (
                    <Badge bg="success" className="fs-6">
                      Precisión del modelo: {precision.toFixed(2)}%
                    </Badge>
                  )}
                </Col>
                <Col md="auto" className="d-flex gap-2">
                  <Button
                    variant="success"
                    onClick={confirmarExportacionExcel}
                    disabled={data.length === 0 || loading}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaFileExcel /> Excel
                  </Button>
                  <Button
                    variant="warning"
                    onClick={confirmarExportacionImagen}
                    disabled={data.length === 0 || loading}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaChartBar /> Gráfico
                  </Button>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold">Mostrar modelos</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="checkbox"
                        id="rlCheckbox"
                        label="Regresión Lineal"
                        checked={showRL}
                        onChange={() => setShowRL(!showRL)}
                        disabled={loading}
                      />
                      <Form.Check
                        type="checkbox"
                        id="svrCheckbox"
                        label="SVR"
                        checked={showSVR}
                        onChange={() => setShowSVR(!showSVR)}
                        disabled={loading}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <div ref={chartRef}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      stroke="#007bff"
                      name="Reservas"
                      strokeWidth={2}
                      dot={false}
                    />
                    {showRL && (
                      <Line
                        type="monotone"
                        dataKey="detalle.regresion_lineal"
                        stroke="#28a745"
                        name="Regresión Lineal"
                        dot={false}
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    )}
                    {showSVR && (
                      <Line
                        type="monotone"
                        dataKey="detalle.svr"
                        stroke="#ffc107"
                        name="SVR"
                        dot={false}
                        strokeDasharray="3 3"
                        strokeWidth={2}
                      />
                    )}
                    <Brush dataKey="mes" height={30} stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {data.length > 0 && (
                <>
                  <h5 className="mt-4 mb-3">Detalle de datos</h5>
                  <div className="table-responsive" style={{ maxHeight: "400px" }}>
                    <Table striped hover>
                      <thead className="table-dark sticky-top">
                        <tr>
                          <th>Mes</th>
                          <th>Cantidad</th>
                          <th>Tipo</th>
                          <th>Reg. Lineal</th>
                          <th>SVR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.mes}</td>
                            <td>{item.cantidad}</td>
                            <td>
                              <Badge bg={getTipoBadge(item.tipo)}>
                                {item.tipo}
                              </Badge>
                            </td>
                            <td>{item.detalle?.regresion_lineal ?? "-"}</td>
                            <td>{item.detalle?.svr ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}