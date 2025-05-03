import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { Spinner } from 'react-bootstrap';

export function ProtectedRoute({ children }: { children:  React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAccess } = useAuth();
  const location = useLocation();
  const currentRoute = location.pathname.split('/')[1] || '';

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
