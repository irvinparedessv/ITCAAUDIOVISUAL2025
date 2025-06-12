// components/ReservationDetailsModal.tsx
import React from "react";
import { Modal, Badge, Table } from "react-bootstrap";
import type { HistorialItem } from "~/types/reservation";
import type { ReservationRoom } from "~/types/reservationroom";

interface Props {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedReservation: ReservationRoom | null;
  historial: HistorialItem[];
  loadingHistorial: boolean;
  formatDate: (date: string) => string;
  getBadgeColor: (estado: "Pendiente" | "Entregado" | "Devuelto") => string;
}

const ReservationDetailsModal: React.FC<Props> = ({
  showModal,
  handleCloseModal,
  selectedReservation,
  historial,
  loadingHistorial,
  formatDate,
  getBadgeColor,
}) => {
  if (!selectedReservation) return null;

  return (
    <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
      <Modal.Header
        closeButton
        className="text-white"
        style={{
          backgroundColor: "rgb(177, 41, 29)",
          borderBottom: "none",
          padding: "1.5rem",
        }}
      >
        <Modal.Title className="fw-bold">
          <i
            className="bi bi-card-checklist me-2"
            style={{ color: "#D4A017" }}
          ></i>
          Detalles de Reserva #{selectedReservation.id}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "2rem" }}>
        <div className="row g-4">
          {/* Información principal */}
          <div className="col-md-6">
            <p>
              <strong>Aula:</strong>{" "}
              {selectedReservation.aula?.name || "No especificado"}
            </p>
            <p>
              <strong>Fecha:</strong> {formatDate(selectedReservation.fecha)}
            </p>
            <p>
              <strong>Horario:</strong> {selectedReservation.horario}
            </p>
            <p>
              <strong>Reservado por:</strong>{" "}
              {selectedReservation.user?.first_name || "Desconocido"}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              <Badge bg={getBadgeColor(selectedReservation.estado as any)}>
                {selectedReservation.estado}
              </Badge>
            </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ReservationDetailsModal;
