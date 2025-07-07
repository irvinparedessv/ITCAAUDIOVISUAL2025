import { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { FaCheck, FaTimes, FaUndo, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import type { Reservation } from "../types/reservation"; // Ajusta el path si es necesario

interface Props {
  show: boolean;
  onHide: () => void;
  reservationId: number;
  currentStatus: Reservation["estado"];
  onSuccess?: (newStatus: Reservation["estado"]) => void;
  onBefore?: () => void;
  onAfter?: () => void;
}

export default function ReservacionEstadoModal({
  show,
  onHide,
  reservationId,
  currentStatus,
  onSuccess,
  onBefore,
  onAfter,
}: Props) {
  const [newStatus, setNewStatus] = useState<Reservation["estado"] | "">("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setNewStatus("");
      setComment("");
    }
  }, [show]);

  const getStatusOptions = () => {
    switch (currentStatus) {
      case "Pendiente":
        return ["Aprobado", "Rechazado"];
      case "Aprobado":
        return ["Devuelto"];
      default:
        return []; // Rechazado o Devuelto ya no permite cambios
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = `update-status-${reservationId}`;

    // Evita duplicados cerrando uno anterior con el mismo ID
    toast.dismiss(toastId);

    if (!newStatus) {
      toast.error("Debes seleccionar un nuevo estado", { id: toastId });
      return;
    }

    try {
      setLoading(true);
      onBefore?.();

      await api.put(`/reservas-equipo/${reservationId}/estado`, {
        estado: newStatus,
        comentario: comment,
      });

      toast.success("Estado actualizado correctamente", { id: toastId });
      onSuccess?.(newStatus as Reservation["estado"]);
      onHide();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado", { id: toastId });
    } finally {
      setLoading(false);
      onAfter?.();
    }
  };


  const statusOptions = getStatusOptions();
  const isReadOnly = currentStatus === "Rechazado" || currentStatus === "Devuelto";

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
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
          <i className="bi bi-arrow-repeat me-2" style={{ color: "#D4A017" }}></i>
          Actualizar Estado de Reserva #{reservationId}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "2rem" }}>
        {statusOptions.length === 0 ? (
          <p className="text-muted">Esta reserva ya no puede cambiar de estado.</p>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                <FaCheck className="me-2" />
                Nuevo Estado
              </Form.Label>
              <Form.Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Reservation["estado"])}
              >
                <option value="">Seleccione una opción</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                <FaUndo className="me-2" />
                Comentario (Opcional) {isReadOnly && "(no editable)"}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Agrega un comentario si es necesario"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isReadOnly}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={onHide} className="me-2">
                Cancelar
              </Button>
              <Button type="submit" variant="success" style={{ backgroundColor: "#8b0000", borderColor: "#8b0000" }} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>

  );
}
