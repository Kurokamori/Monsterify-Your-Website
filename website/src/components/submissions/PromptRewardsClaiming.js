import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import MonsterAutocomplete from '../common/MonsterAutocomplete';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';

/**
 * PromptRewardsClaiming - Page 3 of the Prompt Submission Wizard
 *
 * Displays all rewards from combined submission:
 * - Art/Writing rewards (already applied)
 * - Gift rewards (if applicable)
 * - Level cap reallocations (if applicable)
 * - Prompt rewards with level allocation choice
 * - Monster claiming with naming
 */
const PromptRewardsClaiming = ({
  submissionResult,
  trainerId,
  trainer,
  prompt,
  userTrainers = [],
  userMonsters = [],
  onComplete,
  onSubmitAnother
}) => {
  // Destructure submission result
  const {
    submission,
    promptSubmission,
    artWritingRewards = {},
    promptRewards = {},
    hasGiftLevels = false,
    hasLevelCaps = false,
    cappedMonsters = []
  } = submissionResult || {};

  // Prompt rewards claiming state
  const [levelTarget, setLevelTarget] = useState('trainer');
  const [targetMonsterId, setTargetMonsterId] = useState(null);
  const [promptRewardsClaimed, setPromptRewardsClaimed] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState(false);

  // Monster claiming state
  const [unclaimedMonsters, setUnclaimedMonsters] = useState(
    promptRewards?.monsters?.filter(m => !m.claimed) || []
  );
  const [monsterNames, setMonsterNames] = useState({});
  const [monsterTrainers, setMonsterTrainers] = useState({});
  const [claimingMonster, setClaimingMonster] = useState(null);

  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize monster names and trainers
  useEffect(() => {
    if (promptRewards?.monsters) {
      const names = {};
      const trainers = {};
      promptRewards.monsters.forEach((monster, index) => {
        names[index] = '';
        trainers[index] = trainerId;
      });
      setMonsterNames(names);
      setMonsterTrainers(trainers);
    }
  }, [promptRewards, trainerId]);

  // Claim prompt rewards (levels, coins, items)
  const handleClaimPromptRewards = async () => {
    if (!promptSubmission?.id) {
      setError('No prompt submission found');
      return;
    }

    try {
      setClaimingRewards(true);
      setError('');

      const result = await submissionService.claimPromptRewards(promptSubmission.id, {
        levelTarget,
        targetMonsterId: levelTarget === 'monster' ? targetMonsterId : null,
        claimItems: true
      });

      if (result.success) {
        setPromptRewardsClaimed(true);
        setSuccessMessage('Prompt rewards claimed successfully!');

        // Update unclaimed monsters if any
        if (result.unclaimedMonsters) {
          setUnclaimedMonsters(result.unclaimedMonsters);
        }
      }
    } catch (err) {
      console.error('Error claiming prompt rewards:', err);
      setError(err.response?.data?.message || 'Failed to claim prompt rewards');
    } finally {
      setClaimingRewards(false);
    }
  };

  // Claim a monster
  const handleClaimMonster = async (monsterIndex) => {
    const monsterName = monsterNames[monsterIndex];
    const assignedTrainerId = monsterTrainers[monsterIndex];

    if (!monsterName || !monsterName.trim()) {
      setError('Please enter a name for the monster');
      return;
    }

    if (!assignedTrainerId) {
      setError('Please select a trainer for the monster');
      return;
    }

    try {
      setClaimingMonster(monsterIndex);
      setError('');

      const result = await submissionService.claimSubmissionMonster(
        promptSubmission.id,
        assignedTrainerId,
        monsterIndex,
        monsterName.trim()
      );

      if (result.success) {
        // Update local state to mark monster as claimed
        setUnclaimedMonsters(prev =>
          prev.map((m, idx) =>
            idx === monsterIndex ? { ...m, claimed: true, final_name: monsterName } : m
          )
        );
        setSuccessMessage(`${monsterName} has been claimed!`);
      }
    } catch (err) {
      console.error('Error claiming monster:', err);
      setError(err.response?.data?.message || 'Failed to claim monster');
    } finally {
      setClaimingMonster(null);
    }
  };

  // Check if all rewards have been claimed
  const allRewardsClaimed = promptRewardsClaimed &&
    unclaimedMonsters.every(m => m.claimed);

  // Get trainer monsters for level allocation
  const getTrainerMonsters = () => {
    return userMonsters.filter(m => m.trainer_id === trainerId);
  };

  return (
    <div className="prompt-rewards-claiming">
      {/* Success Message */}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage message={error} onClose={() => setError('')} />
      )}

      {/* Submission Summary */}
      <div className="form-section rewards-summary-section">
        <h3>Submission Complete!</h3>
        <div className="submission-summary">
          <p><strong>Title:</strong> {submission?.title}</p>
          <p><strong>Type:</strong> {submission?.submissionType === 'art' ? 'Art' : 'Writing'}</p>
          <p><strong>Prompt:</strong> {prompt?.title}</p>
          <p><strong>Trainer:</strong> {trainer?.name}</p>
        </div>
      </div>

      {/* Art/Writing Rewards Applied */}
      <div className="form-section rewards-applied-section">
        <h3>
          <i className="fas fa-check-circle"></i>
          {submission?.submissionType === 'art' ? 'Art' : 'Writing'} Rewards Applied
        </h3>
        <div className="rewards-grid">
          {artWritingRewards?.trainerRewards?.map((reward, index) => (
            <div key={`trainer-${index}`} className="reward-item">
              <i className="fas fa-user"></i>
              <span>{reward.trainerName}: +{reward.levels} levels</span>
            </div>
          ))}
          {artWritingRewards?.monsterRewards?.map((reward, index) => (
            <div key={`monster-${index}`} className="reward-item">
              <i className="fas fa-dragon"></i>
              <span>{reward.monsterName}: +{reward.levels} levels</span>
            </div>
          ))}
          {artWritingRewards?.totalCoins > 0 && (
            <div className="reward-item">
              <i className="fas fa-coins"></i>
              <span>+{artWritingRewards.totalCoins} coins</span>
            </div>
          )}
        </div>
        {hasGiftLevels && (
          <div className="info-message">
            <i className="fas fa-gift"></i>
            Gift levels available! You can allocate them on the full submission page.
          </div>
        )}
      </div>

      {/* Prompt Rewards Section */}
      <div className="form-section prompt-rewards-claim-section">
        <h3>
          <i className="fas fa-scroll"></i>
          Prompt Rewards
        </h3>

        {!promptRewardsClaimed ? (
          <>
            {/* Levels Allocation */}
            {promptRewards?.levels > 0 && (
              <div className="prompt-level-allocation">
                <h4>Level Allocation ({promptRewards.levels} levels)</h4>
                <p className="section-description">
                  Choose where to allocate your prompt levels:
                </p>

                <div className="allocation-options">
                  <label className={`allocation-option ${levelTarget === 'trainer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="levelTarget"
                      value="trainer"
                      checked={levelTarget === 'trainer'}
                      onChange={() => setLevelTarget('trainer')}
                    />
                    <div className="option-content">
                      <i className="fas fa-user"></i>
                      <span>Give to Trainer</span>
                      <small>{trainer?.name}</small>
                    </div>
                  </label>

                  <label className={`allocation-option ${levelTarget === 'monster' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="levelTarget"
                      value="monster"
                      checked={levelTarget === 'monster'}
                      onChange={() => setLevelTarget('monster')}
                    />
                    <div className="option-content">
                      <i className="fas fa-dragon"></i>
                      <span>Give to Monster</span>
                    </div>
                  </label>
                </div>

                {levelTarget === 'monster' && (
                  <div className="monster-selector">
                    <MonsterAutocomplete
                      monsters={getTrainerMonsters()}
                      selectedMonsterId={targetMonsterId}
                      onSelect={(id) => setTargetMonsterId(id)}
                      placeholder="Select a monster..."
                      label="Choose Monster"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Coins Display */}
            {promptRewards?.coins > 0 && (
              <div className="prompt-reward-item">
                <i className="fas fa-coins"></i>
                <span>{promptRewards.coins} coins (to {trainer?.name})</span>
              </div>
            )}

            {/* Items Display */}
            {promptRewards?.items?.length > 0 && (
              <div className="prompt-items-section">
                <h4>Items (to {trainer?.name})</h4>
                <div className="prompt-items-grid">
                  {promptRewards.items.map((item, index) => (
                    <div key={index} className="prompt-item-card">
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.item_name || 'Item'}
                          className="item-icon"
                        />
                      ) : (
                        <i className="fas fa-gift"></i>
                      )}
                      <span>{item.item_name || item.display || 'Item'}</span>
                      {item.quantity > 1 && <small>x{item.quantity}</small>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim Button */}
            <div className="claim-actions">
              <button
                className="button success lg"
                onClick={handleClaimPromptRewards}
                disabled={claimingRewards || (levelTarget === 'monster' && !targetMonsterId)}
              >
                {claimingRewards ? (
                  <>
                    <LoadingSpinner size="small" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Claim Prompt Rewards
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="rewards-claimed-notice">
            <i className="fas fa-check-circle"></i>
            <span>Prompt rewards have been claimed!</span>
          </div>
        )}
      </div>

      {/* Monster Claiming Section */}
      {unclaimedMonsters.length > 0 && (
        <div className="form-section monster-claiming-section">
          <h3>
            <i className="fas fa-dragon"></i>
            Monster Rewards
          </h3>
          <p className="section-description">
            Name and claim your monsters. Each monster must be given a name and assigned to a trainer.
          </p>

          <div className="monster-claim-grid">
            {unclaimedMonsters.map((monster, index) => (
              <div
                key={index}
                className={`monster-claim-card ${monster.claimed ? 'claimed' : ''}`}
              >
                <div className="monster-preview">
                  {monster.img_link ? (
                    <img src={monster.img_link} alt={monster.species1} />
                  ) : (
                    <div className="monster-placeholder">
                      <i className="fas fa-dragon"></i>
                    </div>
                  )}
                </div>

                <div className="monster-info">
                  <h4>{monster.species1}</h4>
                  <div className="monster-types">
                    {monster.type1 && (
                      <span className={`type-badge type-${monster.type1.toLowerCase()}`}>
                        {monster.type1}
                      </span>
                    )}
                    {monster.type2 && (
                      <span className={`type-badge type-${monster.type2.toLowerCase()}`}>
                        {monster.type2}
                      </span>
                    )}
                  </div>
                  {monster.attribute && (
                    <span className="attribute-badge">{monster.attribute}</span>
                  )}
                </div>

                {!monster.claimed ? (
                  <div className="monster-claim-form">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={monsterNames[index] || ''}
                        onChange={(e) => setMonsterNames(prev => ({
                          ...prev,
                          [index]: e.target.value
                        }))}
                        placeholder="Enter monster name..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Trainer</label>
                      <TrainerAutocomplete
                        trainers={userTrainers}
                        selectedTrainerId={monsterTrainers[index]}
                        onSelect={(id) => setMonsterTrainers(prev => ({
                          ...prev,
                          [index]: id
                        }))}
                        placeholder="Select trainer..."
                      />
                    </div>

                    <button
                      className="button primary"
                      onClick={() => handleClaimMonster(index)}
                      disabled={claimingMonster === index || !monsterNames[index]?.trim()}
                    >
                      {claimingMonster === index ? (
                        <>
                          <LoadingSpinner size="small" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>
                          Claim
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="monster-claimed-badge">
                    <i className="fas fa-check-circle"></i>
                    <span>Claimed as "{monster.final_name}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Actions */}
      <div className="form-section completion-section">
        <div className="wizard-navigation">
          <button
            className="button secondary lg"
            onClick={onSubmitAnother}
          >
            <i className="fas fa-plus"></i>
            Submit Another
          </button>

          <button
            className="button primary lg"
            onClick={onComplete}
            disabled={!allRewardsClaimed && (promptRewards?.levels > 0 || unclaimedMonsters.some(m => !m.claimed))}
          >
            <i className="fas fa-check"></i>
            Done
          </button>
        </div>

        {!allRewardsClaimed && (
          <p className="completion-hint">
            <i className="fas fa-info-circle"></i>
            Claim all rewards before completing.
          </p>
        )}
      </div>
    </div>
  );
};

export default PromptRewardsClaiming;
