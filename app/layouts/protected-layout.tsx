import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { Spinner } from "react-bootstrap";
import { getAllowedRoles } from "../helpers/matchRouteRoles";
import Chatbot from "~/components/chatbot/chatbot";
import { Role } from "~/types/roles";

const publicRoutes = ["/login", "/forgot-password", "/reset-password"];

export default function ProtectedLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { loading: themeLoading, isInitialized } = useTheme();
  const location = useLocation();

  // Mostrar spinner si está cargando la autenticación o el tema no está inicializado
  if (isLoading || !isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Cargando preferencias...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = getAllowedRoles(location.pathname);
  const userRole = Number(user?.role);

  if (
    allowedRoles.length > 0 &&
    (!userRole || !allowedRoles.includes(userRole))
  ) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <>
      <Outlet />
      {user?.role === Role.Prestamista && <Chatbot />}
    </>
  );
}
