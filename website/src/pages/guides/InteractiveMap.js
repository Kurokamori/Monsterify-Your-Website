import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleMapImageError } from '../../utils/imageUtils';

const InteractiveMap = () => {
  const navigate = useNavigate();
  const [selectedLandmass, setSelectedLandmass] = useState(null);
  const [hoveredLandmass, setHoveredLandmass] = useState(null);

  const landmasses = [
  {
    id: 'conoco-island',
    name: 'Conoco Island',
    image: '/images/maps/conoco-island.png',
    description: 'A vast and lively island with a massive variety of monsters and biomes.',
    coordinates: { x: 40, y: 10, width: 55, height: 60 },
  },
  {
    id: 'conoocoo-archipelago',
    name: 'Conoocoo Archipelago',
    image: '/images/maps/conoocoo-archipelago.png',
    description: 'A collection of tropical islands known for their diverse ecosystems and rare water-type monsters -- and something that lurks beneath the trees but is kept as a close secret.',
    coordinates: { x: 5, y: 30, width: 20, height: 20 },
  },
  {
    id: 'sky-isles',
    name: 'Sky Isles',
    image: '/images/maps/sky-isles.png',
    description: 'Islands floating above it all with mysterious tribes and equally mysterious monsters.',
    coordinates: { x: 0, y: 80, width: 800, height: 20 },
  }
];

  const handleLandmassClick = (landmass) => {
    navigate(`/guides/interactive-map/landmass/${landmass.id}`);
  };

  const handleLandmassHover = (landmass) => {
    setHoveredLandmass(landmass);
  };

  const handleLandmassLeave = () => {
    setHoveredLandmass(null);
  };

  return (
    <div className="interactive-map">
      <div className="map-header">
        <h1>Interactive World Map</h1>
        <p>Explore the vast world of Dusk and Dawn. Click on a landmass to begin your journey.</p>
      </div>

      <div className="map-container">
        <div className="world-map">
          <img 
            src="/images/maps/world-overview.png" 
            alt="World Map Overview" 
            className="world-map-image"
            onError={(e) => handleMapImageError(e, 'map')}
          />
          
          {landmasses.map((landmass) => (
            <div
              key={landmass.id}
              className="landmass-hotspot"
              style={{
                left: `${landmass.coordinates.x}%`,
                top: `${landmass.coordinates.y}%`,
                width: `${landmass.coordinates.width}%`,
                height: `${landmass.coordinates.height}%`
              }}
              onClick={() => handleLandmassClick(landmass)}
              onMouseEnter={() => handleLandmassHover(landmass)}
              onMouseLeave={handleLandmassLeave}
            />
          ))}

          {hoveredLandmass && (
            <div className="map-tooltip">
              <div className="tooltip-content">
                <img 
                  src={hoveredLandmass.image} 
                  alt={hoveredLandmass.name}
                  className="tooltip-image"
                  onError={(e) => handleMapImageError(e, 'map')}
                />
                <div className="tooltip-info">
                  <h3>{hoveredLandmass.name}</h3>
                  <p>{hoveredLandmass.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="landmass-grid">
        <h2>Landmasses</h2>
        <div className="landmass-cards">
          {landmasses.map((landmass) => (
            <div 
              key={landmass.id} 
              className="landmass-card"
              onClick={() => handleLandmassClick(landmass)}
            >
              <img 
                src={landmass.image} 
                alt={landmass.name}
                className="landmass-card-image"
                onError={(e) => handleMapImageError(e, 'map')}
              />
              <div className="landmass-card-content">
                <h3>{landmass.name}</h3>
                <p>{landmass.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;