import { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { FormInput } from '../../../components/common/FormInput';
import { FormSelect } from '../../../components/common/FormSelect';
import { TypeBadge } from '../../../components/common/TypeBadge';
import { AttributeBadge } from '../../../components/common/AttributeBadge';
import { BadgeGroup } from '../../../components/common/BadgeGroup';
import bossService from '../../../services/bossService';
import type { RewardClaimData, TrainerOption } from './types';

interface BossRewardModalProps {
  isOpen: boolean;
  reward: RewardClaimData | null;
  trainers: TrainerOption[];
  userId: number;
  onClose: () => void;
  onClaimed: () => void;
}

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
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setMonsterName('');
    setSelectedTrainer('');
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
          {reward.monsterData ? (
            <div className="boss-reward-modal__monster-preview">
              <h4>
                <i className="fas fa-dragon"></i>
                Monster Preview: {reward.monsterData.name}
              </h4>
              <div className="boss-reward-modal__monster-attributes">
                {reward.monsterData.species && reward.monsterData.species.length > 0 && (
                  <div className="boss-reward-modal__attribute-group">
                    <span className="boss-reward-modal__attribute-label">
                      <i className="fas fa-dna"></i> Species
                    </span>
                    <BadgeGroup>
                      {reward.monsterData.species.map((species) => (
                        <span key={species} className="badge">{species}</span>
                      ))}
                    </BadgeGroup>
                  </div>
                )}

                {reward.monsterData.types && reward.monsterData.types.length > 0 && (
                  <div className="boss-reward-modal__attribute-group">
                    <span className="boss-reward-modal__attribute-label">
                      <i className="fas fa-magic"></i> Types
                    </span>
                    <BadgeGroup>
                      {reward.monsterData.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </BadgeGroup>
                  </div>
                )}

                {reward.monsterData.attribute && (
                  <div className="boss-reward-modal__attribute-group">
                    <span className="boss-reward-modal__attribute-label">
                      <i className="fas fa-star"></i> Attribute
                    </span>
                    <BadgeGroup>
                      <AttributeBadge attribute={reward.monsterData.attribute} />
                    </BadgeGroup>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="boss-reward-modal__monster-preview boss-reward-modal__monster-preview--unavailable">
              <h4>
                <i className="fas fa-exclamation-circle"></i>
                Monster Preview Unavailable
              </h4>
              <p>Monster data not found for this reward.</p>
            </div>
          )}

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
