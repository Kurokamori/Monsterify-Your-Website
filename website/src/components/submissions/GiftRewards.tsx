import { useState, useEffect, useCallback } from 'react';
import { AutocompleteInput, AutocompleteOption } from '../common/AutocompleteInput';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import { ErrorModal } from '../common/ErrorModal';
import api from '../../services/api';

interface Trainer {
  id: number;
  name: string;
}

interface Monster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  trainer_id?: number;
}

interface GiftItem {
  name: string;
  category: string;
  image_url?: string;
}

interface GiftMonster {
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  image_url?: string;
}

interface LevelAllocation {
  id: number;
  type: 'trainer' | 'monster';
  entityId: number;
  entityName: string;
  levels: number;
  trainerId?: number | null;
}

interface ItemAssignment {
  item: GiftItem;
  trainerId: number;
}

interface MonsterAssignment {
  monster: GiftMonster;
  trainerId: number;
  name: string;
}

interface GiftRewardsData {
  levelAllocations: LevelAllocation[];
  itemAssignments: ItemAssignment[];
  monsterAssignments: MonsterAssignment[];
}

interface GiftRewardsProps {
  giftLevels: number;
  userTrainers: Trainer[];
  userMonsters: Monster[];
  onComplete: (data: unknown) => void;
  onCancel: () => void;
  submissionType?: 'art' | 'writing' | 'reference';
}

