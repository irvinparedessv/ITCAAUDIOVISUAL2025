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
  Button, 
  Card, 
  Container, 
  Form, 
  Row, 
  Col, 
  Spinner, 
  Table,
  Badge
} from "react-bootstrap";
import html2canvas from "html2canvas";
import { 
  getPrediccionPorAula, 
  getListaAulas, 
  getPrediccionAulasGeneral 
} from "../../services/prediccionService";
import { FaChartBar, FaFileExcel, FaFileImage, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface PrediccionData {
  mes: string;
  cantidad: number;
  tipo: "Histórico" | "Predicción";
  detalle: {
    regresion_lineal: number | null;
  };
  mes_numero: number;
}

interface Aula {
  id: number;
  name: string;
}

const PrediccionAulaPage = () => {
  const [data, setData] = useState<PrediccionData[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState<number | undefined>(undefined);
  const [precision, setPrecision] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRL, setShowRL] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const cargarPrediccion = async (aulaId?: number) => {
    setLoading(true);
    try {
      let result;
      if (aulaId) {
        result = await getPrediccionPorAula(aulaId);
      } else {
        result = await getPrediccionAulasGeneral();
      }

      const historicoArray = Array.isArray(result.historico)
        ? result.historico
        : Object.values(result.historico);

      const historico = historicoArray.map((item: any, index: number) => ({
        mes: item.mes_nombre ?? item.mes ?? "",
        cantidad: item.total ?? 0,
        tipo: "Histórico" as const,
        detalle: {
          regresion_lineal: null,
        },
        mes_numero: index,
      }));

      const prediccionesArray = Array.isArray(result.predicciones)
        ? result.predicciones
        : Object.values(result.predicciones);

      const predicciones = prediccionesArray.map((item: any, index: number) => ({
        mes: item.mes,
        cantidad: item.prediccion,
        tipo: "Predicción" as const,
        detalle: {
          regresion_lineal: item.regresion_lineal ?? null,
        },
        mes_numero: historico.length + index,
      }));

      setData([...historico, ...predicciones]);
      setPrecision(result.precision);
    } catch (error) {
      console.error("Error al cargar predicción por aula:", error);
      toast.error("Error al cargar los datos de predicción");
      setData([]);
      setPrecision(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarAulas = async () => {
    try {
      const result = await getListaAulas();
      setAulas(result);
    } catch (error) {
      console.error("Error al cargar aulas:", error);
      toast.error("Error al cargar la lista de aulas");
    }
  };

  useEffect(() => {
    cargarAulas();
    cargarPrediccion(undefined);
  }, []);

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
    if (data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      toast.loading("Generando Excel...", { id: "excel-download" });
      
      const encabezados = ["Mes", "Cantidad", "Tipo", "Regresión Lineal"];
      const filas = data.map((d) => [
        d.mes,
        d.cantidad,
        d.tipo,
        d.detalle?.regresion_lineal ?? "",
      ]);

      const datos = [encabezados, ...filas];
      const ws = XLSX.utils.aoa_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Predicción Aulas");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }), "PrediccionAulas.xlsx");
      
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
      link.download = `prediccion_aulas_${aulaSeleccionada ? aulaSeleccionada : "general"}.png`;
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
          Predicción de Reservas por Aula
        </h2>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Group controlId="aulaSeleccionada">
                <Form.Label className="fw-bold">Aula</Form.Label>
                <Select
                  options={[
                    { value: "", label: "Todas las aulas" },
                    ...aulas.map((aula) => ({
                      value: aula.id.toString(),
                      label: aula.name,
                    }))
                  ]}
                  value={
                    aulaSeleccionada
                      ? {
                        value: aulaSeleccionada.toString(),
                        label: aulas.find((a) => a.id === aulaSeleccionada)?.name || "",
                      }
                      : { value: "", label: "Todas las aulas" }
                  }
                  onChange={(selected) => {
                    const id = selected?.value ? parseInt(selected.value) : undefined;
                    setAulaSeleccionada(id);
                    cargarPrediccion(id);
                  }}
                  menuPortalTarget={document.body}
                  placeholder="Selecciona un aula"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable={false}
                  isSearchable={true}
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

            <Col md={6} className="d-flex gap-2 justify-content-end">
              <Button
                variant="success"
                onClick={confirmarExportacionExcel}
                disabled={loading || data.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaFileExcel /> Excel
              </Button>
              <Button
                variant="warning"
                onClick={confirmarExportacionImagen}
                disabled={loading || data.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaChartBar /> Gráfico
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando datos de predicción...</p>
            </div>
          ) : (
            <>
              {precision !== null && (
                <div className="mb-3 text-end">
                  <Badge bg="success" className="fs-6">
                    Precisión del modelo: {precision.toFixed(2)}%
                  </Badge>
                </div>
              )}

              <div ref={chartRef} style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
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
                    <Brush dataKey="mes" height={30} stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h5 className="mt-4 mb-3">Detalle de datos</h5>
              <div className="table-responsive" style={{ maxHeight: "400px" }}>
                <Table striped hover>
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th>Mes</th>
                      <th>Cantidad</th>
                      <th>Tipo</th>
                      <th>Reg. Lineal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((item) => (
                        <tr key={item.mes_numero}>
                          <td>{item.mes}</td>
                          <td>{item.cantidad}</td>
                          <td>
                            <Badge bg={getTipoBadge(item.tipo)}>
                              {item.tipo}
                            </Badge>
                          </td>
                          <td>{item.detalle?.regresion_lineal ?? "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          No hay datos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PrediccionAulaPage;