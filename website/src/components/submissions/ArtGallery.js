import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ArtGallery = () => {
  const navigate = useNavigate();

  // State
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // Fetch artworks
  useEffect(() => {
    fetchArtworks();
    fetchTags();
  }, [page, contentTypeFilter, tagFilter, sortBy]);

  const fetchArtworks = async () => {
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

      const response = await submissionService.getArtGallery(params);

      setArtworks(response.submissions || []);
      setTotalPages(response.totalPages || 1);

    } catch (err) {
      console.error('Error fetching artworks:', err);
      setError('Failed to load artworks. Please try again later.');
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

  // Handle artwork click
  const handleArtworkClick = (artwork) => {
    navigate(`/gallery/${artwork.id}`);
  };

  // Handle like
  const handleLike = async (artworkId, event) => {
    try {
      // Stop propagation to prevent navigation
      event.stopPropagation();

      await submissionService.likeSubmission(artworkId);

      // Update the artwork in the state
      setArtworks(prev => prev.map(artwork => {
        if (artwork.id === artworkId) {
          return {
            ...artwork,
            likes: artwork.likes + 1,
            liked_by_user: true
          };
        }
        return artwork;
      }));
    } catch (err) {
      console.error('Error liking artwork:', err);
    }
  };

  // Handle unlike
  const handleUnlike = async (artworkId, event) => {
    try {
      // Stop propagation to prevent navigation
      event.stopPropagation();

      await submissionService.unlikeSubmission(artworkId);

      // Update the artwork in the state
      setArtworks(prev => prev.map(artwork => {
        if (artwork.id === artworkId) {
          return {
            ...artwork,
            likes: artwork.likes - 1,
            liked_by_user: false
          };
        }
        return artwork;
      }));
    } catch (err) {
      console.error('Error unliking artwork:', err);
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

  // Render loading state
  if (loading && page === 1) {
    return <LoadingSpinner message="Loading gallery..." />;
  }

  // Render error state
  if (error && artworks.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchArtworks}
      />
    );
  }

  // Fallback data for development
  const fallbackArtworks = [
    {
      id: 1,
      title: 'Leafeon in the Forest',
      description: 'A Leafeon enjoying a sunny day in the forest.',
      image_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Leafeon',
      content_type: 'monster',
      quality: 'rendered',
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
      likes: 24,
      liked_by_user: false,
      comments_count: 5,
      tags: ['leafeon', 'forest', 'pokemon']
    },
    {
      id: 2,
      title: 'Flameon Battle Stance',
      description: 'Flameon ready for battle with flames blazing.',
      image_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Flameon',
      content_type: 'monster',
      quality: 'polished',
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
      likes: 32,
      liked_by_user: true,
      comments_count: 8,
      tags: ['flameon', 'battle', 'pokemon', 'fire']
    },
    {
      id: 3,
      title: 'Aqueon Swimming',
      description: 'Aqueon gracefully swimming in a crystal clear lake.',
      image_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Aqueon',
      content_type: 'monster',
      quality: 'rendered',
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
      likes: 18,
      liked_by_user: false,
      comments_count: 3,
      tags: ['aqueon', 'swimming', 'pokemon', 'water']
    }
  ];

  const displayArtworks = artworks.length > 0 ? artworks : fallbackArtworks;

  return (
    <div className="gallery-container">
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
            <option value="general">General Art</option>
            <option value="monster">Monster Art</option>
            <option value="trainer">Trainer Art</option>
            <option value="location">Location Art</option>
            <option value="event">Event Art</option>
            <option value="prompt">Prompt-based Art</option>
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
            {Array.isArray(availableTags) && availableTags.map(tag => (
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
          </select>
        </div>

        <div className="filter-actions">
          <button
            className="button button-filter reset"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="gallery-grid">
        {Array.isArray(displayArtworks) && displayArtworks.map(artwork => (
          <div
            key={artwork.id}
            className="gallery-item"
            onClick={() => handleArtworkClick(artwork)}
          >
            <div className="gallery-item-image-container">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="gallery-item-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_art.png';
                }}
              />
            </div>
            <div className="gallery-item-info">
              <h3 className="gallery-item-title">{artwork.title}</h3>
              <div className="gallery-item-meta">
                <span className="gallery-item-artist">
                  By {artwork.user?.display_name || artwork.display_name || artwork.username || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button
            className="button button-secondary"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <div className="pagination-info">
            Page {page} of {totalPages}
          </div>

          <button
            className="button button-secondary"
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

export default ArtGallery;
