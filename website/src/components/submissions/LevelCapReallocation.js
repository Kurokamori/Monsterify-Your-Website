import React, { useState, useEffect } from 'react';
import AutocompleteInput from '../common/AutocompleteInput';

/**
 * Component for handling level 100 cap reallocation
 * When monsters would exceed level 100, users can redistribute excess levels
 */
const LevelCapReallocation = ({
  cappedMonsters = [],
  availableTargets = [],
  onComplete,
  onCancel
}) => {
  const [allocations, setAllocations] = useState({});
  const [totalExcessLevels, setTotalExcessLevels] = useState(0);
  const [allocatedLevels, setAllocatedLevels] = useState(0);

  // Initialize allocations and calculate total excess levels
  useEffect(() => {
    let total = 0;
    const initialAllocations = {};

    cappedMonsters.forEach(monster => {
      const excessLevels = monster.excessLevels || 0;
      total += Math.floor(excessLevels / 2); // Every 2 excess levels = 1 redistributable level
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

  // Handle level allocation
  const handleAllocation = (sourceMonster, targetId, targetType, levels) => {
    const newAllocations = { ...allocations };
    if (!newAllocations[sourceMonster]) {
      newAllocations[sourceMonster] = {};
    }
    
    const targetKey = `${targetType}_${targetId}`;
    newAllocations[sourceMonster][targetKey] = levels;
    
    setAllocations(newAllocations);
  };

  // Get available levels for a source monster
  const getAvailableLevels = (sourceMonster) => {
    const monster = cappedMonsters.find(m => m.monsterId === sourceMonster);
    if (!monster) return 0;
    
    const maxLevels = Math.floor((monster.excessLevels || 0) / 2);
    const usedLevels = Object.values(allocations[sourceMonster] || {}).reduce((sum, val) => sum + (val || 0), 0);
    
    return maxLevels - usedLevels;
  };

  // Handle completion
  const handleComplete = () => {
    if (onComplete) {
      onComplete(allocations);
    }
  };

  const remainingLevels = totalExcessLevels - allocatedLevels;

  return (
    <div className="level-cap-reallocation">
      <div className="reallocation-header">
        <h2>Level Cap Reallocation</h2>
        <p>
          Some monsters would exceed level 100. For every 2 excess levels, you can assign 1 level 
          to another monster of the same trainer or to the trainer themselves.
        </p>
        <div className="level-summary">
          <span>Total Redistributable Levels: {totalExcessLevels}</span>
          <span>Allocated: {allocatedLevels}</span>
          <span>Remaining: {remainingLevels}</span>
        </div>
      </div>

      <div className="capped-monsters">
        {cappedMonsters.map(monster => {
          const excessLevels = monster.excessLevels || 0;
          const redistributableLevels = Math.floor(excessLevels / 2);
          const availableLevels = getAvailableLevels(monster.monsterId);

          return (
            <div key={monster.monsterId} className="capped-monster-card">
              <div className="monster-info">
                <div className="monster-image">
                  <img
                    src={monster.img_link || monster.image_url || '/images/default_mon.png'}
                    alt={monster.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                </div>
                <div className="monster-details">
                  <h3>{monster.name || monster.species1}</h3>
                  <p>Current Level: {monster.currentLevel}</p>
                  <p>Would gain: {monster.originalLevels} levels</p>
                  <p>Excess levels: {excessLevels}</p>
                  <p>Can redistribute: {redistributableLevels} levels</p>
                  <p>Available to allocate: {availableLevels}</p>
                </div>
              </div>

              {redistributableLevels > 0 && (
                <div className="allocation-targets">
                  <h4>Allocate {redistributableLevels} levels to:</h4>

                  {/* Current allocations */}
                  {Object.entries(allocations[monster.monsterId] || {}).map(([targetKey, levels]) => {
                    if (levels === 0) return null;

                    const [targetType, targetId] = targetKey.split('_');
                    let targetName = '';

                    if (targetType === 'trainer') {
                      targetName = `Trainer ${monster.trainerName}`;
                    } else if (targetType === 'monster') {
                      const target = availableTargets.find(t => t.monsterId === parseInt(targetId));
                      targetName = target ? `${target.name} (Level ${target.level})` : `Monster ${targetId}`;
                    }

                    return (
                      <div key={targetKey} className="allocation-entry">
                        <span className="target-name">{targetName}:</span>
                        <input
                          type="number"
                          min="0"
                          value={levels}
                          onChange={(e) => {
                            const newLevels = parseInt(e.target.value) || 0;
                            handleAllocation(monster.monsterId, parseInt(targetId), targetType, newLevels);
                          }}
                        />
                        <span>levels</span>
                        <button
                          type="button"
                          className="button icon danger"
                          onClick={() => handleAllocation(monster.monsterId, parseInt(targetId), targetType, 0)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}

                  {/* Add new allocation */}
                  <div className="add-allocation">
                    <AutocompleteInput
                      name={`add-target-${monster.monsterId}`}
                      value=""
                      onChange={() => {}}
                      onSelect={(option) => {
                        if (option.value) {
                          const [targetType, targetId] = option.value.split('_');
                          handleAllocation(monster.monsterId, parseInt(targetId), targetType, 1);
                        }
                      }}
                      options={[
                        ...availableTargets
                          .filter(target => target.trainerId && !target.monsterId)
                          .map(target => ({
                            name: `Trainer ${target.name}`,
                            value: `trainer_${target.trainerId}`,
                            description: ''
                          })),
                        ...availableTargets
                          .filter(target => target.monsterId && target.monsterId !== monster.monsterId)
                          .map(target => ({
                            name: `${target.name} (Level ${target.level})`,
                            value: `monster_${target.monsterId}`,
                            description: ''
                          }))
                      ]}
                      placeholder="Type to search targets..."
                      label="Add target"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="reallocation-actions">
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
};

export default LevelCapReallocation;
