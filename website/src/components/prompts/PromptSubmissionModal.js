import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

const PromptSubmissionModal = ({ prompt, trainerId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    trainer_id: trainerId,
    monster_id: '',
    submission_content: '',
    submission_notes: '',
    submission_files: []
  });
  const [userTrainers, setUserTrainers] = useState([]);
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [appliedRewards, setAppliedRewards] = useState(null);
  const [rerolling, setRerolling] = useState(false);

  // Check prompt availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!trainerId || !prompt.id) return;
      
      try {
        setCheckingAvailability(true);
        const response = await fetch(`/api/prompts/${prompt.id}/availability/${trainerId}`);
        const data = await response.json();
        
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
        setError('Failed to check prompt availability');
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [prompt.id, trainerId]);

  // Fetch user's trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await fetch('/api/trainers/user');
        const data = await response.json();
        if (data.success) {
          setUserTrainers(data.trainers || []);
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
      }
    };

    fetchTrainers();
  }, []);

  // Fetch trainer's monsters when trainer changes
  useEffect(() => {
    const fetchMonsters = async () => {
      if (!formData.trainer_id) return;
      
      try {
        const response = await fetch(`/api/monsters/trainer/${formData.trainer_id}`);
        const data = await response.json();
        if (data.success) {
          setTrainerMonsters(data.monsters || []);
        }
      } catch (err) {
        console.error('Error fetching monsters:', err);
      }
    };

    fetchMonsters();
  }, [formData.trainer_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      submission_files: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      submitData.append('trainer_id', formData.trainer_id);
      if (formData.monster_id) {
        submitData.append('monster_id', formData.monster_id);
      }
      submitData.append('submission_content', formData.submission_content);
      if (formData.submission_notes) {
        submitData.append('submission_notes', formData.submission_notes);
      }

      // Add files if any
      formData.submission_files.forEach((file, index) => {
        submitData.append(`submission_file_${index}`, file);
      });

      const response = await fetch(`/api/prompts/${prompt.id}/submit`, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        // Check if submission was auto-approved and has rewards
        if (data.submission && data.submission.applied_rewards) {
          setAppliedRewards(data.submission.applied_rewards);
          setSubmissionComplete(true);
        } else {
          // Submission pending approval
          onSuccess();
        }
      } else {
        setError(data.message || 'Failed to submit to prompt');
      }
    } catch (err) {
      console.error('Error submitting to prompt:', err);
      setError('Failed to submit to prompt');
    } finally {
      setLoading(false);
    }
  };

  const formatRewards = (rewards) => {
    if (!rewards) return 'No rewards specified';
    
    const rewardObj = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
    const parts = [];
    
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

  const handleRerollMonster = async (monster, originalParams) => {
    try {
      setRerolling(true);
      setError(null);

      const response = await fetch('/api/prompts/reroll-monster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trainer_id: formData.trainer_id,
          monster_id: monster.id,
          original_params: originalParams
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the applied rewards with the new monster
        setAppliedRewards(prev => ({
          ...prev,
          monsters: prev.monsters.map(m =>
            m.id === monster.id ? data.newMonster : m
          )
        }));
      } else {
        setError(data.message || 'Failed to reroll monster');
      }
    } catch (err) {
      console.error('Error rerolling monster:', err);
      setError('Failed to reroll monster');
    } finally {
      setRerolling(false);
    }
  };

  const handleCloseRewards = () => {
    setSubmissionComplete(false);
    setAppliedRewards(null);
    onSuccess();
  };

  if (checkingAvailability) {
    return (
      <Modal onClose={onClose} title="Checking Availability">
        <div className="modal-loading">
          <LoadingSpinner />
          <p>Checking prompt availability...</p>
        </div>
      </Modal>
    );
  }

  // Show rewards if submission is complete
  if (submissionComplete && appliedRewards) {
    return (
      <Modal onClose={handleCloseRewards} title="Submission Approved - Rewards Received!" size="large">
        <div className="prompt-submission-modal">
          <div className="rewards-display">
            <h3>Congratulations! Your submission has been approved!</h3>

            {/* Level and Coin Rewards */}
            {(appliedRewards.levels > 0 || appliedRewards.coins > 0) && (
              <div className="item-rewards">
                {appliedRewards.levels > 0 && (
                  <div className="reward-item">
                    <span className="reward-icon">⭐</span>
                    <span className="reward-text">+{appliedRewards.levels} Level{appliedRewards.levels > 1 ? 's' : ''}</span>
                  </div>
                )}
                {appliedRewards.coins > 0 && (
                  <div className="reward-item">
                    <span className="reward-icon">💰</span>
                    <span className="reward-text">+{appliedRewards.coins} Coins</span>
                  </div>
                )}
              </div>
            )}

            {/* Item Rewards */}
            {appliedRewards.items && appliedRewards.items.length > 0 && (
              <div className="item-rewards">
                <h4>Items Received:</h4>
                {appliedRewards.items.map((item, index) => (
                  <div key={index} className="reward-item">
                    <span className="reward-icon">📦</span>
                    <span className="reward-text">{item.quantity || 1}x {item.item_name || `Item ${item.item_id}`}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Special Item Rewards */}
            {appliedRewards.special_items && appliedRewards.special_items.length > 0 && (
              <div className="item-rewards">
                <h4>Special Items Received:</h4>
                {appliedRewards.special_items.map((item, index) => (
                  <div key={index} className="reward-item">
                    <span className="reward-icon">✨</span>
                    <span className="reward-text">{item.quantity || 1}x {item.name} ({item.type})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Monster Rewards */}
            {appliedRewards.monsters && appliedRewards.monsters.length > 0 && (
              <div className="item-rewards">
                <h4>Monsters Received:</h4>
                {appliedRewards.monsters.map((monster, index) => (
                  <div key={index} className="gift-monster-card">
                    <div className="monster-info">
                      <h5>{monster.nickname || monster.species_name}</h5>
                      <p>Level {monster.level} • {monster.types?.join('/')}</p>
                      {monster.attribute && <p>Attribute: {monster.attribute}</p>}
                    </div>
                    <button
                      onClick={() => handleRerollMonster(monster, prompt.rewards?.monster_roll?.parameters)}
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

  return (
    <Modal onClose={onClose} title={`Submit to: ${prompt.title}`} size="large">
      <div className="prompt-submission-modal">
        {/* Prompt Info */}
        <div className="prompt-info-section">
          <div className="prompt-summary">
            <h3>{prompt.title}</h3>
            <p className="prompt-description">{prompt.description}</p>
            
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
            {/* Trainer Selection */}
            <div className="form-group">
              <label htmlFor="trainer_id">Trainer *</label>
              <select
                id="trainer_id"
                name="trainer_id"
                value={formData.trainer_id}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">Select a trainer</option>
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} (Lv. {trainer.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Monster Selection (Optional) */}
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
                  className="form-input"
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

            {/* Submission Content */}
            <div className="form-group">
              <label htmlFor="submission_content">Submission Content *</label>
              <textarea
                id="submission_content"
                name="submission_content"
                value={formData.submission_content}
                onChange={handleInputChange}
                required
                rows={6}
                className="form-input"
                placeholder="Describe your submission, provide links to artwork, or write your response to the prompt..."
              />
            </div>

            {/* Additional Notes */}
            <div className="form-group">
              <label htmlFor="submission_notes">Additional Notes</label>
              <textarea
                id="submission_notes"
                name="submission_notes"
                value={formData.submission_notes}
                onChange={handleInputChange}
                rows={3}
                className="form-input"
                placeholder="Any additional notes or comments..."
              />
            </div>

            {/* File Upload */}
            <div className="form-group">
              <label htmlFor="submission_files">Attach Files (Optional)</label>
              <input
                id="submission_files"
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="form-file"
              />
              <small className="form-help">
                You can attach images, documents, or other relevant files
              </small>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
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
};

export default PromptSubmissionModal;
