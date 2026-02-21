import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutocompleteInput, AutocompleteOption } from '../common/AutocompleteInput';
import { Pagination } from '../common/Pagination';
import { MatureContentFilter, MatureFilters } from './MatureContentFilter';
import { ErrorModal } from '../common/ErrorModal';
import api from '../../services/api';

interface Artwork {
  id: number;
  title: string;
  image_url: string;
  content_type: string;
  likes: number;
  liked_by_user: boolean;
  user?: {
    id: number;
    username: string;
    display_name: string;
  };
  display_name?: string;
  username?: string;
  tags?: string[];
}

interface GalleryResponse {
  submissions: Artwork[];
  totalPages: number;
}

interface TagsResponse {
  tags: string[];
}

type ThumbnailSize = 'small' | 'medium' | 'large' | 'xlarge';

const THUMBNAIL_CONFIG: Record<ThumbnailSize, { label: string; limit: number }> = {
  small:  { label: 'S',  limit: 24 },
  medium: { label: 'M',  limit: 16 },
  large:  { label: 'L',  limit: 12 },
  xlarge: { label: 'XL', limit: 6  },
};

const SIZE_ORDER: ThumbnailSize[] = ['small', 'medium', 'large', 'xlarge'];

export function ArtGallery() {
  const navigate = useNavigate();

  // State
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('large');
  const [showMature, setShowMature] = useState(false);
  const [matureFilters, setMatureFilters] = useState<MatureFilters>({
    gore: true,
    nsfw_light: true,
    nsfw_heavy: true,
    triggering: true,
    intense_violence: true
  });
  const [externalFilter, setExternalFilter] = useState<'all' | 'game' | 'external'>('all');

  const currentLimit = THUMBNAIL_CONFIG[thumbnailSize].limit;

  // Cycle thumbnail size
  const cycleThumbnailSize = () => {
    const currentIndex = SIZE_ORDER.indexOf(thumbnailSize);
    const nextIndex = (currentIndex + 1) % SIZE_ORDER.length;
    setThumbnailSize(SIZE_ORDER[nextIndex]);
    setPage(1);
  };

  // Fetch artworks
  const fetchArtworks = useCallback(async () => {
    try {
      if (initialLoad) setLoading(true);

      const params: Record<string, string | number | boolean> = {
        page,
        limit: currentLimit,
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

      if (externalFilter === 'game') {
        params.isExternal = false;
      } else if (externalFilter === 'external') {
        params.isExternal = true;
      }

      const response = await api.get<GalleryResponse>('/submissions/gallery', { params });
      setArtworks(response.data.submissions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching artworks:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load artworks. Please try again later.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, contentTypeFilter, tagFilters, sortBy, showMature, matureFilters, initialLoad, currentLimit, externalFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await api.get<TagsResponse>('/submissions/tags');
      setAvailableTags(response.data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchArtworks();
    fetchTags();
  }, [fetchArtworks, fetchTags]);

  // Handle artwork click
  const handleArtworkClick = (artwork: Artwork) => {
    navigate(`/gallery/${artwork.id}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  // Reset filters
  const resetFilters = () => {
    setContentTypeFilter('all');
    setTagFilters([]);
    setTagInputValue('');
    setSortBy('newest');
    setThumbnailSize('large');
    setShowMature(false);
    setMatureFilters({
      gore: true,
      nsfw_light: true,
      nsfw_heavy: true,
      triggering: true,
      intense_violence: true
    });
    setExternalFilter('all');
    setPage(1);
  };

  // Handle tag selection from autocomplete
  const handleTagSelect = (option: AutocompleteOption | null) => {
    if (option?.name && !tagFilters.includes(option.name)) {
      setTagFilters(prev => [...prev, option.name]);
      setPage(1);
    }
    setTagInputValue('');
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setTagFilters(prev => prev.filter(tag => tag !== tagToRemove));
    setPage(1);
  };

  // Handle mature filter change
  const handleMatureFilterChange = (type: keyof MatureFilters, value: boolean) => {
    setMatureFilters(prev => ({ ...prev, [type]: value }));
  };

  // Render loading state
  if (loading && initialLoad) {
    return (
      <div className="container center">
        <div className="loading-spinner">Loading gallery...</div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      {/* Filters */}
      <div className="gallery-filters">
        <div className="filter-item">
          <label htmlFor="content-type-filter">Content Type</label>
          <select
            id="content-type-filter"
            className="select"
            value={contentTypeFilter}
            onChange={(e) => {
              setContentTypeFilter(e.target.value);
              setPage(1);
            }}
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

        <div className="filter-item">
          <AutocompleteInput
            id="tag-filter"
            name="tag-filter"
            label="Tag"
            value={tagInputValue}
            onChange={setTagInputValue}
            options={availableTags.filter(tag => !tagFilters.includes(tag))}
            placeholder="Search tags..."
            onSelect={handleTagSelect}
            noPadding
          />
        </div>

        <div className="filter-item">
          <label htmlFor="sort-by">Sort By</label>
          <select
            id="sort-by"
            className="select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="source-filter">Source</label>
          <select
            id="source-filter"
            className="select"
            value={externalFilter}
            onChange={(e) => {
              setExternalFilter(e.target.value as 'all' | 'game' | 'external');
              setPage(1);
            }}
          >
            <option value="all">All Art</option>
            <option value="game">Game Art</option>
            <option value="external">External Art</option>
          </select>
        </div>

        <MatureContentFilter
          showMature={showMature}
          onShowMatureChange={setShowMature}
          activeFilters={matureFilters}
          onFilterChange={handleMatureFilterChange}
        />

        <div className="gallery-filter-actions">
          <button
            className="button filter gallery-size-toggle"
            onClick={cycleThumbnailSize}
            title={`Thumbnail size: ${thumbnailSize}`}
          >
            <i className="fas fa-th-large"></i> {THUMBNAIL_CONFIG[thumbnailSize].label}
          </button>
          <button className="button filter" onClick={resetFilters}>
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
      <div className={`submission__gallery-grid gallery-size-${thumbnailSize}`}>
        {artworks.map(artwork => (
          <div
            key={artwork.id}
            className="gallery-item card card--clickable"
            onClick={() => handleArtworkClick(artwork)}
          >
            <div className="card__image">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/default_art.png';
                }}
              />
            </div>
            <div className="card__body">
              <h3 className="submission__gallery-item-title">{artwork.title}</h3>
              <div className="gallery-item-meta">
                <span className="submission__gallery-item-artist">
                  By {artwork.user?.display_name || artwork.display_name || artwork.username || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Gallery Error"
        onRetry={fetchArtworks}
      />
    </div>
  );
}
