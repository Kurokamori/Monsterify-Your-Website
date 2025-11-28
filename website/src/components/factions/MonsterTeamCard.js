import React from 'react';

const MonsterTeamCard = ({ monster }) => {
  const getAttributeColor = (attribute) => {
    switch (attribute?.toLowerCase()) {
      case 'virus': return '#8B4513';
      case 'vaccine': return '#4CAF50';
      case 'data': return '#2196F3';
      case 'free': return '#9C27B0';
      case 'variable': return '#FF9800';
      default: return '#757575';
    }
  };

  const getAttributeIcon = (attribute) => {
    switch (attribute?.toLowerCase()) {
      case 'virus': return 'fas fa-bug';
      case 'vaccine': return 'fas fa-shield-alt';
      case 'data': return 'fas fa-database';
      case 'free': return 'fas fa-infinity';
      case 'variable': return 'fas fa-exchange-alt';
      default: return 'fas fa-question';
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      // Digimon-style types
      dragon: '#7B68EE',
      beast: '#8B4513',
      bird: '#87CEEB',
      aquan: '#4682B4',
      machine: '#696969',
      holy: '#FFD700',
      dark: '#483D8B',
      plant: '#228B22',
      insect: '#9ACD32',
      
      // Pokemon-style types  
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
      
      // Other common types
      light: '#FFFFE0',
      shadow: '#36454F',
      neutral: '#C0C0C0'
    };
    return typeColors[type?.toLowerCase()] || '#999';
  };

  return (
    <div className="monster-team-card">
      <div className="monster-header">
        <div className="monster-image">
          {monster.image ? (
            <img src={monster.image} alt={monster.name} />
          ) : (
            <div className="placeholder-image">
              <i className="fas fa-dragon"></i>
            </div>
          )}
        </div>
        <div className="monster-name">
          <h5>{monster.name}</h5>
        </div>
      </div>

      <div className="monster-details">
        {monster.species && monster.species.length > 0 && (
          <div className="monster-species">
            <label>Species:</label>
            <div className="species-list">
              {monster.species.slice(0, 3).map((species, index) => (
                <span key={index} className="species-tag">
                  {species}
                </span>
              ))}
              {monster.species.length > 3 && (
                <span className="species-more">+{monster.species.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {monster.types && monster.types.length > 0 && (
          <div className="monster-types">
            <label>Types:</label>
            <div className="types-list">
              {monster.types.slice(0, 5).map((type, index) => (
                <span 
                  key={index} 
                  className="type-tag"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  {type}
                </span>
              ))}
              {monster.types.length > 5 && (
                <span className="types-more">+{monster.types.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {monster.attribute && (
          <div className="monster-attribute">
            <label>Attribute:</label>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: getAttributeColor(monster.attribute),
                color: 'white'
              }}
            >
              <i className={getAttributeIcon(monster.attribute)}></i>
              <span>{monster.attribute}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonsterTeamCard;