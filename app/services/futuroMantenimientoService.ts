import axios from "axios";
import { toast } from "react-toastify";
import type {
  FuturoMantenimiento,
  FuturoMantenimientoCreateDTO,
  FuturoMantenimientoUpdateDTO,
} from "../types/futuroMantenimiento";
import api from "../api/axios";

// Listar todos los futuros mantenimientos (respuesta paginada)

export const getFuturosMantenimiento = async (filters: {
  search?: string;
  page?: number;
  per_page?: number;
  tipo_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  futuro_id?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.tipo_id) params.append('tipo_id', filters.tipo_id.toString());
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
  if (filters.futuro_id) params.append('futuro_id', filters.futuro_id.toString());

  const response = await api.get(`/futuroMantenimiento?${params.toString()}`);
  return response.data;
};

// Obtener un futuro mantenimiento por su ID
export const getFuturoMantenimientoById = async (
  id: number
): Promise<FuturoMantenimiento> => {
  try {
    const res = await api.get(`/futuroMantenimiento/${id}`);
    return res.data.data || res.data;
  } catch (error) {
    toast.error("Error al obtener el mantenimiento");
    throw error;
  }
};

// Crear un nuevo futuro mantenimiento
export const createFuturoMantenimiento = async (
  data: FuturoMantenimientoCreateDTO
) => {
  try {
    const res = await api.post("/futuroMantenimiento", data);
    toast.success("Mantenimiento creado correctamente");
    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const respData = error.response.data;
      if (respData.errors) {
        const messages = Object.values(respData.errors).flat().join(", ");
        toast.error("Error de validación: " + messages);
      } else if (respData.message) {
        toast.error(respData.message);
      } else {
        toast.error("Error desconocido al crear.");
      }
    } else {
      toast.error("Error inesperado al crear mantenimiento");
    }
    throw error;
  }
};

// Actualizar un futuro mantenimiento
export const updateFuturoMantenimiento = async (
  id: number,
  data: FuturoMantenimientoUpdateDTO
) => {
  try {
    const res = await api.put(`/futuroMantenimiento/${id}`, data);
    toast.success("Mantenimiento actualizado correctamente");
    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const respData = error.response.data;
      if (respData.errors) {
        const messages = Object.values(respData.errors).flat().join(", ");
        toast.error("Error de validación: " + messages);
      } else if (respData.message) {
        toast.error(respData.message);
      } else {
        toast.error("Error desconocido al actualizar.");
      }
    } else {
      toast.error("Error inesperado al actualizar mantenimiento");
    }
    throw error;
  }
};

// Eliminar un futuro mantenimiento
export const deleteFuturoMantenimiento = async (id: number) => {
  try {
    const res = await api.delete(`/futuroMantenimiento/${id}`);
    toast.success("Mantenimiento eliminado correctamente");
    return { success: true, data: res.data };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const message =
        error.response.data.message ||
        "Error al eliminar el mantenimiento. Puede que esté siendo usado.";
      toast.error(message);
      return { success: false, message };
    }
    toast.error("Error inesperado al eliminar mantenimiento");
    return { success: false, message: "Error inesperado al eliminar." };
  }
};
