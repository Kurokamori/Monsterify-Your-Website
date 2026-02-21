import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutocompleteInput, AutocompleteOption } from '../common/AutocompleteInput';
import { Pagination } from '../common/Pagination';
import { MatureContentFilter, MatureFilters } from './MatureContentFilter';
import { ErrorModal } from '../common/ErrorModal';
import api from '../../services/api';

interface Writing {
  id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
  content_type: string;
  word_count: number;
  is_book?: boolean;
  chapter_count?: number;
  content_preview?: string;
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

interface LibraryResponse {
  submissions: Writing[];
  totalPages: number;
}

interface TagsResponse {
  tags: string[];
}

// Strip markdown formatting and return first ~40 words with ellipsis
const getContentPreview = (rawContent: string | undefined, wordLimit = 40): string => {
  if (!rawContent) return '';
  const text = rawContent
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
  return words.slice(0, wordLimit).join(' ') + '...';
};

// Format word count
const formatWordCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k words`;
  }
  return `${count} words`;
};

export function WritingLibrary() {
  const navigate = useNavigate();

  // State
  const [writings, setWritings] = useState<Writing[]>([]);
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
  const [showBooksOnly, setShowBooksOnly] = useState(false);
  const [showMature, setShowMature] = useState(false);
  const [matureFilters, setMatureFilters] = useState<MatureFilters>({
    gore: true,
    nsfw_light: true,
    nsfw_heavy: true,
    triggering: true,
    intense_violence: true
  });
  const [externalFilter, setExternalFilter] = useState<'all' | 'game' | 'external'>('all');

  // Fetch writings
  const fetchWritings = useCallback(async () => {
    try {
      if (initialLoad) setLoading(true);

      const params: Record<string, string | number | boolean> = {
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

      // Filter by books only or exclude chapters
      if (showBooksOnly) {
        params.booksOnly = true;
      } else {
        // By default, hide chapters (they should be viewed within their books)
        params.excludeChapters = true;
      }

      if (showMature) {
        params.matureFilters = JSON.stringify(matureFilters);
      }

      if (externalFilter === 'game') {
        params.isExternal = false;
      } else if (externalFilter === 'external') {
        params.isExternal = true;
      }

      const response = await api.get<LibraryResponse>('/submissions/library', { params });
      setWritings(response.data.submissions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching writings:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load writings. Please try again later.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, contentTypeFilter, tagFilters, sortBy, showBooksOnly, showMature, matureFilters, initialLoad, externalFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await api.get<TagsResponse>('/submissions/tags');
      setAvailableTags(response.data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchWritings();
    fetchTags();
  }, [fetchWritings, fetchTags]);

  // Handle writing click
  const handleWritingClick = (writing: Writing) => {
    navigate(`/library/${writing.id}`);
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
    setShowBooksOnly(false);
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
        <div className="loading-spinner">Loading library...</div>
      </div>
    );
  }

  return (
    <div className="gallery-container library-container">
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
            <option value="story">Stories</option>
            <option value="chapter">Chapters</option>
            <option value="profile">Character Profiles</option>
            <option value="prompt">Prompt-based</option>
            <option value="poem">Poems</option>
            <option value="other">Other</option>
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
            <option value="longest">Longest</option>
            <option value="shortest">Shortest</option>
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
            <option value="all">All Writing</option>
            <option value="game">Game Writing</option>
            <option value="external">External Writing</option>
          </select>
        </div>

        <div className="filter-checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="checkbox"
              checked={showBooksOnly}
              onChange={(e) => {
                setShowBooksOnly(e.target.checked);
                setPage(1);
              }}
            />
            Books Only
          </label>
        </div>

        <MatureContentFilter
          showMature={showMature}
          onShowMatureChange={setShowMature}
          activeFilters={matureFilters}
          onFilterChange={handleMatureFilterChange}
        />

        <div className="gallery-filter-actions">
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

      {/* Library Grid */}
      <div className="submission__gallery-grid library-grid">
        {writings.map(writing => (
          <div
            key={writing.id}
            className={`gallery-item library-item card card--clickable ${writing.is_book ? 'is-book' : ''}`}
            onClick={() => handleWritingClick(writing)}
          >
            {writing.cover_image_url ? (
              <>
                <div className="card__image library-item-cover-container">
                  <img
                    src={writing.cover_image_url}
                    alt={writing.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/default_book.png';
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
                <div className="card__body">
                  <h3 className="submission__gallery-item-title">{writing.title}</h3>
                  <div className="gallery-item-meta">
                    <span className="submission__gallery-item-artist">
                      By {writing.user?.display_name || writing.display_name || writing.username || 'Unknown'}
                    </span>
                  </div>
                  {(writing.description || writing.content_preview) && (
                    <p className="library-item-description">
                      {writing.description || getContentPreview(writing.content_preview)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="library-item-text-cover">
                <div className="library-item-text-cover-icon">
                  <i className={`fas ${writing.is_book ? 'fa-book' : 'fa-feather-alt'}`}></i>
                </div>
                <h4 className="submission__gallery-item-title">{writing.title}</h4>
                <p className="submission__gallery-item-artist">
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
        title="Library Error"
        onRetry={fetchWritings}
      />
    </div>
  );
}
