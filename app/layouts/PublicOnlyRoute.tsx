// components/auth/PublicOnlyRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "~/hooks/AuthContext";

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Esperar a que termine de cargar para evitar parpadeo
  if (isLoading) return (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border" role="status" />
  </div>
);


  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
