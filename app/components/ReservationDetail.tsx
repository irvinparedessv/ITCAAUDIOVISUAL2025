import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, ListGroup, Badge, Spinner, Alert } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";

type Reserva = {
  usuario: string;
  equipo: string[];
  aula: string;
  dia: string;
  horaSalida: string;
  horaEntrada: string;
  estado: "Pendiente" | "Entregado" | "Devuelto";
};

export default function ReservationDetail() {
  const { idQr } = useParams<{ idQr: string }>();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!reserva) {
    return null;
  }

  const qrData = `Reserva de ${reserva.usuario} - ${reserva.equipo.join(
    ", "
  )} en ${reserva.aula} el ${reserva.dia} de ${reserva.horaSalida} a ${
    reserva.horaEntrada
  }`;

  return (
    <Card className="shadow-lg my-4">
      <Card.Header className="bg-primary text-white text-center">
        <h5>Detalle de Reserva</h5>
      </Card.Header>
      <Card.Body>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <strong>Usuario:</strong> {reserva.usuario}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Equipos:</strong> {reserva.equipo.join(", ")}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Aula:</strong> {reserva.aula}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Día:</strong> {formatDayWithDate(reserva.horaSalida)}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Hora de Reserva:</strong> {formatTime(reserva.horaSalida)}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Hora de Entrega:</strong> {formatTime(reserva.horaEntrada)}
          </ListGroup.Item>
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
        </ListGroup>
      </Card.Body>
    </Card>
  );
}

function getBadgeColor(estado: "Pendiente" | "Entregado" | "Devuelto") {
  switch (estado) {
    case "Pendiente":
      return "warning";
    case "Entregado":
      return "primary";
    case "Devuelto":
      return "success";
    default:
      return "secondary";
  }
}
