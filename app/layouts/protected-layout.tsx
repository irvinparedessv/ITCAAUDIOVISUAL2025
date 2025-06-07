// layouts/protected-layout.tsx
import { useLocation, Outlet, Navigate,useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { Spinner } from "react-bootstrap";
import { getAllowedRoles } from "../helpers/matchRouteRoles";
import { useEffect, useState } from "react";

const publicRoutes = ["/login", "/forgot-password", "/reset-password"];

export default function ProtectedLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [redirectHandled, setRedirectHandled] = useState(false);

  useEffect(() => {
    if (isLoading || redirectHandled) return;

    if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
      navigate("/login", { replace: true, state: { from: location } });
      setRedirectHandled(true);
      return;
    }

    if (isAuthenticated && location.pathname === "/login") {
      navigate("/", { replace: true });
      setRedirectHandled(true);
      return;
    }
  }, [isLoading, isAuthenticated, location.pathname, redirectHandled, navigate]);

  useEffect(() => {
    setRedirectHandled(false);
  }, [location.pathname]);

  if (isLoading) return <Spinner animation="border" />;

  if (isAuthenticated) {
    const allowedRoles = getAllowedRoles(location.pathname);
    const userRole = Number(user?.role);

    if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return (
    <>
      <Outlet />
     
    </>
  );
}
