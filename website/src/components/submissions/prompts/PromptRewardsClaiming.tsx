import { useState, useEffect } from 'react';
import submissionService from '../../../services/submissionService';
import { TrainerAutocomplete } from '../../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../../common/MonsterAutocomplete';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { SuccessMessage } from '../../common/SuccessMessage';
import { GiftRewards } from '../GiftRewards';
import { LevelCapReallocation } from '../LevelCapReallocation';

interface Trainer {
  id: string | number;
  name: string;
  is_owned?: boolean;
  level?: number;
}

interface Monster {
  id: string | number;
  name: string;
  trainer_id: string | number;
  level?: number;
  species1?: string;
}

interface Prompt {
  id: string | number;
  title: string;
  description: string;
}

interface TrainerReward {
  trainerName: string;
  levels: number;
}

interface MonsterReward {
  monsterName: string;
  levels: number;
}

interface ArtWritingRewards {
  trainerRewards?: TrainerReward[];
  monsterRewards?: MonsterReward[];
  totalCoins?: number;
  totalGiftLevels?: number;
}

interface PromptItem {
  icon?: string;
  image_url?: string;
  item_name?: string;
  display?: string;
  quantity?: number;
}

interface UnclaimedMonster {
  species1: string;
  img_link?: string;
  type1?: string;
  type2?: string;
  attribute?: string;
  claimed?: boolean;
  final_name?: string;
}

interface PromptRewardsData {
  levels?: number;
  coins?: number;
  items?: PromptItem[];
  monsters?: UnclaimedMonster[];
}

interface Submission {
  title: string;
  submissionType: 'art' | 'writing';
}

interface PromptSubmission {
  id: number;
}

interface CappedMonster {
  monsterId: number;
  name?: string;
  species1?: string;
  img_link?: string;
  image_url?: string;
  currentLevel: number;
  originalLevels: number;
  excessLevels: number;
  trainerName?: string;
}

interface SubmissionResult {
  submission?: Submission;
  promptSubmission?: PromptSubmission;
  artWritingRewards?: ArtWritingRewards;
  promptRewards?: PromptRewardsData;
  hasGiftLevels?: boolean;
  hasLevelCaps?: boolean;
  cappedMonsters?: CappedMonster[];
}

interface PromptRewardsClaimingProps {
  submissionResult: SubmissionResult;
  trainerId: string | number;
  trainer: Trainer;
  prompt: Prompt;
  userTrainers?: Trainer[];
  userMonsters?: Monster[];
  onComplete: () => void;
  onSubmitAnother: () => void;
}

type RewardsStep = 'levelCap' | 'giftRewards' | 'promptRewards';

