import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute component - Protects routes that should only be accessible by admin users
 * Redirects to login page if not authenticated, or to home page if authenticated but not admin
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!currentUser?.is_admin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
