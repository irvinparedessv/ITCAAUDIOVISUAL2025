export interface TipoEquipo {
  id: number;
  nombre: string;
  is_deleted: boolean;
  categoria_id: number;
   caracteristicas?: CaracteristicaTipoEquipo[]; 
}

export interface Categoria {
  id: number;
  nombre: string;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CaracteristicaTipoEquipo {
  id: number;
  valor: string;
}