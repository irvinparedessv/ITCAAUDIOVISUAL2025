import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { Spinner } from 'react-bootstrap';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();  // Usamos useNavigate para redirigir programáticamente

  const currentRoute = location.pathname.split('/')[1] || '';

  // Usamos useEffect con dependencias controladas para evitar el ciclo infinito
  useEffect(() => {
    if (!isAuthenticated) {
      console.log(isAuthenticated); // Para ver si el estado cambia muchas veces
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]); // Solo se ejecuta cuando isAuthenticated cambia

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!checkAccess(currentRoute)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

export default ProtectedRoute;
