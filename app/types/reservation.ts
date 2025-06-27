import type { TipoReserva } from "./tipoReserva";

export type Role = {
  id: number;
  nombre: string;
};

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  estado: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  role_id: number;
  role: Role;
};

export type Equipo = {
  id: number;
  nombre: string;
  descripcion: string;
  estado: number;
  cantidad: number;
  is_deleted: number;
  tipo_equipo_id: number;
  created_at: string;
  updated_at: string;
  pivot: {
    reserva_equipo_id: number;
    equipo_id: number;
  };
};

type CodigoQR = {
  id: string; // GUID
  reserva_id: number;
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: number;
  user_id: number;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: "Pendiente" | "Aprobado" | "Devuelto" | "Rechazado" | "Cancelado";
  created_at: string;
  updated_at: string;
  user: User;
  aula: string;
  equipos: Equipo[];
  codigo_qr: CodigoQR;
  tipo_reserva: TipoReserva;
  documento_url?: string;
};

export type HistorialItem = {
  id: number;
  nombre_usuario: string;
  created_at: string;
  accion: string;
};
