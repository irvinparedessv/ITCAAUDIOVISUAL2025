// routes.tsx
import { createBrowserRouter } from "react-router-dom";
import ProtectedLayout from "./layouts/protected-layout";

// públicas
import Login from "./routes/login";
import ForgotPassword from "./routes/forgot-password";
import ResetPassword from "./routes/reset-password";
import ConfirmAccount from "./routes/confirm-account";
import Forbidden from "./components/auth/Forbidden";

// protegidas
import Home from "./routes/home";
import AddReservation from "./routes/reservation";
import ReservationList from "./routes/reservationList";
import ReservationDetail from "./routes/reservationDetail";
import CreacionEspacio from "./routes/creacionEspacio";
import TipoEquipos from "./routes/tipoEquipos";
import Equipos from "./routes/equipment/equipments";
import FormUsuario from "./routes/formUsuario";
import EditUsuario from "./routes/editUsuario";
import UsuarioListPage from "./routes/usuarioList";
import QrScan from "./routes/qr";
import VerPerfil from "./routes/verPerfil";
import EditPerfil from "./routes/editPerfil";
import BitacoraPage from "./routes/BitacoraPage";
import NotificationsList from "./routes/NotificationsList";
import PrediccionPage from "./components/prediction/PrediccionPage";
import OpcionesPanel from "./dashboard/OpcionesPanel";
import OpcionesReportes from "./dashboard/OpcionesReportes";
import App from "./root";
import ReservaAulaDetail from "./components/applicant/ReservationRoomDetails";
import ReserveClassroom from "./components/RoomReservationForm";
import EspacioListWrapper from "./routes/wrappers/reservations";
import EquipmentListPage from "./routes/equipment/equipmentListPage";
import EquipmentEditPage from "./routes/equipment/equipmentEditPage";
import PrediccionPorEquipoPage from "./components/prediction/PrediccionPorEquipoPage";
import AulaList from "./components/attendantadmin/RoomList";
import EditEquipmentReservationForm from "./components/EditEquipmentReservationForm";
import AsignarEncargadosForm from "./components/FormEncargadosEspacio";
import EquipmentAvailabilityListPage from "./routes/EquipmentAvailabilityPage";
import ReporteReservasPorFecha from "./components/reports/ReporteReservasPorFecha";
import ReporteReservasPorUsuario from "./components/reports/ReporteReservasPorUsuario";
import ReporteUsoAulas from "./components/reports/ReporteUsoAulas";
import ReporteUsoEquipos from "./components/reports/ReporteUsoEquipos";
import ReporteHorariosSolicitados from "./components/reports/ReporteHorariosSolicitados";
import ReporteInventarioEquipos from "./components/reports/ReporteInventarioEquipos";
import OpcionesAnalisis from "./dashboard/OpcionesAnalisis";
import ReporteReservasPorAula from "./components/reports/ReporteReservasPorAula";
import PrediccionAulaPage from "./components/prediction/PrediccionAulaPage";
import RoomsAvailabilityList from "./components/rooms/RoomsAvailability";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/confirm-account/:token",
    element: <ConfirmAccount />,
  },
  {
    path: "/forbidden",
    element: <Forbidden />,
  },
  {
    path: "/",
    element: <App />, // ← App ahora es el layout principal
    children: [
      {
        path: "/",
        element: <ProtectedLayout />, // ← layout adicional si querés
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "addreservation",
            element: <AddReservation />,
          },
          {
            path: "rooms",
            element: <AulaList />,
          },
          {
            path: "/aulas/editar/:id",
            element: <CreacionEspacio />,
          },
          {
            path: "/reservas-aula/:id",
            element: <ReservaAulaDetail />,
          },
          {
            path: "roomsavailability",
            element: <RoomsAvailabilityList />,
          },
          {
            path: "reservations",
            element: <ReservationList />,
          },
          {
            path: "reservationdetail/:idQr",
            element: <ReservationDetail />,
          },
          {
            path: "/equipmentreservation/edit/:id",
            element: <EditEquipmentReservationForm />,
          },
          {
            path: "createRoom",
            element: <CreacionEspacio />,
          },
          {
            path: "equipmentavailability",
            element: <EquipmentAvailabilityListPage />,
          },
          {
            path: "reservationsroom",
            element: <ReserveClassroom />,
          },
          {
            path: "reservas-aula/editar/:id",
            element: <ReserveClassroom />,
          },
          {
            path: "reservations-room",
            element: <EspacioListWrapper />,
          },
          {
            path: "aulas/encargados/:aulaId",
            element: <AsignarEncargadosForm />,
          },
          {
            path: "tipoEquipo",
            element: <TipoEquipos />,
          },
          {
            path: "equipo",
            element: <Equipos />,
          },
          {
            path: "/equipos/editar/:id",
            element: <EquipmentEditPage />,
          },
          {
            path: "equipolist",
            element: <EquipmentListPage />,
          },
          {
            path: "formUsuario",
            element: <FormUsuario />,
          },
          {
            path: "usuarios",
            element: <UsuarioListPage />,
          },
          {
            path: "editarUsuario/:id",
            element: <EditUsuario />,
          },
          {
            path: "qrScan",
            element: <QrScan />,
          },
          {
            path: "perfil",
            element: <VerPerfil />,
          },
          {
            path: "editarPerfil",
            element: <EditPerfil />,
          },
          {
            path: "bitacora",
            element: <BitacoraPage />,
          },
          {
            path: "notifications",
            element: <NotificationsList />,
          },
          {
            path: "prediccion",
            element: <PrediccionPage />,
          },
          {
            path: "prediccionPorEquipoPage",
            element: <PrediccionPorEquipoPage />,
          },
          {
            path: "administracion",
            element: <OpcionesPanel />,
          },
          {
            path: "opcionesReportes",
            element: <OpcionesReportes />,
          },
          {
            path: "opcionesAnalisis",
            element: <OpcionesAnalisis />,
          },
          {
            path: "reporteReservasEquipo",
            element: <ReporteReservasPorFecha />,
          },
          {
            path: "reporteReservasUsuarios",
            element: <ReporteReservasPorUsuario />,
          },
          {
            path: "reporteAulas",
            element: <ReporteUsoAulas />,
          },
          {
            path: "reporteEquipos",
            element: <ReporteUsoEquipos />,
          },
          {
            path: "reporteHorarios",
            element: <ReporteHorariosSolicitados />,
          },
          {
            path: "reporteInventario",
            element: <ReporteInventarioEquipos />,
          },
          {
            path: "reporteReservasAulas",
            element: <ReporteReservasPorAula />,
          },
          {
            path: "prediccionAula",
            element: <PrediccionAulaPage />,
          },
        ],
      },
    ],
  },
]);

export default router;
