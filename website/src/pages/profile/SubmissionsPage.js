import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SubmissionsPage = () => {
  useDocumentTitle('My Submissions');
  
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isNewSubmissionModalOpen, setIsNewSubmissionModalOpen] = useState(false);
  
  // New submission form state
  const [submissionType, setSubmissionType] = useState('monster');
  const [submissionName, setSubmissionName] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [submissionImage, setSubmissionImage] = useState(null);
  const [submissionImagePreview, setSubmissionImagePreview] = useState('');
  const [submissionFormError, setSubmissionFormError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile/submissions' } });
      return;
    }
    
    fetchSubmissions();
  }, [isAuthenticated, navigate]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch user's submissions
      const response = await api.get('/submissions/user');
      setSubmissions(response.data.submissions || []);
      
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSubmissionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmissionImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateSubmissionForm = () => {
    if (!submissionName.trim()) {
      setSubmissionFormError('Name is required');
      return false;
    }
    
    if (!submissionDescription.trim()) {
      setSubmissionFormError('Description is required');
      return false;
    }
    
    if (!submissionImage) {
      setSubmissionFormError('Image is required');
      return false;
    }
    
    setSubmissionFormError(null);
    return true;
  };

  const handleSubmitNewSubmission = async (e) => {
    e.preventDefault();
    
    if (!validateSubmissionForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('type', submissionType);
      formData.append('name', submissionName);
      formData.append('description', submissionDescription);
      formData.append('image', submissionImage);
      
      // Create new submission
      await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset form and close modal
      setSubmissionType('monster');
      setSubmissionName('');
      setSubmissionDescription('');
      setSubmissionImage(null);
      setSubmissionImagePreview('');
      setIsNewSubmissionModalOpen(false);
      
      // Refresh submissions
      await fetchSubmissions();
      
    } catch (err) {
      console.error('Error creating submission:', err);
      setSubmissionFormError(err.response?.data?.message || 'Failed to create submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const statusMatch = statusFilter === 'all' || submission.status === statusFilter;
    const typeMatch = typeFilter === 'all' || submission.type === typeFilter;
    return statusMatch && typeMatch;
  });

  // Fallback data for development
  const fallbackSubmissions = [
    {
      id: 1,
      type: 'monster',
      name: 'Thunderclaw',
      description: 'A powerful electric-type monster with sharp claws that can generate lightning.',
      image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Thunderclaw',
      status: 'pending',
      submitted_date: '2023-05-15T00:00:00Z',
      feedback: null
    },
    {
      id: 2,
      type: 'location',
      name: 'Crystal Cavern',
      description: 'A mysterious cave filled with glowing crystals that enhance monster abilities.',
      image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Crystal+Cavern',
      status: 'approved',
      submitted_date: '2023-04-10T00:00:00Z',
      feedback: 'Great concept! We\'ve added this to the game with some minor adjustments.'
    },
    {
      id: 3,
      type: 'item',
      name: 'Focus Band',
      description: 'A headband that increases a monster\'s concentration, boosting its accuracy in battle.',
      image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Focus+Band',
      status: 'rejected',
      submitted_date: '2023-03-22T00:00:00Z',
      feedback: 'This item is too similar to existing items. Please try a more unique concept.'
    }
  ];

  const displaySubmissions = submissions.length > 0 ? filteredSubmissions : fallbackSubmissions.filter(submission => {
    const statusMatch = statusFilter === 'all' || submission.status === statusFilter;
    const typeMatch = typeFilter === 'all' || submission.type === typeFilter;
    return statusMatch && typeMatch;
  });

  if (loading && !isNewSubmissionModalOpen && !isSubmissionModalOpen) {
    return <LoadingSpinner message="Loading submissions..." />;
  }

  if (error && !submissions.length) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchSubmissions}
      />
    );
  }

  return (
    <div className="bosses-page">
      <div className="tree-header">
        <h1>My Submissions</h1>
        <button 
          className="button primary"
          onClick={() => setIsNewSubmissionModalOpen(true)}
        >
          <i className="fas fa-plus"></i> New Submission
        </button>
      </div>

      <div className="profile-content">
        <div className="set-item">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="set-item">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Types</option>
            <option value="monster">Monster</option>
            <option value="location">Location</option>
            <option value="item">Item</option>
          </select>
        </div>
      </div>

      {displaySubmissions.length > 0 ? (
        <div className="submissions-grid">
          {displaySubmissions.map(submission => (
            <div 
              className={`submission-card submission-${submission.status}`} 
              key={submission.id}
              onClick={() => {
                setSelectedSubmission(submission);
                setIsSubmissionModalOpen(true);
              }}
            >
              <div className="npc-avatar">
                <img
                  src={submission.image_url}
                  alt={submission.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_submission.png';
                  }}
                />
                <div className="submission-type">{submission.type}</div>
                <div className="submission-status">{submission.status}</div>
              </div>
              <div className="submission-content">
                <h3 className="submission-name">{submission.name}</h3>
                <p className="related-submissions">{submission.description}</p>
                <div className="submission-date">
                  <i className="fas fa-calendar-alt"></i> Submitted on {new Date(submission.submitted_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-submissions">
          <div className="no-submissions-icon">
            <i className="fas fa-file-upload"></i>
          </div>
          <h2>No Submissions Found</h2>
          <p>You haven't submitted any content yet. Create your first submission to contribute to the game!</p>
          <button 
            className="button primary lg"
            onClick={() => setIsNewSubmissionModalOpen(true)}
          >
            Create Your First Submission
          </button>
        </div>
      )}

      {/* Submission Detail Modal */}
      <Modal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        title="Submission Details"
      >
        {selectedSubmission && (
          <div className="submission-detail-modal">
            <div className="image-container">
              <img
                src={selectedSubmission.image_url}
                alt={selectedSubmission.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_submission.png';
                }}
              />
            </div>
            
            <div className="submission-detail-info">
              <div className="submission-detail-header">
                <h3 className="submission-detail-name">{selectedSubmission.name}</h3>
                <div className={`submission-detail-status status-${selectedSubmission.status}`}>
                  {selectedSubmission.status}
                </div>
              </div>
              
              <div className="submission-detail-type">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedSubmission.type}</span>
              </div>
              
              <div className="submission-detail-date">
                <span className="detail-label">Submitted:</span>
                <span className="detail-value">{new Date(selectedSubmission.submitted_date).toLocaleString()}</span>
              </div>
              
              <div className="submission-detail-feedback">
                <span className="detail-label">Description:</span>
                <p className="detail-value">{selectedSubmission.description}</p>
              </div>
              
              {selectedSubmission.feedback && (
                <div className="submission-detail-feedback">
                  <span className="detail-label">Feedback:</span>
                  <p className="detail-value">{selectedSubmission.feedback}</p>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="button secondary"
                onClick={() => setIsSubmissionModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Submission Modal */}
      <Modal
        isOpen={isNewSubmissionModalOpen}
        onClose={() => setIsNewSubmissionModalOpen(false)}
        title="New Submission"
      >
        <div className="new-submission-modal">
          <form onSubmit={handleSubmitNewSubmission}>
            {submissionFormError && (
              <div className="form-error">
                <i className="fas fa-exclamation-circle"></i> {submissionFormError}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="submission-type">Submission Type</label>
              <select
                id="submission-type"
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="form-input"
              >
                <option value="monster">Monster</option>
                <option value="location">Location</option>
                <option value="item">Item</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="submission-name">Name</label>
              <input
                type="text"
                id="submission-name"
                value={submissionName}
                onChange={(e) => setSubmissionName(e.target.value)}
                className="form-input"
                placeholder={`Enter ${submissionType} name`}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="submission-description">Description</label>
              <textarea
                id="submission-description"
                value={submissionDescription}
                onChange={(e) => setSubmissionDescription(e.target.value)}
                className="form-input"
                placeholder={`Describe your ${submissionType}`}
                rows={4}
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>Image</label>
              <div className="image-upload">
                <div className="image-container medium">
                  {submissionImagePreview ? (
                    <img src={submissionImagePreview} alt="Preview" />
                  ) : (
                    <div className="image-placeholder">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                </div>
                <div className="image-controls">
                  <label className="upload-button">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      style={{ display: 'none' }}
                    />
                    Choose Image
                  </label>
                  <p className="upload-info">JPG, PNG or GIF. Max size of 2MB.</p>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="button secondary"
                onClick={() => setIsNewSubmissionModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="button primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SubmissionsPage;
