import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorModal } from '../common/ErrorModal';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import api from '../../services/api';
import submissionService from '../../services/submissionService';

interface Submission {
  id: number;
  title?: string;
  description?: string;
  content?: string;
  content_preview?: string;
  image_url?: string;
  cover_image_url?: string;
  submission_type: 'art' | 'writing';
  content_type?: string;
  submission_date?: string;
  tags?: string[];
  is_book?: boolean;
  parent_id?: number | null;
  chapter_count?: number;
}

interface SubmissionsResponse {
  success: boolean;
  submissions?: Submission[];
  pagination?: {
    totalPages: number;
    currentPage: number;
    total: number;
  };
  message?: string;
}

interface UpdateResponse {
  success: boolean;
  message?: string;
}

interface UserBook {
  id: number;
  title: string;
}

interface EditForm {
  title: string;
  description: string;
  tags: string[];
  content: string;
  parentId: string;
}

// Strip markdown formatting and return first ~40 words with ellipsis
const getContentPreview = (rawContent: string | undefined, wordLimit = 40): string => {
  if (!rawContent) return '';
  const text = rawContent
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(`{3}[\s\S]*?`{3}|`[^`]+`)/g, '')
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^[-*>]+\s?/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\|/g, '')
    .trim();

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

// Format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function MySubmissions() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab and filter state
  const [activeSubTab, setActiveSubTab] = useState<'art' | 'writing'>('art');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    description: '',
    tags: [],
    content: ''
  });
  const [tagInput, setTagInput] = useState('');

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<SubmissionsResponse>('/submissions/user/my-submissions', {
        params: {
          submissionType: activeSubTab,
          sortBy,
          page,
          limit: 12
        }
      });

      if (response.data.success) {
        setSubmissions(response.data.submissions || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setSubmissions([]);
        setError('Failed to load submissions');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeSubTab, sortBy, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Reset page when tab or sort changes
  useEffect(() => {
    setPage(1);
  }, [activeSubTab, sortBy]);

  // Handle edit modal open
  const openEditModal = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditForm({
      title: submission.title || '',
      description: submission.description || '',
      tags: submission.tags ? (Array.isArray(submission.tags) ? submission.tags : []) : [],
      content: submission.content || '',
      parentId: submission.parent_id ? String(submission.parent_id) : ''
    });
    setTagInput('');
    setEditError(null);
    setIsEditModalOpen(true);

    // Fetch user's books for writing submissions
    if (submission.submission_type === 'writing' && !submission.is_book) {
      try {
        const response = await submissionService.getUserBooks();
        const books = ((response.books || []) as UserBook[]).filter(b => b.id !== submission.id);
        setUserBooks(books);
      } catch (err) {
        console.error('Error fetching user books:', err);
      }
    }
  };

  // Handle delete modal open
  const openDeleteModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Handle edit form change
  const handleEditFormChange = (field: keyof EditForm, value: string | string[]) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tag add
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  // Handle tag remove
  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedSubmission) return;

    try {
      setIsSaving(true);
      setEditError(null);

      const updateData: Record<string, string | string[] | number | null> = {
        title: editForm.title,
        description: editForm.description,
        tags: editForm.tags
      };

      // Only include content for writing submissions
      if (selectedSubmission.submission_type === 'writing') {
        updateData.content = editForm.content;

        // Include book assignment change if applicable
        if (!selectedSubmission.is_book) {
          const originalParentId = selectedSubmission.parent_id ? String(selectedSubmission.parent_id) : '';
          if (editForm.parentId !== originalParentId) {
            updateData.parentId = editForm.parentId ? Number(editForm.parentId) : null;
          }
        }
      }

      const response = await api.patch<UpdateResponse>(
        `/submissions/${selectedSubmission.id}`,
        updateData
      );

      if (response.data.success) {
        await fetchSubmissions();
        setIsEditModalOpen(false);
        setSelectedSubmission(null);
      } else {
        setEditError(response.data.message || 'Failed to update submission');
      }
    } catch (err) {
      console.error('Error updating submission:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setEditError(axiosError.response?.data?.message || 'Failed to update submission. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedSubmission) return;

    try {
      setIsSaving(true);
      setDeleteError(null);

      const response = await api.delete<UpdateResponse>(`/submissions/${selectedSubmission.id}`);

      if (response.data.success) {
        await fetchSubmissions();
        setIsDeleteModalOpen(false);
        setSelectedSubmission(null);
      } else {
        setDeleteError(response.data.message || 'Failed to delete submission');
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setDeleteError(axiosError.response?.data?.message || 'Failed to delete submission. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get thumbnail URL
  const getThumbnail = (submission: Submission): string | null => {
    if (submission.image_url) return submission.image_url;
    if (submission.cover_image_url) return submission.cover_image_url;
    if (submission.submission_type === 'art') return '/images/default_art.png';
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="my-submissions-auth-required">
        <i className="fas fa-lock"></i>
        <h3>Authentication Required</h3>
        <p>Please log in to view your submissions.</p>
        <Link to="/login" className="button primary">
          Log In
        </Link>
      </div>
    );
  }

  if (loading && submissions.length === 0) {
    return <LoadingSpinner message="Loading your submissions..." />;
  }

  if (error && submissions.length === 0) {
    return (
      <div className="my-submissions-container">
        <ErrorModal
          isOpen={true}
          onClose={() => setError(null)}
          message={error}
          title="Failed to Load Submissions"
          onRetry={fetchSubmissions}
        />
      </div>
    );
  }

  return (
    <div className="my-submissions-container">
      {/* Sub-tabs for Art/Writing */}
      <div className="my-submissions-tabs">
        <button
          className={`button tab ${activeSubTab === 'art' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('art')}
        >
          <i className="fas fa-paint-brush"></i> Art
        </button>
        <button
          className={`button tab ${activeSubTab === 'writing' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('writing')}
        >
          <i className="fas fa-pen-fancy"></i> Writing
        </button>
      </div>

      {/* Sort controls */}
      <div className="my-submissions-controls">
        <div className="filter-group">
          <label htmlFor="sort-by">
            <i className="fas fa-sort"></i> Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Submissions grid */}
      {submissions.length > 0 ? (
        <>
          <div className="my-submissions-grid">
            {submissions.map(submission => (
              <div className="my-submission-card card" key={submission.id}>
                <div
                  className="my-submission-thumbnail"
                  onClick={() => navigate(`/submissions/${submission.id}`)}
                >
                  {getThumbnail(submission) ? (
                    <>
                      <img
                        src={getThumbnail(submission)!}
                        alt={submission.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = submission.submission_type === 'art'
                            ? '/images/default_art.png'
                            : '/images/default_writing.png';
                        }}
                      />
                      <div className="submission-type-badge">
                        <i className={`fas ${submission.submission_type === 'art' ? 'fa-paint-brush' : 'fa-pen-fancy'}`}></i>
                      </div>
                    </>
                  ) : (
                    <div className="library-item-text-cover">
                      <div className="library-item-text-cover-icon">
                        <i className={`fas ${submission.is_book ? 'fa-book' : 'fa-feather-alt'}`}></i>
                      </div>
                      <h4 className="submission__gallery-item-title">{submission.title || 'Untitled'}</h4>
                      {(submission.description || submission.content || submission.content_preview) && (
                        <p className="library-item-text-cover-description">
                          {submission.description || getContentPreview(submission.content || submission.content_preview)}
                        </p>
                      )}
                      {submission.is_book && (
                        <div className="library-item-book-badge">
                          <i className="fas fa-book"></i> {submission.chapter_count || 0} Chapters
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="my-submission-info">
                  <h3 className="my-submission-title">{submission.title || 'Untitled'}</h3>
                  <div className="my-submission-meta">
                    <span className="submission-date">
                      <i className="fas fa-calendar-alt"></i> {formatDate(submission.submission_date)}
                    </span>
                    <span className="submission-type">
                      {submission.content_type || submission.submission_type}
                    </span>
                  </div>
                  {submission.tags && submission.tags.length > 0 && (
                    <div className="my-submission-tags">
                      {submission.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                      {submission.tags.length > 3 && (
                        <span className="tag more">+{submission.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="my-submission-actions">
                  <Link to={`/submissions/${submission.id}`} className="button primary small">
                    <i className="fas fa-eye"></i> View
                  </Link>
                  <button
                    className="button secondary small"
                    onClick={() => openEditModal(submission)}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    className="button danger small"
                    onClick={() => openDeleteModal(submission)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="submission__empty-state">
          <div className="submission__empty-state-icon">
            <i className={`fas ${activeSubTab === 'art' ? 'fa-paint-brush' : 'fa-pen-fancy'}`}></i>
          </div>
          <h2>No {activeSubTab === 'art' ? 'Art' : 'Writing'} Submissions</h2>
          <p>You haven't submitted any {activeSubTab === 'art' ? 'artwork' : 'written works'} yet.</p>
          <Link to={`/submissions/${activeSubTab}`} className="button primary large">
            Create Your First {activeSubTab === 'art' ? 'Art' : 'Writing'} Submission
          </Link>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Submission"
        size="large"
      >
        {selectedSubmission && (
          <div className="edit-submission-modal">
            <div className="form-group">
              <label htmlFor="edit-title" className="form-label">Title</label>
              <input
                type="text"
                id="edit-title"
                value={editForm.title}
                onChange={(e) => handleEditFormChange('title', e.target.value)}
                className="input"
                placeholder="Enter submission title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-description" className="form-label">Description</label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                className="input textarea"
                rows={3}
                placeholder="Enter a description"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  className="input"
                  placeholder="Type a tag and press Enter"
                />
                <button
                  type="button"
                  className="button secondary small"
                  onClick={handleAddTag}
                >
                  Add
                </button>
              </div>
              {editForm.tags.length > 0 && (
                <div className="edit-tags-list">
                  {editForm.tags.map((tag, index) => (
                    <span key={index} className="tag editable">
                      {tag}
                      <button
                        type="button"
                        className="submission__tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content field for writing submissions */}
            {selectedSubmission.submission_type === 'writing' && (
              <div className="form-group">
                <label htmlFor="edit-content" className="form-label">Content</label>
                <textarea
                  id="edit-content"
                  value={editForm.content}
                  onChange={(e) => handleEditFormChange('content', e.target.value)}
                  className="input textarea content-textarea"
                  rows={10}
                  placeholder="Enter your writing content"
                />
              </div>
            )}

            {/* Book assignment for writing submissions (non-books only) */}
            {selectedSubmission.submission_type === 'writing' && !selectedSubmission.is_book && userBooks.length > 0 && (
              <div className="form-group">
                <label htmlFor="edit-parent-book" className="form-label">Book</label>
                <select
                  id="edit-parent-book"
                  value={editForm.parentId}
                  onChange={(e) => handleEditFormChange('parentId', e.target.value)}
                  className="input"
                >
                  <option value="">None (standalone)</option>
                  {userBooks.map(book => (
                    <option key={book.id} value={String(book.id)}>{book.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Note for art submissions */}
            {selectedSubmission.submission_type === 'art' && (
              <div className="edit-note submission__alert submission__alert--info">
                <i className="fas fa-info-circle"></i>
                <span>Note: Images cannot be changed after submission. You can only edit the title, description, and tags.</span>
              </div>
            )}

            <div className="submission__modal-actions">
              <button
                className="button secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ErrorModal
        isOpen={!!editError}
        onClose={() => setEditError(null)}
        message={editError || ''}
        title="Edit Error"
      />

      <ErrorModal
        isOpen={!!deleteError}
        onClose={() => setDeleteError(null)}
        message={deleteError || ''}
        title="Delete Error"
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Submission"
      >
        {selectedSubmission && (
          <div className="delete-submission-modal">
            <p>
              Are you sure you want to delete <strong>"{selectedSubmission.title || 'this submission'}"</strong>?
            </p>
            <p className="delete-warning submission__alert submission__alert--info">
              <i className="fas fa-info-circle"></i>
              This will remove the submission from your gallery. Any rewards you've already earned will not be affected.
            </p>

            <div className="submission__modal-actions">
              <button
                className="button secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="button danger"
                onClick={handleDelete}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Delete Submission'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
