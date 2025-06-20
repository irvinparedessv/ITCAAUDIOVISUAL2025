export interface Equipo {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  cantidad: number;
  is_deleted: boolean;
  tipo_equipo_id: number;
  tipo_reserva_id: number;
  imagen: string; // Nombre/URL de la imagen en el servidor
  imagen_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type EquipoCreateDTO = Omit<Equipo, 'id' | 'is_deleted' | 'imagen' | 'created_at' | 'updated_at'> & {
  imagen?: File | null; // Para nuevos archivos subidos
};

// Tipo mejorado para actualización
export type EquipoUpdateDTO = Omit<Partial<EquipoCreateDTO>, 'imagen'> & {
  id: number;
  imagen?: File | null | string; // File: nueva imagen, null: eliminar, string: mantener existente
};

// Tipos para disponibilidad de equipos
export type Equipment = {
  id: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  tipo_equipo: {
    id: number;
    nombre: string;
  };
  disponibilidad?: {
    cantidad_total: number;
    cantidad_disponible: number;
    cantidad_en_reserva: number;
    cantidad_entregada: number;
    porcentaje_disponible: number;
  };
};

export type AvailabilityData = {
  fecha: Date | null;
  startTime: string;
  endTime: string;
  equipo_id?: number; // Opcional: filtro por equipo específico
};

// Tipo para respuesta paginada
export type PaginatedEquipos = {
  data: Equipo[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
};

// Tipo para filtros de búsqueda
export type EquipoFilters = {
  search?: string;
  page?: number;
  perPage?: number;
  tipoEquipoId?: number;
  estado?: boolean;
  includeDeleted?: boolean;
};

// Tipo para el listado de tipos de equipo (por ejemplo: Proyector, Laptop, etc.)
export interface TipoEquipo {
  id: number;
  nombre: string;
}
