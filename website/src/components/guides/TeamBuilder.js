import React, { useState, useEffect } from 'react';
import './TeamBuilder.css';

const TeamBuilder = () => {
  const [team, setTeam] = useState([
    { id: 1, name: '', types: ['', '', '', '', ''], attribute: '' },
    { id: 2, name: '', types: ['', '', '', '', ''], attribute: '' },
    { id: 3, name: '', types: ['', '', '', '', ''], attribute: '' },
    { id: 4, name: '', types: ['', '', '', '', ''], attribute: '' },
    { id: 5, name: '', types: ['', '', '', '', ''], attribute: '' },
    { id: 6, name: '', types: ['', '', '', '', ''], attribute: '' }
  ]);

  const [teamSummary, setTeamSummary] = useState(null);

  const availableTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 
    'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 
    'Dragon', 'Dark', 'Steel', 'Fairy'
  ];

  const availableAttributes = [
    'Virus', 'Vaccine', 'Data', 'Free', 'Variable'
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

  const calculateMonsterEffectiveness = (monsterTypes, attackingType) => {
    const activeTypes = monsterTypes.filter(type => type !== '');
    if (activeTypes.length === 0) return 1.0;

    let effectiveness = 1.0;
    for (const defenderType of activeTypes) {
      if (typeChart[attackingType] && typeChart[attackingType][defenderType] !== undefined) {
        effectiveness *= typeChart[attackingType][defenderType];
      }
    }
    return effectiveness;
  };

  const updateMonster = (monsterId, field, value) => {
    setTeam(prevTeam => 
      prevTeam.map(monster => 
        monster.id === monsterId 
          ? { ...monster, [field]: value }
          : monster
      )
    );
  };

  const updateMonsterType = (monsterId, typeIndex, value) => {
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

  const removeMonsterType = (monsterId, typeIndex) => {
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

  const clearMonster = (monsterId) => {
    setTeam(prevTeam => 
      prevTeam.map(monster => 
        monster.id === monsterId 
          ? { ...monster, name: '', types: ['', '', '', '', ''], attribute: '' }
          : monster
      )
    );
  };

  const clearAllMonsters = () => {
    setTeam(team.map(monster => ({
      ...monster,
      name: '',
      types: ['', '', '', '', ''],
      attribute: ''
    })));
  };

  const calculateTeamSummary = () => {
    const activeMonsters = team.filter(monster => 
      monster.types.some(type => type !== '') || monster.name !== ''
    );

    if (activeMonsters.length === 0) {
      setTeamSummary(null);
      return;
    }

    const teamWeaknesses = {};
    const teamResistances = {};
    const teamImmunities = {};

    // Count how many team members are weak/resistant to each type
    for (const attackingType of availableTypes) {
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
  };

  useEffect(() => {
    calculateTeamSummary();
  }, [team]);

  const getEffectivenessText = (multiplier) => {
    if (multiplier === 0) return "0×";
    if (multiplier === 0.25) return "¼×";
    if (multiplier === 0.5) return "½×";
    if (multiplier === 1) return "1×";
    if (multiplier === 2) return "2×";
    if (multiplier === 4) return "4×";
    return `${multiplier}×`;
  };

  const getEffectivenessClass = (multiplier) => {
    if (multiplier === 0) return "immunity";
    if (multiplier < 1) return "resistance";
    if (multiplier > 1) return "weakness";
    return "neutral";
  };

  return (
    <div className="team-builder">
      <div className="team-builder-header">
        <h2>Team Builder</h2>
        <p>Build a team of up to 6 monsters and analyze their combined type effectiveness</p>
        <button onClick={clearAllMonsters} className="clear-team-btn">
          Clear All Monsters
        </button>
      </div>

      <div className="monsters-table">
        <div className="monsters-header">
          <div className="monster-number-col">Monster</div>
          <div className="monster-name-col">Name</div>
          <div className="monster-attribute-col">Attribute</div>
          <div className="monster-types-col">Types</div>
          <div className="monster-preview-col">Preview</div>
          <div className="monster-actions-col">Actions</div>
        </div>
        
        {team.map((monster) => (
          <div key={monster.id} className="monster-row">
            <div className="monster-number-col">
              <span className="monster-number">{monster.id}</span>
            </div>
            
            <div className="monster-name-col">
              <input
                type="text"
                value={monster.name}
                onChange={(e) => updateMonster(monster.id, 'name', e.target.value)}
                placeholder="Monster name"
                className="monster-name-input"
              />
            </div>

            <div className="monster-attribute-col">
              <select
                value={monster.attribute}
                onChange={(e) => updateMonster(monster.id, 'attribute', e.target.value)}
                className="attribute-select"
              >
                <option value="">Attribute</option>
                {availableAttributes.map(attr => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>

            <div className="monster-types-col">
              <div className="types-inputs">
                {monster.types.map((type, typeIndex) => (
                  <div key={typeIndex} className="type-input-group">
                    <select
                      value={type}
                      onChange={(e) => updateMonsterType(monster.id, typeIndex, e.target.value)}
                      className="type-select-small"
                    >
                      <option value="">Type {typeIndex + 1}</option>
                      {availableTypes.map(availableType => (
                        <option key={availableType} value={availableType}>
                          {availableType}
                        </option>
                      ))}
                    </select>
                    {type && (
                      <button
                        onClick={() => removeMonsterType(monster.id, typeIndex)}
                        className="remove-type-btn-small"
                        title="Remove Type"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="monster-preview-col">
              <div className="monster-badges">
                {monster.types.filter(type => type !== '').map((type, index) => (
                  <span key={index} className={`type-badge type-${type.toLowerCase()}`}>
                    {type}
                  </span>
                ))}
                {monster.attribute && (
                  <span className="attribute-badge">
                    {monster.attribute}
                  </span>
                )}
              </div>
            </div>

            <div className="monster-actions-col">
              <button 
                onClick={() => clearMonster(monster.id)}
                className="clear-monster-btn"
                title="Clear Monster"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {teamSummary && teamSummary.activeMonsters > 0 && (
        <div className="team-analysis">
          <h2>Team Analysis</h2>
          <div className="analysis-header">
            <p>Team with {teamSummary.activeMonsters} monster{teamSummary.activeMonsters !== 1 ? 's' : ''}</p>
          </div>

          <div className="effectiveness-chart">
            <h3>Type Effectiveness Chart</h3>
            <div className="team-chart-container">
              <table className="effectiveness-table">
                <thead>
                  <tr>
                    <th>Attacking Type</th>
                    {team.filter(m => m.types.some(t => t !== '') || m.name !== '').map((monster) => (
                      <th key={monster.id} className="monster-column">
                        <div className="monster-header-cell">
                          <div className="monster-name">
                            {monster.name || `Monster ${monster.id}`}
                          </div>
                          <div className="monster-types-small">
                            {monster.types.filter(t => t !== '').map((type, i) => (
                              <span key={i} className={`type-badge-mini type-${type.toLowerCase()}`}>
                                {type.charAt(0)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="team-total-column">Team Total</th>
                  </tr>
                </thead>
                <tbody>
                  {availableTypes.map((attackingType) => {
                    const activeMonsters = team.filter(m => m.types.some(t => t !== '') || m.name !== '');
                    let teamTotal = 0;
                    
                    // Calculate team total: -1 for weakness, +1 for resistance/immunity
                    activeMonsters.forEach((monster) => {
                      const effectiveness = calculateMonsterEffectiveness(monster.types, attackingType);
                      if (effectiveness > 1) {
                        teamTotal -= 1; // Weakness
                      } else if (effectiveness < 1) {
                        teamTotal += 1; // Resistance or immunity
                      }
                      // Neutral effectiveness (1x) adds 0
                    });

                    const getTotalClass = (total) => {
                      if (total < 0) return 'team-weakness';
                      if (total > 0) return 'team-strength';
                      return 'team-neutral';
                    };

                    const getTotalDisplay = (total) => {
                      if (total === 0) return '±0';
                      return total > 0 ? `+${total}` : `${total}`;
                    };

                    return (
                      <tr key={attackingType}>
                        <td className="attacking-type-cell">
                          <span className={`attacking-type-badge type-${attackingType.toLowerCase()}`}>
                            {attackingType}
                          </span>
                        </td>
                        {activeMonsters.map((monster) => {
                          const effectiveness = calculateMonsterEffectiveness(monster.types, attackingType);
                          return (
                            <td key={monster.id} className={`effectiveness-cell ${getEffectivenessClass(effectiveness)}`}>
                              {getEffectivenessText(effectiveness)}
                            </td>
                          );
                        })}
                        <td className={`team-total-cell ${getTotalClass(teamTotal)}`}>
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
            <div className="summary-sections">
              <div className="summary-section">
                <h4>Team Weaknesses</h4>
                {Object.keys(teamSummary.weaknesses).length === 0 ? (
                  <p className="no-results">No shared weaknesses</p>
                ) : (
                  <div className="summary-grid">
                    {Object.entries(teamSummary.weaknesses)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => (
                      <div key={type} className="summary-item weakness">
                        <span className={`attacking-type-badge type-${type.toLowerCase()}`}>{type}</span>
                        <span className="count-badge">{count}/{teamSummary.activeMonsters} weak</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="summary-section">
                <h4>Team Resistances</h4>
                {Object.keys(teamSummary.resistances).length === 0 ? (
                  <p className="no-results">No shared resistances</p>
                ) : (
                  <div className="summary-grid">
                    {Object.entries(teamSummary.resistances)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => (
                      <div key={type} className="summary-item resistance">
                        <span className={`attacking-type-badge type-${type.toLowerCase()}`}>{type}</span>
                        <span className="count-badge">{count}/{teamSummary.activeMonsters} resist</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="summary-section">
                <h4>Team Immunities</h4>
                {Object.keys(teamSummary.immunities).length === 0 ? (
                  <p className="no-results">No shared immunities</p>
                ) : (
                  <div className="summary-grid">
                    {Object.entries(teamSummary.immunities)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => (
                      <div key={type} className="summary-item immunity">
                        <span className={`attacking-type-badge type-${type.toLowerCase()}`}>{type}</span>
                        <span className="count-badge">{count}/{teamSummary.activeMonsters} immune</span>
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

export default TeamBuilder;