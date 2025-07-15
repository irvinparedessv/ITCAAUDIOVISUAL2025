export type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

export type OptionType = {
  value: string;
  label: string;
  tipo?: string;
  tipo_equipo_id?: string;
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
  type: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  titulo: string;
  fecha_fin?: string;
  dias: string[];
};
