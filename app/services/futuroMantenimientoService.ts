import axios from "axios";
import { toast } from "react-toastify";
import type {
  FuturoMantenimiento,
  FuturoMantenimientoCreateDTO,
  FuturoMantenimientoUpdateDTO,
} from "../types/futuroMantenimiento";
import api from "../api/axios";

// Listar todos los futuros mantenimientos (respuesta paginada)
export const getFuturosMantenimiento = async () => {
  try {
    const res = await api.get("/futuroMantenimiento"); // Asegúrate que la ruta sea correcta
    return res.data; // Esto incluye { data: [...], current_page, etc. }
  } catch (error) {
    console.error("Error al obtener mantenimientos futuros:", error);
    throw error;
  }
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
