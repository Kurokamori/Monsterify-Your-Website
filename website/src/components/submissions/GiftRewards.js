import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import MonsterAutocomplete from '../common/MonsterAutocomplete';
import api from '../../services/api';


const GiftRewards = ({
  giftLevels,
  userTrainers,
  userMonsters,
  onComplete,
  onCancel,
  submissionType = 'art' // 'art' or 'writing'
}) => {
  const { currentUser } = useAuth();
  
  // State for level distribution
  const [availableLevels, setAvailableLevels] = useState(Math.floor(giftLevels / 2));
  const [levelAllocations, setLevelAllocations] = useState([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  
  // State for item rewards
  const [itemRewards, setItemRewards] = useState([]);
  const [itemAssignments, setItemAssignments] = useState({});
  
  // State for monster rewards
  const [monsterRewards, setMonsterRewards] = useState([]);
  const [monsterAssignments, setMonsterAssignments] = useState({});
  const [monsterNames, setMonsterNames] = useState({});
  
  // State for adding new allocations
  const [selectedEntityType, setSelectedEntityType] = useState('trainer');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState(''); // For monster selection
  const [allocationLevels, setAllocationLevels] = useState(1);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingRewards, setGeneratingRewards] = useState(false);

  // Calculate reward counts
  const itemRewardCount = Math.floor(giftLevels / 5);
  const monsterRewardCount = Math.floor(giftLevels / 10);

  // Generate item and monster rewards on component mount
  useEffect(() => {
    generateRewards();
  }, [giftLevels]);

  const generateRewards = async () => {
    try {
      setGeneratingRewards(true);
      setError(null);

      // Generate item rewards
      if (itemRewardCount > 0) {
        const itemResponse = await api.post('/submissions/gift-rewards/items', {
          count: itemRewardCount
        });
        setItemRewards(itemResponse.data.items || []);
        
        // Initialize item assignments
        const initialItemAssignments = {};
        itemResponse.data.items?.forEach((item, index) => {
          initialItemAssignments[index] = '';
        });
        setItemAssignments(initialItemAssignments);
      }

      // Generate monster rewards
      if (monsterRewardCount > 0) {
        const monsterResponse = await api.post('/submissions/gift-rewards/monsters', {
          count: monsterRewardCount
        });
        setMonsterRewards(monsterResponse.data.monsters || []);
        
        // Initialize monster assignments and names
        const initialMonsterAssignments = {};
        const initialMonsterNames = {};
        monsterResponse.data.monsters?.forEach((monster, index) => {
          initialMonsterAssignments[index] = '';
          initialMonsterNames[index] = monster.name || '';
        });
        setMonsterAssignments(initialMonsterAssignments);
        setMonsterNames(initialMonsterNames);
      }

    } catch (err) {
      console.error('Error generating gift rewards:', err);
      setError('Failed to generate gift rewards. Please try again.');
    } finally {
      setGeneratingRewards(false);
    }
  };

  const handleAddAllocation = () => {
    if (!selectedEntityId || allocationLevels < 1 || allocationLevels > availableLevels) {
      return;
    }

    // For monster allocations, ensure trainer is selected
    if (selectedEntityType === 'monster' && !selectedTrainerId) {
      return;
    }

    const entity = selectedEntityType === 'trainer' 
      ? userTrainers.find(t => t.id === parseInt(selectedEntityId))
      : userMonsters.find(m => m.id === parseInt(selectedEntityId));

    if (!entity) return;

    const newAllocation = {
      id: Date.now(),
      type: selectedEntityType,
      entityId: parseInt(selectedEntityId),
      entityName: entity.name,
      levels: allocationLevels,
      trainerId: selectedEntityType === 'monster' ? parseInt(selectedTrainerId) : null
    };

    setLevelAllocations([...levelAllocations, newAllocation]);
    setAvailableLevels(availableLevels - allocationLevels);
    
    // Reset form
    setSelectedEntityId('');
    setSelectedTrainerId('');
    setAllocationLevels(1);
    setShowAddAllocation(false);
  };

  const handleRemoveAllocation = (allocationId) => {
    const allocation = levelAllocations.find(a => a.id === allocationId);
    if (allocation) {
      setLevelAllocations(levelAllocations.filter(a => a.id !== allocationId));
      setAvailableLevels(availableLevels + allocation.levels);
    }
  };

  const handleItemAssignment = (itemIndex, trainerId) => {
    setItemAssignments({
      ...itemAssignments,
      [itemIndex]: trainerId
    });
  };

  const handleMonsterAssignment = (monsterIndex, trainerId) => {
    setMonsterAssignments({
      ...monsterAssignments,
      [monsterIndex]: trainerId
    });
  };

  const handleMonsterNameChange = (monsterIndex, name) => {
    setMonsterNames({
      ...monsterNames,
      [monsterIndex]: name
    });
  };

  // Helper function to get type color (same as MonsterCard)
  const getTypeColor = (type) => {
    const typeColors = {
      // Pokemon types
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',

      // Digimon attributes
      vaccine: '#5CB3FF',
      data: '#98FB98',
      virus: '#FF6961',
      free: '#D3D3D3',

      // Default color
      default: '#888888'
    };

    return typeColors[type?.toLowerCase()] || typeColors.default;
  };

  const validateAssignments = () => {
    // Check that all items are assigned
    for (let i = 0; i < itemRewards.length; i++) {
      if (!itemAssignments[i]) {
        return 'Please assign all items to trainers.';
      }
    }

    // Check that all monsters are assigned and named
    for (let i = 0; i < monsterRewards.length; i++) {
      if (!monsterAssignments[i]) {
        return 'Please assign all monsters to trainers.';
      }
      if (!monsterNames[i] || monsterNames[i].trim() === '') {
        return 'Please name all monsters.';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate assignments
      const validationError = validateAssignments();
      if (validationError) {
        setError(validationError);
        return;
      }

      // Prepare submission data
      const submissionData = {
        levelAllocations,
        itemAssignments: itemRewards.map((item, index) => ({
          item,
          trainerId: parseInt(itemAssignments[index])
        })),
        monsterAssignments: monsterRewards.map((monster, index) => ({
          monster,
          trainerId: parseInt(monsterAssignments[index]),
          name: monsterNames[index].trim()
        }))
      };

      // Submit gift rewards
      const response = await api.post('/submissions/gift-rewards/finalize', submissionData);

      if (response.data.success) {
        onComplete(response.data);
      }

    } catch (err) {
      console.error('Error submitting gift rewards:', err);
      setError(err.response?.data?.message || 'Failed to submit gift rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (generatingRewards) {
    return (
      <div className="gift-rewards-container">
        <div className="gift-rewards-header">
          <h2>Generating Gift Rewards...</h2>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="gift-rewards-container">
      <div className="gift-rewards-header">
        <h2>Gift {submissionType === 'art' ? 'Art' : submissionType === 'reference' ? 'Reference' : 'Writing'} Rewards</h2>
        <p>
          You gave {giftLevels} levels as gift {submissionType === 'reference' ? 'references' : submissionType}! Here are your rewards:
        </p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Level Distribution Section */}
      <div className="reward-section">
        <h3>
          <i className="fas fa-star"></i>
          Level Distribution
        </h3>
        <p>
          You can distribute {Math.floor(giftLevels / 2)} levels among your trainers and monsters.
          <br />
          <strong>Available levels: {availableLevels}</strong>
        </p>

        {levelAllocations.length > 0 && (
          <div className="allocations-list">
            {levelAllocations.map((allocation) => {
              const trainerName = allocation.type === 'monster' && allocation.trainerId
                ? userTrainers.find(t => t.id === allocation.trainerId)?.name
                : null;
              
              return (
                <div key={allocation.id} className="allocation-item">
                  <span className="allocation-info">
                    <i className={allocation.type === 'trainer' ? 'fas fa-user' : 'fas fa-dragon'}></i>
                    {allocation.entityName}
                    {trainerName && ` (${trainerName})`} - {allocation.levels} levels
                  </span>
                  <button
                    type="button"
                    className="remove-allocation"
                    onClick={() => handleRemoveAllocation(allocation.id)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {availableLevels > 0 && (
          <div className="add-allocation-section">
            {!showAddAllocation ? (
              <button
                type="button"
                className="add-allocation-btn"
                onClick={() => setShowAddAllocation(true)}
              >
                <i className="fas fa-plus"></i>
                Add Level Allocation
              </button>
            ) : (
              <div className="add-allocation-form">
                <div className="form-row">
                  <select
                    value={selectedEntityType}
                    onChange={(e) => {
                      setSelectedEntityType(e.target.value);
                      setSelectedEntityId('');
                      setSelectedTrainerId('');
                    }}
                    className="entity-type-select"
                  >
                    <option value="trainer">Trainer</option>
                    <option value="monster">Monster</option>
                  </select>
                </div>
                
                {/* For monster selection, show trainer selection first */}
                {selectedEntityType === 'monster' && (
                  <div className="form-row">
                    <TrainerAutocomplete
                      trainers={userTrainers}
                      selectedTrainerId={selectedTrainerId}
                      onSelect={(id) => {
                        setSelectedTrainerId(id);
                        setSelectedEntityId(''); // Reset monster selection when trainer changes
                      }}
                      label="Select Trainer First"
                      placeholder="Type to search trainers..."
                      className="trainer-select"
                    />
                  </div>
                )}

                <div className="form-row">
                  {selectedEntityType === 'trainer' ? (
                    <TrainerAutocomplete
                      trainers={userTrainers}
                      selectedTrainerId={selectedEntityId}
                      onSelect={(id) => setSelectedEntityId(id)}
                      label="Select Trainer"
                      placeholder="Type to search trainers..."
                      className="entity-select"
                    />
                  ) : (
                    <MonsterAutocomplete
                      monsters={selectedTrainerId ? userMonsters.filter(monster => monster.trainer_id === parseInt(selectedTrainerId)) : []}
                      selectedMonsterId={selectedEntityId}
                      onSelect={(id) => setSelectedEntityId(id)}
                      label="Select Monster"
                      placeholder={!selectedTrainerId ? 'Select Trainer First' : 'Type to search monsters...'}
                      disabled={!selectedTrainerId}
                      className="entity-select"
                    />
                  )}
                </div>
                <div className="form-row">
                  <input
                    type="number"
                    min="1"
                    max={availableLevels}
                    value={allocationLevels}
                    onChange={(e) => setAllocationLevels(parseInt(e.target.value) || 1)}
                    className="levels-input"
                    placeholder="Levels"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="add-btn"
                    onClick={handleAddAllocation}
                    disabled={
                      !selectedEntityId || 
                      allocationLevels < 1 || 
                      allocationLevels > availableLevels ||
                      (selectedEntityType === 'monster' && !selectedTrainerId)
                    }
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddAllocation(false);
                      setSelectedEntityId('');
                      setSelectedTrainerId('');
                      setAllocationLevels(1);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Rewards Section */}
      {itemRewards.length > 0 && (
        <div className="reward-section">
          <h3>
            <i className="fas fa-gift"></i>
            Item Rewards ({itemRewards.length} items)
          </h3>
          <p>Assign each item to one of your trainers:</p>

          <div className="items-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Assign to Trainer</th>
                </tr>
              </thead>
              <tbody>
                {itemRewards.map((item, index) => (
                  <tr key={index}>
                    <td className="item-name">
                      <i className="fas fa-cube"></i>
                      {item.name}
                    </td>
                    <td className="item-category">{item.category}</td>
                    <td>
                      <TrainerAutocomplete
                        trainers={userTrainers}
                        selectedTrainerId={itemAssignments[index] || ''}
                        onSelect={(id) => handleItemAssignment(index, id)}
                        label=""
                        placeholder="Select Trainer..."
                        className="trainer-select"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monster Rewards Section */}
      {monsterRewards.length > 0 && (
        <div className="reward-section">
          <h3>
            <i className="fas fa-dragon"></i>
            Monster Rewards ({monsterRewards.length} monsters)
          </h3>
          <p>Name each monster and assign them to one of your trainers:</p>

          <div className="monsters-grid">
            {monsterRewards.map((monster, index) => (
              <div key={index} className="gift-monster-card">
                <div className="gift-monster-card-header">
                  <h3 className="gift-monster-name">
                    {monster.name || monster.species1 || 'Mystery Monster'}
                  </h3>
                </div>

                <div className="gift-monster-card-image">
                  <img
                    src={monster.image_url || '/images/default_mon.png'}
                    alt={monster.name || monster.species1}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                </div>

                <div className="gift-monster-card-info">
                  {/* Species with reference images */}
                  <div className="gift-monster-species">
                    {monster.species1 && (
                      <div className="species-with-image">
                        <img
                          src={`/images/species/${monster.species1.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`}
                          alt={monster.species1}
                          className="species-reference-image"
                          onError={(e) => {
                            console.log(`Failed to load species1 image: ${e.target.src}`);
                            e.target.src = '/images/default_species.png';
                          }}
                        />
                        <span className="species-name">{monster.species1}</span>
                      </div>
                    )}
                    {monster.species2 && (
                      <>
                        <span className="species-separator"> / </span>
                        <div className="species-with-image">
                          <img
                            src={`/content/static/images/species/${monster.species2.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`}
                            alt={monster.species2}
                            className="species-reference-image"
                            onError={(e) => {
                              console.log(`Failed to load species2 image: ${e.target.src}`);
                              e.target.src = '/content/static/images/default_species.png';
                            }}
                          />
                          <span className="species-name">{monster.species2}</span>
                        </div>
                      </>
                    )}
                    {monster.species3 && (
                      <>
                        <span className="species-separator"> / </span>
                        <div className="species-with-image">
                          <img
                            src={`/content/static/images/species/${monster.species3.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`}
                            alt={monster.species3}
                            className="species-reference-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span className="species-name">{monster.species3}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Types with proper colors */}
                  <div className="gift-monster-types">
                    {monster.type1 && (
                      <span
                        className="monster-type"
                        style={{ backgroundColor: getTypeColor(monster.type1) }}
                      >
                        {monster.type1}
                      </span>
                    )}
                    {monster.type2 && (
                      <span
                        className="monster-type"
                        style={{ backgroundColor: getTypeColor(monster.type2) }}
                      >
                        {monster.type2}
                      </span>
                    )}
                    {monster.type3 && (
                      <span
                        className="monster-type"
                        style={{ backgroundColor: getTypeColor(monster.type3) }}
                      >
                        {monster.type3}
                      </span>
                    )}
                  </div>

                  {monster.attribute && (
                    <div className="gift-monster-attribute" style={{ color: getTypeColor(monster.attribute.toLowerCase()) }}>
                      {monster.attribute}
                    </div>
                  )}
                </div>

                <div className="monster-assignment">
                  <div className="form-group">
                    <label>Monster Name:</label>
                    <input
                      type="text"
                      value={monsterNames[index] || ''}
                      onChange={(e) => handleMonsterNameChange(index, e.target.value)}
                      className="monster-name-input"
                      placeholder="Enter monster name"
                    />
                  </div>

                  <div className="form-group">
                    <TrainerAutocomplete
                      trainers={userTrainers}
                      selectedTrainerId={monsterAssignments[index] || ''}
                      onSelect={(id) => handleMonsterAssignment(index, id)}
                      label="Assign to Trainer"
                      placeholder="Select Trainer..."
                      className="trainer-select"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="gift-rewards-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit}
          disabled={loading || availableLevels > 0}
        >
          {loading ? (
            <>
              <LoadingSpinner size="small" />
              Submitting...
            </>
          ) : (
            'Submit Gift Rewards'
          )}
        </button>
      </div>

      {availableLevels > 0 && (
        <div className="warning-message">
          <i className="fas fa-exclamation-triangle"></i>
          You still have {availableLevels} levels to distribute.
        </div>
      )}
    </div>
  );
};

export default GiftRewards;
