import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AutoStateContainer } from '@components/common/StateContainer';
import areaService from '@services/areaService';
import type { LandmassGuide, RegionGuideSummary } from '@services/areaService';
import '@styles/guides/interactive-map.css';

const TYPE_COLOR_MAP: Record<string, string> = {
  normal: 'var(--normal-type)', fire: 'var(--fire-type)', water: 'var(--water-type)',
  electric: 'var(--electric-type)', grass: 'var(--grass-type)', ice: 'var(--ice-type)',
  fighting: 'var(--fighting-type)', poison: 'var(--poison-type)', ground: 'var(--ground-type)',
  flying: 'var(--flying-type)', psychic: 'var(--psychic-type)', bug: 'var(--bug-type)',
  rock: 'var(--rock-type)', ghost: 'var(--ghost-type)', dragon: 'var(--dragon-type)',
  dark: 'var(--dark-type)', steel: 'var(--steel-type)', fairy: 'var(--fairy-type)',
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};

const LandmassGuidePage = () => {
  const { landmassId } = useParams<{ landmassId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landmass, setLandmass] = useState<LandmassGuide | null>(null);
  const [regions, setRegions] = useState<RegionGuideSummary[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<RegionGuideSummary | null>(null);

  useDocumentTitle(landmass?.name ?? 'Landmass');

  const fetchData = useCallback(async () => {
    if (!landmassId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await areaService.getLandmassGuide(landmassId);
      setLandmass(data);
      setRegions(data.regionsData);
    } catch {
      setError('Failed to load landmass data.');
    } finally {
      setLoading(false);
    }
  }, [landmassId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegionClick = (regionId: string) => {
    navigate(`/guides/interactive-map/landmass/${landmassId}/region/${regionId}`);
  };

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={!landmass}
        onRetry={fetchData}
        loadingMessage="Loading landmass data..."
        emptyMessage="Landmass not found."
        emptyIcon="fas fa-map"
      >
        {landmass && (
          <>
            <div className="map-breadcrumb">
              <button className="map-breadcrumb__link" onClick={() => navigate('/guides/interactive-map')}>
                World Map
              </button>
              <span className="map-breadcrumb__separator">&rsaquo;</span>
              <span className="map-breadcrumb__current">{landmass.name}</span>
            </div>

            <button className="button secondary" onClick={() => navigate('/guides/interactive-map')}>
              &larr; Back to World Map
            </button>

            <div className="map-header" style={{ marginTop: 'var(--spacing-small)' }}>
              <h1>{landmass.name}</h1>
              <p>{landmass.description}</p>
            </div>

            <div className="map-top-section">
              <div className="map-container">
                <div className="map-image-wrapper">
                  <img src={landmass.image} alt={landmass.name} onError={handleImageError} />
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      className="map-hotspot"
                      style={{
                        left: `${region.mapCoordinates.x}%`,
                        top: `${region.mapCoordinates.y}%`,
                        width: `${region.mapCoordinates.width}%`,
                        height: `${region.mapCoordinates.height}%`,
                      }}
                      onClick={() => handleRegionClick(region.id)}
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  ))}
                  {hoveredRegion && (
                    <div className="map-tooltip">
                      <div className="map-tooltip__content">
                        <img
                          src={hoveredRegion.image}
                          alt={hoveredRegion.name}
                          className="map-tooltip__image"
                          onError={handleImageError}
                        />
                        <div className="map-tooltip__info">
                          <h3>{hoveredRegion.name}</h3>
                          <p>{hoveredRegion.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="map-info-sidebar">
                <div className="map-info-card">
                  <h3>Climate</h3>
                  <p>{landmass.climate}</p>
                </div>
                <div className="map-info-card">
                  <h3>Dominant Types</h3>
                  <div className="map-type-badges">
                    {landmass.dominantTypes.map((type) => (
                      <span
                        key={type}
                        className="map-type-badge"
                        style={{ backgroundColor: TYPE_COLOR_MAP[type.toLowerCase()] ?? '#666' }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {landmass.lore && (
              <div className="map-section">
                <h3>Lore &amp; History</h3>
                <p>{landmass.lore}</p>
              </div>
            )}

            <div className="map-section">
              <h3>Regions ({regions.length})</h3>
            </div>
            <div className="map-card-grid">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="map-card"
                  onClick={() => handleRegionClick(region.id)}
                >
                  <img
                    src={region.image}
                    alt={region.name}
                    className="map-card__image"
                    onError={handleImageError}
                  />
                  <div className="map-card__body">
                    <h3>{region.name}</h3>
                    <p>{region.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default LandmassGuidePage;
