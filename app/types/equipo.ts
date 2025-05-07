export interface Equipo {
  id: number
  nombre: string
  descripcion: string
  estado: boolean
  cantidad: number
  is_deleted: boolean
  tipo_equipo_id: number
  imagen: string
  imagen_url?: string
}
  
export type EquipoCreateDTO = Omit<Equipo, 'id' | 'is_deleted' | 'imagen' | 'imagen_url'> & {
  imagen?: File | null
}
  export type EquipoUpdateDTO = Partial<EquipoCreateDTO>