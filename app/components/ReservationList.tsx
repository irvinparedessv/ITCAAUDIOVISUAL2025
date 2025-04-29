import { Table, Container, Badge, Button, Form, Modal } from "react-bootstrap";
import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useAuth } from "../hooks/AuthContext";

type Role = {
  id: number;
  nombre: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  estado: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  role_id: number;
  role: Role;
};

type Equipo = {
  id: number;
  nombre: string;
  descripcion: string;
  estado: number;
  cantidad: number;
  is_deleted: number;
  tipo_equipo_id: number;
  created_at: string;
  updated_at: string;
  pivot: {
    reserva_equipo_id: number;
    equipo_id: number;
  };
};

type CodigoQR = {
  id: string; // GUID
  reserva_id: number;
  created_at: string;
  updated_at: string;
};

type Reservation = {
  id: number;
  user_id: number;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: "Pendiente" | "Entregado" | "Devuelto";
  created_at: string;
  updated_at: string;
  user: User;
  aula: string;
  equipos: Equipo[];
  codigo_qr: CodigoQR;
};

export default function ReservationList() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [qrData, setQrData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleDetailClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
  };

  useEffect(() => {
    // Obtener las reservas del usuario autenticado
    const fetchReservations = async () => {
      try {
        const response = await api.get(`/reservas/${user?.id}`); // Ajusta la ruta si es necesario
        setReservations(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    if (user?.id) {
      fetchReservations();
    }
  }, [user]);

  const qrBaseUrl = "https://midominio.com/qrcode/"; // ⚡️ Cambia a tu dominio real

  return (
    <Container className="my-5">
      <h3 className="mb-4 text-center">Listado de Reservas</h3>

      {scanning && (
        <div className="mt-3">
          <video
            ref={videoRef}
            width="100%"
            height="auto"
            style={{ border: "1px solid black" }}
          />
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
            <th>Fecha de Salida</th>
            <th>Fecha de Entrega</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reserva) => (
            <tr key={reserva.id}>
              <td>{reserva.user.name}</td>
              <td>{reserva.equipos.map((e) => e.nombre).join(", ")}</td>
              <td>{reserva.aula}</td> {/* ⚡️ Ajusta si después agregas aula */}
              <td>{formatDate(reserva.fecha_reserva)}</td>
              <td>{formatDate(reserva.fecha_entrega)}</td>
              <td>
                <Badge bg={getBadgeColor(reserva.estado)}>
                  {reserva.estado}
                </Badge>
              </td>
              <td>
                <Button size="sm" onClick={() => handleDetailClick(reserva)}>
                  Detalles
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de Detalle */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de la Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReservation && (
            <div>
              <p>
                <strong>Usuario:</strong> {selectedReservation.user.name}
              </p>
              <p>
                <strong>Correo:</strong> {selectedReservation.user.email}
              </p>
              <p>
                <strong>Equipos:</strong>{" "}
                {selectedReservation.equipos.map((e) => e.nombre).join(", ")}
              </p>
              <p>
                <strong>Aula:</strong> {selectedReservation.aula}
              </p>
              <p>
                <strong>Fecha de Salida:</strong>{" "}
                {formatDate(selectedReservation.fecha_reserva)}
              </p>
              <p>
                <strong>Fecha de Entrega:</strong>{" "}
                {formatDate(selectedReservation.fecha_entrega)}
              </p>
              <p>
                <strong>Estado:</strong> {selectedReservation.estado}
              </p>

              {/* Código QR */}
              <div className="text-center mt-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrBaseUrl}${selectedReservation.codigo_qr.id}&size=200x200`}
                  alt="Código QR de Reserva"
                />
                <p className="mt-2 small">
                  {qrBaseUrl}
                  {selectedReservation.codigo_qr.id}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// Función para colorear el estado
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

// Formatear fechas bonitas
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString(); // o puedes usar date.toLocaleDateString()
}
