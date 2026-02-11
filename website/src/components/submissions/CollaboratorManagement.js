import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import './CollaboratorManagement.css';

const CollaboratorManagement = ({ bookId, bookTitle, isOpen, onClose, onCollaboratorsChange }) => {
  const { currentUser } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingUser, setAddingUser] = useState(null);
  const [removingUser, setRemovingUser] = useState(null);

  // Fetch collaborators when modal opens
  const fetchCollaborators = useCallback(async () => {
    if (!bookId || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const response = await submissionService.getBookCollaborators(bookId);
      if (response.success) {
        setCollaborators(response.collaborators || []);
      } else {
        setError('Failed to load collaborators');
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [bookId, isOpen]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Search for users with debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await submissionService.searchCollaboratorUsers(bookId, searchTerm);
        if (response.success) {
          setSearchResults(response.users || []);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, bookId]);

  // Add a collaborator
  const handleAddCollaborator = async (user, role = 'editor') => {
    setAddingUser(user.id);
    setError(null);

    try {
      const response = await submissionService.addBookCollaborator(
        bookId,
        user.discord_id || user.id,
        role
      );

      if (response.success) {
        // Add to local state
        setCollaborators(prev => [...prev, {
          ...response.collaborator,
          username: user.username,
          display_name: user.display_name
        }]);

        // Clear search
        setSearchTerm('');
        setSearchResults([]);

        // Notify parent of change
        if (onCollaboratorsChange) {
          onCollaboratorsChange();
        }
      } else {
        setError(response.error || 'Failed to add collaborator');
      }
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError(err.response?.data?.error || 'Failed to add collaborator');
    } finally {
      setAddingUser(null);
    }
  };

  // Remove a collaborator
  const handleRemoveCollaborator = async (userId) => {
    setRemovingUser(userId);
    setError(null);

    try {
      const response = await submissionService.removeBookCollaborator(bookId, userId);

      if (response.success) {
        setCollaborators(prev => prev.filter(c => c.user_id !== userId));

        if (onCollaboratorsChange) {
          onCollaboratorsChange();
        }
      } else {
        setError(response.error || 'Failed to remove collaborator');
      }
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError(err.response?.data?.error || 'Failed to remove collaborator');
    } finally {
      setRemovingUser(null);
    }
  };

  // Update collaborator role
  const handleRoleChange = async (userId, newRole) => {
    setError(null);

    try {
      const response = await submissionService.updateCollaboratorRole(bookId, userId, newRole);

      if (response.success) {
        setCollaborators(prev =>
          prev.map(c =>
            c.user_id === userId ? { ...c, role: newRole } : c
          )
        );

        if (onCollaboratorsChange) {
          onCollaboratorsChange();
        }
      } else {
        setError(response.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Collaborators - ${bookTitle || 'Book'}`}
      size="large"
    >
      <div className="collaborator-management">
        {error && (
          <div className="alert error">{error}</div>
        )}

        {/* Search for users */}
        <div className="collaborator-search">
          <label htmlFor="user-search">Add Collaborator</label>
          <div className="search-input-container">
            <input
              type="text"
              id="user-search"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
            {searching && <span className="search-spinner"><i className="fas fa-spinner fa-spin"></i></span>}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div key={user.id} className="search-result-item">
                  <div className="user-info">
                    <span className="user-display-name">{user.display_name || user.username}</span>
                    {user.display_name && user.display_name !== user.username && (
                      <span className="user-username">@{user.username}</span>
                    )}
                  </div>
                  <div className="add-actions">
                    <button
                      className="button primary strong between"
                      onClick={() => handleAddCollaborator(user, 'editor')}
                      disabled={addingUser === user.id}
                    >
                      {addingUser === user.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>
                          <i className="fas fa-plus"></i> Editor
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="no-results">No users found matching "{searchTerm}"</div>
          )}
        </div>

        {/* Current collaborators */}
        <div className="current-collaborators">
          <h3>Current Collaborators</h3>

          {loading ? (
            <LoadingSpinner />
          ) : collaborators.length === 0 ? (
            <p className="no-collaborators">No collaborators yet. Search for users above to add them.</p>
          ) : (
            <div className="collaborators-list">
              {collaborators.map(collaborator => (
                <div key={collaborator.id} className="collaborator-item">
                  <div className="collaborator-info">
                    <span className="collaborator-name">
                      {collaborator.display_name || collaborator.username}
                    </span>
                    {collaborator.display_name && collaborator.display_name !== collaborator.username && (
                      <span className="collaborator-username">@{collaborator.username}</span>
                    )}
                  </div>

                  <div className="collaborator-actions">
                    <button
                      className="button danger no-flex"
                      onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                      disabled={removingUser === collaborator.user_id}
                      title="Remove collaborator"
                    >
                      {removingUser === collaborator.user_id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-times"></i>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role descriptions */}
        <div className="role-descriptions">
          <h4>Role Permissions</h4>
          <ul>
            Adding a user as an <strong>Editor</strong> allows them to edit the book's content, add their chapter submissions as chapters of this book, and reorganize chapters, they are able to delete their own chapters as well.
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default CollaboratorManagement;
