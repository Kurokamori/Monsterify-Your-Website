import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/useAuth';
import { LoadingSpinner, ErrorMessage, ConfirmModal } from '@components/common';
import bookmarkService from '@services/bookmarkService';
import type { BookmarkCategory } from '@services/bookmarkService';

const BookmarksPage = () => {
  useDocumentTitle('Bookmarks');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<BookmarkCategory | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<BookmarkCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookmarkService.getCategories();
      setCategories(data);
      setError('');
    } catch {
      setError('Failed to load bookmark categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      await bookmarkService.createCategory(newTitle.trim());
      setNewTitle('');
      setShowCreateModal(false);
      await fetchCategories();
    } catch {
      setError('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameTitle.trim()) return;
    try {
      setRenaming(true);
      await bookmarkService.updateCategory(renameTarget.id, renameTitle.trim());
      setRenameTarget(null);
      setRenameTitle('');
      await fetchCategories();
    } catch {
      setError('Failed to rename category');
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await bookmarkService.deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCategories();
    } catch {
      setError('Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bookmarks-page">
        <div className="page-header">
          <h1>Bookmarks</h1>
        </div>
        <ErrorMessage message="Please log in to view your bookmarks." />
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="page-header">
        <h1><i className="fas fa-bookmark"></i> Bookmarks</h1>
        <button className="button primary no-flex" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus"></i> New Collection
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <div className="bookmarks-empty">
          <i className="fas fa-bookmark"></i>
          <p>No bookmark collections yet.</p>
          <p>Create a collection to start organizing your trainers and monsters!</p>
          <button className="button primary" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus"></i> Create First Collection
          </button>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bookmark-category-card"
              onClick={() => navigate(`/profile/bookmarks/${cat.id}`)}
            >
              <div className="bookmark-category-card__title">
                <i className="fas fa-folder"></i> {cat.title}
              </div>
              <div className="bookmark-category-card__count">
                {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
              </div>
              <div className="bookmark-category-card__actions" onClick={e => e.stopPropagation()}>
                <button
                  className="button sm"
                  title="Rename"
                  onClick={() => {
                    setRenameTarget(cat);
                    setRenameTitle(cat.title);
                  }}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="button sm danger"
                  title="Delete"
                  onClick={() => setDeleteTarget(cat)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>New Collection</h2>
            <div className="form-group">
              <label htmlFor="new-category-title">Title</label>
              <input
                id="new-category-title"
                type="text"
                className="form-input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Collection name..."
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="button" onClick={() => setShowCreateModal(false)} disabled={creating}>
                Cancel
              </button>
              <button className="button primary" onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="modal-overlay" onClick={() => setRenameTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Rename Collection</h2>
            <div className="form-group">
              <label htmlFor="rename-category-title">Title</label>
              <input
                id="rename-category-title"
                type="text"
                className="form-input"
                value={renameTitle}
                onChange={e => setRenameTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="button" onClick={() => setRenameTarget(null)} disabled={renaming}>
                Cancel
              </button>
              <button className="button primary" onClick={handleRename} disabled={renaming || !renameTitle.trim()}>
                {renaming ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          title="Delete Collection"
          message={`Are you sure you want to delete "${deleteTarget.title}"? All items and notes in this collection will be permanently removed.`}
          confirmText={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="bookmarks-back">
        <Link to="/profile" className="button">
          <i className="fas fa-arrow-left"></i> Back to Profile
        </Link>
      </div>
    </div>
  );
};

export default BookmarksPage;
