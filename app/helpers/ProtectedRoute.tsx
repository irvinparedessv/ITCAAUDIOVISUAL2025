import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { Spinner } from 'react-bootstrap';
import { useEffect } from 'react';
import Forbidden from '~/components/auth/Forbidden';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();  // Usamos useNavigate para redirigir programáticamente

  const currentRoute = location.pathname.split('/')[1] || '';

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!checkAccess(currentRoute)) {
    return <Forbidden />;
  }

  return children;
}

export default ProtectedRoute;
