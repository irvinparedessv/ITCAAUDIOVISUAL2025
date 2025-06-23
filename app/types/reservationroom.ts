export interface ReservationRoom {
  id: number;
  aula: Room; // el aula reservada
  fecha: string; // fecha ISO string
  horario: string; // texto del horario
  user: User; // usuario que reservó
  estado: "pendiente" | "aprobado" | "cancelado" | "rechazado"; // estados típicos
  created_at?: string;
  updated_at?: string;
}
export interface Room {
  id: number;
  name: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}
export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  // otros campos que uses
}
