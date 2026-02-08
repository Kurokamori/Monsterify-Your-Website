import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const data = await submissionService.getSubmissionById(id);
        setSubmission(data.submission);

        // Set the main image as selected
        if (data.submission.images && data.submission.images.length > 0) {
          const mainImage = data.submission.images.find(img => img.is_main) || data.submission.images[0];
          setSelectedImage(mainImage.image_url);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Failed to load submission. Please try again later.');
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleBackClick = () => {
    const isArt = submission.submission_type === 'art' || submission.submission_type === 'reference' || submission.submission_type === 'prompt';
    navigate(isArt ? '/gallery' : '/library');
  };

  const handleChapterClick = (chapterId) => {
    navigate(`/submissions/${chapterId}`);
  };

  const handleMonsterClick = (monsterId) => {
    navigate(`/monsters/${monsterId}`);
  };

  const handleTrainerClick = (trainerId) => {
    navigate(`/trainers/${trainerId}`);
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Container className="bazar-container">
        <div className="alert alert-danger">{error}</div>
        <Button variant="secondary" onClick={handleBackClick}>
          Back to {(submission?.submission_type === 'art' || submission?.submission_type === 'reference' || submission?.submission_type === 'prompt') ? 'Gallery' : 'Library'}
        </Button>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container className="bazar-container">
        <div className="alert alert-warning">Submission not found</div>
        <Button variant="secondary" onClick={handleBackClick}>
          Back to Gallery/Library
        </Button>
      </Container>
    );
  }

  const isArt = submission.submission_type === 'art';
  const isBook = !!submission.is_book;
  const hasChapters = isBook && submission.chapters && submission.chapters.length > 0;
  const hasMonsters = submission.monsters && submission.monsters.length > 0;
  const hasImages = submission.images && submission.images.length > 0;

  return (
    <Container className="bazar-container">
      <Button variant="secondary" className="mb-3" onClick={handleBackClick}>
        &larr; Back to {isArt ? 'Gallery' : 'Library'}
      </Button>

      <div className="submission-detail">
        <div className="submission-detail-header">
          <h2>{submission.title}</h2>
          <div className="submission-detail-meta">
            <span>
              By: {submission.trainer_name ? (
                <Link to={`/trainers/${submission.trainer_id}`}>{submission.trainer_name}</Link>
              ) : (
                submission.display_name || 'Unknown'
              )}
            </span>
            <span>Posted on: {new Date(submission.submission_date).toLocaleDateString()}</span>
          </div>

          {submission.tags && Array.isArray(submission.tags) && submission.tags.length > 0 && (
            <div className="type-tags">
              {submission.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {isArt && hasImages && (
          <Row className="mb-4">
            <Col md={8}>
              <div className="main-image-container">
                <img
                  src={selectedImage || submission.images[0].image_url}
                  alt={submission.title}
                  className="img-fluid rounded"
                />
              </div>
            </Col>
            <Col md={4}>
              {submission.images.length > 1 && (
                <div className="submission-detail-images">
                  {Array.isArray(submission.images) && submission.images.map(image => (
                    <div
                      key={image.id}
                      className={`image-container${selectedImage === image.image_url ? 'selected' : ''}`}
                      onClick={() => handleImageClick(image.image_url)}
                    >
                      <img src={image.image_url} alt={submission.title} />
                    </div>
                  ))}
                </div>
              )}
            </Col>
          </Row>
        )}

        {!isArt && hasImages && (
          <div className="mb-4">
            <img
              src={submission.images[0].image_url}
              alt={submission.title}
              className="img-fluid rounded cover-image"
              style={{ maxHeight: '300px', display: 'block', margin: '0 auto' }}
            />
          </div>
        )}

        <div className="submission-detail-content">
          <h3>Description</h3>
          <p>{submission.description}</p>

          {submission.content && (
            <>
              <h3>Content</h3>
              <div className="content-text">
                {submission.content && submission.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </>
          )}
        </div>

        {hasMonsters && (
          <div className="submission-detail-monsters">
            <h3>Featured Monsters</h3>
            <Row>
              {Array.isArray(submission.monsters) && submission.monsters.map(monster => (
                <Col key={monster.id} md={4} className="mb-3">
                  <Card className="monster-card" onClick={() => handleMonsterClick(monster.id)}>
                    <Card.Body>
                      <Card.Title>{monster.name}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">{monster.species}</Card.Subtitle>
                      {monster.type && <div className="monster-type">Type: {monster.type}</div>}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {hasChapters && (
          <div className="no-npcs">
            <h3>Chapters</h3>
            <div className="list-group">
              {Array.isArray(submission.chapters) && submission.chapters.map(chapter => (
                <div
                  key={chapter.id}
                  className="chapter-item"
                  onClick={() => handleChapterClick(chapter.id)}
                >
                  <h4>{chapter.title}</h4>
                  {chapter.description && <p>{chapter.description}</p>}
                  <small>{new Date(chapter.submission_date).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {submission.parent_id && (
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => navigate(`/submissions/${submission.parent_id}`)}
            >
              Back to Book
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
};

export default SubmissionDetail;
