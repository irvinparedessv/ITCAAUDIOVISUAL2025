import React, { useEffect, useState } from "react";
import {
  Button,
  Row,
  Col,
  Spinner,
  Table,
  Badge,
  Modal,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../api/axios";
import AulaReservacionEstadoModal from "./RoomReservationStateModal"; // Asegúrate que el path sea correcto

const RoomReservationList = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getEstadoVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning";
      case "cancelado":
        return "danger";
      case "aprobado":
        return "success";
      default:
        return "secondary";
    }
  };

  useEffect(() => {
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    setRange({ from: pastWeek, to: today });
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!range.from || !range.to) return;

      setIsLoading(true);
      try {
        const response = await api.get("/reservas-aula", {
          params: {
            from: range.from.toISOString(),
            to: range.to.toISOString(),
          },
        });
        if (response.data) setReservations(response.data.data);
      } catch (error) {
        console.error("Error al obtener reservas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [range.from, range.to]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleEstadoClick = (reserva: any) => {
    setSelectedReserva(reserva);
    setShowEstadoModal(true);
  };

  const handleEstadoSuccess = (nuevoEstado: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === selectedReserva.id ? { ...r, estado: nuevoEstado } : r
      )
    );
    setShowEstadoModal(false);
    setSelectedReserva(null);
  };

  const handleDetailClick = (reserva: any) => {
    setSelectedReserva(reserva);
    setShowDetailModal(true);
  };

  return (
    <div className="mt-4 px-3">
      <Row className="align-items-center mb-4">
        <Col>
          <h2>Reservas de Aulas</h2>
        </Col>
        <Col md="auto">
          <Row>
            <Col>
              <DatePicker
                selected={range.from}
                onChange={(date) =>
                  setRange((prev) => ({ ...prev, from: date }))
                }
                selectsStart
                startDate={range.from}
                endDate={range.to}
                placeholderText="Desde"
                className="form-control"
              />
            </Col>
            <Col>
              <DatePicker
                selected={range.to}
                onChange={(date) => setRange((prev) => ({ ...prev, to: date }))}
                selectsEnd
                startDate={range.from}
                endDate={range.to}
                placeholderText="Hasta"
                className="form-control"
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {isLoading ? (
        <Spinner animation="border" />
      ) : reservations.length === 0 ? (
        <p>No hay reservas en este rango de fechas.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Aula</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Reservado por</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res: any) => (
              <tr key={res.id}>
                <td>{res.aula?.name || "Aula Desconocida"}</td>
                <td>{formatDate(res.fecha)}</td>
                <td>{res.horario}</td>
                <td>{res.user?.first_name || "Desconocido"}</td>
                <td>
                  <Badge bg={getEstadoVariant(res.estado)}>{res.estado}</Badge>
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDetailClick(res)}
                  >
                    Ver detalles
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="ms-2"
                    onClick={() => handleEstadoClick(res)}
                  >
                    Cambiar estado
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal Detalle */}
      {selectedReserva && (
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Detalle de Reserva</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Aula:</strong> {selectedReserva.aula?.name}
            </p>
            <p>
              <strong>Fecha:</strong> {formatDate(selectedReserva.fecha)}
            </p>
            <p>
              <strong>Horario:</strong> {selectedReserva.horario}
            </p>
            <p>
              <strong>Reservado por:</strong> {selectedReserva.user?.first_name}
            </p>
            <p>
              <strong>Estado:</strong> {selectedReserva.estado}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDetailModal(false)}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Modal Estado actualizado con diseño completo */}
      {selectedReserva && (
        <AulaReservacionEstadoModal
          show={showEstadoModal}
          onHide={() => setShowEstadoModal(false)}
          reservationId={selectedReserva.id}
          currentStatus={selectedReserva.estado}
          onSuccess={handleEstadoSuccess}
        />
      )}
    </div>
  );
};

export default RoomReservationList;
