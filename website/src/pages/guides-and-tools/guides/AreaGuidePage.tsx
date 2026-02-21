import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AutoStateContainer } from '@components/common/StateContainer';
import areaService from '@services/areaService';
import type { AreaGuide } from '@services/areaService';
import '@styles/guides/interactive-map.css';

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: 'difficulty-badge--easy',
  medium: 'difficulty-badge--medium',
  hard: 'difficulty-badge--hard',
  extreme: 'difficulty-badge--extreme',
};

const RARITY_CLASS: Record<string, string> = {
  common: 'rarity-badge--common',
  uncommon: 'rarity-badge--uncommon',
  rare: 'rarity-badge--rare',
  extreme: 'rarity-badge--extreme',
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};

const AreaGuidePage = () => {
  const { landmassId, regionId, areaId } = useParams<{
    landmassId: string;
    regionId: string;
    areaId: string;
  }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [area, setArea] = useState<AreaGuide | null>(null);

  useDocumentTitle(area?.name ?? 'Area');

  const fetchData = useCallback(async () => {
    if (!areaId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await areaService.getAreaGuide(areaId);
      setArea(data);
    } catch {
      setError('Failed to load area data.');
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={!area}
        onRetry={fetchData}
        loadingMessage="Loading area data..."
        emptyMessage="Area not found."
        emptyIcon="fas fa-map-marker-alt"
      >
        {area && (
          <>
            <div className="map-breadcrumb">
              <button className="map-breadcrumb__link" onClick={() => navigate('/guides/interactive-map')}>
                World Map
              </button>
              <span className="map-breadcrumb__separator">&rsaquo;</span>
              <button className="map-breadcrumb__link" onClick={() => navigate(`/guides/interactive-map/landmass/${landmassId}`)}>
                {area.landmassName}
              </button>
              <span className="map-breadcrumb__separator">&rsaquo;</span>
              <button className="map-breadcrumb__link" onClick={() => navigate(`/guides/interactive-map/landmass/${landmassId}/region/${regionId}`)}>
                {area.regionName}
              </button>
              <span className="map-breadcrumb__separator">&rsaquo;</span>
              <span className="map-breadcrumb__current">{area.name}</span>
            </div>

            <button className="button secondary" onClick={() => navigate(`/guides/interactive-map/landmass/${landmassId}/region/${regionId}`)}>
              &larr; Back to {area.regionName}
            </button>

            <div className="area-guide-header" style={{ marginTop: 'var(--spacing-small)' }}>
              <h1>{area.name}</h1>
              <span className={`difficulty-badge ${DIFFICULTY_CLASS[area.difficulty.toLowerCase()] ?? ''}`}>
                {area.difficulty}
              </span>
            </div>
            <p style={{ color: 'var(--text-color-muted)', marginBottom: 'var(--spacing-medium)' }}>
              {area.description}
            </p>

            <img
              src={area.image}
              alt={area.name}
              className="area-hero-image"
              onError={handleImageError}
            />

            <div className="map-section">
              <h3>Quick Facts</h3>
              <div className="facts-grid">
                <div className="fact-item">
                  <strong>Difficulty</strong>
                  <span>{area.difficulty}</span>
                </div>
                <div className="fact-item">
                  <strong>Elevation</strong>
                  <span>{area.elevation}</span>
                </div>
                <div className="fact-item">
                  <strong>Temperature</strong>
                  <span>{area.temperature}</span>
                </div>
                <div className="fact-item">
                  <strong>Recommended Level</strong>
                  <span>{area.recommendedLevel}</span>
                </div>
                <div className="fact-item">
                  <strong>Weather</strong>
                  <span>{area.weatherPatterns}</span>
                </div>
                <div className="fact-item">
                  <strong>Accessibility</strong>
                  <span>{area.accessibility}</span>
                </div>
              </div>
            </div>

            {area.specialFeatures.length > 0 && (
              <div className="map-section">
                <h3>Special Features</h3>
                <div className="feature-list">
                  {area.specialFeatures.map((feature) => (
                    <span key={feature} className="feature-tag">{feature}</span>
                  ))}
                </div>
              </div>
            )}

            {area.wildlife.length > 0 && (
              <div className="map-section">
                <h3>Wildlife</h3>
                <div className="map-card-grid">
                  {area.wildlife.map((creature) => (
                    <div key={creature.name} className="creature-card">
                      <div className="creature-card__header">
                        <h4>{creature.name}</h4>
                        <span className={`rarity-badge ${RARITY_CLASS[creature.rarity.toLowerCase()] ?? ''}`}>
                          {creature.rarity}
                        </span>
                      </div>
                      <span className="creature-card__species">{creature.species}</span>
                      <span className="creature-card__type">{creature.type}</span>
                      <p>{creature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {area.resources.length > 0 && (
              <div className="map-section">
                <h3>Resources</h3>
                <div className="map-card-grid">
                  {area.resources.map((resource) => (
                    <div key={resource.name} className="resource-card">
                      <div className="resource-card__header">
                        <h4>{resource.name}</h4>
                        <span className={`rarity-badge ${RARITY_CLASS[resource.rarity.toLowerCase()] ?? ''}`}>
                          {resource.rarity}
                        </span>
                      </div>
                      <p>{resource.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {area.lore && (
              <div className="map-section">
                <h3>Lore &amp; Legends</h3>
                <p>{area.lore}</p>
              </div>
            )}

            {area.history && (
              <div className="map-section">
                <h3>Historical Significance</h3>
                <p>{area.history}</p>
              </div>
            )}

            {(area.dangers.length > 0 || area.tips.length > 0) && (
              <div className="dangers-tips-grid">
                {area.dangers.length > 0 && (
                  <div className="map-section">
                    <h3>Dangers &amp; Hazards</h3>
                    <ul>
                      {area.dangers.map((danger) => (
                        <li key={danger}>{danger}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {area.tips.length > 0 && (
                  <div className="map-section">
                    <h3>Survival Tips</h3>
                    <ul>
                      {area.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default AreaGuidePage;
