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
  fecha_mantenimiento_final: string | null;
  hora_mantenimiento_inicio: string;
  hora_mantenimiento_final: string | null;
  detalles: string;
  comentario: string;
  vida_util: number | null;
  estado_equipo_inicial: number | null;
  estado_equipo_final: number | null;
  created_at: string;
  updated_at: string;

  equipo: Equipo;
  tipo_mantenimiento?: TipoMantenimiento;
  usuario?: Usuario;
}

