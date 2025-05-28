import React, { useEffect, useState } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPrediccion, getPrediccionesPorTipo } from '~/services/prediccionService';
import type { PrediccionData } from '~/types/predict';
import type { TipoEquipo } from '~/types/tipoEquipo';

export default function PrediccionPage() {
  const [data, setData] = useState<PrediccionData[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number | undefined>();
  const [precision, setPrecision] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const cargarPrediccion = async (tipo?: number) => {
    try {
      setLoading(true);
      const result = await getPrediccion(tipo);
     setData([...result.historico, ...result.predicciones].sort((a, b) => a.mes_numero - b.mes_numero));
      setPrecision(result.precision);
    } catch (err) {
      console.error('Error al obtener predicción:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarTipos = async () => {
    try {
      const result = await getPrediccionesPorTipo();
      setTipos(result.map((item: any) => item.tipo_equipo));
    } catch (err) {
      console.error('Error al obtener tipos:', err);
    }
  };

  useEffect(() => {
    cargarPrediccion();
    cargarTipos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Predicción de Reservas de Equipos</h1>

      <div className="mb-4">
        <label className="font-semibold">Filtrar por tipo de equipo:</label>
        <select
          className="ml-2 p-2 border rounded"
          value={tipoSeleccionado ?? ''}
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
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
                <Line type="monotone" dataKey="cantidad" stroke="#8884d8" name="Histórico / Predicción" />
                <Line type="monotone" dataKey="detalle.regresion_lineal" stroke="#82ca9d" name="Regresión Lineal" dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="detalle.svr" stroke="#ff7300" name="SVR" dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>

          {precision !== null && (
            <p className="mt-4 text-sm text-gray-600">
              Precisión estimada del modelo: <strong>{precision.toFixed(2)}%</strong>
            </p>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Detalle</h2>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Mes</th>
                  <th className="border p-2">Cantidad</th>
                  <th className="border p-2">Tipo</th>
                  <th className="border p-2">Reg. Lineal</th>
                  <th className="border p-2">SVR</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.mes_numero}>
                    <td className="border p-2">{item.mes}</td>
                    <td className="border p-2">{item.cantidad}</td>
                    <td className="border p-2">{item.tipo}</td>
                    <td className="border p-2">{item.detalle?.regresion_lineal ?? '-'}</td>
                    <td className="border p-2">{item.detalle?.svr ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
