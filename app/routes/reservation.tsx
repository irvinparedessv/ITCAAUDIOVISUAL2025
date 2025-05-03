import ProtectedRoute from "~/helpers/ProtectedRoute";
import EquipmentReservationForm from "../components/EquipmentReservationForm";

export default function ReservationPage() {
   return (
      <ProtectedRoute>
        <EquipmentReservationForm />
      </ProtectedRoute>
    );
}
