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
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(false);

  // Cargar tema desde localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedMode ? JSON.parse(savedMode) : prefersDark;
    
    setDarkMode(isDark);
    updateTheme(isDark);
  }, []);

  const updateTheme = (isDark: boolean) => {
    document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
    document.body.classList.toggle("dark", isDark);
    document.body.classList.toggle("light", !isDark);
  };

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
    updateTheme(newMode);
  }, [darkMode]);

  const handleLogout = () => {
    logout();
  };

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
        <Navbar
          expand="lg"
          className="px-4 border-bottom"
          style={{
            background: "linear-gradient(rgb(245, 195, 92), rgb(245, 195, 92))",
          }}
        >
          <Container fluid>
            <Navbar.Brand as={Link} to="/" className="fw-bold">
              <img
                src="/images/logo.png"
                alt="Logo ReservasTI"
                style={{ height: "50px" }}
              />
            </Navbar.Brand>
            <Navbar.Toggle
              aria-controls="basic-navbar-nav"
              className="custom-toggler"
            >
              <span className="navbar-toggler-icon">
                <div></div>
              </span>
            </Navbar.Toggle>

            <Navbar.Collapse id="basic-navbar-nav">
  <Nav className="ms-auto align-items-center gap-2 flex-column flex-lg-row">
    <Nav.Link
      as={Link}
      to="/"
      className="px-3 py-2 rounded  w-200"
    >
      <FaHome className="me-1" /> Inicio
    </Nav.Link>


    {/* ADMIN */}
    {user?.role === Role.Administrador && (
      <>
        {checkAccess("/reservations") && (
          <Nav.Link
            as={Link}
            to="/reservations"
            className="px-3 py-2 rounded nav-hover-white w-200"
          >
            <FaList className="me-1" /> Reservas
          </Nav.Link>
        )}
        
        {/* Equipos con Submenu */}
        {checkAccess("/equipo") && (
          <Dropdown className="w-200">
            <Dropdown.Toggle
  variant="link"
  id="dropdown-equipo"
  className="nav-dropdown-toggle px-3 py-2 rounded w-200 d-flex align-items-center"
>
  <FaComputer className="me-1" /> Equipos
</Dropdown.Toggle>
            <Dropdown.Menu
              style={{
                background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                minWidth: "300px",
              }}
            >
              <Dropdown.Item
                as={Link}
                to="/equipo"
                className="d-flex align-items-start py-2"
              >
                <FaList className="me-2" />
                <div>
                  <div className="fw-bold">Listado de Equipos</div>
                  <small className="">Ver todos los equipos</small>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                as={Link}
                to="/formEquipo"
                className="d-flex align-items-start py-2"
              >
                <FaPlus className="me-2" />
                <div>
                  <div className="fw-bold">Nuevo Equipo</div>
                  <small className="">Agregar un nuevo equipo</small>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}

        {checkAccess("/formEspacio") && (
          <Nav.Link
            as={Link}
            to="/formEspacio"
            className="px-3 py-2 rounded nav-hover-white w-200"
          >
            <FaList className="me-1" /> Espacios
          </Nav.Link>
        )}
      </>
    )}

    {/* ENCARGADO */}
    {user?.role === Role.Encargado && (
      <>
        {checkAccess("/formEquipo") && (
          <Nav.Link
            as={Link}
            to="/formEquipo"
            className="px-3 py-2 rounded nav-hover-white w-200"
          >
            <FaPlus className="me-1" /> Equipos
          </Nav.Link>
        )}
        {checkAccess("/formEspacio") && (
          <Nav.Link
            as={Link}
            to="/formEspacio"
            className="px-3 py-2 rounded nav-hover-white w-200"
          >
            <FaList className="me-1" /> Reservas
          </Nav.Link>
        )}
      </>
    )}

    {/* PRESTAMISTA */}
    {user?.role === Role.Prestamista && (
      <>
        {checkAccess("/addreservation") && (
          <Nav.Link
            as={Link}
            to="/addreservation"
            className="px-3 py-2 rounded nav-hover-white w-200"
          >
            <FaPlus className="me-1" /> Reservar
          </Nav.Link>
        )}
        {checkAccess("/reservations") && (
          <Nav.Link
            as={Link}
            to="/reservations"
            className="px-3 py-2 rounded nav-hover-white w-200"
          >
            <FaList className="me-1" /> Mis Reservas
          </Nav.Link>
        )}
      </>
    )}

    {/* 🔔 Notificaciones */}
    <Dropdown align="end" className="w-200">
      <Dropdown.Toggle
        variant="link"
        id="dropdown-notifications"
        className="position-relative w-200 d-flex align-items-center justify-content-start px-3 py-2 border-0"
        style={{ background: "transparent", color: "#000" }}
      >
        <FaBell size={20} className="me-2 text-dark" />
        Notificaciones
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          3
          <span className="visually-hidden">notificaciones no leídas</span>
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
          minWidth: "300px",
        }}
      >
        <Dropdown.Header className="fw-bold">Notificaciones</Dropdown.Header>
        <Dropdown.Item
          as={Link}
          to="/reservations"
          className="d-flex align-items-start py-2"
        >
          <div className="me-2">
            <FaCalendarAlt />
          </div>
          <div>
            <div className="fw-bold">Tus reservas</div>
            <small className="">
              Ver todas tus reservas activas
            </small>
          </div>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>

    {/* 👤 Usuario */}
    <Dropdown align="end" className="w-200">
      <Dropdown.Toggle
        id="dropdown-basic"
        className="w-200 d-flex align-items-center justify-content-start gap-2 px-3 py-2"
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
          border: "none",
          color: "#000",
        }}
      >
        {user?.image ? (
          <img
            src={`http://localhost:8000/storage/${user.image}`}
            alt="User"
            className="rounded-circle"
            style={{
              width: "30px",
              height: "30px",
              objectFit: "cover",
            }}
          />
        ) : (
          <FaUserCircle size={24} />
        )}
        <span>{user?.first_name} {user?.last_name}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
          color: "#000",
        }}
      >
        <Dropdown.ItemText className="px-3 py-2" style={{ color: "#000" }}>
          <div className="fw-bold">
            {user?.first_name} {user?.last_name}
          </div>
          <small style={{ color: "#000" }}>{user?.email}</small>
        </Dropdown.ItemText>
        <Dropdown.Divider />

        <Dropdown.Item
          onClick={toggleDarkMode}
          className="px-3 py-2  d-flex align-items-center gap-2"
          style={{ color: "#000" }}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
          {darkMode ? "Modo Claro" : "Modo Oscuro"}
        </Dropdown.Item>

        <Dropdown.Item
          onClick={handleLogout}
          className="px-3 py-2"
        >
          Cerrar Sesión
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  </Nav>
</Navbar.Collapse>

          </Container>
        </Navbar>
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
