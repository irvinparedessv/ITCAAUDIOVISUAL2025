export type ItemTipo = 'equipo' | 'insumo';

export interface Marca {
  id: number;
  nombre: string;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  marca_id: number;
  imagen_normal?: string;
  imagen_gbl?: string;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
  marca?: Marca; // Relación opcional
}


export interface ItemBase {
  id: number;
  detalles?: string;
  estado_id: number;
  tipo_equipo_id: number;
  marca_id: number;
  modelo_id: number;
  tipo_reserva_id?: number;
  fecha_adquisicion?: string;
  imagen_url?: string;
  created_at?: string;
  updated_at?: string;
  tipo: ItemTipo;

  // Relaciones opcionales
  marca?: Marca;
  modelo?: Modelo;
}

// En tus tipos de item (donde defines Marca, Modelo, etc.)
export interface Estado {
  id: number;
  nombre: string;
}

// Equipo
export interface Equipo extends ItemBase {
  numero_serie: string;
  vida_util?: number;
}

// Insumo
export interface Insumo extends ItemBase {
  cantidad: number;
}

// Tipos para crear
export type EquipoCreateDTO = Omit<Equipo, 'id' | 'tipo' | 'imagen_url' | 'created_at' | 'updated_at'> & {
  imagen?: File | null;
};

export type InsumoCreateDTO = Omit<Insumo, 'id' | 'tipo' | 'imagen_url' | 'created_at' | 'updated_at'> & {
  imagen?: File | null;
};

// Tipos para actualizar
export type EquipoUpdateDTO = Partial<EquipoCreateDTO> & { id: number };
export type InsumoUpdateDTO = Partial<InsumoCreateDTO> & { id: number };

// Tipo mixto para resultados
export type Item = Equipo | Insumo;

export interface PaginatedItems<T = Item> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}
