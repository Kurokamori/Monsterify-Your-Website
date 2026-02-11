import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import submissionService from '../../services/submissionService';
import '../../styles/utility-specific/MySubmissions.css';

// Strip markdown formatting and return first ~40 words with ellipsis
const getContentPreview = (rawContent, wordLimit = 40) => {
  if (!rawContent) return '';
  let text = rawContent
    .replace(/^#{1,6}\s+/gm, '')        // headers
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/(`{3}[\s\S]*?`{3}|`[^`]+`)/g, '') // code blocks/inline code
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')  // bold/italic
    .replace(/~~(.*?)~~/g, '$1')         // strikethrough
    .replace(/^[-*>]+\s?/gm, '')         // list markers, blockquotes
    .replace(/^---+$/gm, '')             // horizontal rules
    .replace(/\|/g, '')                  // table pipes
    .trim();

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) return text;
  let count = 0;
  let result = '';
  for (const char of text) {
    if (/\s/.test(char)) {
      if (char === '\n') {
        result += char;
      } else if (result.length > 0 && !/\s$/.test(result)) {
        result += ' ';
      }
      continue;
    }
    if (result.length === 0 || /\s$/.test(result)) {
      count++;
      if (count > wordLimit) break;
    }
    result += char;
  }
  return result.trim() + '...';
};

const MySubmissions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab and filter state
  const [activeSubTab, setActiveSubTab] = useState('art');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
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

      const response = await submissionService.getMySubmissions({
        submissionType: activeSubTab,
        sortBy,
        page,
        limit: 12
      });

      if (response && response.success) {
        setSubmissions(response.submissions || []);
        setTotalPages(response.pagination?.totalPages || 1);
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
  const openEditModal = (submission) => {
    setSelectedSubmission(submission);
    setEditForm({
      title: submission.title || '',
      description: submission.description || '',
      tags: submission.tags ? (Array.isArray(submission.tags) ? submission.tags : []) : [],
      content: submission.content || ''
    });
    setTagInput('');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Handle delete modal open
  const openDeleteModal = (submission) => {
    setSelectedSubmission(submission);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
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
  const handleRemoveTag = (tagToRemove) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e) => {
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

      const updateData = {
        title: editForm.title,
        description: editForm.description,
        tags: editForm.tags
      };

      // Only include content for writing submissions
      if (selectedSubmission.submission_type === 'writing') {
        updateData.content = editForm.content;
      }

      const response = await submissionService.updateSubmission(selectedSubmission.id, updateData);

      if (response && response.success) {
        // Refresh submissions
        await fetchSubmissions();
        setIsEditModalOpen(false);
        setSelectedSubmission(null);
      } else {
        setEditError(response?.message || 'Failed to update submission');
      }
    } catch (err) {
      console.error('Error updating submission:', err);
      setEditError(err.response?.data?.message || 'Failed to update submission. Please try again.');
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

      const response = await submissionService.deleteSubmission(selectedSubmission.id);

      if (response && response.success) {
        // Refresh submissions
        await fetchSubmissions();
        setIsDeleteModalOpen(false);
        setSelectedSubmission(null);
      } else {
        setDeleteError(response?.message || 'Failed to delete submission');
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete submission. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if submission has a cover image
  const hasCover = (submission) => {
    return !!(submission.image_url || submission.cover_image_url);
  };

  // Get thumbnail URL (returns null if no cover for writing submissions)
  const getThumbnail = (submission) => {
    if (submission.image_url) {
      return submission.image_url;
    }
    if (submission.cover_image_url) {
      return submission.cover_image_url;
    }
    // For art, use default. For writing, return null to show text cover
    if (submission.submission_type === 'art') {
      return '/images/default_art.png';
    }
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
    return <ErrorMessage message={error} onRetry={fetchSubmissions} />;
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
            className="special-input"
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
              <div className="my-submission-card" key={submission.id}>
                <div
                  className="my-submission-thumbnail"
                  onClick={() => navigate(`/submissions/${submission.id}`)}
                >
                  {getThumbnail(submission) ? (
                    <>
                      <img
                        src={getThumbnail(submission)}
                        alt={submission.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = submission.submission_type === 'art'
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
                      <h4 className="gallery-item-title">{submission.title || 'Untitled'}</h4>
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
                  <Link to={`/submissions/${submission.id}`} className="button primary sm">
                    <i className="fas fa-eye"></i> View
                  </Link>
                  <button
                    className="button secondary sm"
                    onClick={() => openEditModal(submission)}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    className="button danger sm"
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
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className={`fas ${activeSubTab === 'art' ? 'fa-paint-brush' : 'fa-pen-fancy'}`}></i>
          </div>
          <h2>No {activeSubTab === 'art' ? 'Art' : 'Writing'} Submissions</h2>
          <p>You haven't submitted any {activeSubTab === 'art' ? 'artwork' : 'written works'} yet.</p>
          <Link to={`/submissions/${activeSubTab}`} className="button primary lg">
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
              <label htmlFor="edit-title">Title</label>
              <input
                type="text"
                id="edit-title"
                value={editForm.title}
                onChange={(e) => handleEditFormChange('title', e.target.value)}
                className="special-input"
                placeholder="Enter submission title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                className="special-input"
                rows="3"
                placeholder="Enter a description"
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="special-input"
                  placeholder="Type a tag and press Enter"
                />
                <button
                  type="button"
                  className="button secondary sm"
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
                        className="tag-remove"
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
                <label htmlFor="edit-content">Content</label>
                <textarea
                  id="edit-content"
                  value={editForm.content}
                  onChange={(e) => handleEditFormChange('content', e.target.value)}
                  className="special-input content-textarea"
                  rows="10"
                  placeholder="Enter your writing content"
                />
              </div>
            )}

            {/* Note for art submissions */}
            {selectedSubmission.submission_type === 'art' && (
              <div className="edit-note">
                <i className="fas fa-info-circle"></i>
                <span>Note: Images cannot be changed after submission. You can only edit the title, description, and tags.</span>
              </div>
            )}

            {editError && (
              <div className="modal-error">
                <i className="fas fa-exclamation-circle"></i> {editError}
              </div>
            )}

            <div className="modal-actions">
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
            <p className="delete-warning">
              <i className="fas fa-info-circle"></i>
              This will remove the submission from your gallery. Any rewards you've already earned will not be affected.
            </p>

            {deleteError && (
              <div className="modal-error">
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
};

export default MySubmissions;
