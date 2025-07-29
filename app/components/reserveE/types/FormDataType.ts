import type { EquipmentSeleccionado, EquipoResumen } from "./Equipos";
import type { OptionType } from "./Common";

export interface FormDataType {
  date: string;
  startTime: string;
  endTime: string;
  tipoReserva: OptionType | null;
  equipment: EquipmentSeleccionado[];
  aula: Aula | null;
  modelFile?: File | null;
}

export interface Aula {
  value: string;
  label: string;
  path_modelo: string;
  escala: number;
}
