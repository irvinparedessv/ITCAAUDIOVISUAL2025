import { useState } from "react";
import { FaCheck, FaUndo, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";

interface Props {
  reservationId: number;
  currentStatus: string;
  onSuccess?: () => void;
}

export default function AulaReservaEstado({
  reservationId,
  currentStatus,
  onSuccess,
}: Props) {
  const [newStatus, setNewStatus] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = "update-estado-reserva";

    // Cierra cualquier toast activo con el mismo ID
    toast.dismiss(toastId);

    if (!newStatus) {
      toast.error("Debes seleccionar un nuevo estado", { id: toastId });
      return;
    }

    try {
      setLoading(true);

      await api.put(`/reservas-aula/${reservationId}/estado`, {
        estado: newStatus,
        comentario: comment,
      });

      toast.success("Estado actualizado correctamente", { id: toastId });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado", { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Actualizar Estado de Reserva de Aula</h2>
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
            <option value="Aprobado">Aprobar</option>
            <option value="Rechazado">Rechazar</option>
            <option value="Devuelto">Marcar como finalizada</option>
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
