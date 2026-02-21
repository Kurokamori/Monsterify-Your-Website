import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AutoStateContainer } from '@components/common/StateContainer';
import areaService from '@services/areaService';
import type { RegionGuide, RegionAreaSummary } from '@services/areaService';
import '@styles/guides/interactive-map.css';

const TYPE_COLOR_MAP: Record<string, string> = {
  normal: 'var(--normal-type)', fire: 'var(--fire-type)', water: 'var(--water-type)',
  electric: 'var(--electric-type)', grass: 'var(--grass-type)', ice: 'var(--ice-type)',
  fighting: 'var(--fighting-type)', poison: 'var(--poison-type)', ground: 'var(--ground-type)',
  flying: 'var(--flying-type)', psychic: 'var(--psychic-type)', bug: 'var(--bug-type)',
  rock: 'var(--rock-type)', ghost: 'var(--ghost-type)', dragon: 'var(--dragon-type)',
  dark: 'var(--dark-type)', steel: 'var(--steel-type)', fairy: 'var(--fairy-type)',
};

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: 'difficulty-badge--easy',
  medium: 'difficulty-badge--medium',
  hard: 'difficulty-badge--hard',
  extreme: 'difficulty-badge--extreme',
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};

const RegionGuidePage = () => {
  const { landmassId, regionId } = useParams<{ landmassId: string; regionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<RegionGuide | null>(null);
  const [hoveredArea, setHoveredArea] = useState<RegionAreaSummary | null>(null);

  useDocumentTitle(region?.name ?? 'Region');

  const fetchData = useCallback(async () => {
    if (!regionId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await areaService.getRegionGuide(regionId);
      setRegion(data);
    } catch {
      setError('Failed to load region data.');
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAreaClick = (areaId: string) => {
    navigate(`/guides/interactive-map/landmass/${landmassId}/region/${regionId}/area/${areaId}`);
  };

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={!region}
        onRetry={fetchData}
        loadingMessage="Loading region data..."
        emptyMessage="Region not found."
        emptyIcon="fas fa-map"
      >
        {region && (
          <>
            <div className="map-breadcrumb">
              <button className="map-breadcrumb__link" onClick={() => navigate('/guides/interactive-map')}>
                World Map
              </button>
              <span className="map-breadcrumb__separator">&rsaquo;</span>
              <button className="map-breadcrumb__link" onClick={() => navigate(`/guides/interactive-map/landmass/${landmassId}`)}>
                {region.landmassName}
              </button>
              <span className="map-breadcrumb__separator">&rsaquo;</span>
              <span className="map-breadcrumb__current">{region.name}</span>
            </div>

            <button className="button secondary" onClick={() => navigate(`/guides/interactive-map/landmass/${landmassId}`)}>
              &larr; Back to {region.landmassName}
            </button>

            <div className="map-header" style={{ marginTop: 'var(--spacing-small)' }}>
              <h1>{region.name}</h1>
              <p>{region.description}</p>
            </div>

            <div className="map-top-section">
              <div className="map-container">
                <div className="map-image-wrapper">
                  <img src={region.image} alt={region.name} onError={handleImageError} />
                  {region.areas.map((area) => (
                    <div
                      key={area.id}
                      className="map-hotspot"
                      style={{
                        left: `${area.mapCoordinates.x}%`,
                        top: `${area.mapCoordinates.y}%`,
                        width: `${area.mapCoordinates.width}%`,
                        height: `${area.mapCoordinates.height}%`,
                      }}
                      onClick={() => handleAreaClick(area.id)}
                      onMouseEnter={() => setHoveredArea(area)}
                      onMouseLeave={() => setHoveredArea(null)}
                    />
                  ))}
                  {hoveredArea && (
                    <div className="map-tooltip">
                      <div className="map-tooltip__content">
                        <img
                          src={hoveredArea.image}
                          alt={hoveredArea.name}
                          className="map-tooltip__image"
                          onError={handleImageError}
                        />
                        <div className="map-tooltip__info">
                          <h3>{hoveredArea.name}</h3>
                          <p>{hoveredArea.description}</p>
                          <span className={`difficulty-badge ${DIFFICULTY_CLASS[hoveredArea.difficulty.toLowerCase()] ?? ''}`}>
                            {hoveredArea.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="map-info-sidebar">
                <div className="map-info-card">
                  <h3>Climate</h3>
                  <p>{region.climate}</p>
                </div>
                <div className="map-info-card">
                  <h3>Elevation</h3>
                  <p>{region.elevation}</p>
                </div>
                <div className="map-info-card">
                  <h3>Dominant Types</h3>
                  <div className="map-type-badges">
                    {region.dominantTypes.map((type) => (
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

            <div className="map-section">
              <h3>Wildlife</h3>
              <p>{region.wildlife}</p>
            </div>

            <div className="map-section">
              <h3>Resources</h3>
              <p>{region.resources}</p>
            </div>

            {region.lore && (
              <div className="map-section">
                <h3>Lore &amp; History</h3>
                <p>{region.lore}</p>
              </div>
            )}

            <div className="map-section">
              <h3>Areas ({region.areas.length})</h3>
            </div>
            <div className="map-card-grid">
              {region.areas.map((area) => (
                <div
                  key={area.id}
                  className="map-card"
                  onClick={() => handleAreaClick(area.id)}
                >
                  <img
                    src={area.image}
                    alt={area.name}
                    className="map-card__image"
                    onError={handleImageError}
                  />
                  <div className="map-card__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>{area.name}</h3>
                      <span className={`difficulty-badge ${DIFFICULTY_CLASS[area.difficulty.toLowerCase()] ?? ''}`}>
                        {area.difficulty}
                      </span>
                    </div>
                    <p>{area.description}</p>
                    {area.specialFeatures.length > 0 && (
                      <div className="feature-list" style={{ marginTop: 'var(--spacing-xxsmall)' }}>
                        {area.specialFeatures.map((feature) => (
                          <span key={feature} className="feature-tag">{feature}</span>
                        ))}
                      </div>
                    )}
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

export default RegionGuidePage;
