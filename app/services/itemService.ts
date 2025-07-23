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

export const getModelosByMarca = async (marcaId: number): Promise<Modelo[]> => {
  const res = await api.get(`/modelos/marca/${marcaId}`);
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

export const createItem = async (data: EquipoCreateDTO | InsumoCreateDTO, tipo: 'equipo' | 'insumo') => {
  const formData = new FormData();

  // Comunes
  formData.append("tipo", tipo);
  formData.append("tipo_equipo_id", data.tipo_equipo_id.toString());
  formData.append("modelo_id", data.modelo_id.toString());
  formData.append("estado_id", data.estado_id.toString());
  if (data.tipo_reserva_id) formData.append("tipo_reserva_id", data.tipo_reserva_id.toString());
  if (data.fecha_adquisicion) formData.append("fecha_adquisicion", data.fecha_adquisicion);
  if (data.detalles) formData.append("detalles", data.detalles);
  if ((data as any).imagen) formData.append("imagen", (data as any).imagen);

  // Específicos
  if (tipo === 'equipo') {
    formData.append("numero_serie", (data as EquipoCreateDTO).numero_serie);
    if ((data as EquipoCreateDTO).vida_util) {
      formData.append("vida_util", (data as EquipoCreateDTO).vida_util!.toString());
    }
  } else {
    formData.append("cantidad", (data as InsumoCreateDTO).cantidad.toString());
  }

  const res = await api.post("/equipos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const updateItem = async (
  id: number,
  formData: FormData,
  tipo: 'equipo' | 'insumo'
) => {
  formData.append("tipo", tipo);
  formData.append("_method", "PUT");

  // Depurar el contenido de FormData
  console.log("Contenido de formData antes de enviar:");
  for (const pair of formData.entries()) {
    console.log(pair[0], ":", pair[1]);
  }

  try {
    const res = await api.post(`/equipos/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error("Error en updateItem:", error);
    throw error; // re-lanzar para manejarlo afuera si quieres
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

export const asignarInsumoAEquipo = async (equipoId: number, insumoId: number) => {
  await api.post(`/equipos/${equipoId}/insumos`, { insumo_id: insumoId });
};

export const getValoresCaracteristicasPorEquipo = async (equipoId: number) => {
  const res = await api.get(`/valores-caracteristica/equipo/${equipoId}`);
  return res.data; // [{ id, valor, caracteristica: { id, nombre, tipo_dato } }]
};


