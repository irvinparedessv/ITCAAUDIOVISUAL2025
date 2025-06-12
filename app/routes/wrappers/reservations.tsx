// EspacioListWrapper.tsx
import { useAuth } from "../../hooks/AuthContext";
import RoomReservationList from "../../components/applicant/RoomReservationList";
import RoomReservationListAdmin from "../../components/attendantadmin/RoomReservationList";

const EspacioListWrapper = () => {
  const { user } = useAuth();

  if (user?.roleName == "admin") {
    return <RoomReservationListAdmin />;
  }

  return <RoomReservationList />;
};

export default EspacioListWrapper;
