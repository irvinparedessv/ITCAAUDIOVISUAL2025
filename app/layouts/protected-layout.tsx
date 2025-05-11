// layouts/protected-layout.tsx
import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { Spinner } from "react-bootstrap";
import Forbidden from "~/components/auth/Forbidden";
import { getAllowedRoles } from "../helpers/matchRouteRoles";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import Chatbot from "~/components/chatbot/chatbot";


export default function() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    // Redirigir a login si no está autenticado y no es ruta pública
    if (!isAuthenticated && !['/login', '/forgot-password', '/reset-password'].includes(location.pathname)) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    // Si está autenticado y en login, redirigir a home
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  if (isLoading) {
    return <Spinner />;
  }

  // Verificación de roles solo si está autenticado
  if (isAuthenticated) {
    const allowedRoles = getAllowedRoles(location.pathname);
    if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(Number(user.role)))) {
      return <Navigate to="/forbidden" replace />;
    }
  }
    // Si no tiene el rol permitido, muestra la página de acceso denegado
    console.log("Ruta:", location.pathname);
  console.log("Usuario:", user);


  return (
    <>
      
      <Outlet />
      <Chatbot/>  
    </>
  );
}