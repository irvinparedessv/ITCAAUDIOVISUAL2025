// Tipos de notificación válidos
export type NotificationType =
  | "nueva_reserva"
  | "estado_reserva"
  | "nueva_reserva_aula"
  | "estado_reserva_aula"
  | "cancelacion_reserva_prestamista"
  | "cancelacion_reserva";

// Datos de equipo dentro de una notificación
export interface EquipoNotification {
  nombre: string;
  tipo_equipo?: string;
}

// Datos de aula dentro de una notificación
export interface AulaNotification {
  id: number;
  aula: string;
  fecha: string;
  horario: string;
  estado: string;
  comentario?: string;
  pagina?: number;
}

// Base común para notificaciones de reserva
export interface ReservaBase {
  id: number;
  aula: string;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: string;
  tipo_reserva?: string;
  equipos?: EquipoNotification[];
  comentario?: string;
  pagina?: number;
}

// Notificación de reserva con información del usuario
export interface ReservaNotification extends ReservaBase {
  user?: string;
}

// Estructura de los datos dentro de una notificación
export interface NotificacionData {
  type: NotificationType;
  title: string;
  message: string;
  reserva: ReservaNotification | AulaNotification;
}

// Notificación tal como llega del backend
export interface NotificacionStorage {
  id: string;
  data: NotificacionData;
  read_at: string | null;
  created_at: string;
  type: string;
}

// Notificación adaptada al frontend con tipos Date
export interface Notificacion
  extends Omit<NotificacionStorage, "created_at" | "read_at"> {
  createdAt: Date;
  readAt: Date | null;
  unread: boolean;
}

// Opciones del hook de notificaciones personalizadas
export interface UseNotificacionesOptions {
  includeArchived?: boolean;
}
