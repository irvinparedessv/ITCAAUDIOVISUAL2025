import { useEffect, useState } from 'react';
import { Container, Card, ListGroup, Badge, Row, Col } from 'react-bootstrap';
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
  const [isLoading, setIsLoading] = useState(true);

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
    if (notification) setSelectedNotification(notification);

    api.get(`/notifications/${id}`)
      .then(res => {
        setSelectedNotification(res.data.notification);
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read_at: res.data.notification.read_at } : n)
        );
      })
      .catch(err => console.error('Error al cargar detalle de la notificación', err));
  };

  function formatDate(dateStr?: string) {
    if (!dateStr) return 'No disponible';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Dividir notificaciones en leídas y no leídas
  const unreadNotifications = notifications.filter(n => !n.read_at);
  const readNotifications = notifications.filter(n => n.read_at);

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#6b0000', color: 'white' }}>
              <h4 className="mb-0">Notificaciones</h4>
            </Card.Header>

            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" style={{ color: '#6b0000' }} role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted py-3">No tienes notificaciones.</p>
              ) : (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center">
                        No leídas
                        <Badge className="ms-2 badge-custom-red" style={{ backgroundColor: 'var(--bs-primary)' }}>
  {unreadNotifications.length}
</Badge>

                      </h5>
                      <ListGroup variant="flush">
                        {unreadNotifications.map(notification => (
                          <ListGroup.Item
                            key={notification.id}
                            action
                            className="d-flex justify-content-between align-items-center py-3"
                            onClick={() => handleSelect(notification.id)}
                            active={selectedNotification?.id === notification.id}
                            style={selectedNotification?.id === notification.id ? 
                              { backgroundColor: 'rgba(107, 0, 0, 0.1)', borderLeft: '3px solid #6b0000' } : 
                              { borderLeft: '3px solid #6b0000' }}
                          >
                            <div className="d-flex align-items-center">
                              <span className="fw-bold">{notification.data.message ?? 'Notificación sin mensaje'}</span>
                            </div>
                            <small className="text-muted">{formatDate(notification.created_at)}</small>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}

                  {readNotifications.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-muted">Leídas</h5>
                      <ListGroup variant="flush">
                        {readNotifications.map(notification => (
                          <ListGroup.Item
                            key={notification.id}
                            action
                            className="d-flex justify-content-between align-items-center py-3"
                            onClick={() => handleSelect(notification.id)}
                            active={selectedNotification?.id === notification.id}
                            style={selectedNotification?.id === notification.id ? 
                              { backgroundColor: 'rgba(107, 0, 0, 0.1)' } : {}}
                          >
                            <div className="d-flex align-items-center">
                              <span className="text-muted">{notification.data.message ?? 'Notificación sin mensaje'}</span>
                            </div>
                            <small className="text-muted">{formatDate(notification.created_at)}</small>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>

          {selectedNotification && (
            <Card className="mt-4 shadow-sm">
              <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
                <h5 className="mb-0">Detalle de la notificación</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6 style={{ color: '#6b0000' }}>{selectedNotification.data.title}</h6>
                  <p className="mb-0">{selectedNotification.data.message}</p>
                </div>

                <Row>
                  {selectedNotification.data.reserva_id && (
                    <Col md={6} className="mb-3">
                      <strong>ID de reserva:</strong>
                      <div className="text-muted">{selectedNotification.data.reserva_id}</div>
                    </Col>
                  )}

                  <Col md={6} className="mb-3">
                    <strong>Aula:</strong>
                    <div className="text-muted">
                      {selectedNotification.data.reserva?.aula ?? selectedNotification.data.aula ?? 'No especificada'}
                    </div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <strong>Tipo Reserva:</strong>
                    <div className="text-muted">
                      {selectedNotification.data.reserva?.tipo_reserva ?? selectedNotification.data.tipo_reserva ?? 'No especificado'}
                    </div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <strong>Estado:</strong>
                    <div className="text-muted">
                      {selectedNotification.data.estado ?? selectedNotification.data.reserva?.estado ?? 'No especificado'}
                    </div>
                  </Col>

                  {selectedNotification.data.comentario && (
                    <Col xs={12} className="mb-3">
                      <strong>Comentario:</strong>
                      <div className="text-muted">{selectedNotification.data.comentario}</div>
                    </Col>
                  )}

                  <Col md={6} className="mb-3">
                    <strong>Fecha de reserva:</strong>
                    <div className="text-muted">
                      {formatDate(selectedNotification.data.reserva?.fecha_reserva ?? selectedNotification.data.fecha_reserva)}
                    </div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <strong>Fecha de entrega:</strong>
                    <div className="text-muted">
                      {formatDate(selectedNotification.data.reserva?.fecha_entrega ?? selectedNotification.data.fecha_entrega)}
                    </div>
                  </Col>

                  {(() => {
                    const equipos = selectedNotification.data.reserva?.equipos ?? selectedNotification.data.equipos;
                    if (equipos && equipos.length > 0) {
                      return (
                        <Col xs={12} className="mb-3">
                          <strong>Equipos reservados:</strong>
                          <ul className="list-unstyled mt-2">
                            {equipos.map((equipo: any, index: number) => (
                              <li key={index} className="mb-1">
                                <Badge style={{ backgroundColor: '#6b0000' }} className="me-2">
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
                    <div className="text-muted">{formatDate(selectedNotification.created_at)}</div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <strong>Leída:</strong>
                    <div className="text-muted">
                      {selectedNotification.read_at ? formatDate(selectedNotification.read_at) : 'No leída'}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}