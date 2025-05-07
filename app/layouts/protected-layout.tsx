// layouts/protected-layout.tsx
import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { routeRoles } from "../types/routeRoles";
import { Spinner } from "react-bootstrap";
import Forbidden from "~/components/auth/Forbidden";

export function ProtectedLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar acceso a la ruta actual
  const currentRoute = location.pathname;
  const allowedRoles = routeRoles[currentRoute] || [];
  
  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Forbidden />;
  }
  return <Outlet />;
}