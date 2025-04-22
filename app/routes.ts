import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Aquí exportamos tanto la ruta raíz como la nueva de reservación
export default [
  index("routes/home.tsx"), // Ruta Home como index
  route("addreservation", "routes/reservation.tsx"),
  route("reservations", "routes/reservationList.tsx"),
  route("reservationdetail", "routes/reservationDetail.tsx"),
  route("reservationdetailAdmin", "routes/reservationDetailAdmin.tsx"),
  route("formEquipo", "routes/formEquipo.tsx"),
  route("formEspacio", "routes/formEspacio.tsx"),
  route("formChat", "routes/formChat.tsx"),
  route("inventario", "routes/inventario.tsx"),
  route("login", "routes/login.tsx"),
  route("menu", "routes/optionsReservation.tsx"),
  route("reservationsroom", "routes/reservationRoom.tsx"),
] satisfies RouteConfig;
