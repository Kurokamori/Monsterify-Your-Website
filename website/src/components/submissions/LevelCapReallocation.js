import React, { useState, useEffect } from 'react';

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
                          className="remove-allocation"
                          onClick={() => handleAllocation(monster.monsterId, parseInt(targetId), targetType, 0)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}

                  {/* Add new allocation */}
                  <div className="add-allocation">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const [targetType, targetId] = e.target.value.split('_');
                          handleAllocation(monster.monsterId, parseInt(targetId), targetType, 1);
                        }
                      }}
                    >
                      <option value="">+ Add target...</option>

                      {/* Show user-owned trainers */}
                      {availableTargets
                        .filter(target => target.trainerId && !target.monsterId) // This indicates it's a trainer entry
                        .map(target => (
                          <option key={`trainer_${target.trainerId}`} value={`trainer_${target.trainerId}`}>
                            Trainer {target.name}
                          </option>
                        ))}

                      {/* Show user-owned monsters (exclude the capped monster itself) */}
                      {availableTargets
                        .filter(target => target.monsterId && target.monsterId !== monster.monsterId)
                        .map(target => (
                          <option key={target.monsterId} value={`monster_${target.monsterId}`}>
                            {target.name} (Level {target.level})
                          </option>
                        ))}
                    </select>
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
          className="cancel-button"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="complete-button"
          disabled={remainingLevels > 0}
        >
          {remainingLevels > 0 ? `Allocate ${remainingLevels} more levels` : 'Complete Allocation'}
        </button>
      </div>
    </div>
  );
};

export default LevelCapReallocation;