export function PromptRewardsClaiming({
  submissionResult,
  trainerId,
  trainer,
  prompt,
  userTrainers = [],
  userMonsters = [],
  onComplete,
  onSubmitAnother
}: PromptRewardsClaimingProps) {
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

  // Determine the first step based on what's needed
  const getInitialStep = (): RewardsStep => {
    if (hasLevelCaps && cappedMonsters.length > 0) return 'levelCap';
    if (hasGiftLevels && (artWritingRewards?.totalGiftLevels || 0) > 0) return 'giftRewards';
    return 'promptRewards';
  };

  const [currentStep, setCurrentStep] = useState<RewardsStep>(getInitialStep);

  // Prompt rewards claiming state
  const [levelTarget, setLevelTarget] = useState<'trainer' | 'monster'>('trainer');
  const [targetMonsterId, setTargetMonsterId] = useState<string | number | null>(null);
  const [promptRewardsClaimed, setPromptRewardsClaimed] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState(false);

  // Monster claiming state
  const [unclaimedMonsters, setUnclaimedMonsters] = useState<UnclaimedMonster[]>(
    promptRewards?.monsters?.filter((m: UnclaimedMonster) => !m.claimed) || []
  );
  const [monsterNames, setMonsterNames] = useState<Record<number, string>>({});
  const [monsterTrainers, setMonsterTrainers] = useState<Record<number, string | number>>({});
  const [claimingMonster, setClaimingMonster] = useState<number | null>(null);

  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize monster names and trainers
  useEffect(() => {
    if (promptRewards?.monsters) {
      const names: Record<number, string> = {};
      const trainers: Record<number, string | number> = {};
      promptRewards.monsters.forEach((_monster: UnclaimedMonster, index: number) => {
        names[index] = '';
        trainers[index] = trainerId;
      });
      setMonsterNames(names);
      setMonsterTrainers(trainers);
    }
  }, [promptRewards, trainerId]);

  // Build available targets for LevelCapReallocation
  const buildAvailableTargets = () => {
    const targets: { monsterId?: number; trainerId?: number; name: string; level?: number }[] = [];

    userTrainers.forEach(t => {
      targets.push({ trainerId: Number(t.id), name: t.name, level: t.level });
    });

    userMonsters.forEach(m => {
      targets.push({ monsterId: Number(m.id), name: m.name || m.species1 || 'Unknown', level: m.level });
    });

    return targets;
  };

  // Handle level cap reallocation completion
  const handleLevelCapComplete = () => {
    if (hasGiftLevels && (artWritingRewards?.totalGiftLevels || 0) > 0) {
      setCurrentStep('giftRewards');
    } else {
      setCurrentStep('promptRewards');
    }
    window.scrollTo(0, 0);
  };

  // Handle gift rewards completion
  const handleGiftRewardsComplete = () => {
    setCurrentStep('promptRewards');
    window.scrollTo(0, 0);
  };

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

        if (result.unclaimedMonsters) {
          setUnclaimedMonsters(result.unclaimedMonsters);
        }
      }
    } catch (err) {
      console.error('Error claiming prompt rewards:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to claim prompt rewards';
      setError(errorMessage);
    } finally {
      setClaimingRewards(false);
    }
  };

  // Claim a monster
  const handleClaimMonster = async (monsterIndex: number) => {
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

    if (!promptSubmission?.id) {
      setError('No prompt submission found');
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
        setUnclaimedMonsters(prev =>
          prev.map((m, idx) =>
            idx === monsterIndex ? { ...m, claimed: true, final_name: monsterName } : m
          )
        );
        setSuccessMessage(`${monsterName} has been claimed!`);
      }
    } catch (err) {
      console.error('Error claiming monster:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to claim monster';
      setError(errorMessage);
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

  // Render LevelCapReallocation step
  if (currentStep === 'levelCap') {
    return (
      <div className="prompt-rewards-claiming">
        <div className="form-section rewards-summary-section">
          <h3>Submission Complete!</h3>
          <div className="submission-summary">
            <p><strong>Title:</strong> {submission?.title}</p>
            <p><strong>Type:</strong> {submission?.submissionType === 'art' ? 'Art' : 'Writing'}</p>
            <p><strong>Prompt:</strong> {prompt?.title}</p>
            <p><strong>Trainer:</strong> {trainer?.name}</p>
          </div>
        </div>

        <LevelCapReallocation
          cappedMonsters={cappedMonsters}
          availableTargets={buildAvailableTargets()}
          onComplete={handleLevelCapComplete}
          onCancel={handleLevelCapComplete}
        />
      </div>
    );
  }

  // Render GiftRewards step
  if (currentStep === 'giftRewards') {
    const totalGiftLevels = artWritingRewards?.totalGiftLevels || 0;

    return (
      <div className="prompt-rewards-claiming">
        <div className="form-section rewards-summary-section">
          <h3>Submission Complete!</h3>
          <div className="submission-summary">
            <p><strong>Title:</strong> {submission?.title}</p>
            <p><strong>Type:</strong> {submission?.submissionType === 'art' ? 'Art' : 'Writing'}</p>
            <p><strong>Prompt:</strong> {prompt?.title}</p>
            <p><strong>Trainer:</strong> {trainer?.name}</p>
          </div>
        </div>

        <GiftRewards
          giftLevels={totalGiftLevels}
          userTrainers={userTrainers.map(t => ({ id: Number(t.id), name: t.name }))}
          userMonsters={userMonsters.map(m => ({ id: Number(m.id), name: m.name, species1: m.species1, trainer_id: m.trainer_id ? Number(m.trainer_id) : undefined }))}
          onComplete={handleGiftRewardsComplete}
          onCancel={handleGiftRewardsComplete}
          submissionType={submission?.submissionType || 'art'}
        />
      </div>
    );
  }

  // Render prompt rewards claiming step (existing flow)
  return (
    <div className="prompt-rewards-claiming">
      {/* Success Message */}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Error"
      />

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
          {(artWritingRewards?.totalCoins ?? 0) > 0 && (
            <div className="reward-item">
              <i className="fas fa-coins"></i>
              <span>+{artWritingRewards.totalCoins} coins</span>
            </div>
          )}
        </div>
        {hasGiftLevels && (
          <div className="info-message">
            <i className="fas fa-gift"></i>
            Gift rewards have been allocated!
          </div>
        )}
      </div>

      {/* Prompt Rewards Section */}
      <div className="form-section">
        <h3>
          <i className="fas fa-scroll"></i>
          Prompt Rewards
        </h3>

        {!promptRewardsClaimed ? (
          <>
            {/* Levels Allocation */}
            {(promptRewards?.levels ?? 0) > 0 && (
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
            {(promptRewards?.coins ?? 0) > 0 && (
              <div className="prompt-reward-item">
                <i className="fas fa-coins"></i>
                <span>{promptRewards.coins} coins (to {trainer?.name})</span>
              </div>
            )}

            {/* Items Display */}
            {promptRewards?.items && promptRewards.items.length > 0 && (
              <div className="prompt-items-section">
                <h4>Items (to {trainer?.name})</h4>
                <div className="prompt-items-grid">
                  {promptRewards.items.map((item, index) => (
                    <div key={index} className="prompt-item-card">
                      {(item.image_url || item.icon) ? (
                        <img
                          src={item.image_url || item.icon}
                          alt={item.item_name || 'Item'}
                          className="item-icon"
                        />
                      ) : (
                        <i className="fas fa-gift"></i>
                      )}
                      <span>{item.item_name || item.display || 'Item'}</span>
                      {item.quantity && item.quantity > 1 && <small>x{item.quantity}</small>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim Button */}
            <div className="submission__claim-actions">
              <button
                className="button success lg"
                onClick={handleClaimPromptRewards}
                disabled={claimingRewards || promptRewardsClaimed || (levelTarget === 'monster' && !targetMonsterId)}
              >
                {claimingRewards ? (
                  <>
                    <LoadingSpinner size="small" />
                    Claiming...
                  </>
                ) : promptRewardsClaimed ? (
                  <>
                    <i className="fas fa-check-circle"></i>
                    Rewards Claimed
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
                          [index]: id || trainerId
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
                    <span>Claimed as &quot;{monster.final_name}&quot;</span>
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
            disabled={!allRewardsClaimed && ((promptRewards?.levels && promptRewards.levels > 0) || unclaimedMonsters.some(m => !m.claimed))}
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
}
