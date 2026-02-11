import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ActiveMissions = () => {
  const [activeMissions, setActiveMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveMissions();
  }, []);

  const fetchActiveMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/missions/user/active');
      const data = response.data;
      setActiveMissions(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'extreme': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getProgressPercentage = (current, required) => {
    return Math.min(100, Math.round((current / required) * 100));
  };

  const getProgressStatus = (currentProgress, requiredProgress) => {
    const percentage = Math.round((currentProgress / requiredProgress) * 100);
    if (percentage >= 100) {
      return 'Mission Complete!';
    }
    const remaining = requiredProgress - currentProgress;
    return `${remaining} more progress needed`;
  };

  const handleClaimRewards = async (missionId) => {
    try {
      const response = await api.post(`/missions/${missionId}/claim`);
      const data = response.data;
      if (data.success) {
        // Refresh the missions list
        fetchActiveMissions();
        alert('Rewards claimed successfully!');
      } else {
        alert(data.message || 'Failed to claim rewards');
      }
    } catch (err) {
      alert('Error claiming rewards: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="missions-container">
        <div className="loading">Loading active missions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="missions-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="missions-container">
      <div className="missions-header">
        <h2>Active Missions</h2>
        <p>Track the progress of your ongoing missions.</p>
      </div>

      {activeMissions.length === 0 ? (
        <div className="no-missions">
          <p>You don't have any active missions.</p>
          <p>Visit the Available Missions tab to start a new adventure!</p>
        </div>
      ) : (
        <div className="button">
          {activeMissions.map((mission) => {
            const progressPercentage = getProgressPercentage(mission.current_progress, mission.required_progress);
            const isCompleted = mission.status === 'completed';
            const progressStatus = getProgressStatus(mission.current_progress, mission.required_progress);

            return (
              <div key={mission.id} className={`mission-card ${isCompleted ? 'completed' : ''}`}>
                <div className="option-row">
                  <h3>{mission.title}</h3>
                  <span
                    className="badge"
                    style={{ backgroundColor: getDifficultyColor(mission.difficulty) }}
                  >
                    {mission.difficulty.toUpperCase()}
                  </span>
                </div>

                <div className="mission-description">
                  <p>{mission.description}</p>
                </div>

                <div className="mission-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{mission.current_progress} / {mission.required_progress}</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-fill primary"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">{progressPercentage}%</div>
                </div>

                <div className="mission-status">
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`status${mission.status}`}>
                      {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Progress:</span>
                    <span className="value">{progressStatus}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Started:</span>
                    <span className="value">
                      {new Date(mission.started_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isCompleted && !mission.reward_claimed && (
                  <div className="adventure-meta">
                    <button
                      className="button primary"
                      onClick={() => handleClaimRewards(mission.id)}
                    >
                      Claim Rewards
                    </button>
                  </div>
                )}

                {isCompleted && mission.reward_claimed && (
                  <div className="mission-completed">
                    <i className="fas fa-check-circle"></i>
                    <span>Rewards Claimed</span>
                  </div>
                )}

                {!isCompleted && (
                  <div className="mission-info">
                    <p>Your monsters are working hard! Progress is added when you submit art.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveMissions;
