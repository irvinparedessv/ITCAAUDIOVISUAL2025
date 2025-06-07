import { useParams } from "react-router-dom";
import ReservacionEstadoAula from "app/components/ReservacionEstadoAula";

export default function ReservationStatusAulaFormPage() {
  const { id } = useParams();

  return (
    <ReservacionEstadoAula
      reservationId={Number(id)}
      currentStatus="" // Puedes ajustar si necesitas estado actual
    />
  );
}
