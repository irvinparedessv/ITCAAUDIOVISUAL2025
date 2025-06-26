import { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush,
} from "recharts";
import {
  buscarEquipos,
  getPrediccionPorEquipo,
  getTop5PrediccionesPorEquipo,
} from "../services/prediccionService";
import { useTheme } from "../components/ThemeContext";

type PrediccionRow = {
  mes: string;
  tipo: string;
  cantidad: number;
  mes_numero: number;
  detalle?: { regresion_lineal?: number; svr?: number };
};

type EquipoData = {
  nombre: string;
  prediccion: PrediccionRow[];
  precision: number | null;
};

export default function PrediccionPorEquipoPage() {
  const { darkMode } = useTheme();

  const [top5, setTop5] = useState<EquipoData[]>([]);
  const [loadingTop5, setLoadingTop5] = useState(true);

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<{ label: string; value: string } | null>(null);
  const [analisisEquipo, setAnalisisEquipo] = useState<PrediccionRow[] | null>(null);
  const [nombreEquipoSeleccionado, setNombreEquipoSeleccionado] = useState<string>("");
  const [precisionEquipo, setPrecisionEquipo] = useState<number | null>(null);

  const [showRL, setShowRL] = useState(true);
  const [showSVR, setShowSVR] = useState(true);

  const [equiposAbiertos, setEquiposAbiertos] = useState<string[]>([]);

  const customSelectStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      borderColor: darkMode ? "#444" : "#ccc",
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    input: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
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
          nombre: item.equipo?.nombre ?? "Equipo desconocido",
          prediccion: [
            ...(item.prediccion?.historico ?? []),
            ...(item.prediccion?.predicciones ?? [])
          ].sort((a, b) => a.mes_numero - b.mes_numero),
          precision: item.prediccion?.precision ?? null,
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTop5(false);
      }
    })();
  }, []);

  const loadOptions = async (inputValue: string) => {
    const q = inputValue.trim();
    if (!q) return [];
    const teams = await buscarEquipos(q, 10);
    return teams.map((e: any) => ({ label: e.nombre, value: e.id.toString() }));
  };

  const analizarEquipo = async () => {
    if (!equipoSeleccionado) return;
    const id = parseInt(equipoSeleccionado.value);
    try {
      const data = await getPrediccionPorEquipo(id);
      const combinado = [...(data.historico ?? []), ...(data.predicciones ?? [])]
        .sort((a, b) => a.mes_numero - b.mes_numero);

      setAnalisisEquipo(combinado);
      setNombreEquipoSeleccionado(equipoSeleccionado.label);
      setPrecisionEquipo(data.precision ?? null);
      setShowRL(true);
      setShowSVR(true);
    } catch (error) {
      console.error(error);
      setAnalisisEquipo(null);
      setNombreEquipoSeleccionado("");
      setPrecisionEquipo(null);
    }
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
    <div className="container mt-4">
      <h1 className="text-center">🔍 Predicción de Reservas por Equipos</h1>
      <br />

      {loadingTop5 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: 350 }}>
          <div className="spinner-border" role="status" aria-label="Cargando datos top 5">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : top5.length > 0 ? (
        <div className="card mb-4">
          <div className="card-header text-center">📊 Top 5 equipos más prestados</div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={unificarDatosParaGrafico(top5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                {top5.map((eq, i) => (
                  <Line key={eq.nombre} dataKey={eq.nombre} stroke={colores[i % colores.length]} dot={false} />
                ))}
                <Brush dataKey="mes" height={30} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>

            <div className="accordion mt-3" id="top5Acc">
              {top5.map(eq => (
                <div key={eq.nombre} className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${!equiposAbiertos.includes(eq.nombre) ? "collapsed" : ""}`}
                      onClick={() => toggleEquipo(eq.nombre)}
                    >
                      {eq.nombre}
                    </button>
                  </h2>
                  <div className={`accordion-collapse collapse ${equiposAbiertos.includes(eq.nombre) ? "show" : ""}`}>
                    <div className="accordion-body p-0">
                      <table className="table table-sm table-bordered mb-0 text-center">
                        <thead>
                          <tr><th>Mes</th><th>Tipo</th><th>Cantidad</th></tr>
                        </thead>
                        <tbody>
                          {eq.prediccion.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.mes}</td>
                              <td>{p.tipo}</td>
                              <td>{p.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header text-center">🔎 Análisis individual</div>
        <div className="card-body">
          <div className="d-flex align-items-end gap-3 mb-3">
            <div className="flex-grow-1">
              <label>Selecciona un equipo:</label>
              <AsyncSelect
                cacheOptions
                loadOptions={loadOptions}
                styles={customSelectStyles}
                defaultOptions
                value={equipoSeleccionado}
                onChange={setEquipoSeleccionado}
                placeholder="Buscar equipo..."
              />
            </div>
            <button className="btn btn-primary" onClick={analizarEquipo}>Analizar</button>
          </div>

          {analisisEquipo && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>📈 {nombreEquipoSeleccionado}</h4>
                {precisionEquipo !== null && (
                  <span className="badge bg-success">
                    Precisión del modelo: {precisionEquipo.toFixed(2)}%
                  </span>
                )}
              </div>

              <div className="d-flex justify-content-center gap-4 mb-3">
                <label className="form-check-label"><input type="checkbox" checked={showRL} onChange={() => setShowRL(!showRL)} /> Regresión lineal</label>
                <label className="form-check-label"><input type="checkbox" checked={showSVR} onChange={() => setShowSVR(!showSVR)} /> SVR</label>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analisisEquipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cantidad" stroke="#8884d8" dot={false} name="Reservas" />
                  {showRL && <Line type="monotone" dataKey="detalle.regresion_lineal" stroke="#82ca9d" dot={false} name="Regresión lineal" />}
                  {showSVR && <Line type="monotone" dataKey="detalle.svr" stroke="#ffc658" dot={false} name="SVR" />}
                  <Brush dataKey="mes" height={30} stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table table-sm table-bordered text-center mt-3">
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Regresión lineal</th>
                      <th>SVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisisEquipo.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.mes}</td>
                        <td>{p.tipo}</td>
                        <td>{p.cantidad}</td>
                        <td>{p.detalle?.regresion_lineal ?? "-"}</td>
                        <td>{p.detalle?.svr ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
