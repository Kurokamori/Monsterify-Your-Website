import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/auth/LoginPage';

/**
 * ProtectedRoute component - Protects routes that require authentication
 * Redirects to login page if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
};

export default ProtectedRoute;
