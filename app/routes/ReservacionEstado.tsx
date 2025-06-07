import { useParams } from "react-router-dom";
import ReservacionEstado from "app/components/ReservacionEstado";

export default function ReservationStatusFormPage() {
  const { id } = useParams();

  return (
    <ReservacionEstado
      reservationId={Number(id)}
      currentStatus="" // Puedes ajustar si necesitas estado actual
    />
  );
}
