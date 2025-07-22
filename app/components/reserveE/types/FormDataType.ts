import type { EquipmentSeleccionado, EquipoResumen } from "./Equipos";
import type { OptionType } from "./Common";

export interface FormDataType {
  date: string;
  startTime: string;
  endTime: string;
  tipoReserva: OptionType | null;
  equipment: EquipmentSeleccionado[];
  aula: OptionType | null;
}
