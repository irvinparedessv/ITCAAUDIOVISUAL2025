// EspacioListWrapper.tsx
import { useAuth } from "../../hooks/AuthContext";
import RoomReservationList from "../../components/applicant/RoomReservationList/RoomReservationList";
import RoomReservationListAdmin from "../../components/attendantadmin/RoomReservationList";

const EspacioListWrapper = () => {
  const { user } = useAuth();

  if (
    user?.roleName == "Administrador" ||
    user?.roleName == "Encargado" ||
    user?.roleName == "EspacioEncargado"
  ) {
    return <RoomReservationListAdmin />;
  }

  return <RoomReservationList />;
};

export default EspacioListWrapper;
