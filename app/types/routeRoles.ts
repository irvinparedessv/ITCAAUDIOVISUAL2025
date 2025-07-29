import { Role } from "./roles";

export const routeRoles: Record<string, Role[]> = {
  // ===== Rutas Públicas =====
  "/login": [],
  "/reset-password": [],


  // ===== Rutas Protegidas =====
  // -- Home --
  "/home": [Role.Prestamista, Role.Administrador, Role.Encargado],

  // -- Usuarios --
  "/formUsuario": [Role.Administrador],
  "/usuarios": [Role.Administrador],
  "/editarUsuario/:id": [Role.Administrador],

  // -- Reservas --
  "/addreservation": [Role.Prestamista, Role.Administrador, Role.Encargado],
  "/reservations": [Role.Prestamista, Role.Administrador, Role.Encargado],
  "/reservationdetail": [Role.Prestamista],
  "/equipmentreservation/edit/:id": [Role.Prestamista, Role.Administrador, Role.Encargado],
  "/equipmentavailability": [Role.Encargado, Role.Administrador, Role.Prestamista],

  // -- Equipos --
  "/equipo": [Role.Administrador],
  "/formEquipo": [Role.Administrador],
  "/equipos/editar/:id": [Role.Administrador],
  "/equipolist": [Role.Administrador],

  // -- Espacios --
  "/createRoom": [Role.Administrador],
  "/reservations-room": [Role.Administrador, Role.EspacioEncargado, Role.Prestamista,],
  "/reservationsroom": [Role.Administrador, Role.EspacioEncargado, Role.Prestamista,],
  "/rooms": [Role.Administrador, Role.EspacioEncargado],
  "/aulas/editar/:id": [Role.Administrador, Role.EspacioEncargado],
  "/reservas-aula/:id": [Role.Administrador, Role.EspacioEncargado],
  "/roomsavailability": [Role.Administrador, Role.EspacioEncargado, Role.Prestamista,],
  "/reservas-aula/editar/:id": [Role.Administrador, Role.EspacioEncargado, Role.Prestamista,],

  // -- Prediccion --
  "/prediccion": [Role.Encargado, Role.Administrador],
  "/prediccionPorEquipoPage": [Role.Encargado, Role.Administrador],
  "/prediccionAula": [Role.EspacioEncargado, Role.Administrador],

  // -- Reporte ADMIN Y ENCARGADO --
  "/reporteEquipos": [Role.Administrador, Role.Encargado],
  "/reporteHorarios": [Role.Administrador, Role.Encargado],
  "/reporteInventario": [Role.Administrador, Role.Encargado],
  "/reporteReservasEquipo": [Role.Administrador, Role.Encargado],
  "/reporteReservasUsuarios": [Role.Administrador, Role.Encargado],

  // -- Reporte ADMIN--
  "/reporteReservasAulas": [Role.Administrador, Role.EspacioEncargado],
  "/reporteAulas": [Role.Administrador],

  // --Inventario --
  "/equipos": [Role.Encargado, Role.Administrador],
  "/marcas": [Role.Encargado, Role.Administrador],
  "/modelos": [Role.Encargado, Role.Administrador],
  "/modelos/gestionar/:id": [Role.Encargado, Role.Administrador],
  "/tipoEquipo": [Role.Encargado, Role.Administrador],
  "/formTipoEquipo": [Role.Encargado, Role.Administrador],
  "/tipoEquipo/:id": [Role.Encargado, Role.Administrador],
  "/inventario": [Role.Encargado, Role.Administrador],
  "/crearItem": [Role.Encargado, Role.Administrador],
  "/inventarioEquipo/:modeloId": [Role.Encargado, Role.Administrador],
  "/items/edit/:id": [Role.Encargado, Role.Administrador],


  // -- Otros --
  "/aulas/encargados/:aulaId": [Role.Administrador],
  "/bitacora": [Role.Administrador],
  "/qrScan": [Role.Administrador, Role.EspacioEncargado, Role.Encargado],
  "/perfil": [Role.Administrador, Role.EspacioEncargado, Role.Encargado, Role.Prestamista,],
  "/editarPerfil": [Role.Administrador, Role.EspacioEncargado, Role.Encargado, Role.Prestamista,],
  "/notifications": [Role.Administrador, Role.EspacioEncargado, Role.Encargado, Role.Prestamista,],
  // -- Reporte ADMIN, ENCARGADO--
  "/opcionesAnalisis": [Role.Administrador, Role.Encargado],
  // -- Reporte ADMIN, ENCARGADO, ENCARGADO ESPACIO --
  "/administracion": [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  "/opcionesReportes": [Role.Administrador, Role.Encargado, Role.EspacioEncargado],


};
