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
  id: number;
  numero_serie?: string;
  tipo_equipo?: string;
  modelo?: string;
}

// Datos de aula dentro de una notificación (como objeto completo)
export interface AulaData {
  id: number;
  name: string;
  path_modelo: string;
  capacidad_maxima?: number;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
  deleted?: number;
  escala?: string;
}

// Datos de aula en notificaciones específicas
export interface AulaNotification {
  id: number;
  aula: string | AulaData; // Puede ser string (nombre) o objeto completo
  fecha: string;
  horario: string;
  estado: string;
  comentario?: string;
  pagina?: number;
}

// Base común para notificaciones de reserva
export interface ReservaBase {
  id: number;
  aula: string | AulaData; // Puede ser string (nombre) o objeto completo
  fecha_reserva: string;
  fecha_entrega: string;
  estado: string;
  tipo_reserva?: string;
  equipos?: EquipoNotification[];
  comentario?: string;
  pagina?: number;
  user?: string;
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