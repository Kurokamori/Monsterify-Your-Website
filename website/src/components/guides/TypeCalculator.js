import React, { useState, useEffect } from 'react';

const TypeCalculator = () => {
  const [selectedTypes, setSelectedTypes] = useState(['', '', '', '', '', '']);
  const [results, setResults] = useState(null);

  const availableTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 
    'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 
    'Dragon', 'Dark', 'Steel', 'Fairy'
  ];

  const typeChart = {
    'Normal': { 'Rock': 0.5, 'Ghost': 0, 'Steel': 0.5 },
    'Fire': { 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 2, 'Bug': 2, 'Rock': 0.5, 'Dragon': 0.5, 'Steel': 2 },
    'Water': { 'Fire': 2, 'Water': 0.5, 'Grass': 0.5, 'Ground': 2, 'Rock': 2, 'Dragon': 0.5 },
    'Electric': { 'Water': 2, 'Electric': 0.5, 'Grass': 0.5, 'Ground': 0, 'Flying': 2, 'Dragon': 0.5 },
    'Grass': { 'Fire': 0.5, 'Water': 2, 'Grass': 0.5, 'Poison': 0.5, 'Ground': 2, 'Flying': 0.5, 'Bug': 0.5, 'Rock': 2, 'Dragon': 0.5, 'Steel': 0.5 },
    'Ice': { 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 0.5, 'Ground': 2, 'Flying': 2, 'Dragon': 2, 'Steel': 0.5 },
    'Fighting': { 'Normal': 2, 'Ice': 2, 'Poison': 0.5, 'Flying': 0.5, 'Psychic': 0.5, 'Bug': 0.5, 'Rock': 2, 'Ghost': 0, 'Dark': 2, 'Steel': 2, 'Fairy': 0.5 },
    'Poison': { 'Grass': 2, 'Poison': 0.5, 'Ground': 0.5, 'Rock': 0.5, 'Ghost': 0.5, 'Steel': 0, 'Fairy': 2 },
    'Ground': { 'Fire': 2, 'Electric': 2, 'Grass': 0.5, 'Poison': 2, 'Flying': 0, 'Bug': 0.5, 'Rock': 2, 'Steel': 2 },
    'Flying': { 'Electric': 0.5, 'Grass': 2, 'Ice': 0.5, 'Fighting': 2, 'Bug': 2, 'Rock': 0.5, 'Steel': 0.5 },
    'Psychic': { 'Fighting': 2, 'Poison': 2, 'Psychic': 0.5, 'Dark': 0, 'Steel': 0.5 },
    'Bug': { 'Fire': 0.5, 'Grass': 2, 'Fighting': 0.5, 'Poison': 0.5, 'Flying': 0.5, 'Psychic': 2, 'Ghost': 0.5, 'Dark': 2, 'Steel': 0.5, 'Fairy': 0.5 },
    'Rock': { 'Fire': 2, 'Ice': 2, 'Fighting': 0.5, 'Ground': 0.5, 'Flying': 2, 'Bug': 2, 'Steel': 0.5 },
    'Ghost': { 'Normal': 0, 'Psychic': 2, 'Ghost': 2, 'Dark': 0.5 },
    'Dragon': { 'Dragon': 2, 'Steel': 0.5, 'Fairy': 0 },
    'Dark': { 'Fighting': 0.5, 'Psychic': 2, 'Ghost': 2, 'Dark': 0.5, 'Fairy': 0.5 },
    'Steel': { 'Fire': 0.5, 'Water': 0.5, 'Electric': 0.5, 'Ice': 2, 'Rock': 2, 'Steel': 0.5, 'Fairy': 2 },
    'Fairy': { 'Fire': 0.5, 'Fighting': 2, 'Poison': 0.5, 'Dragon': 2, 'Dark': 2, 'Steel': 0.5 }
  };

  const handleTypeChange = (index, newType) => {
    const newTypes = [...selectedTypes];
    newTypes[index] = newType;
    setSelectedTypes(newTypes);
  };

  const removeType = (index) => {
    const newTypes = [...selectedTypes];
    newTypes[index] = '';
    setSelectedTypes(newTypes);
  };

  const clearAll = () => {
    setSelectedTypes(['', '', '', '', '', '']);
    setResults(null);
  };

  const calculateEffectiveness = () => {
    const activeTypes = selectedTypes.filter(type => type !== '');
    if (activeTypes.length === 0) {
      setResults(null);
      return;
    }

    const weaknesses = {};
    const resistances = {};
    const immunities = {};

    for (const attackingType of availableTypes) {
      let effectiveness = 1.0;
      
      for (const defenderType of activeTypes) {
        if (typeChart[attackingType] && typeChart[attackingType][defenderType] !== undefined) {
          effectiveness *= typeChart[attackingType][defenderType];
        }
      }

      if (effectiveness > 1) {
        weaknesses[attackingType] = effectiveness;
      } else if (effectiveness < 1 && effectiveness > 0) {
        resistances[attackingType] = effectiveness;
      } else if (effectiveness === 0) {
        immunities[attackingType] = effectiveness;
      }
    }

    const strongAgainst = {};
    for (const defendingType of availableTypes) {
      let maxEffectiveness = 1.0;
      
      for (const attackerType of activeTypes) {
        if (typeChart[attackerType] && typeChart[attackerType][defendingType] !== undefined) {
          const currentEffectiveness = typeChart[attackerType][defendingType];
          if (currentEffectiveness > maxEffectiveness) {
            maxEffectiveness = currentEffectiveness;
          }
        }
      }
      
      if (maxEffectiveness > 1) {
        strongAgainst[defendingType] = maxEffectiveness;
      }
    }

    setResults({
      weaknesses,
      resistances,
      immunities,
      strongAgainst,
      types: activeTypes
    });
  };

  useEffect(() => {
    calculateEffectiveness();
  }, [selectedTypes]);

  const getEffectivenessText = (multiplier) => {
    if (multiplier === 0) return "0x";
    if (multiplier === 0.25) return "¼x";
    if (multiplier === 0.5) return "½x";
    if (multiplier === 1) return "1x";
    if (multiplier === 2) return "2x";
    if (multiplier === 4) return "4x";
    return `${multiplier}x`;
  };

  const getEffectivenessClass = (multiplier) => {
    if (multiplier === 0) return "immunity";
    if (multiplier < 1) return "resistance";
    if (multiplier > 1) return "weakness";
    return "neutral";
  };

  return (
    <div className="type-calculator">
      <div className="calculator-header">
        <h2>Type Effectiveness Calculator</h2>
        <p>Select up to 6 types to see the combined weaknesses, resistances, and strengths</p>
      </div>

      <div className="adopts-grid">
        {selectedTypes.map((type, index) => (
          <div key={index} className="type-selector">
            <label>Type {index + 1}:</label>
            <div className="type-input-group">
              <select 
                value={type} 
                onChange={(e) => handleTypeChange(index, e.target.value)}
                className="form-input"
              >
                <option value="">Select Type</option>
                {availableTypes.map(availableType => (
                  <option key={availableType} value={availableType}>
                    {availableType}
                  </option>
                ))}
              </select>
              {type && (
                <button 
                  onClick={() => removeType(index)}
                  className="button danger icon sm"
                  title="Remove Type"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="calculator-actions">
        <button onClick={clearAll} className="button secondary">
          Clear All Types
        </button>
      </div>

      {results && results.types.length > 0 && (
        <div className="results-section">
          <div className="effectiveness-chart">
            <h3>Selected Types:</h3>
            <div className="type-badges">
              {results.types.map((type, index) => (
                <span key={index} className={`type-badge type-${type.toLowerCase()}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="button">
            <div className="type-selector">
              <h3>Weaknesses (Takes More Damage From):</h3>
              {Object.keys(results.weaknesses).length === 0 ? (
                <p className="no-results">No weaknesses</p>
              ) : (
                <div className="type-tags">
                  {Object.entries(results.weaknesses)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, multiplier]) => (
                    <div key={type} className={`summary-item${getEffectivenessClass(multiplier)}`}>
                      <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                      <span className="multiplier">{getEffectivenessText(multiplier)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="type-selector">
              <h3>Resistances (Takes Less Damage From):</h3>
              {Object.keys(results.resistances).length === 0 ? (
                <p className="no-results">No resistances</p>
              ) : (
                <div className="type-tags">
                  {Object.entries(results.resistances)
                    .sort(([,a], [,b]) => a - b)
                    .map(([type, multiplier]) => (
                    <div key={type} className={`summary-item${getEffectivenessClass(multiplier)}`}>
                      <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                      <span className="multiplier">{getEffectivenessText(multiplier)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="type-selector">
              <h3>Immunities (Takes No Damage From):</h3>
              {Object.keys(results.immunities).length === 0 ? (
                <p className="no-results">No immunities</p>
              ) : (
                <div className="type-tags">
                  {Object.entries(results.immunities).map(([type, multiplier]) => (
                    <div key={type} className={`summary-item${getEffectivenessClass(multiplier)}`}>
                      <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                      <span className="multiplier">{getEffectivenessText(multiplier)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="type-selector">
              <h3>Strong Against (Deals More Damage To):</h3>
              {Object.keys(results.strongAgainst).length === 0 ? (
                <p className="no-results">No super effective matchups</p>
              ) : (
                <div className="type-tags">
                  {Object.entries(results.strongAgainst)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, multiplier]) => (
                    <div key={type} className={`summary-item${getEffectivenessClass(multiplier)}`}>
                      <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                      <span className="multiplier">{getEffectivenessText(multiplier)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeCalculator;