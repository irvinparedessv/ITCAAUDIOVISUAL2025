import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useNavigate,
  useLocation
} from "react-router";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useAuth, AuthProvider } from "./hooks/AuthContext";
import "./app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { FaHome, FaPlus, FaList, FaUserCircle, FaMoon, FaSun } from "react-icons/fa";
import { Spinner, Dropdown } from "react-bootstrap";
import { FaComputer } from "react-icons/fa6";
import { Role } from "./types/roles";


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
        <AuthProvider>
          {children}
        </AuthProvider>
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
    document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
    document.body.classList.add(isDark ? "dark" : "light");
    document.body.classList.remove(isDark ? "light" : "dark");
  }, []);

  // Alternar tema
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
    document.documentElement.setAttribute("data-bs-theme", newMode ? "dark" : "light");
    document.body.classList.add(newMode ? "dark" : "light");
    document.body.classList.remove(newMode ? "light" : "dark");
  };

  const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/forbidden"];
  // Redirección basada en autenticación
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && location.pathname === "/login") {
        navigate("/");
      } else if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
        navigate("/login");
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    // No usar localStorage.clear(); para no borrar darkMode
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

 const hideNavbarRoutes = ["/login", "/forgot-password", "/reset-password", "/forbidden"];

if (hideNavbarRoutes.some(route => location.pathname.startsWith(route))) {
  return <Outlet />;
}

  return (
    <>
      {isAuthenticated && (
        <Navbar expand="lg"
          className="px-4 border-bottom"
          style={{ background: 'linear-gradient(rgb(245, 195, 92), rgb(245, 195, 92))' }}>
          <Container fluid>
            <Navbar.Brand as={Link} to="/" className="fw-bold">
              <img
                src="/images/logo.png"
                alt="Logo ReservasTI"
                style={{ height: '50px' }}
              />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="custom-toggler">
              <span className="navbar-toggler-icon">
                <div></div>
              </span>
            </Navbar.Toggle>

            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto align-items-center gap-2">
                <Nav.Link as={Link} to="/" className="px-3 py-2 rounded nav-hover-white">
                  <FaHome className="me-1" /> Inicio
                </Nav.Link>

                {checkAccess("/addreservation") && (
                  <Nav.Link as={Link} to="/addreservation" className="px-3 py-2 rounded nav-hover-white">
                    <FaComputer className="me-1" /> Equipos
                  </Nav.Link>
                )}

                {user?.role === Role.Administrador && (
                  <>
                    {checkAccess("/reservations") && (
                      <Nav.Link as={Link} to="/reservations" className="px-3 py-2 rounded nav-hover-white">
                        <FaList className="me-1" /> Reservas
                      </Nav.Link>
                    )}
                    {checkAccess("/equipo") && (
                      <Nav.Link as={Link} to="/equipo" className="px-3 py-2 rounded nav-hover-white">
                        <FaPlus className="me-1" /> Nuevo Equipo
                      </Nav.Link>
                    )}
                    {checkAccess("/formEspacio") && (
                      <Nav.Link as={Link} to="/formEspacio" className="px-3 py-2 rounded nav-hover-white">
                        <FaList className="me-1" /> Espacios
                      </Nav.Link>
                    )}
                  </>
                )}

                {user?.role === Role.Encargado && (
                  <>
                    {checkAccess("/formEquipo") && (
                      <Nav.Link as={Link} to="/formEquipo" className="px-3 py-2 rounded nav-hover-white">
                        <FaPlus className="me-1" /> Equipos
                      </Nav.Link>
                    )}
                    {checkAccess("/formEspacio") && (
                      <Nav.Link as={Link} to="/formEspacio" className="px-3 py-2 rounded nav-hover-white">
                        <FaList className="me-1" /> Reservas
                      </Nav.Link>
                    )}
                  </>
                )}

                {user?.role === Role.Prestamista && (
                  <>
                    {checkAccess("/addreservation") && (
                      <Nav.Link as={Link} to="/addreservation" className="px-3 py-2 rounded nav-hover-white">
                        <FaPlus className="me-1" /> Reservar
                      </Nav.Link>
                    )}
                    {checkAccess("/reservations") && (
                      <Nav.Link as={Link} to="/reservations" className="px-3 py-2 rounded nav-hover-white">
                        <FaList className="me-1" /> Mis Reservas
                      </Nav.Link>
                    )}
                  </>
                )}

                <Dropdown align="end">
                  <Dropdown.Toggle
                    id="dropdown-basic"
                    className="d-flex align-items-center"
                    style={{
                      background: 'linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))',
                      border: 'none',
                      color: '#000',
                    }}
                  >
                    <FaUserCircle className="me-2" />
                    <span className="d-none d-lg-inline">{user?.name}</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu
                    style={{
                      background: 'linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))',
                      color: '#000',
                    }}
                  >
                    <Dropdown.ItemText className="px-3 py-2" style={{ color: '#000' }}>
                      <div className="fw-bold">{user?.name}</div>
                      <small style={{ color: '#000' }}>{user?.email}</small>
                    </Dropdown.ItemText>
                    <Dropdown.Divider />

                    {/* ✅ Modo Oscuro */}
                    <Dropdown.Item
                      onClick={toggleDarkMode}
                      className="px-3 py-2 nav-hover-white d-flex align-items-center gap-2"
                      style={{ color: '#000' }}
                    >
                      {darkMode ? <FaSun /> : <FaMoon />}
                      {darkMode ? "Modo Claro" : "Modo Oscuro"}
                    </Dropdown.Item>

                    {/* ✅ Cerrar sesión */}
                    <Dropdown.Item
                      onClick={handleLogout}
                      className="px-3 py-2 nav-hover-white"
                      style={{ color: '#000' }}
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