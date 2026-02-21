import { useState } from 'react';

interface Trainer {
  id: string | number;
  name: string;
}

interface Monster {
  id: string | number;
  name: string;
  species?: string;
}

interface TrainerReward {
  trainerId: string | number;
  trainerName?: string;
  levels: number;
  coins: number;
  cappedLevels?: number;
}

interface MonsterReward {
  monsterId: string | number;
  name?: string;
  trainerName?: string;
  levels: number;
  coins: number;
  cappedLevels?: number;
}

interface BossDamageResult {
  damage: number;
  boss?: {
    name: string;
    wasDefeated?: boolean;
  };
}

interface GiftItem {
  name: string;
  category: string;
  quantity?: number;
}

interface Rewards {
  overallLevels?: number;
  totalLevels?: number;
  trainerRewards?: TrainerReward[];
  monsterRewards?: MonsterReward[];
  gardenPoints?: number | { amount: number };
  missionProgress?: number | { amount: number; message?: string };
  bossDamage?: number | { amount: number; results?: BossDamageResult[] };
  totalGiftLevels?: number;
  giftLevels?: number;
  giftCoins?: number;
  giftItems?: GiftItem[];
  cappedLevels?: number;
}

interface AllocationData {
  type: string;
  recipientType: 'trainer' | 'monster';
  recipientId: number;
  amount: number;
}

interface RewardDisplayProps {
  rewards: Rewards | null;
  submissionType?: string;
  trainers?: Trainer[];
  monsters?: Monster[];
  onAllocate?: ((data: AllocationData) => void) | null;
  isGift?: boolean;
}

type AllocationType = 'giftLevels' | 'giftCoins' | 'cappedLevels';

