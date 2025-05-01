import { useAuth } from "../hooks/AuthContext";
import { useLocation, Navigate } from "react-router";
import { routeRoles } from "../types/routeRoles";
import Forbidden from "~/layouts/Forbidden";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // O un spinner cargando

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const path = location.pathname.replace(/^\/+/, ""); // Quita el slash inicial
  const allowedRoles = routeRoles[path] || [];

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return <Forbidden />; // 👈 Aquí mostramos el Forbidden
  }

  return <>{children}</>;
}
