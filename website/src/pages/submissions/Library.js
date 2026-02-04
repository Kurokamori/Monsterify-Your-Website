import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Pagination, Badge, Collapse } from 'react-bootstrap';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

const Library = () => {
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

        const data = await submissionService.getWritingLibrary(params);
        setSubmissions(data.submissions);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching library submissions:', err);
        setError('Failed to load library. Please try again later.');
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
    navigate(`/submissions/library${queryString ? `?${queryString}` : ''}`, { replace: true });
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
    <Container className="submission-page library-page">
      <h1 className="text-center mb-4">Writing Library</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-section mb-4">
        <Button
          onClick={() => setShowFilters(prevState => !prevState)}
          aria-controls="library-filter-collapse"
          aria-expanded={showFilters}
          variant="outline-primary"
          className="w-100 mb-2 filter-toggle-btn"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {(selectedTag || selectedTrainer || selectedMonster || sortBy !== 'newest') &&
            <span className="ms-2 filter-badge">Filters Applied</span>
          }
        </Button>

        <Collapse in={showFilters}>
          <div id="library-filter-collapse">
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
                    navigate('/submissions/library', { replace: true });
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
                  {submission.cover_image_url ? (
                    <div className="card-img-container">
                      <Card.Img
                        variant="top"
                        src={submission.cover_image_url}
                        alt={submission.title}
                      />
                      {submission.is_book && (
                        <Badge bg="primary" className="book-badge">
                          Book ({submission.chapter_count} {submission.chapter_count === 1 ? 'chapter' : 'chapters'})
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="library-item-text-cover">
                      <div className="library-item-text-cover-icon">
                        <i className={`fas ${submission.is_book ? 'fa-book' : 'fa-feather-alt'}`}></i>
                      </div>
                      <h4 className="library-item-text-cover-title">{submission.title}</h4>
                      <p className="library-item-text-cover-author">
                        By: {submission.trainer_name || submission.display_name || 'Unknown'}
                      </p>
                      {(submission.description || submission.content_preview) && (
                        <p className="library-item-text-cover-description">
                          {submission.description || getContentPreview(submission.content_preview)}
                        </p>
                      )}
                      {submission.tags && Array.isArray(submission.tags) && submission.tags.length > 0 && (
                        <>
                          <div className="library-item-text-cover-divider" />
                          <div className="library-item-text-cover-tags">
                            {submission.tags.map(tag => (
                              <span key={tag} className="library-item-text-cover-tag">{tag}</span>
                            ))}
                          </div>
                        </>
                      )}
                      {submission.is_book && (
                        <Badge bg="primary" className="book-badge">
                          Book ({submission.chapter_count} {submission.chapter_count === 1 ? 'chapter' : 'chapters'})
                        </Badge>
                      )}
                    </div>
                  )}
                  <Card.Body>
                    {submission.cover_image_url && (
                      <>
                        <Card.Title>{submission.title}</Card.Title>
                        <Card.Text className="submission-description">
                          {submission.description || getContentPreview(submission.content_preview)}
                        </Card.Text>
                        <div className="submission-meta">
                          <small>By: {submission.trainer_name || submission.display_name || 'Unknown'}</small>
                          <small>{new Date(submission.submission_date).toLocaleDateString()}</small>
                        </div>
                      </>
                    )}
                    {!submission.cover_image_url && (
                      <div className="submission-meta">
                        <small>{new Date(submission.submission_date).toLocaleDateString()}</small>
                      </div>
                    )}
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

export default Library;
