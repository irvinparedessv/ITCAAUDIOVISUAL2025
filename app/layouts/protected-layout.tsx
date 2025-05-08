// layouts/protected-layout.tsx
import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { Spinner } from "react-bootstrap";
import Forbidden from "~/components/auth/Forbidden";
import { getAllowedRoles } from "../helpers/matchRouteRoles";
import { useMemo } from "react";

export default function() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Obtener los roles permitidos para la ruta actual
  const allowedRoles = useMemo(() => 
    getAllowedRoles(location.pathname), 
    [location.pathname]
  );
  console.log('Render - allowedRoles:', allowedRoles);
  // Si no tiene el rol permitido, muestra la página de acceso denegado
  console.log("Ruta:", location.pathname);
console.log("Usuario:", user);
// Si no tiene el rol permitido, muestra la página de acceso denegado
const userRole = Number(user?.role);
console.log("Comparando roles:", userRole, "vs", allowedRoles);

if (
  allowedRoles.length > 0 &&
  (!userRole || !allowedRoles.includes(userRole))
) {
  return <Forbidden />;
}
console.log("Layout rendered");

  // Si el acceso es válido, renderiza la vista
  return <Outlet />;
}
