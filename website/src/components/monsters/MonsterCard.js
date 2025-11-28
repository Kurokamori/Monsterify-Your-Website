import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';

const MonsterCard = ({ monster, linkToDetail = true, fullHeight = false }) => {
  // State for reference images
  const [referenceImages, setReferenceImages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Simple z-index calculation to prevent conflicts
  const zIndex = 1000 + (monster.id % 100); // Use monster ID to create unique z-index
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

  // Helper function to get attribute color
  const getAttributeColor = (attribute) => {
    const attributeColors = {
      // Pokemon attributes
      physical: '#C92112',
      special: '#4F5870',

      // Digimon attributes
      vaccine: '#5CB3FF',
      data: '#98FB98',
      virus: '#FF6961',
      free: '#D3D3D3',

      // Default color
      default: '#888888'
    };

    return attributeColors[attribute?.toLowerCase()] || attributeColors.default;
  };

  // Helper function to render types based on monster type
  const renderTypes = () => {
    const types = [];
    const monsterType = monster.monster_type || '';

    // First check if we have the standard type1-type5 fields (from monsters table)
    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);

    // If no types found yet, check for monster type specific fields (from monster_type_monsters tables)
    if (types.length === 0) {
      if (monsterType === 'pokemon' || monsterType === 'nexomon') {
        if (monster.type_primary) types.push(monster.type_primary);
        if (monster.type_secondary) types.push(monster.type_secondary);
      } else if (monsterType === 'digimon') {
        if (monster.digimon_type) types.push(monster.digimon_type);
      } else if (monsterType === 'yokai') {
        if (monster.tribe) types.push(monster.tribe);
      }
    }

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

  // Helper function to get monster info
  const getMonsterInfo = () => {
    const monsterType = monster.monster_type || '';
    let info = '';

    // Check if this is from the monsters table (has species1)
    if (monster.species1) {
      // This is from the monsters table
      const level = monster.level ? `Lv. ${monster.level}` : '';
      info = level;

      // Add additional info if available
      if (monster.mon_index) info += ` #${monster.mon_index}`;
      if (monster.gender) info += ` - ${monster.gender}`;
      if (monster.nature) info += ` - ${monster.nature}`;
    } else {
      // This is from the monster_type_monsters tables
      if (monsterType === 'pokemon') {
        info = `#${monster.ndex || '???'}`;
        if (monster.stage) info += ` - ${monster.stage}`;
        if (monster.is_legendary) info += ' (Legendary)';
        if (monster.is_mythical) info += ' (Mythical)';
      } else if (monsterType === 'digimon') {
        if (monster.rank) info += `${monster.rank}`;
        if (monster.families) info += ` - ${monster.families}`;
      } else if (monsterType === 'yokai') {
        if (monster.rank) info += `${monster.rank}`;
        if (monster.stage) info += ` - ${monster.stage}`;
      } else if (monsterType === 'nexomon') {
        if (monster.stage) info += `${monster.stage}`;
        if (monster.is_legendary) info += ' (Legendary)';
      } else if (monsterType === 'pals') {
        info = 'Pal';
      }
    }

    return info;
  };

  // Effect to fetch reference images
  useEffect(() => {
    // Function to get reference images based on species
    const getSpeciesReferenceImages = async () => {
      try {
        // Create an array of species with their images
        const speciesImages = [];

        // Use direct image fields if present
        if (monster.species1) {
          speciesImages.push({
            species: monster.species1,
            url: monster.species1_image || monster.img_link || monster.image_url || null
          });
        }
        if (monster.species2) {
          speciesImages.push({
            species: monster.species2,
            url: monster.species2_image || null
          });
        }
        if (monster.species3) {
          speciesImages.push({
            species: monster.species3,
            url: monster.species3_image || null
          });
        }

        // If no species found, use the name
        if (speciesImages.length === 0 && monster.name) {
          speciesImages.push({
            species: monster.name,
            url: monster.img_link || monster.image_url || null
          });
        }

        // If we have species but no images, try to fetch them from the API
        if (speciesImages.some(img => !img.url)) {
          try {
            const speciesArray = speciesImages.map(img => img.species);
            const response = await fetch(`/api/species/images?species=${speciesArray.join(',')}`);

            if (response.ok) {
              const data = await response.json();

              // Update image URLs from API response
              speciesImages.forEach((img, index) => {
                if (!img.url) {
                  const apiImage = data.images.find(apiImg => apiImg.species === img.species);
                  if (apiImage && apiImage.url) {
                    speciesImages[index].url = apiImage.url;
                  }
                }
              });
            }
          } catch (error) {
            console.error('Error fetching species images from API:', error);
          }
        }

        setReferenceImages(speciesImages);
      } catch (error) {
        console.error('Error fetching reference images:', error);
      }
    };

    getSpeciesReferenceImages();
  }, [monster]);

  // Cleanup effect to restore body overflow if component unmounts while modal is open
  useEffect(() => {
    return () => {
      if (showModal) {
        document.body.style.overflow = '';
      }
    };
  }, [showModal]);

  // Function to open the image modal
  const openModal = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
    // Temporarily disable body scroll
    document.body.style.overflow = 'hidden';
  }, []);

  // Function to close the image modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedImage('');
    // Re-enable body scroll
    document.body.style.overflow = '';
  }, []);

  // Determine if the monster has an image (prioritize img_link)
  // Use overridden species1_image if present
  const imageUrl = monster.species1_image || monster.img_link || monster.image_url || '';
  const hasImage = imageUrl && imageUrl !== 'null' && imageUrl !== '';

  // Create the card content
  const cardContent = (
    <>
      <div className="monster-card-header">
        <h3 className="monster-name">{monster.name || monster.species1 || 'Unnamed Monster'}</h3>
        {monster.level && <span className="monster-level">Lv. {monster.level}</span>}
      </div>

      <div className="monster-card-image">
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
        <div className="monster-info">
          {getMonsterInfo()}
        </div>

        {/* Display species if available */}
        <div className="monster-species">
          {monster.species1 && (
            <span className="species-name">{monster.species1}</span>
          )}
          {monster.species2 && (
            <>
              <span className="species-separator"> / </span>
              <span className="species-name">{monster.species2}</span>
            </>
          )}
          {monster.species3 && (
            <>
              <span className="species-separator"> / </span>
              <span className="species-name">{monster.species3}</span>
            </>
          )}
        </div>

        <div className="monster-types">
          {renderTypes()}
        </div>

        {monster.attribute && (
          <div className="monster-attribute" style={{ color: getAttributeColor(monster.attribute) }}>
            {monster.attribute}
          </div>
        )}

        {/* Reference Images */}
        {referenceImages.length > 0 && (
          <div className="monster-references">
            {referenceImages.map((image, index) => (
              <div
                key={index}
                className="reference-image"
                onClick={() => openModal(image.url)}
              >
                {image.url ? (
                  <img 
                    src={image.url} 
                    alt={image.species}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div 
                  className="reference-text" 
                  style={{ display: image.url ? 'none' : 'block' }}
                >
                  {image.species}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Render modal as a portal to prevent re-creation on hover
  const modalElement = showModal ? ReactDOM.createPortal(
    <div
      key={`modal-${monster.id}`}
      className="modal"
      style={{ zIndex, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      onClick={closeModal}
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={closeModal}>×</button>
        <img src={selectedImage} alt="Reference" className="modal-image" />
      </div>
    </div>,
    document.body
  ) : null;

  // Return the card with or without a link, plus the modal
  return (
    <>
      {linkToDetail && monster.id ? (
        <Link to={`/monsters/${monster.id}`} className={`monster-card ${fullHeight ? 'full-height' : ''}`}>
          {cardContent}
        </Link>
      ) : (
        <div className={`monster-card ${fullHeight ? 'full-height' : ''}`}>
          {cardContent}
        </div>
      )}
      {modalElement}
    </>
  );
};

export default MonsterCard;
