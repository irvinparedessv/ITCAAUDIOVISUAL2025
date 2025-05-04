import { useState, useEffect } from "react"; // Añade useEffect aquí
import { Badge, Button, Modal } from "react-bootstrap";
import api from "../api/axios";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useAuth } from "../hooks/AuthContext";
import toast from "react-hot-toast";
import { FaEye, FaQrcode } from "react-icons/fa";

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
  const [scanning, setScanning] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const qrBaseUrl = "https://midominio.com/qrcode/";
  

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await api.get(`/reservas/${user?.id}`);
        setReservations(response.data);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar las reservas");
      }
    };

    if (user?.id) {
      fetchReservations();
    }
  }, [user]);

  const handleDetailClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
  };

  const handleScanQR = () => {
    setScanning(!scanning);
    if (!scanning) {
      toast.success("Modo escaneo activado");
    }
  };

  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <h4 className="mb-3 text-center">Listado de Reservas</h4>
        
        <table
          className="table table-hover align-middle text-center overflow-hidden"
          style={{ borderRadius: '0.8rem' }}
        >
          <thead className="table-dark">
            <tr>
              <th className="rounded-top-start">Usuario</th>
              <th>Equipos</th>
              <th>Aula</th>
              <th>Fecha Salida</th>
              <th>Fecha Entrega</th>
              <th>Estado</th>
              <th className="rounded-top-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reserva) => (
              <tr key={reserva.id}>
                <td className="fw-bold">{reserva.user.name}</td>
                <td>
                  {reserva.equipos.slice(0, 2).map(e => e.nombre).join(", ")}
                  {reserva.equipos.length > 2 && "..."}
                </td>
                <td>{reserva.aula}</td>
                <td>{formatDate(reserva.fecha_reserva)}</td>
                <td>{formatDate(reserva.fecha_entrega)}</td>
                <td>
                  <Badge 
                    bg={getBadgeColor(reserva.estado)}
                    className="px-3 py-2"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {reserva.estado}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                      title="Ver detalles"
                      onClick={() => handleDetailClick(reserva)}
                      style={{
                        width: '44px',
                        height: '44px',
                        transition: 'transform 0.2s ease-in-out',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FaEye className="fs-5" />
                    </button>
                    <button
                      className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center"
                      title="Escanear QR"
                      onClick={handleScanQR}
                      style={{
                        width: '44px',
                        height: '44px',
                        transition: 'transform 0.2s ease-in-out',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FaQrcode className="fs-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  No hay reservas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
      <Modal.Header 
    closeButton 
    style={{ 
      backgroundColor: 'rgb(177, 41, 29)',
      color: 'white',
      borderBottom: 'none'
    }}
  >
    <Modal.Title>Detalle de la Reserva</Modal.Title>
  </Modal.Header>
        <Modal.Body>
          {selectedReservation && (
            <div>
              <div className="mb-3">
                <h5 className="fw-bold">Información del Usuario</h5>
                <p><strong>Nombre:</strong> {selectedReservation.user.name}</p>
                <p><strong>Correo:</strong> {selectedReservation.user.email}</p>
                <p><strong>Teléfono:</strong> {selectedReservation.user.phone || 'No registrado'}</p>
              </div>
              
              <div className="mb-3">
                <h5 className="fw-bold">Detalles de la Reserva</h5>
                <p><strong>Aula:</strong> {selectedReservation.aula}</p>
                <p><strong>Fecha de Salida:</strong> {formatDate(selectedReservation.fecha_reserva)}</p>
                <p><strong>Fecha de Entrega:</strong> {formatDate(selectedReservation.fecha_entrega)}</p>
                <p>
                  <strong>Estado:</strong> 
                  <Badge 
                    bg={getBadgeColor(selectedReservation.estado)}
                    className="ms-2 px-2 py-1"
                  >
                    {selectedReservation.estado}
                  </Badge>
                </p>
              </div>
              
              <div className="mb-3">
                <h5 className="fw-bold">Equipos Reservados</h5>
                <ul className="list-group">
                  {selectedReservation.equipos.map((equipo) => (
                    <li key={equipo.id} className="list-group-item">
                      {equipo.nombre} - {equipo.descripcion}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center mt-4">
                <h5 className="fw-bold mb-3">Código QR de la Reserva</h5>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrBaseUrl}${selectedReservation.codigo_qr.id}&size=200x200`}
                  alt="Código QR de Reserva"
                  className="img-fluid mb-2"
                />
                <p className="small text-muted">
                  {qrBaseUrl}
                  {selectedReservation.codigo_qr.id}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}