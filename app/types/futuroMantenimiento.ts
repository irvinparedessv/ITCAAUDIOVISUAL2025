import type { Equipo } from "./item";
import type { Usuario } from "./mantenimiento";

export interface FuturoMantenimiento {
  id: number;
  equipo_id: number;
  tipo_mantenimiento_id: number;
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;
  equipo: Equipo;
  usuario?: Usuario;  
  tipo_mantenimiento?: {
    id: number;
    nombre: string;
  };
  fecha_mantenimiento_final: string | null;
  hora_mantenimiento_final: string | null;
  detalles: string; 
}

export interface FuturoMantenimientoCreateDTO {
  equipo_id: number;
  tipo_mantenimiento_id: number;
  fecha_mantenimiento: string;            
  hora_mantenimiento_inicio: string;   
  fecha_mantenimiento_final: string | null;
  hora_mantenimiento_final: string | null;
  detalles: string;  
}

export interface FuturoMantenimientoUpdateDTO {
  equipo_id?: number;
  tipo_mantenimiento_id?: number;
  fecha_mantenimiento?: string;
  hora_mantenimiento_inicio?: string;
  fecha_mantenimiento_final: string | null;
  hora_mantenimiento_final: string | null;
  detalles: string;
}
