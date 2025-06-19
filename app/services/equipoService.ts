import api from "../api/axios";
import type {
  Equipo,
  EquipoCreateDTO,
  EquipoUpdateDTO,
} from "app/types/equipo";

//const API_URL = 'http://localhost:8000/api/equipos'

export interface EquipoFilters {
  search?: string;
  page?: number;
  perPage?: number;
  tipoEquipoId?: number;
}

export const getEquipos = async (
  filters: EquipoFilters = {}
): Promise<{ data: Equipo[]; total: number; current_page: number; per_page: number; last_page: number }> => {
  try {
    const res = await api.get("/equipos", {
      params: {
        search: filters.search ?? "",
        page: filters.page ?? 1,
        per_page: filters.perPage ?? 5,
        tipo_equipo_id: filters.tipoEquipoId ?? undefined,
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


export const createEquipo = async (equipo: EquipoCreateDTO) => {
  const formData = new FormData();

  formData.append("nombre", equipo.nombre);
  formData.append("descripcion", equipo.descripcion);
  formData.append("estado", equipo.estado ? "1" : "0");
  formData.append("cantidad", equipo.cantidad.toString());
  formData.append("tipo_equipo_id", equipo.tipo_equipo_id.toString());
  formData.append("tipo_reserva_id", equipo.tipo_reserva_id.toString());
  formData.append("is_deleted", "0"); // ← Esto soluciona el 422

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
