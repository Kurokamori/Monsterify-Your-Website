import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LogoutButton = ({ className, onClick }) => {
  const { logout } = useAuth();
  
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    if (onClick) onClick();
  };
  
  return (
    <button 
      type="button" 
      className={className} 
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
