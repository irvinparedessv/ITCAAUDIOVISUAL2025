import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AulaReservacionEstadoModal from "../components/attendantadmin/RoomReservationStateModal";
import ReservacionEstadoModal from "./ReservacionEstado";
import {
  Card,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import type { Room } from "~/types/reservationroom";
import type { ReservationStatus } from "~/types/reservation";
import { FaCalendarAlt, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { formatTo12h } from "~/utils/time";

type Reserva = {
  usuario: string;
  equipo?: string[];
  aula: string;
  espacio: Room;
  dia: string;
  id: number;
  horaSalida?: string;
  horaEntrada?: string;
  horario?: string;
  estado: ReservationStatus;
  isRoom: boolean;
};

export default function ReservationDetail() {
  const { idQr } = useParams<{ idQr: string }>();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [accion, setAccion] = useState<"Aprobar" | "Rechazar" | null>(null);
  const [comentario, setComentario] = useState("");
  const navigate = useNavigate();

  function formatDayWithDate(fecha: string) {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // function formatTime(fechaHora: string) {
  //   const fechaISO = fechaHora.replace(" ", "T");
  //   const date = new Date(fechaISO);
  //   return date.toLocaleTimeString("es-ES", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // }

  useEffect(() => {
    if (!idQr) return;

    const fetchReserva = async () => {
      try {
        const response = await api.get(`/reservasQR/${idQr}`);
        setReserva(response.data);
      } catch (err: any) {
        console.error(err);

        if (err.response) {
          if (err.response.status === 404) {
            setError("No se encontró la reserva.");
          } else if (err.response.status === 403) {
            setError("No tiene autorización para ver esta reserva.");
          } else {
            setError(
              `Error ${err.response.status}: ${
                err.response.data?.message || "Error desconocido"
              }`
            );
          }
        } else {
          setError("Error de red o servidor no disponible.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReserva();
  }, [idQr]);

  const handleAbrirModal = (tipo: "Aprobar" | "Rechazar") => {
    setAccion(tipo);
    setComentario("");
    setShowModal(true);
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setAccion(null);
  };

  const handleBack = () => {
    navigate("/reservations");
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
        <Button variant="primary" onClick={handleBack}>
          Volver
        </Button>
      </div>
    );
  }

  if (!reserva) return null;

  const qrData = reserva.isRoom
    ? `Reserva de aula para ${reserva.usuario} en ${reserva.espacio.name} el ${reserva.dia}`
    : `Reserva de ${reserva.usuario} - ${reserva.equipo?.join(", ")} en ${
        reserva.aula
      } el ${reserva.dia}`;

  const cleanEstado = reserva.estado.trim().toLowerCase();

  return (
    <>
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
          <h5 className="mb-0">
            Detalle de Reserva {reserva.isRoom ? "de Espacio" : "de Equipo"}
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Usuario:</strong> {reserva.usuario}
                </ListGroup.Item>

                {!reserva.isRoom && reserva.equipo && (
                  <ListGroup.Item>
                    <strong>Equipos:</strong> {reserva.equipo.join(", ")}
                  </ListGroup.Item>
                )}

                {reserva.isRoom && (
                  <ListGroup.Item>
                    <strong>Espacio:</strong> {reserva.espacio.name}
                  </ListGroup.Item>
                )}

                {!reserva.isRoom && (
                  <ListGroup.Item>
                    <strong>Aula:</strong> {reserva.aula}
                  </ListGroup.Item>
                )}

                <ListGroup.Item>
                  <strong>Día:</strong> {formatDayWithDate(reserva.dia)}
                </ListGroup.Item>

                {!reserva.isRoom && reserva.horaSalida && (
                  <ListGroup.Item>
                    <strong>Hora de Reserva:</strong>{" "}
                    {formatTo12h(reserva.horaSalida)}
                  </ListGroup.Item>
                )}

                {!reserva.isRoom && reserva.horaEntrada && (
                  <ListGroup.Item>
                    <strong>Hora de Entrega:</strong>{" "}
                    {formatTo12h(reserva.horaEntrada)}
                  </ListGroup.Item>
                )}

                {reserva.isRoom && reserva.horario && (
                  <ListGroup.Item>
                    <strong>Horario:</strong> {reserva.horario}
                  </ListGroup.Item>
                )}

                <ListGroup.Item>
                  <strong>Estado:</strong>{" "}
                  <Badge
                    bg={getBadgeColor(cleanEstado)}
                    className="text-uppercase"
                  >
                    {capitalize(cleanEstado)}
                  </Badge>
                </ListGroup.Item>
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

          <div className="text-center mt-4">
            <Button
              variant="success"
              className="mx-2"
              onClick={() => handleAbrirModal("Aprobar")}
            >
              Actualizar Estado
            </Button>
          </div>
        </Card.Body>
      </Card>

      {reserva.isRoom ? (
        <AulaReservacionEstadoModal
          show={showModal}
          onHide={handleCerrarModal}
          reservationId={reserva.id}
          currentStatus={reserva.estado}
          onSuccess={async (newEstado) => {
            setReserva({ ...reserva, estado: newEstado });
            setShowModal(false);
          }}
        />
      ) : (
        <ReservacionEstadoModal
          show={showModal}
          onHide={handleCerrarModal}
          reservationId={reserva.id}
          currentStatus={reserva.estado}
          onSuccess={async (newEstado) => {
            setReserva({ ...reserva, estado: newEstado });
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function getBadgeColor(estado: string) {
  const clean = estado.trim().toLowerCase();
  switch (clean) {
    case "pendiente":
      return "warning";
    case "aprobado":
      return "success";
    case "devuelto":
      return "info";
    case "cancelado":
      return "danger";
    case "rechazado":
      return "secondary";
    default:
      return "dark";
  }
}

function capitalize(text: string) {
  const clean = text.trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}