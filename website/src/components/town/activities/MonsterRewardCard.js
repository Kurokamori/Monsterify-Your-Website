import React from 'react';
import TrainerSelector from '../../common/TrainerSelector';

/**
 * Component to display a monster reward card with species images, type badges, and naming input
 */
const MonsterRewardCard = ({
  reward,
  trainers,
  selectedTrainerId,
  onTrainerSelect,
  onNameChange,
  onClaim,
  isClaiming,
  isClaimedBy,
  speciesImages,
  monsterName,
  sessionId,
  onForfeit,
  isForfeiting,
}) => {
  // Mystery Roll constant for fallback display
  const MYSTERY_ROLL = 'Mystery Roll';
  const MYSTERY_TYPE = '???';

  // Check if this is a mystery roll (no species data available)
  const isMysteryRoll = () => {
    const data = reward.reward_data;
    return !data.species1 && !data.species2 && !data.species3 &&
           !data.species && !data.monster_species;
  };

  // Get the species list from the reward data
  const getSpeciesList = () => {
    const speciesList = [];

    // Check for species1, species2, species3 fields
    if (reward.reward_data.species1) {
      speciesList.push(reward.reward_data.species1);
    }

    if (reward.reward_data.species2) {
      speciesList.push(reward.reward_data.species2);
    }

    if (reward.reward_data.species3) {
      speciesList.push(reward.reward_data.species3);
    }

    // If no species found yet, check for other fields
    if (speciesList.length === 0) {
      if (reward.reward_data.species) {
        speciesList.push(reward.reward_data.species);
      } else if (reward.reward_data.monster_species) {
        speciesList.push(reward.reward_data.monster_species);
      }
    }

    // Return Mystery Roll if no species found (will be rerolled on claim)
    return speciesList.length > 0 ? speciesList : [MYSTERY_ROLL];
  };

  // Get the species list
  const speciesList = getSpeciesList();

  // Get the level
  const level = reward.reward_data.level || 5;

  // Get the types directly from the reward data
  const getTypes = () => {
    const types = [];

    // First check if we have the standard type1-type5 fields
    if (reward.reward_data.type1) types.push(reward.reward_data.type1);
    if (reward.reward_data.type2) types.push(reward.reward_data.type2);
    if (reward.reward_data.type3) types.push(reward.reward_data.type3);
    if (reward.reward_data.type4) types.push(reward.reward_data.type4);
    if (reward.reward_data.type5) types.push(reward.reward_data.type5);

    // If no types found yet, check for params types
    if (types.length === 0 && reward.reward_data.params && reward.reward_data.params.types) {
      return reward.reward_data.params.types.map(type =>
        type.charAt(0).toUpperCase() + type.slice(1)
      );
    }

    // If still no types, return mystery type (will be determined on claim)
    if (types.length === 0) {
      return [MYSTERY_TYPE];
    }

    return types;
  };

  // Get the attribute directly from the reward data
  const getAttribute = () => {
    return reward.reward_data.attribute || null;
  };

  // Initialize monster name with species1 if not provided
  // For Mystery Rolls, leave name empty so users can name after claiming
  React.useEffect(() => {
    if (!monsterName && reward.reward_data.species1) {
      onNameChange(reward.id, reward.reward_data.species1);
    } else if (!monsterName && speciesList.length > 0 && speciesList[0] !== MYSTERY_ROLL) {
      onNameChange(reward.id, speciesList[0]);
    }
  }, [reward.id, reward.reward_data.species1, monsterName, speciesList, onNameChange]);

  // Handle forfeit with confirmation
  const handleForfeit = () => {
    if (window.confirm(`Are you sure you want to forfeit this monster to the Bazar? This action cannot be undone.`)) {
      onForfeit(reward.id, monsterName || speciesList[0] || 'Unknown');
    }
  };

  return (
    <div className={`monster-reward-card ${reward.claimed ? 'claimed' : ''} ${reward.rarity}`}>
      <div className="monster-reward-header">
        <div className="monster-reward-title">
          {reward.reward_data.title || `Level ${level} Monster`}
        </div>
        <div className={`reward-rarity ${reward.rarity}`}>
          {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
        </div>
      </div>

      <div className="monster-species-grid">
        {speciesList.map((species, index) => (
          <div key={index} className="monster-species-item">
            <div className="monster-species-image">
              {species === MYSTERY_ROLL ? (
                <img
                  src="/images/mystery.png"
                  alt="Mystery Roll"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_mon.png';
                  }}
                />
              ) : speciesImages && speciesImages[species] ? (
                <img
                  src={speciesImages[species].image_url}
                  alt={species}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_mon.png';
                  }}
                />
              ) : (
                <div className="monster-species-placeholder">
                  <i className="fas fa-dragon"></i>
                </div>
              )}
            </div>
            <div className="monster-species-name">{species}</div>
          </div>
        ))}
      </div>

      {/* Display types below species */}
      <div className="monster-types-container">
        <div className="monster-types">
          {getTypes().map((type, typeIndex) => (
            <span key={typeIndex} className={`type-badge ${type === MYSTERY_TYPE ? 'type-mystery' : `type-${type.toLowerCase()}`}`}>
              {type}
            </span>
          ))}
        </div>
        {getAttribute() && (
          <div className="monster-attribute-badge">
            {getAttribute()}
          </div>
        )}
      </div>

      <div className="monster-reward-details">
        <div className="monster-level">Level {level}</div>
        {reward.reward_data.params && reward.reward_data.params.isLegendary && (
          <div className="monster-legendary-badge">Legendary</div>
        )}
      </div>

      <div className="monster-reward-actions">
        {reward.claimed ? (
          <div className="claimed-badge">
            <i className="fas fa-check-circle mr-2"></i>
            {reward.claimed_by === 'Garden-Forfeit' ? (
              'Forfeited to Bazar'
            ) : (
              (() => {
                console.log(`Monster reward - Looking for trainer with ID: "${reward.claimed_by}" (type: ${typeof reward.claimed_by})`);
                console.log('Monster reward - Available trainers:', trainers.map(t => ({ id: t.id, name: t.name, type: typeof t.id })));
                const trainer = trainers.find(t => t.id === reward.claimed_by);
                console.log('Monster reward - Found trainer:', trainer);
                return `Claimed by ${trainer?.name || 'Unknown'}`;
              })()
            )}
          </div>
        ) : (
          <>
            <div className="monster-name-input">
              <label htmlFor={`monster-name-${reward.id}`}>Monster Name:</label>
              <input
                id={`monster-name-${reward.id}`}
                type="text"
                value={monsterName || ''}
                onChange={(e) => onNameChange(reward.id, e.target.value)}
                placeholder="Enter monster name"
                className="form-control"
              />
            </div>

            <div className="monster-trainer-select">
              <TrainerSelector
                trainers={trainers}
                selectedTrainerId={selectedTrainerId}
                onChange={(trainerId) => onTrainerSelect(reward.id, trainerId)}
              />
            </div>

            <div className="monster-reward-buttons">
              <button
                className="btn-primary mt-2"
                onClick={() => onClaim(reward.id, selectedTrainerId)}
                disabled={isClaiming || !selectedTrainerId || isForfeiting}
                style={{ flex: 1, marginRight: '8px' }}
              >
                {isClaiming ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Claiming...
                  </>
                ) : (
                  <>
                    <i className="fas fa-hand-paper mr-2"></i> Claim
                  </>
                )}
              </button>
              
              <button
                className="btn-danger mt-2"
                onClick={() => handleForfeit()}
                disabled={isClaiming || isForfeiting}
                style={{ flex: 1 }}
                title="Forfeit this monster to the Bazar"
              >
                {isForfeiting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Forfeiting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i> Forfeit
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonsterRewardCard;
