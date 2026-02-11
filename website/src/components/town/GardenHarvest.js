import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import townService from '../../services/townService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import RewardsDisplay from './activities/RewardsDisplay';


const GardenHarvest = () => {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gardenPoints, setGardenPoints] = useState(null);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [harvestSession, setHarvestSession] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGardenPoints();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchGardenPoints = async () => {
    try {
      setLoading(true);
      const response = await townService.getGardenPoints();

      if (response.success) {
        setGardenPoints(response.data);
      } else {
        setError(response.message || 'Failed to load garden points');
      }
    } catch (err) {
      console.error('Error fetching garden points:', err);
      setError('Failed to load garden points. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async () => {
    try {
      setHarvestLoading(true);
      setError(null);
      setShowRewards(false);

      const response = await townService.startGardenHarvest();

      if (response.success) {
        // Show rewards directly in the garden view
        setHarvestSession(response.session);
        setRewards(response.rewards || response.session.rewards || []);
        setShowRewards(true);

        // Refresh garden points
        fetchGardenPoints();
      } else {
        setError(response.message || 'Failed to harvest garden');
      }
    } catch (err) {
      console.error('Error harvesting garden:', err);
      setError(err.response?.data?.message || 'Failed to harvest garden. Please try again later.');
    } finally {
      setHarvestLoading(false);
    }
  };

  // Handle reward claimed
  const handleRewardClaimed = (rewardId, trainerId) => {
    // Update the rewards list
    setRewards(prev => prev.map(reward => {
      if (reward.id === rewardId) {
        return {
          ...reward,
          claimed: true,
          claimed_by: trainerId
        };
      }
      return reward;
    }));
  };

  // Handle all rewards claimed
  const handleAllRewardsClaimed = () => {
    // Refresh garden points
    fetchGardenPoints();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user can harvest
  const canHarvest = gardenPoints && gardenPoints.points > 0;

  return (
    <div className="garden-harvest-container">
      <div className="auth-header">
        <h2>Garden Harvest</h2>
        <p className="garden-harvest-description">
          Harvest your garden to collect berries and possibly find monsters!
        </p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="garden-points-display">
        <div className="garden-points-icon">
          <i className="fas fa-seedling"></i>
        </div>
        <div className="garden-points-info">
          <h3>Garden Points: {gardenPoints?.points || 0}</h3>
          {gardenPoints?.last_harvested && (
            <p className="last-harvested">
              Last harvested: {new Date(gardenPoints.last_harvested).toLocaleDateString()} at {new Date(gardenPoints.last_harvested).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {!showRewards && (
        <>
          <div className="garden-harvest-info">
            <h3>Harvest Rewards</h3>
            <ul className="harvest-rewards-list">
              <li>
                <i className="fas fa-check-circle"></i>
                Guaranteed 1 berry for every garden point
              </li>
              <li>
                <i className="fas fa-percentage"></i>
                40% chance per point to roll additional berries
              </li>
              <li>
                <i className="fas fa-dragon"></i>
                20% chance per point to roll a garden monster
              </li>
              <li>
                <i className="fas fa-gift"></i>
                20% chance to get 2 berries instead of 1
              </li>
              <li>
                <i className="fas fa-gift"></i>
                10% chance to get 3 berries instead of 1
              </li>
            </ul>
          </div>

          <div className="garden-harvest-actions">
            <button
              className="button success lg"
              onClick={handleHarvest}
              disabled={harvestLoading || gardenPoints?.points <= 0}
            >
              {harvestLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  Harvesting...
                </>
              ) : (
                <>
                  <i className="fas fa-hand-holding-heart"></i>
                  Harvest Garden
                </>
              )}
            </button>

            {gardenPoints?.points <= 0 && (
              <p className="no-points-message">
                {gardenPoints?.points === 0
                  ? "You don't have any garden points to harvest. Complete garden activities to earn points!"
                  : "Loading garden points..."}
              </p>
            )}
          </div>
        </>
      )}

      {showRewards && rewards.length > 0 && (
        <div className="garden-harvest-rewards">
          <RewardsDisplay
            sessionId={harvestSession?.id}
            rewards={rewards}
            onRewardClaimed={handleRewardClaimed}
            onAllRewardsClaimed={handleAllRewardsClaimed}
          />

          <div className="garden-harvest-actions">
            <button
              className="button secondary"
              onClick={() => setShowRewards(false)}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Garden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GardenHarvest;
