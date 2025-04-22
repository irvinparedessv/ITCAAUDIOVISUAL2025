import { Table, Container, Badge, Button, Form } from "react-bootstrap";
import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

type Reservation = {
  usuario: string;
  equipo: string[];
  aula: string;
  dia: string;
  horaSalida: string;
  horaEntrada: string;
  estado: "Pendiente" | "Entregado" | "Devuelto";
};

const sampleReservations: Reservation[] = [
  {
    usuario: "Juan Tim",
    equipo: ["Cámara", "Trípode"],
    aula: "Aula 101",
    dia: "Viernes - (03-28-2025)",
    horaSalida: "08:00",
    horaEntrada: "12:00",
    estado: "Pendiente",
  },
  {
    usuario: "María López",
    equipo: ["Proyector"],
    aula: "Auditorio",
    dia: "Jueves - (03-27-2025)",
    horaSalida: "10:00",
    horaEntrada: "14:00",
    estado: "Entregado",
  },
];

export default function ReservationList() {
  const [qrData, setQrData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (scanning && videoRef.current) {
      const codeReader = new BrowserMultiFormatReader();
      codeReader
        .decodeFromInputVideoDevice(undefined, videoRef.current)
        .then((result) => {
          setQrData(result.getText());
        })
        .catch((err) => {
          console.error("Error al escanear:", err);
        });

      return () => {
        codeReader.reset();
      };
    }
  }, [scanning]);

  const handleScanClick = () => {
    setScanning(!scanning);
  };

  return (
    <Container className="my-5">
      <h3 className="mb-4 text-center">Listado de Reservas</h3>
      <Button variant="secondary" onClick={handleScanClick}>
        {scanning ? "Detener Escaneo" : "Escanear Código QR"}
      </Button>

      {scanning && (
        <div className="mt-3">
          <video ref={videoRef} width="100%" height="auto" style={{ border: "1px solid black" }} />
        </div>
      )}

      {qrData && (
        <Form.Group className="mt-3">
          <Form.Label>Datos del Código QR</Form.Label>
          <Form.Control type="text" value={qrData} readOnly />
        </Form.Group>
      )}

      <Table striped bordered hover responsive className="mt-4">
        <thead className="table-primary">
          <tr>
            <th>Usuario</th>
            <th>Equipos</th>
            <th>Aula</th>
            <th>Día</th>
            <th>Hora de Salida</th>
            <th>Hora de Entrada</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {sampleReservations.map((reserva, index) => (
            <tr key={index}>
              <td>{reserva.usuario}</td>
              <td>{reserva.equipo.join(", ")}</td>
              <td>{reserva.aula}</td>
              <td>{reserva.dia}</td>
              <td>{reserva.horaSalida}</td>
              <td>{reserva.horaEntrada}</td>
              <td>
                <Badge bg={getBadgeColor(reserva.estado)}>{reserva.estado}</Badge>
                <Button className="ms-2">Detalles</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

function getBadgeColor(estado: Reservation["estado"]) {
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
