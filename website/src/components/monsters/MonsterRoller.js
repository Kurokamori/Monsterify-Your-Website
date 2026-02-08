import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import monsterRollerService from '../../services/monsterRollerService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const MonsterRoller = ({ context = 'adoption', onMonsterSelected, trainerId }) => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rolledMonster, setRolledMonster] = useState(null);
  const [rollerSettings, setRollerSettings] = useState(null);
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(trainerId || '');
  const [rollCount, setRollCount] = useState(0);
  const [maxRolls, setMaxRolls] = useState(3); // Default max rolls
  const [customRollParams, setCustomRollParams] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch monster sources
        const sources = await monsterRollerService.getMonsterSources();
        setAvailableSources(sources);
        
        // Fetch user's roller settings
        const settings = await monsterRollerService.getUserRollerSettings();
        setRollerSettings(settings);
        setSelectedSources(settings.enabledTypes || []);
        
        // Fetch user's trainers if trainerId is not provided
        if (!trainerId) {
          const trainersResponse = await trainerService.getUserTrainers();
          setUserTrainers(trainersResponse.trainers || []);
          
          if (trainersResponse.trainers && trainersResponse.trainers.length > 0) {
            setSelectedTrainer(trainersResponse.trainers[0].id);
          }
        }
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load roller data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [trainerId]);
  
  // Handle source selection
  const handleSourceToggle = (source) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };
  
  // Handle trainer selection
  const handleTrainerChange = (e) => {
    setSelectedTrainer(e.target.value);
  };
  
  // Handle advanced option change
  const handleAdvancedOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomRollParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Roll a monster
  const handleRoll = async () => {
    if (rollCount >= maxRolls) {
      setError(`You've reached the maximum number of rolls (${maxRolls}). Please adopt this monster or try again later.`);
      return;
    }
    
    if (!selectedTrainer) {
      setError('Please select a trainer.');
      return;
    }
    
    if (selectedSources.length === 0) {
      setError('Please select at least one monster source.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Build roll parameters
      const baseParams = monsterRollerService.buildDefaultRollParams(context, {
        ...rollerSettings,
        enabledTypes: selectedSources,
        userId: currentUser?.id
      });
      
      // Merge with custom params
      const rollParams = {
        ...baseParams,
        ...customRollParams,
        trainerId: parseInt(selectedTrainer)
      };
      
      // Roll the monster
      const monster = await monsterRollerService.rollMonster(rollParams);
      setRolledMonster(monster);
      setRollCount(prev => prev + 1);
      
    } catch (err) {
      console.error('Error rolling monster:', err);
      setError(err.response?.data?.message || 'Failed to roll monster. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Adopt the monster
  const handleAdopt = async () => {
    if (!rolledMonster || !selectedTrainer) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Initialize the monster for the trainer
      const initializedMonster = await monsterRollerService.initializeMonster(
        parseInt(selectedTrainer),
        rolledMonster,
        { context }
      );
      
      // Call the onMonsterSelected callback
      if (onMonsterSelected) {
        onMonsterSelected(initializedMonster);
      }
      
      // Reset the roller
      setRolledMonster(null);
      setRollCount(0);
      
    } catch (err) {
      console.error('Error adopting monster:', err);
      setError(err.response?.data?.message || 'Failed to adopt monster. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the roller
  const handleReset = () => {
    setRolledMonster(null);
    setRollCount(0);
    setError(null);
  };
  
  if (loading && !rolledMonster) {
    return <LoadingSpinner message="Loading monster roller..." />;
  }
  
  return (
    <div className="monster-roller">
      <div className="auth-header">
        <h2>Monster Roller</h2>
        <p>Roll a random monster based on your preferences.</p>
      </div>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError(null)}
        />
      )}
      
      <div className="form">
        {!rolledMonster ? (
          <div className="form">
            {/* Trainer Selection */}
            {!trainerId && userTrainers.length > 0 && (
              <div className="fandom-grid">
                <label>Select Trainer:</label>
                <select 
                  value={selectedTrainer} 
                  onChange={handleTrainerChange}
                  className="trainer-select"
                >
                  {userTrainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} (Lv. {trainer.level})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Monster Source Selection */}
            <div className="fandom-grid">
              <label>Monster Sources:</label>
              <div className="source-options">
                {availableSources.map(source => (
                  <div 
                    key={source}
                    className={`source-option${selectedSources.includes(source) ? 'selected' : ''}`}
                    onClick={() => handleSourceToggle(source)}
                  >
                    <span className="source-name">{source}</span>
                    <span className="source-status">
                      {selectedSources.includes(source) ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Advanced Options Toggle */}
            <div className="fandom-grid">
              <button 
                className="advanced-toggle"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
            </div>
            
            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div className="advanced-options">
                <div className="option-row">
                  <div className="banner-text">
                    <label>Min Types:</label>
                    <input 
                      type="number" 
                      name="minTypes"
                      min="1"
                      max="5"
                      value={customRollParams.minTypes || 1}
                      onChange={handleAdvancedOptionChange}
                    />
                  </div>
                  <div className="banner-text">
                    <label>Max Types:</label>
                    <input 
                      type="number" 
                      name="maxTypes"
                      min="1"
                      max="5"
                      value={customRollParams.maxTypes || 2}
                      onChange={handleAdvancedOptionChange}
                    />
                  </div>
                </div>
                
                <div className="option-row">
                  <div className="banner-text">
                    <label>Rarity Boost:</label>
                    <input 
                      type="number" 
                      name="rarityBoost"
                      min="0"
                      max="5"
                      value={customRollParams.rarityBoost || 0}
                      onChange={handleAdvancedOptionChange}
                    />
                  </div>
                </div>
                
                <div className="option-row">
                  <div className="banner-text checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        name="legendaryEnabled"
                        checked={customRollParams.legendaryEnabled || false}
                        onChange={handleAdvancedOptionChange}
                      />
                      Enable Legendary
                    </label>
                  </div>
                  <div className="banner-text checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        name="mythicalEnabled"
                        checked={customRollParams.mythicalEnabled || false}
                        onChange={handleAdvancedOptionChange}
                      />
                      Enable Mythical
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Roll Button */}
            <div className="roller-actions">
              <button 
                className="button primary lg"
                onClick={handleRoll}
                disabled={loading || selectedSources.length === 0 || !selectedTrainer}
              >
                {loading ? 'Rolling...' : 'Roll Monster'}
              </button>
              <div className="file-name">
                Rolls: {rollCount}/{maxRolls}
              </div>
            </div>
          </div>
        ) : (
          <div className="rolled-monster">
            <div className="npc-basic-info">
              <img
                src={rolledMonster.image_path}
                alt={rolledMonster.name}
                className="monster-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_mon.png';
                }}
              />
              <div className="monster-info">
                <h3 className="monster-name">{rolledMonster.name}</h3>
                <div className="monster-types">{rolledMonster.species}</div>
                <div className="monster-types">
                  {rolledMonster.types.map((type, index) => (
                    <span 
                      key={index} 
                      className={`type-badge type-${type.toLowerCase()}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <div className="monster-description">
                  {rolledMonster.description}
                </div>
                <div className="monster-stats">
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">HP:</span>
                      <span className="stat-value">{rolledMonster.stats.hp}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Attack:</span>
                      <span className="stat-value">{rolledMonster.stats.attack}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Defense:</span>
                      <span className="stat-value">{rolledMonster.stats.defense}</span>
                    </div>
                  </div>
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Sp. Attack:</span>
                      <span className="stat-value">{rolledMonster.stats.sp_attack}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Sp. Defense:</span>
                      <span className="stat-value">{rolledMonster.stats.sp_defense}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Speed:</span>
                      <span className="stat-value">{rolledMonster.stats.speed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="monster-actions">
              <button 
                className="button success"
                onClick={handleAdopt}
                disabled={loading}
              >
                {loading ? 'Adopting...' : 'Adopt This Monster'}
              </button>
              
              {rollCount < maxRolls && (
                <button 
                  className="button info"
                  onClick={handleRoll}
                  disabled={loading}
                >
                  {loading ? 'Rolling...' : 'Roll Again'}
                </button>
              )}
              
              <button 
                className="button secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonsterRoller;
