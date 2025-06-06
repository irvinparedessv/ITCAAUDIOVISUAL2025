import { useEffect, useState } from "react";
import { initializeEcho } from "../utils/pusher";
import { useAuth } from "./AuthContext";
import { Role } from "~/types/roles";
import api from '~/api/axios';

// Tipos mejorados para las notificaciones
type NotificationType = 'nueva_reserva' | 'estado_reserva' | 'nueva_reserva_aula' | 'estado_reserva_aula';

interface EquipoNotification {
  nombre: string;
  tipo_equipo?: string;
}

interface AulaNotification {
  id: number;
  aula: string;
  fecha: string;
  horario: string;
  estado: string;
  comentario?: string;
}

interface ReservaBase {
  id: number;
  aula: string;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: string;
  tipo_reserva?: string;
  equipos?: EquipoNotification[];
  comentario?: string;
}

interface ReservaNotification extends ReservaBase {
  user?: string;
}

interface NotificacionData {
  type: NotificationType;
  title: string;
  message: string;
  reserva: ReservaNotification | AulaNotification;
}

interface NotificacionStorage {
  id: string;
  data: NotificacionData;
  read_at: string | null;
  created_at: string;
  type: string;
}

interface Notificacion extends Omit<NotificacionStorage, "created_at" | "read_at"> {
  createdAt: Date;
  readAt: Date | null;
  unread: boolean;
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const { user, token } = useAuth(); // Asegúrate de que useAuth devuelva el token
  const [echo, setEcho] = useState<any>(null);

  // Inicializar Echo cuando tengamos el token
  useEffect(() => {
    if (token && typeof window !== "undefined") {
      const echoInstance = initializeEcho(token);
      setEcho(echoInstance);
    }
  }, [token]);

  // Normalizar notificaciones del servidor
  const normalizeNotifications = (notifications: NotificacionStorage[]): Notificacion[] => {
    return notifications.map(n => ({
      id: n.id,
      data: {
        ...n.data,
        reserva: {
          ...n.data.reserva,
          estado: n.data.reserva?.estado || 'pendiente'
        }
      },
      type: n.type,
      createdAt: new Date(n.created_at),
      readAt: n.read_at ? new Date(n.read_at) : null,
      unread: !n.read_at,
    }));
  };

  // Cargar notificaciones persistentes del servidor
  const fetchNotifications = async () => {
    try {
      const response = await api.get<NotificacionStorage[]>('/notificaciones');
      const normalizedNotifications = normalizeNotifications(response.data);
      
      setNotificaciones(normalizedNotifications);
      setUnreadCount(normalizedNotifications.filter(n => n.unread).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (!user || !echo) return;
    
    const loadInitialData = async () => {
      await fetchNotifications();
      setLoaded(true);
    };
    
    loadInitialData();
  }, [user, echo]);

  // Manejar nueva notificación recibida
  const handleNewNotification = (data: any) => {
    console.log("Nueva notificación recibida:", data);
    setUnreadCount(prev => prev + 1);
    fetchNotifications();
  };

  // Escuchar nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!echo || !loaded || !user) return;

    const channelName = `notifications.user.${user.id}`;
    const channel = echo.private(channelName);

    console.log('Suscribiendo a canal de notificaciones:', channelName);

    if ([Role.Administrador, Role.Encargado].includes(user.role)) {
      channel.listen('.nueva.reserva', handleNewNotification);
      channel.listen('.nueva.reserva.aula', handleNewNotification);
      console.log('Escuchando eventos de nueva reserva y nueva reserva de aula');
    }

    if (user.role === Role.Prestamista) {
      channel.listen('.reserva.estado.actualizado', handleNewNotification);
      channel.listen('.reserva.aula.estado.actualizado', handleNewNotification);
      console.log('Escuchando eventos de cambio de estado');
    }

    return () => {
      if ([Role.Administrador, Role.Encargado].includes(user.role)) {
        channel.stopListening('.nueva.reserva', handleNewNotification);
        channel.stopListening('.nueva.reserva.aula', handleNewNotification);
      }
      if (user.role === Role.Prestamista) {
        channel.stopListening('.reserva.estado.actualizado', handleNewNotification);
        channel.stopListening('.reserva.aula.estado.actualizado', handleNewNotification);
      }
      echo.leave(channelName);
      console.log('Dejando canal de notificaciones');
    };
  }, [echo, loaded, user]);

  // Marcar como leídas
  const markAsRead = async (notificationId: string | null = null) => {
    try {
      if (notificationId) {
        await api.post(`/notificaciones/${notificationId}/marcar-leida`);
        setNotificaciones(prev => prev.map(n => 
          n.id === notificationId ? { ...n, unread: false } : n
        ));
        setUnreadCount(prev => prev - 1);
      } else {
        await api.post('/notificaciones/marcar-leidas');
        setNotificaciones(prev => prev.map(n => ({ ...n, unread: false })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Eliminar notificación individual
  const removeNotification = async (id: string) => {
    try {
      setNotificaciones(prev => {
        const updated = prev.filter(n => n.id !== id);
        setUnreadCount(updated.filter(n => n.unread).length);
        return updated;
      });

      await api.delete(`/notificaciones/${id}`);
    } catch (error) {
      console.error("Error removing notification:", error);
      fetchNotifications();
    }
  };

  // Limpiar todas las notificaciones
  const clearAllNotifications = async () => {
    if (notificaciones.length === 0) return;

    try {
      setNotificaciones([]);
      setUnreadCount(0);
      await api.delete('/notificaciones/clear-all');
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      fetchNotifications();
    }
  };

  return {
    notificaciones,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications,
  };
}