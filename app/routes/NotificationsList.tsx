import { useEffect, useState } from 'react';
import { Container, Card, ListGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import api from '~/api/axios';

import {
  SwipeableList,
  SwipeableListItem,
  LeadingActions,
  TrailingActions,
  SwipeAction
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

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
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data.notifications);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar notificaciones', err);
        setIsLoading(false);
      });
  }, []);

  const handleSelect = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
      setShowModal(true);
    }

    api.get(`/notifications/${id}`)
      .then(res => {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read_at: res.data.notification.read_at } : n)
        );
      })
      .catch(err => console.error('Error al cargar detalle de la notificación', err));
  };

  function markAsRead(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );

    api.post(`/notifications/${id}/mark-as-read`)
      .catch(err => console.error('Error al marcar como leída', err));
  }

  function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
      setShowModal(false);
    }

    api.delete(`/notifications/${id}`)
      .catch(err => console.error('Error al eliminar notificación', err));
  }

  function leadingActions(id: string) {
    return (
      <LeadingActions>
        <SwipeAction onClick={() => markAsRead(id)}>
          <div style={{ padding: '0.75rem 1rem', background: '#d1e7dd', color: '#0f5132' }}>
            Marcar como leída
          </div>
        </SwipeAction>
      </LeadingActions>
    );
  }

  function trailingActions(id: string) {
    return (
      <TrailingActions>
        <SwipeAction
          destructive={true}
          onClick={() => deleteNotification(id)}
        >
          <div style={{ padding: '0.75rem 1rem', background: '#f8d7da', color: '#842029' }}>
            Eliminar
          </div>
        </SwipeAction>
      </TrailingActions>
    );
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return 'No disponible';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const unreadNotifications = notifications.filter(n => !n.read_at);
  const readNotifications = notifications.filter(n => n.read_at);

  const renderNotificationDetail = (notification: Notification) => (
    <>
      <Modal.Header closeButton className="card-header-dark-red">
        <Modal.Title>📄 Detalle de la notificación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <h6 className="text-primary">{notification.data.title}</h6>
          <p>{notification.data.message}</p>
        </div>

        <Row>
          {notification.data.reserva_id && (
            <Col md={6} className="mb-3">
              <strong>ID de reserva:</strong>
              <div className="text-muted">{notification.data.reserva_id}</div>
            </Col>
          )}

          <Col md={6} className="mb-3">
            <strong>Aula:</strong>
            <div className="text-muted">
              {notification.data.reserva?.aula ?? notification.data.aula ?? 'No especificada'}
            </div>
          </Col>

          <Col md={6} className="mb-3">
            <strong>Tipo Reserva:</strong>
            <div className="text-muted">
              {notification.data.reserva?.tipo_reserva ?? notification.data.tipo_reserva ?? 'No especificado'}
            </div>
          </Col>

          <Col md={6} className="mb-3">
            <strong>Estado:</strong>
            <div className="text-muted">
              {notification.data.estado ?? notification.data.reserva?.estado ?? 'No especificado'}
            </div>
          </Col>

          {notification.data.comentario && (
            <Col xs={12} className="mb-3">
              <strong>Comentario:</strong>
              <div className="text-muted">{notification.data.comentario}</div>
            </Col>
          )}

          <Col md={6} className="mb-3">
            <strong>Fecha de reserva:</strong>
            <div className="text-muted">
              {formatDate(notification.data.reserva?.fecha_reserva ?? notification.data.fecha_reserva)}
            </div>
          </Col>

          <Col md={6} className="mb-3">
            <strong>Fecha de entrega:</strong>
            <div className="text-muted">
              {formatDate(notification.data.reserva?.fecha_entrega ?? notification.data.fecha_entrega)}
            </div>
          </Col>

          {(() => {
            const equipos = notification.data.reserva?.equipos ?? notification.data.equipos;
            if (equipos && equipos.length > 0) {
              return (
                <Col xs={12} className="mb-3">
                  <strong>Equipos reservados:</strong>
                  <ul className="list-unstyled mt-2">
                    {equipos.map((equipo: any, index: number) => (
                      <li key={index} className="mb-1">
                        <Badge bg="primary" className="me-2">
                          {equipo.tipo_equipo ?? 'Sin tipo'}
                        </Badge>
                        {equipo.nombre}
                      </li>
                    ))}
                  </ul>
                </Col>
              );
            }
            return null;
          })()}

          <Col md={6} className="mb-3">
            <strong>Recibida:</strong>
            <div className="text-muted">{formatDate(notification.created_at)}</div>
          </Col>

          <Col md={6} className="mb-3">
            <strong>Leída:</strong>
            <div className="text-muted">
              {notification.read_at ? formatDate(notification.read_at) : 'No leída'}
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </>
  );

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow rounded-4 border-0">
            <Card.Header className="card-header-dark-red rounded-top-4">
              <h4 className="mb-0">📩 Notificaciones</h4>
            </Card.Header>

            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted py-3">No tienes notificaciones.</p>
              ) : (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center mb-3">
                        🔔 No leídas
                        <Badge bg="danger" className="ms-2">{unreadNotifications.length}</Badge>
                      </h5>

                      <ListGroup variant="flush">
                        <SwipeableList>
                          {unreadNotifications.map(notification => (
                            <SwipeableListItem
                              key={notification.id}
                              leadingActions={leadingActions(notification.id)}
                              trailingActions={trailingActions(notification.id)}
                            >
                              <ListGroup.Item
                                action
                                className="d-flex justify-content-between align-items-center py-3"
                                onClick={() => handleSelect(notification.id)}
                                style={{
                                  borderLeft: '4px solid rgb(206, 145, 20)'
                                }}
                              >
                                <div>
                                  <strong>{notification.data.message ?? 'Notificación sin mensaje'}</strong>
                                </div>
                                <small className="text-muted">{formatDate(notification.created_at)}</small>
                              </ListGroup.Item>
                            </SwipeableListItem>
                          ))}
                        </SwipeableList>
                      </ListGroup>
                    </div>
                  )}

                  {readNotifications.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-muted mb-3">📘 Leídas</h5>
                      <ListGroup variant="flush">
                        <SwipeableList>
                          {readNotifications.map(notification => (
                            <SwipeableListItem
                              key={notification.id}
                              trailingActions={trailingActions(notification.id)}
                            >
                              <ListGroup.Item
                                action
                                className="d-flex justify-content-between align-items-center py-3"
                                onClick={() => handleSelect(notification.id)}
                                style={{
                                  borderLeft: '4px solid rgb(206, 145, 20)',
                                }}
                              >
                                <div>
                                  <span className="text-muted">{notification.data.message ?? 'Notificación sin mensaje'}</span>
                                </div>
                                <small className="text-muted">{formatDate(notification.created_at)}</small>
                              </ListGroup.Item>
                            </SwipeableListItem>
                          ))}
                        </SwipeableList>
                      </ListGroup>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        {selectedNotification && renderNotificationDetail(selectedNotification)}
      </Modal>
    </Container>
  );
}