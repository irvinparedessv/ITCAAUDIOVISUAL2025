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


// Esto representa una característica que puede tener un tipo de equipo
export interface CaracteristicaTipoEquipo {
  id: number;
  nombre: string;
  tipo_dato: string;
}

// Esto representa una característica CON valor ya asignado a un equipo
export interface CaracteristicaConValor {
  id: number;
  nombre: string;
  tipo_dato: string;
  caracteristica_id: number; // opcional si lo quieres explícito
  valor: string;
}
