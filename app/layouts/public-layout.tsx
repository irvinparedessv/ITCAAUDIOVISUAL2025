// import { createBrowserRouter } from "react-router-dom";
// import App from "~/root";
// import ProtectedLayout from "./protected-layout";
// import Home from "~/routes/home";
// import ReservationListPage from "~/routes/reservationList";
// import Login from "~/components/Login";
// import Forbidden from "~/components/auth/Forbidden";


// export const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />, // Layout principal con Navbar
//     children: [
//       {
//         element: <ProtectedLayout />, // Envoltorio que valida roles
//         children: [
//           { index: true, element: <Home /> },
//           { path: "reservations", element: <ReservationListPage /> },
//           // más rutas protegidas
//         ],
//       },
//       {
//         path: "login",
//         element: <Login />,
//       },
//       {
//         path: "forbidden",
//         element: <Forbidden />,
//       },
//     ],
//   },
// ]);
