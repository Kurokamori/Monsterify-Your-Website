import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorModal } from '../common/ErrorModal';
import api from '../../services/api';

interface User {
  id: number;
  discord_id?: string;
  username: string;
  display_name?: string;
}

interface Collaborator {
  id: number;
  user_id: number;
  username?: string;
  display_name?: string;
  role: string;
}

interface CollaboratorsResponse {
  success: boolean;
  collaborators?: Collaborator[];
  error?: string;
}

interface SearchResponse {
  success: boolean;
  users?: User[];
}

interface AddCollaboratorResponse {
  success: boolean;
  collaborator?: Collaborator;
  error?: string;
}

interface RemoveCollaboratorResponse {
  success: boolean;
  error?: string;
}

interface CollaboratorManagementProps {
  bookId: number;
  bookTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onCollaboratorsChange?: () => void;
}

export function CollaboratorManagement({
  bookId,
  bookTitle,
  isOpen,
  onClose,
  onCollaboratorsChange
}: CollaboratorManagementProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUser, setAddingUser] = useState<number | null>(null);
  const [removingUser, setRemovingUser] = useState<number | null>(null);

  // Fetch collaborators when modal opens
  const fetchCollaborators = useCallback(async () => {
    if (!bookId || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<CollaboratorsResponse>(`/submissions/books/${bookId}/collaborators`);
      if (response.data.success) {
        setCollaborators(response.data.collaborators || []);
      } else {
        setError('Failed to load collaborators');
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      const axiosError = err as { response?: { data?: { error?: string; message?: string } } };
      setError(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to load collaborators');
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
        const response = await api.get<SearchResponse>(`/submissions/books/${bookId}/collaborators/search`, {
          params: { search: searchTerm }
        });
        if (response.data.success) {
          setSearchResults(response.data.users || []);
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
  const handleAddCollaborator = async (user: User, role = 'editor') => {
    setAddingUser(user.id);
    setError(null);

    try {
      const response = await api.post<AddCollaboratorResponse>(
        `/submissions/books/${bookId}/collaborators`,
        {
          userId: user.discord_id || user.id,
          role
        }
      );

      if (response.data.success && response.data.collaborator) {
        // Add to local state
        setCollaborators(prev => [...prev, {
          ...response.data.collaborator!,
          username: user.username,
          display_name: user.display_name
        }]);

        // Clear search
        setSearchTerm('');
        setSearchResults([]);

        // Notify parent of change
        onCollaboratorsChange?.();
      } else {
        setError(response.data.error || 'Failed to add collaborator');
      }
    } catch (err) {
      console.error('Error adding collaborator:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to add collaborator');
    } finally {
      setAddingUser(null);
    }
  };

  // Remove a collaborator
  const handleRemoveCollaborator = async (userId: number) => {
    setRemovingUser(userId);
    setError(null);

    try {
      const response = await api.delete<RemoveCollaboratorResponse>(
        `/submissions/books/${bookId}/collaborators/${userId}`
      );

      if (response.data.success) {
        setCollaborators(prev => prev.filter(c => c.user_id !== userId));
        onCollaboratorsChange?.();
      } else {
        setError(response.data.error || 'Failed to remove collaborator');
      }
    } catch (err) {
      console.error('Error removing collaborator:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to remove collaborator');
    } finally {
      setRemovingUser(null);
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
        <ErrorModal
          isOpen={!!error}
          onClose={() => setError(null)}
          message={error || ''}
          title="Collaborator Error"
        />

        {/* Search for users */}
        <div className="collaborator-search">
          <label htmlFor="user-search" className="form-label">Add Collaborator</label>
          <div className="search-input-container">
            <input
              type="text"
              id="user-search"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
            {searching && (
              <span className="search-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </span>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div key={user.id} className="search-result-item">
                  <div className="user-info">
                    <span className="user-display-name">
                      {user.display_name || user.username}
                    </span>
                    {user.display_name && user.display_name !== user.username && (
                      <span className="user-username">@{user.username}</span>
                    )}
                  </div>
                  <div className="add-actions">
                    <button
                      className="button primary small"
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
          <h3 className="form-section">Current Collaborators</h3>

          {loading ? (
            <LoadingSpinner message="Loading collaborators..." size="small" />
          ) : collaborators.length === 0 ? (
            <p className="no-collaborators">
              No collaborators yet. Search for users above to add them.
            </p>
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
                      className="button danger icon small"
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
          <p>
            Adding a user as an <strong>Editor</strong> allows them to edit the book's content,
            add their chapter submissions as chapters of this book, and reorganize chapters.
            They are able to delete their own chapters as well.
          </p>
        </div>
      </div>
    </Modal>
  );
}
