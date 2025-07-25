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
export interface Caracteristica {
  id: number;
  nombre: string;
  tipo_dato: 'string' | 'integer' | 'decimal' | 'boolean';
}

export interface CaracteristicaValor {
  caracteristica_id: number;
  valor: string | number | boolean;
}



export interface ItemBase {
  id: number;
  detalles?: string;
  estado_id: number;
  tipo_equipo_id: number;
  modelo_id: number;
  cantidad: number;
  tipo_reserva_id?: number;
  fecha_adquisicion?: string;
  imagen_url?: string;
  created_at?: string;
  updated_at?: string;
  tipo: ItemTipo;
  modelo?: Modelo;
  asignaciones?: Array<{
    id: number;
    tipo: 'equipo' | 'insumo';
    modelo: string;
    marca: string;
    numero_serie?: string;
    serie_asociada?: string;
  }>;
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
  serie_asociada?: string | null;
  cantidad: number;
}

// Tipos para crear
export interface CaracteristicaConValor extends Caracteristica {
  valor: string; // Puedes ajustar el tipo según necesites
}

export interface ItemConCaracteristicas extends ItemBase {
  caracteristicas: CaracteristicaConValor[];
}

// Actualiza tus DTOs para incluir características
export interface EquipoCreateDTO extends Omit<Equipo, 'id' | 'tipo' | 'imagen_url' | 'created_at' | 'updated_at'> {
  imagen?: File | null;
  caracteristicas?: CaracteristicaValor[]; // Nuevo campo
}

export interface InsumoCreateDTO extends Omit<Insumo, 'id' | 'tipo' | 'imagen_url' | 'created_at' | 'updated_at'> {
  imagen?: File | null;
  caracteristicas?: CaracteristicaValor[]; // Nuevo campo
}

export interface EquipoUpdateDTO extends Partial<EquipoCreateDTO> {
  id: number;
  caracteristicas?: CaracteristicaValor[]; // Nuevo campo
}

export interface InsumoUpdateDTO extends Partial<InsumoCreateDTO> {
  id: number;
  caracteristicas?: CaracteristicaValor[]; // Nuevo campo
}

// Tipo mixto para resultados
export type Item = Equipo | Insumo;

export interface PaginatedItems<T = Item> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}


