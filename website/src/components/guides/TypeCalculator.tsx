import { useState, useEffect, useCallback } from 'react';

interface CalculatorResults {
  weaknesses: Record<string, number>;
  resistances: Record<string, number>;
  immunities: Record<string, number>;
  strongAgainst: Record<string, number>;
  types: string[];
}

import { MONSTER_TYPES, TYPE_CHART } from '../../utils/staticValues';

export const TypeCalculator = () => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['', '', '', '', '', '']);
  const [results, setResults] = useState<CalculatorResults | null>(null);

  const handleTypeChange = (index: number, newType: string) => {
    const newTypes = [...selectedTypes];
    newTypes[index] = newType;
    setSelectedTypes(newTypes);
  };

  const removeType = (index: number) => {
    const newTypes = [...selectedTypes];
    newTypes[index] = '';
    setSelectedTypes(newTypes);
  };

  const clearAll = () => {
    setSelectedTypes(['', '', '', '', '', '']);
    setResults(null);
  };

  const calculateEffectiveness = useCallback(() => {
    const activeTypes = selectedTypes.filter(type => type !== '');
    if (activeTypes.length === 0) {
      setResults(null);
      return;
    }

    const weaknesses: Record<string, number> = {};
    const resistances: Record<string, number> = {};
    const immunities: Record<string, number> = {};

    for (const attackingType of MONSTER_TYPES) {
      let effectiveness = 1.0;

      for (const defenderType of activeTypes) {
        if (TYPE_CHART[attackingType]?.[defenderType] !== undefined) {
          effectiveness *= TYPE_CHART[attackingType][defenderType];
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

    const strongAgainst: Record<string, number> = {};
    for (const defendingType of MONSTER_TYPES) {
      let maxEffectiveness = 1.0;

      for (const attackerType of activeTypes) {
        if (TYPE_CHART[attackerType]?.[defendingType] !== undefined) {
          const currentEffectiveness = TYPE_CHART[attackerType][defendingType];
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
  }, [selectedTypes]);

  useEffect(() => {
    calculateEffectiveness();
  }, [calculateEffectiveness]);

  const getEffectivenessText = (multiplier: number): string => {
    if (multiplier === 0) return '0x';
    if (multiplier === 0.25) return '\u00bcx';
    if (multiplier === 0.5) return '\u00bdx';
    if (multiplier === 1) return '1x';
    if (multiplier === 2) return '2x';
    if (multiplier === 4) return '4x';
    return `${multiplier}x`;
  };

  const getEffectivenessClass = (multiplier: number): string => {
    if (multiplier === 0) return 'immunity';
    if (multiplier < 1) return 'resistance';
    if (multiplier > 1) return 'weakness';
    return 'neutral';
  };

  return (
    <div className="type-calculator">
      <div className="type-calculator__header">
        <h2>Type Effectiveness Calculator</h2>
        <p>Select up to 6 types to see the combined weaknesses, resistances, and strengths</p>
      </div>

      <div className="type-calculator__selectors">
        {selectedTypes.map((type, index) => (
          <div key={index} className="type-calculator__selector">
            <label>Type {index + 1}:</label>
            <div className="type-calculator__input-group">
              <select
                value={type}
                onChange={(e) => handleTypeChange(index, e.target.value)}
                className="select"
              >
                <option value="">Select Type</option>
                {MONSTER_TYPES.map(availableType => (
                  <option key={availableType} value={availableType}>
                    {availableType}
                  </option>
                ))}
              </select>
              {type && (
                <button
                  onClick={() => removeType(index)}
                  className="button danger sm"
                  title="Remove Type"
                >
                  \u00d7
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="type-calculator__actions">
        <button onClick={clearAll} className="button secondary">
          Clear All Types
        </button>
      </div>

      {results && results.types.length > 0 && (
        <div className="type-calculator__results">
          <div className="type-calculator__selected">
            <h3>Selected Types:</h3>
            <div className="type-calculator__selected-types">
              {results.types.map((type, index) => (
                <span key={index} className={`badge badge--type type-${type.toLowerCase()}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="type-calculator__sections">
            <div className="type-calculator__section">
              <h3>Weaknesses (Takes More Damage From):</h3>
              {Object.keys(results.weaknesses).length === 0 ? (
                <p className="type-calculator__empty">No weaknesses</p>
              ) : (
                <div className="type-calculator__items">
                  {Object.entries(results.weaknesses)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, multiplier]) => (
                      <div key={type} className={`type-calculator__item type-calculator__item--${getEffectivenessClass(multiplier)}`}>
                        <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                        <span className="type-calculator__multiplier">{getEffectivenessText(multiplier)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="type-calculator__section">
              <h3>Resistances (Takes Less Damage From):</h3>
              {Object.keys(results.resistances).length === 0 ? (
                <p className="type-calculator__empty">No resistances</p>
              ) : (
                <div className="type-calculator__items">
                  {Object.entries(results.resistances)
                    .sort(([, a], [, b]) => a - b)
                    .map(([type, multiplier]) => (
                      <div key={type} className={`type-calculator__item type-calculator__item--${getEffectivenessClass(multiplier)}`}>
                        <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                        <span className="type-calculator__multiplier">{getEffectivenessText(multiplier)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="type-calculator__section">
              <h3>Immunities (Takes No Damage From):</h3>
              {Object.keys(results.immunities).length === 0 ? (
                <p className="type-calculator__empty">No immunities</p>
              ) : (
                <div className="type-calculator__items">
                  {Object.entries(results.immunities).map(([type, multiplier]) => (
                    <div key={type} className={`type-calculator__item type-calculator__item--${getEffectivenessClass(multiplier)}`}>
                      <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                      <span className="type-calculator__multiplier">{getEffectivenessText(multiplier)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="type-calculator__section">
              <h3>Strong Against (Deals More Damage To):</h3>
              {Object.keys(results.strongAgainst).length === 0 ? (
                <p className="type-calculator__empty">No super effective matchups</p>
              ) : (
                <div className="type-calculator__items">
                  {Object.entries(results.strongAgainst)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, multiplier]) => (
                      <div key={type} className={`type-calculator__item type-calculator__item--${getEffectivenessClass(multiplier)}`}>
                        <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                        <span className="type-calculator__multiplier">{getEffectivenessText(multiplier)}</span>
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
