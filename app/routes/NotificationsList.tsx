import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  ListGroup,
  Badge,
  Row,
  Col,
  Modal,
  Button,
} from "react-bootstrap";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  SwipeableList,
  SwipeableListItem,
  LeadingActions,
  TrailingActions,
  SwipeAction,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import { useNotificaciones } from "../hooks/useNotifications";

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
  const { markAsRead } = useNotificaciones({ includeArchived: true });
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadNotifications = () => {
    setIsLoading(true);
    api.get("/notificaciones/historial")
      .then((res) => {
        setNotifications(res.data.notifications);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar notificaciones", err);
        setIsLoading(false);
        toast.error("Error al cargar notificaciones");
      });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAsRead();
      loadNotifications();
      window.dispatchEvent(new CustomEvent("notification-updated"));
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      toast.error("Error al marcar como leídas");
    }
  };

  const handleSelect = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) {
      console.error("Notificación no encontrada");
      return;
    }

    setSelectedNotification(notification);
    setShowModal(true);

    api.get(`/notifications/${id}`)
      .then((res) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: res.data.notification.read_at } : n
          )
        );
        markAsRead(id);
        window.dispatchEvent(
          new CustomEvent("notification-updated", {
            detail: { id },
          })
        );
      })
      .catch((err) => {
        console.error("Error al cargar detalle de la notificación", err);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.error("Error al cargar notificación");
      });
  };

  const deleteNotification = (id: string) => {
    api.delete(`/notificaciones/${id}`)
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedNotification?.id === id) {
          setSelectedNotification(null);
          setShowModal(false);
        }
        toast.success("Notificación eliminada");
        window.dispatchEvent(new CustomEvent("notification-updated"));
      })
      .catch((err) => {
        console.error("Error al eliminar notificación", err);
        toast.error("Error al eliminar notificación");
      });
  };

  const confirmDeleteAll = () => {
    toast.dismiss();
    
    toast(
      (t) => (
        <div className="p-2">
          <p className="mb-3">
            ¿Deseas eliminar <strong>todas</strong> las notificaciones?
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                try {
                  await api.delete("/notifications");
                  setNotifications([]);
                  setSelectedNotification(null);
                  setShowModal(false);
                  toast.dismiss(t.id);
                  toast.success("Todas las notificaciones eliminadas");
                  window.dispatchEvent(new CustomEvent("notification-updated"));
                } catch (err) {
                  toast.dismiss(t.id);
                  toast.error("Error al eliminar notificaciones");
                }
              }}
            >
              Sí, eliminar
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        style: {
          minWidth: '300px',
        },
      }
    );
  };

  const leadingActions = (id: string) => {
    return (
      <LeadingActions>
        <SwipeAction onClick={() => markAsRead(id)}>
          <div className="d-flex align-items-center justify-content-center h-100 px-3"
            style={{
              background: "#d1e7dd",
              color: "#0f5132",
            }}
          >
            ✅ Leída
          </div>
        </SwipeAction>
      </LeadingActions>
    );
  };

  const trailingActions = (id: string) => {
    return (
      <TrailingActions>
        <SwipeAction destructive={true} onClick={() => deleteNotification(id)}>
          <div className="d-flex align-items-center justify-content-center h-100 px-3"
            style={{
              background: "linear-gradient(90deg, #ff6b6b, #c0392b)",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            🗑️ Eliminar
          </div>
        </SwipeAction>
      </TrailingActions>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No disponible";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const unreadNotifications = notifications.filter((n) => !n.read_at);
  const readNotifications = notifications.filter((n) => n.read_at);

  const renderNotificationDetail = (notification: Notification) => {
    const isEquipo = notification.type.includes('equipo') ||
      (notification.data.reserva?.equipos && notification.data.reserva.equipos.length > 0);
    const isAula = notification.type.includes('aula') ||
      (notification.data.reserva?.horario && !isEquipo);

    const getEstadoColor = (estado: string) => {
      switch (estado?.toLowerCase()) {
        case 'aprobado': return 'success';
        case 'pendiente': return 'warning';
        case 'rechazado': return 'danger';
        case 'entregado': return 'primary';
        case 'devuelto': return 'info';
        default: return 'secondary';
      }
    };

    const estado = notification.data.estado ?? notification.data.reserva?.estado ?? "";
    const estadoColor = getEstadoColor(estado);

    return (
      <>
        <Modal.Header closeButton className="card-header-dark-red">
          <Modal.Title>
            {isEquipo ? '📦 ' : isAula ? '🏫 ' : '📄 '}
            Detalle de la notificación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6 className="text-primary">{notification.data.title}</h6>
            <p>{notification.data.message}</p>
          </div>

          <Row>
            <Col md={6} className="mb-3">
              <strong>Tipo:</strong>
              <div className="text-muted">
                {isEquipo ? 'Reserva de equipo' : isAula ? 'Reserva de aula' : 'Notificación'}
              </div>
            </Col>

            {notification.data.reserva?.id && (
              <Col md={6} className="mb-3">
                <strong>ID de reserva:</strong>
                <div className="text-muted">{notification.data.reserva.id}</div>
              </Col>
            )}

            <Col md={6} className="mb-3">
              <strong>Aula:</strong>
              <div className="text-muted">
                {notification.data.reserva?.aula ??
                  notification.data.aula ??
                  "No especificada"}
              </div>
            </Col>

            <Col md={6} className="mb-3">
              <strong>Estado:</strong>
              <div>
                <Badge bg={estadoColor} className="text-capitalize">
                  {estado || "No especificado"}
                </Badge>
              </div>
            </Col>

            {(notification.data.comentario || notification.data.reserva?.comentario) && (
              <Col xs={12} className="mb-3">
                <strong>Comentario:</strong>
                <div className="text-muted">
                  {notification.data.comentario || notification.data.reserva?.comentario}
                </div>
              </Col>
            )}

            {isEquipo && (
              <>
                <Col md={6} className="mb-3">
                  <strong>Tipo Reserva:</strong>
                  <div className="text-muted">
                    {notification.data.reserva?.tipo_reserva ??
                      notification.data.tipo_reserva ??
                      "No especificado"}
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <strong>Fecha de reserva:</strong>
                  <div className="text-muted">
                    {formatDate(
                      notification.data.reserva?.fecha_reserva ??
                      notification.data.fecha_reserva
                    )}
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <strong>Fecha de entrega:</strong>
                  <div className="text-muted">
                    {formatDate(
                      notification.data.reserva?.fecha_entrega ??
                      notification.data.fecha_entrega
                    )}
                  </div>
                </Col>

                {(notification.data.reserva?.equipos || notification.data.equipos) && (
                  <Col xs={12} className="mb-3">
                    <strong>Equipos reservados:</strong>
                    <ul className="list-unstyled mt-2">
                      {(notification.data.reserva?.equipos || notification.data.equipos || []).map((equipo: any, index: number) => (
                        <li key={index} className="mb-1">
                          <Badge bg="primary" className="me-2">
                            {equipo.tipo_equipo ?? "Sin tipo"}
                          </Badge>
                          {equipo.nombre}
                        </li>
                      ))}
                    </ul>
                  </Col>
                )}
              </>
            )}

            {isAula && (
              <>
                <Col md={6} className="mb-3">
                  <strong>Fecha:</strong>
                  <div className="text-muted">
                    {(() => {
                      const fechaStr = (notification.data.reserva?.fecha ?? notification.data.fecha).split(' ')[0];
                      const fechaObj = new Date(fechaStr);
                      return fechaObj.toLocaleDateString();
                    })()}
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <strong>Horario:</strong>
                  <div className="text-muted">
                    {notification.data.reserva?.horario ??
                      notification.data.horario ??
                      "No especificado"}
                  </div>
                </Col>
              </>
            )}

            <Col md={6} className="mb-3">
              <strong>Recibida:</strong>
              <div className="text-muted">
                {formatDate(notification.created_at)}
              </div>
            </Col>

            <Col md={6} className="mb-3">
              <strong>Leída:</strong>
              <div className="text-muted">
                {notification.read_at
                  ? formatDate(notification.read_at)
                  : "No leída"}
              </div>
            </Col>
          </Row>

          <div className="mt-4 d-flex justify-content-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowModal(false);
                if (isEquipo) {
                  navigate('/reservations', {
                    state: {
                      highlightReservaId: notification.data.reserva?.id,
                      page: notification.data.page ?? 1,
                    }
                  });
                } else if (isAula) {
                  navigate('/reservations-room', {
                    state: {
                      highlightReservaId: notification.data.reserva?.id,
                      page: notification.data.page ?? 1,
                    }
                  });
                }
              }}
            >
              {isEquipo ? 'Ver reserva de equipo' : isAula ? 'Ver reserva de aula' : 'Ver detalles'}
            </Button>
          </div>
        </Modal.Body>
      </>
    );
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow rounded-4 border-0">
            <Card.Header className="card-header-dark-red rounded-top-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
              <h4 className="mb-0">📩 Notificaciones</h4>
              <div className="d-flex justify-content-end w-100 w-md-auto">
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadNotifications.length === 0}
                    className="d-flex align-items-center gap-1 px-3 rounded-pill"
                  >
                    <span className="d-none d-md-inline">✅ Marcar todas</span>
                    <span className="d-inline d-md-none">✓ Marcar todas</span>
                  </Button>

                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={confirmDeleteAll}
                    disabled={notifications.length === 0}
                    className="d-flex align-items-center gap-1 px-3 rounded-pill"
                  >
                    <span className="d-none d-md-inline">🗑️ Eliminar todas</span>
                    <span className="d-inline d-md-none">🗑️ Eliminar todas</span>
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted py-3">
                  No tienes notificaciones.
                </p>
              ) : (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center mb-3">
                        🔔 No leídas
                        <Badge bg="danger" className="ms-2">
                          {unreadNotifications.length}
                        </Badge>
                      </h5>

                      <ListGroup variant="flush">
                        <SwipeableList>
                          {unreadNotifications.map((notification) => (
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
                                  borderLeft: "4px solid rgb(206, 145, 20)",
                                }}
                              >
                                <div>
                                  <div className="d-flex align-items-center">
                                    {notification.type.includes('equipo') ? '📦 ' :
                                      notification.type.includes('aula') ? '🏫 ' : '📄 '}
                                    <strong className="ms-2">
                                      {notification.data.message ??
                                        "Notificación sin mensaje"}
                                    </strong>
                                  </div>
                                  <small className="text-muted">
                                    {notification.type === 'nueva_reserva' && 'Nueva reserva de equipo'}
                                    {notification.type === 'nueva_reserva_aula' && 'Nueva reserva de aula'}
                                    {notification.type === 'estado_reserva' && 'Cambio de estado (equipo)'}
                                    {notification.type === 'estado_reserva_aula' && 'Cambio de estado (aula)'}
                                  </small>
                                </div>
                                <small className="text-muted">
                                  {formatDate(notification.created_at)}
                                </small>
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
                          {readNotifications.map((notification) => (
                            <SwipeableListItem
                              key={notification.id}
                              trailingActions={trailingActions(notification.id)}
                            >
                              <ListGroup.Item
                                action
                                className="d-flex justify-content-between align-items-center py-3"
                                onClick={() => handleSelect(notification.id)}
                                style={{
                                  borderLeft: "4px solid rgb(206, 145, 20)",
                                }}
                              >
                                <div>
                                  <div className="d-flex align-items-center">
                                    {notification.type.includes('equipo') ? '📦 ' :
                                      notification.type.includes('aula') ? '🏫 ' : '📄 '}
                                    <span className="ms-2 text-muted">
                                      {notification.data.message ??
                                        "Notificación sin mensaje"}
                                    </span>
                                  </div>
                                  <small className="text-muted">
                                    {notification.type === 'nueva_reserva' && 'Nueva reserva de equipo'}
                                    {notification.type === 'nueva_reserva_aula' && 'Nueva reserva de aula'}
                                    {notification.type === 'estado_reserva' && 'Cambio de estado (equipo)'}
                                    {notification.type === 'estado_reserva_aula' && 'Cambio de estado (aula)'}
                                  </small>
                                </div>
                                <small className="text-muted">
                                  {formatDate(notification.created_at)}
                                </small>
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