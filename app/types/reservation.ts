import type { TipoReserva } from "./tipoReserva";
import type { Insumo } from "./item";

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
  insumos: Insumo[];
  numero_serie: string;
  is_deleted: number;
  tipo_equipo_id: number;
  modelo: {
    nombre: string;
  };
  created_at: string;
  updated_at: string;
  pivot: {
    reserva_equipo_id: number;
    equipo_id: number;
  };
};
export type CodigoQR = {
  id: string; // GUID
  reserva_id: number;
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: number;
  path_model: string | null;
  user_id: number;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: "Pendiente" | "Aprobado" | "Devuelto" | "Rechazado" | "Cancelado";
  created_at: string;
  updated_at: string;
  user: User;
  aula: Aula;
  equipos: Equipo[];
  codigo_qr: CodigoQR;
  tipo_reserva: TipoReserva;
  documento_url?: string;
};

export type Aula = {
  name: string;
};
export type HistorialItem = {
  id: number;
  nombre_usuario: string;
  created_at: string;
  accion: string;
};
export type ReservationStatus =
  | "Pendiente"
  | "Aprobado"
  | "Devuelto"
  | "Rechazado"
  | "Cancelado";
