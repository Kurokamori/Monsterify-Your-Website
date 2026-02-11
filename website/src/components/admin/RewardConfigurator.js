import React, { useState, useCallback, useEffect } from 'react';
import MonsterRollConfigurator from './MonsterRollConfigurator';
import api from '../../services/api';

// Available monster tables configuration
const MONSTER_TABLES = [
  { key: 'pokemon', label: 'Pokemon', endpoint: '/pokemon-monsters' },
  { key: 'digimon', label: 'Digimon', endpoint: '/digimon-monsters' },
  { key: 'yokai', label: 'Yokai Watch', endpoint: '/yokai-monsters' },
  { key: 'nexomon', label: 'Nexomon', endpoint: '/nexomon-monsters' },
  { key: 'pals', label: 'Palworld', endpoint: '/pals-monsters' },
  { key: 'fakemon', label: 'Fakemon', endpoint: '/fakedex' },
  { key: 'finalfantasy', label: 'Final Fantasy', endpoint: '/finalfantasy-monsters' },
  { key: 'monsterhunter', label: 'Monster Hunter', endpoint: '/monsterhunter-monsters' }
];

const AVAILABLE_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const AVAILABLE_ATTRIBUTES = [
  'Vaccine', 'Variable', 'Virus', 'Data', 'Free'
];

