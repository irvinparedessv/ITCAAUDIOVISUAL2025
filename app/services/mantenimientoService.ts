// mantenimientoService.ts
import api from "../api/axios";// importa tu instancia con interceptor
import type { Mantenimiento } from "../types/mantenimiento";

export interface PaginationLinks {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLinks[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export const getTiposMantenimiento = async () => {
  const response = await api.get("/tipoMantenimiento");
  return response.data;
};

export const getMantenimientos = async (
  filters: {
    page?: number;
    per_page?: number;
    tipo_id?: number;
    equipo_id?: number;
  }
): Promise<PaginatedResponse<Mantenimiento>> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.per_page) params.append("perPage", filters.per_page.toString()); // ajusta según backend
  if (filters.tipo_id) params.append("tipo_mantenimiento_id", filters.tipo_id.toString());
  if (filters.equipo_id) params.append("equipo_id", filters.equipo_id.toString());

  const response = await api.get(`/mantenimientos?${params.toString()}`);
  return response.data;
};

export const getMantenimientoById = async (id: number) => {
  const response = await api.get(`/mantenimientos/${id}`);
  return response.data;
};

export const createMantenimiento = async (mantenimientoData: Partial<Mantenimiento>) => {
  const response = await api.post("/mantenimientos", mantenimientoData);
  return response.data;
};

export const updateMantenimiento = async (
  id: number,
  mantenimientoData: Partial<Mantenimiento>
): Promise<Mantenimiento> => {
  try {
    const response = await api.put<Mantenimiento>(`/mantenimientos/${id}`, mantenimientoData);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || "Error al actualizar el mantenimiento");
    }
    throw new Error("Error inesperado al actualizar el mantenimiento");
  }
};

export const deleteMantenimiento = async (id: number) => {
  try {
    const response = await api.delete(`/mantenimientos/${id}`);
    return {
      success: true,
      message: response.data.message || "Mantenimiento eliminado correctamente",
    };
  } catch (error: any) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || "Error al eliminar mantenimiento",
      };
    }
    return { success: false, message: "Error inesperado al eliminar mantenimiento" };
  }
};
