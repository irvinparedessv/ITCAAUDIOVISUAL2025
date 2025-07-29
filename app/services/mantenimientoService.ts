import axios from "axios";
import type { Mantenimiento } from "../types/mantenimiento";

const API_URL = "http://localhost:8000/api";

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

// Función para obtener equipos
export const getEquipos = (token: string) => {
  return axios.get(`${API_URL}/equipos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Función para obtener tipos de mantenimiento
export const getTiposMantenimiento = (token: string) => {
  return axios.get(`${API_URL}/tipoMantenimiento`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Función para obtener usuarios
export const getUsuarios = (token: string) => {
  return axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Función para obtener futuros mantenimientos
export const getFuturosMantenimiento = (token: string) => {
  return axios.get(`${API_URL}/futuroMantenimiento`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMantenimientos = async (
  token: string,
  filters: {
    page?: number;
    per_page?: number; // Mantener consistentemente per_page en minúsculas
    tipo_id?: number;  // El backend traduce a tipo_mantenimiento_id
    equipo_id?: number;
  }
): Promise<PaginatedResponse<Mantenimiento>> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.per_page) params.append("perPage", filters.per_page.toString()); // ojo: aquí corregí a "perPage" porque según tu backend usa camelCase
  if (filters.tipo_id) params.append("tipo_mantenimiento_id", filters.tipo_id.toString()); // backend usa tipo_mantenimiento_id
  if (filters.equipo_id) params.append("equipo_id", filters.equipo_id.toString());

  const response = await axios.get<PaginatedResponse<Mantenimiento>>(
    `${API_URL}/mantenimientos?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getMantenimientoById = (id: number) => {
  const token = localStorage.getItem("token") ?? "";
  return axios.get(`${API_URL}/mantenimientos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data);
};


export const createMantenimiento = async (
  token: string,
  mantenimientoData: Partial<Mantenimiento>
) => {
  const response = await axios.post(`${API_URL}/mantenimientos`, mantenimientoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateMantenimiento = async (
  id: number,
  token: string,  // Ahora se espera el token
  mantenimientoData: Partial<Mantenimiento>
): Promise<Mantenimiento> => {
  try {
    const response = await axios.put<Mantenimiento>(`${API_URL}/mantenimientos/${id}`, mantenimientoData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Error al actualizar el mantenimiento");
    }
    throw new Error("Error inesperado al actualizar el mantenimiento");
  }
};


export const deleteMantenimiento = async (id: number, token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/mantenimientos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      message: response.data.message || "Mantenimiento eliminado correctamente",
    };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data.message || "Error al eliminar mantenimiento",
      };
    }
    return { success: false, message: "Error inesperado al eliminar mantenimiento" };
  }
};  