export function GiftRewards({
  giftLevels,
  userTrainers,
  userMonsters,
  onComplete,
  onCancel,
  submissionType = 'art'
}: GiftRewardsProps) {
  // State for level distribution
  const [availableLevels, setAvailableLevels] = useState(Math.floor(giftLevels / 2));
  const [levelAllocations, setLevelAllocations] = useState<LevelAllocation[]>([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);

  // State for item rewards
  const [itemRewards, setItemRewards] = useState<GiftItem[]>([]);
  const [itemAssignments, setItemAssignments] = useState<Record<number, string>>({});
  const [itemSearchTexts, setItemSearchTexts] = useState<Record<number, string>>({});

  // State for monster rewards
  const [monsterRewards, setMonsterRewards] = useState<GiftMonster[]>([]);
  const [monsterAssignments, setMonsterAssignments] = useState<Record<number, string>>({});
  const [monsterNames, setMonsterNames] = useState<Record<number, string>>({});

  // State for adding new allocations
  const [selectedEntityType, setSelectedEntityType] = useState<'trainer' | 'monster'>('trainer');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [allocationLevels, setAllocationLevels] = useState(1);
  const [allocationLevelsText, setAllocationLevelsText] = useState('1');
  const [trainerSearchText, setTrainerSearchText] = useState('');
  const [monsterTrainerSearchText, setMonsterTrainerSearchText] = useState('');
  const [monsterSearchText, setMonsterSearchText] = useState('');

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingRewards, setGeneratingRewards] = useState(false);

  // Calculate reward counts
  const itemRewardCount = Math.floor(giftLevels / 5);
  const monsterRewardCount = Math.floor(giftLevels / 10);

  // Generate item and monster rewards on component mount
  const generateRewards = useCallback(async () => {
    try {
      setGeneratingRewards(true);
      setError(null);

      // Generate item rewards
      if (itemRewardCount > 0) {
        const itemResponse = await api.post<{ items: GiftItem[] }>('/submissions/gift-rewards/items', {
          count: itemRewardCount
        });
        setItemRewards(itemResponse.data.items || []);

        // Initialize item assignments
        const initialItemAssignments: Record<number, string> = {};
        itemResponse.data.items?.forEach((_, index) => {
          initialItemAssignments[index] = '';
        });
        setItemAssignments(initialItemAssignments);
      }

      // Generate monster rewards
      if (monsterRewardCount > 0) {
        const monsterResponse = await api.post<{ monsters: GiftMonster[] }>('/submissions/gift-rewards/monsters', {
          count: monsterRewardCount
        });
        setMonsterRewards(monsterResponse.data.monsters || []);

        // Initialize monster assignments and names
        const initialMonsterAssignments: Record<number, string> = {};
        const initialMonsterNames: Record<number, string> = {};
        monsterResponse.data.monsters?.forEach((monster, index) => {
          initialMonsterAssignments[index] = '';
          initialMonsterNames[index] = monster.name || '';
        });
        setMonsterAssignments(initialMonsterAssignments);
        setMonsterNames(initialMonsterNames);
      }

    } catch (err) {
      console.error('Error generating gift rewards:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to generate gift rewards. Please try again.');
    } finally {
      setGeneratingRewards(false);
    }
  }, [itemRewardCount, monsterRewardCount]);

  useEffect(() => {
    generateRewards();
  }, [generateRewards]);

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

    const newAllocation: LevelAllocation = {
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
    setAllocationLevelsText('1');
    setTrainerSearchText('');
    setMonsterTrainerSearchText('');
    setMonsterSearchText('');
    setShowAddAllocation(false);
  };

  const handleRemoveAllocation = (allocationId: number) => {
    const allocation = levelAllocations.find(a => a.id === allocationId);
    if (allocation) {
      setLevelAllocations(levelAllocations.filter(a => a.id !== allocationId));
      setAvailableLevels(availableLevels + allocation.levels);
    }
  };

  const handleItemAssignment = (itemIndex: number, trainerId: string, trainerName: string) => {
    setItemAssignments({ ...itemAssignments, [itemIndex]: trainerId });
    setItemSearchTexts({ ...itemSearchTexts, [itemIndex]: trainerName });
  };

  const handleMonsterAssignment = (monsterIndex: number, trainerId: string) => {
    setMonsterAssignments({
      ...monsterAssignments,
      [monsterIndex]: trainerId
    });
  };

  const handleMonsterNameChange = (monsterIndex: number, name: string) => {
    setMonsterNames({
      ...monsterNames,
      [monsterIndex]: name
    });
  };

  const validateAssignments = (): string | null => {
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
        setLoading(false);
        return;
      }

      // Prepare submission data
      const submissionData: GiftRewardsData = {
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
      const response = await api.post<{ success: boolean }>('/submissions/gift-rewards/finalize', submissionData);

      if (response.data.success) {
        onComplete(response.data);
      }

    } catch (err) {
      console.error('Error submitting gift rewards:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit gift rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get trainer autocomplete options
  const getTrainerOptions = (): AutocompleteOption[] => {
    return userTrainers.map(trainer => ({
      name: trainer.name,
      value: trainer.id.toString()
    }));
  };

  // Get monster autocomplete options filtered by trainer
  const getMonsterOptions = (): AutocompleteOption[] => {
    const filteredMonsters = selectedTrainerId
      ? userMonsters.filter(monster => monster.trainer_id === parseInt(selectedTrainerId))
      : [];
    return filteredMonsters.map(monster => {
      const species = [monster.species1, monster.species2, monster.species3].filter(Boolean).join(' / ') || 'Unknown';
      return {
        name: `${monster.name} (${species})`,
        value: monster.id.toString()
      };
    });
  };

  const handleTrainerSelect = (option: AutocompleteOption | null) => {
    if (option?.value) {
      if (selectedEntityType === 'trainer') {
        setSelectedEntityId(option.value.toString());
      } else {
        setSelectedTrainerId(option.value.toString());
        setSelectedEntityId('');
      }
    }
  };

  const handleMonsterSelect = (option: AutocompleteOption | null) => {
    if (option?.value) {
      setSelectedEntityId(option.value.toString());
    }
  };

  if (generatingRewards) {
    return (
      <div className="gift-rewards-container">
        <div className="section-title">
          <h2>Generating Gift Rewards...</h2>
        </div>
        <div className="container center">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  const submissionTypeLabel = submissionType === 'art' ? 'Art' :
                              submissionType === 'reference' ? 'Reference' : 'Writing';

  return (
    <div className="gift-rewards-container">
      <div className="section-title">
        <i className="fas fa-gift"></i>
        Gift {submissionTypeLabel} Rewards
      </div>
      <p className="gift-rewards-intro">
        You gave {giftLevels} levels as gift {submissionType === 'reference' ? 'references' : submissionType}! Here are your rewards:
      </p>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
        title="Gift Rewards Error"
      />

      {/* Level Distribution Section */}
      <div className="submission__reward-section card">
        <div className="card__body">
          <h3 className="form-section">
            <i className="fas fa-star"></i>
            Level Distribution
          </h3>
          <p className="form-tooltip--section">
            Distribute {Math.floor(giftLevels / 2)} bonus levels among your trainers and monsters. Allocate all levels before submitting.
          </p>
          <p>
            <strong>Available levels: {availableLevels}</strong>
          </p>

          {levelAllocations.length > 0 && (
            <div className="submission__allocations-list">
              {levelAllocations.map((allocation) => {
                const trainerName = allocation.type === 'monster' && allocation.trainerId
                  ? userTrainers.find(t => t.id === allocation.trainerId)?.name
                  : null;

                return (
                  <div key={allocation.id} className="submission__allocation-row reward-item">
                    <div className="reward-item__icon reward-item__icon--level">
                      <i className={allocation.type === 'trainer' ? 'fas fa-user' : 'fas fa-dragon'}></i>
                    </div>
                    <div className="reward-item__content">
                      <span className="reward-item__label">
                        {allocation.entityName}
                        {trainerName && ` (${trainerName})`}
                      </span>
                      <span className="reward-item__status">{allocation.levels} levels</span>
                    </div>
                    <div className="reward-item__actions">
                      <button
                        type="button"
                        className="button icon danger small"
                        onClick={() => handleRemoveAllocation(allocation.id)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
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
                  className="button primary"
                  onClick={() => setShowAddAllocation(true)}
                >
                  <i className="fas fa-plus"></i>
                  Add Level Allocation
                </button>
              ) : (
                <div className="add-allocation-form card card--compact">
                  <div className="card__body">
                    <div className="form-group form-group--small-padding">
                      <label className="form-label">Type</label>
                      <select
                        className="select"
                        value={selectedEntityType}
                        onChange={(e) => {
                          setSelectedEntityType(e.target.value as 'trainer' | 'monster');
                          setSelectedEntityId('');
                          setSelectedTrainerId('');
                          setTrainerSearchText('');
                          setMonsterTrainerSearchText('');
                          setMonsterSearchText('');
                        }}
                      >
                        <option value="trainer">Trainer</option>
                        <option value="monster">Monster</option>
                      </select>
                    </div>

                    {/* For monster selection, show trainer selection first */}
                    {selectedEntityType === 'monster' && (
                      <div className="form-group form-group--small-padding">
                        <AutocompleteInput
                          name="select-trainer"
                          label="Select Trainer First"
                          value={monsterTrainerSearchText}
                          onChange={setMonsterTrainerSearchText}
                          options={getTrainerOptions()}
                          placeholder="Type to search trainers..."
                          onSelect={(option) => {
                            handleTrainerSelect(option);
                            setMonsterTrainerSearchText(option?.name || '');
                            setMonsterSearchText('');
                          }}
                        />
                      </div>
                    )}

                    <div className="form-group form-group--small-padding">
                      {selectedEntityType === 'trainer' ? (
                        <AutocompleteInput
                          name="select-entity"
                          label="Select Trainer"
                          value={trainerSearchText}
                          onChange={setTrainerSearchText}
                          options={getTrainerOptions()}
                          placeholder="Type to search trainers..."
                          onSelect={(option) => {
                            handleTrainerSelect(option);
                            setTrainerSearchText(option?.name || '');
                          }}
                        />
                      ) : (
                        <AutocompleteInput
                          name="select-monster"
                          label="Select Monster"
                          value={monsterSearchText}
                          onChange={setMonsterSearchText}
                          options={getMonsterOptions()}
                          placeholder={!selectedTrainerId ? 'Select Trainer First' : 'Type to search monsters...'}
                          disabled={!selectedTrainerId}
                          onSelect={(option) => {
                            handleMonsterSelect(option);
                            setMonsterSearchText(option?.name || '');
                          }}
                        />
                      )}
                    </div>

                    <div className="form-group form-group--small-padding">
                      <label className="form-label">Levels</label>
                      <input
                        type="number"
                        className="input"
                        min="1"
                        max={availableLevels}
                        value={allocationLevelsText}
                        onChange={(e) => {
                          setAllocationLevelsText(e.target.value);
                          const parsed = parseInt(e.target.value);
                          setAllocationLevels(isNaN(parsed) ? 0 : parsed);
                        }}
                        placeholder="Levels"
                      />
                    </div>

                    <div className="container horizontal grid gap-medium">
                      <button
                        type="button"
                        className="button primary"
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
                        className="button secondary"
                        onClick={() => {
                          setShowAddAllocation(false);
                          setSelectedEntityId('');
                          setSelectedTrainerId('');
                          setAllocationLevels(1);
                          setAllocationLevelsText('1');
                          setTrainerSearchText('');
                          setMonsterTrainerSearchText('');
                          setMonsterSearchText('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item Rewards Section */}
      {itemRewards.length > 0 && (
        <div className="submission__reward-section card">
          <div className="card__body">
            <h3 className="form-section">
              <i className="fas fa-gift"></i>
              Item Rewards ({itemRewards.length} items)
            </h3>
            <p className="form-tooltip--section">Assign each item to one of your trainers. Items go into the trainer's inventory.</p>

            <div className="container grid grid-medium">
              {itemRewards.map((item, index) => (
                <div key={index} className="reward-item">
                  <div className="reward-item__icon reward-item__icon--item">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="reward-item__image" />
                    ) : (
                      <i className="fas fa-cube"></i>
                    )}
                  </div>
                  <div className="reward-item__content">
                    <span className="reward-item__label">{item.name}</span>
                    <span className="reward-item__category">{item.category}</span>
                  </div>
                  <div className="reward-item__extra">
                    <AutocompleteInput
                      name={`item-trainer-${index}`}
                      value={itemSearchTexts[index] || ''}
                      onChange={(text) => setItemSearchTexts({ ...itemSearchTexts, [index]: text })}
                      options={getTrainerOptions()}
                      placeholder="Type to search trainers..."
                      onSelect={(option) => {
                        if (option?.value) {
                          handleItemAssignment(index, option.value.toString(), option.name);
                        }
                      }}
                      noPadding
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monster Rewards Section */}
      {monsterRewards.length > 0 && (
        <div className="submission__reward-section card">
          <div className="card__body">
            <h3 className="form-section">
              <i className="fas fa-dragon"></i>
              Monster Rewards ({monsterRewards.length} monsters)
            </h3>
            <p className="form-tooltip--section">Name each monster and assign them to a trainer. The monster will be added to that trainer's PC.</p>

            <div className="monster-rewards-grid container grid grid-medium">
              {monsterRewards.map((monster, index) => (
                <div key={index} className="gift-monster-card card">
                  <div className="card__image">
                    <img
                      src={monster.image_url || '/images/default_mon.png'}
                      alt={monster.name || monster.species1}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/default_mon.png';
                      }}
                    />
                  </div>

                  <div className="card__body">
                    <h4 className="card__title">
                      {monster.name || monster.species1 || 'Mystery Monster'}
                    </h4>

                    {/* Species */}
                    <div className="gift-monster-species">
                      {monster.species1 && <span className="species-name">{monster.species1}</span>}
                      {monster.species2 && <span className="species-name"> / {monster.species2}</span>}
                      {monster.species3 && <span className="species-name"> / {monster.species3}</span>}
                    </div>

                    {/* Types */}
                    <div className="gift-monster-types container horizontal gap-small">
                      {monster.type1 && <TypeBadge type={monster.type1} size="xs" />}
                      {monster.type2 && <TypeBadge type={monster.type2} size="xs" />}
                      {monster.type3 && <TypeBadge type={monster.type3} size="xs" />}
                      {monster.type4 && <TypeBadge type={monster.type4} size="xs" />}
                      {monster.type5 && <TypeBadge type={monster.type5} size="xs" />}
                    </div>

                    {/* Attribute */}
                    {monster.attribute && (
                      <div className="gift-monster-attribute">
                        <AttributeBadge attribute={monster.attribute} size="xs" />
                      </div>
                    )}

                    {/* Assignment */}
                    <div className="monster-assignment container vertical gap-small">
                      <div className="form-group form-group--small-padding">
                        <label className="form-label">Monster Name</label>
                        <input
                          type="text"
                          className="input"
                          value={monsterNames[index] || ''}
                          onChange={(e) => handleMonsterNameChange(index, e.target.value)}
                          placeholder="Enter monster name"
                        />
                      </div>

                      <div className="form-group form-group--small-padding">
                        <label className="form-label">Assign to Trainer</label>
                        <select
                          className="select"
                          value={monsterAssignments[index] || ''}
                          onChange={(e) => handleMonsterAssignment(index, e.target.value)}
                        >
                          <option value="">Select Trainer...</option>
                          {userTrainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="gift-rewards-actions container horizontal gap-small">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button success"
          onClick={handleSubmit}
          disabled={loading || availableLevels > 0}
        >
          {loading ? 'Submitting...' : 'Submit Gift Rewards'}
        </button>
      </div>

      {availableLevels > 0 && (
        <div className="warning-message submission__alert submission__alert--warning">
          <i className="fas fa-exclamation-triangle"></i>
          You still have {availableLevels} levels to distribute.
        </div>
      )}
    </div>
  );
}
