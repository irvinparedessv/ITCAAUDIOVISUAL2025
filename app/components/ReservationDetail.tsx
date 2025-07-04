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
} from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import type { Room } from "~/types/reservationroom";
import type { ReservationStatus } from "~/types/reservation";

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

  function formatDayWithDate(fecha: string) {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatTime(fechaHora: string) {
    const fechaISO = fechaHora.replace(" ", "T");
    const date = new Date(fechaISO);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    if (!idQr) return;

    const fetchReserva = async () => {
      try {
        const response = await api.get(`/reservasQR/${idQr}`);
        setReserva(response.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la reserva.");
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

  const handleEnviar = async () => {
    if (!reserva) return;

    try {
      const nuevoEstado: ReservationStatus =
        accion === "Aprobar" ? "Aprobado" : "Rechazado";

      await api.post(`/reservas/${idQr}/estado`, {
        estado: nuevoEstado,
        comentario,
      });

      setReserva({
        ...reserva,
        estado: nuevoEstado,
      });

      setShowModal(false);
    } catch (err) {
      console.error(err);
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

  const qrData = reserva.isRoom
    ? `Reserva de aula para ${reserva.usuario} en ${reserva.espacio.name} el ${reserva.dia}`
    : `Reserva de ${reserva.usuario} - ${reserva.equipo?.join(", ")} en ${
        reserva.aula
      } el ${reserva.dia}`;

  return (
    <>
      <Card className="shadow-lg my-4">
        <Card.Header className="bg-primary text-white text-center">
          <h5>Detalle de Reserva {reserva.isRoom ? "Espacio" : "Equipo"}</h5>
        </Card.Header>
        <Card.Body>
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
                {formatTime(reserva.horaSalida)}
              </ListGroup.Item>
            )}

            {!reserva.isRoom && reserva.horaEntrada && (
              <ListGroup.Item>
                <strong>Hora de Entrega:</strong>{" "}
                {formatTime(reserva.horaEntrada)}
              </ListGroup.Item>
            )}

            {reserva.isRoom && reserva.horario && (
              <ListGroup.Item>
                <strong>Horario:</strong> {reserva.horario}
              </ListGroup.Item>
            )}

            <ListGroup.Item>
              <strong>Estado:</strong>{" "}
              <Badge bg={getBadgeColor(reserva.estado)}>{reserva.estado}</Badge>
            </ListGroup.Item>

            <ListGroup.Item className="text-center">
              <strong>Código QR de la Reserva:</strong>
              <div className="mt-2">
                <QRCodeSVG value={qrData} size={128} />
              </div>
            </ListGroup.Item>

            <ListGroup.Item className="text-center mt-3">
              <Button
                variant="success"
                className="mx-2"
                onClick={() => handleAbrirModal("Aprobar")}
              >
                Actualizar Estado
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>

      {reserva.isRoom ? (
        <AulaReservacionEstadoModal
          show={showModal}
          onHide={handleCerrarModal}
          reservationId={reserva.id}
          currentStatus={reserva.estado}
          onSuccess={async () => {
            await handleEnviar();
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

function getBadgeColor(estado: ReservationStatus) {
  switch (estado.toLowerCase()) {
    case "pendiente":
      return "warning";
    case "aprobado":
      return "primary";
    case "devuelto":
      return "info";
    case "cancelado":
      return "danger";
    case "rechazado":
    default:
      return "secondary";
  }
}
