import React, { useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import { FRANCHISE_CONFIG } from '../../services/speciesDatabaseService';
import TypeBadge from '../monsters/TypeBadge';

const SpeciesDetailModal = ({
  isOpen,
  onClose,
  species,
  franchise,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  loading,
  currentIndex,
  totalCount
}) => {
  const config = FRANCHISE_CONFIG[franchise];

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
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

  const name = species[config.nameField] || 'Unknown';
  const imageUrl = species[config.imageField];

  // Render types section
  const renderTypes = () => {
    let types = [];

    if (franchise === 'pokemon' || franchise === 'nexomon') {
      if (species.type_primary) types.push(species.type_primary);
      if (species.type_secondary) types.push(species.type_secondary);
    } else if (franchise === 'fakemon') {
      for (let i = 1; i <= 5; i++) {
        if (species[`type${i}`]) types.push(species[`type${i}`]);
      }
    }

    if (types.length === 0) return null;

    return (
      <div className="species-detail-field">
        <span className="field-label">Types:</span>
        <div className="type-tags fw">
          {types.map((type, idx) => (
            <TypeBadge key={idx} type={type} />
          ))}
        </div>
      </div>
    );
  };

  // Render evolution info
  const renderEvolution = () => {
    if (!config.evolutionFields) return null;

    const { from, to, lineField } = config.evolutionFields;
    const evolvesFrom = from ? species[from] : null;
    const evolvesTo = to ? species[to] : null;
    const evolutionLine = lineField ? species[lineField] : null;

    if (!evolvesFrom && !evolvesTo && !evolutionLine) return null;

    return (
      <div className="species-detail-evolution">
        <h4><i className="fas fa-dna"></i> Evolution</h4>
        {evolvesFrom && (
          <div className="species-detail-field">
            <span className="field-label">Evolves From:</span>
            <span className="field-value">{evolvesFrom}</span>
          </div>
        )}
        {evolvesTo && (
          <div className="species-detail-field">
            <span className="field-label">Evolves To:</span>
            <span className="field-value">{evolvesTo}</span>
          </div>
        )}
        {evolutionLine && Array.isArray(evolutionLine) && (
          <div className="species-detail-field">
            <span className="field-label">Evolution Line:</span>
            <span className="field-value">{evolutionLine.join(' → ')}</span>
          </div>
        )}
      </div>
    );
  };

  // Render franchise-specific fields
  const renderFranchiseFields = () => {
    if (!config.displayFields || config.displayFields.length === 0) {
      return null;
    }

    return (
      <div className="species-detail-fields">
        {config.displayFields.map(({ key, label, type }) => {
          const value = species[key];
          if (value === null || value === undefined || value === '') return null;

          // Handle boolean fields
          if (type === 'boolean') {
            if (!value) return null;
            return (
              <div className="species-detail-field" key={key}>
                <span className="field-label">{label}:</span>
                <span className="field-value field-badge">
                  <i className="fas fa-check"></i> Yes
                </span>
              </div>
            );
          }

          // Handle type fields (show as badge)
          if (type === 'type') {
            return (
              <div className="species-detail-field" key={key}>
                <span className="field-label">{label}:</span>
                <TypeBadge type={value} />
              </div>
            );
          }

          // Regular field
          return (
            <div className="species-detail-field" key={key}>
              <span className="field-label">{label}:</span>
              <span className="field-value">{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Create modal title with navigation info
  const modalTitle = (
    <div className="species-modal-title">
      <span>{name}</span>
      {currentIndex !== undefined && currentIndex >= 0 && totalCount > 0 && (
        <span className="species-modal-position">
          ({currentIndex + 1} of {totalCount})
        </span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="large"
    >
      <div className="species-detail-content">
        {/* Navigation arrows */}
        <button
          className="species-nav-button species-nav-prev"
          onClick={onPrev}
          disabled={!hasPrev || loading}
          title="Previous species (←)"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="species-detail-main">
          {loading ? (
            <div className="species-detail-loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* Image */}
              <div className="species-detail-image">
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
                  <div className="species-detail-placeholder">
                    <i className="fas fa-question fa-3x"></i>
                    <p>No image available</p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="species-detail-info">
                <h3 className="species-detail-name">{name}</h3>
                <div className="species-detail-franchise">
                  <i className="fas fa-gamepad"></i> {config.name}
                </div>

                {renderTypes()}
                {renderFranchiseFields()}
                {renderEvolution()}

                {/* Breeding info if available */}
                {species.breeding_results && (
                  <div className="species-detail-field">
                    <span className="field-label">Breeding:</span>
                    <span className="field-value">{species.breeding_results}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation arrow - next */}
        <button
          className="species-nav-button species-nav-next"
          onClick={onNext}
          disabled={!hasNext || loading}
          title="Next species (→)"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="species-modal-hint">
        <span><kbd>←</kbd> <kbd>→</kbd> to navigate</span>
        <span><kbd>Esc</kbd> to close</span>
      </div>
    </Modal>
  );
};

export default SpeciesDetailModal;
