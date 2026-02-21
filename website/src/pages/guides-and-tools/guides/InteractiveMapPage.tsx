import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AutoStateContainer } from '@components/common/StateContainer';
import areaService from '@services/areaService';
import type { LandmassGuide } from '@services/areaService';
import '@styles/guides/interactive-map.css';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};

const InteractiveMapPage = () => {
  useDocumentTitle('Interactive World Map');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landmasses, setLandmasses] = useState<LandmassGuide[]>([]);
  const [hoveredLandmass, setHoveredLandmass] = useState<LandmassGuide | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await areaService.getWorldMapData();
      setLandmasses(data.landmasses);
    } catch {
      setError('Failed to load world map data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLandmassClick = (landmass: LandmassGuide) => {
    navigate(`/guides/interactive-map/landmass/${landmass.id}`);
  };

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={landmasses.length === 0}
        onRetry={fetchData}
        loadingMessage="Loading world map..."
        emptyMessage="No map data available."
        emptyIcon="fas fa-map"
      >
        <div className="map-header">
          <h1>Interactive World Map</h1>
          <p>Explore the vast world of Dusk and Dawn. Click on a landmass to begin your journey.</p>
        </div>

        <div className="map-container">
          <div className="map-image-wrapper">
            <img
              src="/images/maps/world-overview.png"
              alt="World Map Overview"
              onError={handleImageError}
            />
            {landmasses.map((landmass) => (
              <div
                key={landmass.id}
                className="map-hotspot"
                style={{
                  left: `${landmass.mapCoordinates.x}%`,
                  top: `${landmass.mapCoordinates.y}%`,
                  width: `${landmass.mapCoordinates.width}%`,
                  height: `${landmass.mapCoordinates.height}%`,
                }}
                onClick={() => handleLandmassClick(landmass)}
                onMouseEnter={() => setHoveredLandmass(landmass)}
                onMouseLeave={() => setHoveredLandmass(null)}
              />
            ))}
            {hoveredLandmass && (
              <div className="map-tooltip">
                <div className="map-tooltip__content">
                  <img
                    src={hoveredLandmass.image}
                    alt={hoveredLandmass.name}
                    className="map-tooltip__image"
                    onError={handleImageError}
                  />
                  <div className="map-tooltip__info">
                    <h3>{hoveredLandmass.name}</h3>
                    <p>{hoveredLandmass.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <h2>Landmasses</h2>
        <div className="map-card-grid">
          {landmasses.map((landmass) => (
            <div
              key={landmass.id}
              className="map-card"
              onClick={() => handleLandmassClick(landmass)}
            >
              <img
                src={landmass.image}
                alt={landmass.name}
                className="map-card__image"
                onError={handleImageError}
              />
              <div className="map-card__body">
                <h3>{landmass.name}</h3>
                <p>{landmass.description}</p>
              </div>
            </div>
          ))}
        </div>
      </AutoStateContainer>
    </div>
  );
};

export default InteractiveMapPage;
