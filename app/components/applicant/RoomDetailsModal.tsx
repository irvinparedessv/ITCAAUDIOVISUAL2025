import React from "react";
import { Modal, Badge } from "react-bootstrap";
import type {
  ReservationRoom,
  HistorialItem,
} from "../../types/reservationroom";

interface Props {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedReservation: ReservationRoom | null;
  historial: HistorialItem[];
  loadingHistorial: boolean;
  formatDate: (date: string) => string;
  getBadgeColor: (estado: ReservationRoom["estado"]) => string;
  qrBaseUrl: string;
}

const RoomDetailsModal: React.FC<Props> = ({
  showModal,
  handleCloseModal,
  selectedReservation,
  historial,
  loadingHistorial,
  formatDate,
  getBadgeColor,
  qrBaseUrl,
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
            <div className="col-md-6">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="p-2 rounded me-3"
                    style={{ backgroundColor: "rgb(212, 158, 23)" }}
                  >
                    <i
                      className="bi bi-person-fill fs-4"
                      style={{ color: "#D4A017" }}
                    ></i>
                  </div>
                  <h5 className="fw-bold mb-0">Información del Usuario</h5>
                </div>
                <div className="ps-5">
                  <p>
                    <strong>Nombre:</strong>{" "}
                    {selectedReservation.user.first_name}{" "}
                    {selectedReservation.user.last_name}
                  </p>
                  <p>
                    <strong>Correo:</strong> {selectedReservation.user.email}
                  </p>
                  <p>
                    <strong>Rol:</strong> {selectedReservation.user.role.nombre}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="p-2 rounded me-3"
                    style={{ backgroundColor: "rgb(212, 158, 23)" }}
                  >
                    <i
                      className="bi bi-calendar-check fs-4"
                      style={{ color: "#D4A017" }}
                    ></i>
                  </div>
                  <h5 className="fw-bold mb-0">Detalles de Reserva</h5>
                </div>
                <div className="ps-5">
                  <p>
                    <strong>Aula:</strong> {selectedReservation.aula.name}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatDate(selectedReservation.fecha)}
                  </p>
                  <p>
                    <strong>Horario:</strong> {selectedReservation.horario}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    <Badge bg={getBadgeColor(selectedReservation.estado)}>
                      {selectedReservation.estado}
                    </Badge>
                  </p>
                  <p>
                    <strong>Comentario:</strong>{" "}
                    {selectedReservation.comentario || "Sin comentario"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h5>Historial de cambios</h5>
                {loadingHistorial ? (
                  <div className="text-center my-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : historial.length > 0 ? (
                  <ul className="list-group">
                    {historial.map((item) => (
                      <li key={item.id} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <strong>{item.nombre_usuario}</strong>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        <div className="mt-2">
                          <Badge bg="info">{item.accion}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No hay registro de cambios</p>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="p-2 rounded me-3"
                  style={{ backgroundColor: "rgb(212, 158, 23)" }}
                >
                  <i
                    className="bi bi-qr-code-scan fs-4"
                    style={{ color: "#D4A017" }}
                  ></i>
                </div>
                <h5 className="fw-bold mb-0">Código QR</h5>
              </div>

              <div className="ps-5">
                <div className="text-center">
                  <div className="bg-body-secondary p-3 rounded-3 shadow-sm mb-3 d-inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrBaseUrl}${selectedReservation.id}&size=300x300`}
                      alt="Código QR de Reserva"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
                <p className="small text-body-secondary mb-1">
                  Escanee este código para verificar la reserva
                </p>
                <p className="small bg-body-secondary p-2 rounded text-break">
                  <code className="text-body-secondary">
                    {qrBaseUrl}
                    {selectedReservation.id}
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default RoomDetailsModal;
