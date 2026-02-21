import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Modal } from '../../common/Modal';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import monsterService from '../../../services/monsterService';
import type { Prompt } from './PromptCard';

interface Trainer {
  id: number;
  name: string;
  level: number;
}

interface Monster {
  id: number;
  nickname?: string;
  species_name: string;
  level: number;
  types?: string[];
  attribute?: string;
}

interface RewardItem {
  item_id?: number;
  item_name?: string;
  quantity?: number;
  name?: string;
  type?: string;
}

interface AppliedRewards {
  levels: number;
  coins: number;
  items?: RewardItem[];
  special_items?: RewardItem[];
  monsters?: Monster[];
}

interface PromptRewardsObj {
  levels?: number;
  coins?: number;
  items?: RewardItem[];
  monster_roll?: { enabled: boolean; parameters?: unknown };
  [key: string]: unknown;
}

interface Availability {
  available: boolean;
  reason?: string;
}

interface SubmissionFormData {
  trainer_id: string | number;
  monster_id: string;
  submission_content: string;
  submission_notes: string;
  submission_files: File[];
}

interface PromptSubmissionModalProps {
  isOpen: boolean;
  prompt: Prompt | null;
  trainerId?: string | number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromptSubmissionModal({
  isOpen,
  prompt,
  trainerId,
  onClose,
  onSuccess,
}: PromptSubmissionModalProps) {
  const [formData, setFormData] = useState<SubmissionFormData>({
    trainer_id: trainerId || '',
    monster_id: '',
    submission_content: '',
    submission_notes: '',
    submission_files: [],
  });
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [appliedRewards, setAppliedRewards] = useState<AppliedRewards | null>(null);
  const [rerolling, setRerolling] = useState(false);

  // Check prompt availability
  useEffect(() => {
    if (!isOpen || !prompt || !trainerId) return;

    const checkAvailability = async () => {
      try {
        setCheckingAvailability(true);
        setError(null);
        const data = await submissionService.checkPromptAvailability(prompt.id, trainerId);
        if (data.success) {
          setAvailability(data);
          if (!data.available) {
            setError(data.reason || 'This prompt is not available');
          }
        } else {
          setError(data.message || 'Failed to check availability');
        }
      } catch (err) {
        console.error('Error checking availability:', err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Failed to check prompt availability');
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [isOpen, prompt, trainerId]);

  // Fetch user's trainers
  useEffect(() => {
    if (!isOpen) return;

    const fetchTrainers = async () => {
      try {
        const data = await trainerService.getUserTrainers();
        setUserTrainers(data.trainers || []);
      } catch (err) {
        console.error('Error fetching trainers:', err);
      }
    };

    fetchTrainers();
  }, [isOpen]);

  // Fetch trainer's monsters when trainer changes
  useEffect(() => {
    if (!formData.trainer_id) return;

    const fetchMonsters = async () => {
      try {
        const data = await monsterService.getTrainerMonsters(formData.trainer_id);
        setTrainerMonsters(data.monsters || []);
      } catch (err) {
        console.error('Error fetching monsters:', err);
      }
    };

    fetchMonsters();
  }, [formData.trainer_id]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setFormData(prev => ({ ...prev, submission_files: files }));
  };

  const formatRewards = (rewards?: string | Prompt['rewards']): string => {
    if (!rewards) return 'No rewards specified';
    const rewardObj: PromptRewardsObj = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
    const parts: string[] = [];
    if (rewardObj.levels) parts.push(`${rewardObj.levels} levels`);
    if (rewardObj.coins) parts.push(`${rewardObj.coins} coins`);
    if (rewardObj.items && rewardObj.items.length > 0) {
      parts.push(`${rewardObj.items.length} item${rewardObj.items.length > 1 ? 's' : ''}`);
    }
    if (rewardObj.monster_roll && rewardObj.monster_roll.enabled) {
      parts.push('Monster roll');
    }
    return parts.length > 0 ? parts.join(', ') : 'Custom rewards';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    if (!availability?.available) {
      setError('This prompt is not available for submission');
      return;
    }

    if (!formData.submission_content.trim()) {
      setError('Please provide submission content');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = new FormData();
      submitData.append('trainer_id', String(formData.trainer_id));
      if (formData.monster_id) {
        submitData.append('monster_id', formData.monster_id);
      }
      submitData.append('submission_content', formData.submission_content);
      if (formData.submission_notes) {
        submitData.append('submission_notes', formData.submission_notes);
      }
      formData.submission_files.forEach((file, index) => {
        submitData.append(`submission_file_${index}`, file);
      });

      const data = await submissionService.submitToPrompt(prompt.id, submitData);

      if (data.success) {
        if (data.submission?.applied_rewards) {
          setAppliedRewards(data.submission.applied_rewards);
          setSubmissionComplete(true);
        } else {
          onSuccess();
        }
      } else {
        setError(data.message || 'Failed to submit to prompt');
      }
    } catch (err) {
      console.error('Error submitting to prompt:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit to prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleRerollMonster = async (monster: Monster) => {
    if (!prompt) return;
    const rewardsObj: PromptRewardsObj | undefined = prompt.rewards
      ? (typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards) as PromptRewardsObj
      : undefined;

    try {
      setRerolling(true);
      setError(null);
      const data = await submissionService.rerollMonster(
        formData.trainer_id,
        monster.id,
        rewardsObj?.monster_roll?.parameters,
      );

      if (data.success && appliedRewards) {
        setAppliedRewards(prev => prev ? {
          ...prev,
          monsters: prev.monsters?.map(m => m.id === monster.id ? data.newMonster : m),
        } : prev);
      } else {
        setError(data.message || 'Failed to reroll monster');
      }
    } catch (err) {
      console.error('Error rerolling monster:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to reroll monster');
    } finally {
      setRerolling(false);
    }
  };

  const handleCloseRewards = () => {
    setSubmissionComplete(false);
    setAppliedRewards(null);
    onSuccess();
  };

  if (!prompt) return null;

  // Loading state while checking availability
  if (checkingAvailability) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Checking Availability">
        <div className="modal-loading">
          <LoadingSpinner message="Checking prompt availability..." />
        </div>
      </Modal>
    );
  }

  // Show rewards if submission is complete
  if (submissionComplete && appliedRewards) {
    return (
      <Modal isOpen={isOpen} onClose={handleCloseRewards} title="Submission Approved - Rewards Received!" size="large">
        <div className="prompt-submission-modal">
          <div className="rewards-display">
            <h3>Congratulations! Your submission has been approved!</h3>

            {(appliedRewards.levels > 0 || appliedRewards.coins > 0) && (
              <div className="item-rewards-list">
                {appliedRewards.levels > 0 && (
                  <div className="reward-item">
                    <span>⭐</span>
                    <span>+{appliedRewards.levels} Level{appliedRewards.levels > 1 ? 's' : ''}</span>
                  </div>
                )}
                {appliedRewards.coins > 0 && (
                  <div className="reward-item">
                    <span>💰</span>
                    <span>+{appliedRewards.coins} Coins</span>
                  </div>
                )}
              </div>
            )}

            {appliedRewards.items && appliedRewards.items.length > 0 && (
              <div className="item-rewards-list">
                <h4>Items Received:</h4>
                {appliedRewards.items.map((item, index) => (
                  <div key={index} className="reward-item">
                    <span>📦</span>
                    <span>{item.quantity || 1}x {item.item_name || `Item ${item.item_id}`}</span>
                  </div>
                ))}
              </div>
            )}

            {appliedRewards.special_items && appliedRewards.special_items.length > 0 && (
              <div className="item-rewards-list">
                <h4>Special Items Received:</h4>
                {appliedRewards.special_items.map((item, index) => (
                  <div key={index} className="reward-item">
                    <span>✨</span>
                    <span>{item.quantity || 1}x {item.name} ({item.type})</span>
                  </div>
                ))}
              </div>
            )}

            {appliedRewards.monsters && appliedRewards.monsters.length > 0 && (
              <div className="item-rewards-list">
                <h4>Monsters Received:</h4>
                {appliedRewards.monsters.map((monster, index) => (
                  <div key={index} className="gift-monster-card">
                    <div className="monster-info">
                      <h5>{monster.nickname || monster.species_name}</h5>
                      <p>Level {monster.level} • {monster.types?.join('/')}</p>
                      {monster.attribute && <p>Attribute: {monster.attribute}</p>}
                    </div>
                    <button
                      onClick={() => handleRerollMonster(monster)}
                      disabled={rerolling}
                      className="button secondary"
                    >
                      {rerolling ? 'Rerolling...' : 'Reroll with Forget-Me-Not'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rewards-actions">
              <button onClick={handleCloseRewards} className="button primary">
                Continue
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }


  // Main submission form
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Submit to: ${prompt.title}`} size="large">
      <div className="prompt-submission-modal">
        {/* Prompt Info */}
        <div className="prompt-info-section">
          <div>
            <h3>{prompt.title}</h3>
            <p className="submission__prompt-description">{prompt.description}</p>

            {prompt.prompt_text && (
              <div className="prompt-text">
                <h4>Prompt Details:</h4>
                <p>{prompt.prompt_text}</p>
              </div>
            )}

            <div className="prompt-text">
              <h4>Rewards:</h4>
              <p>{formatRewards(prompt.rewards)}</p>
            </div>

            {prompt.requirements && (
              <div className="prompt-text">
                <h4>Requirements:</h4>
                <p>{prompt.prerequisites || 'See detailed requirements'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Availability Status */}
        {availability && !availability.available && (
          <div className="availability-error">
            <p><strong>Not Available:</strong> {availability.reason}</p>
          </div>
        )}

        {/* Submission Form */}
        {availability?.available && (
          <form onSubmit={handleSubmit} className="submission-form">
            <div className="form-group">
              <label htmlFor="trainer_id">Trainer *</label>
              <select
                id="trainer_id"
                name="trainer_id"
                value={String(formData.trainer_id)}
                onChange={handleInputChange}
                required

              >
                <option value="">Select a trainer</option>
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} (Lv. {trainer.level})
                  </option>
                ))}
              </select>
            </div>

            {prompt.target_type !== 'trainer' && trainerMonsters.length > 0 && (
              <div className="form-group">
                <label htmlFor="monster_id">
                  Monster {prompt.target_type === 'monster' ? '*' : '(Optional)'}
                </label>
                <select
                  id="monster_id"
                  name="monster_id"
                  value={formData.monster_id}
                  onChange={handleInputChange}
                  required={prompt.target_type === 'monster'}
  
                >
                  <option value="">Select a monster</option>
                  {trainerMonsters.map(monster => (
                    <option key={monster.id} value={monster.id}>
                      {monster.nickname || monster.species_name} (Lv. {monster.level})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="submission_content">Submission Content *</label>
              <textarea
                id="submission_content"
                name="submission_content"
                value={formData.submission_content}
                onChange={handleInputChange}
                required
                rows={6}

                placeholder="Describe your submission, provide links to artwork, or write your response to the prompt..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="submission_notes">Additional Notes</label>
              <textarea
                id="submission_notes"
                name="submission_notes"
                value={formData.submission_notes}
                onChange={handleInputChange}
                rows={3}

                placeholder="Any additional notes or comments..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="submission_files">Attach Files (Optional)</label>
              <input
                id="submission_files"
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"

              />
              <small className="form-help-text">
                You can attach images, documents, or other relevant files
              </small>
            </div>

            <ErrorModal
              isOpen={!!error}
              onClose={() => setError(null)}
              message={error || ''}
              title="Submission Error"
            />

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="button secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={loading || !availability?.available}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    Submitting...
                  </>
                ) : (
                  'Submit to Prompt'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}