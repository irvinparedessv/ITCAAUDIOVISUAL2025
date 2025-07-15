import type { CodigoQR, Role } from "./reservation";

export interface ReservationRoom {
  id: number;
  aula: Room; // el aula reservada
  fecha: string; // fecha ISO string
  horario: string; // texto del horario
  user: User; // usuario que reservó
  estado: "pendiente" | "aprobado" | "cancelado" | "rechazado"; // estados típicos
  created_at?: string;
  updated_at?: string;
  comentario: string;
  codigo_qr: CodigoQR;
  titulo: string;
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
  email: string;
  role: Role;
  // otros campos que uses
}
export type HistorialItem = {
  id: number;
  nombre_usuario: string;
  created_at: string;
  accion: string;
};
