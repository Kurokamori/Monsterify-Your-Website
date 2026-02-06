import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';

const AccountSettings = () => {
  const { currentUser, updateUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  
  // Delete account modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setAvatarPreview(currentUser.avatar_url || '');
    }
  }, [currentUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      // Update profile
      const response = await api.post('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update auth context
      await updateUserProfile(response.data.user);
      
      setSuccess('Profile updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    
    try {
      setLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      
      // Update password
      await api.post('/user/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    
    try {
      setLoading(true);
      setDeleteError(null);
      
      // Delete account
      await api.delete('/user/account');
      
      // Redirect to login page
      window.location.href = '/login';
      
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentUser) {
    return <LoadingSpinner message="Loading account settings..." />;
  }

  return (
    <div className="account-settings">
      <div className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Profile Information</h2>
        </div>
        <p className="settings-description">
          Update your account's profile information and email address.
        </p>
        
        {error && (
          <div className="form-error mb-1">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {success && (
          <div className="form-success mb-1">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}
        
        <form onSubmit={handleProfileSubmit}>
          <div className="avatar-upload">
            <div className="current-avatar">
              <img 
                src={avatarPreview || "https://via.placeholder.com/100/1e2532/d6a339?text=User"} 
                alt={name || "User"} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_avatar.png';
                }}
              />
            </div>
            <div className="avatar-upload-controls">
              <label className="avatar-upload-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                Change Avatar
              </label>
              <p className="avatar-upload-info">
                JPG, PNG or GIF. Max size of 2MB.
              </p>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="form-button primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Update Password</h2>
        </div>
        <p className="settings-description">
          Ensure your account is using a long, random password to stay secure.
        </p>
        
        {passwordError && (
          <div className="form-error mb-1">
            <i className="fas fa-exclamation-circle"></i> {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="form-success mb-1">
            <i className="fas fa-check-circle"></i> {passwordSuccess}
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="current-password" className="form-label">Current Password</label>
            <input
              type="password"
              id="current-password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="new-password" className="form-label">New Password</label>
            <input
              type="password"
              id="new-password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="form-help">
              Password must be at least 8 characters long.
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="form-button primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Delete Account</h2>
        </div>
        <p className="settings-description">
          Permanently delete your account and all of your data. This action cannot be undone.
        </p>
        
        <button
          className="form-button secondary danger"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <i className="fas fa-trash-alt"></i> Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
      >
        <div className="delete-account-modal">
          <p>
            Are you sure you want to delete your account? All of your data will be permanently removed.
            This action cannot be undone.
          </p>
          
          <div className="form-group mt-1-5">
            <label className="form-label">
              Please type <strong>DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              className="form-input"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>

          {deleteError && (
            <div className="form-error mt-1">
              <i className="fas fa-exclamation-circle"></i> {deleteError}
            </div>
          )}
          
          <div className="modal-actions">
            <button 
              className="button secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="button primary"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountSettings;
