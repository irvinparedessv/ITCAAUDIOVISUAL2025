import { Role } from "./roles";

export const routeRoles: Record<string, number[]> = {
  "addreservation": [Role.Prestamista, Role.Administrador],
  "reservations": [Role.Prestamista, Role.Administrador],
  "reservationdetail": [Role.Prestamista],
  "reservationdetailAdmin": [Role.Administrador],
  "formEquipo": [Role.Administrador],
  "formEspacio": [Role.Administrador],
  "formChat": [Role.Prestamista, Role.Administrador],
  "inventario": [Role.Administrador],
  "menu": [Role.Prestamista, Role.Administrador],
  "reservationsroom": [Role.Prestamista],
  "tipoequipo": [Role.Administrador],
  "equipo": [Role.Administrador],
  "login": [],
  "": [Role.Prestamista, Role.Administrador],
};
