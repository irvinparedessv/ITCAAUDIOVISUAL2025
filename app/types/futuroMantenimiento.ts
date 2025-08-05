import type { Equipo } from "./item";

export interface FuturoMantenimiento {
  id: number;
  equipo_id: number;
  tipo_mantenimiento_id: number;
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;
  equipo: Equipo;

  tipo_mantenimiento?: {
    id: number;
    nombre: string;
  };
}

export interface FuturoMantenimientoCreateDTO {
  equipo_id: number;
  tipo_mantenimiento_id: number;
  fecha_mantenimiento: string;            
  hora_mantenimiento_inicio: string;     
}

export interface FuturoMantenimientoUpdateDTO {
  equipo_id?: number;
  tipo_mantenimiento_id?: number;
  fecha_mantenimiento?: string;
  hora_mantenimiento_inicio?: string;
}
