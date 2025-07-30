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

import TipoEquipos from "./routes/tipoEquipolist";
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
import ItemListPage from "./routes/equipment/ItemListPage";
import ItemCreatePage from "./routes/equipment/ItemCreatePage";
import TipoEquipoForm from "./components/tipoEquipo/TipoEquipoForm";
import ItemEditPage from "./routes/equipment/ItemEditPage";
import InventoryList from "./components/equipment/inventoryList";
import TipoEquipoPage from "./routes/tipoEquipoPage";
import ModeloAccesoriosForm from "./components/equipment/Modelo/ModeloAccesoriosForm";
import EquipmentReservationForm from "./components/reserveE/EquipmentReservationForm";
import OpcionesEquipos from "./dashboard/OpcionesEquipos";
import ModeloManager from "./components/modelo/modeloManager";
import GestorModelos from "./components/renders/components/CreationUpload";
import GestorModelosAula from "./components/rooms/ModelRoom";
import MarcaManager from "./components/marca/marcaManager";

// -------------------- Mantenimientos --------------------
import MantenimientoList from "./components/mantenimiento/mantenimientoList";
import FormMantenimiento from "./components/FormMantenimiento";
import MantenimientoEdit from "./components/mantenimiento/mantenimientoEdit";

// --------------- Tipo de Mantenimiento ------------------
import TipoMantenimientoList from "./components/tipoMantenimiento/tipoMantenimientoList";
import FormTipoMantenimiento from "./components/FormTipoMantenimiento"; // útil para crear o editar
import TipoMantenimientoEdit from "./components/tipoMantenimiento/tipoMantenimientoEdit";

// -------------- Futuro Mantenimiento -------------------
import FuturoMantenimientoList from "./components/futuroMantenimiento/futuroMantenimientoList";
import FormFuturoMantenimiento from "./components/FormFuturoMantenimiento";
import FuturoMantenimientoEdit from "./components/futuroMantenimiento/futuroMantenimientoEdit";
import PrediccionesPorEquipoVidaUtilPage from "./components/prediction/PrediccionesPorEquipoVidaUtil";


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
            element: <EquipmentReservationForm />,
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
            path: "aulas/encargados/:aulaId",
            element: <AsignarEncargadosForm />,
          },
          {
            path: "tipoEquipo",
            element: <TipoEquipos />,
          },
          {
            path: "tipoEquipo/:id",
            element: <TipoEquipoPage />,
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
            path: "inventarioEquipo/:modeloId",
            element: <ItemListPage />,
          },
          {
            path: "inventario",
            element: <InventoryList />,
          },
          {
            path: "crearItem",
            element: <ItemCreatePage />,
          },
          {
            path: "items/edit/:id",
            element: <ItemEditPage />,
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
            path: "prediccionPorEquipoVidaUtilPage",
            element: <PrediccionesPorEquipoVidaUtilPage />,
          },
          {
            path: "modelos/gestionar/:id",
            element: <GestorModelos />,
          },
          {
            path: "espacio/gestionar/:id",
            element: <GestorModelosAula />,
          },
          {
            path: "administracion",
            element: <OpcionesPanel />,
          },
          {
            path: "equipos",
            element: <OpcionesEquipos />,
          },
          {
            path: "modelos",
            element: <ModeloManager />,
          },
          {
            path: "marcas",
            element: <MarcaManager />,
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
          // --- RUTAS DE MANTENIMIENTOS ---

          {

            path: "mantenimiento",

            element: <MantenimientoList />,

          },

          {

            path: "mantenimientos/nuevo",

            element: <FormMantenimiento />,

          },

          {

            path: "mantenimientos/editar/:id",

            element: <MantenimientoEdit />,

          },



          // RUTAS TIPO MANTENIMIENTO



          {

            path: "tipoMantenimiento",

            element: <TipoMantenimientoList />,

          },

          //RUTAS FUTUROS MANTENIMIENTOS



          {

            path: "futuroMantenimiento",

            element: <FuturoMantenimientoList />,

          },

          {

            path: "futuroMantenimiento/crear",

            element: <FormFuturoMantenimiento />,

          },

          {

            path: "futuroMantenimiento/editar/:id",

            element: <FuturoMantenimientoEdit />,

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
