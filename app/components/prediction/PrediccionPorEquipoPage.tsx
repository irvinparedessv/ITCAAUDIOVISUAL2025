import React, { useEffect, useMemo, useState, useRef } from "react";
import AsyncSelect from "react-select/async";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush,
} from "recharts";
import {
  buscarEquipos,
  getPrediccionPorEquipo,
  getTop5PrediccionesPorEquipo,
} from "../../services/prediccionService";
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
  Accordion
} from "react-bootstrap";
import html2canvas from "html2canvas";
import { FaChartBar, FaFileExcel, FaFileImage, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type PrediccionRow = {
  mes: string;
  tipo: string;
  cantidad: number;
  mes_numero: number;
  detalle?: { regresion_lineal?: number };
};

type EquipoInfo = {
  id: string;
  numero_serie: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  marca_modelo?: string;
  total_reservas: number;
};

type EquipoData = {
  equipo?: EquipoInfo;
  nombre: string;
  total_reservas: number;
  prediccion: PrediccionRow[];
  precision: number | null;
};

export default function PrediccionPorEquipoPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const top5ChartRef = useRef<HTMLDivElement>(null);

  const [top5, setTop5] = useState<EquipoData[]>([]);
  const [loadingTop5, setLoadingTop5] = useState(true);

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<{ label: string; value: string } | null>(null);
  const [analisisEquipo, setAnalisisEquipo] = useState<PrediccionRow[] | null>(null);
  const [nombreEquipoSeleccionado, setNombreEquipoSeleccionado] = useState<string>("");
  const [precisionEquipo, setPrecisionEquipo] = useState<number | null>(null);

  const [showRL, setShowRL] = useState(true);
  const [equiposAbiertos, setEquiposAbiertos] = useState<string[]>([]);

  const customSelectStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      borderColor: darkMode ? "#444" : "#ccc",
      color: darkMode ? "#f8f9fa" : "#212529",
      minHeight: '48px',
      height: '48px',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    input: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
      margin: '0px',
    }),
    valueContainer: (base: any) => ({
      ...base,
      height: '48px',
      padding: '0 8px',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: darkMode ? "#bbb" : "#666",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? (darkMode ? "#555" : "#d3d3d3")
        : isFocused
          ? (darkMode ? "#444" : "#e6e6e6")
          : "transparent",
      color: darkMode ? "#f8f9fa" : "#212529",
      cursor: "pointer",
    }),
  }), [darkMode]);

  useEffect(() => {
    (async () => {
      setLoadingTop5(true);
      try {
        const resultadosTop5 = await getTop5PrediccionesPorEquipo();
        setTop5(resultadosTop5.map(item => ({
          equipo: item.equipo ? {
            id: item.equipo.id.toString(),
            numero_serie: item.equipo.numero_serie || "N/A",
            nombre: item.equipo.marca_modelo || "Equipo desconocido",
            marca: item.equipo.marca,
            modelo: item.equipo.modelo,
            marca_modelo: item.equipo.marca_modelo,
            total_reservas: item.equipo.total_reservas
          } : undefined,
          nombre: item.equipo?.marca_modelo ?? "Equipo desconocido",
          total_reservas: item.equipo?.total_reservas ?? 0,
          prediccion: [
            ...(item.prediccion?.historico ?? []),
            ...(item.prediccion?.predicciones ?? [])
          ].sort((a, b) => a.mes_numero - b.mes_numero),
          precision: item.prediccion?.precision ?? null,
        })));

      } catch (e) {
        console.error(e);
        toast.error("Error al cargar los equipos más prestados");
      } finally {
        setLoadingTop5(false);
      }
    })();
  }, []);

  const loadOptions = async (inputValue: string) => {
    const q = inputValue.trim();
    if (!q) return [];
    try {
      const teams = await buscarEquipos(q, 10);
      return teams.map((e: any) => ({
        label: `${e.marca} ${e.modelo} (${e.numero_serie})`, // Formato: "Marca Modelo (N° Serie)"
        value: e.id.toString(),
        originalData: e
      }));
    } catch (error) {
      console.error(error);
      toast.error("Error al buscar equipos");
      return [];
    }
  };

  const analizarEquipo = async () => {
    if (!equipoSeleccionado) {
      toast.error("Por favor selecciona un equipo");
      return;
    }

    try {
      const id = parseInt(equipoSeleccionado.value);
      const data = await getPrediccionPorEquipo(id);
      const combinado = [...(data.historico ?? []), ...(data.predicciones ?? [])]
        .sort((a, b) => a.mes_numero - b.mes_numero);

      setAnalisisEquipo(combinado);
      setNombreEquipoSeleccionado(equipoSeleccionado.label);
      setPrecisionEquipo(data.precision ?? null);
      setShowRL(true);

      toast.success(`Datos cargados para ${equipoSeleccionado.label}`);
    } catch (error) {
      console.error(error);
      setAnalisisEquipo(null);
      setNombreEquipoSeleccionado("");
      setPrecisionEquipo(null);
      toast.error("Error al cargar los datos del equipo");
    }
  };

  const confirmarExportacionExcel = () => {
    toast.dismiss('confirmar-excel-equipo');
    toast.dismiss('confirmar-imagen-equipo');

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
        id: 'confirmar-excel-equipo',
      }
    );
  };

  const exportarExcel = () => {
    if (!analisisEquipo || analisisEquipo.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      toast.loading("Generando Excel...", { id: "excel-download-equipo" });

      const encabezados = ["Mes", "Cantidad", "Tipo", "Regresión Lineal"];
      const filas = analisisEquipo.map((d) => [
        d.mes,
        d.cantidad,
        d.tipo,
        d.detalle?.regresion_lineal ?? "",
      ]);

      const datos = [encabezados, ...filas];
      const ws = XLSX.utils.aoa_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Predicción Equipo");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }), `Prediccion_${nombreEquipoSeleccionado}.xlsx`);

      toast.success("Excel exportado correctamente", { id: "excel-download-equipo" });
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al exportar Excel", { id: "excel-download-equipo" });
    }
  };

  const confirmarExportacionImagen = () => {
    toast.dismiss('confirmar-imagen-equipo');
    toast.dismiss('confirmar-excel-equipo');

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
        id: 'confirmar-imagen-equipo',
      }
    );
  };

  const exportarImagen = async () => {
    if (!chartRef.current) {
      toast.error("No se encontró el gráfico para exportar");
      return;
    }

    try {
      toast.loading("Generando imagen...", { id: "imagen-download-equipo" });
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement("a");
      link.download = `prediccion_${nombreEquipoSeleccionado}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.dismiss("imagen-download-equipo");
      toast.success("Imagen exportada correctamente");
    } catch (error) {
      console.error("Error al exportar imagen:", error);
      toast.error("Error al exportar imagen", { id: "imagen-download-equipo" });
    }
  };

  const confirmarExportacionTop5Imagen = () => {
    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el gráfico Top 5 como imagen?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                toast.dismiss(t.id);
                exportarTop5Imagen();
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
        id: 'confirmar-imagen-top5',
      }
    );
  };

  const exportarTop5Imagen = async () => {
    if (!top5ChartRef.current) {
      toast.error("No se encontró el gráfico para exportar");
      return;
    }

    try {
      toast.loading("Generando imagen...", { id: "imagen-download-top5" });
      const canvas = await html2canvas(top5ChartRef.current);
      const link = document.createElement("a");
      link.download = `top5_equipos_mas_prestados.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.dismiss("imagen-download-top5");
      toast.success("Imagen exportada correctamente");
    } catch (error) {
      console.error("Error al exportar imagen:", error);
      toast.error("Error al exportar imagen", { id: "imagen-download-top5" });
    }
  };

  const handleBack = () => {
    navigate("/opcionesAnalisis");
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === "Histórico" ? "info" : "warning";
  };

  const colores = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6610f2"];

  const unificarDatosParaGrafico = (topEquipos: EquipoData[]) => {
    const map = new Map<string, any>();
    topEquipos.forEach(eq => {
      eq.prediccion.forEach(p => {
        if (!map.has(p.mes)) map.set(p.mes, { mes: p.mes });
        map.get(p.mes)[eq.nombre] = p.cantidad;
      });
    });
    return Array.from(map.values())
      .sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());
  };

  const toggleEquipo = (nombre: string) =>
    setEquiposAbiertos(prev => prev.includes(nombre) ? prev.filter(e => e !== nombre) : [...prev, nombre]);

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
          Predicción de Reservas por Equipos
        </h2>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Header className="text-center fw-bold">📊 Top 5 equipos más prestados</Card.Header>
        <Card.Body>
          {loadingTop5 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando datos de equipos más prestados...</p>
            </div>
          ) : top5.length > 0 ? (
            <>
              <div className="d-flex justify-content-end mb-3">
                <Button
                  variant="warning"
                  onClick={confirmarExportacionTop5Imagen}
                  disabled={loadingTop5 || top5.length === 0}
                  className="d-flex align-items-center gap-2"
                >
                  <FaChartBar /> Exportar Gráfico
                </Button>
              </div>

              <div ref={top5ChartRef}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={unificarDatosParaGrafico(top5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {top5.map((eq, i) => (
                      <Line
                        key={eq.equipo?.id || `line-${i}`}
                        dataKey={eq.nombre}
                        stroke={colores[i % colores.length]}
                        dot={false}
                      />
                    ))}
                    <Brush dataKey="mes" height={30} stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Accordion className="mt-4">
                {top5.map((eq, index) => (
                  <Accordion.Item
                    key={eq.equipo?.id || `eq-${index}`}
                    eventKey={eq.equipo?.id || `eq-${index}`}
                  >
                    <Accordion.Header onClick={() => toggleEquipo(eq.nombre)}>
                      <div>
                        <div>{eq.nombre}</div>
                        {eq.equipo?.numero_serie && (
                          <small className="text-muted">N° Serie: {eq.equipo.numero_serie}</small>
                        )}
                      </div>
                      <div className="ms-3">
                        {eq.total_reservas} reservas en 6 meses
                        {eq.precision !== null && (
                          <Badge bg="success" className="ms-2">
                            Precisión: {eq.precision.toFixed(2)}%
                          </Badge>
                        )}
                      </div>
                    </Accordion.Header>
                    <Accordion.Body className="p-0">
                      <Table striped bordered hover responsive className="mb-0">
                        <thead>
                          <tr>
                            <th>Mes</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Reg. Lineal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eq.prediccion.map((p, idx) => (
                            <tr key={`${eq.equipo?.id || 'eq'}-${idx}`}>
                              <td>{p.mes}</td>
                              <td>
                                <Badge bg={getTipoBadge(p.tipo)}>
                                  {p.tipo}
                                </Badge>
                              </td>
                              <td>{p.cantidad}</td>
                              <td>{p.detalle?.regresion_lineal ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </>
          ) : (
            <div className="text-center py-4">
              No se encontraron datos de equipos más prestados
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="text-center fw-bold">🔎 Análisis individual</Card.Header>
        <Card.Body>
          <Row className="g-3 align-items-end mb-4">
            <Col md={8}>
              <Form.Group controlId="equipoSeleccionado">
                <Form.Label className="fw-bold">Seleccionar equipo</Form.Label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadOptions}
                  menuPortalTarget={document.body}
                  styles={customSelectStyles}
                  defaultOptions
                  value={equipoSeleccionado}
                  onChange={setEquipoSeleccionado}
                  placeholder="Buscar equipo..."
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex justify-content-end">
              <Button
                variant="primary"
                onClick={analizarEquipo}
                disabled={!equipoSeleccionado}
              >
                Analizar
              </Button>
            </Col>
          </Row>

          {analisisEquipo && (
            <>
              <Row className="align-items-center mb-3">
                <Col>
                  <h4 className="mb-0">{nombreEquipoSeleccionado}</h4>
                </Col>
                <Col md="auto">
                  {precisionEquipo !== null && (
                    <Badge bg="success" className="fs-6">
                      Precisión del modelo: {precisionEquipo.toFixed(2)}%
                    </Badge>
                  )}
                </Col>
                <Col md="auto" className="d-flex gap-2">
                  <Button
                    variant="success"
                    onClick={confirmarExportacionExcel}
                    disabled={!analisisEquipo || analisisEquipo.length === 0}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaFileExcel /> Excel
                  </Button>
                  <Button
                    variant="warning"
                    onClick={confirmarExportacionImagen}
                    disabled={!analisisEquipo || analisisEquipo.length === 0}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaFileImage /> Gráfico
                  </Button>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold">Mostrar modelo</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="checkbox"
                        id="rlCheckboxEquipo"
                        label="Regresión Lineal"
                        checked={showRL}
                        onChange={() => setShowRL(!showRL)}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <div ref={chartRef}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analisisEquipo}>
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
                    {analisisEquipo.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.mes}</td>
                        <td>{p.cantidad}</td>
                        <td>
                          <Badge bg={getTipoBadge(p.tipo)}>
                            {p.tipo}
                          </Badge>
                        </td>
                        <td>{p.detalle?.regresion_lineal ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}