import { useMatches } from "react-router-dom";
import { routeRoles } from "../types/routeRoles"; // o "@/routes/meta" si lo moviste
import App from "app/root";

export function ProtectedLayout() {
  const matches = useMatches();
  const currentRoute = matches[matches.length - 1];
  
  const routeId = currentRoute.id ?? ""; // OJO, no es currentRoute.route.id
  const allowedRoles = routeRoles[routeId] || [];

  const userRole = 1; // luego lo cambias a tu auth real

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <div>Acceso denegado</div>;
  }

  return <App />;
}