export function RewardDisplay({
  rewards,
  trainers = [],
  monsters = [],
  onAllocate,
  isGift = false
}: RewardDisplayProps) {
  const [selectedRecipientType, setSelectedRecipientType] = useState<'trainer' | 'monster'>('trainer');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [allocateAmount, setAllocateAmount] = useState(1);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [allocationType, setAllocationType] = useState<AllocationType | ''>('');

  // Format level text
  const formatLevelText = (levels: number): string => {
    return `${levels} ${levels === 1 ? 'level' : 'levels'}`;
  };

  // Format coin text
  const formatCoinText = (coins: number): string => {
    return `${coins} ${coins === 1 ? 'coin' : 'coins'}`;
  };

  // Handle allocate button click
  const handleAllocateClick = (type: AllocationType) => {
    setAllocationType(type);
    setShowAllocateForm(true);
  };

  // Handle allocate form submit
  const handleAllocateSubmit = () => {
    if (!selectedRecipientId || allocateAmount <= 0 || !allocationType) return;

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
  const getAvailableAmount = (): number => {
    if (!rewards) return 0;
    if (allocationType === 'giftLevels') {
      return rewards.giftLevels || 0;
    } else if (allocationType === 'giftCoins') {
      return rewards.giftCoins || 0;
    } else if (allocationType === 'cappedLevels') {
      return rewards.cappedLevels || 0;
    }
    return 0;
  };

  // Calculate bonus ranges based on total levels
  // Formula: Math.floor(totalLevels / rand(2-4)) + rand(1-4)
  // Min: Math.floor(totalLevels / 4) + 1
  // Max: Math.floor(totalLevels / 2) + 4
  const getTotalParticipantLevels = (): number => {
    if (!rewards) return 0;
    // Use overallLevels/totalLevels (total levels the image earned) rather than summing
    // post-cap applied levels, since bonus rewards are based on artwork effort
    return rewards.overallLevels || rewards.totalLevels || 0;
  };

  const formatBonusRange = (totalLevels: number): string => {
    if (totalLevels <= 0) return '0';
    const min = Math.floor(totalLevels / 4) + 1;
    const max = Math.floor(totalLevels / 2) + 4;
    return min === max ? `${min}` : `${min}–${max}`;
  };

  if (!rewards) return null;

  const totalParticipantLevels = getTotalParticipantLevels();

  return (
    <div className="reward-display">
      <h3 className="section-title">
        <i className="fas fa-gift"></i>
        Reward Calculation
      </h3>

      {/* Overall Image Rewards */}
      <div className="submission__reward-section">
        <h4 className="section-title">Overall Image</h4>
        <div className="reward-item">
          <div className="reward-item__icon reward-item__icon--level">
            <i className="fas fa-star"></i>
          </div>
          <div className="reward-item__content">
            <span className="reward-item__label">Base Levels:</span>
            <span className="reward-item__status">{formatLevelText(rewards.overallLevels || rewards.totalLevels || 0)}</span>
          </div>
        </div>
      </div>

      {/* Trainer Rewards */}
      {rewards.trainerRewards && rewards.trainerRewards.length > 0 && (
        <div className="submission__reward-section">
          <h4 className="section-title">Trainer Rewards</h4>
          {rewards.trainerRewards.map((reward, index) => {
            const trainer = trainers.find(t => t.id === reward.trainerId);
            const trainerName = reward.trainerName || trainer?.name || `Trainer #${reward.trainerId}`;
            return (
              <div key={index} className="reward-entity card card--compact">
                <div className="card__body">
                  <div className="reward-entity-header">
                    <i className="fas fa-user"></i>
                    <span className="reward-item__label">{trainerName}</span>
                  </div>
                  <div className="container horizontal gap-medium">
                    <div className="reward-item reward-item--compact">
                      <div className="reward-item__icon reward-item__icon--level">
                        <i className="fas fa-star"></i>
                      </div>
                      <div className="reward-item__content">
                        <span className="reward-item__label">Levels:</span>
                        <span className="reward-item__status">{formatLevelText(reward.levels)}</span>
                      </div>
                    </div>
                    <div className="reward-item reward-item--compact">
                      <div className="reward-item__icon reward-item__icon--coin">
                        <i className="fas fa-coins"></i>
                      </div>
                      <div className="reward-item__content">
                        <span className="reward-item__label">Coins:</span>
                        <span className="reward-item__status">{formatCoinText(reward.coins)}</span>
                      </div>
                    </div>
                    {(reward.cappedLevels ?? 0) > 0 && (
                      <div className="reward-item reward-item--compact capped-levels">
                        <div className="reward-item__icon reward-item__icon--level">
                          <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="reward-item__content">
                          <span className="reward-item__label">Capped:</span>
                          <span className="reward-item__status">{formatLevelText(reward.cappedLevels ?? 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monster Rewards */}
      {rewards.monsterRewards && rewards.monsterRewards.length > 0 && (
        <div className="submission__reward-section">
          <h4 className="section-title">Monster Rewards</h4>
          {rewards.monsterRewards.map((reward, index) => {
            const monster = monsters.find(m => m.id === reward.monsterId);
            return (
              <div key={index} className="reward-entity card card--compact">
                <div className="card__body">
                  <div className="reward-entity-header">
                    <i className="fas fa-dragon"></i>
                    <span className="reward-item__label">
                      {reward.name || monster?.name || `Monster #${reward.monsterId}`}
                    </span>
                    {reward.trainerName && (
                      <span className="reward-entity-trainer">(Trainer: {reward.trainerName})</span>
                    )}
                  </div>
                  <div className="container horizontal gap-medium">
                    <div className="reward-item reward-item--compact">
                      <div className="reward-item__icon reward-item__icon--level">
                        <i className="fas fa-star"></i>
                      </div>
                      <div className="reward-item__content">
                        <span className="reward-item__label">Levels:</span>
                        <span className="reward-item__status">{formatLevelText(reward.levels)}</span>
                      </div>
                    </div>
                    <div className="reward-item reward-item--compact">
                      <div className="reward-item__icon reward-item__icon--coin">
                        <i className="fas fa-coins"></i>
                      </div>
                      <div className="reward-item__content">
                        <span className="reward-item__label">Coins:</span>
                        <span className="reward-item__status">{formatCoinText(reward.coins)}</span>
                      </div>
                    </div>
                    {(reward.cappedLevels ?? 0) > 0 && (
                      <div className="reward-item reward-item--compact capped-levels">
                        <div className="reward-item__icon reward-item__icon--level">
                          <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="reward-item__content">
                          <span className="reward-item__label">Capped:</span>
                          <span className="reward-item__status">{formatLevelText(reward.cappedLevels ?? 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Additional Rewards */}
      <div className="submission__reward-section">
        <h4 className="section-title">Additional Rewards</h4>
        <div className="reward-list__items">
          <div className="reward-item">
            <div className="reward-item__icon reward-item__icon--points">
              <i className="fas fa-seedling"></i>
            </div>
            <div className="reward-item__content">
              <span className="reward-item__label">Garden Points:</span>
              <span className="reward-item__status">{formatBonusRange(totalParticipantLevels)}</span>
            </div>
          </div>
          <div className="reward-item">
            <div className="reward-item__icon reward-item__icon--points">
              <i className="fas fa-tasks"></i>
            </div>
            <div className="reward-item__content">
              <span className="reward-item__label">Mission Progress:</span>
              <span className="reward-item__status">{formatBonusRange(totalParticipantLevels)}</span>
            </div>
          </div>
          <div className="reward-item">
            <div className="reward-item__icon reward-item__icon--custom">
              <i className="fas fa-skull"></i>
            </div>
            <div className="reward-item__content">
              <span className="reward-item__label">Boss Damage:</span>
              <span className="reward-item__status">{formatBonusRange(totalParticipantLevels)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Rewards */}
      {isGift && (
        <div className="submission__reward-section">
          <h4 className="section-title">Gift Rewards</h4>
          <div className="reward-item">
            <div className="reward-item__icon reward-item__icon--level">
              <i className="fas fa-gift"></i>
            </div>
            <div className="reward-item__content">
              <span className="reward-item__label">Gift Levels:</span>
              <span className="reward-item__status">{formatLevelText(rewards.totalGiftLevels || 0)}</span>
            </div>
            {onAllocate && (rewards.totalGiftLevels || 0) > 0 && (
              <div className="reward-item__actions">
                <button
                  type="button"
                  className="button primary small"
                  onClick={() => handleAllocateClick('giftLevels')}
                >
                  Allocate
                </button>
              </div>
            )}
          </div>
          {rewards.giftItems && rewards.giftItems.length > 0 && (
            <div className="gift-items">
              <h5>Gift Items</h5>
              <div className="reward-list__items">
                {rewards.giftItems.map((item, index) => (
                  <div key={index} className="reward-item reward-item--compact">
                    <div className="reward-item__icon reward-item__icon--item">
                      <i className="fas fa-cube"></i>
                    </div>
                    <div className="reward-item__content">
                      <span className="reward-item__label">{item.name}</span>
                      <span className="reward-item__category">({item.category})</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="reward-item__status">x {item.quantity}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capped Levels */}
      {(rewards.cappedLevels ?? 0) > 0 && (
        <div className="submission__reward-section">
          <h4 className="section-title">Capped Levels</h4>
          <div className="reward-item">
            <div className="reward-item__icon reward-item__icon--level">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <div className="reward-item__content">
              <span className="reward-item__label">Available Capped Levels:</span>
              <span className="reward-item__status">{formatLevelText(rewards.cappedLevels ?? 0)}</span>
            </div>
            {onAllocate && (
              <div className="reward-item__actions">
                <button
                  type="button"
                  className="button primary small"
                  onClick={() => handleAllocateClick('cappedLevels')}
                >
                  Allocate
                </button>
              </div>
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
        <div className="card">
          <div className="card__body">
            <h4 className="section-title">
              Allocate {allocationType === 'giftLevels' ? 'Gift Levels' :
                       allocationType === 'giftCoins' ? 'Gift Coins' : 'Capped Levels'}
            </h4>
            <div className="form-group">
              <label className="form-label">Recipient Type:</label>
              <select
                className="select"
                value={selectedRecipientType}
                onChange={(e) => setSelectedRecipientType(e.target.value as 'trainer' | 'monster')}
              >
                <option value="trainer">Trainer</option>
                <option value="monster">Monster</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Recipient:</label>
              <select
                className="select"
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
            </div>
            <div className="form-group">
              <label className="form-label">Amount:</label>
              <div className="container horizontal gap-small">
                <input
                  type="number"
                  className="input"
                  min="1"
                  max={getAvailableAmount()}
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(parseInt(e.target.value) || 1)}
                />
                <span>
                  Available: {getAvailableAmount()}
                </span>
              </div>
            </div>
            <div className="container horizontal gap-small">
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowAllocateForm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAllocateSubmit}
                disabled={!selectedRecipientId || allocateAmount <= 0 || allocateAmount > getAvailableAmount()}
              >
                Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
