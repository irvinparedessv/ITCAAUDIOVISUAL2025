import ProtectedRoute from "~/helpers/ProtectedRoute";
import EquipmentReservationForm from "../components/EquipmentReservationForm";
import { Toaster } from "react-hot-toast";

export default function ReservationPage() {
   return (
      <ProtectedRoute>
        <Toaster position="top-right" />
        <EquipmentReservationForm />
      </ProtectedRoute>
    );
}
