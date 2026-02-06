import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';


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
  // Rebuild from original text, preserving line breaks, up to word limit
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
    // Start of a new word
    if (result.length === 0 || /\s$/.test(result)) {
      count++;
      if (count > wordLimit) break;
    }
    result += char;
  }
  return result.trim() + '...';
};

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
  const [showBooksOnly, setShowBooksOnly] = useState(false);

  // Fetch writings
  useEffect(() => {
    fetchWritings();
    fetchTags();
  }, [page, contentTypeFilter, tagFilter, sortBy, showBooksOnly]);

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

      // Filter by books only or exclude chapters
      if (showBooksOnly) {
        params.booksOnly = true;
      } else {
        // By default, hide chapters (they should be viewed within their books)
        params.excludeChapters = true;
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

        <div className="filter-group filter-checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showBooksOnly}
              onChange={(e) => setShowBooksOnly(e.target.checked)}
            />
            Books Only
          </label>
        </div>

        <div className="filter-actions">
          <button
            className="button filter apply"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
          <button
            className="button filter reset"
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
              className={`gallery-item library-item ${writing.is_book ? 'is-book' : ''}`}
              onClick={() => handleWritingClick(writing)}
            >
              {writing.cover_image_url ? (
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
                  {writing.is_book ? (
                    <div className="library-item-book-badge">
                      <i className="fas fa-book"></i> {writing.chapter_count || 0} Chapters
                    </div>
                  ) : (
                    <div className="library-item-word-count">
                      {formatWordCount(writing.word_count)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="library-item-text-cover">
                  <div className="library-item-text-cover-icon">
                    <i className={`fas ${writing.is_book ? 'fa-book' : 'fa-feather-alt'}`}></i>
                  </div>
                  <h4 className="library-item-text-cover-title">{writing.title}</h4>
                  <p className="library-item-text-cover-author">
                    By {writing.user?.display_name || writing.display_name || writing.username || 'Unknown'}
                  </p>
                  {(writing.description || writing.content_preview) && (
                    <p className="library-item-text-cover-description">
                      {writing.description || getContentPreview(writing.content_preview)}
                    </p>
                  )}
                  {writing.tags && Array.isArray(writing.tags) && writing.tags.length > 0 && (
                    <>
                      <div className="library-item-text-cover-divider" />
                      <div className="library-item-text-cover-tags">
                        {writing.tags.map(tag => (
                          <span key={tag} className="library-item-text-cover-tag">{tag}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {writing.is_book ? (
                    <div className="library-item-book-badge">
                      <i className="fas fa-book"></i> {writing.chapter_count || 0} Chapters
                    </div>
                  ) : (
                    <div className="library-item-word-count-inline">
                      {formatWordCount(writing.word_count)}
                    </div>
                  )}
                </div>
              )}
              {writing.cover_image_url && (
                <div className="gallery-item-info">
                  <h3 className="gallery-item-title">
                    {writing.title}
                  </h3>
                  <div className="gallery-item-meta">
                    <span className="gallery-item-artist">
                      By {writing.user?.display_name || writing.display_name || writing.username || 'Unknown'}
                    </span>
                  </div>
                  {(writing.description || writing.content_preview) && (
                    <p className="library-item-description">
                      {writing.description || getContentPreview(writing.content_preview)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button
            className="button secondary"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <div className="pagination-info">
            Page {page} of {totalPages}
          </div>

          <button
            className="button secondary"
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
