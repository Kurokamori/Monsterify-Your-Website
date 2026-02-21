import { useMemo } from 'react';
import { TypeBadge, AttributeBadge, BadgeGroup } from '../common';

interface EvolutionEntry {
  id?: number | string;
  order?: number;
  species1?: string;
  species2?: string;
  species3?: string;
  image?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  evolution_method?: string;
  level?: number;
  key?: string;
  data?: string;
}

interface EvolutionCardsProps {
  evolutionData: EvolutionEntry[];
  currentMonsterId?: number | string;
}

const DEFAULT_IMAGE = '/images/default_mon.png';

export const EvolutionCards = ({ evolutionData, currentMonsterId }: EvolutionCardsProps) => {
  const sortedEvolution = useMemo(() => {
    if (!evolutionData || !Array.isArray(evolutionData) || evolutionData.length === 0) {
      return [];
    }
    return [...evolutionData].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [evolutionData]);

  const getTypes = (entry: EvolutionEntry): string[] => {
    return [entry.type1, entry.type2, entry.type3, entry.type4, entry.type5]
      .filter((t): t is string => Boolean(t));
  };

  const getSpeciesNames = (entry: EvolutionEntry): string => {
    return [entry.species1, entry.species2, entry.species3]
      .filter(Boolean)
      .join(' / ') || 'Unnamed Species';
  };

  const summaryStats = useMemo(() => {
    if (sortedEvolution.length === 0) return null;

    const uniqueMethods = new Set(
      sortedEvolution
        .filter(evo => evo.evolution_method)
        .map(evo => evo.evolution_method)
    );

    const uniqueTypes = new Set(
      sortedEvolution.flatMap(evo => getTypes(evo))
    );

    return {
      totalStages: sortedEvolution.length,
      evolutionMethods: uniqueMethods.size,
      uniqueTypes: uniqueTypes.size
    };
  }, [sortedEvolution]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_IMAGE) {
      target.src = DEFAULT_IMAGE;
    }
  };

  if (sortedEvolution.length === 0) {
    return (
      <div className="no-evolution-data">
        <div className="no-evolution-data__icon">
          <i className="fas fa-dna"></i>
        </div>
        <h3>No Evolution Data</h3>
        <p>No evolution information has been recorded for this monster yet.</p>
      </div>
    );
  }

  return (
    <div className="evolution-cards-container">
      <div className="evolution-chain">
        {sortedEvolution.map((entry, index) => {
          const isCurrent = entry.id === currentMonsterId;
          const types = getTypes(entry);

          return (
            <div key={entry.id || index} style={{ display: 'contents' }}>
              {index > 0 && (
                <div className="evolution-connector">
                  <div className="evolution-connector__arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              )}

              <div className={[
                'evolution-card',
                isCurrent && 'evolution-card--current'
              ].filter(Boolean).join(' ')}>
                <div className="evolution-card__header">
                  <div className="evolution-card__stage">
                    <span className="evolution-card__stage-number">#{index + 1}</span>
                    <span className="evolution-card__stage-label">Evolution Stage</span>
                  </div>
                  {isCurrent && (
                    <div className="evolution-card__current-badge">
                      <i className="fas fa-star"></i>
                      Current
                    </div>
                  )}
                </div>

                <div className="evolution-card__image">
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.species1 || 'Evolution Stage'}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="evolution-card__image--empty">
                      <i className="fas fa-image"></i>
                      <span>No Image</span>
                    </div>
                  )}
                </div>

                <div className="evolution-card__body">
                  <h4 className="evolution-card__species">
                    {getSpeciesNames(entry)}
                  </h4>

                  {types.length > 0 && (
                    <BadgeGroup className="evolution-card__types" gap="xs">
                      {types.map((type, i) => (
                        <TypeBadge key={i} type={type} size="xs" />
                      ))}
                    </BadgeGroup>
                  )}

                  {entry.attribute && entry.attribute !== 'None' && (
                    <div className="evolution-card__attribute">
                      <AttributeBadge attribute={entry.attribute} size="xs" />
                    </div>
                  )}

                  {entry.evolution_method && (
                    <div className="evolution-method">
                      <div className="evolution-method__header">
                        <i className="fas fa-magic"></i>
                        <span>Evolution Method</span>
                      </div>
                      <div className="evolution-method__name">
                        {entry.evolution_method}
                      </div>
                      {entry.level && (
                        <div className="evolution-method__level">
                          <i className="fas fa-level-up-alt"></i>
                          <span>Level {entry.level}</span>
                        </div>
                      )}
                      {entry.key && entry.data && (
                        <div className="evolution-method__requirement">
                          <span className="evolution-method__requirement-key">{entry.key}:</span>
                          <span>{entry.data}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {index === 0 && (
                  <div className="evolution-card__footer">
                    <span className="evolution-card__base-label">
                      <i className="fas fa-seedling"></i>
                      Base Form
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {summaryStats && (
        <div className="evolution-summary">
          <div className="evolution-summary__header">
            <i className="fas fa-chart-line"></i>
            <h4>Evolution Chain Summary</h4>
          </div>
          <div className="evolution-summary__stats">
            <div className="evolution-summary__stat">
              <span className="evolution-summary__stat-label">Total Stages</span>
              <span className="evolution-summary__stat-value">{summaryStats.totalStages}</span>
            </div>
            <div className="evolution-summary__stat">
              <span className="evolution-summary__stat-label">Evolution Methods</span>
              <span className="evolution-summary__stat-value">{summaryStats.evolutionMethods}</span>
            </div>
            <div className="evolution-summary__stat">
              <span className="evolution-summary__stat-label">Unique Types</span>
              <span className="evolution-summary__stat-value">{summaryStats.uniqueTypes}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
