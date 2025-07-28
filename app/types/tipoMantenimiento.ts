// types/tipoMantenimiento.ts

export interface TipoMantenimiento {
  id: number;
  nombre: string;
  estado: boolean; // en backend es booleano (true=activo, false=inactivo)
  created_at?: string;
  updated_at?: string;
}

// Para crear un nuevo tipo de mantenimiento (no tiene id todavía)
export type TipoMantenimientoCreateDTO = Omit<TipoMantenimiento, "id" | "created_at" | "updated_at">;

// Para actualizar un tipo de mantenimiento (id requerido)
export type TipoMantenimientoUpdateDTO = {
  id: number;
  nombre: string;
  estado: boolean;
};
