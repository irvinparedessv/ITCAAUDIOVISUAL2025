import api from "../api/axios";
import type { TipoEquipo } from "app/types/tipoEquipo";

interface TipoEquipoResponse {
  data: TipoEquipo[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const getTipoEquipo = async (page = 1): Promise<TipoEquipoResponse> => {
  try {
    const res = await api.get(`/obtenerTipo?page=${page}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener los tipos de equipo:", error);
    throw error;
  }
};

export const getTipoEquipos = async (): Promise<TipoEquipo[]> => {
  try {
    const res = await api.get("/tipoEquipos");
    return res.data;
  } catch (error) {
    console.error("Error al obtener los tipos de equipo:", error);
    throw error;
  }
};

export const createTipoEquipo = async (
  tipoEquipo: Omit<TipoEquipo, "id" | "is_deleted">
): Promise<TipoEquipo> => {
  try {
    const res = await api.post("/tipoEquipos", tipoEquipo);
    return res.data;
  } catch (error) {
    console.error("Error al crear el tipo de equipo:", error);
    throw error;
  }
};

export const updateTipoEquipo = async (
  id: number,
  tipoEquipo: Partial<Omit<TipoEquipo, "id" | "is_deleted">>
): Promise<TipoEquipo> => {
  try {
    const res = await api.put(`/tipoEquipos/${id}`, tipoEquipo);
    return res.data;
  } catch (error) {
    console.error(`Error al actualizar el tipo de equipo con ID ${id}:`, error);
    throw error;
  }
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
