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
import Forbidden from "./layouts/Forbidden";
import { routeRoles } from "./types/routeRoles";
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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <html lang="en" className={darkMode ? 'dark' : 'light'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-body">
        <AuthProvider>
          <Button 
            onClick={toggleDarkMode} 
            variant="link" 
            className="position-fixed bottom-0 end-0 m-3 p-2 rounded-circle shadow"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </Button>
          {children}
        </AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// ---- APP CON NAVBAR ---- //
// ---- APP CON NAVBAR ---- //
export default function App() {
  // Añade checkAccess aquí en la desestructuración
  const { isAuthenticated, logout, user, isLoading, checkAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
  
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

  if (location.pathname === "/login") {
    return <Outlet />;
  }

  return (
    <>
      {isAuthenticated && (
        <Navbar expand="lg" className="px-4 border-bottom">
          <Container fluid>
            <Navbar.Brand as={Link} to="/" className="fw-bold">
              ReservasTI
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto align-items-center gap-2">
                <Nav.Link as={Link} to="/" className="px-3 py-2 rounded">
                  <FaHome className="me-1" /> Inicio
                </Nav.Link>

                {/* Ejemplo de uso de checkAccess */}
                {checkAccess("/addreservation") && (
                  <Nav.Link as={Link} to="/addreservation" className="px-3 py-2 rounded">
                    <FaComputer className="me-1" /> Equipos
                  </Nav.Link>
                )}

                {user?.role === Role.Administrador && (
                  <>
                   {checkAccess("/reservations") && (
                    <Nav.Link as={Link} to="/reservations" className="px-3 py-2 rounded">
                      <FaList className="me-1" /> Reservas
                    </Nav.Link>
                     )}
                    {checkAccess("/equipo") && (
                      <Nav.Link as={Link} to="/equipo" className="px-3 py-2 rounded">
                        <FaPlus className="me-1" /> Nuevo Equipo
                      </Nav.Link>
                    )}
                    {checkAccess("/formEspacio") && (
                      <Nav.Link as={Link} to="/formEspacio" className="px-3 py-2 rounded">
                        <FaList className="me-1" /> Espacios
                      </Nav.Link>
                    )}
                  </>
                )}

                {user?.role === Role.Encargado && (
                  <>
                    {checkAccess("/formEquipo") && (
                      <Nav.Link as={Link} to="/formEquipo" className="px-3 py-2 rounded">
                        <FaPlus className="me-1" /> Equipos
                      </Nav.Link>
                    )}
                    {checkAccess("/formEspacio") && (
                      <Nav.Link as={Link} to="/formEspacio" className="px-3 py-2 rounded">
                        <FaList className="me-1" /> Reservas
                      </Nav.Link>
                    )}
                  </>
                )}

                {user?.role === Role.Prestamista && (
                  <>
                    {checkAccess("/addreservation") && (
                      <Nav.Link as={Link} to="/addreservation" className="px-3 py-2 rounded">
                        <FaPlus className="me-1" /> Reservar
                      </Nav.Link>
                    )}
                    {checkAccess("/reservations") && (
                      <Nav.Link as={Link} to="/reservations" className="px-3 py-2 rounded">
                        <FaList className="me-1" /> Mis Reservas
                      </Nav.Link>
                    )}
                  </>
                )}

                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic" className="d-flex align-items-center">
                    <FaUserCircle className="me-2" />
                    <span className="d-none d-lg-inline">{user?.name}</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.ItemText className="px-3 py-2">
                      <div className="fw-bold">{user?.name}</div>
                      <small className="text-muted">{user?.email}</small>
                    </Dropdown.ItemText>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="px-3 py-2">
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