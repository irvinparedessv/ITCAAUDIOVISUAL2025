import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { routeRoles } from "../types/routeRoles";
import { Spinner } from "react-bootstrap";
import { Role } from "../types/roles"; // Importa el enum Role

export function ProtectedLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  const getCurrentRouteKey = (): string => {
    // Manejo más robusto para rutas vacías o con múltiples barras
    const routeParts = location.pathname.split('/').filter(part => part !== '');
    return routeParts[0] || 'home';
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Guarda la ubicación intentada para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRoute = getCurrentRouteKey();
  const allowedRoles = routeRoles[currentRoute] ?? []; // Usamos ?? en lugar de ||

  // Verificación de acceso mejorada
  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}