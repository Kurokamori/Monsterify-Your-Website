import { useState, useEffect, useCallback } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../common/MonsterAutocomplete';
import api from '../../services/api';

interface CappedMonster {
  monsterId: number;
  name?: string;
  species1?: string;
  img_link?: string;
  image_url?: string;
  currentLevel: number;
  originalLevels: number;
  excessLevels: number;
  trainerName?: string;
}

interface AllocationTarget {
  monsterId?: number;
  trainerId?: number;
  name: string;
  level?: number;
}

type Allocations = Record<number, Record<string, number>>;

interface LevelCapReallocationProps {
  cappedMonsters: CappedMonster[];
  availableTargets: AllocationTarget[];
  onComplete: (allocations: Allocations) => void;
  onCancel: () => void;
}

interface TrainerMonster {
  id: number;
  name: string;
  level?: number;
}

interface TargetNameEntry {
  name: string;
  trainerName?: string;
}

export function LevelCapReallocation({
  cappedMonsters = [],
  onComplete,
  onCancel
}: LevelCapReallocationProps) {
  const [allocations, setAllocations] = useState<Allocations>({});
  const [totalExcessLevels, setTotalExcessLevels] = useState(0);
  const [allocatedLevels, setAllocatedLevels] = useState(0);

  // Per-monster add-target state
  const [targetTypes, setTargetTypes] = useState<Record<number, 'trainer' | 'monster'>>({});
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<Record<number, number | null>>({});
  const [selectedMonsterIds, setSelectedMonsterIds] = useState<Record<number, number | null>>({});
  const [trainerMonsters, setTrainerMonsters] = useState<Record<number, TrainerMonster[]>>({});
  // Store names for display in allocation entries
  const [targetNames, setTargetNames] = useState<Record<string, TargetNameEntry>>({});

  // Initialize allocations and calculate total excess levels
  useEffect(() => {
    let total = 0;
    const initialAllocations: Allocations = {};

    cappedMonsters.forEach(monster => {
      const excessLevels = monster.excessLevels || 0;
      total += Math.floor(excessLevels / 2);
      initialAllocations[monster.monsterId] = {};
    });

    setTotalExcessLevels(total);
    setAllocations(initialAllocations);
  }, [cappedMonsters]);

  // Calculate total allocated levels
  useEffect(() => {
    let total = 0;
    Object.values(allocations).forEach(monsterAllocations => {
      Object.values(monsterAllocations).forEach(allocation => {
        total += allocation || 0;
      });
    });
    setAllocatedLevels(total);
  }, [allocations]);

  const handleAllocation = (sourceMonster: number, targetId: number, targetType: string, levels: number) => {
    const newAllocations = { ...allocations };
    if (!newAllocations[sourceMonster]) {
      newAllocations[sourceMonster] = {};
    }
    const targetKey = `${targetType}_${targetId}`;
    newAllocations[sourceMonster][targetKey] = levels;
    setAllocations(newAllocations);
  };

  const getAvailableLevels = (sourceMonster: number): number => {
    const monster = cappedMonsters.find(m => m.monsterId === sourceMonster);
    if (!monster) return 0;
    const maxLevels = Math.floor((monster.excessLevels || 0) / 2);
    const usedLevels = Object.values(allocations[sourceMonster] || {}).reduce((sum, val) => sum + (val || 0), 0);
    return maxLevels - usedLevels;
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(allocations);
    }
  };

  // Fetch ALL monsters for a selected trainer (no pagination)
  const fetchTrainerMonsters = useCallback(async (sourceMonsterId: number, trainerId: number) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/monsters/all`);
      const monsters: TrainerMonster[] = (response.data.monsters || response.data.data || response.data || [])
        .filter((m: TrainerMonster) => m.id !== sourceMonsterId);
      setTrainerMonsters(prev => ({ ...prev, [sourceMonsterId]: monsters }));
    } catch {
      setTrainerMonsters(prev => ({ ...prev, [sourceMonsterId]: [] }));
    }
  }, []);

  const handleTargetTypeChange = (sourceMonsterId: number, type: 'trainer' | 'monster') => {
    setTargetTypes(prev => ({ ...prev, [sourceMonsterId]: type }));
    setSelectedTrainerIds(prev => ({ ...prev, [sourceMonsterId]: null }));
    setSelectedMonsterIds(prev => ({ ...prev, [sourceMonsterId]: null }));
    setTrainerMonsters(prev => ({ ...prev, [sourceMonsterId]: [] }));
  };

  const handleTrainerSelect = (sourceMonsterId: number, trainerId: string | number | null, trainerName?: string) => {
    const id = trainerId ? Number(trainerId) : null;
    setSelectedTrainerIds(prev => ({ ...prev, [sourceMonsterId]: id }));
    setSelectedMonsterIds(prev => ({ ...prev, [sourceMonsterId]: null }));

    if (targetTypes[sourceMonsterId] === 'monster' && id) {
      fetchTrainerMonsters(sourceMonsterId, id);
    } else if (targetTypes[sourceMonsterId] === 'trainer' && id) {
      // Store trainer name for display
      const displayName = trainerName || `Trainer #${id}`;
      setTargetNames(prev => ({ ...prev, [`trainer_${id}`]: { name: displayName } }));
      handleAllocation(sourceMonsterId, id, 'trainer', 1);
      setSelectedTrainerIds(prev => ({ ...prev, [sourceMonsterId]: null }));
    }
  };

  const handleMonsterSelect = (sourceMonsterId: number, monsterId: string | number | null) => {
    const id = monsterId ? Number(monsterId) : null;
    if (id) {
      // Find the monster name from fetched data
      const monsterList = trainerMonsters[sourceMonsterId] || [];
      const selectedMonster = monsterList.find(m => m.id === id);
      const monsterName = selectedMonster?.name || `Monster #${id}`;
      setTargetNames(prev => ({ ...prev, [`monster_${id}`]: { name: monsterName } }));
      handleAllocation(sourceMonsterId, id, 'monster', 1);
      setSelectedMonsterIds(prev => ({ ...prev, [sourceMonsterId]: null }));
      setSelectedTrainerIds(prev => ({ ...prev, [sourceMonsterId]: null }));
    }
  };

  // Get target name for display
  const getTargetName = (targetKey: string): string => {
    const stored = targetNames[targetKey];
    if (stored) return stored.name;
    const [targetType, targetId] = targetKey.split('_');
    if (targetType === 'trainer') return `Trainer #${targetId}`;
    return `Monster #${targetId}`;
  };

  const remainingLevels = totalExcessLevels - allocatedLevels;

  return (
    <div className="level-cap-reallocation">
      <div className="section-title">
        <i className="fas fa-exchange-alt"></i>
        Level Cap Reallocation
      </div>
      <p className="form-tooltip--section">
        Some monsters would exceed the level cap (100). For every 2 excess levels, you get 1 redistributable level to assign to another monster or trainer.
      </p>
      <div className="level-summary reward-list__summary">
        <div className="reward-list__summary-item">
          <i className="fas fa-star"></i>
          <span>Total Redistributable: {totalExcessLevels}</span>
        </div>
        <div className="reward-list__summary-item">
          <i className="fas fa-check"></i>
          <span>Allocated: {allocatedLevels}</span>
        </div>
        <div className="reward-list__summary-item">
          <i className="fas fa-hourglass-half"></i>
          <span>Remaining: {remainingLevels}</span>
        </div>
      </div>

      <div className="capped-monsters container vertical gap-medium">
        {cappedMonsters.map(monster => {
          const excessLevels = monster.excessLevels || 0;
          const redistributableLevels = Math.floor(excessLevels / 2);
          const availableLevels = getAvailableLevels(monster.monsterId);
          const currentTargetType = targetTypes[monster.monsterId] || 'trainer';
          const monsterImageUrl = monster.image_url || monster.img_link || '/images/default_mon.png';

          return (
            <div key={monster.monsterId} className="capped-monster-card card">
              <div className="card__body">
                <div className="container horizontal gap-medium">
                  <div className="monster-image">
                    <img
                      src={monsterImageUrl}
                      alt={monster.name || monster.species1}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/default_mon.png';
                      }}
                    />
                  </div>
                  <div className="monster-details">
                    <h3 className="card__title">{monster.name || monster.species1}</h3>
                    <div className="monster-stats container vertical gap-small">
                      <span>Current Level: {monster.currentLevel}</span>
                      <span>Would gain: {monster.originalLevels} levels</span>
                      <span>Excess levels: {excessLevels}</span>
                      <span>Can redistribute: {redistributableLevels} levels</span>
                      <span className="available-indicator">
                        Available to allocate: <strong>{availableLevels}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {redistributableLevels > 0 && (
                  <div className="allocation-targets">
                    <h4 className="form-section">Allocate {redistributableLevels} levels to:</h4>
                    <p className="form-tooltip--section">Select a trainer or monster to receive the excess levels.</p>

                    {/* Current allocations */}
                    {Object.entries(allocations[monster.monsterId] || {}).map(([targetKey, levels]) => {
                      if (levels === 0) return null;

                      const [targetType, targetId] = targetKey.split('_');

                      return (
                        <div key={targetKey} className="allocation-entry reward-item">
                          <div className="reward-item__content">
                            <span className="reward-item__label">{getTargetName(targetKey)}</span>
                          </div>
                          <div className="allocation-controls container horizontal gap-small">
                            <input
                              type="number"
                              className="input"
                              min="0"
                              max={levels + availableLevels}
                              value={levels}
                              onChange={(e) => {
                                const newLevels = parseInt(e.target.value) || 0;
                                handleAllocation(monster.monsterId, parseInt(targetId), targetType, newLevels);
                              }}
                            />
                            <span>levels</span>
                            <button
                              type="button"
                              className="button icon danger small"
                              onClick={() => handleAllocation(monster.monsterId, parseInt(targetId), targetType, 0)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add new allocation */}
                    {availableLevels > 0 && (
                      <div className="add-allocation">
                        <div className="allocation-options container horizontal gap-small">
                          <label className={`allocation-option ${currentTargetType === 'trainer' ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name={`targetType-${monster.monsterId}`}
                              value="trainer"
                              checked={currentTargetType === 'trainer'}
                              onChange={() => handleTargetTypeChange(monster.monsterId, 'trainer')}
                            />
                            <div className="option-content">
                              <i className="fas fa-user"></i>
                              <span>Trainer</span>
                            </div>
                          </label>
                          <label className={`allocation-option ${currentTargetType === 'monster' ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name={`targetType-${monster.monsterId}`}
                              value="monster"
                              checked={currentTargetType === 'monster'}
                              onChange={() => handleTargetTypeChange(monster.monsterId, 'monster')}
                            />
                            <div className="option-content">
                              <i className="fas fa-dragon"></i>
                              <span>Monster</span>
                            </div>
                          </label>
                        </div>

                        {currentTargetType === 'trainer' && (
                          <TrainerAutocomplete
                            selectedTrainerId={selectedTrainerIds[monster.monsterId]}
                            onSelect={(id) => handleTrainerSelect(monster.monsterId, id)}
                            onSelectTrainer={(trainer) => {
                              if (trainer) {
                                handleTrainerSelect(monster.monsterId, trainer.id, trainer.name);
                              }
                            }}
                            label="Select Trainer"
                            placeholder="Type to search trainers..."
                            noPadding
                          />
                        )}

                        {currentTargetType === 'monster' && (
                          <>
                            <TrainerAutocomplete
                              selectedTrainerId={selectedTrainerIds[monster.monsterId]}
                              onSelect={(id) => {
                                if (id) {
                                  const numId = Number(id);
                                  setSelectedTrainerIds(prev => ({ ...prev, [monster.monsterId]: numId }));
                                  setSelectedMonsterIds(prev => ({ ...prev, [monster.monsterId]: null }));
                                  fetchTrainerMonsters(monster.monsterId, numId);
                                }
                              }}
                              label="Select Trainer (owner)"
                              placeholder="First select the trainer..."
                              noPadding
                            />
                            {selectedTrainerIds[monster.monsterId] && (
                              <MonsterAutocomplete
                                monsters={trainerMonsters[monster.monsterId] || []}
                                selectedMonsterId={selectedMonsterIds[monster.monsterId]}
                                onSelect={(id) => handleMonsterSelect(monster.monsterId, id)}
                                label="Select Monster"
                                placeholder="Then select the monster..."
                                noPadding
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="reallocation-actions container horizontal gap-small">
        <button
          type="button"
          onClick={onCancel}
          className="button secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="button primary"
          disabled={remainingLevels > 0}
        >
          {remainingLevels > 0 ? `Allocate ${remainingLevels} more levels` : 'Complete Allocation'}
        </button>
      </div>
    </div>
  );
}
