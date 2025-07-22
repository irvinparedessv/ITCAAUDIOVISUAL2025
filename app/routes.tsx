// routes.tsx
import { createBrowserRouter } from "react-router-dom";
import ProtectedLayout from "./layouts/protected-layout";

// públicas
import Login from "./routes/login";
import ResetPassword from "./routes/reset-password";
import ConfirmAccount from "./routes/confirm-account";
import Forbidden from "./components/auth/Forbidden";

// protegidas
import Home from "./routes/home";
import AddReservation from "./components/reserveE/EquipmentReservationForm";
import ReservationList from "./routes/reservationList";
import ReservationDetail from "./routes/reservationDetail";
import { CreateSpaceForm } from "./components/rooms/FormCreacionEspacio";

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
import NoEncontrado from "./components/error/NoEncontrado";
import PublicOnlyRoute from "./layouts/PublicOnlyRoute";
import ReservaCalendar from "./components/rooms/ReserveCalendar";
import ViewScene from "./components/renders/rooms/Visualizacion";
import SceneCanvas from "./components/renders/rooms/Scene";
import SceneCanvas2 from "./components/renders/rooms/Scene2";
import ItemListPage from "./routes/equipment/ItemListPage";
import ItemCreatePage from "./routes/equipment/ItemCreatePage";
import TipoEquipoForm from "./components/tipoEquipo/TipoEquipoForm";
import { APIURL, APPLARAVEL } from "./constants/constant";

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicOnlyRoute>
        <ResetPassword />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/confirm-account/:token",
    element: (
      <PublicOnlyRoute>
        <ConfirmAccount />
      </PublicOnlyRoute>
    ),
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
            path: "/aulas/editar/:id",
            element: <CreateSpaceForm />,
          },
          {
            path: "createRoom",
            element: <CreateSpaceForm />,
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
            path: "visualizacion",
            element: <SceneCanvas reserveId={1} />,
          },
          {
            path: "visualizacion2",
            element: <SceneCanvas2 />,
          },
          {
            path: "demo",
            element: <ViewScene reserveId={1} />,
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
            path: "formTipoEquipo",
            element: <TipoEquipoForm />,
          },
          {
            path: "equipo",
            element: <Equipos />,
          },
          {
            path: "inventario",
            element: <ItemListPage />,
          },
          {
            path: "crearItem",
            element: <ItemCreatePage />,
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
            path: "managerooms",
            element: <ReservaCalendar />,
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
  {
    path: "*",
    element: <NoEncontrado />,
  },
]);

export default router;
