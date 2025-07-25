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
  const { modeloId, page = 1, perPage = 10 } = filters;

  if (!modeloId) {
    throw new Error("modeloId es requerido");
  }

  const url = `/inventario/modelo/${modeloId}`;

  const params = {
    page,
    perPage,
  };

  const res = await api.get(url, { params });

  return res.data;
};

export const getItemById = async (id: number, tipo: 'equipo' | 'insumo'): Promise<Item> => {
  const res = await api.get(`/equipos/${id}`, {
    params: { tipo },
  });
  return res.data;
};

export const createItem = async (formData: FormData, tipo: 'equipo' | 'insumo') => {
  try {
    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const response = await api.post("/equipos", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: { tipo } // Send type as query parameter if needed
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Detailed error:", error);
    if (error.response) {
      console.error("Backend response:", error.response.data);
      throw new Error(error.response.data.message || "Error al crear el ítem");
    }
    throw new Error(error.message || "Error de conexión");
  }
};

export const updateItem = async (
  id: number,
  formData: FormData,
  tipo: 'equipo' | 'insumo'
) => {
  // Agrega tipo y método PUT (si tu backend usa form method spoofing)
  formData.append("tipo", tipo);
  formData.append("_method", "PUT");

  // Debug: Imprimir contenido de FormData
  console.log("Contenido de formData en updateItem:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  try {
    const res = await api.post(`/equipos/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;

  } catch (error: any) {
    console.error("Error detallado en updateItem:", error);

    // Captura el mensaje del backend si está disponible
    if (error.response) {
      console.error("Respuesta del backend:", error.response.data);
      throw new Error(error.response.data.message || "Error al actualizar el ítem");
    }

    throw new Error(error.message || "Error de conexión al actualizar");
  }
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
    
    if (!Array.isArray(res.data)) {
      throw new Error("Formato de respuesta inesperado");
    }
    
    return res.data;
  } catch (error) {
    console.error("Error en searchMarcas:", error);
    throw error; // Deja que el componente maneje el toast
  }
};

// Agrega esta función a tu archivo de servicios (itemService.ts)
export const searchTipoEquipo = async (inputValue: string): Promise<TipoEquipo[]> => {
  try {
    const res = await api.get("/tipoEquipos", {
      params: { 
        search: inputValue || undefined,
        limit: 5
      }
    });
    return res.data;
  } catch (error) {
    console.error("Error en searchTipoEquipo:", error);
    throw error;
  }
};
