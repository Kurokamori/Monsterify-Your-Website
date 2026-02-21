import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { extractErrorMessage } from '../../utils/errorUtils';

interface GardenHarvestProps {
  className?: string;
}

interface GardenPoints {
  points: number;
  last_harvested: string | null;
}

/**
 * GardenHarvest component for harvesting garden points
 * Shows current garden points and allows harvesting for rewards
 */
export function GardenHarvest({ className = '' }: GardenHarvestProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gardenPoints, setGardenPoints] = useState<GardenPoints | null>(null);
  const [harvestLoading, setHarvestLoading] = useState(false);

  // Fetch garden points
  const fetchGardenPoints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/garden/points');

      if (response.data.success) {
        setGardenPoints(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load garden points');
      }
    } catch (err) {
      console.error('Error fetching garden points:', err);
      setError(extractErrorMessage(err, 'Failed to load garden points.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGardenPoints();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchGardenPoints]);

  // Handle harvest — redirect to rewards page
  const handleHarvest = useCallback(async () => {
    try {
      setHarvestLoading(true);
      setError(null);

      const response = await api.post('/garden/harvest');

      if (response.data.success) {
        const sessionId = response.data.session?.id || response.data.session?.session_id;
        if (sessionId) {
          navigate(`/town/activities/rewards/${sessionId}`);
        } else {
          setError('Harvest completed but no session ID returned.');
          fetchGardenPoints();
        }
      } else {
        setError(response.data.message || 'Failed to harvest garden');
      }
    } catch (err) {
      console.error('Error harvesting:', err);
      setError(extractErrorMessage(err, 'Failed to harvest garden.'));
    } finally {
      setHarvestLoading(false);
    }
  }, [fetchGardenPoints, navigate]);

  if (loading) {
    return (
      <div className="state-container state-container--centered">
        <LoadingSpinner />
        <p className="spinner-message">Loading garden points...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`garden-harvest ${className}`.trim()}>
        <div className="page-header">
          <h2>Garden Harvest</h2>
          <p>Harvest your garden to collect berries and possibly find monsters!</p>
        </div>
        <div className="empty-state">
          <i className="fas fa-seedling"></i>
          <h3>Login Required</h3>
          <p>Please log in to access garden harvest.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`garden-harvest ${className}`.trim()}>
      <div className="page-header">
        <h2>Garden Harvest</h2>
        <p>Harvest your garden to collect berries and possibly find monsters!</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="garden-points-display">
        <div className="garden-points-icon">
          <i className="fas fa-seedling"></i>
        </div>
        <div className="garden-points-info">
          <h3>Garden Points: {gardenPoints?.points || 0}</h3>
          {gardenPoints?.last_harvested && (
            <p className="text-muted text-sm">
              Last harvested: {new Date(gardenPoints.last_harvested).toLocaleDateString()} at {new Date(gardenPoints.last_harvested).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <div className="harvest-info card-container">
        <h3>Harvest Rewards</h3>
        <ul className="harvest-rewards-list">
          <li>
            <i className="fas fa-check-circle text-success"></i>
            <span>Guaranteed 1 berry for every garden point</span>
          </li>
          <li>
            <i className="fas fa-percentage text-info"></i>
            <span>40% chance per point to roll additional berries</span>
          </li>
          <li>
            <i className="fas fa-dragon text-warning"></i>
            <span>20% chance per point to roll a garden monster</span>
          </li>
          <li>
            <i className="fas fa-gift text-accent"></i>
            <span>20% chance to get 2 berries instead of 1</span>
          </li>
          <li>
            <i className="fas fa-gift text-accent"></i>
            <span>10% chance to get 3 berries instead of 1</span>
          </li>
        </ul>
      </div>

      <div className="action-button-group action-button-group--align-center action-button-group--gap-md">
        <button
          className="button success lg no-flex"
          onClick={handleHarvest}
          disabled={harvestLoading || !gardenPoints || gardenPoints.points <= 0}
        >
          {harvestLoading ? (
            <><LoadingSpinner /> Harvesting...</>
          ) : (
            <><i className="fas fa-hand-holding-heart"></i> Harvest Garden</>
          )}
        </button>
      </div>

      {gardenPoints && gardenPoints.points <= 0 && (
        <div className="empty-state">
          <i className="fas fa-seedling"></i>
          <p>You don't have any garden points to harvest. Complete garden activities to earn points!</p>
        </div>
      )}
    </div>
  );
}

export default GardenHarvest;
