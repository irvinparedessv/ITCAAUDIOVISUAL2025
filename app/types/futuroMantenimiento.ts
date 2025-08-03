export interface FuturoMantenimiento {
  id: number;
  equipo_id: number;
  tipo_mantenimiento_id: number;
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;

  equipo?: {
    id: number;
    numero_serie?: string;
    detalles?: string;
    modelo_id?: number;
    tipo_equipo_id?: number;
  };

  tipo_mantenimiento?: {
    id: number;
    nombre: string;
  };
}


export interface FuturoMantenimientoCreateDTO {
  equipo_id: number;
  tipo_mantenimiento_id: number;
  fecha_mantenimiento: string;            // requerido
  hora_mantenimiento_inicio: string;     // requerido HH:mm:ss
}

export interface FuturoMantenimientoUpdateDTO {
  equipo_id?: number;
  tipo_mantenimiento_id?: number;
  fecha_mantenimiento?: string;
  hora_mantenimiento_inicio?: string;
}
