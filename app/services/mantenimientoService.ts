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

export const getMantenimientos = async (
  token: string,
  filters: {
    page?: number;
    per_page?: number;   // Corregido a minúscula p
    tipo_id?: number;    // El backend traduce a tipo_mantenimiento_id
    equipo_id?: number;
  }
): Promise<PaginatedResponse<Mantenimiento>> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.per_page) params.append("per_page", filters.per_page.toString());

  if (filters.tipo_id) params.append("tipo_mantenimiento_id", filters.tipo_id.toString());
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

export const deleteMantenimiento = async (id: number, token: string) => {
  const response = await axios.delete(`${API_URL}/mantenimientos/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

