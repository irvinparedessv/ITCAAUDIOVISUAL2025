import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Ruta pública (login)
  route("login", "routes/login.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  
  // Ruta protegida principal (con layout)
  route(
    "/",
    "layouts/protected-layout.tsx",
    [
      index("routes/home.tsx"),
      route("addreservation", "routes/reservation.tsx"),
      route("reservations", "routes/reservationList.tsx"),
      route("reservationdetail", "routes/reservationDetail.tsx"),
      route("reservationdetailAdmin", "routes/reservationDetailAdmin.tsx"),
      route("formEquipo", "routes/formEquipo.tsx"),
      route("formEspacio", "routes/formEspacio.tsx"),
      route("formChat", "routes/formChat.tsx"),
      route("inventario", "routes/inventario.tsx"),
      route("menu", "routes/optionsReservation.tsx"),
      route("reservationsroom", "routes/reservationRoom.tsx"),
      route("tipoequipo", "routes/tipoEquipos.tsx"),
      route("equipo", "routes/equipos.tsx"),
    ]
  ),
] satisfies RouteConfig;
