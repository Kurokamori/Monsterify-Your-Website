import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Pagination, Collapse } from 'react-bootstrap';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Gallery = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tags, setTags] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [monsters, setMonsters] = useState([]);

  // Filters
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedMonster, setSelectedMonster] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tagParam = queryParams.get('tag');
    const trainerParam = queryParams.get('trainer');
    const monsterParam = queryParams.get('monster');
    const sortParam = queryParams.get('sort');
    const pageParam = queryParams.get('page');

    if (tagParam) setSelectedTag(tagParam);
    if (trainerParam) setSelectedTrainer(trainerParam);
    if (monsterParam) setSelectedMonster(monsterParam);
    if (sortParam) setSortBy(sortParam);
    if (pageParam) setPage(parseInt(pageParam));

    // Auto-expand filters if any are active
    if (tagParam || trainerParam || monsterParam || (sortParam && sortParam !== 'newest')) {
      setShowFilters(true);
    }
  }, [location.search]);

  // Load submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);

        const params = {
          page,
          limit: 12,
          sort: sortBy
        };

        if (selectedTag) params.tag = selectedTag;
        if (selectedTrainer) params.trainerId = selectedTrainer;
        if (selectedMonster) params.monsterId = selectedMonster;

        const data = await submissionService.getArtGallery(params);
        setSubmissions(data.submissions);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching gallery submissions:', err);
        setError('Failed to load gallery. Please try again later.');
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [page, selectedTag, selectedTrainer, selectedMonster, sortBy]);

  // Load tags, trainers, and monsters for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [tagsData, trainersData, monstersData] = await Promise.all([
          submissionService.getSubmissionTags(),
          trainerService.getAllTrainers(),
          monsterService.getAllMonsters()
        ]);

        setTags(tagsData.tags || []);
        setTrainers(trainersData.trainers || []);
        setMonsters(monstersData.monsters || []);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };

    fetchFilters();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const queryParams = new URLSearchParams();

    if (selectedTag) queryParams.set('tag', selectedTag);
    if (selectedTrainer) queryParams.set('trainer', selectedTrainer);
    if (selectedMonster) queryParams.set('monster', selectedMonster);
    if (sortBy !== 'newest') queryParams.set('sort', sortBy);
    if (page > 1) queryParams.set('page', page.toString());

    const queryString = queryParams.toString();
    navigate(`/submissions/gallery${queryString ? `?${queryString}` : ''}`, { replace: true });
  }, [selectedTag, selectedTrainer, selectedMonster, sortBy, page, navigate]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleTagChange = (e) => {
    setSelectedTag(e.target.value);
    setPage(1);
  };

  const handleTrainerChange = (e) => {
    setSelectedTrainer(e.target.value);
    setPage(1);
  };

  const handleMonsterChange = (e) => {
    setSelectedMonster(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleSubmissionClick = (id) => {
    navigate(`/submissions/${id}`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxPages = 5;
    const startPage = Math.max(1, page - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (page > 1) {
      items.push(
        <Pagination.Prev key="prev" onClick={() => handlePageChange(page - 1)} />
      );
    }

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === page}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    if (page < totalPages) {
      items.push(
        <Pagination.Next key="next" onClick={() => handlePageChange(page + 1)} />
      );
    }

    return <Pagination className="justify-content-center mt-4">{items}</Pagination>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="submission-page gallery-page">
      <div className="page-header-centered">
        <h1>Art Gallery</h1>
        <p>Browse artwork from the community</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-section mb-4">
        <Button
          onClick={() => setShowFilters(prevState => !prevState)}
          aria-controls="gallery-filter-collapse"
          aria-expanded={showFilters}
          variant="outline-primary"
          className="button toggle block"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {(selectedTag || selectedTrainer || selectedMonster || sortBy !== 'newest') &&
            <span className="ms-2 filter-badge">Filters Applied</span>
          }
        </Button>

        <Collapse in={showFilters}>
          <div id="gallery-filter-collapse">
            <Row className="filter-row">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Filter by Tag</Form.Label>
                  <Form.Select value={selectedTag} onChange={handleTagChange}>
                    <option value="">All Tags</option>
                    {Array.isArray(tags) && tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Filter by Trainer</Form.Label>
                  <Form.Select value={selectedTrainer} onChange={handleTrainerChange}>
                    <option value="">All Trainers</option>
                    {Array.isArray(trainers) && trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Filter by Monster</Form.Label>
                  <Form.Select value={selectedMonster} onChange={handleMonsterChange}>
                    <option value="">All Monsters</option>
                    {Array.isArray(monsters) && monsters.map(monster => (
                      <option key={monster.id} value={monster.id}>{monster.name} ({monster.species || 'Unknown'})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select value={sortBy} onChange={handleSortChange}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {(selectedTag || selectedTrainer || selectedMonster || sortBy !== 'newest') && (
              <div className="text-end mt-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTag('');
                    setSelectedTrainer('');
                    setSelectedMonster('');
                    setSortBy('newest');
                    setPage(1);
                    navigate('/submissions/gallery', { replace: true });
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </Collapse>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center my-5">
          <h3>No submissions found</h3>
          <p>Try adjusting your filters or check back later for new submissions.</p>
        </div>
      ) : (
        <>
          <Row>
            {Array.isArray(submissions) && submissions.map(submission => (
              <Col key={submission.id} md={4} sm={6} className="mb-4">
                <Card className="submission-card h-100" onClick={() => handleSubmissionClick(submission.id)}>
                  <div className="card-img-container">
                    <Card.Img
                      variant="top"
                      src={submission.image_url || 'https://via.placeholder.com/300/1e2532/d6a339?text=No+Image'}
                      alt={submission.title}
                    />
                  </div>
                  <Card.Body>
                    <Card.Title>{submission.title}</Card.Title>
                    <Card.Text className="submission-description">{submission.description}</Card.Text>
                    <div className="submission-meta">
                      <small>By: {submission.display_name || submission.username || 'Unknown'}</small>
                      <small>{new Date(submission.submission_date).toLocaleDateString()}</small>
                    </div>
                    {submission.tags && Array.isArray(submission.tags) && submission.tags.length > 0 && (
                      <div className="submission-tags">
                        {submission.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {renderPagination()}
        </>
      )}
    </Container>
  );
};

export default Gallery;
