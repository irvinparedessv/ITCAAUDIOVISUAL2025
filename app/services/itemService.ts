import type { TipoEquipo } from "~/types/tipoEquipo";
import api from "../api/axios";
import type {
  Item,
  EquipoCreateDTO,
  EquipoUpdateDTO,
  InsumoCreateDTO,
  InsumoUpdateDTO,
  PaginatedItems,
  Marca,
  Modelo,
  Estado,
  Caracteristica,
  Insumo,
} from "../types/item";

export interface ItemFilters {
  tipo?: 'equipos' | 'insumos' | 'todos';
  search?: string;
  page?: number;
  perPage?: number;
  tipoEquipoId?: number;
  marcaId?: number;
  estadoId?: number;
  modeloId?: number;
}

export const getMarcas = async (): Promise<Marca[]> => {
  const res = await api.get("/marcas");
  return res.data;
};

export const getModelos = async (): Promise<Modelo[]> => {
  const res = await api.get("/modelos");
  return res.data;
};

export const getEstados = async (): Promise<Estado[]> => {
  const res = await api.get("/estados");
  return res.data;
};

export const getItems = async (
  filters: ItemFilters = {}
): Promise<PaginatedItems> => {
  const {
    modeloId,
    page = 1,
    perPage = 10,
    search,
    tipoEquipoId,
    estadoId,
    // Agrega aquí otros filtros que necesites
  } = filters;

  if (!modeloId) {
    throw new Error("modeloId es requerido");
  }

  const url = `/inventario/modelo/${modeloId}`;

  // Construye los parámetros de consulta
  const params: Record<string, any> = {
    page,
    perPage,
  };

  // Agrega los filtros solo si tienen valor
  if (search) params.search = search;
  if (tipoEquipoId) params.tipo_equipo_id = tipoEquipoId;
  if (estadoId) params.estado_id = estadoId;
  // Agrega aquí otros filtros de la misma manera

  const res = await api.get(url, { params });

  return res.data;
};

export const getItemById = async (id: number, tipo: 'equipo' | 'insumo'): Promise<Item> => {
  const res = await api.get(`/equipoInsumo/${id}`, {
    params: { tipo },
  });
  return res.data;
};

// Versión limpia
export const createItem = async (formData: FormData, tipo: 'equipo' | 'insumo') => {
  return await api.post("/equipos", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: { tipo }
  });
};


