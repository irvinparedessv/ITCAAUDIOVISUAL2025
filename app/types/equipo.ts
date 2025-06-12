export interface Equipo {
  id: number
  nombre: string
  descripcion: string
  estado: boolean
  cantidad: number
  is_deleted: boolean
  tipo_equipo_id: number
  tipo_reserva_id: number
  imagen: string
  imagen_url?: string
}
  
export type EquipoCreateDTO = Omit<Equipo, 'id' | 'is_deleted' | 'imagen' | 'imagen_url'> & {
  imagen?: File | null;
};

export type EquipoUpdateDTO = Partial<EquipoCreateDTO>


// EQUPMENT AVAILABILITY
export type Equipment = {
  id: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  tipo_equipo: {
    nombre: string;
  };
  disponibilidad?: {
    cantidad_total: number;
    cantidad_disponible: number;
    cantidad_en_reserva: number;
    cantidad_entregada: number;
  };
};

export type AvailabilityData = {
  fecha: Date | null;
  startTime: string;
  endTime: string;
};
