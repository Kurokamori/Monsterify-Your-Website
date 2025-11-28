import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModalManager } from '../../hooks/useModalManager';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SubmissionDetailPage = ({ type }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [relatedSubmissions, setRelatedSubmissions] = useState([]);

  // Set document title based on submission title
  useDocumentTitle(submission ? submission.title : (type === 'art' ? 'Gallery' : 'Library'));

  // Use modal manager for proper z-index stacking
  const { modalId, zIndex } = useModalManager(imageModalOpen, `image-modal-submission-${id}`);

  // Determine submission type from props or URL
  const submissionType = type || (window.location.pathname.includes('gallery') ? 'art' :
                                 window.location.pathname.includes('library') ? 'writing' : 'general');

  // Fetch submission data
  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await submissionService.getSubmissionById(id);

        if (response.success && response.submission) {
          setSubmission(response.submission);

          // Fetch related submissions if available
          if (response.submission.user_id) {
            const relatedResponse = await submissionService.getRelatedSubmissions(
              response.submission.id,
              response.submission.user_id,
              response.submission.submission_type
            );

            if (relatedResponse.success) {
              setRelatedSubmissions(relatedResponse.submissions || []);
            }
          }
        } else {
          setError('Failed to load submission details.');
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('An error occurred while loading the submission. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSubmissionData();
    }
  }, [id]);

  // Handle back navigation
  const handleBack = () => {
    if (submissionType === 'art') {
      navigate('/gallery');
    } else if (submissionType === 'writing') {
      navigate('/library');
    } else {
      navigate('/submissions');
    }
  };

  // Handle image click for art submissions
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  // Handle trainer click
  const handleTrainerClick = (trainerId) => {
    if (trainerId) {
      navigate(`/trainers/${trainerId}`);
    }
  };

  // Handle monster click
  const handleMonsterClick = (monsterId) => {
    if (monsterId) {
      navigate(`/monsters/${monsterId}`);
    }
  };

  // Handle related submission click
  const handleRelatedClick = (submissionId) => {
    navigate(`/${submissionType === 'art' ? 'gallery' : 'library'}/${submissionId}`);
  };

  if (loading) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-container">
          <ErrorMessage message={error} />
          <button className="btn-secondary" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-container">
          <div className="error-message">Submission not found</div>
          <button className="btn-secondary" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const isArt = submissionType === 'art' || submission.submission_type === 'art';
  const isWriting = submissionType === 'writing' || submission.submission_type === 'writing';

  return (
    <div className="submission-detail-page">
      <div className="submission-detail-container">
        <div className="submission-detail-header">
          <button className="btn-back" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i> Back to {isArt ? 'Gallery' : isWriting ? 'Library' : 'Submissions'}
          </button>
          <h1 className="submission-title">{submission.title}</h1>
          <div className="submission-meta">
            <div className="submission-author">
              By: {submission.display_name || submission.username || 'Unknown'}
            </div>
            <div className="submission-date">
              {new Date(submission.submission_date).toLocaleDateString()}
            </div>
          </div>

          {submission.tags && Array.isArray(submission.tags) && submission.tags.length > 0 && (
            <div className="submission-tags">
              {submission.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="submission-detail-content">
          {isArt && submission.image_url && (
            <div className="submission-image-container">
              <img
                src={submission.image_url}
                alt={submission.title}
                className="submission-main-image"
                onClick={() => handleImageClick(submission.image_url)}
              />
            </div>
          )}

          {submission.description && (
            <div className="submission-description">
              <h2>Description</h2>
              <p>{submission.description}</p>
            </div>
          )}

          {isWriting && submission.content && (
            <div className="submission-writing-content">
              <h2>Content</h2>
              <div className="writing-text">
                {submission.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Additional Images */}
          {isArt && submission.additional_images && submission.additional_images.length > 0 && (
            <div className="submission-additional-images">
              <h2>Additional Images</h2>
              <div className="additional-images-grid">
                {submission.additional_images.map((image, index) => (
                  <div key={index} className="additional-image-container">
                    <img
                      src={image.url}
                      alt={`${submission.title} - Additional ${index + 1}`}
                      className="additional-image"
                      onClick={() => handleImageClick(image.url)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Trainers */}
          {submission.trainers && submission.trainers.length > 0 && (
            <div className="submission-featured-entities">
              <h2>Featured Trainers</h2>
              <div className="featured-entities-grid">
                {submission.trainers.map(trainer => (
                  <div
                    key={trainer.id}
                    className="featured-trainer-card"
                    onClick={() => handleTrainerClick(trainer.id)}
                  >
                    <div className="featured-trainer-image">
                      <img
                        src={trainer.main_ref || '/images/default_trainer.png'}
                        alt={trainer.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_trainer.png';
                        }}
                      />
                    </div>
                    <div className="featured-entity-name">{trainer.name}</div>
                    <div className="featured-entity-species">
                    {trainer.species1 && (
                      <div className="featured-entity-species">{trainer.species1}</div>
                    )}
                    {trainer.species2 && (
                      <div className="featured-entity-species">{trainer.species2}</div>
                    )}
                    {trainer.species3 && (
                      <div className="featured-entity-species">{trainer.species3}</div>
                    )}
                    </div>
                    <div className="featured-entity-types">
                      {trainer.type1 && (
                        <span className={`featured-type-badge type-${trainer.type1.toLowerCase()}`}>
                          {trainer.type1}
                        </span>
                      )}
                      {trainer.type2 && (
                        <span className={`featured-type-badge type-${trainer.type2.toLowerCase()}`}>
                          {trainer.type2}
                        </span>
                      )}
                      {trainer.type3 && (
                        <span className={`featured-type-badge type-${trainer.type3.toLowerCase()}`}>
                          {trainer.type3}
                        </span>
                      )}
                      {trainer.type4 && (
                        <span className={`featured-type-badge type-${trainer.type4.toLowerCase()}`}>
                          {trainer.type4}
                        </span>
                      )}
                      {trainer.type5 && (
                        <span className={`featured-type-badge type-${trainer.type5.toLowerCase()}`}>
                          {trainer.type5}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Monsters */}
          {submission.monsters && submission.monsters.length > 0 && (
            <div className="submission-featured-entities">
              <h2>Featured Monsters</h2>
              <div className="featured-entities-grid">
                {submission.monsters.map(monster => (
                  <div
                    key={monster.id}
                    className="featured-entity-card"
                    onClick={() => handleMonsterClick(monster.id)}
                  >
                    <div className="featured-entity-image">
                      <img
                        src={monster.img_link || monster.image_url || '/images/default_mon.png'}
                        alt={monster.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_mon.png';
                        }}
                      />
                    </div>
                    <div className="featured-entity-name">{monster.name}</div>
                    <div className="featured-entity-species">{monster.species}</div>
                    <div className="featured-entity-level">Lv. {monster.level}</div>
                    <div className="featured-entity-types">
                      {monster.type1 && (
                        <span className={`featured-type-badge type-${monster.type1.toLowerCase()}`}>
                          {monster.type1}
                        </span>
                      )}
                      {monster.type2 && (
                        <span className={`featured-type-badge type-${monster.type2.toLowerCase()}`}>
                          {monster.type2}
                        </span>
                      )}
                    </div>
                    <div className="featured-entity-types">
                      {monster.type3 && (
                        <span className={`featured-type-badge type-${monster.type3.toLowerCase()}`}>
                          {monster.type3}
                        </span>
                      )}
                      {monster.type4 && (
                        <span className={`featured-type-badge type-${monster.type4.toLowerCase()}`}>
                          {monster.type4}
                        </span>
                      )}
                      {monster.type5 && (
                        <span className={`featured-type-badge type-${monster.type5.toLowerCase()}`}>
                          {monster.type5}
                        </span>
                      )}
                    </div>
                    <div className="featured-entity-attribute">
                      <span className={`featured-attribute-badge attribute-${monster.attribute.toLowerCase()}`}>
                        {monster.attribute}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Submissions */}
          {relatedSubmissions.length > 0 && (
            <div className="related-submissions">
              <h2>More by this Creator</h2>
              <div className="related-submissions-grid">
                {relatedSubmissions.map(related => (
                  <div
                    key={related.id}
                    className="related-submission-card"
                    onClick={() => handleRelatedClick(related.id)}
                  >
                    <div className="related-submission-image">
                      <img
                        src={related.image_url || (isArt ? '/images/default_art.png' : '/images/default_book.png')}
                        alt={related.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = isArt ? '/images/default_art.png' : '/images/default_book.png';
                        }}
                      />
                    </div>
                    <div className="related-submission-title">{related.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="image-modal-overlay" style={{ zIndex }} onClick={closeImageModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              <i className="fas fa-times"></i>
            </button>
            <img
              src={selectedImage}
              alt="Full size view"
              className="image-modal-img"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetailPage;
