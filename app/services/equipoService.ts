// services/equipoService.ts

import api from "../api/axios";
import type {
  Equipo,
  EquipoCreateDTO,
  EquipoUpdateDTO,
} from "app/types/equipo";

export interface EquipoFilters {
  search?: string;
  page?: number;
  perPage?: number;
  tipoEquipoId?: number;
  estado?: boolean; // ✅ Agregado para que pueda enviarse como filtro
}

/**
 * Obtiene un equipo específico por su ID
 */
export const getEquipoById = async (id: number): Promise<Equipo> => {
  try {
    const response = await api.get(`/equipos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener equipo con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene una lista paginada de equipos con filtros opcionales
 */
export const getEquipos = async (
  filters: EquipoFilters = {},
  equipoId?: string // <-- nuevo parámetro opcional
): Promise<{
  data: Equipo[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}> => {
  try {
    // Si mandan equipoId, trae SOLO ese equipo (sin paginación)
    if (equipoId) {
      const res = await api.get(`/equipos/${equipoId}`);
      return {
        data: [res.data], // metes el equipo individual como array
        total: 1,
        current_page: 1,
        per_page: 1,
        last_page: 1,
      };
    }

    // Normal, lista paginada
    const res = await api.get("/equipos", {
      params: {
        search: filters.search ?? "",
        page: filters.page ?? 1,
        per_page: 20,
        tipo_equipo_id: filters.tipoEquipoId ?? undefined,
        estado: filters.estado !== undefined ? filters.estado : undefined,
      },
    });

    return {
      data: res.data.data,
      total: res.data.total,
      current_page: res.data.current_page,
      per_page: res.data.per_page,
      last_page: res.data.last_page,
    };
  } catch (error) {
    console.error("Error al obtener los equipos:", error);
    throw error;
  }
};

/**
 * Crea un nuevo equipo
 */
export const createEquipo = async (equipo: EquipoCreateDTO) => {
  const formData = new FormData();

  formData.append("nombre", equipo.nombre);
  formData.append("descripcion", equipo.descripcion);
  formData.append("estado", equipo.estado ? "1" : "0");
  formData.append("cantidad", equipo.cantidad.toString());
  formData.append("tipo_equipo_id", equipo.tipo_equipo_id.toString());
  formData.append("tipo_reserva_id", equipo.tipo_reserva_id.toString());
  formData.append("is_deleted", "0");

  if ((equipo as any).imagen) {
    formData.append("imagen", (equipo as any).imagen);
  }

  try {
    const res = await api.post("/equipos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Errores de validación:", error.response.data.errors);
    }
    throw error;
  }
};

/**
 * Actualiza un equipo existente
 */
export const updateEquipo = async (id: number, equipo: EquipoUpdateDTO) => {
  const formData = new FormData();

  if (equipo.nombre !== undefined) formData.append("nombre", equipo.nombre);
  if (equipo.descripcion !== undefined)
    formData.append("descripcion", equipo.descripcion);
  if (equipo.estado !== undefined)
    formData.append("estado", equipo.estado ? "1" : "0");
  if (equipo.cantidad !== undefined)
    formData.append("cantidad", equipo.cantidad.toString());
  if (equipo.tipo_equipo_id !== undefined)
    formData.append("tipo_equipo_id", equipo.tipo_equipo_id.toString());
  if (equipo.tipo_reserva_id !== undefined)
    formData.append("tipo_reserva_id", equipo.tipo_reserva_id.toString());

  if ((equipo as any).imagen) {
    formData.append("imagen", (equipo as any).imagen);
  }

  try {
    const res = await api.post(`/equipos/${id}?_method=PUT`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error al actualizar el equipo con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina lógicamente un equipo
 */
export const deleteEquipo = async (id: number) => {
  try {
    const res = await api.put(`/equipos/${id}`, { is_deleted: true });
    return res.data;
  } catch (error) {
    console.error(
      `Error al eliminar lógicamente el equipo con ID ${id}:`,
      error
    );
    throw error;
  }
};

// Exportación
export default {
  getEquipoById,
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
};
