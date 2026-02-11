import React from 'react';
import { FRANCHISE_CONFIG } from '../../services/speciesDatabaseService';

// Standard Pokemon types for type filters
const POKEMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

// Digimon ranks
const DIGIMON_RANKS = [
  'Baby', 'In-Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Ultra'
];

// Digimon attributes
const DIGIMON_ATTRIBUTES = [
  'Vaccine', 'Data', 'Virus', 'Free', 'Variable'
];

// Yokai tribes
const YOKAI_TRIBES = [
  'Brave', 'Mysterious', 'Tough', 'Charming', 'Heartful', 'Shady', 'Eerie', 'Slippery', 'Wicked', 'Legendary', 'Enma', 'Boss'
];

// Yokai ranks
const YOKAI_RANKS = [
  'E', 'D', 'C', 'B', 'A', 'S'
];

// Evolution stages
const EVOLUTION_STAGES = [
  'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
];

const FranchiseFilters = ({ franchise, filters, onFilterChange }) => {
  const config = FRANCHISE_CONFIG[franchise];

  if (!config || Object.keys(config.filters).length === 0) {
    return null;
  }

  const renderTypeFilter = (filterKey, label) => {
    const types = franchise === 'digimon' ? DIGIMON_ATTRIBUTES : POKEMON_TYPES;
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-fire"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderRankFilter = (filterKey, label) => {
    let ranks;
    if (franchise === 'digimon') {
      ranks = DIGIMON_RANKS;
    } else if (franchise === 'yokai') {
      ranks = YOKAI_RANKS;
    } else {
      ranks = ['1', '2', '3', '4', '5', '6'];
    }

    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-star"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Ranks</option>
          {ranks.map(rank => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderStageFilter = (filterKey, label) => {
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-layer-group"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Stages</option>
          {EVOLUTION_STAGES.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderTribeFilter = (filterKey, label) => {
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-users"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Tribes</option>
          {YOKAI_TRIBES.map(tribe => (
            <option key={tribe} value={tribe}>{tribe}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderAttributeFilter = (filterKey, label) => {
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-atom"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Attributes</option>
          {DIGIMON_ATTRIBUTES.map(attr => (
            <option key={attr} value={attr}>{attr}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderElementFilter = (filterKey, label) => {
    const elements = ['Fire', 'Water', 'Thunder', 'Ice', 'Dragon', 'None'];
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-bolt"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Elements</option>
          {elements.map(elem => (
            <option key={elem} value={elem}>{elem}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderBooleanFilter = (filterKey, label) => {
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group filter-group-boolean" key={filterKey}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={currentValue === 'true'}
            onChange={(e) => onFilterChange(filterKey, e.target.checked ? 'true' : '')}
          />
          <i className="fas fa-crown"></i> {label} Only
        </label>
      </div>
    );
  };

  const renderCategoryFilter = (filterKey, label) => {
    const categories = ['Starter', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical'];
    const currentValue = filters[filterKey] || '';

    return (
      <div className="filter-group" key={filterKey}>
        <label htmlFor={`filter-${filterKey}`}>
          <i className="fas fa-tags"></i> {label}
        </label>
        <select
          id={`filter-${filterKey}`}
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          className="form-input"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderFilter = (filterKey, filterConfig) => {
    const { label, type } = filterConfig;

    if (type === 'boolean') {
      return renderBooleanFilter(filterKey, label);
    }

    switch (filterKey) {
      case 'type':
        return renderTypeFilter(filterKey, label);
      case 'rank':
        return renderRankFilter(filterKey, label);
      case 'stage':
        return renderStageFilter(filterKey, label);
      case 'tribe':
        return renderTribeFilter(filterKey, label);
      case 'attribute':
        return renderAttributeFilter(filterKey, label);
      case 'element':
        return renderElementFilter(filterKey, label);
      case 'category':
        return renderCategoryFilter(filterKey, label);
      default:
        return null;
    }
  };

  const filterEntries = Object.entries(config.filters);

  if (filterEntries.length === 0) {
    return null;
  }

  return (
    <div className="franchise-filters">
      <div className="filter-row">
        {filterEntries.map(([filterKey, filterConfig]) =>
          renderFilter(filterKey, filterConfig)
        )}
      </div>
    </div>
  );
};

export default FranchiseFilters;
