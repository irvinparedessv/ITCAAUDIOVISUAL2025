import { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { FaCheck, FaUndo, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/axios";
import type { ReservationStatus } from "~/types/reservation";

interface Props {
  show: boolean;
  onHide: () => void;
  reservationId: number;
  currentStatus: ReservationStatus;
  onSuccess?: (newStatus: ReservationStatus) => void;
  onBefore?: () => void;
  onAfter?: () => void;

  // nuevos props
  blockId?: number;
  isRecurrent?: boolean;
}

export default function RoomReservationStateModal({
  show,
  onHide,
  reservationId,
  currentStatus,
  onSuccess,
  onBefore,
  onAfter,
  blockId,
  isRecurrent,
}: Props) {
  const [newStatus, setNewStatus] = useState<ReservationStatus | "">("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [updateSeries, setUpdateSeries] = useState(false); // checkbox

  useEffect(() => {
    if (show) {
      setNewStatus("");
      setComment("");
      setUpdateSeries(false);
    }
  }, [show]);

  const getStatusOptions = (): ReservationStatus[] => {
    switch (currentStatus.toLowerCase()) {
      case "pendiente":
        return ["Aprobado", "Rechazado"];
      case "aprobado":
        return ["Cancelado"];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = "update-estado-aula";
    toast.dismiss(toastId);

    if (!newStatus) {
      toast.error("Debes seleccionar un nuevo estado", { id: toastId });
      return;
    }

    try {
      setLoading(true);
      onBefore?.();

      const payload: any = {
        estado: newStatus,
        comentario: comment,
      };

      if (isRecurrent && blockId) {
        payload.blockId = blockId;
        payload.updateSeries = updateSeries;
      }

      await api.put(`/reservas-aula/${reservationId}/estado`, payload);

      toast.success("Estado actualizado correctamente", { id: toastId });

      onSuccess?.(newStatus);
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
  const isReadOnly =
    currentStatus.toLowerCase() === "rechazado" ||
    currentStatus.toLowerCase() === "cancelado";

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
          <i
            className="bi bi-arrow-repeat me-2"
            style={{ color: "#D4A017" }}
          ></i>
          Actualizar Estado de Reserva #{reservationId}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "2rem" }}>
        {statusOptions.length === 0 ? (
          <p className="text-muted">
            Esta reserva ya no puede cambiar de estado.
          </p>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                <FaCheck className="me-2" />
                Nuevo Estado
              </Form.Label>
              <Form.Select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(e.target.value as ReservationStatus)
                }
                disabled={loading}
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
                disabled={isReadOnly || loading}
              />
            </Form.Group>

            {isRecurrent && blockId && (
              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  label="Aplicar cambio a toda la serie"
                  checked={updateSeries}
                  onChange={(e) => setUpdateSeries(e.target.checked)}
                  disabled={loading}
                />
              </Form.Group>
            )}

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                onClick={onHide}
                className="me-2"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                style={{ backgroundColor: "#8b0000", borderColor: "#8b0000" }}
                disabled={loading}
              >
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
