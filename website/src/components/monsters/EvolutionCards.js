import React from 'react';

const EvolutionCards = ({ evolutionData, currentMonsterId }) => {
  if (!evolutionData || !Array.isArray(evolutionData) || evolutionData.length === 0) {
    return (
      <div className="no-evolution-data">
        <div className="no-evolution-icon">
          <i className="fas fa-dna"></i>
        </div>
        <h3>No Evolution Data</h3>
        <p>No evolution information has been recorded for this monster yet.</p>
      </div>
    );
  }

  // Sort evolution data by order if available
  const sortedEvolution = [...evolutionData].sort((a, b) => {
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <div className="evolution-cards-container">
      <div className="image-upload">
        {sortedEvolution.map((evo, index) => (
          <React.Fragment key={evo.id || index}>
            {index > 0 && (
              <div className="evolution-connector">
                <div className="evolution-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
                <div className="evolution-line"></div>
              </div>
            )}

            <div 
              className={`evolution-card ${evo.id === currentMonsterId ? 'current-monster' : ''}`}
            >
              {/* Card Header */}
              <div className="adopt-card">
                <div className="evolution-stage">
                  <span className="stage-number">#{index + 1}</span>
                  <span className="stage-label">Evolution Stage</span>
                </div>
                {evo.id === currentMonsterId && (
                  <div className="current-badge">
                    <i className="fas fa-star"></i>
                    Current
                  </div>
                )}
              </div>

              {/* Monster Image */}
              <div className="evolution-image-container">
                {evo.image ? (
                  <img
                    src={evo.image}
                    alt={evo.species1 || 'Evolution Stage'}
                    className="evolution-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                ) : (
                  <div className="evolution-image">
                    <i className="fas fa-image"></i>
                    <span>No Image</span>
                  </div>
                )}
              </div>

              {/* Species Information */}
              <div className="evolution-species-info">
                <h4 className="species-name">
                  {[evo.species1, evo.species2, evo.species3]
                    .filter(Boolean)
                    .join(' / ') || 'Unnamed Species'}
                </h4>
                
                {/* Types */}
                <div className="evolution-types">
                  {[evo.type1, evo.type2, evo.type3, evo.type4, evo.type5]
                    .filter(Boolean)
                    .map((type, i) => (
                      <span key={i} className={`evolution-type-badge type-${type.toLowerCase()}`}>
                        {type}
                      </span>
                    ))}
                </div>

                {/* Attribute */}
                {evo.attribute && evo.attribute !== 'None' && (
                  <div className="evolution-attribute">
                    <span className={`evolution-attribute-badge attribute-${evo.attribute.toLowerCase()}`}>
                      {evo.attribute}
                    </span>
                  </div>
                )}
              </div>

              {/* Evolution Method Information */}
              {evo.evolution_method && (
                <div className="evolution-method-info">
                  <div className="method-header">
                    <i className="fas fa-magic"></i>
                    <span>Evolution Method</span>
                  </div>
                  
                  <div className="change-details">
                    <div className="method-name">
                      {evo.evolution_method}
                    </div>
                    
                    {evo.level && (
                      <div className="method-level">
                        <i className="fas fa-level-up-alt"></i>
                        <span>Level {evo.level}</span>
                      </div>
                    )}
                    
                    {evo.key && evo.data && (
                      <div className="method-requirements">
                        <div className="requirement-item">
                          <span className="requirement-key">{evo.key}:</span>
                          <span className="requirement-value">{evo.data}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Footer */}
              {index === 0 && (
                <div className="evolution-card-footer">
                  <span className="base-form-label">
                    <i className="fas fa-seedling"></i>
                    Base Form
                  </span>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Evolution Summary */}
      <div className="evolution-summary">
        <div className="naming-header">
          <i className="fas fa-chart-line"></i>
          <h4>Evolution Chain Summary</h4>
        </div>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label">Total Stages:</span>
            <span className="stat-value">{sortedEvolution.length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Evolution Methods:</span>
            <span className="stat-value">
              {new Set(sortedEvolution
                .filter(evo => evo.evolution_method)
                .map(evo => evo.evolution_method)
              ).size}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Unique Types:</span>
            <span className="stat-value">
              {new Set(sortedEvolution
                .flatMap(evo => [evo.type1, evo.type2, evo.type3, evo.type4, evo.type5])
                .filter(Boolean)
              ).size}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionCards;