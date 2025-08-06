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

export const getMantenimientos = async (filters: {
  search?: string;
  page?: number;
  per_page?: number;
  tipo_id?: number;
  estado_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  vida_util_min?: number;
  vida_util_max?: number;
}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.tipo_id) params.append('tipo_id', filters.tipo_id.toString());
  if (filters.estado_id) params.append('estado_id', filters.estado_id.toString());
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
  if (filters.vida_util_min) params.append('vida_util_min', filters.vida_util_min.toString());
  if (filters.vida_util_max) params.append('vida_util_max', filters.vida_util_max.toString());

  const response = await api.get(`/mantenimientos?${params.toString()}`);
  return response.data;
};


export const getMantenimientoById = async (id: number) => {
  const response = await api.get(`/mantenimientos/${id}`);
  return response.data;
};

export const createMantenimiento = async (mantenimientoData: Partial<Mantenimiento>) => {
  try {
    const response = await api.post("/mantenimientos", mantenimientoData);
    return {
      success: true,
      data: response.data.data, // Accede a la propiedad data anidada
      message: response.data.message
    };
  } catch (error: any) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || "Error al crear mantenimiento",
        error: error.response.data
      };
    }
    return {
      success: false,
      message: "Error de conexión al crear mantenimiento"
    };
  }
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

export const updateVidaUtilMantenimiento = async (id: number, vidaUtil: number, comentario?: string) => {
  try {
    const response = await api.put(`/mantenimientos/${id}/vida-util`, {
      vida_util: vidaUtil,
      comentario: comentario
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al actualizar vida útil');
  }
};
