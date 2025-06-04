export type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

export type OptionType = {
  value: string;
  label: string;
};

export type ReservaData = {
  fecha: string;
  tipo: string;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  equipos: string[];
};
export type ReservaDataRoom = {
  aula: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
};
