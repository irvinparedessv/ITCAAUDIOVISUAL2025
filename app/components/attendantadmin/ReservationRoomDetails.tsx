import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../../api/axios";

type ReservaAula = {
  id: number;
  fecha: string;
  horario: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  comentario: string | null;
  aula: {
    id: number;
    name: string;
  };
  user: {
    first_name: string;
    last_name: string;
    email: string;
    role: {
      nombre: string;
    };
  };
};

export default function ReservationDetailAula() {
  const { id } = useParams<{ id: string }>();
  const [reserva, setReserva] = useState<ReservaAula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [accion, setAccion] = useState<"Aprobar" | "Rechazar" | null>(null);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const res = await api.get(`/reservas-aula/${id}`);
        setReserva(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la reserva.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReserva();
  }, [id]);

  const handleAbrirModal = (tipo: "Aprobar" | "Rechazar") => {
    setAccion(tipo);
    setComentario("");
    setShowModal(true);
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setAccion(null);
  };

  const handleEnviar = async () => {
    if (!reserva) return;

    try {
      await api.post(`/reservas-aula/${id}/estado`, {
        estado: accion === "Aprobar" ? "aprobada" : "rechazada",
        comentario,
      });

      alert(
        `Reserva ${
          accion === "Aprobar" ? "aprobada" : "rechazada"
        } correctamente.`
      );
      setReserva({
        ...reserva,
        estado: accion === "Aprobar" ? "aprobada" : "rechazada",
        comentario,
      });
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al cambiar el estado de la reserva.");
    }
  };

  const formatDate = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "warning";
      case "aprobada":
        return "success";
      case "rechazada":
        return "danger";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p>Cargando reserva...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center my-5">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  if (!reserva) return null;

  const qrData = `Reserva Aula: ${reserva.aula.name} | ${reserva.fecha} | ${reserva.horario} | Usuario: ${reserva.user.first_name} ${reserva.user.last_name}`;

  return (
    <>
      <Card className="shadow-lg my-4">
        <Card.Header className="bg-primary text-white text-center">
          <h5>Detalle de Reserva de Aula</h5>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Usuario:</strong> {reserva.user.first_name}{" "}
              {reserva.user.last_name}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Correo:</strong> {reserva.user.email}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Rol:</strong> {reserva.user.role.nombre}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Aula:</strong> {reserva.aula.name}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Fecha:</strong> {formatDate(reserva.fecha)}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Horario:</strong> {reserva.horario}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Estado:</strong>{" "}
              <Badge bg={getBadgeColor(reserva.estado)}>{reserva.estado}</Badge>
            </ListGroup.Item>
            {reserva.comentario && (
              <ListGroup.Item>
                <strong>Comentario:</strong> {reserva.comentario}
              </ListGroup.Item>
            )}
            <ListGroup.Item className="text-center">
              <strong>Código QR de la Reserva:</strong>
              <div className="mt-2">
                <QRCodeSVG value={qrData} size={128} />
              </div>
            </ListGroup.Item>
            {reserva.estado === "pendiente" && (
              <ListGroup.Item className="text-center mt-3">
                <Button
                  variant="success"
                  className="mx-2"
                  onClick={() => handleAbrirModal("Aprobar")}
                >
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleAbrirModal("Rechazar")}
                >
                  Rechazar
                </Button>
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCerrarModal}>
        <Modal.Header closeButton>
          <Modal.Title>{accion} Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="comentario">
              <Form.Label>Comentario</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={`Escribe un comentario para ${accion?.toLowerCase()} la reserva...`}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCerrarModal}>
            Cancelar
          </Button>
          <Button
            variant={accion === "Aprobar" ? "success" : "danger"}
            onClick={handleEnviar}
          >
            {accion}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
