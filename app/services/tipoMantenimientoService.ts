import axios from "axios";
import { toast } from "react-toastify";
import type { TipoMantenimiento } from "app/types/tipoMantenimiento";
import api from "../api/axios";

// Obtener todos los tipos de mantenimiento
export const getTiposMantenimiento = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  
  const response = await api.get(`/tipoMantenimiento?${params.toString()}`);
  return response.data.data || [];
};


// Obtener tipo mantenimiento por ID
export const getTipoMantenimientoById = async (id: number): Promise<TipoMantenimiento> => {
  try {
    const res = await api.get(`/tipoMantenimiento/${id}`); // singular
    return res.data.data || res.data;
  } catch (error) {
    console.error(`Error al obtener tipo mantenimiento con ID ${id}:`, error);
    throw error;
  }
};

// Crear tipo de mantenimiento
export const createTipoMantenimiento = async (data: {
  nombre: string;
  estado: boolean;
}) => {
  try {
    const res = await api.post("/tipoMantenimiento", data); // singular
    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error del backend:", error.response.data);
      toast.error(error.response.data.message || "Error al crear tipo de mantenimiento");
    } else {
      console.error("Error inesperado:", error);
      toast.error("Error inesperado al crear tipo de mantenimiento");
    }
    throw error;
  }
};

// Actualizar tipo mantenimiento
export const updateTipoMantenimiento = async (
  id: number,
  data: { nombre: string; estado: boolean }
) => {
  try {
    const res = await api.put(`/tipoMantenimiento/${id}`, data);
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
      toast.error("Error inesperado al actualizar tipo de mantenimiento");
    }
    throw error;
  }
};


// Eliminar tipo mantenimiento
export const deleteTipoMantenimiento = async (id: number) => {
  try {
    const res = await api.delete(`/tipoMantenimiento/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error(`Error al eliminar tipo de mantenimiento con ID ${id}:`, error);

    if (axios.isAxiosError(error) && error.response) {
      // Aquí lees el mensaje que manda Laravel, por ejemplo el detalle del error en error.response.data.message
      const message =
        error.response.data.message ||
        "Error al eliminar el tipo de mantenimiento. Puede que esté siendo usado.";

      return { success: false, message };
    }
    return { success: false, message: "Error inesperado al eliminar." };
  }
};
