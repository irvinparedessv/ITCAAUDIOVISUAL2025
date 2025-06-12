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
  "/addreservation": [Role.Prestamista, Role.Administrador],
  "/reservations": [Role.Prestamista, Role.Administrador],
  "/reservationdetail": [Role.Prestamista],
  "/reservationdetailAdmin": [Role.Administrador],
  "/reservations-room": [Role.Prestamista, Role.Administrador, Role.Encargado],
  // -- Equipos --
  "/equipo": [Role.Administrador],
  "/formEquipo": [Role.Administrador],
  "/tipoequipo": [Role.Administrador],

  // -- Espacios --
  "/formEspacio": [Role.Administrador],

  // -- Otros --
  "/formChat": [Role.Prestamista, Role.Administrador],
  "/inventario": [Role.Administrador],
  "/menu": [Role.Prestamista, Role.Administrador],
};
