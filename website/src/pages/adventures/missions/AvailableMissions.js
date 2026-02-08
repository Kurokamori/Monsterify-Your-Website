import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const AvailableMissions = () => {
  const [missions, setMissions] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [hasActiveMission, setHasActiveMission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableMissions();
  }, [selectedDifficulty]);

  const fetchAvailableMissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDifficulty !== 'all') {
        params.append('difficulty', selectedDifficulty);
      }

      const response = await api.get(`/missions/user/available?${params}`);
      const data = response.data;
      setMissions(data.data || []);
      setHasActiveMission(data.hasActiveMission || false);
      setActiveMissions(data.activeMissions || []);
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

  const parseRequirements = (requirements) => {
    if (!requirements) return {};
    if (typeof requirements === 'object') return requirements;
    try {
      return JSON.parse(requirements);
    } catch {
      return {};
    }
  };

  const handleStartMission = (missionId) => {
    navigate(`/adventures/missions/${missionId}/start`);
  };

  if (loading) {
    return (
      <div className="missions-container">
        <div className="loading">Loading available missions...</div>
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
        <h2>Available Missions</h2>
        <p>Choose a mission to send your monsters on an adventure!</p>
      </div>

      {/* Show active missions if user has any */}
      {hasActiveMission && activeMissions.length > 0 && (
        <div className="active-missions-section">
          <h3>Your Active Mission</h3>
          <div className="button">
            {activeMissions.map((mission) => (
              <div key={mission.id} className="mission-card active-mission">
                <div className="option-row">
                  <h3>{mission.title}</h3>
                  <span className="status-badge active">
                    ACTIVE
                  </span>
                </div>
                <div className="mission-description">
                  <p>{mission.description}</p>
                </div>
                <div className="mission-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (mission.current_progress / mission.required_progress) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    Progress: {mission.current_progress}/{mission.required_progress}
                  </p>
                </div>
                <div className="adventure-meta">
                  <button
                    className="button secondary"
                    onClick={() => navigate('/adventures/missions/active')}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="active-mission-note">
            You must complete or abandon your current mission before starting a new one.
          </p>
        </div>
      )}

      {/* Show available missions only if user doesn't have active missions */}
      {!hasActiveMission && (
        <>
          <div className="missions-filters">
            <label htmlFor="difficulty-filter">Filter by Difficulty:</label>
            <select
              id="difficulty-filter"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>

          {missions.length === 0 ? (
            <div className="no-missions">
              <p>No missions available at the moment.</p>
              <p>Check back later for new adventures!</p>
            </div>
          ) : (
            <div className="button">
          {missions.map((mission) => {
            const requirements = parseRequirements(mission.requirements);
            const rewardConfig = parseRequirements(mission.reward_config);

            return (
              <div
                key={mission.id}
                className="mission-card"
                onClick={() => handleStartMission(mission.id)}
              >
                <div className="option-row">
                  <h3>{mission.title}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getDifficultyColor(mission.difficulty) }}
                  >
                    {mission.difficulty.toUpperCase()}
                  </span>
                </div>

                <div className="mission-description">
                  <p>{mission.description}</p>
                </div>

                <div className="adopts-grid">
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span className="value">{mission.duration} submissions</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Max Monsters:</span>
                    <span className="value">{mission.max_monsters}</span>
                  </div>
                  {mission.min_level > 1 && (
                    <div className="detail-row">
                      <span className="label">Min Level:</span>
                      <span className="value">{mission.min_level}</span>
                    </div>
                  )}
                </div>

                {requirements.types && requirements.types.length > 0 && (
                  <div className="mission-requirements">
                    <h4>Type Requirements:</h4>
                    <div className="type-tags">
                      {requirements.types.map((type, index) => (
                        <span key={index} className="type-tag">{type}</span>
                      ))}
                    </div>
                  </div>
                )}

                {requirements.attributes && requirements.attributes.length > 0 && (
                  <div className="mission-requirements">
                    <h4>Attribute Requirements:</h4>
                    <div className="type-tags">
                      {requirements.attributes.map((attr, index) => (
                        <span key={index} className="attribute-tag">{attr}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mission-rewards">
                  <h4>Potential Rewards:</h4>
                  <div className="reward-list">
                    {rewardConfig.levels && (
                      <div className="reward-item">
                        <i className="fas fa-arrow-up"></i>
                        {rewardConfig.levels.min}-{rewardConfig.levels.max} Levels
                      </div>
                    )}
                    {rewardConfig.coins && (
                      <div className="reward-item">
                        <i className="fas fa-coins"></i>
                        {rewardConfig.coins.min}-{rewardConfig.coins.max} Coins
                      </div>
                    )}
                    {rewardConfig.items && (
                      <div className="reward-item">
                        <i className="fas fa-gift"></i>
                        {rewardConfig.items.min}-{rewardConfig.items.max} Items
                      </div>
                    )}
                    {rewardConfig.monsters && (
                      <div className="reward-item">
                        <i className="fas fa-paw"></i>
                        {rewardConfig.monsters.count} Monster(s)
                      </div>
                    )}
                  </div>
                </div>

                <div className="adventure-meta">
                  <button
                    className="button primary"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleStartMission(mission.id);
                    }}
                  >
                    Start Mission
                  </button>
                </div>
              </div>
            );
          })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailableMissions;
