import api from "../api/axios";

export const getPrediccion = async (tipo_equipo_id?: number, meses = 6) => {
  const params = tipo_equipo_id ? { tipo_equipo_id, meses } : { meses };
  const res = await api.get('/prediccion/reservas', { params });
  return res.data.data;
};

export const getPrediccionesPorTipo = async () => {
  const res = await api.get('/prediccion/reservas/por-tipo');
  return res.data.data;
};
