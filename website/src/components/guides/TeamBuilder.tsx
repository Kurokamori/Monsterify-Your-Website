import { useState, useEffect, useCallback } from 'react';

interface TeamMember {
  id: number;
  name: string;
  types: string[];
  attribute: string;
}

interface TeamSummary {
  activeMonsters: number;
  weaknesses: Record<string, number>;
  resistances: Record<string, number>;
  immunities: Record<string, number>;
}

import { MONSTER_TYPES, MONSTER_ATTRIBUTES, TYPE_CHART } from '../../utils/staticValues';

const createEmptyTeam = (): TeamMember[] => [
  { id: 1, name: '', types: ['', '', '', '', ''], attribute: '' },
  { id: 2, name: '', types: ['', '', '', '', ''], attribute: '' },
  { id: 3, name: '', types: ['', '', '', '', ''], attribute: '' },
  { id: 4, name: '', types: ['', '', '', '', ''], attribute: '' },
  { id: 5, name: '', types: ['', '', '', '', ''], attribute: '' },
  { id: 6, name: '', types: ['', '', '', '', ''], attribute: '' }
];

export const TeamBuilder = () => {
  const [team, setTeam] = useState<TeamMember[]>(createEmptyTeam);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);

  const calculateMonsterEffectiveness = useCallback((monsterTypes: string[], attackingType: string): number => {
    const activeTypes = monsterTypes.filter(type => type !== '');
    if (activeTypes.length === 0) return 1.0;

    let effectiveness = 1.0;
    for (const defenderType of activeTypes) {
      if (TYPE_CHART[attackingType]?.[defenderType] !== undefined) {
        effectiveness *= TYPE_CHART[attackingType][defenderType];
      }
    }
    return effectiveness;
  }, []);

  const updateMonster = (monsterId: number, field: keyof TeamMember, value: string) => {
    setTeam(prevTeam =>
      prevTeam.map(monster =>
        monster.id === monsterId
          ? { ...monster, [field]: value }
          : monster
      )
    );
  };

  const updateMonsterType = (monsterId: number, typeIndex: number, value: string) => {
    setTeam(prevTeam =>
      prevTeam.map(monster =>
        monster.id === monsterId
          ? {
              ...monster,
              types: monster.types.map((type, index) =>
                index === typeIndex ? value : type
              )
            }
          : monster
      )
    );
  };

  const removeMonsterType = (monsterId: number, typeIndex: number) => {
    setTeam(prevTeam =>
      prevTeam.map(monster =>
        monster.id === monsterId
          ? {
              ...monster,
              types: monster.types.map((type, index) =>
                index === typeIndex ? '' : type
              )
            }
          : monster
      )
    );
  };

  const clearMonster = (monsterId: number) => {
    setTeam(prevTeam =>
      prevTeam.map(monster =>
        monster.id === monsterId
          ? { ...monster, name: '', types: ['', '', '', '', ''], attribute: '' }
          : monster
      )
    );
  };

  const clearAllMonsters = () => {
    setTeam(createEmptyTeam());
  };

  const calculateTeamSummary = useCallback(() => {
    const activeMonsters = team.filter(monster =>
      monster.types.some(type => type !== '') || monster.name !== ''
    );

    if (activeMonsters.length === 0) {
      setTeamSummary(null);
      return;
    }

    const teamWeaknesses: Record<string, number> = {};
    const teamResistances: Record<string, number> = {};
    const teamImmunities: Record<string, number> = {};

    for (const attackingType of MONSTER_TYPES) {
      let weakCount = 0;
      let resistantCount = 0;
      let immuneCount = 0;

      for (const monster of activeMonsters) {
        const effectiveness = calculateMonsterEffectiveness(monster.types, attackingType);
        if (effectiveness > 1) weakCount++;
        else if (effectiveness < 1 && effectiveness > 0) resistantCount++;
        else if (effectiveness === 0) immuneCount++;
      }

      if (weakCount > 0) teamWeaknesses[attackingType] = weakCount;
      if (resistantCount > 0) teamResistances[attackingType] = resistantCount;
      if (immuneCount > 0) teamImmunities[attackingType] = immuneCount;
    }

    setTeamSummary({
      activeMonsters: activeMonsters.length,
      weaknesses: teamWeaknesses,
      resistances: teamResistances,
      immunities: teamImmunities
    });
  }, [team, calculateMonsterEffectiveness]);

  useEffect(() => {
    calculateTeamSummary();
  }, [calculateTeamSummary]);

  const getEffectivenessText = (multiplier: number): string => {
    if (multiplier === 0) return '0\u00d7';
    if (multiplier === 0.25) return '\u00bc\u00d7';
    if (multiplier === 0.5) return '\u00bd\u00d7';
    if (multiplier === 1) return '1\u00d7';
    if (multiplier === 2) return '2\u00d7';
    if (multiplier === 4) return '4\u00d7';
    return `${multiplier}\u00d7`;
  };

  const getEffectivenessClass = (multiplier: number): string => {
    if (multiplier === 0) return 'immunity';
    if (multiplier < 1) return 'resistance';
    if (multiplier > 1) return 'weakness';
    return 'neutral';
  };

  const activeMonsters = team.filter(m => m.types.some(t => t !== '') || m.name !== '');

  return (
    <div className="team-builder">
      <div className="team-builder__header">
        <h2>Team Builder</h2>
        <p>Build a team of up to 6 monsters and analyze their combined type effectiveness</p>
        <button onClick={clearAllMonsters} className="button secondary">
          Clear All Monsters
        </button>
      </div>

      <div className="team-builder__table">
        <div className="team-builder__row team-builder__row--header">
          <div className="team-builder__col">Monster</div>
          <div className="team-builder__col">Name</div>
          <div className="team-builder__col">Attribute</div>
          <div className="team-builder__col">Types</div>
          <div className="team-builder__col">Preview</div>
          <div className="team-builder__col">Actions</div>
        </div>

        {team.map((monster) => (
          <div key={monster.id} className="team-builder__row">
            <div className="team-builder__col">
              <span className="team-builder__number">{monster.id}</span>
            </div>

            <div className="team-builder__col">
              <input
                type="text"
                value={monster.name}
                onChange={(e) => updateMonster(monster.id, 'name', e.target.value)}
                placeholder="Monster name"
                className="input"
              />
            </div>

            <div className="team-builder__col">
              <select
                value={monster.attribute}
                onChange={(e) => updateMonster(monster.id, 'attribute', e.target.value)}
                className="select"
              >
                <option value="">Attribute</option>
                {MONSTER_ATTRIBUTES.map(attr => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>

            <div className="team-builder__col">
              <div className="team-builder__types">
                {monster.types.map((type, typeIndex) => (
                  <div key={typeIndex} className="team-builder__type-input">
                    <select
                      value={type}
                      onChange={(e) => updateMonsterType(monster.id, typeIndex, e.target.value)}
                      className="select"
                    >
                      <option value="">Type {typeIndex + 1}</option>
                      {MONSTER_TYPES.map(availableType => (
                        <option key={availableType} value={availableType}>
                          {availableType}
                        </option>
                      ))}
                    </select>
                    {type && (
                      <button
                        onClick={() => removeMonsterType(monster.id, typeIndex)}
                        className="button secondary sm"
                        title="Remove Type"
                      >
                        \u00d7
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="team-builder__col">
              <div className="team-builder__badges">
                {monster.types.filter(type => type !== '').map((type, index) => (
                  <span key={index} className={`badge badge--type type-${type.toLowerCase()}`}>
                    {type}
                  </span>
                ))}
                {monster.attribute && (
                  <span className="badge badge--attribute">
                    {monster.attribute}
                  </span>
                )}
              </div>
            </div>

            <div className="team-builder__col">
              <button
                onClick={() => clearMonster(monster.id)}
                className="button secondary sm"
                title="Clear Monster"
              >
                \u00d7
              </button>
            </div>
          </div>
        ))}
      </div>

      {teamSummary && teamSummary.activeMonsters > 0 && (
        <div className="team-analysis">
          <h2>Team Analysis</h2>
          <div className="team-analysis__header">
            <p>Team with {teamSummary.activeMonsters} monster{teamSummary.activeMonsters !== 1 ? 's' : ''}</p>
          </div>

          <div className="effectiveness-chart">
            <h3>Type Effectiveness Chart</h3>
            <div className="effectiveness-chart__container">
              <table className="effectiveness-table">
                <thead>
                  <tr>
                    <th>Attacking Type</th>
                    {activeMonsters.map((monster) => (
                      <th key={monster.id} className="effectiveness-table__monster-col">
                        <div className="effectiveness-table__monster-header">
                          <div className="effectiveness-table__monster-name">
                            {monster.name || `Monster ${monster.id}`}
                          </div>
                          <div className="effectiveness-table__monster-types">
                            {monster.types.filter(t => t !== '').map((type, i) => (
                              <span key={i} className={`badge-mini type-${type.toLowerCase()}`}>
                                {type.charAt(0)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="effectiveness-table__total-col">Team Total</th>
                  </tr>
                </thead>
                <tbody>
                  {MONSTER_TYPES.map((attackingType) => {
                    let teamTotal = 0;

                    activeMonsters.forEach((monster) => {
                      const effectiveness = calculateMonsterEffectiveness(monster.types, attackingType);
                      if (effectiveness > 1) {
                        teamTotal -= 1;
                      } else if (effectiveness < 1) {
                        teamTotal += 1;
                      }
                    });

                    const getTotalClass = (total: number): string => {
                      if (total < 0) return 'team-weakness';
                      if (total > 0) return 'team-strength';
                      return 'team-neutral';
                    };

                    const getTotalDisplay = (total: number): string => {
                      if (total === 0) return '\u00b10';
                      return total > 0 ? `+${total}` : `${total}`;
                    };

                    return (
                      <tr key={attackingType}>
                        <td className="effectiveness-table__attacking-type">
                          <span className={`badge badge--type type-${attackingType.toLowerCase()}`}>
                            {attackingType}
                          </span>
                        </td>
                        {activeMonsters.map((monster) => {
                          const effectiveness = calculateMonsterEffectiveness(monster.types, attackingType);
                          return (
                            <td
                              key={monster.id}
                              className={`effectiveness-table__cell effectiveness-table__cell--${getEffectivenessClass(effectiveness)}`}
                            >
                              {getEffectivenessText(effectiveness)}
                            </td>
                          );
                        })}
                        <td className={`effectiveness-table__total-col effectiveness-table__total--${getTotalClass(teamTotal)}`}>
                          {getTotalDisplay(teamTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="team-summary">
            <h3>Team Weakness Summary</h3>
            <div className="team-summary__sections">
              <div className="team-summary__section">
                <h4>Team Weaknesses</h4>
                {Object.keys(teamSummary.weaknesses).length === 0 ? (
                  <p className="team-summary__empty">No shared weaknesses</p>
                ) : (
                  <div className="team-summary__items">
                    {Object.entries(teamSummary.weaknesses)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="team-summary__item team-summary__item--weakness">
                          <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                          <span className="team-summary__count">{count}/{teamSummary.activeMonsters} weak</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="team-summary__section">
                <h4>Team Resistances</h4>
                {Object.keys(teamSummary.resistances).length === 0 ? (
                  <p className="team-summary__empty">No shared resistances</p>
                ) : (
                  <div className="team-summary__items">
                    {Object.entries(teamSummary.resistances)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="team-summary__item team-summary__item--resistance">
                          <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                          <span className="team-summary__count">{count}/{teamSummary.activeMonsters} resist</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="team-summary__section">
                <h4>Team Immunities</h4>
                {Object.keys(teamSummary.immunities).length === 0 ? (
                  <p className="team-summary__empty">No shared immunities</p>
                ) : (
                  <div className="team-summary__items">
                    {Object.entries(teamSummary.immunities)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="team-summary__item team-summary__item--immunity">
                          <span className={`badge badge--type type-${type.toLowerCase()}`}>{type}</span>
                          <span className="team-summary__count">{count}/{teamSummary.activeMonsters} immune</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
