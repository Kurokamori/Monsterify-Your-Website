import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
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

    const entity = selectedEntityType === 'trainer' 
      ? userTrainers.find(t => t.id === parseInt(selectedEntityId))
      : userMonsters.find(m => m.id === parseInt(selectedEntityId));

    if (!entity) return;

    const newAllocation = {
      id: Date.now(),
      type: selectedEntityType,
      entityId: parseInt(selectedEntityId),
      entityName: entity.name,
      levels: allocationLevels
    };

    setLevelAllocations([...levelAllocations, newAllocation]);
    setAvailableLevels(availableLevels - allocationLevels);
    
    // Reset form
    setSelectedEntityId('');
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
        <h2>Gift {submissionType === 'art' ? 'Art' : 'Writing'} Rewards</h2>
        <p>
          You gave {giftLevels} levels as gift {submissionType}! Here are your rewards:
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
            {levelAllocations.map((allocation) => (
              <div key={allocation.id} className="allocation-item">
                <span className="allocation-info">
                  <i className={allocation.type === 'trainer' ? 'fas fa-user' : 'fas fa-dragon'}></i>
                  {allocation.entityName} - {allocation.levels} levels
                </span>
                <button
                  type="button"
                  className="remove-allocation"
                  onClick={() => handleRemoveAllocation(allocation.id)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
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
                    }}
                    className="entity-type-select"
                  >
                    <option value="trainer">Trainer</option>
                    <option value="monster">Monster</option>
                  </select>
                </div>
                <div className="form-row">
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="entity-select"
                  >
                    <option value="">
                      Select {selectedEntityType === 'trainer' ? 'Trainer' : 'Monster'}
                    </option>
                    {(selectedEntityType === 'trainer' ? userTrainers : userMonsters).map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
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
                    disabled={!selectedEntityId || allocationLevels < 1 || allocationLevels > availableLevels}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddAllocation(false);
                      setSelectedEntityId('');
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
                      <select
                        value={itemAssignments[index] || ''}
                        onChange={(e) => handleItemAssignment(index, e.target.value)}
                        className="trainer-select"
                      >
                        <option value="">Select Trainer</option>
                        {userTrainers.map((trainer) => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </option>
                        ))}
                      </select>
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
              <div key={index} className="monster-card">
                <div className="monster-info">
                  <div className="monster-species">
                    <strong>Species:</strong>
                    <div className="species-list">
                      {monster.species1 && <span className="species">{monster.species1}</span>}
                      {monster.species2 && <span className="species">{monster.species2}</span>}
                    </div>
                  </div>
                  <div className="monster-types">
                    <strong>Types:</strong>
                    <div className="types-list">
                      {monster.type1 && <span className="type">{monster.type1}</span>}
                      {monster.type2 && <span className="type">{monster.type2}</span>}
                      {monster.type3 && <span className="type">{monster.type3}</span>}
                    </div>
                  </div>
                  {monster.attribute && (
                    <div className="monster-attribute">
                      <strong>Attribute:</strong> {monster.attribute}
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
                    <label>Assign to Trainer:</label>
                    <select
                      value={monsterAssignments[index] || ''}
                      onChange={(e) => handleMonsterAssignment(index, e.target.value)}
                      className="trainer-select"
                    >
                      <option value="">Select Trainer</option>
                      {userTrainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>
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
