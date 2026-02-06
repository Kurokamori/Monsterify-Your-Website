import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import ProfileSettings from './ProfileSettings';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ProfilePage = () => {
  useDocumentTitle('Profile');
  
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Set active tab to settings
    setActiveTab('settings');
  }, [isAuthenticated, location, navigate]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
      setIsLogoutModalOpen(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Customize your profile and monster roller preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="user-info">
            <div className="user-details">
              <h3 className="user-name">{currentUser?.display_name || currentUser?.username || "User"}</h3>
            </div>
          </div>

          <nav className="profile-nav">
            <button
              className="button danger"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </nav>
        </div>

        <div className="profile-main">
          <Routes>
            <Route index element={<ProfileSettings />} />
            <Route path="settings" element={<ProfileSettings />} />
            <Route path="*" element={<ProfileSettings />} />
          </Routes>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
      >
        <div className="logout-modal-content">
          <p>Are you sure you want to log out?</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Logging out...
                </>
              ) : (
                'Logout'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
