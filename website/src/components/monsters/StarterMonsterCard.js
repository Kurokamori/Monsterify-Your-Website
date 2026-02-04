import React from 'react';
import PropTypes from 'prop-types';

const StarterMonsterCard = ({ monster }) => {
  // Helper function to get type color
  const getTypeColor = (type) => {
    const typeColors = {
      // Pokemon types
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

      // Digimon attributes
      vaccine: '#5CB3FF',
      data: '#98FB98',
      virus: '#FF6961',
      free: '#D3D3D3',

      // Default color
      default: '#888888'
    };

    return typeColors[type?.toLowerCase()] || typeColors.default;
  };

  // Helper function to render types
  const renderTypes = () => {
    const types = [];

    // First check if we have the standard type1-type5 fields
    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);

    return types.map((type, index) => (
      <span
        key={index}
        className="monster-type"
        style={{ backgroundColor: getTypeColor(type) }}
      >
        {type}
      </span>
    ));
  };

  // Determine image URL
  const getImageUrl = () => {
    if (monster.img_link) return monster.img_link;
    if (monster.image_url) return monster.image_url;

    // Try to parse species_images if it exists
    if (monster.species_images) {
      try {
        const images = typeof monster.species_images === 'string'
          ? JSON.parse(monster.species_images)
          : monster.species_images;

        return images.species1_image || null;
      } catch (e) {
        console.error('Error parsing species_images:', e);
      }
    }

    // Check for direct image properties
    if (monster.species1_image) return monster.species1_image;

    return null;
  };

  // Render species images
  const renderSpeciesImages = () => {
    const images = [];

    if (monster.species1_image) {
      images.push({
        src: monster.species1_image,
        alt: monster.species1,
        title: monster.species1
      });
    }

    if (monster.species2_image) {
      images.push({
        src: monster.species2_image,
        alt: monster.species2,
        title: monster.species2
      });
    }

    if (monster.species3_image) {
      images.push({
        src: monster.species3_image,
        alt: monster.species3,
        title: monster.species3
      });
    }

    return images.map((image, index) => (
      <div key={index} className="species-image-container">
        <img
          src={image.src}
          alt={image.alt}
          title={image.title}
          className="reference-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default_mon.png';
          }}
        />
      </div>
    ));
  };

  const imageUrl = getImageUrl();
  const hasImage = imageUrl && imageUrl !== 'null' && imageUrl !== '';

  return (
    <div className="monster-card starter-monster-card">
      <div className="starter-monster-card-header">
        <h3 className="monster-name">        {monster.species1 && (
            <span className="monster-name">{monster.species1}</span>
          )}
          {monster.species2 && (
            <>
              <span className="species-separator"> / </span>
              <span className="monster-name">{monster.species2}</span>
            </>
          )}
          {monster.species3 && (
            <>
              <span className="species-separator"> / </span>
              <span className="monster-name">{monster.species3}</span>
            </>
          )}</h3>
      </div>

      <div className="starter-monster-card-image">
        <img
          src={imageUrl || '/images/default_mon.png'}
          alt={monster.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default_mon.png';
          }}
        />
      </div>

      <div className="monster-card-info">
        <div className="monster-types">
          {renderTypes()}
        </div>

        {monster.attribute && (
          <div className="monster-attribute" style={{ color: getTypeColor(monster.attribute.toLowerCase()) }}>
            {monster.attribute}
          </div>
        )}

        {/* Species images grid */}
        {(monster.species1_image || monster.species2_image || monster.species3_image) && (
          <div className="species-images-grid">
            {renderSpeciesImages()}
          </div>
        )}
      </div>
    </div>
  );
};

StarterMonsterCard.propTypes = {
  monster: PropTypes.object.isRequired
};

export default StarterMonsterCard;
