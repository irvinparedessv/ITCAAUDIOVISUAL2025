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
import {
  getPrediccion,
  getPrediccionesPorTipo,
} from "../services/prediccionService";
import type { PrediccionData } from "app/types/predict";
import type { TipoEquipo } from "app/types/tipoEquipo";

export default function PrediccionPage() {
  const [data, setData] = useState<PrediccionData[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<
    number | undefined
  >();
  const [precision, setPrecision] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRL, setShowRL] = useState(true);
  const [showSVR, setShowSVR] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      console.error("Error al cargar predicciones:", error);
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
    }
  };

  useEffect(() => {
    cargarPrediccion();
    cargarTipos();
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
    a.download = "prediccion_reservas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarImagen = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "grafico_prediccion.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Predicción de Reservas</h1>

      <div className="mb-3 d-flex align-items-center gap-3 flex-wrap">
        <label>Tipo de equipo:</label>
        <select
          className="form-select"
          style={{ maxWidth: 250 }}
          value={tipoSeleccionado ?? ""}
          onChange={(e) => {
            const tipo = e.target.value ? parseInt(e.target.value) : undefined;
            setTipoSeleccionado(tipo);
            cargarPrediccion(tipo);
          }}
        >
          <option value="">Todos</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
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
