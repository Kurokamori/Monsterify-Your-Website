import React, { useState, useEffect, useCallback, useRef } from 'react';

const MonsterRollConfigurator = ({ parameters = {}, onChange }) => {
  const isInitialMount = useRef(true);
  const [collapsedSections, setCollapsedSections] = useState({
    advanced: true,
    types: false,
    attributes: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [config, setConfig] = useState(() => ({
    // Core parameters from MonsterRoller
    tables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'],
    enabledTables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'],

    // Species slots (from MonsterRoller)
    species1: null,
    species2: null,
    species3: null,
    includeSpecies1: [],
    excludeSpecies1: [],
    includeSpecies2: [],
    excludeSpecies2: [],
    includeSpecies3: [],
    excludeSpecies3: [],

    // Type slots (from MonsterRoller)
    type1: null,
    type2: null,
    type3: null,
    type4: null,
    type5: null,
    includeType1: [],
    excludeType1: [],
    includeType2: [],
    excludeType2: [],
    includeType3: [],
    excludeType3: [],
    includeType4: [],
    excludeType4: [],
    includeType5: [],
    excludeType5: [],

    // Other parameters (from MonsterRoller)
    attribute: null,
    rarity: null,
    legendary: false,
    mythical: false,
    onlyLegendary: false,
    onlyMythical: false,
    
    // Stage and rank parameters
    includeStages: [],
    excludeStages: [],
    includeRanks: [],
    excludeRanks: [],
    
    // Backward compatibility
    includeSpecies: [],
    excludeSpecies: [],
    includeTypes: [],
    excludeTypes: [],
    speciesTypesOptions: [],
    includeAttributes: [],
    excludeAttributes: [],
    includeRarities: [],
    excludeRarities: [],
    customSelector: null,
    
    // Quantity settings (from MonsterRoller)
    species_min: 1,
    species_max: 2,
    types_min: 1,
    types_max: 3,
    
    // Table-specific filters (advanced feature)
    tableFilters: {},

    ...parameters
  }));

  // Hardcoded lists instead of API calls
  const availableTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ];
  
  const availableAttributes = [
    'Vaccine', 'Variable', 'Virus', 'Data', 'Free'
  ];

  // No need for useEffect since we're using hardcoded lists

  // Only call onChange when config actually changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (Object.keys(config).length > 0) {
      onChange(config);
    }
  }, [config, onChange]);
  
  // Update config when parameters change (with deep comparison to prevent loops)
  useEffect(() => {
    if (parameters && Object.keys(parameters).length > 0) {
      setConfig(prev => {
        // Check if parameters have actually changed
        const hasChanged = Object.keys(parameters).some(key => 
          prev[key] !== parameters[key]
        );
        
        if (hasChanged) {
          return {
            ...prev,
            ...parameters
          };
        }
        
        return prev;
      });
    }
  }, [parameters]);

  // No longer needed since we use hardcoded lists

  const handleConfigChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleArrayToggle = useCallback((field, value) => {
    setConfig(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  }, []);

  const getPresetConfigurations = () => [
    {
      name: 'Basic Starter',
      description: 'Basic stage monsters, no legendaries',
      config: {
        legendary: false,
        mythical: false,
        onlyLegendary: false,
        onlyMythical: false,
        includeStages: [1],
        includeTypes: [],
        excludeTypes: [],
        species_max: 2,
        types_max: 3
      }
    },
    {
      name: 'Standard Reward',
      description: 'Up to stage 2, no legendaries',
      config: {
        legendary: false,
        mythical: false,
        onlyLegendary: false,
        onlyMythical: false,
        includeStages: [1, 2],
        includeTypes: [],
        excludeTypes: [],
        species_max: 2,
        types_max: 3
      }
    },
    {
      name: 'Premium Reward',
      description: 'Any stage, legendaries allowed',
      config: {
        legendary: true,
        mythical: false,
        onlyLegendary: false,
        onlyMythical: false,
        includeStages: [],
        includeTypes: [],
        excludeTypes: [],
        species_max: 2,
        types_max: 3
      }
    },
    {
      name: 'Only Legendaries',
      description: 'Legendary monsters only',
      config: {
        legendary: true,
        mythical: false,
        onlyLegendary: true,
        onlyMythical: false,
        includeStages: [],
        includeTypes: [],
        excludeTypes: [],
        species_max: 1,
        types_max: 3
      }
    },
    {
      name: 'Only Mythicals',
      description: 'Mythical monsters only',
      config: {
        legendary: false,
        mythical: true,
        onlyLegendary: false,
        onlyMythical: true,
        includeStages: [],
        includeTypes: [],
        excludeTypes: [],
        species_max: 1,
        types_max: 3
      }
    }
  ];

  const applyPreset = useCallback((presetConfig) => {
    setConfig(prev => ({
      ...prev,
      ...presetConfig
    }));
  }, []);

  return (
    <div className="reward-configurator">
      {/* Preset Configurations */}
      <div className="config-section">
        <h5>Quick Presets</h5>
        <div className="preset-buttons">
          {getPresetConfigurations().map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applyPreset(preset.config)}
              className="button secondary"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rarity Configuration */}
      <div className="config-section">
        <h5>Rarity Configuration</h5>

        <div className="config-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.legendary}
              onChange={(e) => handleConfigChange('legendary', e.target.checked)}
            />
            Allow Legendary Monsters
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.mythical}
              onChange={(e) => handleConfigChange('mythical', e.target.checked)}
            />
            Allow Mythical Monsters
          </label>
        </div>

        <div className="config-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.onlyLegendary}
              onChange={(e) => {
                handleConfigChange('onlyLegendary', e.target.checked);
                if (e.target.checked) {
                  handleConfigChange('onlyMythical', false);
                  handleConfigChange('legendary', true);
                }
              }}
            />
            Only Legendary Monsters
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.onlyMythical}
              onChange={(e) => {
                handleConfigChange('onlyMythical', e.target.checked);
                if (e.target.checked) {
                  handleConfigChange('onlyLegendary', false);
                  handleConfigChange('mythical', true);
                }
              }}
            />
            Only Mythical Monsters
          </label>
        </div>
      </div>

      {/* Stage Configuration */}
      <div className="config-section">
        <h5>Stage & Rank Filters</h5>
        <p className="section-description">
          Select specific evolution stages or Digimon ranks. Leave empty for no restrictions.
        </p>

        <div className="config-row">
          <div className="form-group">
            <label>Evolution Stages</label>
            <div className="type-grid">
              {[1, 2, 3].map(stage => (
                <label key={stage} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(config.includeStages || []).includes(stage)}
                    onChange={() => handleArrayToggle('includeStages', stage)}
                  />
                  Stage {stage}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Configuration */}
      <div className="config-section">
        <h5>Quantity Limits</h5>

        <div className="config-row">
          <div className="form-group">
            <label htmlFor="species_max">Maximum Species</label>
            <input
              id="species_max"
              type="number"
              min="1"
              max="10"
              value={config.species_max || 2}
              onChange={(e) => handleConfigChange('species_max', parseInt(e.target.value) || 2)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="types_max">Maximum Types</label>
            <input
              id="types_max"
              type="number"
              min="1"
              max="5"
              value={config.types_max || 3}
              onChange={(e) => handleConfigChange('types_max', parseInt(e.target.value) || 3)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Type Restrictions */}
      <div className={`config-section ${collapsedSections.types ? 'collapsed' : ''}`}>
        <div className="config-section-header" onClick={() => toggleSection('types')}>
          <span className="collapse-icon">{collapsedSections.types ? '▶' : '▼'}</span>
          <h5>Type Restrictions</h5>
          {(config.includeTypes || []).length > 0 && (
            <span className="section-badge">{config.includeTypes.length} selected</span>
          )}
        </div>
        {!collapsedSections.types && (
          <div className="config-section-content">
            <p className="section-description">
              Select specific types to limit the roll to. Leave empty for no restrictions.
            </p>

            <div className="type-grid">
              {availableTypes.map(type => (
                <label key={type} className="type-checkbox">
                  <input
                    type="checkbox"
                    checked={(config.includeTypes || []).includes(type)}
                    onChange={() => handleArrayToggle('includeTypes', type)}
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

      {/* Attribute Restrictions */}
      <div className={`config-section ${collapsedSections.attributes ? 'collapsed' : ''}`}>
        <div className="config-section-header" onClick={() => toggleSection('attributes')}>
          <span className="collapse-icon">{collapsedSections.attributes ? '▶' : '▼'}</span>
          <h5>Attribute Restrictions</h5>
          {(config.includeAttributes || []).length > 0 && (
            <span className="section-badge">{config.includeAttributes.length} selected</span>
          )}
        </div>
        {!collapsedSections.attributes && (
          <div className="config-section-content">
            <p className="section-description">
              Select specific attributes to limit the roll to. Leave empty for no restrictions.
            </p>

            <div className="type-grid">
              {availableAttributes.map(attribute => (
                <label key={attribute} className="type-checkbox">
                  <input
                    type="checkbox"
                    checked={(config.includeAttributes || []).includes(attribute)}
                    onChange={() => handleArrayToggle('includeAttributes', attribute)}
                  />
                  <span className={`badge attribute-${attribute.toLowerCase()}`}>
                    {attribute}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monster Tables */}
      <div className="config-section">
        <h5>Monster Tables</h5>
        <p className="section-description">
          Select which monster databases to include in the roll.
        </p>

        <div className="config-row">
          <div className="type-grid tables-grid">
            {[
              { key: 'pokemon', label: 'Pokemon' },
              { key: 'digimon', label: 'Digimon' },
              { key: 'yokai', label: 'Yokai Watch' },
              { key: 'nexomon', label: 'Nexomon' },
              { key: 'pals', label: 'Palworld' },
              { key: 'fakemon', label: 'Fakemon' },
              { key: 'finalfantasy', label: 'Final Fantasy' },
              { key: 'monsterhunter', label: 'Monster Hunter' }
            ].map(table => (
              <label key={table.key} className="checkbox-label table-checkbox">
                <input
                  type="checkbox"
                  checked={(config.tables || []).includes(table.key)}
                  onChange={() => handleArrayToggle('tables', table.key)}
                />
                {table.label}
              </label>
            ))}
          </div>
        </div>
        <small className="form-help">
          Note: Monster Hunter uses "rank" (1-6) instead of evolution stages. Final Fantasy uses stages.
        </small>
      </div>

      {/* Advanced Configuration */}
      <div className={`config-section ${collapsedSections.advanced ? 'collapsed' : ''}`}>
        <div className="config-section-header" onClick={() => toggleSection('advanced')}>
          <span className="collapse-icon">{collapsedSections.advanced ? '▶' : '▼'}</span>
          <h5>Advanced Configuration</h5>
        </div>
        {!collapsedSections.advanced && (
          <div className="config-section-content">
            <p className="section-description">
              Advanced parameters for fine-tuning the monster roll.
            </p>

            <div className="config-row">
              <div className="form-group">
                <label htmlFor="species_min">Minimum Species</label>
                <input
                  id="species_min"
                  type="number"
                  min="1"
                  max="3"
                  value={config.species_min || 1}
                  onChange={(e) => handleConfigChange('species_min', parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="types_min">Minimum Types</label>
                <input
                  id="types_min"
                  type="number"
                  min="1"
                  max="5"
                  value={config.types_min || 1}
                  onChange={(e) => handleConfigChange('types_min', parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="config-row">
              <div className="form-group">
                <label htmlFor="custom_seed">Custom Seed (Optional)</label>
                <input
                  id="custom_seed"
                  type="text"
                  value={config.seed || ''}
                  onChange={(e) => handleConfigChange('seed', e.target.value)}
                  className="form-input"
                  placeholder="Leave empty for random seed"
                />
                <small className="form-help">Use the same seed to get consistent results</small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Summary */}
      <div className="config-summary">
        <h5>Configuration Summary</h5>
        <div className="summary-content">
          <p><strong>Rarity:</strong> {
            config.onlyMythical ? 'Only Mythicals' :
            config.onlyLegendary ? 'Only Legendaries' :
            config.mythical ? 'All rarities including Mythicals' :
            config.legendary ? 'Up to Legendary' :
            'Common to Rare only'
          }</p>
          <p><strong>Tables:</strong> {(config.tables || []).join(', ') || 'All'}</p>
          <p><strong>Species:</strong> {config.species_min || 1}-{config.species_max || 2}</p>
          <p><strong>Types:</strong> {config.types_min || 1}-{config.types_max || 3}</p>
          {config.includeStages && config.includeStages.length > 0 && (
            <p><strong>Stages:</strong> {config.includeStages.join(', ')}</p>
          )}
          {config.includeTypes && config.includeTypes.length > 0 && (
            <p><strong>Include Types:</strong> {config.includeTypes.join(', ')}</p>
          )}
          {config.excludeTypes && config.excludeTypes.length > 0 && (
            <p><strong>Exclude Types:</strong> {config.excludeTypes.join(', ')}</p>
          )}
          {config.includeAttributes && config.includeAttributes.length > 0 && (
            <p><strong>Include Attributes:</strong> {config.includeAttributes.join(', ')}</p>
          )}
          {config.excludeAttributes && config.excludeAttributes.length > 0 && (
            <p><strong>Exclude Attributes:</strong> {config.excludeAttributes.join(', ')}</p>
          )}
          {config.includeSpecies && config.includeSpecies.length > 0 && (
            <p><strong>Include Species:</strong> {config.includeSpecies.join(', ')}</p>
          )}
          {config.excludeSpecies && config.excludeSpecies.length > 0 && (
            <p><strong>Exclude Species:</strong> {config.excludeSpecies.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonsterRollConfigurator;
