import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import api from '../../services/api';
import {
  Adventure,
  AdventureStatus,
  StatusFilter,
  SortOption,
  timeAgo,
  formatDate,
  capitalize
} from './types';

interface AdventureListProps {
  status?: StatusFilter;
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  trainerId?: number | null;
  onAdventureSelected?: (adventure: Adventure) => void;
}

export const AdventureList = ({
  status = 'active',
  limit = 10,
  showFilters = true,
  showPagination = true,
  trainerId = null,
  onAdventureSelected = undefined
}: AdventureListProps) => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(status);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchAdventures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page,
        limit,
        sort: sortBy
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      let response;
      if (trainerId) {
        response = await api.get(`/adventures/trainer/${trainerId}`, { params });
      } else {
        response = await api.get('/adventures', { params });
      }

      setAdventures(response.data.adventures || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching adventures:', err);
      setError('Failed to load adventures. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sortBy, trainerId, limit]);

  useEffect(() => {
    fetchAdventures();
  }, [fetchAdventures]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const handleAdventureClick = (adventure: Adventure) => {
    if (onAdventureSelected) {
      onAdventureSelected(adventure);
    }
  };

  const getStatusClass = (adventureStatus: AdventureStatus): string => {
    return `adventure-status--${adventureStatus}`;
  };

  const getCardClass = (adventureStatus: AdventureStatus): string => {
    return `adventure-card adventure-card--${adventureStatus}`;
  };

  if (loading && page === 1) {
    return <LoadingSpinner message="Loading adventures..." />;
  }

  if (error && adventures.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchAdventures} />;
  }

  return (
    <div className="adventures-page">
      {showFilters && (
        <div className="adventure-filters">
          <div className="filter-item">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              className="input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">All Adventures</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="sort-by">Sort By</label>
            <select
              id="sort-by"
              className="input"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(1);
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_participants">Most Participants</option>
              <option value="most_encounters">Most Encounters</option>
            </select>
          </div>
        </div>
      )}

      {adventures.length === 0 ? (
        <div className="no-adventures">
          <p>No adventures found. Try different filters or create a new adventure!</p>
        </div>
      ) : (
        <div className="adventures-grid">
          {adventures.map((adventure) => (
            <div
              key={adventure.id}
              className={getCardClass(adventure.status)}
              onClick={() => handleAdventureClick(adventure)}
            >
              <Link
                to={`/adventures/${adventure.id}`}
                className="adventure-card__link"
              >
                <div className="adventure-card__header">
                  <h3 className="adventure-card__title">{adventure.title}</h3>
                  <span className={`adventure-status ${getStatusClass(adventure.status)}`}>
                    {capitalize(adventure.status)}
                  </span>
                </div>

                <p className="adventure-card__description">{adventure.description}</p>

                <div className="adventure-card__meta">
                  <div className="adventure-card__meta-item">
                    <span className="meta-label">Creator:</span>
                    <span className="meta-value">{adventure.creator?.name || 'Unknown'}</span>
                  </div>

                  <div className="adventure-card__meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value" title={formatDate(adventure.created_at)}>
                      {timeAgo(adventure.created_at)}
                    </span>
                  </div>

                  <div className="adventure-card__meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">
                      {adventure.is_custom ? 'Custom' : 'Preset'}
                    </span>
                  </div>

                  <div className="adventure-card__meta-item">
                    <span className="meta-label">Encounters:</span>
                    <span className="meta-value">
                      {adventure.current_encounter_count}/{adventure.max_encounters}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showPagination && totalPages > 1 && (
        <div className="adventures-pagination">
          <button
            className="button secondary"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <span className="adventures-pagination__info">
            Page {page} of {totalPages}
          </span>

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

export default AdventureList;
