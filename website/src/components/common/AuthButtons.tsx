import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthButtonsProps {
  onLogout?: () => void;
  totalUnread?: number;
}

export const AuthButtons = ({ onLogout, totalUnread = 0 }: AuthButtonsProps) => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    if (onLogout) onLogout();
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        {Boolean(currentUser?.is_admin) && (
          <div className="admin-button-wrapper">
            <Link to="/admin" className="button primary sm admin-button">
              <i className="fas fa-shield-alt"></i>
              <span className="admin-button-text">Admin</span>
            </Link>
          </div>
        )}

        <div className="user-dropdown" ref={dropdownRef}>
          <button className="button primary sm user-dropdown-trigger" onClick={toggleDropdown}>
            <i className="fas fa-user-circle user-icon"></i>
            <span className="user-name">{currentUser?.display_name || currentUser?.username || 'User'}</span>
            <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'} dropdown-chevron`}></i>
            {totalUnread > 0 && (
              <span className="user-dropdown-badge">{totalUnread}</span>
            )}
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <Link to="/profile" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-cog"></i> Profile Settings
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="/profile/trainers" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-users"></i> View My Trainers
              </Link>
              <Link to="/profile/reference" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-clipboard-list"></i> Reference To-Do List
              </Link>
              <Link to="/profile/reference/helper" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-hands-helping"></i> Reference Helper
              </Link>
              <Link to="/profile/art-todo" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-palette"></i> Art Todo List
              </Link>
              <Link to="/submissions" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-upload"></i> Process Submission
              </Link>
              <Link to="/profile/schedule" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-calendar-alt"></i> Manage Schedule
              </Link>
              <Link to="/profile/add-trainer" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-user-plus"></i> Add New Trainer
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="/statistics" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-chart-bar"></i> Statistics
              </Link>
              <Link to="/toys" className="top-nav-link" onClick={() => setDropdownOpen(false)}>
                <i className="fas fa-gamepad"></i> Toys
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="#" className="top-nav-link" onClick={(e) => {
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
      <Link to="/login" className="button primary sm">Login</Link>
      <Link to="/register" className="button primary sm">Register</Link>
    </div>
  );
};