export const updateItem = async (
  id: number,
  formData: FormData,
  tipo: 'equipo' | 'insumo'
) => {
  formData.append("tipo", tipo);
  formData.append("_method", "PUT");

  return await api.post(`/equipos/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


export const actualizarValoresCaracteristicasPorEquipo = async (
  equipoId: number,
  caracteristicas: any[]
) => {
  // Mapeamos para enviar solo los campos que espera el backend
  const dataFormateada = caracteristicas.map(c => ({
    caracteristica_id: c.id ?? c.caracteristica_id, // por si ya viene como id
    valor: c.valor ?? "", // asegura que exista aunque sea vacío
  }));

  console.log("Datos que se enviarán a actualizarValoresCaracteristicasPorEquipo:", dataFormateada);

  // Dependiendo de cómo espera el backend, puedes enviar JSON string o directamente objeto
  // Aquí te dejo ambas opciones, usa la que funcione en tu backend:

  // Opción 1: enviar como JSON string (si backend espera así)
  /*
  const res = await api.post(`/valores-caracteristica/equipo/${equipoId}/actualizar`, {
    caracteristicas: JSON.stringify(dataFormateada),
  });
  */

  // Opción 2: enviar como objeto normal (más común y recomendable)
  const res = await api.post(`/valores-caracteristica/equipo/${equipoId}/actualizar`, {
    caracteristicas: dataFormateada,
  });

  return res.data;
};

export const deleteItem = async (id: number, tipo: 'equipo' | 'insumo') => {
  const res = await api.delete(`/equipos/${id}`, {
    params: { tipo },
  });
  return res.data;
};

export const getEquiposPorTipoReserva = async (tipoReservaId: number) => {
  const res = await api.get(`/equipos/por-tipo-reserva/${tipoReservaId}`);
  return res.data;
};

export const getCaracteristicasPorTipoEquipo = async (
  tipoEquipoId: number
): Promise<Caracteristica[]> => {
  const res = await api.get(`/caracteristicas/tipo-equipo/${tipoEquipoId}`);
  return res.data;
};

export const getInsumosNoAsignados = async (equipoId: number): Promise<Insumo[]> => {
  const res = await api.get(`/equipos/${equipoId}/insumos/no-asignados`);
  return res.data;
};

export const asignarInsumoAEquipo = async (equipoId: number, modeloId: number) => {
  await api.post(`/equipos/${equipoId}/insumos`, { modelo_id: modeloId });
};

export const getValoresCaracteristicasPorEquipo = async (equipoId: number) => {
  const res = await api.get(`/valores-caracteristica/equipo/${equipoId}`);
  return res.data; // [{ id, valor, caracteristica: { id, nombre, tipo_dato } }]
};

export async function eliminarAsignacion(insumoId: number, equipoId: number) {
  const response = await api.delete(`/equipos/${equipoId}/asignaciones/${insumoId}`);
  return response.data;
}

export const getModelosByMarca = async (marcaId: number, search?: string): Promise<Modelo[]> => {
  const res = await api.get(`/modelos/por-marca/${marcaId}`, {
    params: { search }
  });
  return res.data;
};

// Agrega esta nueva función a tus exports
export const searchMarcas = async (
  searchTerm?: string,
  limit?: number
): Promise<Marca[]> => {
  try {
    const res = await api.get("/marcas", {
      params: {
        search: searchTerm || undefined,
        limit: limit || undefined
      }
    });

    // Maneja respuesta paginada (Laravel) o array directo
    const marcas = res.data.data || res.data;

    if (!Array.isArray(marcas)) {
      console.error("Formato de respuesta inválido:", res.data);
      throw new Error("La respuesta no contiene un array de marcas");
    }

    return marcas;

  } catch (error) {
    console.error("Error en searchMarcas:", {
      searchTerm,
      limit,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
};

// Agrega esta función a tu archivo de servicios (itemService.ts)
export const searchTipoEquipo = async (inputValue: string): Promise<{ value: number, label: string }[]> => {
  try {
    const res = await api.get("/tipoEquipos", {
      params: {
        search: inputValue || undefined,
        limit: 5
      }
    });

    // Opción 1: Si la respuesta es un array directo
    if (Array.isArray(res.data)) {
      return res.data.map((tipo: TipoEquipo) => ({
        value: tipo.id,
        label: tipo.nombre
      }));
    }

    // Opción 2: Si la respuesta está paginada (Laravel)
    if (res.data.data && Array.isArray(res.data.data)) {
      return res.data.data.map((tipo: TipoEquipo) => ({
        value: tipo.id,
        label: tipo.nombre
      }));
    }

    // Opción 3: Si la respuesta es un objeto con otra estructura
    throw new Error("Formato de respuesta no soportado");

  } catch (error) {
    console.error("Error buscando tipos de equipo:", error);
    return []; // Retorna array vacío para que el select no falle
  }
};

export const getModelosByMarcaYTipo = async (
  marcaId: number,
  tipoEquipoId?: number,
  search?: string,
  loadInitial?: boolean // Nuevo parámetro para cargar inicial
): Promise<{ value: number, label: string }[]> => {
  try {
    const res = await api.get(`/modelos/por-marca-tipo/${marcaId}`, {
      params: {
        tipoEquipoId: tipoEquipoId || undefined,
        search: search || undefined,
        limit: loadInitial ? 5 : undefined // Envía límite solo para carga inicial
      }
    });

    const modelos = res.data.data || res.data;
    return modelos.map((modelo: Modelo) => ({
      value: modelo.id,
      label: modelo.nombre
    }));

  } catch (error) {
    console.error("Error cargando modelos:", error);
    return [];
  }
  
};


export async function getModelosByTipo(
  marcaId: number,
  tipoEquipoId: number
): Promise<{ value: number; label: string }[]> {
  const response = await api.get("/modelos/por-marca-y-tipo", {
    params: { marca_id: marcaId, tipo_equipo_id: tipoEquipoId },
  });

  return response.data.map((m: any) => ({
    value: m.id,
    label: m.nombre,
  }));
}
