import { useEffect, useState } from "react";
import echo from "../utils/pusher";
import { FaTimes } from "react-icons/fa";

interface ReservaNotification {
  id: number;
  user: string;
  aula: string;
  fecha_reserva: string;
  fecha_entrega: string;
}

interface NotificacionStorage {
  id: string;
  reserva: ReservaNotification;
  unread: boolean;
  createdAt: string;
}

interface Notificacion extends Omit<NotificacionStorage, 'createdAt'> {
  createdAt: Date;
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Cargar notificaciones del localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        const loadedNotifications = parsed.notifications.map((n: NotificacionStorage) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        setNotificaciones(loadedNotifications);
        setUnreadCount(parsed.unreadCount);
      } catch (error) {
        console.error("Error loading notifications:", error);
        localStorage.removeItem('notifications');
      }
    }
    setLoaded(true);
  }, []);

  // Guardar notificaciones en localStorage cuando cambian
  useEffect(() => {
    if (!loaded) return;

    const notificationsToSave: NotificacionStorage[] = notificaciones.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString()
    }));

    localStorage.setItem('notifications', JSON.stringify({
      notifications: notificationsToSave,
      unreadCount
    }));
  }, [notificaciones, unreadCount, loaded]);

  // Escuchar nuevas notificaciones
  useEffect(() => {
    if (!echo || !loaded) return;

    const channel = echo.channel('notifications');

    const handler = (data: { reserva: ReservaNotification }) => {
      const nuevaNotificacion: Notificacion = {
        id: Date.now().toString(),
        reserva: data.reserva,
        unread: true,
        createdAt: new Date()
      };

      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    channel.listen('.nueva.reserva', handler);

    return () => {
      channel.stopListening('.nueva.reserva', handler);
      echo?.leave('notifications');
    };
  }, [loaded]);

  // Marcar como leídas
  const markAsRead = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  // Eliminar notificación
  const removeNotification = (id: string) => {
    setNotificaciones(prev => {
      const updated = prev.filter(n => n.id !== id);
      const newUnreadCount = updated.filter(n => n.unread).length;
      setUnreadCount(newUnreadCount);
      return updated;
    });
  };

  // Limpiar todas
  const clearAllNotifications = () => {
    setNotificaciones([]);
    setUnreadCount(0);
  };

  return {
    notificaciones,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications
  };
}