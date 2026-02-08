import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const MissionStart = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [eligibleMonsters, setEligibleMonsters] = useState([]);
  const [selectedMonsters, setSelectedMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchMissionDetails();
    fetchEligibleMonsters();
  }, [missionId]);

  const fetchMissionDetails = async () => {
    try {
      const response = await api.get(`/missions/${missionId}`);
      const data = response.data;
      setMission(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchEligibleMonsters = async () => {
    try {
      const response = await api.get(`/missions/${missionId}/eligible-monsters`);
      const data = response.data;
      // Filter monsters to only include those with valid images
      const monstersWithImages = (data.data || []).filter(monster =>
        monster.img_link &&
        monster.img_link !== '' &&
        monster.img_link !== 'null' &&
        monster.img_link !== null
      );
      setEligibleMonsters(monstersWithImages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonsterSelect = (monster) => {
    if (selectedMonsters.find(m => m.id === monster.id)) {
      // Deselect monster
      setSelectedMonsters(selectedMonsters.filter(m => m.id !== monster.id));
    } else {
      // Select monster (if under limit)
      if (selectedMonsters.length < (mission?.max_monsters || 3)) {
        setSelectedMonsters([...selectedMonsters, monster]);
      }
    }
  };

  const handleStartMission = async () => {
    if (selectedMonsters.length === 0) {
      alert('Please select at least one monster for the mission.');
      return;
    }

    try {
      setStarting(true);
      const response = await api.post(`/missions/${missionId}/start`, {
        monsterIds: selectedMonsters.map(m => m.id)
      });

      const data = response.data;
      if (data.success) {
        alert('Mission started successfully!');
        navigate('/adventures/missions/active');
      } else {
        alert(data.message || 'Failed to start mission');
      }
    } catch (err) {
      alert('Error starting mission: ' + err.message);
    } finally {
      setStarting(false);
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'extreme': return '#9C27B0';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="mission-start-container">
        <div className="loading">Loading mission details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mission-start-container">
        <div className="error">Error: {error}</div>
        <button className="button secondary" onClick={() => navigate('/adventures/missions/available')}>
          Back to Available Missions
        </button>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="mission-start-container">
        <div className="error">Mission not found</div>
        <button className="button secondary" onClick={() => navigate('/adventures/missions/available')}>
          Back to Available Missions
        </button>
      </div>
    );
  }

  const requirements = parseRequirements(mission.requirements);

  return (
    <div className="mission-start-container">
      <div className="mission-start-header">
        <button 
          className="button secondary"
          onClick={() => navigate('/adventures/missions/available')}
        >
          ← Back to Available Missions
        </button>
        <h2>Start Mission: {mission.title}</h2>
      </div>

      <div className="mission-details-card">
        <div className="option-row">
          <h3>{mission.title}</h3>
          <span 
            className="status-badge"
            style={{ backgroundColor: getDifficultyColor(mission.difficulty) }}
          >
            {mission.difficulty.toUpperCase()}
          </span>
        </div>
        <p>{mission.description}</p>
        
        <div className="mission-info">
          <div className="info-item">
            <strong>Duration:</strong> {mission.duration} submissions needed
          </div>
          <div className="info-item">
            <strong>Max Monsters:</strong> {mission.max_monsters}
          </div>
          {mission.min_level > 1 && (
            <div className="info-item">
              <strong>Min Level:</strong> {mission.min_level}
            </div>
          )}
        </div>

        {(requirements.types || requirements.attributes) && (
          <div className="requirements-section">
            <h4>Requirements:</h4>
            {requirements.types && (
              <div>
                <strong>Types:</strong> {requirements.types.join(', ')}
              </div>
            )}
            {requirements.attributes && (
              <div>
                <strong>Attributes:</strong> {requirements.attributes.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="monster-selection">
        <h3>Select Monsters ({selectedMonsters.length}/{mission.max_monsters})</h3>
        
        {eligibleMonsters.length === 0 ? (
          <div className="no-results">
            <p>No eligible monsters found for this mission.</p>
            <p>Make sure you have monsters that meet the requirements.</p>
          </div>
        ) : (
          <div className="button">
            {eligibleMonsters.map((monster) => {
              const isSelected = selectedMonsters.find(m => m.id === monster.id);
              const canSelect = selectedMonsters.length < mission.max_monsters;

              return (
                <div 
                  key={monster.id}
                  className={`monster-card ${isSelected ? 'selected' : ''}${!canSelect && !isSelected ? 'disabled' : ''}`}
                  onClick={() => handleMonsterSelect(monster)}
                >
                  <img
                    src={monster.img_link || '/placeholder-monster.png'}
                    alt={monster.name}
                    className="monster-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-monster.png';
                    }}
                  />
                  <div className="monster-info">
                    <h4>{monster.name}</h4>
                    <p>Level {monster.level}</p>
                    <p>Trainer: {monster.trainer_name}</p>
                    {monster.type_primary && (
                      <div className="monster-types">
                        <span className="type-tag">{monster.type_primary}</span>
                        {monster.type_secondary && (
                          <span className="type-tag">{monster.type_secondary}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="selected-indicator">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {eligibleMonsters.length > 0 && (
        <div className="adventure-meta">
          <button
            className="button primary"
            onClick={handleStartMission}
            disabled={selectedMonsters.length === 0 || starting}
          >
            {starting ? 'Starting Mission...' : 'Start Mission'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MissionStart;
