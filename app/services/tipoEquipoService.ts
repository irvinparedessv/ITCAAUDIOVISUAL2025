import api from "../api/axios";
import type { Categoria, TipoEquipo } from "app/types/tipoEquipo";

interface TipoEquipoResponse {
  data: TipoEquipo[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await api.get("/categorias");
  return Array.isArray(res.data) ? res.data : res.data.data; // por si acaso
};


export const getCaracteristicas = async () => {
  const res = await api.get("/caracteristicas");
  return res.data;
};

export const getTipoEquipo = async (page = 1): Promise<TipoEquipoResponse> => {
  try {
    const res = await api.get(`/obtenerTipo?page=${page}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener los tipos de equipo:", error);
    throw error;
  }
};

export async function getTipoEquipoById(id: string): Promise<TipoEquipo> {
  const res = await api.get(`/tipoEquipos/${id}`);
  return res.data;
}

export const getTipoEquipos = async (): Promise<TipoEquipo[]> => {
  try {
    const res = await api.get("/tipoEquipos");
    return res.data;
  } catch (error) {
    console.error("Error al obtener los tipos de equipo:", error);
    throw error;
  }
};


export const createTipoEquipo = async (data: {
  nombre: string;
  categoria_id: number;
  caracteristicas: Array<{
    id?: number;
    nombre?: string;
    tipo_dato?: string;
  }>;
}) => {
  const response = await api.post('/tipoEquipos', data);
  return response.data;
};

export const updateTipoEquipo = async (id: number, data: {
  nombre: string;
  categoria_id: number;
  caracteristicas: Array<{
    id?: number;
    nombre?: string;
    tipo_dato?: string;
  }>;
}) => {
  const response = await api.put(`/tipoEquipos/${id}`, data);
  return response.data;
};

export const deleteTipoEquipo = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const res = await api.delete(`/tipoEquipos/${id}`);
    return res.data;
  } catch (error) {
    console.error(
      `Error al eliminar (lógicamente) el tipo de equipo con ID ${id}:`,
      error
    );
    throw error;
  }
};

export async function createCaracteristica(data: {
  nombre: string;
  tipo_dato: string;
}) {
  const response = await api.post("/nuevaCaracteristica", data);
  return response.data;
}
