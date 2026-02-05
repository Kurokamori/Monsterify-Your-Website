import React, { useState, useEffect } from 'react';
import adventureService from '../../services/adventureService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const AdventureTeamSelector = ({ adventureId, trainerId, onTeamUpdate, onCancel }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [currentTeam, setCurrentTeam] = useState([]);
  const [selectedMonsters, setSelectedMonsters] = useState([]);
  const [maxTeamSize, setMaxTeamSize] = useState(6);
  
  // Fetch trainer's monsters and current team
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch trainer's monsters
        const monstersResponse = await trainerService.getTrainerMonsters(trainerId);
        setTrainerMonsters(monstersResponse.monsters || []);
        
        // Fetch current adventure team
        const teamResponse = await adventureService.getAdventureTeam(adventureId, trainerId);
        setCurrentTeam(teamResponse.team || []);
        setSelectedMonsters(teamResponse.team?.map(monster => monster.id) || []);
        
        // Set max team size (could be fetched from adventure settings)
        setMaxTeamSize(teamResponse.max_team_size || 6);
        
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (adventureId && trainerId) {
      fetchData();
    }
  }, [adventureId, trainerId]);
  
  // Handle monster selection
  const handleMonsterSelect = (monsterId) => {
    setSelectedMonsters(prev => {
      // If already selected, remove from selection
      if (prev.includes(monsterId)) {
        return prev.filter(id => id !== monsterId);
      }
      
      // If not selected and team is not full, add to selection
      if (prev.length < maxTeamSize) {
        return [...prev, monsterId];
      }
      
      return prev;
    });
  };
  
  // Handle save team
  const handleSaveTeam = () => {
    if (onTeamUpdate) {
      onTeamUpdate(selectedMonsters);
    }
  };
  
  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading team data..." />;
  }
  
  // Render error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Fallback data for development
  const fallbackMonsters = [
    {
      id: 1,
      name: 'Leafeon',
      species: 'Leafeon',
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Leafeon',
      level: 25,
      types: ['Grass'],
      stats: {
        hp: 65,
        attack: 110,
        defense: 130,
        sp_attack: 60,
        sp_defense: 65,
        speed: 95
      }
    },
    {
      id: 2,
      name: 'Flameon',
      species: 'Flameon',
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Flameon',
      level: 27,
      types: ['Fire'],
      stats: {
        hp: 65,
        attack: 130,
        defense: 60,
        sp_attack: 95,
        sp_defense: 110,
        speed: 65
      }
    },
    {
      id: 3,
      name: 'Aqueon',
      species: 'Aqueon',
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Aqueon',
      level: 26,
      types: ['Water'],
      stats: {
        hp: 130,
        attack: 65,
        defense: 60,
        sp_attack: 110,
        sp_defense: 95,
        speed: 65
      }
    },
    {
      id: 4,
      name: 'Zappeon',
      species: 'Zappeon',
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Zappeon',
      level: 24,
      types: ['Electric'],
      stats: {
        hp: 65,
        attack: 65,
        defense: 60,
        sp_attack: 110,
        sp_defense: 95,
        speed: 130
      }
    }
  ];
  
  const displayMonsters = trainerMonsters.length > 0 ? trainerMonsters : fallbackMonsters;
  
  return (
    <div className="team-selector-container">
      <div className="team-selector-header">
        <h3>Select Your Adventure Team</h3>
        <p className="team-count">
          Selected: {selectedMonsters.length}/{maxTeamSize}
        </p>
      </div>
      
      <div className="monsters-grid">
        {displayMonsters.map(monster => (
          <div 
            key={monster.id} 
            className={`monster-card ${selectedMonsters.includes(monster.id) ? 'selected' : ''}`}
            onClick={() => handleMonsterSelect(monster.id)}
          >
            <div className="monster-image-container">
              <img
                src={monster.image_path}
                alt={monster.name}
                className="monster-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_mon.png';
                }}
              />
              {selectedMonsters.includes(monster.id) && (
                <div className="selected-badge">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </div>
            
            <div className="monster-info">
              <h4 className="monster-name">{monster.name}</h4>
              <div className="monster-details">
                <span className="monster-species">{monster.species1}</span>
                <span className="monster-species">{monster.species2}</span>
                <span className="monster-species">{monster.species3}</span>
                <span className="monster-level">Lv. {monster.level}</span>
              </div>
              
              <div className="monster-types">
                {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean).map((type, index) => (
                  <span 
                    key={index} 
                    className={`type-badge type-${type.toLowerCase()}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
              
              <div className="monster-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">HP</span>
                    <span className="stat-value">{monster.stats.hp}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">ATK</span>
                    <span className="stat-value">{monster.stats.attack}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">DEF</span>
                    <span className="stat-value">{monster.stats.defense}</span>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">SP.A</span>
                    <span className="stat-value">{monster.stats.sp_attack}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">SP.D</span>
                    <span className="stat-value">{monster.stats.sp_defense}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">SPD</span>
                    <span className="stat-value">{monster.stats.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="team-selector-actions">
        <button 
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          className="button button-primary"
          onClick={handleSaveTeam}
          disabled={selectedMonsters.length === 0}
        >
          Save Team
        </button>
      </div>
    </div>
  );
};

export default AdventureTeamSelector;
