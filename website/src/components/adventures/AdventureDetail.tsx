import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import api from '../../services/api';
import { Adventure, formatDate, capitalize } from './types';

interface AdventureDetailProps {
  adventureId: number;
}

export const AdventureDetail = ({ adventureId }: AdventureDetailProps) => {
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdventureData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/adventures/${adventureId}`);
      setAdventure(response.data.adventure);
    } catch (err) {
      console.error('Error fetching adventure data:', err);
      setError('Failed to load adventure data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [adventureId]);

  useEffect(() => {
    fetchAdventureData();
  }, [fetchAdventureData]);

  const getStatusClass = (status: string): string => {
    return `adventure-status adventure-status--${status}`;
  };

  if (loading && !adventure) {
    return <LoadingSpinner message="Loading adventure..." />;
  }

  if (error && !adventure) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchAdventureData}
      />
    );
  }

  if (!adventure) {
    return (
      <ErrorMessage
        message="Adventure not found."
        onRetry={fetchAdventureData}
      />
    );
  }

  return (
    <div className="adventure-detail">
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="adventure-detail__header">
        <div className="adventure-detail__title-row">
          <h2>{adventure.title}</h2>
          <span className={getStatusClass(adventure.status)}>
            {capitalize(adventure.status)}
          </span>
        </div>

        <p className="adventure-detail__description">{adventure.description}</p>

        <div className="adventure-detail__meta">
          <div className="adventure-detail__meta-item">
            <span className="meta-label">Created by:</span>
            <span className="meta-value">{adventure.creator?.name || 'Unknown'}</span>
          </div>

          <div className="adventure-detail__meta-item">
            <span className="meta-label">Created:</span>
            <span className="meta-value">{formatDate(adventure.created_at)}</span>
          </div>

          <div className="adventure-detail__meta-item">
            <span className="meta-label">Type:</span>
            <span className="meta-value">{adventure.is_custom ? 'Custom' : 'Preset'}</span>
          </div>

          <div className="adventure-detail__meta-item">
            <span className="meta-label">Progress:</span>
            <span className="meta-value">
              {adventure.current_encounter_count}/{adventure.max_encounters} encounters
            </span>
          </div>
        </div>

        <div className="adventure-detail__discord">
          <h3>Join the Adventure</h3>
          <p>This adventure is managed through Discord. To participate, respond to the adventure thread in the Discord server.</p>
          <div className="adventure-detail__discord-link">
            <i className="fab fa-discord"></i>
            <span>Adventure managed via Discord thread</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureDetail;
