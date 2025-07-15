// components/ReservationDetailsModal.tsx
import React from "react";
import { Modal, Badge } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import type { HistorialItem, Reservation } from "~/types/reservation";

interface Props {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedReservation: Reservation | null;
  historial: HistorialItem[];
  loadingHistorial: boolean;
  formatDate: (date: string) => string;
  getBadgeColor: (
    estado: "Pendiente" | "Aprobado" | "Devuelto" | "Rechazado" | "Cancelado"
  ) => string;
  qrBaseUrl: string;
}

const EquipmentDetailsModal: React.FC<Props> = ({
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
            {/* Sección izquierda - Información principal */}
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
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-person me-2 text-body-emphasis"></i>
                      Nombre
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {selectedReservation.user.first_name}-
                      {selectedReservation.user.last_name}
                    </p>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-envelope me-2 text-body-emphasis"></i>
                      Correo
                    </span>
                    <p
                      className="mb-0 fw-semibold flex-grow-1 word-break"
                      style={{ minWidth: 0 }}
                    >
                      {selectedReservation.user.email}
                    </p>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-telephone me-2 text-body-emphasis"></i>
                      Teléfono
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {selectedReservation.user.phone || (
                        <span className="text-body-secondary">
                          No registrado
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-person-gear me-2 text-body-emphasis"></i>
                      Rol
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {selectedReservation.user.role.nombre}
                    </p>
                  </div>
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
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-door-open me-2 text-body-emphasis"></i>
                      Aula
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {selectedReservation.aula}
                    </p>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-box-arrow-right me-2 text-body-emphasis"></i>
                      Salida
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {formatDate(selectedReservation.fecha_reserva)}
                    </p>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-box-arrow-in-left me-2 text-body-emphasis"></i>
                      Entrega
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {formatDate(selectedReservation.fecha_entrega)}
                    </p>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-info-circle me-2 text-body-emphasis"></i>
                      Estado
                    </span>
                    <Badge
                      bg={getBadgeColor(selectedReservation.estado)}
                      className="px-3 py-1 d-flex justify-content-center align-items-center"
                      style={{
                        fontSize: "0.85rem",
                        width: "100%",
                      }}
                    >
                      {selectedReservation.estado}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="d-inline-block text-nowrap me-3"
                      style={{ width: "100px", fontWeight: "500" }}
                    >
                      <i className="bi bi-bookmark-star me-2 text-body-emphasis"></i>
                      Tipo
                    </span>
                    <p className="mb-0 fw-semibold flex-grow-1">
                      {selectedReservation.tipo_reserva?.nombre}
                    </p>
                  </div>
                  {/* Documento PDF o Word */}
                  {selectedReservation.documento_url && (
                    <div className="mt-3">
                      <strong className="d-block mb-2">
                        Documento del evento:
                      </strong>
                      <div className="mt-3 text-center">
                        <a
                          href={selectedReservation.documento_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-danger"
                        >
                          <FaEye className="me-1" /> Ver Documento
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h5>Historial de cambios</h5>
                  {loadingHistorial ? (
                    <div className="text-center my-3">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
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
            </div>

            {/* Sección derecha - Equipos y QR */}
            <div className="col-md-6">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="p-2 rounded me-3"
                    style={{ backgroundColor: "rgb(212, 158, 23)" }}
                  >
                    <i
                      className="bi bi-pc-display fs-4"
                      style={{ color: "#D4A017" }}
                    ></i>
                  </div>
                  <h5 className="fw-bold mb-0">Equipos Reservados</h5>
                </div>
                <div className="ps-5">
                  <div className="list-group">
                    {selectedReservation.equipos.map((equipo) => (
                      <div
                        key={equipo.id}
                        className="list-group-item border-0 bg-body-secondary mb-2 rounded d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <h6 className="fw-bold mb-1 d-flex align-items-center">
                            {equipo.nombre}
                          </h6>
                          <p className="small text-body-secondary mb-0">
                            {equipo.descripcion}
                          </p>
                        </div>
                        <span
                          className="badge rounded-pill bg-body-tertiary text-body-emphasis"
                          style={{ minWidth: "2rem" }}
                        >
                          1
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
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
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrBaseUrl}${selectedReservation.codigo_qr.id}&size=300x300`}
                        alt="Código QR de Reserva"
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          display: "block",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="small text-body-secondary mb-1">
                      Escanee este código para verificar la reserva
                    </p>
                    <p className="small bg-body-secondary p-2 rounded text-break">
                      <code className="text-body-secondary">
                        {qrBaseUrl}
                        {selectedReservation.codigo_qr.id}
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default EquipmentDetailsModal;
