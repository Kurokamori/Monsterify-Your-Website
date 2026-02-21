import { useState, useEffect, useCallback, useRef } from 'react';

export interface MonsterRollConfig {
  tables: string[];
  enabledTables: string[];
  species1: string | null;
  species2: string | null;
  species3: string | null;
  includeSpecies1: string[];
  excludeSpecies1: string[];
  includeSpecies2: string[];
  excludeSpecies2: string[];
  includeSpecies3: string[];
  excludeSpecies3: string[];
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  includeType1: string[];
  excludeType1: string[];
  includeType2: string[];
  excludeType2: string[];
  includeType3: string[];
  excludeType3: string[];
  includeType4: string[];
  excludeType4: string[];
  includeType5: string[];
  excludeType5: string[];
  attribute: string | null;
  rarity: string | null;
  legendary: boolean;
  mythical: boolean;
  onlyLegendary: boolean;
  onlyMythical: boolean;
  includeStages: string[];
  excludeStages: string[];
  includeRanks: string[];
  excludeRanks: string[];
  includeSpecies: string[];
  excludeSpecies: string[];
  includeTypes: string[];
  excludeTypes: string[];
  speciesTypesOptions: string[];
  resultAttributeOptions: string[];
  includeAttributes: string[];
  excludeAttributes: string[];
  includeRarities: string[];
  excludeRarities: string[];
  customSelector: string | null;
  species_min: number;
  species_max: number;
  types_min: number;
  types_max: number;
  tableFilters: Record<string, unknown>;
  seed?: string;
  [key: string]: unknown;
}

interface MonsterRollConfiguratorProps {
  parameters?: Partial<MonsterRollConfig>;
  onChange: (config: MonsterRollConfig) => void;
}

interface PresetConfig {
  name: string;
  description: string;
  config: Partial<MonsterRollConfig>;
}

const DEFAULT_TABLES = ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'];

import { MONSTER_TYPES, MONSTER_ATTRIBUTES } from '../../utils/staticValues';

const TABLE_OPTIONS = [
  { key: 'pokemon', label: 'Pokemon' },
  { key: 'digimon', label: 'Digimon' },
  { key: 'yokai', label: 'Yokai Watch' },
  { key: 'nexomon', label: 'Nexomon' },
  { key: 'pals', label: 'Palworld' },
  { key: 'fakemon', label: 'Fakemon' },
  { key: 'finalfantasy', label: 'Final Fantasy' },
  { key: 'monsterhunter', label: 'Monster Hunter' }
];

