import { useState } from "react";
import { FaCheck, FaTimes, FaUndo, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";

interface Props {
  reservationId: number;
  currentStatus: string;
  onSuccess?: () => void;
}

export default function ReservacionEstado({
  reservationId,
  currentStatus,
  onSuccess,
}: Props) {
  const [newStatus, setNewStatus] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStatus) {
      toast.error("Debes seleccionar un nuevo estado");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/reservas/${reservationId}/actualizar-estado`, {
        estado: newStatus,
        comentario: comment,
      });
      toast.success("Estado actualizado correctamente");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Actualizar Estado de Reserva</h2>
      <form onSubmit={handleSubmit}>
        {/* Estado */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaCheck className="me-2" />
            Nuevo Estado
          </label>
          <select
            className="form-select"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <option value="">Seleccione una opción</option>
            <option value="approved">Aprobar</option>
            <option value="rejected">Rechazar</option>
            <option value="returned">Marcar como devuelto</option>
          </select>
        </div>

        {/* Comentario */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaUndo className="me-2" />
            Comentario (opcional)
          </label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Agrega un comentario si es necesario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>

        {/* Botón */}
        <div className="form-actions">
          <button type="submit" className="btn primary-btn" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                <span role="status">Guardando...</span>
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
