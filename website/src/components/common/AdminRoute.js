import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/auth/LoginPage';

/**
 * AdminRoute component - Protects routes that should only be accessible by admin users
 * Redirects to login page if not authenticated, or to home page if authenticated but not admin
 */
const AdminRoute = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated at all
    return <LoginPage />;
  }

  if (!currentUser?.is_admin) {
    // Redirect to home if authenticated but not admin
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // User is authenticated and is an admin
  return children;
};

export default AdminRoute;
