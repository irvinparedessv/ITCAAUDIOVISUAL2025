import { useEffect, useState } from "react";
import echo from "../utils/pusher";
import { useAuth } from "./AuthContext";
import { Role } from "~/types/roles";
import api from '~/api/axios';

// Tipos mejorados para las notificaciones
type NotificationType = 'nueva_reserva' | 'estado_reserva';

interface EquipoNotification {
  nombre: string;
  tipo_equipo?: string;
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
  user?: string; // Opcional porque no todas las notificaciones incluyen usuario
}

interface NotificacionData {
  type: NotificationType;
  title: string;
  message: string;
  reserva: ReservaNotification;
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
  const { user } = useAuth();

  // Normalizar notificaciones del servidor
  const normalizeNotifications = (notifications: NotificacionStorage[]): Notificacion[] => {
    return notifications.map(n => ({
      id: n.id,
      data: {
        ...n.data,
        // Asegurar que la reserva siempre tenga un estado
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
      // Podrías añadir un manejo de errores más sofisticado aquí
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (!user) return;
    
    const loadInitialData = async () => {
      await fetchNotifications();
      setLoaded(true);
    };
    
    loadInitialData();
  }, [user]);

  // Manejar nueva notificación recibida
  const handleNewNotification = (data: any) => {
    console.log("Nueva notificación recibida:", data);
    setUnreadCount(prev => prev + 1);
    fetchNotifications(); // Refrescar la lista completa
  };

  // Escuchar nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!echo || !loaded || !user) return;

    const channelName = `notifications.user.${user.id}`;
    const channel = echo.private(channelName);

    console.log('Suscribiendo a canal de notificaciones:', channelName);

    // Configurar listeners basados en el rol del usuario
    if ([Role.Administrador, Role.Encargado].includes(user.role)) {
      channel.listen('.nueva.reserva', handleNewNotification);
      console.log('Escuchando eventos de nueva reserva');
    }

    if (user.role === Role.Prestamista) {
      channel.listen('.reserva.estado.actualizado', handleNewNotification);
      console.log('Escuchando eventos de cambio de estado');
    }

    // Limpieza al desmontar
    return () => {
      if ([Role.Administrador, Role.Encargado].includes(user.role)) {
        channel.stopListening('.nueva.reserva', handleNewNotification);
      }
      if (user.role === Role.Prestamista) {
        channel.stopListening('.reserva.estado.actualizado', handleNewNotification);
      }
      echo!.leave(channelName);
      console.log('Dejando canal de notificaciones');
    };
  }, [echo, loaded, user]);

  // Marcar como leídas
 // En tu hook useNotificaciones
  const markAsRead = async (notificationId: string | null = null) => {
  try {
    if (notificationId) {
      // Marcar solo una notificación como leída
      await api.post(`/notificaciones/${notificationId}/marcar-leida`);
      setNotificaciones(prev => prev.map(n => 
        n.id === notificationId ? { ...n, unread: false } : n
      ));
      setUnreadCount(prev => prev - 1);
    } else {
      // Marcar todas como leídas
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
      // Primero optimista
      setNotificaciones(prev => {
        const updated = prev.filter(n => n.id !== id);
        setUnreadCount(updated.filter(n => n.unread).length);
        return updated;
      });

      // Luego intentar en el backend
      await api.delete(`/notificaciones/${id}`);
    } catch (error) {
      console.error("Error removing notification:", error);
      // Revertir si falla
      fetchNotifications();
    }
  };

  // Limpiar todas las notificaciones
  const clearAllNotifications = async () => {
    if (notificaciones.length === 0) return;

    try {
      // Primero optimista
      setNotificaciones([]);
      setUnreadCount(0);

      // Luego intentar en el backend
      await api.delete('/notificaciones/clear-all');
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      // Revertir si falla
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