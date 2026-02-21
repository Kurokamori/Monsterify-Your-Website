import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import api from '../../services/api';
import {
  Trainer,
  Monster,
  UnclaimedReward,
  LevelAllocation,
  CoinAllocation,
  formatDate
} from './types';

type EntityType = 'trainer' | 'monster';

export const AdventureRewards = () => {
  const { currentUser } = useAuth();

  // State for unclaimed rewards
  const [unclaimedRewards, setUnclaimedRewards] = useState<UnclaimedReward[]>([]);
  const [selectedReward, setSelectedReward] = useState<UnclaimedReward | null>(null);
  const [showClaimInterface, setShowClaimInterface] = useState(false);

  // State for level distribution
  const [availableLevels, setAvailableLevels] = useState(0);
  const [levelAllocations, setLevelAllocations] = useState<LevelAllocation[]>([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);

  // State for coin allocation
  const [availableCoins, setAvailableCoins] = useState(0);
  const [coinAllocations, setCoinAllocations] = useState<CoinAllocation[]>([]);
  const [showAddCoinAllocation, setShowAddCoinAllocation] = useState(false);

  // State for item assignments
  const [itemAssignments, setItemAssignments] = useState<Record<number, string>>({});

  // State for adding new allocations
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('trainer');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [allocationLevels, setAllocationLevels] = useState(1);
  const [allocationCoins, setAllocationCoins] = useState(1);

  // User data
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const loadUnclaimedRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const discordUserId = currentUser?.discord_id;
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
  }, [currentUser?.discord_id]);

  const loadUserData = useCallback(async () => {
    try {
      const userId = currentUser?.discord_id;
      if (!userId) return;

      // Load user's trainers
      const trainersResponse = await api.get(`/trainers/user/${userId}`);
      const trainers = trainersResponse.data.trainers || [];
      setUserTrainers(trainers);

      // Load monsters for all trainers
      if (trainers.length > 0) {
        const allMonsters: Monster[] = [];

        for (const trainer of trainers) {
          try {
            const monstersResponse = await api.get(`/monsters/trainer/${trainer.id}`);
            if (monstersResponse.data.monsters) {
              const monstersWithTrainer = monstersResponse.data.monsters.map((monster: Monster) => ({
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
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, [currentUser?.discord_id]);

  useEffect(() => {
    loadUnclaimedRewards();
    loadUserData();
  }, [loadUnclaimedRewards, loadUserData]);

  const handleSelectReward = (reward: UnclaimedReward) => {
    setSelectedReward(reward);
    setAvailableLevels(reward.levels_earned || 0);
    setLevelAllocations([]);
    setShowAddAllocation(false);

    setAvailableCoins(reward.coins_earned || 0);
    setCoinAllocations([]);
    setShowAddCoinAllocation(false);

    const initialItemAssignments: Record<number, string> = {};
    (reward.items_earned || []).forEach((_, index) => {
      initialItemAssignments[index] = '';
    });
    setItemAssignments(initialItemAssignments);

    setShowClaimInterface(true);
  };

  const handleAddAllocation = () => {
    if (!selectedEntityId || allocationLevels < 1 || allocationLevels > availableLevels) {
      return;
    }

    let entityName: string;
    let trainerInfo: { trainerId: number; trainerName: string } | undefined;

    if (selectedEntityType === 'trainer') {
      const entity = userTrainers.find(t => t.id === parseInt(selectedEntityId));
      entityName = entity?.name || 'Unknown Trainer';
    } else {
      const entity = userMonsters.find(m => m.id === parseInt(selectedEntityId));
      const trainer = userTrainers.find(t => t.id === parseInt(selectedTrainerId));
      entityName = entity?.name || `${entity?.species1}${entity?.species2 ? `/${entity?.species2}` : ''}`;
      trainerInfo = {
        trainerId: parseInt(selectedTrainerId),
        trainerName: trainer?.name || 'Unknown Trainer'
      };
    }

    const newAllocation: LevelAllocation = {
      id: Date.now(),
      entityType: selectedEntityType,
      entityId: parseInt(selectedEntityId),
      entityName,
      levels: allocationLevels,
      ...(trainerInfo && { trainerInfo })
    };

    setLevelAllocations([...levelAllocations, newAllocation]);
    setAvailableLevels(availableLevels - allocationLevels);

    setSelectedEntityId('');
    setSelectedTrainerId('');
    setAllocationLevels(1);
    setShowAddAllocation(false);
  };

  const handleRemoveAllocation = (allocationId: number) => {
    const allocation = levelAllocations.find(a => a.id === allocationId);
    if (allocation) {
      setLevelAllocations(levelAllocations.filter(a => a.id !== allocationId));
      setAvailableLevels(availableLevels + allocation.levels);
    }
  };

  const handleAddCoinAllocation = () => {
    if (!selectedEntityId || allocationCoins < 1 || allocationCoins > availableCoins) {
      return;
    }

    const trainer = userTrainers.find(t => t.id === parseInt(selectedEntityId));
    if (!trainer) return;

    const newAllocation: CoinAllocation = {
      id: Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      coins: allocationCoins
    };

    setCoinAllocations([...coinAllocations, newAllocation]);
    setAvailableCoins(availableCoins - allocationCoins);

    setSelectedEntityId('');
    setAllocationCoins(1);
    setShowAddCoinAllocation(false);
  };

  const removeCoinAllocation = (index: number) => {
    const allocation = coinAllocations[index];
    if (allocation) {
      setCoinAllocations(coinAllocations.filter((_, i) => i !== index));
      setAvailableCoins(availableCoins + allocation.coins);
    }
  };

  const validateAssignments = (): string | null => {
    if (availableLevels > 0) {
      return 'Please allocate all available levels before claiming rewards.';
    }

    if (availableCoins > 0) {
      return 'Please allocate all available coins before claiming rewards.';
    }

    const itemsEarned = selectedReward?.items_earned || [];
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

      const validationError = validateAssignments();
      if (validationError) {
        setError(validationError);
        return;
      }

      if (!selectedReward || !currentUser) return;

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

      const response = await api.post('/adventures/rewards/claim', claimData);

      if (response.data.success) {
        setUnclaimedRewards(unclaimedRewards.filter(r => r.id !== selectedReward.id));
        setShowClaimInterface(false);
        setSelectedReward(null);
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
      <div className="adventure-rewards">
        <LoadingSpinner message="Loading unclaimed adventure rewards..." />
      </div>
    );
  }

  if (error && !showClaimInterface) {
    return (
      <div className="adventure-rewards">
        <ErrorMessage message={error} onRetry={loadUnclaimedRewards} />
      </div>
    );
  }

  if (showClaimInterface && selectedReward) {
    return (
      <div className="adventure-rewards">
        <div className="claim-interface">
          <div className="claim-interface__header">
            <h2>Claim Adventure Rewards</h2>
            <p>Adventure: <strong>{selectedReward.adventure_title}</strong></p>
            <p>Words Written: <strong>{selectedReward.word_count}</strong></p>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

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
                  <div key={allocation.id} className="allocation-row">
                    <span className="allocation-row__info">
                      <i className={allocation.entityType === 'trainer' ? 'fas fa-user' : 'fas fa-dragon'}></i>
                      {allocation.entityName}
                      {allocation.trainerInfo && (
                        <span className="allocation-row__trainer-info"> (owned by {allocation.trainerInfo.trainerName})</span>
                      )}
                      <span className="allocation-row__amount"> - {allocation.levels} levels</span>
                    </span>
                    <button
                      type="button"
                      className="button icon danger"
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
                    className="button primary"
                    onClick={() => setShowAddAllocation(true)}
                  >
                    <i className="fas fa-plus"></i> Add Level Allocation
                  </button>
                ) : (
                  <div className="allocation-form">
                    <div className="form-row">
                      <label>Assign levels to:</label>
                      <select
                        className="input"
                        value={selectedEntityType}
                        onChange={(e) => {
                          setSelectedEntityType(e.target.value as EntityType);
                          setSelectedEntityId('');
                          setSelectedTrainerId('');
                        }}
                      >
                        <option value="trainer">Trainer</option>
                        <option value="monster">Monster</option>
                      </select>
                    </div>

                    {selectedEntityType === 'trainer' && (
                      <div className="form-row">
                        <label>Trainer:</label>
                        <select
                          className="input"
                          value={selectedEntityId}
                          onChange={(e) => setSelectedEntityId(e.target.value)}
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
                            className="input"
                            value={selectedTrainerId}
                            onChange={(e) => {
                              setSelectedTrainerId(e.target.value);
                              setSelectedEntityId('');
                            }}
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
                              className="input"
                              value={selectedEntityId}
                              onChange={(e) => setSelectedEntityId(e.target.value)}
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
                      <label>Levels:</label>
                      <input
                        type="number"
                        className="input"
                        min="1"
                        max={availableLevels}
                        value={allocationLevels}
                        onChange={(e) => setAllocationLevels(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="button primary"
                        onClick={handleAddAllocation}
                        disabled={!selectedEntityId || allocationLevels < 1 || allocationLevels > availableLevels}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="button secondary"
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
                      {item.description && <p>{item.description}</p>}
                      {item.rarity && (
                        <span className={`badge badge--${item.rarity.toLowerCase()}`}>
                          {item.rarity}
                        </span>
                      )}
                    </div>
                    <div className="trainer-assignment">
                      <label>Assign to trainer:</label>
                      <select
                        className="input"
                        value={itemAssignments[index] || ''}
                        onChange={(e) => setItemAssignments({
                          ...itemAssignments,
                          [index]: e.target.value
                        })}
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
                  <div key={index} className="allocation-row">
                    <div className="allocation-info">
                      <span className="trainer-name">{allocation.trainerName}</span>
                      <span className="allocation-row__amount">{allocation.coins} coins</span>
                    </div>
                    <button
                      type="button"
                      className="button icon danger"
                      onClick={() => removeCoinAllocation(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}

                {availableCoins > 0 && (
                  <button
                    type="button"
                    className="button primary"
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

              {showAddCoinAllocation && (
                <div className="allocation-form">
                  <h4>Assign Coins to Trainer</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Trainer:</label>
                      <select
                        className="input"
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
                        className="input"
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
                      className="button primary"
                      onClick={handleAddCoinAllocation}
                      disabled={!selectedEntityId || allocationCoins < 1 || allocationCoins > availableCoins}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="button secondary"
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
          <div className="claim-interface__actions">
            <button
              type="button"
              className="button primary"
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
              className="button secondary"
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
    <div className="adventure-rewards">
      <div className="adventure-rewards__header">
        <h1>Adventure Rewards</h1>
        <p>Claim rewards from your completed adventures</p>
      </div>

      {unclaimedRewards.length === 0 ? (
        <div className="no-rewards">
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
              <div className="reward-card__info">
                <h3>{reward.adventure_title}</h3>
                <div className="reward-card__stats">
                  <div className="reward-card__stat">
                    <i className="fas fa-pencil-alt"></i>
                    <span>{reward.word_count} words</span>
                  </div>
                  <div className="reward-card__stat">
                    <i className="fas fa-star"></i>
                    <span>{reward.levels_earned} levels</span>
                  </div>
                  <div className="reward-card__stat">
                    <i className="fas fa-coins"></i>
                    <span>{reward.coins_earned} coins</span>
                  </div>
                  <div className="reward-card__stat">
                    <i className="fas fa-gift"></i>
                    <span>{reward.items_earned?.length || 0} items</span>
                  </div>
                </div>
                <div className="reward-card__date">
                  Completed: {formatDate(reward.created_at)}
                </div>
              </div>
              <div className="reward-card__actions">
                <button
                  className="button primary"
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
