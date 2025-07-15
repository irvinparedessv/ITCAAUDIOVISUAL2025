export type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

export type OptionType = {
  value: string;
  label: string;
  tipo?: string;
  tipoequipo?: string;
};

export type ReservaData = {
  fecha: string;
  tipo: string;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  equipos: string[];
  documento?: File;
};
export type ReservaDataRoom = {
  aula: string;
  type: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  titulo: string;
  fecha_fin?: string;
  dias: string[];
};
