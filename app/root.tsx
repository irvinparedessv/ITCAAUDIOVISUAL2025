import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useNavigate,
  useLocation,
} from "react-router";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useAuth, AuthProvider } from "./hooks/AuthContext";
import "./app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useCallback, useEffect, useState } from "react";
import {
  FaHome,
  FaPlus,
  FaList,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaCalendarAlt,
} from "react-icons/fa";
import { Spinner, Dropdown } from "react-bootstrap";
import { FaBell, FaComputer } from "react-icons/fa6";
import { Role } from "./types/roles";
import { Offcanvas } from "react-bootstrap";
import Chatbot from "./components/chatbot/chatbot";
import NavbarMenu from "./components/menu/menu";


// ---- HEAD Links ---- //
export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// ---- LAYOUT HTML ---- //
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-body">
        <AuthProvider>{children}</AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// ---- APP CON NAVBAR ---- //
export default function App() {
  const { isAuthenticated, logout, user, isLoading, checkAccess } = useAuth();

  const location = useLocation();

 

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{
          backgroundColor: "#f4f4f4", // Puedes elegir el color de fondo que prefieras
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999, // Asegura que este contenido esté por encima de otros
        }}
      >
        <div className="text-center">
          <Spinner animation="border" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <h3 className="mt-3">Cargando...</h3>
          <p>Estamos verificando tu sesión, por favor espera...</p>
        </div>
      </div>
    );
  }
  

  const hideNavbarRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/forbidden",
  ];

  const shouldShowNavbar = isAuthenticated && !hideNavbarRoutes.includes(location.pathname);
  console.log("App rendered");
  return (
    <>
      {shouldShowNavbar && (
        <NavbarMenu
          
        />
      )}
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

// ---- ERROR BOUNDARY ---- //
export function ErrorBoundary({ error }: any) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-light rounded">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
