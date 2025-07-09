import { useEffect, useState, useRef } from "react";
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
import html2canvas from "html2canvas";
import { getPrediccionPorAula, getListaAulas, getPrediccionAulasGeneral } from "../../services/prediccionService"; // <-- Importa función para predicción general
import type { PrediccionData } from "../../types/predict";
import type { Aula } from "../../types/aula";

export default function PrediccionAulaPage() {
    const [data, setData] = useState<PrediccionData[]>([]);
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [aulaSeleccionada, setAulaSeleccionada] = useState<number | undefined>(undefined);
    const [precision, setPrecision] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRL, setShowRL] = useState(true);
    const [showSVR, setShowSVR] = useState(true);
    const chartRef = useRef<HTMLDivElement>(null);

    const cargarPrediccion = async (aulaId?: number) => {
        setLoading(true);
        try {
            let result;
            if (aulaId) {
                // Predicción por aula específica
                result = await getPrediccionPorAula(aulaId);
            } else {
                // Predicción general (todas las aulas)
                result = await getPrediccionAulasGeneral();
            }

            // Procesar historico: puede venir como objeto o array, adaptamos según estructura
            const historicoArray = Array.isArray(result.historico)
                ? result.historico
                : Object.values(result.historico);

            const historico = historicoArray.map((item: any, index: number) => ({
                mes: item.mes_nombre ?? item.mes ?? "",
                cantidad: item.total ?? 0,
                tipo: "Histórico" as const,
                detalle: {
                    regresion_lineal: null,
                    svr: null,
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
                    svr: item.svr ?? null,
                },
                mes_numero: historico.length + index,
            }));

            setData([...historico, ...predicciones]);
            setPrecision(result.precision);
        } catch (error) {
            console.error("Error al cargar predicción por aula:", error);
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
        }
    };

    useEffect(() => {
        cargarAulas();
        // También cargamos la predicción general al cargar el componente
        cargarPrediccion(undefined);
    }, []);

    const exportarCSV = () => {
        const encabezados = ["Mes", "Cantidad", "Tipo", "Regresión Lineal", "SVR"];
        const filas = data.map((d) => [
            d.mes,
            d.cantidad,
            d.tipo,
            d.detalle?.regresion_lineal ?? "",
            d.detalle?.svr ?? "",
        ]);
        const contenido = [
            encabezados.join(","),
            ...filas.map((fila) => fila.join(",")),
        ].join("\n");

        const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "prediccion_aulas.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportarImagen = async () => {
        if (!chartRef.current) return;
        const canvas = await html2canvas(chartRef.current);
        const link = document.createElement("a");
        link.download = "grafico_prediccion_aulas.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Predicción de Reservas por Aula</h1>

            <div className="mb-3 d-flex align-items-center gap-3 flex-wrap">
                <label>Aula:</label>
                <select
                    className="form-select"
                    style={{ maxWidth: 250 }}
                    value={aulaSeleccionada ?? ""}
                    onChange={(e) => {
                        const id = e.target.value ? parseInt(e.target.value) : undefined;
                        setAulaSeleccionada(id);
                        cargarPrediccion(id);
                    }}
                >
                    <option value="">Todas las aulas</option>
                    {aulas.map((aula) => (
                        <option key={aula.id} value={aula.id}>
                            {aula.name}
                        </option>
                    ))}
                </select>

                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={showRL}
                        onChange={() => setShowRL(!showRL)}
                        id="rlCheckbox"
                    />
                    <label className="form-check-label" htmlFor="rlCheckbox">
                        Regresión Lineal
                    </label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={showSVR}
                        onChange={() => setShowSVR(!showSVR)}
                        id="svrCheckbox"
                    />
                    <label className="form-check-label" htmlFor="svrCheckbox">
                        SVR
                    </label>
                </div>
            </div>

            <div className="mb-3 d-flex gap-2 flex-wrap">
                <button onClick={exportarCSV} className="btn btn-success">
                    Exportar CSV
                </button>
                <button onClick={exportarImagen} className="btn btn-primary">
                    Descargar gráfico
                </button>
            </div>

            {loading ? (
                <p>Cargando datos...</p>
            ) : (
                <>
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
                                />
                                {showRL && (
                                    <Line
                                        type="monotone"
                                        dataKey="detalle.regresion_lineal"
                                        stroke="#28a745"
                                        name="Regresión Lineal"
                                        dot={false}
                                        strokeDasharray="5 5"
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
                                    />
                                )}
                                <Brush dataKey="mes" height={30} stroke="#8884d8" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {precision !== null && (
                        <p className="mt-3 text-muted">
                            Precisión del modelo: <strong>{precision.toFixed(2)}%</strong>
                        </p>
                    )}

                    <h2 className="text-lg font-semibold mb-2 text-gray-800">
                        📄 Detalle de Datos
                    </h2>
                    <div className="mt-5 d-flex justify-content-center">
                        <div className="table-responsive" style={{ maxHeight: 400 }}>
                            <table className="table table-bordered table-striped table-sm text-center align-middle">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th>Mes</th>
                                        <th>Cantidad</th>
                                        <th>Tipo</th>
                                        <th>Reg. Lineal</th>
                                        <th>SVR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => (
                                        <tr key={item.mes_numero}>
                                            <td>{item.mes}</td>
                                            <td>{item.cantidad}</td>
                                            <td>{item.tipo}</td>
                                            <td>{item.detalle?.regresion_lineal ?? "-"}</td>
                                            <td>{item.detalle?.svr ?? "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
