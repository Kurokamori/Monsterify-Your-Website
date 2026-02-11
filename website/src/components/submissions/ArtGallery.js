import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import MatureContentFilter from './MatureContentFilter';
import AutocompleteInput from '../common/AutocompleteInput';

const ArtGallery = () => {
  const navigate = useNavigate();

  // State
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState([]);
  const [tagInputValue, setTagInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showMature, setShowMature] = useState(false);
  const [matureFilters, setMatureFilters] = useState({
    gore: true,
    nsfw_light: true,
    nsfw_heavy: true,
    triggering: true,
    intense_violence: true
  });

  // Fetch artworks
  useEffect(() => {
    fetchArtworks();
    fetchTags();
  }, [page, contentTypeFilter, tagFilters, sortBy, showMature, matureFilters]);

  const fetchArtworks = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 12,
        sort: sortBy,
        showMature
      };

      if (contentTypeFilter !== 'all') {
        params.contentType = contentTypeFilter;
      }

      if (tagFilters.length > 0) {
        params.tags = tagFilters.join(',');
      }

      if (showMature) {
        params.matureFilters = JSON.stringify(matureFilters);
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
    setTagFilters([]);
    setTagInputValue('');
    setSortBy('newest');
    setShowMature(false);
    setMatureFilters({
      gore: true,
      nsfw_light: true,
      nsfw_heavy: true,
      triggering: true,
      intense_violence: true
    });
    setPage(1);
  };

  // Handle tag selection from autocomplete
  const handleTagSelect = (option) => {
    const tagName = option.name;
    if (tagName && !tagFilters.includes(tagName)) {
      setTagFilters(prev => [...prev, tagName]);
      setPage(1);
    }
    setTagInputValue('');
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove) => {
    setTagFilters(prev => prev.filter(tag => tag !== tagToRemove));
    setPage(1);
  };

  // Handle mature filter change
  const handleMatureFilterChange = (type, value) => {
    setMatureFilters(prev => ({ ...prev, [type]: value }));
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


  const displayArtworks = artworks.length > 0 ? artworks : [];

  return (
    <div className="gallery-container">
      {/* Filters */}
      <div className="gallery-filters">
        <div className="set-item">
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

        <div className="set-item">
          <label htmlFor="tag-filter">Tag:</label>
          <AutocompleteInput
            id="tag-filter"
            name="tag-filter"
            value={tagInputValue}
            onChange={(e) => setTagInputValue(e.target.value)}
            options={Array.isArray(availableTags) ? availableTags.filter(tag => !tagFilters.includes(tag)) : []}
            placeholder="Search tags..."
            onSelect={handleTagSelect}
          />
        </div>

        <div className="set-item">
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

        <MatureContentFilter
          showMature={showMature}
          onShowMatureChange={setShowMature}
          activeFilters={matureFilters}
          onFilterChange={handleMatureFilterChange}
        />

        <div className="filter-actions">
          <button
            className="button filter reset"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Selected Tags Row */}
      {tagFilters.length > 0 && (
        <div className="selected-tags-row">
          <span className="selected-tags-label">Active Tags:</span>
          <div className="selected-tags-list">
            {tagFilters.map(tag => (
              <span key={tag} className="selected-tag">
                {tag}
                <button
                  type="button"
                  className="selected-tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove ${tag} tag`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="town-places">
        {Array.isArray(displayArtworks) && displayArtworks.map(artwork => (
          <div
            key={artwork.id}
            className="gallery-item"
            onClick={() => handleArtworkClick(artwork)}
          >
            <div className="image-container">
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
        <div className="type-tags fw gallery-pagination">
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

export default ArtGallery;