// Evolution stages used by Pokemon, Nexomon, Fakemon, Final Fantasy
const EVOLUTION_STAGES = ['Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"];

// Digimon ranks (stored in the rank column, filtered via includeRanks)
const DIGIMON_RANKS = ['Baby I', 'Baby II', 'Child', 'Adult', 'Armor', 'Hybrid', 'Perfect', 'Ultimate'];

// Yokai Watch ranks (stored in the rank column, filtered via tableFilters)
const YOKAI_RANKS = ['S', 'A', 'B', 'C', 'D', 'E'];

// Monster Hunter ranks (stored as integers in the rank column)
const MONSTER_HUNTER_RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function getDefaultConfig(parameters: Partial<MonsterRollConfig> = {}): MonsterRollConfig {
  return {
    tables: [...DEFAULT_TABLES],
    enabledTables: [...DEFAULT_TABLES],
    species1: null, species2: null, species3: null,
    includeSpecies1: [], excludeSpecies1: [],
    includeSpecies2: [], excludeSpecies2: [],
    includeSpecies3: [], excludeSpecies3: [],
    type1: null, type2: null, type3: null, type4: null, type5: null,
    includeType1: [], excludeType1: [],
    includeType2: [], excludeType2: [],
    includeType3: [], excludeType3: [],
    includeType4: [], excludeType4: [],
    includeType5: [], excludeType5: [],
    attribute: null, rarity: null,
    legendary: false, mythical: false,
    onlyLegendary: false, onlyMythical: false,
    includeStages: [], excludeStages: [],
    includeRanks: [], excludeRanks: [],
    includeSpecies: [], excludeSpecies: [],
    includeTypes: [], excludeTypes: [],
    speciesTypesOptions: [],
    resultAttributeOptions: [],
    includeAttributes: [], excludeAttributes: [],
    includeRarities: [], excludeRarities: [],
    customSelector: null,
    species_min: 1, species_max: 2,
    types_min: 1, types_max: 3,
    tableFilters: {
      yokai: { includeRanks: [] as string[] },
      monsterhunter: { includeRanks: ['1', '2', '3'] },
    },
    ...parameters
  };
}

const PRESETS: PresetConfig[] = [
  {
    name: 'Basic Starter',
    description: 'Base stage monsters, no legendaries',
    config: {
      legendary: false, mythical: false, onlyLegendary: false, onlyMythical: false,
      includeStages: ['Base Stage'], includeRanks: ['Baby I', 'Baby II', 'Child'],
      tableFilters: { yokai: { includeRanks: ['E', 'D'] }, monsterhunter: { includeRanks: ['1', '2'] } },
      includeTypes: [], excludeTypes: [], speciesTypesOptions: [], resultAttributeOptions: [],
      species_max: 2, types_max: 3,
    }
  },
  {
    name: 'Standard Reward',
    description: 'Up to middle stage, no legendaries',
    config: {
      legendary: false, mythical: false, onlyLegendary: false, onlyMythical: false,
      includeStages: ['Base Stage', 'Middle Stage'], includeRanks: ['Baby I', 'Baby II', 'Child', 'Adult', 'Armor'],
      tableFilters: { yokai: { includeRanks: ['E', 'D', 'C', 'B'] }, monsterhunter: { includeRanks: ['1', '2', '3', '4'] } },
      includeTypes: [], excludeTypes: [], speciesTypesOptions: [], resultAttributeOptions: [],
      species_max: 2, types_max: 3,
    }
  },
  {
    name: 'Premium Reward',
    description: 'Any stage, legendaries allowed',
    config: {
      legendary: true, mythical: false, onlyLegendary: false, onlyMythical: false,
      includeStages: [], includeRanks: [],
      tableFilters: { yokai: { includeRanks: [] }, monsterhunter: { includeRanks: [] } },
      includeTypes: [], excludeTypes: [], speciesTypesOptions: [], resultAttributeOptions: [],
      species_max: 2, types_max: 3,
    }
  },
  {
    name: 'Only Legendaries',
    description: 'Legendary monsters only',
    config: {
      legendary: true, mythical: false, onlyLegendary: true, onlyMythical: false,
      includeStages: [], includeRanks: [],
      tableFilters: { yokai: { includeRanks: [] }, monsterhunter: { includeRanks: [] } },
      includeTypes: [], excludeTypes: [], speciesTypesOptions: [], resultAttributeOptions: [],
      species_max: 1, types_max: 3,
    }
  },
  {
    name: 'Only Mythicals',
    description: 'Mythical monsters only',
    config: {
      legendary: false, mythical: true, onlyLegendary: false, onlyMythical: true,
      includeStages: [], includeRanks: [],
      tableFilters: { yokai: { includeRanks: [] }, monsterhunter: { includeRanks: [] } },
      includeTypes: [], excludeTypes: [], speciesTypesOptions: [], resultAttributeOptions: [],
      species_max: 1, types_max: 3,
    }
  }
];

export function MonsterRollConfigurator({ parameters = {}, onChange }: MonsterRollConfiguratorProps) {
  const isInitialMount = useRef(true);
  const [collapsedSections, setCollapsedSections] = useState({
    advanced: true,
    types: false,
    attributes: false,
    resultTypes: true,
    resultAttributes: true,
  });

  const [config, setConfig] = useState<MonsterRollConfig>(() => getDefaultConfig(parameters));

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (Object.keys(config).length > 0) {
      onChange(config);
    }
  }, [config, onChange]);

  useEffect(() => {
    if (parameters && Object.keys(parameters).length > 0) {
      setConfig(prev => {
        const hasChanged = Object.keys(parameters).some(key => prev[key] !== parameters[key]);
        return hasChanged ? { ...prev, ...parameters } : prev;
      });
    }
  }, [parameters]);

  const handleConfigChange = useCallback((field: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleArrayToggle = useCallback((field: string, value: unknown) => {
    setConfig(prev => {
      const currentArray = (prev[field] as unknown[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  }, []);

  const handleTableRankToggle = useCallback((table: string, rank: string) => {
    setConfig(prev => {
      const tableFilters = { ...prev.tableFilters };
      const filter = (tableFilters[table] as { includeRanks?: string[] }) ?? {};
      const currentRanks = filter.includeRanks ?? [];
      const newRanks = currentRanks.includes(rank)
        ? currentRanks.filter(r => r !== rank)
        : [...currentRanks, rank];
      tableFilters[table] = { ...filter, includeRanks: newRanks };
      return { ...prev, tableFilters };
    });
  }, []);

  const applyPreset = useCallback((presetConfig: Partial<MonsterRollConfig>) => {
    setConfig(prev => ({ ...prev, ...presetConfig }));
  }, []);

  // Computed table-specific rank selections
  const yokaiRanks = ((config.tableFilters?.yokai as { includeRanks?: string[] })?.includeRanks) ?? [];
  const mhRanks = ((config.tableFilters?.monsterhunter as { includeRanks?: string[] })?.includeRanks) ?? [];

  return (
    <div className="reward-configurator">
      {/* Preset Configurations */}
      <div className="config-section">
        <h5>Quick Presets</h5>
        <div className="preset-buttons">
          {PRESETS.map((preset, index) => (
            <button key={index} type="button" onClick={() => applyPreset(preset.config)} className="button secondary" title={preset.description}>
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
            <input type="checkbox" checked={config.legendary} onChange={(e) => handleConfigChange('legendary', e.target.checked)} />
            Allow Legendary Monsters
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.mythical} onChange={(e) => handleConfigChange('mythical', e.target.checked)} />
            Allow Mythical Monsters
          </label>
        </div>
        <div className="config-row">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.onlyLegendary} onChange={(e) => {
              handleConfigChange('onlyLegendary', e.target.checked);
              if (e.target.checked) { handleConfigChange('onlyMythical', false); handleConfigChange('legendary', true); }
            }} />
            Only Legendary Monsters
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.onlyMythical} onChange={(e) => {
              handleConfigChange('onlyMythical', e.target.checked);
              if (e.target.checked) { handleConfigChange('onlyLegendary', false); handleConfigChange('mythical', true); }
            }} />
            Only Mythical Monsters
          </label>
        </div>
      </div>

      {/* Stage & Rank Configuration */}
      <div className="config-section">
        <h5>Stage &amp; Rank Filters</h5>
        <p className="section-description">Select specific evolution stages or ranks per franchise. Leave empty for no restrictions.</p>
        <div className="config-row">
          <div className="form-group">
            <label>Evolution Stages <small className="form-help-text">(Pokemon, Nexomon, Fakemon, Final Fantasy)</small></label>
            <div className="type-grid">
              {EVOLUTION_STAGES.map(stage => (
                <label key={stage} className="checkbox-label">
                  <input type="checkbox" checked={(config.includeStages || []).includes(stage)} onChange={() => handleArrayToggle('includeStages', stage)} />
                  {stage}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="config-row">
          <div className="form-group">
            <label>Digimon Ranks</label>
            <div className="type-grid">
              {DIGIMON_RANKS.map(rank => (
                <label key={rank} className="checkbox-label">
                  <input type="checkbox" checked={(config.includeRanks || []).includes(rank)} onChange={() => handleArrayToggle('includeRanks', rank)} />
                  {rank}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="config-row">
          <div className="form-group">
            <label>Yokai Watch Ranks</label>
            <div className="type-grid">
              {YOKAI_RANKS.map(rank => (
                <label key={rank} className="checkbox-label">
                  <input type="checkbox" checked={yokaiRanks.includes(rank)} onChange={() => handleTableRankToggle('yokai', rank)} />
                  Rank {rank}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="config-row">
          <div className="form-group">
            <label>Monster Hunter Ranks</label>
            <div className="type-grid">
              {MONSTER_HUNTER_RANKS.map(rank => (
                <label key={rank} className="checkbox-label">
                  <input type="checkbox" checked={mhRanks.includes(rank)} onChange={() => handleTableRankToggle('monsterhunter', rank)} />
                  Rank {rank}
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
            <input id="species_max" type="number" min="1" max="10" value={config.species_max || 2} onChange={(e) => handleConfigChange('species_max', parseInt(e.target.value) || 2)} className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="types_max">Maximum Types</label>
            <input id="types_max" type="number" min="1" max="5" value={config.types_max || 3} onChange={(e) => handleConfigChange('types_max', parseInt(e.target.value) || 3)} className="form-input" />
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
            <p className="section-description">Select specific types to limit the roll to. Leave empty for no restrictions.</p>
            <div className="type-grid">
              {MONSTER_TYPES.map(type => (
                <label key={type} className="type-checkbox">
                  <input type="checkbox" checked={(config.includeTypes || []).includes(type)} onChange={() => handleArrayToggle('includeTypes', type)} />
                  <span className={`badge type-${type.toLowerCase()}`}>{type}</span>
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
            <p className="section-description">Select specific attributes to limit the roll to. Leave empty for no restrictions.</p>
            <div className="type-grid">
              {MONSTER_ATTRIBUTES.map(attribute => (
                <label key={attribute} className="type-checkbox">
                  <input type="checkbox" checked={(config.includeAttributes || []).includes(attribute)} onChange={() => handleArrayToggle('includeAttributes', attribute)} />
                  <span className={`badge attribute-${attribute.toLowerCase()}`}>{attribute}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Type Restrictions */}
      <div className={`config-section ${collapsedSections.resultTypes ? 'collapsed' : ''}`}>
        <div className="config-section-header" onClick={() => toggleSection('resultTypes')}>
          <span className="collapse-icon">{collapsedSections.resultTypes ? '▶' : '▼'}</span>
          <h5>Result Type Restrictions</h5>
          {(config.speciesTypesOptions || []).length > 0 && (
            <span className="section-badge">{config.speciesTypesOptions.length} selected</span>
          )}
        </div>
        {!collapsedSections.resultTypes && (
          <div className="config-section-content">
            <p className="section-description">Limit what types the resulting monster can be assigned. Leave empty for all types.</p>
            <div className="type-grid">
              {MONSTER_TYPES.map(type => (
                <label key={type} className="type-checkbox">
                  <input type="checkbox" checked={(config.speciesTypesOptions || []).includes(type)} onChange={() => handleArrayToggle('speciesTypesOptions', type)} />
                  <span className={`badge type-${type.toLowerCase()}`}>{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Attribute Restrictions */}
      <div className={`config-section ${collapsedSections.resultAttributes ? 'collapsed' : ''}`}>
        <div className="config-section-header" onClick={() => toggleSection('resultAttributes')}>
          <span className="collapse-icon">{collapsedSections.resultAttributes ? '▶' : '▼'}</span>
          <h5>Result Attribute Restrictions</h5>
          {(config.resultAttributeOptions || []).length > 0 && (
            <span className="section-badge">{config.resultAttributeOptions.length} selected</span>
          )}
        </div>
        {!collapsedSections.resultAttributes && (
          <div className="config-section-content">
            <p className="section-description">Limit what attributes the resulting monster can be assigned. Leave empty for all attributes.</p>
            <div className="type-grid">
              {MONSTER_ATTRIBUTES.map(attribute => (
                <label key={attribute} className="type-checkbox">
                  <input type="checkbox" checked={(config.resultAttributeOptions || []).includes(attribute)} onChange={() => handleArrayToggle('resultAttributeOptions', attribute)} />
                  <span className={`badge attribute-${attribute.toLowerCase()}`}>{attribute}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monster Tables */}
      <div className="config-section">
        <h5>Monster Tables</h5>
        <p className="section-description">Select which monster databases to include in the roll.</p>
        <div className="config-row">
          <div className="type-grid tables-grid">
            {TABLE_OPTIONS.map(table => (
              <label key={table.key} className="checkbox-label table-checkbox">
                <input type="checkbox" checked={(config.tables || []).includes(table.key)} onChange={() => handleArrayToggle('tables', table.key)} />
                {table.label}
              </label>
            ))}
          </div>
        </div>
        <small className="form-help-text">Note: Tables without evolution stages or ranks (e.g. Palworld) are unaffected by stage/rank filters.</small>
      </div>

      {/* Advanced Configuration */}
      <div className={`config-section ${collapsedSections.advanced ? 'collapsed' : ''}`}>
        <div className="config-section-header" onClick={() => toggleSection('advanced')}>
          <span className="collapse-icon">{collapsedSections.advanced ? '▶' : '▼'}</span>
          <h5>Advanced Configuration</h5>
        </div>
        {!collapsedSections.advanced && (
          <div className="config-section-content">
            <p className="section-description">Advanced parameters for fine-tuning the monster roll.</p>
            <div className="config-row">
              <div className="form-group">
                <label htmlFor="species_min">Minimum Species</label>
                <input id="species_min" type="number" min="1" max="3" value={config.species_min || 1} onChange={(e) => handleConfigChange('species_min', parseInt(e.target.value) || 1)} className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="types_min">Minimum Types</label>
                <input id="types_min" type="number" min="1" max="5" value={config.types_min || 1} onChange={(e) => handleConfigChange('types_min', parseInt(e.target.value) || 1)} className="form-input" />
              </div>
            </div>
            <div className="config-row">
              <div className="form-group">
                <label htmlFor="custom_seed">Custom Seed (Optional)</label>
                <input id="custom_seed" type="text" value={config.seed || ''} onChange={(e) => handleConfigChange('seed', e.target.value)} className="form-input" placeholder="Leave empty for random seed" />
                <small className="form-help-text">Use the same seed to get consistent results</small>
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
          {config.includeRanks && config.includeRanks.length > 0 && (
            <p><strong>Digimon Ranks:</strong> {config.includeRanks.join(', ')}</p>
          )}
          {yokaiRanks.length > 0 && (
            <p><strong>Yokai Ranks:</strong> {yokaiRanks.join(', ')}</p>
          )}
          {mhRanks.length > 0 && (
            <p><strong>MH Ranks:</strong> {mhRanks.join(', ')}</p>
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
          {config.speciesTypesOptions && config.speciesTypesOptions.length > 0 && (
            <p><strong>Result Types:</strong> {config.speciesTypesOptions.join(', ')}</p>
          )}
          {config.resultAttributeOptions && config.resultAttributeOptions.length > 0 && (
            <p><strong>Result Attributes:</strong> {config.resultAttributeOptions.join(', ')}</p>
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
}

