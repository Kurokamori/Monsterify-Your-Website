import React, { useState } from 'react';


/**
 * Reward Display Component
 * Displays calculated rewards for submissions
 */
const RewardDisplay = ({
  rewards,
  submissionType,
  trainers = [],
  monsters = [],
  onAllocate = null,
  isGift = false
}) => {
  const [selectedRecipientType, setSelectedRecipientType] = useState('trainer');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [allocateAmount, setAllocateAmount] = useState(1);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [allocationType, setAllocationType] = useState('');

  // Format level text
  const formatLevelText = (levels) => {
    return `${levels} ${levels === 1 ? 'level' : 'levels'}`;
  };

  // Format coin text
  const formatCoinText = (coins) => {
    return `${coins} ${coins === 1 ? 'coin' : 'coins'}`;
  };

  // Handle allocate button click
  const handleAllocateClick = (type) => {
    setAllocationType(type);
    setShowAllocateForm(true);
  };

  // Handle allocate form submit
  const handleAllocateSubmit = () => {
    if (!selectedRecipientId || allocateAmount <= 0) return;

    if (onAllocate) {
      onAllocate({
        type: allocationType,
        recipientType: selectedRecipientType,
        recipientId: parseInt(selectedRecipientId),
        amount: allocateAmount
      });
    }

    // Reset form
    setShowAllocateForm(false);
    setSelectedRecipientType('trainer');
    setSelectedRecipientId('');
    setAllocateAmount(1);
  };

  // Get available amount for allocation
  const getAvailableAmount = () => {
    if (allocationType === 'giftLevels') {
      return rewards.giftLevels || 0;
    } else if (allocationType === 'giftCoins') {
      return rewards.giftCoins || 0;
    } else if (allocationType === 'cappedLevels') {
      return rewards.cappedLevels || 0;
    }
    return 0;
  };

  if (!rewards) return null;

  return (
    <div className="reward-display">
      <h3>Reward Calculation</h3>

      {/* Overall Image Rewards */}
      <div className="reward-section">
        <h4>Overall Image</h4>
        <div className="reward-item">
          <span className="reward-label">Base Levels:</span>
          <span className="reward-value">{formatLevelText(rewards.overallLevels)}</span>
        </div>
      </div>

      {/* Trainer Rewards */}
      {rewards.trainerRewards && rewards.trainerRewards.length > 0 && (
        <div className="reward-section">
          <h4>Trainer Rewards</h4>
          {rewards.trainerRewards.map((reward, index) => {
            const trainer = trainers.find(t => t.id === reward.trainerId);
            const trainerName = reward.trainerName || trainer?.name || `Trainer #${reward.trainerId}`;
            return (
              <div key={index} className="reward-entity">
                <div className="reward-entity-header">
                  <span className="reward-entity-name">{trainerName}</span>
                </div>
                <div className="reward-entity-details">
                  <div className="reward-item">
                    <span className="reward-label">Levels:</span>
                    <span className="reward-value">{formatLevelText(reward.levels)}</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Coins:</span>
                    <span className="reward-value">{formatCoinText(reward.coins)}</span>
                  </div>
                  {reward.cappedLevels > 0 && (
                    <div className="reward-item capped-levels">
                      <span className="reward-label">Capped Levels:</span>
                      <span className="reward-value">{formatLevelText(reward.cappedLevels)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monster Rewards */}
      {rewards.monsterRewards && rewards.monsterRewards.length > 0 && (
        <div className="reward-section">
          <h4>Monster Rewards</h4>
          {rewards.monsterRewards.map((reward, index) => {
            const monster = monsters.find(m => m.id === reward.monsterId);
            return (
              <div key={index} className="reward-entity">
                <div className="reward-entity-header">
                  <span className="reward-entity-name">
                    {monster ? monster.name : `Monster #${reward.monsterId}`}
                    {reward.trainerName && (
                      <span className="reward-entity-trainer"> (Trainer: {reward.trainerName})</span>
                    )}
                  </span>
                </div>
                <div className="reward-entity-details">
                  <div className="reward-item">
                    <span className="reward-label">Levels:</span>
                    <span className="reward-value">{formatLevelText(reward.levels)}</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Coins:</span>
                    <span className="reward-value">{formatCoinText(reward.coins)}</span>
                  </div>
                  {reward.cappedLevels > 0 && (
                    <div className="reward-item capped-levels">
                      <span className="reward-label">Capped Levels:</span>
                      <span className="reward-value">{formatLevelText(reward.cappedLevels)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Additional Rewards */}
      <div className="reward-section">
        <h4>Additional Rewards</h4>
        <div className="reward-item">
          <span className="reward-label">Garden Points:</span>
          <span className="reward-value">
            {typeof rewards.gardenPoints === 'object'
              ? (rewards.gardenPoints.amount || 0)
              : rewards.gardenPoints}
          </span>
        </div>
        <div className="reward-item">
          <span className="reward-label">Mission Progress:</span>
          <span className="reward-value">
            {typeof rewards.missionProgress === 'object'
              ? (rewards.missionProgress.amount || 0)
              : rewards.missionProgress}
          </span>
          {typeof rewards.missionProgress === 'object' && rewards.missionProgress.message && (
            <div className="reward-detail">{rewards.missionProgress.message}</div>
          )}
        </div>
        <div className="reward-item">
          <span className="reward-label">Boss Damage:</span>
          <span className="reward-value">
            {typeof rewards.bossDamage === 'object'
              ? (rewards.bossDamage.amount || 0)
              : rewards.bossDamage}
          </span>
          {typeof rewards.bossDamage === 'object' && rewards.bossDamage.results &&
           rewards.bossDamage.results.length > 0 && (
            <div className="reward-detail">
              {rewards.bossDamage.results.map((result, index) => (
                <div key={index}>
                  Dealt {result.damage} damage to {result.boss?.name || 'Boss'}
                  {result.boss?.wasDefeated && <span className="boss-defeated"> - DEFEATED!</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gift Rewards */}
      {isGift && (
        <div className="reward-section gift-rewards">
          <h4>Gift Rewards</h4>
          <div className="reward-item">
            <span className="reward-label">Gift Levels:</span>
            <span className="reward-value">{formatLevelText(rewards.totalGiftLevels || 0)}</span>
            {onAllocate && rewards.totalGiftLevels > 0 && (
              <button
                type="button"
                className="allocate-button"
                onClick={() => handleAllocateClick('giftLevels')}
              >
                Allocate
              </button>
            )}
          </div>
          {rewards.giftItems && rewards.giftItems.length > 0 && (
            <div className="gift-items">
              <h5>Gift Items</h5>
              <ul className="gift-item-list">
                {rewards.giftItems.map((item, index) => (
                  <li key={index} className="gift-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-category">({item.category})</span>
                    {item.quantity > 1 && (
                      <span className="item-quantity">× {item.quantity}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Capped Levels */}
      {rewards.cappedLevels > 0 && (
        <div className="reward-section capped-levels-section">
          <h4>Capped Levels</h4>
          <div className="reward-item">
            <span className="reward-label">Available Capped Levels:</span>
            <span className="reward-value">{formatLevelText(rewards.cappedLevels)}</span>
            {onAllocate && (
              <button
                type="button"
                className="allocate-button"
                onClick={() => handleAllocateClick('cappedLevels')}
              >
                Allocate
              </button>
            )}
          </div>
          <p className="capped-levels-info">
            These are levels that were capped because a trainer or monster reached level 100.
            You can allocate them to any trainer or monster.
          </p>
        </div>
      )}

      {/* Allocation Form */}
      {showAllocateForm && (
        <div className="allocate-form">
          <h4>
            Allocate {allocationType === 'giftLevels' ? 'Gift Levels' :
                     allocationType === 'giftCoins' ? 'Gift Coins' : 'Capped Levels'}
          </h4>
          <div className="form-row">
            <label>
              Recipient Type:
              <select
                value={selectedRecipientType}
                onChange={(e) => setSelectedRecipientType(e.target.value)}
              >
                <option value="trainer">Trainer</option>
                <option value="monster">Monster</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Recipient:
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
              >
                <option value="">Select {selectedRecipientType === 'trainer' ? 'Trainer' : 'Monster'}</option>
                {selectedRecipientType === 'trainer' ?
                  trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  )) :
                  monsters.map(monster => (
                    <option key={monster.id} value={monster.id}>
                      {monster.name} ({monster.species})
                    </option>
                  ))
                }
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Amount:
              <input
                type="number"
                min="1"
                max={getAvailableAmount()}
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(parseInt(e.target.value) || 1)}
              />
            </label>
            <span className="available-amount">
              Available: {getAvailableAmount()}
            </span>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setShowAllocateForm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="allocate-submit-button"
              onClick={handleAllocateSubmit}
              disabled={!selectedRecipientId || allocateAmount <= 0 || allocateAmount > getAvailableAmount()}
            >
              Allocate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardDisplay;