const RewardConfigurator = ({ rewards, onChange, availableItems, isBonus = false }) => {
  const [showMonsterRoll, setShowMonsterRoll] = useState(
    rewards.monster_roll && rewards.monster_roll.enabled
  );
  const [speciesCache, setSpeciesCache] = useState({});
  const [speciesSearches, setSpeciesSearches] = useState({});
  const [loadingSpecies, setLoadingSpecies] = useState({});

  // Fetch species for a given table
  const fetchSpecies = useCallback(async (table, search = '') => {
    const tableConfig = MONSTER_TABLES.find(t => t.key === table);
    if (!tableConfig) return [];

    const cacheKey = `${table}-${search}`;
    if (speciesCache[cacheKey]) {
      return speciesCache[cacheKey];
    }

    setLoadingSpecies(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const params = { limit: 50 };
      if (search) params.search = search;

      const response = await api.get(tableConfig.endpoint, { params });
      let species = [];

      // Handle different response structures from different endpoints
      if (response.data.success && response.data.data) {
        // Standard format: { success: true, data: [...] }
        species = response.data.data;
      } else if (response.data.fakemon) {
        // Fakemon format: { fakemon: [...] }
        species = response.data.fakemon;
      } else if (response.data.species) {
        // Species format: { species: [...] }
        species = response.data.species;
      } else if (Array.isArray(response.data)) {
        species = response.data;
      }

      // Normalize species data - handle different field names
      species = species.map(s => ({
        id: s.id || s.number,
        name: s.name || s.species_name,
        image_url: s.image_url || s.sprite_url || null
      }));

      setSpeciesCache(prev => ({ ...prev, [cacheKey]: species }));
      return species;
    } catch (err) {
      console.error(`Error fetching species for ${table}:`, err);
      return [];
    } finally {
      setLoadingSpecies(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [speciesCache]);

  // Search species with debounce
  const handleSpeciesSearch = useCallback(async (table, search, index, type) => {
    const key = `${type}-${index}`;
    setSpeciesSearches(prev => ({ ...prev, [key]: search }));

    if (search.length >= 2) {
      const species = await fetchSpecies(table, search);
      setSpeciesCache(prev => ({ ...prev, [`${table}-${search}`]: species }));
    }
  }, [fetchSpecies]);

  // No need to prefetch - species are fetched on demand when user searches

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

  const handleItemRemove = (index) => {
    const updatedItems = [...(rewards.items || [])];
    updatedItems.splice(index, 1);

    onChange({
      ...rewards,
      items: updatedItems
    });
  };

  // Static Monster Handlers
  const handleStaticMonsterAdd = () => {
    const newMonster = {
      table: 'pokemon',
      species_id: null,
      species_name: '',
      level: 5,
      image_url: ''
    };

    onChange({
      ...rewards,
      static_monsters: [...(rewards.static_monsters || []), newMonster]
    });
  };

  const handleStaticMonsterChange = (index, field, value) => {
    const updated = [...(rewards.static_monsters || [])];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // Reset species when table changes
    if (field === 'table') {
      updated[index].species_id = null;
      updated[index].species_name = '';
      updated[index].image_url = '';
    }

    onChange({
      ...rewards,
      static_monsters: updated
    });
  };

  const handleStaticMonsterRemove = (index) => {
    const updated = [...(rewards.static_monsters || [])];
    updated.splice(index, 1);

    onChange({
      ...rewards,
      static_monsters: updated
    });
  };

  // Semi-Random Monster Handlers
  const handleSemiRandomMonsterAdd = () => {
    const newMonster = {
      table: 'pokemon',
      species_id: null,
      species_name: '',
      image_url: '',
      allow_fusion: false,
      type_mode: 'random',
      fixed_types: [],
      types_min: 1,
      types_max: 2,
      attribute_mode: 'random',
      fixed_attribute: null,
      level_mode: 'fixed',
      fixed_level: 5,
      level_min: 1,
      level_max: 10
    };

    onChange({
      ...rewards,
      semi_random_monsters: [...(rewards.semi_random_monsters || []), newMonster]
    });
  };

  const handleSemiRandomMonsterChange = (index, field, value) => {
    const updated = [...(rewards.semi_random_monsters || [])];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // Reset species when table changes
    if (field === 'table') {
      updated[index].species_id = null;
      updated[index].species_name = '';
      updated[index].image_url = '';
    }

    onChange({
      ...rewards,
      semi_random_monsters: updated
    });
  };

  const handleSemiRandomMonsterRemove = (index) => {
    const updated = [...(rewards.semi_random_monsters || [])];
    updated.splice(index, 1);

    onChange({
      ...rewards,
      semi_random_monsters: updated
    });
  };

  const handleSemiRandomTypeToggle = (index, type) => {
    const updated = [...(rewards.semi_random_monsters || [])];
    const currentTypes = updated[index].fixed_types || [];

    if (currentTypes.includes(type)) {
      updated[index].fixed_types = currentTypes.filter(t => t !== type);
    } else {
      updated[index].fixed_types = [...currentTypes, type];
    }

    onChange({
      ...rewards,
      semi_random_monsters: updated
    });
  };

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

  // Get species list for dropdown
  const getSpeciesList = (table, searchKey) => {
    const search = speciesSearches[searchKey] || '';
    const cacheKey = `${table}-${search}`;
    return speciesCache[cacheKey] || speciesCache[`${table}-`] || [];
  };

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

      {/* Static Monster Rewards */}
      {!isBonus && (
        <div className="reward-section monster-rewards-section">
          <div className="section-header">
            <h4>Static Monster Rewards</h4>
            <button
              type="button"
              onClick={handleStaticMonsterAdd}
              className="button secondary sm"
            >
              Add Static Monster
            </button>
          </div>
          <p className="section-description">
            Award specific predefined monsters with set levels.
          </p>

          {rewards.static_monsters && rewards.static_monsters.length > 0 ? (
            <div className="monster-rewards-list">
              {rewards.static_monsters.map((monster, index) => (
                <div key={index} className="monster-reward-card">
                  <div className="monster-reward-header">
                    <span className="monster-reward-number">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleStaticMonsterRemove(index)}
                      className="button danger sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="monster-reward-body">
                    {monster.image_url && (
                      <div className="monster-preview">
                        <img src={monster.image_url} alt={monster.species_name} />
                      </div>
                    )}

                    <div className="monster-reward-fields">
                      <div className="form-group">
                        <label>Monster Table</label>
                        <select
                          value={monster.table}
                          onChange={(e) => handleStaticMonsterChange(index, 'table', e.target.value)}
                          className="form-input"
                        >
                          {MONSTER_TABLES.map(table => (
                            <option key={table.key} value={table.key}>
                              {table.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Species</label>
                        <div className="species-search-wrapper">
                          <input
                            type="text"
                            placeholder="Search species..."
                            value={speciesSearches[`static-${index}`] || monster.species_name || ''}
                            onChange={(e) => {
                              handleSpeciesSearch(monster.table, e.target.value, index, 'static');
                            }}
                            className="form-input"
                          />
                          {(speciesSearches[`static-${index}`] || '').length >= 2 && (
                            <div className="species-dropdown">
                              {loadingSpecies[`${monster.table}-${speciesSearches[`static-${index}`]}`] ? (
                                <div className="dropdown-loading">Loading...</div>
                              ) : (
                                getSpeciesList(monster.table, `static-${index}`).map(species => (
                                  <div
                                    key={species.id}
                                    className="species-option"
                                    onClick={() => {
                                      handleStaticMonsterChange(index, 'species_id', species.id);
                                      handleStaticMonsterChange(index, 'species_name', species.name);
                                      handleStaticMonsterChange(index, 'image_url', species.image_url);
                                      setSpeciesSearches(prev => ({ ...prev, [`static-${index}`]: '' }));
                                    }}
                                  >
                                    {species.image_url && (
                                      <img src={species.image_url} alt={species.name} className="species-thumb" />
                                    )}
                                    <span>{species.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {monster.species_name && (
                          <div className="selected-species">
                            Selected: <strong>{monster.species_name}</strong>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Level</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={monster.level || 5}
                          onChange={(e) => handleStaticMonsterChange(index, 'level', parseInt(e.target.value) || 5)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items">No static monsters configured</p>
          )}
        </div>
      )}

      {/* Semi-Random Monster Rewards */}
      {!isBonus && (
        <div className="reward-section monster-rewards-section">
          <div className="section-header">
            <h4>Semi-Random Monster Rewards</h4>
            <button
              type="button"
              onClick={handleSemiRandomMonsterAdd}
              className="button secondary sm"
            >
              Add Semi-Random Monster
            </button>
          </div>
          <p className="section-description">
            Award monsters with a predefined species but randomized attributes like types, fusions, and levels.
          </p>

          {rewards.semi_random_monsters && rewards.semi_random_monsters.length > 0 ? (
            <div className="monster-rewards-list">
              {rewards.semi_random_monsters.map((monster, index) => (
                <div key={index} className="monster-reward-card semi-random">
                  <div className="monster-reward-header">
                    <span className="monster-reward-number">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleSemiRandomMonsterRemove(index)}
                      className="button danger sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="monster-reward-body">
                    {monster.image_url && (
                      <div className="monster-preview">
                        <img src={monster.image_url} alt={monster.species_name} />
                      </div>
                    )}

                    <div className="monster-reward-fields">
                      {/* Base Species Selection */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Monster Table</label>
                          <select
                            value={monster.table}
                            onChange={(e) => handleSemiRandomMonsterChange(index, 'table', e.target.value)}
                            className="form-input"
                          >
                            {MONSTER_TABLES.map(table => (
                              <option key={table.key} value={table.key}>
                                {table.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Base Species</label>
                          <div className="species-search-wrapper">
                            <input
                              type="text"
                              placeholder="Search species..."
                              value={speciesSearches[`semi-${index}`] || monster.species_name || ''}
                              onChange={(e) => {
                                handleSpeciesSearch(monster.table, e.target.value, index, 'semi');
                              }}
                              className="form-input"
                            />
                            {(speciesSearches[`semi-${index}`] || '').length >= 2 && (
                              <div className="species-dropdown">
                                {loadingSpecies[`${monster.table}-${speciesSearches[`semi-${index}`]}`] ? (
                                  <div className="dropdown-loading">Loading...</div>
                                ) : (
                                  getSpeciesList(monster.table, `semi-${index}`).map(species => (
                                    <div
                                      key={species.id}
                                      className="species-option"
                                      onClick={() => {
                                        handleSemiRandomMonsterChange(index, 'species_id', species.id);
                                        handleSemiRandomMonsterChange(index, 'species_name', species.name);
                                        handleSemiRandomMonsterChange(index, 'image_url', species.image_url);
                                        setSpeciesSearches(prev => ({ ...prev, [`semi-${index}`]: '' }));
                                      }}
                                    >
                                      {species.image_url && (
                                        <img src={species.image_url} alt={species.name} className="species-thumb" />
                                      )}
                                      <span>{species.name}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          {monster.species_name && (
                            <div className="selected-species">
                              Selected: <strong>{monster.species_name}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fusion Toggle */}
                      <div className="form-group">
                        <label className="checkbox-label fusion-toggle">
                          <input
                            type="checkbox"
                            checked={monster.allow_fusion}
                            onChange={(e) => handleSemiRandomMonsterChange(index, 'allow_fusion', e.target.checked)}
                          />
                          Allow Random Fusion
                        </label>
                        <small className="form-help">
                          If enabled, the monster may be fused with another random species.
                        </small>
                      </div>

                      {/* Type Configuration */}
                      <div className="config-subsection">
                        <h5>Type Configuration</h5>
                        <div className="mode-toggle">
                          <label className={`mode-option ${monster.type_mode === 'random' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name={`type-mode-${index}`}
                              value="random"
                              checked={monster.type_mode === 'random'}
                              onChange={() => handleSemiRandomMonsterChange(index, 'type_mode', 'random')}
                            />
                            Random Types
                          </label>
                          <label className={`mode-option ${monster.type_mode === 'fixed' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name={`type-mode-${index}`}
                              value="fixed"
                              checked={monster.type_mode === 'fixed'}
                              onChange={() => handleSemiRandomMonsterChange(index, 'type_mode', 'fixed')}
                            />
                            Fixed Types
                          </label>
                        </div>

                        {monster.type_mode === 'random' ? (
                          <div className="range-inputs">
                            <div className="form-group">
                              <label>Min Types</label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={monster.types_min || 1}
                                onChange={(e) => handleSemiRandomMonsterChange(index, 'types_min', parseInt(e.target.value) || 1)}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label>Max Types</label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={monster.types_max || 2}
                                onChange={(e) => handleSemiRandomMonsterChange(index, 'types_max', parseInt(e.target.value) || 2)}
                                className="form-input"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="type-selection">
                            <div className="type-grid">
                              {AVAILABLE_TYPES.map(type => (
                                <label key={type} className="type-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={(monster.fixed_types || []).includes(type)}
                                    onChange={() => handleSemiRandomTypeToggle(index, type)}
                                  />
                                  <span className={`badge type-${type.toLowerCase()}`}>
                                    {type}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Attribute Configuration */}
                      <div className="config-subsection">
                        <h5>Attribute Configuration</h5>
                        <div className="mode-toggle">
                          <label className={`mode-option ${monster.attribute_mode === 'random' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name={`attribute-mode-${index}`}
                              value="random"
                              checked={monster.attribute_mode === 'random'}
                              onChange={() => handleSemiRandomMonsterChange(index, 'attribute_mode', 'random')}
                            />
                            Random Attribute
                          </label>
                          <label className={`mode-option ${monster.attribute_mode === 'fixed' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name={`attribute-mode-${index}`}
                              value="fixed"
                              checked={monster.attribute_mode === 'fixed'}
                              onChange={() => handleSemiRandomMonsterChange(index, 'attribute_mode', 'fixed')}
                            />
                            Fixed Attribute
                          </label>
                        </div>

                        {monster.attribute_mode === 'fixed' && (
                          <div className="form-group">
                            <select
                              value={monster.fixed_attribute || ''}
                              onChange={(e) => handleSemiRandomMonsterChange(index, 'fixed_attribute', e.target.value)}
                              className="form-input"
                            >
                              <option value="">Select Attribute</option>
                              {AVAILABLE_ATTRIBUTES.map(attr => (
                                <option key={attr} value={attr}>{attr}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Level Configuration */}
                      <div className="config-subsection">
                        <h5>Level Configuration</h5>
                        <div className="mode-toggle">
                          <label className={`mode-option ${monster.level_mode === 'fixed' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name={`level-mode-${index}`}
                              value="fixed"
                              checked={monster.level_mode === 'fixed'}
                              onChange={() => handleSemiRandomMonsterChange(index, 'level_mode', 'fixed')}
                            />
                            Fixed Level
                          </label>
                          <label className={`mode-option ${monster.level_mode === 'random' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name={`level-mode-${index}`}
                              value="random"
                              checked={monster.level_mode === 'random'}
                              onChange={() => handleSemiRandomMonsterChange(index, 'level_mode', 'random')}
                            />
                            Random Level Range
                          </label>
                        </div>

                        {monster.level_mode === 'fixed' ? (
                          <div className="form-group">
                            <label>Level</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={monster.fixed_level || 5}
                              onChange={(e) => handleSemiRandomMonsterChange(index, 'fixed_level', parseInt(e.target.value) || 5)}
                              className="form-input"
                            />
                          </div>
                        ) : (
                          <div className="range-inputs">
                            <div className="form-group">
                              <label>Min Level</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={monster.level_min || 1}
                                onChange={(e) => handleSemiRandomMonsterChange(index, 'level_min', parseInt(e.target.value) || 1)}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label>Max Level</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={monster.level_max || 10}
                                onChange={(e) => handleSemiRandomMonsterChange(index, 'level_max', parseInt(e.target.value) || 10)}
                                className="form-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items">No semi-random monsters configured</p>
          )}
        </div>
      )}

      {/* Monster Roll */}
      {!isBonus && (
        <div className="reward-section">
          <div className="section-header">
            <h4>Random Monster Roll</h4>
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
          <p className="section-description">
            Award a completely randomized monster based on configurable parameters.
          </p>

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
