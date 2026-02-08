import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * User List Page
 * Displays a list of all users with options to add, edit, and delete
 */
const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (user) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.username);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteUserId(null);
    setDeleteUserName('');
    setShowDeleteModal(false);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(deleteUserId);
      setUsers(users.filter(user => user.id !== deleteUserId));
      setSuccessMessage(`User "${deleteUserName}" deleted successfully`);
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
      closeDeleteModal();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">User Management</h1>
          <p className="admin-dashboard-subtitle">
            Manage user accounts and permissions
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="admin-alert success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <Link to="/admin/users/add" className="button primary">
            <i className="fas fa-plus"></i> Add New User
          </Link>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading users...
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Display Name</th>
                  <th>Discord ID</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No users found</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.display_name || '-'}</td>
                      <td>{user.discord_id || '-'}</td>
                      <td>
                        <span className={`admin-badge${user.is_admin ? 'admin' : 'user'}`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/users/edit/${user.id}`}
                          className="button info sm"
                          title="Edit User"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="button danger sm"
                            title="Delete User"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="admin-modal-body">
              <p>Are you sure you want to delete the user <strong>{deleteUserName}</strong>?</p>
              <p className="admin-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={closeDeleteModal}
                className="button secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="button danger"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListPage;
