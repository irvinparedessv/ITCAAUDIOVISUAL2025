// routes.tsx
import { createBrowserRouter } from "react-router-dom";
import ProtectedLayout from "./layouts/protected-layout";

// públicas
import Login from "./routes/login";
import ForgotPassword from "./routes/forgot-password";
import ResetPassword from "./routes/reset-password";
import ConfirmAccount from "./routes/confirm-account";
import Forbidden from "./components/auth/Forbidden";
import ChangePassword from "./components/auth/change-password";

// protegidas
import Home from "./routes/home";
import AddReservation from "./routes/reservation";
import ReservationList from "./routes/reservationList";
import ReservationDetail from "./routes/reservationDetail";
import ReservationDetailAdmin from "./routes/reservationDetailAdmin";
import FormEquipo from "./routes/formEquipo";
import CreacionEspacio from "./routes/creacionEspacio";
import FormChat from "./routes/formChat";
import OptionsReservation from "./routes/optionsReservation";
import TipoEquipos from "./routes/tipoEquipos";
import Equipos from "./routes/equipment/equipments";
import FormUsuario from "./routes/formUsuario";
import EditUsuario from "./routes/editUsuario";
import UsuarioListPage from "./routes/usuarioList";
import QrScan from "./routes/qr";
import ApproveReservations from "./routes/attendant/approveReservations";
import VerPerfil from "./routes/verPerfil";
import EditPerfil from "./routes/editPerfil";
import ReservacionEstado from "./routes/ReservacionEstado";
import ReservacionEstadoAula from "./routes/ReservacionEstadoAula";
import BitacoraPage from "./routes/BitacoraPage";
import NotificationsList from "./routes/NotificationsList";
import PrediccionPage from "./routes/PrediccionPage";
import OpcionesPanel from "./dashboard/OpcionesPanel";
import OpcionesReportes from "./dashboard/OpcionesReportes";
import App from "./root";
import ReservaAulaDetail from "./components/applicant/ReservationRoomDetails";
import ReserveClassroom from "./components/RoomReservationForm";
import EspacioListWrapper from "./routes/wrappers/reservations";
import EquipmentListPage from "./routes/equipment/equipmentListPage";
import EquipmentEditPage from "./routes/equipment/equipmentEditPage";
import PrediccionPorEquipoPage from "./routes/PrediccionPorEquipoPage";
import AulaList from "./components/attendantadmin/RoomList";
import EditEquipmentReservationForm from "./components/EditEquipmentReservationForm";
import AsignarEncargadosForm from "./components/FormEncargadosEspacio";
import EquipmentAvailabilityListPage from "./routes/EquipmentAvailabilityPage";
import ReporteReservasPorFecha from "./routes/ReporteReservasPorFecha";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
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
    path: "/change-password",
    element: <ChangePassword />,
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
            path: "reservationdetailAdmin",
            element: <ReservationDetailAdmin />,
          },
          {
            path: "formEquipo",
            element: <FormEquipo />,
          },
          {
            path: "createRoom",
            element: <CreacionEspacio />,
          },
          {
            path: "formChat",
            element: <FormChat />,
          },
          {
            path: "equipmentavailability",
            element: <EquipmentAvailabilityListPage />,
          },
          {
            path: "menu",
            element: <OptionsReservation />,
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
            path: "tipoequipo",
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
            path: "approvereservations",
            element: <ApproveReservations />,
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
            path: "actualizarEstado/:id",
            element: <ReservacionEstado />,
          },
          {
            path: "actualizarEstadoAula/:id",
            element: <ReservacionEstadoAula />,
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
            path: "reporteReservas",
            element: <ReporteReservasPorFecha />,
          },

        ],
      },
    ],
  },
]);

export default router;
