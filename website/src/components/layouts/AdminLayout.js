import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current route is active
  const isActive = (path) => {
    // Special case for the dashboard
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    // For other routes, check if the pathname starts with the path
    return location.pathname.startsWith(path);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Dashboard</h2>
          <div className="admin-user-info">
            <span>{currentUser?.display_name || currentUser?.username}</span>
          </div>
        </div>

        <nav className="admin-nav">
          <ul>
            <li className={isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}>
              <Link to="/admin">
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </Link>
            </li>
            <li className={isActive('/admin/trainers') ? 'active' : ''}>
              <Link to="/admin/trainers">
                <i className="fas fa-user-friends"></i> Trainers
              </Link>
            </li>
            <li className={isActive('/admin/monsters') ? 'active' : ''}>
              <Link to="/admin/monsters">
                <i className="fas fa-dragon"></i> Monsters
              </Link>
            </li>
            <li className={isActive('/admin/users') ? 'active' : ''}>
              <Link to="/admin/users">
                <i className="fas fa-users"></i> Users
              </Link>
            </li>
            <li className={isActive('/admin/submissions') ? 'active' : ''}>
              <Link to="/admin/submissions">
                <i className="fas fa-images"></i> Submissions
              </Link>
            </li>
            <li className={isActive('/admin/level-management') ? 'active' : ''}>
              <Link to="/admin/level-management">
                <i className="fas fa-level-up-alt"></i> Level Management
              </Link>
            </li>
            <li className={isActive('/admin/pokemon-monsters') ? 'active' : ''}>
              <Link to="/admin/pokemon-monsters">
                <i className="fas fa-paw"></i> Pokemon Database
              </Link>
            </li>
            <li className={isActive('/admin/digimon-monsters') ? 'active' : ''}>
              <Link to="/admin/digimon-monsters">
                <i className="fas fa-robot"></i> Digimon Database
              </Link>
            </li>
            <li className={isActive('/admin/yokai-monsters') ? 'active' : ''}>
              <Link to="/admin/yokai-monsters">
                <i className="fas fa-ghost"></i> Yokai Database
              </Link>
            </li>
            <li className={isActive('/admin/nexomon-monsters') ? 'active' : ''}>
              <Link to="/admin/nexomon-monsters">
                <i className="fas fa-dragon"></i> Nexomon Database
              </Link>
            </li>
            <li className={isActive('/admin/pals-monsters') ? 'active' : ''}>
              <Link to="/admin/pals-monsters">
                <i className="fas fa-paw"></i> Pals Database
              </Link>
            </li>
            <li className={isActive('/admin/items') ? 'active' : ''}>
              <Link to="/admin/items">
                <i className="fas fa-shopping-bag"></i> Items
              </Link>
            </li>
            <li className={isActive('/admin/shop-manager') ? 'active' : ''}>
              <Link to="/admin/shop-manager">
                <i className="fas fa-store"></i> Shop Manager
              </Link>
            </li>
            <li className={isActive('/admin/item-roller') ? 'active' : ''}>
              <Link to="/admin/item-roller">
                <i className="fas fa-dice"></i> Item Roller
              </Link>
            </li>
            <li className={isActive('/admin/monster-roller') ? 'active' : ''}>
              <Link to="/admin/monster-roller">
                <i className="fas fa-dragon"></i> Monster Roller
              </Link>
            </li>
            <li className={isActive('/admin/reroller') ? 'active' : ''}>
              <Link to="/admin/reroller">
                <i className="fas fa-gift"></i> Reroller
              </Link>
            </li>
            <li className={isActive('/admin/features') ? 'active' : ''}>
              <Link to="/admin/features">
                <i className="fas fa-tools"></i> Admin Features
              </Link>
            </li>
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-back-link">
            <i className="fas fa-arrow-left"></i> Back to Site
          </Link>
          <button className="admin-logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
