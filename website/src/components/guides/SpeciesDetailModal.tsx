import { useEffect, useCallback, ReactNode } from 'react';
import { Modal } from '../common/Modal';
import { TypeBadge } from '../common/TypeBadge';
import { FRANCHISE_CONFIG, FranchiseKey, Species } from '../../services/speciesService';

interface SpeciesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  species: Species | null;
  franchise: FranchiseKey;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  loading?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export const SpeciesDetailModal = ({
  isOpen,
  onClose,
  species,
  franchise,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  loading = false,
  currentIndex,
  totalCount = 0
}: SpeciesDetailModalProps) => {
  const config = FRANCHISE_CONFIG[franchise];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowLeft' && hasPrev) {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'ArrowRight' && hasNext) {
      e.preventDefault();
      onNext();
    }
  }, [isOpen, hasPrev, hasNext, onPrev, onNext]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!species || !config) {
    return null;
  }

  const name = (species[config.nameField] as string) || 'Unknown';
  const imageUrl = species[config.imageField] as string | undefined;

  const renderTypes = (): ReactNode => {
    const types: string[] = [];

    if (franchise === 'pokemon' || franchise === 'nexomon') {
      if (species.typePrimary) types.push(species.typePrimary as string);
      if (species.typeSecondary) types.push(species.typeSecondary as string);
    } else if (franchise === 'fakemon') {
      for (let i = 1; i <= 5; i++) {
        const typeKey = `type${i}`;
        if (species[typeKey]) types.push(species[typeKey] as string);
      }
    }

    if (types.length === 0) return null;

    return (
      <div className="species-detail__field">
        <span className="species-detail__label">Types:</span>
        <div className="species-detail__types">
          {types.map((type, idx) => (
            <TypeBadge key={idx} type={type} size="sm" />
          ))}
        </div>
      </div>
    );
  };

  const renderEvolution = (): ReactNode => {
    if (!config.evolutionFields) return null;

    const { from, to, lineField } = config.evolutionFields;
    const evolvesFrom = from ? species[from] as string | null : null;
    const evolvesTo = to ? species[to] as string | null : null;
    const evolutionLine = lineField ? species[lineField] as string[] | null : null;

    if (!evolvesFrom && !evolvesTo && !evolutionLine) return null;

    return (
      <div className="species-detail__evolution">
        <h4><i className="fas fa-dna"></i> Evolution</h4>
        {evolvesFrom && (
          <div className="species-detail__field">
            <span className="species-detail__label">Evolves From:</span>
            <span className="species-detail__value">{evolvesFrom}</span>
          </div>
        )}
        {evolvesTo && (
          <div className="species-detail__field">
            <span className="species-detail__label">Evolves To:</span>
            <span className="species-detail__value">{evolvesTo}</span>
          </div>
        )}
        {evolutionLine && Array.isArray(evolutionLine) && (
          <div className="species-detail__field">
            <span className="species-detail__label">Evolution Line:</span>
            <span className="species-detail__value">{evolutionLine.join(' \u2192 ')}</span>
          </div>
        )}
      </div>
    );
  };

  const renderFranchiseFields = (): ReactNode => {
    if (!config.displayFields || config.displayFields.length === 0) {
      return null;
    }

    return (
      <div className="species-detail__fields">
        {config.displayFields.map(({ key, label, type }) => {
          const value = species[key];
          if (value === null || value === undefined || value === '') return null;

          if (type === 'boolean') {
            if (!value) return null;
            return (
              <div className="species-detail__field" key={key}>
                <span className="species-detail__label">{label}:</span>
                <span className="species-detail__value species-detail__badge">
                  <i className="fas fa-check"></i> Yes
                </span>
              </div>
            );
          }

          if (type === 'type') {
            return (
              <div className="species-detail__field" key={key}>
                <span className="species-detail__label">{label}:</span>
                <TypeBadge type={value as string} size="sm" />
              </div>
            );
          }

          return (
            <div className="species-detail__field" key={key}>
              <span className="species-detail__label">{label}:</span>
              <span className="species-detail__value">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/placeholder-monster.png';
  };

  const modalTitle = (
    <div className="species-modal__title">
      <span>{name}</span>
      {currentIndex !== undefined && currentIndex >= 0 && totalCount > 0 && (
        <span className="species-modal__position">
          ({currentIndex + 1} of {totalCount})
        </span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle as unknown as string}
      size="large"
    >
      <div className="species-detail">
        <button
          className="species-detail__nav"
          onClick={onPrev}
          disabled={!hasPrev || loading}
          title="Previous species (\u2190)"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="species-detail__main">
          {loading ? (
            <div className="species-detail__loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <div className="species-detail__image">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="species-detail__placeholder">
                    <i className="fas fa-question fa-3x"></i>
                    <p>No image available</p>
                  </div>
                )}
              </div>

              <div className="species-detail__info">
                <h3 className="species-detail__name">{name}</h3>
                <div className="species-detail__franchise">
                  <i className="fas fa-gamepad"></i> {config.name}
                </div>

                {renderTypes()}
                {renderFranchiseFields()}
                {renderEvolution()}

                {typeof species.breedingResults === 'string' && species.breedingResults && (
                  <div className="species-detail__field">
                    <span className="species-detail__label">Breeding:</span>
                    <span className="species-detail__value">{species.breedingResults}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <button
          className="species-detail__nav"
          onClick={onNext}
          disabled={!hasNext || loading}
          title="Next species (\u2192)"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div className="species-modal__hint">
        <span><kbd>\u2190</kbd> <kbd>\u2192</kbd> to navigate</span>
        <span><kbd>Esc</kbd> to close</span>
      </div>
    </Modal>
  );
};
