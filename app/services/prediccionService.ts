import api from "../api/axios";

// Predicción individual (opcional por tipo de equipo)
export const getPrediccion = async (tipo_equipo_id?: number, meses = 6) => {
  const params = tipo_equipo_id ? { tipo_equipo_id, meses } : { meses };
  const res = await api.get('/prediccion/reservas', { params });
  return res.data.data;
};

// Predicciones por tipo de equipo (todos los tipos)
export const getPrediccionesPorTipo = async () => {
  const res = await api.get('/prediccion/reservas/por-tipo');
  return res.data.data;
};

// 🔍 Búsqueda de equipos para el combo (nuevo)
export const buscarEquipos = async (search: string = '', limit: number = 10) => {
  const res = await api.get('/prediccion/equipos/buscar', {
    params: { search, limit }
  });
  return res.data.data;
};

// 📊 Predicción para un equipo específico (nuevo - reemplaza el getAll)
export const getPrediccionPorEquipo = async (equipoId: number) => {
  const res = await api.get(`/prediccion/equipos/${equipoId}`);
  return res.data.data;
};

// 🔝 Top 5 equipos más prestados con predicción
export const getTop5PrediccionesPorEquipo = async () => {
  const res = await api.get('/prediccion/reservas/top5');
  return res.data.data;
};

// OBSOLETO - Eliminar este servicio ya que es ineficiente
// export const getPrediccionesPorEquipo = async () => {
//   const res = await api.get('/prediccion/reservas/por-equipo');
//   return res.data.data;
// };