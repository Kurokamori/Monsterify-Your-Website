import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';


const WritingLibrary = () => {
  const navigate = useNavigate();

  // State
  const [writings, setWritings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // Fetch writings
  useEffect(() => {
    fetchWritings();
    fetchTags();
  }, [page, contentTypeFilter, tagFilter, sortBy]);

  const fetchWritings = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 12,
        sort: sortBy
      };

      if (contentTypeFilter !== 'all') {
        params.contentType = contentTypeFilter;
      }

      if (tagFilter) {
        params.tag = tagFilter;
      }

      const response = await submissionService.getWritingLibrary(params);

      setWritings(response.submissions || []);
      setTotalPages(response.totalPages || 1);

    } catch (err) {
      console.error('Error fetching writings:', err);
      setError('Failed to load writings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await submissionService.getSubmissionTags();
      setAvailableTags(response.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  // Handle writing click
  const handleWritingClick = (writing) => {
    navigate(`/library/${writing.id}`);
  };

  // Handle like
  const handleLike = async (writingId, event) => {
    try {
      // Stop propagation to prevent navigation
      event.stopPropagation();

      await submissionService.likeSubmission(writingId);

      // Update the writing in the state
      setWritings(prev => prev.map(writing => {
        if (writing.id === writingId) {
          return {
            ...writing,
            likes: writing.likes + 1,
            liked_by_user: true
          };
        }
        return writing;
      }));
    } catch (err) {
      console.error('Error liking writing:', err);
    }
  };

  // Handle unlike
  const handleUnlike = async (writingId, event) => {
    try {
      // Stop propagation to prevent navigation
      event.stopPropagation();

      await submissionService.unlikeSubmission(writingId);

      // Update the writing in the state
      setWritings(prev => prev.map(writing => {
        if (writing.id === writingId) {
          return {
            ...writing,
            likes: writing.likes - 1,
            liked_by_user: false
          };
        }
        return writing;
      }));
    } catch (err) {
      console.error('Error unliking writing:', err);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setContentTypeFilter('all');
    setTagFilter('');
    setSortBy('newest');
    setPage(1);
  };

  // Format word count
  const formatWordCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k words`;
    }
    return `${count} words`;
  };

  // Render loading state
  if (loading && page === 1) {
    return <LoadingSpinner message="Loading library..." />;
  }

  // Render error state
  if (error && writings.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchWritings}
      />
    );
  }

  // Fallback data for development
  const fallbackWritings = [
    {
      id: 1,
      title: 'The Legend of Leafeon',
      description: 'A tale of a brave Leafeon who saved the forest from a terrible drought.',
      cover_image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Leafeon+Story',
      content_type: 'story',
      word_count: 2500,
      submitted_date: '2023-05-15T00:00:00Z',
      user: {
        id: 1,
        username: 'ash123',
        display_name: 'Ash'
      },
      trainer: {
        id: 1,
        name: 'Ash Ketchum'
      },
      likes: 18,
      liked_by_user: false,
      comments_count: 7,
      tags: ['leafeon', 'forest', 'adventure', 'fantasy'],
      content_preview: 'Once upon a time, in a lush green forest, there lived a Leafeon named Verdant. Verdant was known throughout the forest for his wisdom and connection to nature...'
    },
    {
      id: 2,
      title: 'Flameon: Heart of Fire',
      description: 'The journey of a young Flameon discovering the true meaning of courage.',
      cover_image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Flameon+Story',
      content_type: 'story',
      word_count: 3200,
      submitted_date: '2023-05-20T00:00:00Z',
      user: {
        id: 1,
        username: 'ash123',
        display_name: 'Ash'
      },
      trainer: {
        id: 1,
        name: 'Ash Ketchum'
      },
      likes: 24,
      liked_by_user: true,
      comments_count: 9,
      tags: ['flameon', 'fire', 'courage', 'journey'],
      content_preview: 'The volcano rumbled in the distance as Blaze, a young Flameon, stared at the imposing mountain with determination in his eyes...'
    },
    {
      id: 3,
      title: 'Aqueon and the Lost City',
      description: 'An underwater adventure where Aqueon discovers an ancient civilization.',
      cover_image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Aqueon+Story',
      content_type: 'story',
      word_count: 4100,
      submitted_date: '2023-05-25T00:00:00Z',
      user: {
        id: 2,
        username: 'misty456',
        display_name: 'Misty'
      },
      trainer: {
        id: 2,
        name: 'Misty'
      },
      likes: 32,
      liked_by_user: false,
      comments_count: 12,
      tags: ['aqueon', 'underwater', 'adventure', 'mystery'],
      content_preview: 'The ocean depths held many secrets, but none as magnificent as what Marina, an adventurous Aqueon, was about to discover...'
    }
  ];

  const displayWritings = writings.length > 0 ? writings : fallbackWritings;

  return (
    <div className="gallery-container library-container">
      {/* Filters */}
      <div className="gallery-filters">
        <div className="filter-group">
          <label htmlFor="content-type-filter">Content Type:</label>
          <select
            id="content-type-filter"
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="story">Stories</option>
            <option value="chapter">Chapters</option>
            <option value="profile">Character Profiles</option>
            <option value="prompt">Prompt-based</option>
            <option value="poem">Poems</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="tag-filter">Tag:</label>
          <select
            id="tag-filter"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort By:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="longest">Longest</option>
            <option value="shortest">Shortest</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            className="filter-button apply"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
          <button
            className="filter-button reset"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Library Grid */}
      <div className="gallery-grid library-grid">
        {displayWritings.map(writing => (
          <div
            key={writing.id}
            className="gallery-item library-item"
            onClick={() => handleWritingClick(writing)}
          >
            <div className="gallery-item-image-container library-item-cover-container">
              <img
                src={writing.cover_image_url}
                alt={writing.title}
                className="gallery-item-image library-item-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_book.png';
                }}
              />
              <div className="library-item-word-count">
                {formatWordCount(writing.word_count)}
              </div>
            </div>
            <div className="gallery-item-info">
              <h3 className="gallery-item-title">{writing.title}</h3>
              <div className="gallery-item-meta">
                <span className="gallery-item-artist">
                  By {writing.user?.display_name || writing.display_name || writing.username || 'Unknown'}
                </span>
              </div>
              <p className="library-item-description">{writing.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <div className="pagination-info">
            Page {page} of {totalPages}
          </div>

          <button
            className="pagination-button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default WritingLibrary;
