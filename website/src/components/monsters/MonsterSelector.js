import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable monster selector component with modern styling
 * 
 * @param {Array} monsters - Array of monster objects to display
 * @param {Object} selectedMonster - Currently selected monster
 * @param {Function} onSelectMonster - Callback when a monster is selected
 * @param {String} title - Title for the selector
 * @param {String} searchPlaceholder - Placeholder text for search input
 * @param {Boolean} showDetails - Whether to show additional monster details
 * @param {String} emptyMessage - Message to display when no monsters are available
 * @param {String} errorMessage - Error message to display (if any)
 */
const MonsterSelector = ({
  monsters = [],
  selectedMonster = null,
  onSelectMonster,
  title = 'Select a Monster',
  searchPlaceholder = 'Search monsters...',
  showDetails = true,
  emptyMessage = 'No monsters available',
  errorMessage = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMonsters, setFilteredMonsters] = useState(monsters);

  // Filter monsters when search term or monsters array changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMonsters(monsters);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = monsters.filter(monster => {
      // Search by name
      if (monster.name && monster.name.toLowerCase().includes(lowercaseSearch)) {
        return true;
      }
      
      // Search by species
      const species = [monster.species1, monster.species2, monster.species3].filter(Boolean);
      if (species.some(spec => spec.toLowerCase().includes(lowercaseSearch))) {
        return true;
      }
      
      // Search by type
      const types = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
        .filter(Boolean);
      
      if (types.some(type => type.toLowerCase().includes(lowercaseSearch))) {
        return true;
      }

      // Search by attribute
      if (monster.attribute && monster.attribute.toLowerCase().includes(lowercaseSearch)) {
        return true;
      }

      return false;
    });
    
    setFilteredMonsters(filtered);
  }, [searchTerm, monsters]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Get image URL with fallback
  const getMonsterImage = (monster) => {
    if (!monster) return '/images/default_mon.png';

    const imageUrl = monster.image_path || monster.img_link || null;
    return imageUrl && imageUrl !== 'null' ? imageUrl : '/images/default_mon.png';
  };

  // Get monster types as array
  const getMonsterTypes = (monster) => {
    if (!monster) return [];
    
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter(Boolean);
  };

  // Get monster species as array
  const getMonsterSpecies = (monster) => {
    if (!monster) return [];
    
    return [monster.species1, monster.species2, monster.species3]
      .filter(Boolean);
  };

  // Get type color for badges
  const getTypeColor = (type) => {
    const typeColors = {
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
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
      // Add more type colors as needed
    };
    
    return typeColors[type.toLowerCase()] || '#71746f'; // Default gray
  };

  return (
    <div className="monster-selector">
      <h3 className="monster-selector-title">{title}</h3>
      
      <div className="monster-selector-search">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={handleSearchChange}
          className="monster-selector-search-input"
        />
        {searchTerm && (
          <button 
            className="monster-selector-search-clear" 
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      {errorMessage && (
        <div className="monster-selector-error">{errorMessage}</div>
      )}
      
      <div className="monster-selector-grid">
        {filteredMonsters.length === 0 ? (
          <div className="monster-selector-empty">{emptyMessage}</div>
        ) : (
          filteredMonsters.map(monster => (
            <div
              key={monster.id}
              className={`monster-selector-card ${selectedMonster?.id === monster.id ? 'selected' : ''}`}
              onClick={() => onSelectMonster(monster)}
            >
              <div className="creature-image">
                <img 
                  src={getMonsterImage(monster)} 
                  alt={monster.name || 'Monster'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_mon.png';
                  }}
                />
              </div>
              
              <div className="monster-selector-card-content">
                <div className="monster-selector-card-name">
                  {monster.name || 'Unnamed Monster'}
                  {monster.level && <span className="monster-selector-level">Lv. {monster.level}</span>}
                </div>
                
                {showDetails && (
                  <>
                    {getMonsterSpecies(monster).length > 0 && (
                      <div className="monster-selector-species">
                        {getMonsterSpecies(monster).join(' / ')}
                      </div>
                    )}
                    
                    {getMonsterTypes(monster).length > 0 && (
                      <div className="monster-selector-types">
                        {getMonsterTypes(monster).map((type, index) => (
                          <span 
                            key={index} 
                            className="monster-selector-badge"
                            style={{ backgroundColor: getTypeColor(type) }}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    {monster.attribute && (
                      <div className="monster-selector-attribute">
                        {monster.attribute}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

MonsterSelector.propTypes = {
  monsters: PropTypes.array,
  selectedMonster: PropTypes.object,
  onSelectMonster: PropTypes.func.isRequired,
  title: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  showDetails: PropTypes.bool,
  emptyMessage: PropTypes.string,
  errorMessage: PropTypes.string
};

export default MonsterSelector;
