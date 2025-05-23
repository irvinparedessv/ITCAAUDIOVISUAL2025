import { useEffect, useState } from 'react';
import api from '~/api/axios';

interface Notification {
  id: string;
  type: string;
  data: {
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data.notifications);
      })
      .catch(err => console.error('Error al cargar notificaciones', err));
  }, []);

  const handleSelect = (id: string) => {
    api.get(`/notifications/${id}`)
      .then(res => {
        setSelectedNotification(res.data.notification);

        // Marcar como leída visualmente
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read_at: res.data.notification.read_at } : n)
        );
      })
      .catch(err => console.error('Error al cargar detalle de la notificación', err));
  };

  function formatDate(dateStr?: string) {
    if (!dateStr) return 'No disponible';
    return new Date(dateStr).toLocaleString();
  }

  // Dividir notificaciones en leídas y no leídas
  const unreadNotifications = notifications.filter(n => !n.read_at);
  const readNotifications = notifications.filter(n => n.read_at);

  return (
    <div className="container">
      <h2 className="mb-3">Notificaciones</h2>

      {notifications.length === 0 && <p>No tienes notificaciones.</p>}

      {unreadNotifications.length > 0 && (
        <>
          <h4>No leídas</h4>
          <ul className="list-group mb-4">
            {unreadNotifications.map(notification => (
              <li
                key={notification.id}
                className="list-group-item d-flex justify-content-between align-items-center fw-bold bg-light"
                onClick={() => handleSelect(notification.id)}
                style={{ cursor: 'pointer' }}
              >
                <span>{notification.data.message ?? 'Notificación sin mensaje'}</span>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </>
      )}

      {readNotifications.length > 0 && (
        <>
          <h4>Leídas</h4>
          <ul className="list-group mb-4">
            {readNotifications.map(notification => (
              <li
                key={notification.id}
                className="list-group-item d-flex justify-content-between align-items-center text-muted"
                onClick={() => handleSelect(notification.id)}
                style={{ cursor: 'pointer' }}
              >
                <span>{notification.data.message ?? 'Notificación sin mensaje'}</span>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedNotification && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Detalle</h5>

            <p><strong>Título:</strong> {selectedNotification.data.title}</p>
            <p><strong>Mensaje:</strong> {selectedNotification.data.message}</p>

            {selectedNotification.data.reserva_id && (
              <p><strong>ID de reserva:</strong> {selectedNotification.data.reserva_id}</p>
            )}

            <p><strong>Aula:</strong> {selectedNotification.data.reserva?.aula ?? selectedNotification.data.aula ?? 'No especificada'}</p>

            {(() => {
              const equipos = selectedNotification.data.reserva?.equipos ?? selectedNotification.data.equipos;
              if (!equipos) return null;
              return (
                <>
                  <p><strong>Equipos reservados:</strong></p>
                  <ul>
                    {equipos.map((equipo: any, index: number) => (
                      <li key={index}>
                        <strong>{equipo.nombre}</strong> ({equipo.tipo_equipo ?? 'Sin tipo'})
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}

            <p><strong>Tipo Reserva:</strong> {selectedNotification.data.reserva?.tipo_reserva ?? selectedNotification.data.tipo_reserva ?? 'No especificado'}</p>
            <p><strong>Estado:</strong> {selectedNotification.data.estado ?? selectedNotification.data.reserva?.estado ?? 'No especificado'}</p>

            {selectedNotification.data.comentario && (
              <p><strong>Comentario:</strong> {selectedNotification.data.comentario}</p>
            )}

            <p><strong>Fecha de reserva:</strong> {formatDate(selectedNotification.data.reserva?.fecha_reserva ?? selectedNotification.data.fecha_reserva)}</p>
            <p><strong>Fecha de entrega:</strong> {formatDate(selectedNotification.data.reserva?.fecha_entrega ?? selectedNotification.data.fecha_entrega)}</p>

            <p><strong>Recibida:</strong> {new Date(selectedNotification.created_at).toLocaleString()}</p>
            <p><strong>Leída:</strong> {selectedNotification.read_at ? new Date(selectedNotification.read_at).toLocaleString() : 'No leída'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
