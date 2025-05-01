import { useMatches } from "react-router-dom";
import { routeRoles } from "../types/routeRoles";
import App from "app/root";
import { useAuth } from "~/hooks/AuthContext"; // 👈 importar tu hook

export function ProtectedLayout() {
  const matches = useMatches();
  const currentRoute = matches[matches.length - 1];
  
  const routeId = currentRoute.id ?? "";
  const allowedRoles = routeRoles[routeId] || [];

  const { user, isLoading } = useAuth(); // 👈 obtener el usuario y el estado de carga

  if (isLoading) {
    return <div>Cargando...</div>; // 👈 opcional, para UX
  }

  const userRole = user?.role;

  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <div>Acceso denegado</div>;
  }

  return <App />;
}
