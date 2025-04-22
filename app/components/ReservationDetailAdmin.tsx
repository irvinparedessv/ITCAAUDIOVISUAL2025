import { Card, ListGroup, Badge, Button } from "react-bootstrap";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

export default function ReservationdetailAdmin() {
  // Reserva por default
  const reserva = {
    usuario: "Juan Pérez",
    equipo: ["Cámara", "Proyector"],
    aula: "Aula 101",
    dia: "2025-03-28",
    horaSalida: "08:00",
    horaEntrada: "12:00",
    estado: "Pendiente" as "Pendiente" | "Entregado" | "Devuelto",
  };

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
            <strong>Día:</strong> {reserva.dia}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Hora de Salida:</strong> {reserva.horaSalida}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Hora de Entrada:</strong> {reserva.horaEntrada}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Estado:</strong>{" "}
            <Badge bg={getBadgeColor(reserva.estado)}>{reserva.estado}</Badge>
          </ListGroup.Item>
          <ListGroup.Item className="text-center">
            <Button>Rechazar/Cancelar</Button>
            <Button className="btn btn-primary">Cambiar Estado</Button>
            <Button className="btn btn-primary">Agregar Observaciones</Button>
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
