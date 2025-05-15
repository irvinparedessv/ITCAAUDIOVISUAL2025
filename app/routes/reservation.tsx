
import EquipmentReservationForm from "../components/EquipmentReservationForm";
import { Toaster } from "react-hot-toast";

export default function ReservationPage() {
   return (
    <>
        <Toaster position="top-right" />
        <EquipmentReservationForm />
    </>
    );
}
