export interface Equipo {
    id: number
    nombre: string
    descripcion: string
    estado: boolean
    cantidad: number
    is_deleted: boolean
    tipo_equipo_id: number
  }
  
  export type EquipoCreateDTO = Omit<Equipo, 'id' | 'is_deleted'>
  export type EquipoUpdateDTO = Partial<EquipoCreateDTO>