import { Role } from "./roles";

export const routeRoles: Record<string, Role[]> = {
  // ===== Rutas Públicas =====
  "/login": [],
  "/forgot-password": [],
  "/reset-password": [],
  "/usuarios": [],
  // ===== Rutas Protegidas =====
  // -- Home --
  "/home": [Role.Prestamista, Role.Administrador, Role.Encargado],

  // -- Reservas --
  "/addreservation": [Role.Prestamista, Role.Administrador, Role.Encargado],
  "/reservations": [Role.Prestamista, Role.Administrador, Role.Encargado],
  "/reservationdetail": [Role.Prestamista],
  "/reservationdetailAdmin": [Role.Administrador],
  // -- Equipos --
  "/equipo": [Role.Administrador],
  "/formEquipo": [Role.Administrador],
  "/tipoequipo": [Role.Administrador],

  // -- Espacios --
  "/createRoom": [Role.Administrador],
  "/reservations-room": [Role.Administrador, Role.EspacioEncargado, Role.Prestamista,],
  "/reservationsroom": [
    Role.Administrador,
    Role.EspacioEncargado,
    Role.Prestamista,
  ], //crear reserva espacio todo mod nombre ruta
  // -- Otros --
  "/formChat": [Role.Prestamista, Role.Administrador],
  "/inventario": [Role.Administrador],
  "/menu": [Role.Prestamista, Role.Administrador],
  "/equipmentavailability": [
    Role.Encargado,
    Role.Administrador,
    Role.Prestamista,
  ],
};
