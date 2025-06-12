// components/ReservationDetailsModal.tsx
import React from "react";
import { Modal, Badge } from "react-bootstrap";
import type { HistorialItem, Reservation } from "~/types/reservation";

interface Props {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedReservation: Reservation | null;
  historial: HistorialItem[];
  loadingHistorial: boolean;
  formatDate: (date: string) => string;
  getBadgeColor: (estado: "Pendiente" | "Entregado" | "Devuelto") => string;
}

const EquipmentDetailsModal: React.FC<Props> = ({
  showModal,
  handleCloseModal,
  selectedReservation,
  historial,
  loadingHistorial,
  formatDate,
  getBadgeColor,
}) => {
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
          Detalles de Reserva #{selectedReservation?.id}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "2rem" }}>
        {selectedReservation && (
          <div className="row g-4">
            {/* Información del usuario y detalles */}
            <div className="col-md-6">
              {/* ... mismo contenido que ya tenías ... */}
            </div>

            {/* Equipos reservados */}
            <div className="col-md-6">
              {/* ... mismo contenido que ya tenías ... */}
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default EquipmentDetailsModal;
