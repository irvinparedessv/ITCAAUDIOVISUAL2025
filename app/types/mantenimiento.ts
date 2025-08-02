import type { Equipo } from "./item";

export interface Marca {
  id: number;
  nombre: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  marca: Marca;
}

// export interface Equipo {
//   id: number;
//   numero_serie: string;
//   modelo: Modelo;
// }

export interface TipoMantenimiento {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombre?: string;
  first_name?: string;
  last_name?: string;
}

export interface Mantenimiento {
  id: number;
  equipo_id: number;
  tipo_mantenimiento_id: number;
  user_id: number;
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;
  hora_mantenimiento_final: string;
  detalles: string;
  vida_util: number | null;
  created_at: string;
  updated_at: string;

  equipo: Equipo;
  tipo_mantenimiento?: TipoMantenimiento; // <- Nombre correcto desde backend
  usuario?: Usuario;                     // <- Nombre correcto desde backend
}

