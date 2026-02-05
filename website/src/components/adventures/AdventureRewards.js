import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';

const AdventureRewards = () => {
  const { currentUser } = useAuth();
  
  // State for unclaimed rewards
  const [unclaimedRewards, setUnclaimedRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showClaimInterface, setShowClaimInterface] = useState(false);
  
  // State for level distribution
  const [availableLevels, setAvailableLevels] = useState(0);
  const [levelAllocations, setLevelAllocations] = useState([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);

  // State for coin allocation
  const [availableCoins, setAvailableCoins] = useState(0);
  const [coinAllocations, setCoinAllocations] = useState([]);
  const [showAddCoinAllocation, setShowAddCoinAllocation] = useState(false);

  // State for item assignments
  const [itemAssignments, setItemAssignments] = useState({});
  
  // State for adding new allocations
  const [selectedEntityType, setSelectedEntityType] = useState('trainer');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState(''); // For monster selection
  const [allocationLevels, setAllocationLevels] = useState(1);
  const [allocationCoins, setAllocationCoins] = useState(1);
  
  // User data
  const [userTrainers, setUserTrainers] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);

  // Load unclaimed rewards on component mount
  useEffect(() => {
    loadUnclaimedRewards();
    loadUserData();
  }, [currentUser]);

  const loadUnclaimedRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's Discord user ID (this would need to be implemented)
      const discordUserId = await getDiscordUserId();
      if (!discordUserId) {
        setError('Discord account not linked. Please link your Discord account first.');
        return;
      }

      const response = await api.get(`/adventures/discord/rewards/unclaimed/${discordUserId}`);
      setUnclaimedRewards(response.data.rewards || []);

    } catch (err) {
      console.error('Error loading unclaimed rewards:', err);
      setError('Failed to load unclaimed rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userId = currentUser?.discord_id;
      if (!userId) {
        console.log('No user ID available for loading trainers and monsters');
        return;
      }

      // Load user's trainers
      console.log('Loading trainers for user:', userId);
      const trainersResponse = await trainerService.getUserTrainers(userId);
      const trainers = trainersResponse.trainers || [];
      setUserTrainers(trainers);
      console.log('Loaded trainers:', trainers);

      // Load monsters for all trainers
      if (trainers.length > 0) {
        const allMonsters = [];

        for (const trainer of trainers) {
          try {
            console.log('Loading monsters for trainer:', trainer.id, trainer.name);
            const monstersResponse = await monsterService.getTrainerMonsters(trainer.id);
            if (monstersResponse.monsters) {
              // Add trainer_id to each monster for filtering
              const monstersWithTrainer = monstersResponse.monsters.map(monster => ({
                ...monster,
                trainer_id: trainer.id
              }));
              allMonsters.push(...monstersWithTrainer);
            }
          } catch (monsterErr) {
            console.error(`Error fetching monsters for trainer ${trainer.id}:`, monsterErr);
          }
        }

        setUserMonsters(allMonsters);
        console.log('Loaded monsters:', allMonsters);
      }

    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const getDiscordUserId = async () => {
    try {
      // Get Discord ID from current user
      if (currentUser && currentUser.discord_id) {
        return currentUser.discord_id;
      }
      return null;
    } catch (error) {
      console.error('Error getting Discord user ID:', error);
      return null;
    }
  };

  const handleSelectReward = (reward) => {
    setSelectedReward(reward);
    setAvailableLevels(reward.levels_earned || 0);
    setLevelAllocations([]);
    setShowAddAllocation(false);

    // Initialize coin allocation
    setAvailableCoins(reward.coins_earned || 0);
    setCoinAllocations([]);
    setShowAddCoinAllocation(false);

    // Initialize item assignments
    const initialItemAssignments = {};
    (reward.items_earned || []).forEach((item, index) => {
      initialItemAssignments[index] = '';
    });
    setItemAssignments(initialItemAssignments);

    setShowClaimInterface(true);
  };

  const handleAddAllocation = () => {
    if (!selectedEntityId || allocationLevels < 1 || allocationLevels > availableLevels) {
      return;
    }

    let entity, entityName, trainerInfo = null;

    if (selectedEntityType === 'trainer') {
      entity = userTrainers.find(t => t.id === parseInt(selectedEntityId));
      entityName = entity?.name || 'Unknown Trainer';
    } else {
      entity = userMonsters.find(m => m.id === parseInt(selectedEntityId));
      const trainer = userTrainers.find(t => t.id === parseInt(selectedTrainerId));
      entityName = entity?.name || `${entity?.species1}${entity?.species2 ? `/${entity?.species2}` : ''}`;
      trainerInfo = {
        trainerId: parseInt(selectedTrainerId),
        trainerName: trainer?.name || 'Unknown Trainer'
      };
    }

    if (!entity) return;

    const newAllocation = {
      id: Date.now(),
      entityType: selectedEntityType,
      entityId: parseInt(selectedEntityId),
      entityName,
      levels: allocationLevels,
      ...(trainerInfo && { trainerInfo })
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

  // Coin allocation functions
  const handleAddCoinAllocation = () => {
    if (!selectedEntityId || allocationCoins < 1 || allocationCoins > availableCoins) {
      return;
    }

    const trainer = userTrainers.find(t => t.id === parseInt(selectedEntityId));
    if (!trainer) return;

    const newAllocation = {
      id: Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      coins: allocationCoins
    };

    setCoinAllocations([...coinAllocations, newAllocation]);
    setAvailableCoins(availableCoins - allocationCoins);

    // Reset form
    setSelectedEntityId('');
    setAllocationCoins(1);
    setShowAddCoinAllocation(false);
  };

  const removeCoinAllocation = (index) => {
    const allocation = coinAllocations[index];
    if (allocation) {
      setCoinAllocations(coinAllocations.filter((_, i) => i !== index));
      setAvailableCoins(availableCoins + allocation.coins);
    }
  };

  const validateAssignments = () => {
    // Check if all levels are allocated
    if (availableLevels > 0) {
      return 'Please allocate all available levels before claiming rewards.';
    }

    // Check if all coins are allocated
    if (availableCoins > 0) {
      return 'Please allocate all available coins before claiming rewards.';
    }

    // Check if all items are assigned
    const itemsEarned = selectedReward.items_earned || [];
    for (let i = 0; i < itemsEarned.length; i++) {
      if (!itemAssignments[i]) {
        return 'Please assign all items to trainers before claiming rewards.';
      }
    }

    return null;
  };

  const handleClaimRewards = async () => {
    try {
      setClaiming(true);
      setError(null);

      // Validate assignments
      const validationError = validateAssignments();
      if (validationError) {
        setError(validationError);
        return;
      }

      // Prepare claim data
      const claimData = {
        adventureLogId: selectedReward.id,
        userId: currentUser.id,
        levelAllocations,
        coinAllocations,
        itemAllocations: (selectedReward.items_earned || []).map((item, index) => ({
          item,
          trainerId: parseInt(itemAssignments[index])
        }))
      };

      // Submit claim
      const response = await api.post('/adventures/rewards/claim', claimData);

      if (response.data.success) {
        // Remove claimed reward from list
        setUnclaimedRewards(unclaimedRewards.filter(r => r.id !== selectedReward.id));
        setShowClaimInterface(false);
        setSelectedReward(null);
        
        // Show success message
        alert('Rewards claimed successfully!');
      }

    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleCancel = () => {
    setShowClaimInterface(false);
    setSelectedReward(null);
    setLevelAllocations([]);
    setItemAssignments({});
    setAvailableLevels(0);
  };

  if (loading) {
    return (
      <div className="adventure-rewards-container">
        <div className="loading-message">
          <i className="fas fa-spinner fa-spin"></i>
          Loading unclaimed adventure rewards...
        </div>
      </div>
    );
  }

  if (error && !showClaimInterface) {
    return (
      <div className="adventure-rewards-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
        <button 
          className="btn btn-primary"
          onClick={loadUnclaimedRewards}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showClaimInterface && selectedReward) {
    return (
      <div className="adventure-rewards-container">
        <div className="claim-interface">
          <div className="claim-header">
            <h2>Claim Adventure Rewards</h2>
            <p>Adventure: <strong>{selectedReward.adventure_title}</strong></p>
            <p>Words Written: <strong>{selectedReward.word_count}</strong></p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {/* Level Allocation Section */}
          <div className="reward-section">
            <h3>
              <i className="fas fa-star"></i>
              Level Allocation ({selectedReward.levels_earned} levels earned)
            </h3>
            <p>Available levels to allocate: <strong>{availableLevels}</strong></p>

            {levelAllocations.length > 0 && (
              <div className="allocations-list">
                {levelAllocations.map((allocation) => (
                  <div key={allocation.id} className="allocation-item">
                    <span className="allocation-info">
                      <i className={allocation.entityType === 'trainer' ? 'fas fa-user' : 'fas fa-dragon'}></i>
                      {allocation.entityName}
                      {allocation.trainerInfo && (
                        <span className="trainer-info"> (owned by {allocation.trainerInfo.trainerName})</span>
                      )}
                      <span className="level-amount"> - {allocation.levels} levels</span>
                    </span>
                    <button
                      type="button"
                      className="button button-icon button-danger"
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
                    className="button button-primary"
                    onClick={() => setShowAddAllocation(true)}
                  >
                    <i className="fas fa-plus"></i> Add Level Allocation
                  </button>
                ) : (
                  <div className="allocation-form">
                    <div className="form-row">
                      <label>Assign levels to:</label>
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

                    {selectedEntityType === 'trainer' && (
                      <div className="form-row">
                        <label>Trainer:</label>
                        <select
                          value={selectedEntityId}
                          onChange={(e) => setSelectedEntityId(e.target.value)}
                          className="entity-select"
                        >
                          <option value="">Select trainer</option>
                          {userTrainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedEntityType === 'monster' && (
                      <>
                        <div className="form-row">
                          <label>Trainer (owner):</label>
                          <select
                            value={selectedTrainerId}
                            onChange={(e) => {
                              setSelectedTrainerId(e.target.value);
                              setSelectedEntityId(''); // Reset monster selection
                            }}
                            className="trainer-select"
                          >
                            <option value="">Select trainer</option>
                            {userTrainers.map(trainer => (
                              <option key={trainer.id} value={trainer.id}>
                                {trainer.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedTrainerId && (
                          <div className="form-row">
                            <label>Monster:</label>
                            <select
                              value={selectedEntityId}
                              onChange={(e) => setSelectedEntityId(e.target.value)}
                              className="entity-select"
                            >
                              <option value="">Select monster</option>
                              {userMonsters
                                .filter(monster => monster.trainer_id === parseInt(selectedTrainerId))
                                .map(monster => (
                                  <option key={monster.id} value={monster.id}>
                                    {monster.name || `${monster.species1}${monster.species2 ? `/${monster.species2}` : ''}`}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
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
                        className="button button-primary"
                        onClick={handleAddAllocation}
                        disabled={!selectedEntityId || allocationLevels < 1 || allocationLevels > availableLevels}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
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

          {/* Item Assignment Section */}
          {selectedReward.items_earned && selectedReward.items_earned.length > 0 && (
            <div className="reward-section">
              <h3>
                <i className="fas fa-gift"></i>
                Item Assignment ({selectedReward.items_earned.length} items earned)
              </h3>
              <p>Assign each item to one of your trainers:</p>

              <div className="items-grid">
                {selectedReward.items_earned.map((item, index) => (
                  <div key={index} className="item-assignment-card">
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      {item.rarity && (
                        <span className={`rarity-badge ${item.rarity.toLowerCase()}`}>
                          {item.rarity}
                        </span>
                      )}
                    </div>
                    <div className="trainer-assignment">
                      <label>Assign to trainer:</label>
                      <select
                        value={itemAssignments[index] || ''}
                        onChange={(e) => setItemAssignments({
                          ...itemAssignments,
                          [index]: e.target.value
                        })}
                        className="trainer-select"
                      >
                        <option value="">Select trainer</option>
                        {userTrainers.map(trainer => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coins Section */}
          {selectedReward.coins_earned > 0 && (
            <div className="reward-section">
              <h3>
                <i className="fas fa-coins"></i>
                Coins Earned ({selectedReward.coins_earned} total)
              </h3>
              <p>Assign coins to your trainers:</p>

              <div className="coin-allocations">
                {coinAllocations.map((allocation, index) => (
                  <div key={index} className="allocation-item">
                    <div className="allocation-info">
                      <span className="trainer-name">
                        {userTrainers.find(t => t.id === allocation.trainerId)?.name || 'Unknown Trainer'}
                      </span>
                      <span className="allocation-amount">{allocation.coins} coins</span>
                    </div>
                    <button
                      type="button"
                      className="button button-icon button-danger"
                      onClick={() => removeCoinAllocation(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}

                {availableCoins > 0 && (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setShowAddCoinAllocation(true)}
                  >
                    <i className="fas fa-plus"></i>
                    Assign Coins ({availableCoins} remaining)
                  </button>
                )}

                {availableCoins === 0 && coinAllocations.length > 0 && (
                  <p className="allocation-complete">All coins have been assigned!</p>
                )}
              </div>

              {/* Coin Allocation Form */}
              {showAddCoinAllocation && (
                <div className="allocation-form">
                  <h4>Assign Coins to Trainer</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Trainer:</label>
                      <select
                        value={selectedEntityId}
                        onChange={(e) => setSelectedEntityId(e.target.value)}
                      >
                        <option value="">Select a trainer</option>
                        {userTrainers.map(trainer => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Coins:</label>
                      <input
                        type="number"
                        min="1"
                        max={availableCoins}
                        value={allocationCoins}
                        onChange={(e) => setAllocationCoins(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={handleAddCoinAllocation}
                      disabled={!selectedEntityId || allocationCoins < 1 || allocationCoins > availableCoins}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setShowAddCoinAllocation(false);
                        setSelectedEntityId('');
                        setAllocationCoins(1);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="claim-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleClaimRewards}
              disabled={claiming || availableLevels > 0 || availableCoins > 0}
            >
              {claiming ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Claiming Rewards...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Claim Rewards
                </>
              )}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleCancel}
              disabled={claiming}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adventure-rewards-container">
      <div className="rewards-header">
        <h1>Adventure Rewards</h1>
        <p>Claim rewards from your completed adventures</p>
      </div>

      {unclaimedRewards.length === 0 ? (
        <div className="no-rewards-message">
          <i className="fas fa-treasure-chest"></i>
          <h3>No Unclaimed Rewards</h3>
          <p>You don't have any unclaimed adventure rewards at the moment.</p>
          <p>Complete adventures through Discord to earn rewards!</p>
        </div>
      ) : (
        <div className="rewards-list">
          <h2>Unclaimed Rewards ({unclaimedRewards.length})</h2>
          {unclaimedRewards.map((reward) => (
            <div key={reward.id} className="reward-card">
              <div className="reward-info">
                <h3>{reward.adventure_title}</h3>
                <div className="reward-stats">
                  <div className="stat">
                    <i className="fas fa-pencil-alt"></i>
                    <span>{reward.word_count} words</span>
                  </div>
                  <div className="stat">
                    <i className="fas fa-star"></i>
                    <span>{reward.levels_earned} levels</span>
                  </div>
                  <div className="stat">
                    <i className="fas fa-coins"></i>
                    <span>{reward.coins_earned} coins</span>
                  </div>
                  <div className="stat">
                    <i className="fas fa-gift"></i>
                    <span>{reward.items_earned?.length || 0} items</span>
                  </div>
                </div>
                <div className="reward-date">
                  Completed: {new Date(reward.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="reward-actions">
                <button
                  className="button button-primary"
                  onClick={() => handleSelectReward(reward)}
                >
                  <i className="fas fa-hand-holding-heart"></i>
                  Claim Rewards
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdventureRewards;
