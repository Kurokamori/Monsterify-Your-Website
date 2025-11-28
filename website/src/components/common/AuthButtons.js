import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthButtons = ({ onLogout }) => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    if (onLogout) onLogout();
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isAuthenticated) {
    return (
      <div className="auth-buttons">
        <div>
          {Boolean(currentUser?.is_admin) && (
            <Link to="/admin/dashboard" className="auth-button">Admin</Link>
          )}
        </div>

        <div className="user-dropdown" ref={dropdownRef}>
          <button className="user-dropdown-toggle" onClick={toggleDropdown}>
            <span className="user-name">{currentUser?.display_name || currentUser?.username || 'User'}</span>
            <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`}></i>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <Link to="/profile/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-cog"></i> Profile Settings
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="/my_trainers" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-users"></i> View My Trainers
              </Link>
              <Link to="/reference_todo" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-clipboard-list"></i> Reference To-Do List
              </Link>
              <Link to="/reference_helper" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-hands-helping"></i> Reference Helper
              </Link>
              <Link to="/art_todo" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-palette"></i> Art Todo List
              </Link>
              <Link to="/submissions" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-upload"></i> Process Submission
              </Link>
              <Link to="/manage_schedule" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-calendar-alt"></i> Manage Schedule
              </Link>
              <Link to="/add_trainer" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-user-plus"></i> Add New Trainer
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="/statistics" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-chart-bar"></i> Statistics
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="#" className="dropdown-item" onClick={(e) => {
                setDropdownOpen(false);
                handleLogout(e);
              }}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-buttons">
      <Link to="/login" className="auth-button">Login</Link>
      <Link to="/register" className="auth-button">Register</Link>
    </div>
  );
};

export default AuthButtons;
