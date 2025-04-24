import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useNavigate,
} from "react-router";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useAuth, AuthProvider } from "./hooks/AuthContext"; // Asegúrate del path correcto
import "./app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// ---- APP CON NAVBAR ---- //
export default function App() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
     // Verificamos solo si no está autenticado
    if (!isAuthenticated && !localStorage.getItem("token")) {
      // Redirigimos al login solo si no está autenticado
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {isAuthenticated && (
        <Navbar expand="lg" bg="light" className="px-4">
          <Container fluid>
            <Navbar.Brand as={Link} to="/">
              Inicio
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/addreservation">Reservar Equipo</Nav.Link>
                <Nav.Link as={Link} to="/reservations">Lista Reservas</Nav.Link>
                <Button variant="outline-danger" onClick={handleLogout}>
                  Logout
                </Button>
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
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
