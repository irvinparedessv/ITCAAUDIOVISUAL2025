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
} from "../types/item";

export interface ItemFilters {
  tipo?: 'equipos' | 'insumos' | 'todos';
  search?: string;
  page?: number;
  perPage?: number;
  tipoEquipoId?: number;
  marcaId?: number;
  estadoId?: number;
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
  const res = await api.get("/equipos", {
    params: {
      tipo: filters.tipo ?? 'todos',
      search: filters.search,
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 10,
      tipo_equipo_id: filters.tipoEquipoId,
      marca_id: filters.marcaId,
      estado_id: filters.estadoId,
    },
  });
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
  formData.append("marca_id", data.marca_id.toString());
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
  data: EquipoUpdateDTO | InsumoUpdateDTO,
  tipo: 'equipo' | 'insumo'
) => {
  const formData = new FormData();

  formData.append("tipo", tipo);

  if (data.tipo_equipo_id) formData.append("tipo_equipo_id", data.tipo_equipo_id.toString());
  if (data.marca_id) formData.append("marca_id", data.marca_id.toString());
  if (data.modelo_id) formData.append("modelo_id", data.modelo_id.toString());
  if (data.estado_id) formData.append("estado_id", data.estado_id.toString());
  if (data.tipo_reserva_id) formData.append("tipo_reserva_id", data.tipo_reserva_id.toString());
  if (data.fecha_adquisicion) formData.append("fecha_adquisicion", data.fecha_adquisicion);
  if (data.detalles) formData.append("detalles", data.detalles);

  if (tipo === 'equipo' && 'numero_serie' in data && data.numero_serie)
    formData.append("numero_serie", data.numero_serie);

  if (tipo === 'equipo' && 'vida_util' in data && data.vida_util !== undefined)
    formData.append("vida_util", data.vida_util!.toString());

  if (tipo === 'insumo' && 'cantidad' in data)
    formData.append("cantidad", data.cantidad!.toString());

  if ((data as any).imagen) formData.append("imagen", (data as any).imagen);

  const res = await api.post(`/equipos/${id}?_method=PUT`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
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
