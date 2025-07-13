import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../../api/axios";
import { formatTimeRangeTo12h } from "~/utils/time";
import { FaCalendarAlt, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReservaNoEncontrada from "../error/ReservaNoEncontrada";

type ReservaAula = {
  id: number;
  fecha: string;
  horario: string;
  estado: "pendiente" | "aprobado" | "rechazado";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const res = await api.get(`/reservas-aula/${id}`);
        if (!res.data || Object.keys(res.data).length === 0) {
          setError("not_found");
        } else {
          setReserva(res.data);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("not_found");
        } else {
          setError("No se pudo cargar la reserva.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReserva();
  }, [id]);

  const handleBack = () => {
    navigate("/reservations-room");
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
    const cleanEstado = estado.trim().toLowerCase();

    switch (cleanEstado) {
      case "pendiente":
        return "warning";
      case "aprobado":
        return "success";
      case "rechazado":
        return "danger";
      default:
        return "secondary";
    }
  };


  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p>Cargando reserva...</p>
      </div>
    );
  }

  if (error === "not_found") {
    return <ReservaNoEncontrada />;
  }

  if (error) {
    return (
      <div className="text-center my-5">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }


  if (!reserva) return null;

  // Debug del estado recibido
  console.log("Estado recibido:", reserva.estado);

  const qrData = `Reserva Aula: ${reserva.aula.name} | ${reserva.fecha} | ${reserva.horario} | Usuario: ${reserva.user.first_name} ${reserva.user.last_name}`;

  return (
    <Card className="shadow-lg my-4 border-0">
      <Card.Header
        className="text-white d-flex align-items-center gap-2"
        style={{
          backgroundColor: "#b1291d",
          borderRadius: "0.5rem 0.5rem 0 0",
          padding: "1.25rem",
        }}
      >
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
          }}
        />
        <FaCalendarAlt />
        <h5 className="mb-0">Detalle de Reserva de Aula</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={8}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Aula:</strong> {reserva.aula.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Fecha:</strong> {formatDate(reserva.fecha)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Horario:</strong>{" "}
                {formatTimeRangeTo12h(reserva.horario)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Estado:</strong>{" "}
                <Badge
                  bg={getBadgeColor(reserva.estado)}
                  className="text-uppercase"
                >
                  {reserva.estado}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Usuario:</strong>{" "}
                {`${reserva.user.first_name} ${reserva.user.last_name}`} <br />
                <small className="text-muted">{reserva.user.email}</small>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Rol:</strong> {reserva.user.role.nombre}
              </ListGroup.Item>
              {reserva.comentario && (
                <ListGroup.Item>
                  <strong>Comentario:</strong> {reserva.comentario}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
          <Col
            md={4}
            className="d-flex flex-column align-items-center justify-content-center text-center mt-4 mt-md-0"
          >
            <p className="mb-2">
              <strong>Código QR de la Reserva:</strong>
            </p>
            <QRCodeSVG value={qrData} size={140} />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
