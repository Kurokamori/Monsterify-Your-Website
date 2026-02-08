import React, { useState, useCallback } from 'react';
import MonsterRollConfigurator from './MonsterRollConfigurator';

const RewardConfigurator = ({ rewards, onChange, availableItems, isBonus = false }) => {
  const [showMonsterRoll, setShowMonsterRoll] = useState(
    rewards.monster_roll && rewards.monster_roll.enabled
  );

  const handleBasicRewardChange = (field, value) => {
    onChange({
      ...rewards,
      [field]: value
    });
  };

  const handleItemAdd = () => {
    const newItem = {
      item_id: '',
      item_name: '',
      category: '',
      quantity: 1,
      chance: 100,
      is_random_from_category: false,
      is_random_from_set: false,
      random_set_items: []
    };
    
    onChange({
      ...rewards,
      items: [...(rewards.items || []), newItem]
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...(rewards.items || [])];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    onChange({
      ...rewards,
      items: updatedItems
    });
  };

  const handleItemRemove = (index) => {
    const updatedItems = [...(rewards.items || [])];
    updatedItems.splice(index, 1);
    
    onChange({
      ...rewards,
      items: updatedItems
    });
  };

  // Removed special items handling - all items are treated equally

  const handleMonsterRollToggle = (enabled) => {
    setShowMonsterRoll(enabled);
    
    if (enabled) {
      onChange({
        ...rewards,
        monster_roll: {
          enabled: true,
          parameters: {
            tables: ['pokemon', 'digimon', 'yokai'],
            legendary: false,
            mythical: false,
            onlyLegendary: false,
            onlyMythical: false,
            includeTypes: [],
            excludeTypes: [],
            includeAttributes: [],
            excludeAttributes: [],
            includeSpecies: [],
            excludeSpecies: [],
            includeStages: [],
            species_max: 2,
            types_max: 3
          }
        }
      });
    } else {
      onChange({
        ...rewards,
        monster_roll: null
      });
    }
  };

  const handleMonsterRollChange = useCallback((parameters) => {
    onChange({
      ...rewards,
      monster_roll: {
        enabled: true,
        parameters
      }
    });
  }, [rewards, onChange]);

  return (
    <div className="reward-configurator">
      {/* Basic Rewards */}
      <div className="reward-section">
        <h4>Basic Rewards</h4>
        
        <div className="item-rewards">
          <div className="set-item">
            <label htmlFor={`levels-${isBonus ? 'bonus' : 'main'}`}>Levels</label>
            <input
              id={`levels-${isBonus ? 'bonus' : 'main'}`}
              type="number"
              min="0"
              value={rewards.levels || 0}
              onChange={(e) => handleBasicRewardChange('levels', parseInt(e.target.value) || 0)}
              className="reward-input"
            />
          </div>
          
          <div className="set-item">
            <label htmlFor={`coins-${isBonus ? 'bonus' : 'main'}`}>Coins</label>
            <input
              id={`coins-${isBonus ? 'bonus' : 'main'}`}
              type="number"
              min="0"
              value={rewards.coins || 0}
              onChange={(e) => handleBasicRewardChange('coins', parseInt(e.target.value) || 0)}
              className="reward-input"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="reward-section">
        <div className="section-header">
          <h4>Items</h4>
          <button
            type="button"
            onClick={handleItemAdd}
            className="button secondary sm"
          >
            Add Item
          </button>
        </div>

        {rewards.items && rewards.items.length > 0 ? (
          <div className="items-list">
            {rewards.items.map((item, index) => (
              <div key={index} className="item-config">
                <div className="config-row">
                  <div className="form-group">
                    <label>Item Configuration</label>
                    <div className="item-config-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={item.is_random_from_category}
                          onChange={(e) => {
                            const updatedItems = [...(rewards.items || [])];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              is_random_from_category: e.target.checked,
                              is_random_from_set: e.target.checked ? false : updatedItems[index].is_random_from_set,
                              item_id: e.target.checked ? null : updatedItems[index].item_id,
                              item_name: e.target.checked ? '' : updatedItems[index].item_name
                            };
                            onChange({
                              ...rewards,
                              items: updatedItems
                            });
                          }}
                        />
                        Random item from category
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={item.is_random_from_set}
                          onChange={(e) => {
                            const updatedItems = [...(rewards.items || [])];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              is_random_from_set: e.target.checked,
                              is_random_from_category: e.target.checked ? false : updatedItems[index].is_random_from_category,
                              item_id: e.target.checked ? null : updatedItems[index].item_id,
                              item_name: e.target.checked ? '' : updatedItems[index].item_name,
                              random_set_items: e.target.checked ? (updatedItems[index].random_set_items || []) : []
                            };
                            onChange({
                              ...rewards,
                              items: updatedItems
                            });
                          }}
                        />
                        Random item from custom set
                      </label>
                    </div>
                    
                    {item.is_random_from_category ? (
                      <select
                        value={item.category || ''}
                        onChange={(e) => {
                          const updatedItems = [...(rewards.items || [])];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            category: e.target.value
                          };
                          onChange({
                            ...rewards,
                            items: updatedItems
                          });
                        }}
                        className="form-input"
                      >
                        <option value="">Select a category</option>
                        {[...new Set(availableItems.map(i => i.category).filter(Boolean))].map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : item.is_random_from_set ? (
                      <div className="rarity-options">
                        <div className="change-details">
                          {(item.random_set_items || []).map((setItemId, setIndex) => {
                            const setItem = availableItems.find(ai => ai.id === setItemId);
                            return (
                              <div key={setIndex} className="set-item">
                                <select
                                  value={setItemId || ''}
                                  onChange={(e) => {
                                    const selectedItemId = parseInt(e.target.value) || null;
                                    const newSet = [...(item.random_set_items || [])];
                                    newSet[setIndex] = selectedItemId;
                                    const updatedItems = [...(rewards.items || [])];
                                    updatedItems[index] = {
                                      ...updatedItems[index],
                                      random_set_items: newSet
                                    };
                                    onChange({
                                      ...rewards,
                                      items: updatedItems
                                    });
                                  }}
                                  className="form-input"
                                >
                                  <option value="">Select item</option>
                                  {availableItems.map(availableItem => (
                                    <option key={availableItem.id} value={availableItem.id}>
                                      {availableItem.name} ({availableItem.category})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSet = [...(item.random_set_items || [])];
                                    newSet.splice(setIndex, 1);
                                    const updatedItems = [...(rewards.items || [])];
                                    updatedItems[index] = {
                                      ...updatedItems[index],
                                      random_set_items: newSet
                                    };
                                    onChange({
                                      ...rewards,
                                      items: updatedItems
                                    });
                                  }}
                                  className="button danger sm"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSet = [...(item.random_set_items || []), null];
                            const updatedItems = [...(rewards.items || [])];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              random_set_items: newSet
                            };
                            onChange({
                              ...rewards,
                              items: updatedItems
                            });
                          }}
                          className="button secondary sm"
                        >
                          Add Item to Set
                        </button>
                      </div>
                    ) : (
                      <select
                        value={item.item_id || ''}
                        onChange={(e) => {
                          const selectedItemId = parseInt(e.target.value) || null;
                          const selectedItem = availableItems.find(i => i.id === selectedItemId);
                          const updatedItems = [...(rewards.items || [])];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            item_id: selectedItemId,
                            item_name: selectedItem ? selectedItem.name : '',
                            category: selectedItem ? selectedItem.category : ''
                          };
                          onChange({
                            ...rewards,
                            items: updatedItems
                          });
                        }}
                        className="form-input"
                      >
                        <option value="">Select an item</option>
                        {availableItems.map(availableItem => (
                          <option key={availableItem.id} value={availableItem.id}>
                            {availableItem.name} ({availableItem.category})
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {(item.is_random_from_category || item.is_random_from_set) && (
                      <small className="form-help">
                        {item.is_random_from_category 
                          ? 'A random item from the selected category will be awarded'
                          : 'A random item from the custom set will be awarded'
                        }
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => {
                        const updatedItems = [...(rewards.items || [])];
                        updatedItems[index] = {
                          ...updatedItems[index],
                          quantity: parseInt(e.target.value) || 1
                        };
                        onChange({
                          ...rewards,
                          items: updatedItems
                        });
                      }}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Chance (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={item.chance || 100}
                      onChange={(e) => {
                        const updatedItems = [...(rewards.items || [])];
                        updatedItems[index] = {
                          ...updatedItems[index],
                          chance: parseInt(e.target.value) || 100
                        };
                        onChange({
                          ...rewards,
                          items: updatedItems
                        });
                      }}
                      className="form-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleItemRemove(index)}
                    className="button danger sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-items">No items configured</p>
        )}
      </div>

      {/* Monster Roll */}
      {!isBonus && (
        <div className="reward-section">
          <div className="section-header">
            <h4>Monster Roll</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showMonsterRoll}
                onChange={(e) => handleMonsterRollToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              Enable Monster Roll
            </label>
          </div>
          
          {showMonsterRoll && (
            <MonsterRollConfigurator
              parameters={rewards.monster_roll?.parameters || {}}
              onChange={handleMonsterRollChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RewardConfigurator;
