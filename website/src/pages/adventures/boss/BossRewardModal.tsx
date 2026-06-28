import { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { FormInput } from '../../../components/common/FormInput';
import { FormSelect } from '../../../components/common/FormSelect';
import { TypeBadge } from '../../../components/common/TypeBadge';
import { AttributeBadge } from '../../../components/common/AttributeBadge';
import { BadgeGroup } from '../../../components/common/BadgeGroup';
import bossService from '../../../services/bossService';
import type { BossMonsterOption, RewardClaimData, TrainerOption } from './types';

interface BossRewardModalProps {
  isOpen: boolean;
  reward: RewardClaimData | null;
  trainers: TrainerOption[];
  userId: number;
  onClose: () => void;
  onClaimed: () => void;
}

const MonsterAttributes = ({ monster }: { monster: BossMonsterOption }) => (
  <div className="boss-reward-modal__monster-attributes">
    {monster.species && monster.species.length > 0 && (
      <div className="boss-reward-modal__attribute-group">
        <span className="boss-reward-modal__attribute-label">
          <i className="fas fa-dna"></i> Species
        </span>
        <BadgeGroup>
          {monster.species.map((species) => (
            <span key={species} className="badge">{species}</span>
          ))}
        </BadgeGroup>
      </div>
    )}

    {monster.types && monster.types.length > 0 && (
      <div className="boss-reward-modal__attribute-group">
        <span className="boss-reward-modal__attribute-label">
          <i className="fas fa-magic"></i> Types
        </span>
        <BadgeGroup>
          {monster.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </BadgeGroup>
      </div>
    )}

    {monster.attribute && (
      <div className="boss-reward-modal__attribute-group">
        <span className="boss-reward-modal__attribute-label">
          <i className="fas fa-star"></i> Attribute
        </span>
        <BadgeGroup>
          <AttributeBadge attribute={monster.attribute} />
        </BadgeGroup>
      </div>
    )}
  </div>
);

export const BossRewardModal = ({
  isOpen,
  reward,
  trainers,
  userId,
  onClose,
  onClaimed,
}: BossRewardModalProps) => {
  const [monsterName, setMonsterName] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monster = reward?.monsterData ?? null;
  const options = monster?.options;
  const isSelection = Array.isArray(options) && options.length > 0;
  const isPlayerChoice = isSelection && monster?.selectionMode === 'player';

  const resetState = () => {
    setMonsterName('');
    setSelectedTrainer('');
    setSelectedOptionIndex(0);
    setError(null);
    setClaiming(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reward) return;

    if (!monsterName.trim()) {
      setError('Please enter a name for your monster');
      return;
    }
    if (!selectedTrainer) {
      setError('Please select a trainer');
      return;
    }

    try {
      setClaiming(true);
      setError(null);

      const response = await bossService.claimBossReward(reward.bossId, {
        userId,
        monsterName: monsterName.trim(),
        trainerId: Number(selectedTrainer),
        ...(isPlayerChoice ? { selectedOptionIndex } : {}),
      });

      if (response.success) {
        resetState();
        onClaimed();
      } else {
        setError(response.message || 'Failed to claim reward');
      }
    } catch {
      setError('Failed to claim reward. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const trainerOptions = trainers.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const footer = (
    <div className="boss-reward-modal__actions">
      <button
        className="button secondary"
        onClick={handleClose}
        disabled={claiming}
      >
        Cancel
      </button>
      <button
        className="button primary"
        onClick={handleSubmit}
        disabled={claiming || !monsterName.trim() || !selectedTrainer}
      >
        {claiming ? (
          <>
            <i className="fas fa-spinner fa-spin"></i> Claiming...
          </>
        ) : (
          <>
            <i className="fas fa-trophy"></i> Claim Reward
          </>
        )}
      </button>
    </div>
  );

  const renderPreview = () => {
    if (!monster) {
      return (
        <div className="boss-reward-modal__monster-preview boss-reward-modal__monster-preview--unavailable">
          <h4>
            <i className="fas fa-exclamation-circle"></i>
            Monster Preview Unavailable
          </h4>
          <p>Monster data not found for this reward.</p>
        </div>
      );
    }

    if (isSelection && options) {
      if (isPlayerChoice) {
        return (
          <div className="boss-reward-modal__monster-preview">
            <h4>
              <i className="fas fa-hand-pointer"></i>
              Choose Your Reward
            </h4>
            <p className="boss-reward-modal__selection-hint">
              Pick one of the {options.length} monsters below — you'll receive the one you select.
            </p>
            <div className="boss-reward-modal__option-list">
              {options.map((option, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`boss-reward-modal__option${idx === selectedOptionIndex ? ' boss-reward-modal__option--selected' : ''}`}
                  onClick={() => setSelectedOptionIndex(idx)}
                  aria-pressed={idx === selectedOptionIndex}
                >
                  <div className="boss-reward-modal__option-header">
                    <i className={`fas ${idx === selectedOptionIndex ? 'fa-check-circle' : 'fa-circle'}`}></i>
                    <span>{option.name || `Option ${idx + 1}`}</span>
                  </div>
                  <MonsterAttributes monster={option} />
                </button>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="boss-reward-modal__monster-preview">
          <h4>
            <i className="fas fa-dice"></i>
            Random Reward
          </h4>
          <p className="boss-reward-modal__selection-hint">
            You'll receive <strong>one</strong> of these {options.length} monsters at random when you claim.
          </p>
          <div className="boss-reward-modal__option-list">
            {options.map((option, idx) => (
              <div className="boss-reward-modal__option boss-reward-modal__option--static" key={idx}>
                <div className="boss-reward-modal__option-header">
                  <i className="fas fa-dragon"></i>
                  <span>{option.name || `Option ${idx + 1}`}</span>
                </div>
                <MonsterAttributes monster={option} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="boss-reward-modal__monster-preview">
        <h4>
          <i className="fas fa-dragon"></i>
          Monster Preview: {monster.name}
        </h4>
        <MonsterAttributes monster={monster} />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Claim Your Boss Reward!"
      size="large"
      footer={footer}
    >
      {reward && (
        <div className="boss-reward-modal">
          {/* Boss Info */}
          <div className="boss-reward-modal__boss-info">
            <img
              src={reward.bossImage || '/images/default_boss.png'}
              alt={reward.bossName}
              className="boss-reward-modal__boss-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/images/default_boss.png';
              }}
            />
            <div className="boss-reward-modal__details">
              <h3>{reward.bossName}</h3>
              <div className="boss-reward-modal__reward-type">
                {reward.rewardType === 'boss_monster' ? (
                  <>
                    <i className="fas fa-crown"></i>
                    <span>Boss Monster Reward (1st Place)</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-gift"></i>
                    <span>Grunt Monster Reward (Participant)</span>
                  </>
                )}
              </div>
              <div className="boss-reward-modal__stats">
                <span>Damage Dealt: {reward.damageDealt?.toLocaleString() ?? 0}</span>
                <span>Rank: #{reward.rankPosition}</span>
              </div>
            </div>
          </div>

          {/* Monster Preview */}
          {renderPreview()}

          {/* Claim Form */}
          <div className="boss-reward-modal__form">
            <FormInput
              label="Name your new monster"
              name="monster-name"
              value={monsterName}
              onChange={(e) => setMonsterName(e.target.value)}
              placeholder="Enter monster name..."
              maxLength={50}
              required
            />

            <FormSelect
              label="Assign to trainer"
              name="trainer-select"
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              options={trainerOptions}
              placeholder="Select a trainer"
              required
            />

            {error && (
              <div className="alert error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
