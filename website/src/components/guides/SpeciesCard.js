import React from 'react';
import { FRANCHISE_CONFIG } from '../../services/speciesDatabaseService';
import TypeBadge from '../monsters/TypeBadge';

const SpeciesCard = ({ species, franchise, onClick }) => {
  const config = FRANCHISE_CONFIG[franchise];

  if (!species || !config) {
    return null;
  }

  const name = species[config.nameField] || 'Unknown';
  const imageUrl = species[config.imageField];

  // Get primary type for display (varies by franchise)
  const getPrimaryType = () => {
    if (franchise === 'pokemon' || franchise === 'nexomon') {
      return species.type_primary;
    }
    if (franchise === 'fakemon') {
      return species.type1;
    }
    if (franchise === 'digimon') {
      return species.attribute;
    }
    if (franchise === 'monsterhunter') {
      return species.element;
    }
    return null;
  };

  // Get secondary identifier (dex number, rank, etc.)
  const getSecondaryInfo = () => {
    if (franchise === 'pokemon' && species.ndex) {
      return `#${String(species.ndex).padStart(3, '0')}`;
    }
    if (franchise === 'nexomon' && species.nr) {
      return `#${String(species.nr).padStart(3, '0')}`;
    }
    if (franchise === 'fakemon' && species.number) {
      return `#${String(species.number).padStart(3, '0')}`;
    }
    if (franchise === 'digimon' && species.rank) {
      return species.rank;
    }
    if (franchise === 'yokai' && species.rank) {
      return `${species.tribe || ''} ${species.rank}`.trim();
    }
    if (franchise === 'monsterhunter' && species.rank) {
      return `Rank ${species.rank}`;
    }
    return null;
  };

  const primaryType = getPrimaryType();
  const secondaryInfo = getSecondaryInfo();

  return (
    <div className="species-card" onClick={onClick}>
      <div className="species-card-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/placeholder-monster.png';
            }}
          />
        ) : (
          <div className="species-card-placeholder">
            <i className="fas fa-question"></i>
          </div>
        )}
      </div>

      <div className="species-card-info">
        <div className="species-card-name">{name}</div>

        {secondaryInfo && (
          <div className="species-card-secondary">{secondaryInfo}</div>
        )}

        {primaryType && (
          <div className="species-card-type">
            <TypeBadge type={primaryType} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeciesCard;
