import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import userService from '../../services/userService';

/**
 * User Form Page
 * Form for adding and editing users
 */
const UserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    discord_id: '',
    password: '',
    is_admin: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch user data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [isEditMode, id]);

  // Fetch user by ID
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await userService.getUserById(id);
      
      setFormData({
        username: user.username,
        display_name: user.display_name || '',
        discord_id: user.discord_id || '',
        password: '', // Don't populate password field for security
        is_admin: user.is_admin
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!isEditMode && !formData.password) {
      errors.password = 'Password is required for new users';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        // Only include password if it's not empty
        const userData = { ...formData };
        if (!userData.password) {
          delete userData.password;
        }
        
        await userService.updateUser(id, userData);
      } else {
        await userService.createUser(formData);
      }
      
      // Redirect to user list with success message
      navigate('/admin/users', { 
        state: { 
          successMessage: isEditMode 
            ? `User "${formData.username}" updated successfully` 
            : `User "${formData.username}" created successfully` 
        } 
      });
    } catch (err) {
      console.error('Error saving user:', err);
      
      // Handle specific API errors
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} user. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">
            {isEditMode ? 'Edit User' : 'Add New User'}
          </h1>
          <p className="admin-dashboard-subtitle">
            {isEditMode 
              ? `Editing user: ${formData.username}` 
              : 'Create a new user account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin/users" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Users
          </Link>
        </div>

        {/* User Form */}
        <div className="bulk-monster-add-form">
          <form onSubmit={handleSubmit} className="reroller-content">
            <div className="admin-form-group">
              <label htmlFor="username" className="admin-form-label">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`admin-form-input ${formErrors.username ? 'error' : ''}`}
                disabled={loading}
                required
              />
              {formErrors.username && (
                <div className="admin-form-error">{formErrors.username}</div>
              )}
            </div>

            <div className="admin-form-group">
              <label htmlFor="display_name" className="admin-form-label">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="admin-form-input"
                disabled={loading}
              />
              <div className="admin-form-hint">
                If left empty, username will be used as display name
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="discord_id" className="admin-form-label">
                Discord ID
              </label>
              <input
                type="text"
                id="discord_id"
                name="discord_id"
                value={formData.discord_id}
                onChange={handleChange}
                className="admin-form-input"
                disabled={loading}
              />
              <div className="admin-form-hint">
                Discord user ID for linking accounts (optional)
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="password" className="admin-form-label">
                Password {!isEditMode && <span className="required">*</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`admin-form-input ${formErrors.password ? 'error' : ''}`}
                disabled={loading}
                required={!isEditMode}
              />
              {isEditMode ? (
                <div className="admin-form-hint">
                  Leave empty to keep current password
                </div>
              ) : null}
              {formErrors.password && (
                <div className="admin-form-error">{formErrors.password}</div>
              )}
            </div>

            <div className="admin-form-group">
              <div className="logo-link">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="is_admin" className="admin-form-checkbox-label">
                  Administrator
                </label>
              </div>
              <div className="admin-form-hint">
                Administrators have full access to all features
              </div>
            </div>

            <div className="admin-form-actions">
              <Link
                to="/admin/users"
                className="button secondary"
                disabled={loading}
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> {isEditMode ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormPage;
