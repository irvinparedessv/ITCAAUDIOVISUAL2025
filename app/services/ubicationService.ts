import api from "../api/axios";

export const getUbicaciones = async () => {
  const res = await api.get("/ubicaciones");
  return res.data;
};

export const createUbicacion = async (data: {
  nombre: string;
  descripcion: string;
}) => {
  await api.post("/ubicaciones", data);
};
export const getUbicacionesPaginadas = async (page = 1, perPage = 5, search = "") => {
  const res = await api.get(
    `/ubicaciones/paginate?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`
  );
  return res.data;
};
export const getUbicacionById = async (id: number) => {
  const res = await api.get(`/ubicaciones/${id}`);
  return res.data;
};

export const updateUbicacion = async (
  id: number,
  data: { nombre: string; descripcion: string }
) => {
  await api.put(`/ubicaciones/${id}`, data);
};

export const deleteUbicacion = async (id: number) => {
  await api.delete(`/ubicaciones/${id}`);
};
