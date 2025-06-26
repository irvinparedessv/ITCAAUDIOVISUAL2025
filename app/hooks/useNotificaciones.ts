import { useCallback, useEffect, useState } from "react";
import { initializeEcho } from "../utils/pusher";
import { useAuth } from "./AuthContext";
import { Role } from "app/types/roles";
import api from "../api/axios";
import type { Notificacion, NotificacionStorage, UseNotificacionesOptions } from "../types/notification";


export function useNotificaciones(options?: UseNotificacionesOptions) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const [echo, setEcho] = useState<any>(null);

  // Normalizar notificaciones
  const normalizeNotifications = useCallback((notifications: NotificacionStorage[]): Notificacion[] => {
    return notifications.map(n => ({
      id: n.id,
      data: n.data,
      type: n.type,
      createdAt: new Date(n.created_at),
      readAt: n.read_at ? new Date(n.read_at) : null,
      unread: !n.read_at,
    }));
  }, []);

    // Manejar nueva notificación recibida
  const handleNewNotification = (data: any) => {
    console.log("Nueva notificación recibida:", data);
    setUnreadCount(prev => prev + 1);
    fetchNotifications(); // Refrescar la lista completa
  };

  // Cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    try {
      const endpoint = options?.includeArchived 
        ? "/notificaciones/historial" 
        : "/notificaciones";
      const response = await api.get(endpoint);
      const data = Array.isArray(response.data) ? response.data : response.data.notifications ?? [];
      
      setNotificaciones(normalizeNotifications(data));
      setUnreadCount(data.filter((n: any) => !n.read_at).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [normalizeNotifications, options?.includeArchived]);

  // Inicializar Echo y cargar notificaciones
  useEffect(() => {
    if (!token) return;

    const echoInstance = initializeEcho(token);
    setEcho(echoInstance);
    fetchNotifications();
  }, [token, fetchNotifications]);

  // Configurar listeners de Echo
  useEffect(() => {
    if (!echo || !user) return;

    const channelName = `notifications.user.${user.id}`;
    const channel = echo.private(channelName);

    const events = [
      '.nueva.reserva',
      '.nueva.reserva.aula',
      '.reserva.estado.actualizado',
      '.reserva.aula.estado.actualizado',
      '.reserva.aula.cancelada.prestamista',
      '.notificacion.eliminada',
      '.reserva.cancelada',
    ];

    events.forEach(event => {
      channel.listen(event, handleNewNotification);
    });

    return () => {
      events.forEach(event => {
        channel.stopListening(event, handleNewNotification);
      });
      echo.leave(channelName);
    };
  }, [echo, user, handleNewNotification]);

  // Polling como fallback
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Funciones para manejar notificaciones
  const markAsRead = useCallback(async (id?: string) => {
    try {
      if (id) {
        await api.post(`/notificaciones/${id}/marcar-leida`);
        setNotificaciones(prev => prev.map(n => 
          n.id === id ? { ...n, unread: false, readAt: new Date() } : n
        ));
        setUnreadCount(prev => prev - 1);
      } else {
        await api.post("/notificaciones/marcar-leidas");
        setNotificaciones(prev => prev.map(n => ({ ...n, unread: false, readAt: new Date() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    try {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await api.put(`/notificaciones/${id}/archivar`);
    } catch (error) {
      console.error("Error removing notification:", error);
      fetchNotifications(); // Revertir si hay error
    }
  }, [fetchNotifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      setNotificaciones([]);
      setUnreadCount(0);
      await api.put("/notificaciones/archivar-todas");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return {
    notificaciones,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications, // Esta línea ya existe
  };
}