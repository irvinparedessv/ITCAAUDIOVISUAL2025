// layouts/protected-layout.tsx
import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { Spinner } from "react-bootstrap";
import { getAllowedRoles } from "../helpers/matchRouteRoles";
import Chatbot from "~/components/chatbot/chatbot";
import { Role } from "~/types/roles";

const publicRoutes = ["/login", "/forgot-password", "/reset-password"];



export default function ProtectedLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedLayout] Ruta:", location.pathname);
  console.log("[ProtectedLayout] isAuthenticated:", isAuthenticated);
  console.log("[ProtectedLayout] isLoading:", isLoading);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = getAllowedRoles(location.pathname);
  const userRole = Number(user?.role);

  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <>
      <Outlet />
      {user?.role === Role.Prestamista && <Chatbot />}
    </>
  );
}

