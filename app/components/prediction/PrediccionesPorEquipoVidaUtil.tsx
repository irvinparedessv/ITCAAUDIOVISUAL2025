import React, { useEffect, useMemo, useState, useRef } from "react";
import AsyncSelect from "react-select/async";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, Area, AreaChart,
} from "recharts";
import {
    buscarEquiposVidaUtil,
    getPrediccionVidaUtilPorEquipo,
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
    Accordion,
    ProgressBar
} from "react-bootstrap";
import html2canvas from "html2canvas";
import { FaChartBar, FaFileExcel, FaFileImage, FaLongArrowAltLeft, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type PrediccionVidaUtilRow = {
    mes: string;
    tipo: string;
    horas_usadas: number;
    horas_acumuladas: number;
    vida_util_restante: number;
    porcentaje_utilizado: number;
    regresion_lineal?: number;
    svr?: number;
};

type EquipoInfo = {
    id: string;
    numero_serie: string;
    nombre: string;
    marca?: string;
    modelo?: string;
    marca_modelo?: string;
    vida_util_total: number;
};

type EquipoVidaUtilData = {
    equipo?: EquipoInfo;
    historico: PrediccionVidaUtilRow[];
    predicciones: PrediccionVidaUtilRow[];
    precision: number;
    meses_restantes: number;
    fecha_fin_vida_util: string;
};

export default function PrediccionesPorEquipoVidaUtilPage() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const chartRef = useRef<HTMLDivElement>(null);


    const [equipoSeleccionado, setEquipoSeleccionado] = useState<{ label: string; value: string } | null>(null);
    const [analisisEquipo, setAnalisisEquipo] = useState<EquipoVidaUtilData | null>(null);
    const [loadingAnalisis, setLoadingAnalisis] = useState(false);

    const [showRL, setShowRL] = useState(true);
    const [showSVR, setShowSVR] = useState(true);
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



    const loadOptions = async (inputValue: string) => {
        const q = inputValue.trim();
        if (!q) return [];
        try {
            const teams = await buscarEquiposVidaUtil(q, 10);
            return teams.map((e: any) => ({
                label: `${e.marca} ${e.modelo} (${e.numero_serie}) - Vida útil: ${e.vida_util || 'N/A'} hrs`,
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
            setLoadingAnalisis(true);
            const id = parseInt(equipoSeleccionado.value);
            const data = await getPrediccionVidaUtilPorEquipo(id);
            setAnalisisEquipo(data);
            toast.success(`Datos cargados para ${equipoSeleccionado.label}`);
        } catch (error) {
            console.error(error);
            setAnalisisEquipo(null);
            toast.error("Error al cargar los datos del equipo");
        } finally {
            setLoadingAnalisis(false);
        }
    };

    const exportarExcel = () => {
        if (!analisisEquipo) {
            toast.error("No hay datos para exportar");
            return;
        }

        try {
            toast.loading("Generando Excel...", { id: "excel-download-equipo" });

            const encabezados = [
                "Mes",
                "Tipo",
                "Horas Usadas",
                "Horas Acumuladas",
                "Vida Útil Restante",
                "% Utilizado",
                "Regresión Lineal",
                "SVR"
            ];

            const datosCombinados = [...analisisEquipo.historico, ...analisisEquipo.predicciones];

            const filas = datosCombinados.map((d) => [
                d.mes,
                d.tipo,
                d.horas_usadas,
                d.horas_acumuladas,
                d.vida_util_restante,
                d.porcentaje_utilizado,
                d.regresion_lineal ?? "-",
                d.svr ?? "-"
            ]);

            const datos = [encabezados, ...filas];
            const ws = XLSX.utils.aoa_to_sheet(datos);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Vida Útil Equipo");

            // Agregar hoja con resumen del equipo
            const equipoInfo = [
                ["Equipo", analisisEquipo.equipo?.nombre || "N/A"],
                ["N° Serie", analisisEquipo.equipo?.numero_serie || "N/A"],
                ["Vida Útil Total", analisisEquipo.equipo?.vida_util_total || "N/A"],
                ["Precisión Modelo", `${analisisEquipo.precision.toFixed(2)}%`],
                ["Meses Restantes", analisisEquipo.meses_restantes],
                ["Fecha Fin Vida Útil", analisisEquipo.fecha_fin_vida_util]
            ];
            const wsInfo = XLSX.utils.aoa_to_sheet(equipoInfo);
            XLSX.utils.book_append_sheet(wb, wsInfo, "Resumen");

            const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([buffer], { type: "application/octet-stream" }),
                `Vida_Util_${analisisEquipo.equipo?.numero_serie || 'equipo'}.xlsx`);

            toast.success("Excel exportado correctamente", { id: "excel-download-equipo" });
        } catch (error) {
            console.error("Error al exportar Excel:", error);
            toast.error("Error al exportar Excel", { id: "excel-download-equipo" });
        }
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
            link.download = `vida_util_${analisisEquipo?.equipo?.numero_serie || 'equipo'}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();

            toast.dismiss("imagen-download-equipo");
            toast.success("Imagen exportada correctamente");
        } catch (error) {
            console.error("Error al exportar imagen:", error);
            toast.error("Error al exportar imagen", { id: "imagen-download-equipo" });
        }
    };



    const handleBack = () => {
        navigate("/opcionesAnalisis");
    };

    const getTipoBadge = (tipo: string) => {
        return tipo === "Histórico" ? "info" : "warning";
    };

    const colores = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6610f2"];

    const unificarDatosParaGrafico = (topEquipos: EquipoVidaUtilData[]) => {
        const map = new Map<string, any>();
        topEquipos.forEach(eq => {
            const datosCombinados = [...eq.historico, ...eq.predicciones];
            datosCombinados.forEach(p => {
                if (!map.has(p.mes)) map.set(p.mes, { mes: p.mes });
                const nombreEquipo = eq.equipo?.nombre || "Equipo desconocido";
                map.get(p.mes)[nombreEquipo] = p.horas_usadas;
            });
        });
        return Array.from(map.values())
            .sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());
    };

    const toggleEquipo = (id: string) =>
        setEquiposAbiertos(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

    const datosCombinados = analisisEquipo
        ? [...analisisEquipo.historico, ...analisisEquipo.predicciones]
        : [];

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
                    Predicción de Vida Útil de Equipos
                </h2>
            </div>



            <Card className="shadow-sm">
                <Card.Header className="text-center fw-bold">🔎 Análisis individual de vida útil</Card.Header>
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
                                disabled={!equipoSeleccionado || loadingAnalisis}
                            >
                                {loadingAnalisis ? (
                                    <>
                                        <Spinner as="span" size="sm" animation="border" role="status" />
                                        <span className="ms-2">Analizando...</span>
                                    </>
                                ) : 'Analizar'}
                            </Button>
                        </Col>
                    </Row>

                    {loadingAnalisis && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Analizando vida útil del equipo...</p>
                        </div>
                    )}

                    {analisisEquipo && !loadingAnalisis && (
                        <>
                            <Row className="align-items-center mb-3">
                                <Col>
                                    <h4 className="mb-0">
                                        {analisisEquipo?.equipo?.nombre ||
                                            analisisEquipo?.equipo?.marca_modelo ||
                                            //    equipoSeleccionado?.originalData?.nombre ||
                                            //    equipoSeleccionado?.originalData?.marca_modelo ||
                                            equipoSeleccionado?.label?.split('(')[0]?.trim() ||
                                            'Equipo no especificado'}
                                        <small className="text-muted ms-2">
                                            N° Serie: {analisisEquipo.equipo?.numero_serie || 'N/A'}
                                        </small>
                                    </h4>
                                </Col>
                                <Col md="auto">
                                    <Badge bg="primary" className="fs-6">
                                        Vida útil total: {analisisEquipo.equipo?.vida_util_total || 'N/A'} horas
                                    </Badge>
                                    <Badge bg="success" className="fs-6 ms-2">
                                        Precisión: {analisisEquipo.precision.toFixed(2)}%
                                    </Badge>
                                </Col>
                                <Col md="auto" className="d-flex gap-2">
                                    <Button
                                        variant="success"
                                        onClick={exportarExcel}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaFileExcel /> Excel
                                    </Button>
                                    <Button
                                        variant="warning"
                                        onClick={exportarImagen}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaFileImage /> Gráfico
                                    </Button>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <Card className="mb-3">
                                        <Card.Body>
                                            <h5 className="card-title">Resumen de Vida Útil</h5>
                                            <ul className="list-unstyled">
                                                <li>
                                                    <strong>Horas acumuladas:</strong> {analisisEquipo.historico[analisisEquipo.historico.length - 1]?.horas_acumuladas || 0} hrs
                                                </li>
                                                <li>
                                                    <strong>Porcentaje utilizado:</strong>
                                                    <ProgressBar
                                                        now={analisisEquipo.historico[analisisEquipo.historico.length - 1]?.porcentaje_utilizado || 0}
                                                        label={`${(analisisEquipo.historico[analisisEquipo.historico.length - 1]?.porcentaje_utilizado || 0).toFixed(1)}%`}
                                                        variant={
                                                            (analisisEquipo.historico[analisisEquipo.historico.length - 1]?.porcentaje_utilizado || 0) > 80 ? 'danger' :
                                                                (analisisEquipo.historico[analisisEquipo.historico.length - 1]?.porcentaje_utilizado || 0) > 60 ? 'warning' : 'success'
                                                        }
                                                        className="mt-1"
                                                    />
                                                </li>
                                                <li>
                                                    <strong>Meses restantes estimados:</strong> {analisisEquipo.meses_restantes}
                                                </li>
                                                <li>
                                                    <strong>Fecha estimada fin de vida útil:</strong> {analisisEquipo.fecha_fin_vida_util}
                                                </li>
                                            </ul>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <h5 className="card-title">Configuración de gráficos</h5>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Modelos de predicción</Form.Label>
                                                <div className="d-flex gap-3">
                                                    <div className="alert alert-info p-2 mb-0">
                                                        <FaInfoCircle className="me-2" />
                                                        Los modelos muestran las predicciones de horas de uso para los próximos meses.
                                                    </div>
                                                </div>
                                            </Form.Group>

                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <div ref={chartRef}>
                                <h5 className="mb-3">Evolución de la vida útil</h5>
                                <ResponsiveContainer width="100%" height={500}>
                                    <AreaChart data={datosCombinados}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="mes" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Vida útil restante', angle: 90, position: 'insideRight' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="vida_util_restante"
                                            stroke="#82ca9d"
                                            fill="#82ca9d"
                                            name="Vida útil restante (hrs)"
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="horas_usadas"
                                            stroke="#8884d8"
                                            name="Horas usadas/mes"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        {showRL && (
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="regresion_lineal"
                                                stroke="#ff7300"
                                                name="Reg. Lineal (pred)"
                                                dot={false}
                                                strokeDasharray="5 5"
                                            />
                                        )}
                                        {showSVR && (
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="svr"
                                                stroke="#ff0000"
                                                name="SVR (pred)"
                                                dot={false}
                                                strokeDasharray="3 3"
                                            />
                                        )}
                                        <Brush dataKey="mes" height={30} stroke="#8884d8" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <h5 className="mt-4 mb-3">Detalle por mes</h5>
                            <div className="table-responsive" style={{ maxHeight: "400px" }}>
                                <Table striped hover>
                                    <thead className="table-dark sticky-top">
                                        <tr>
                                            <th>Mes</th>
                                            <th>Tipo</th>
                                            <th>Horas Usadas</th>
                                            <th>Horas Acum.</th>
                                            <th>Vida Restante</th>
                                            <th>% Utilizado</th>
                                            <th>Reg. Lineal</th>
                                            <th>SVR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datosCombinados.map((p, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    {p.mes ||
                                                        (p['mes_nombre'] ? `${p['mes_nombre']}`.trim() : '') ||
                                                        'Fecha no disponible'}
                                                </td>
                                                <td>
                                                    <Badge bg={getTipoBadge(p.tipo)}>
                                                        {p.tipo}
                                                    </Badge>
                                                </td>
                                                <td>{p.horas_usadas}</td>
                                                <td>{p.horas_acumuladas}</td>
                                                <td>{p.vida_util_restante}</td>
                                                <td>
                                                    <ProgressBar
                                                        now={p.porcentaje_utilizado}
                                                        label={`${p.porcentaje_utilizado.toFixed(1)}%`}
                                                        variant={p.porcentaje_utilizado > 80 ? 'danger' : p.porcentaje_utilizado > 60 ? 'warning' : 'success'}
                                                    />
                                                </td>
                                                <td>{p.regresion_lineal ? Math.round(p.regresion_lineal) : '-'}</td>
                                                <td>{p.svr ? Math.round(p.svr) : '-'}</td>
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