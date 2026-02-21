import { useState, useEffect, useRef } from 'react';
import submissionService from '../../../services/submissionService';
import { TrainerAutocomplete } from '../../common/TrainerAutocomplete';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';

interface Trainer {
  id: string | number;
  name: string;
  is_owned?: boolean;
}

interface PromptRewards {
  levels?: number;
  coins?: number;
  items?: unknown[];
  monsters?: unknown[];
  monster_roll?: { enabled: boolean };
  [key: string]: unknown;
}

interface Prompt {
  id: string | number;
  title: string;
  description: string;
  type: string;
  difficulty?: string;
  event_name?: string;
  rewards?: string | PromptRewards;
  max_submissions_per_trainer?: number;
}

interface SelectionResult {
  trainerId: string | number;
  trainer: Trainer;
  promptId: string | number;
  prompt: Prompt;
  submissionType: 'art' | 'writing';
}

interface PromptSelectionPageProps {
  category?: string;
  userTrainers?: Trainer[];
  initialTrainerId?: string | number | null;
  initialPromptId?: string | number | null;
  initialSubmissionType?: 'art' | 'writing' | null;
  onComplete: (result: SelectionResult) => void;
}

export function PromptSelectionPage({
  category = 'general',
  userTrainers = [],
  initialTrainerId = null,
  initialPromptId = null,
  initialSubmissionType = null,
  onComplete
}: PromptSelectionPageProps) {
  // Selection state
  const [trainerId, setTrainerId] = useState<string | number | null>(initialTrainerId);
  const [selectedPromptId, setSelectedPromptId] = useState<string | number | null>(initialPromptId);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [submissionType, setSubmissionType] = useState<'art' | 'writing' | null>(initialSubmissionType);

  // Data state
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ref for auto-scroll to submission type section
  const submissionTypeSectionRef = useRef<HTMLDivElement>(null);

  // Fetch available prompts when trainer changes
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!trainerId) {
        setAvailablePrompts([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await submissionService.getAvailablePrompts(trainerId, category);
        setAvailablePrompts(response.prompts || []);
      } catch (err) {
        console.error('Error fetching prompts:', err);
        const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load available prompts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [trainerId, category]);

  // Handle trainer selection
  const handleTrainerSelect = (id: string | number | null) => {
    setTrainerId(id);
    setSelectedPromptId(null);
    setSelectedPrompt(null);
    setSubmissionType(null);
  };

  // Handle prompt selection with auto-scroll
  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPromptId(prompt.id);
    setSelectedPrompt(prompt);

    setTimeout(() => {
      if (submissionTypeSectionRef.current) {
        submissionTypeSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Handle submission type selection
  const handleSubmissionTypeSelect = (type: 'art' | 'writing') => {
    setSubmissionType(type);
  };

  // Handle next button click
  const handleNext = () => {
    if (!trainerId || !selectedPromptId || !submissionType) {
      setError('Please select a trainer, prompt, and submission type.');
      return;
    }

    const trainer = userTrainers.find(t => t.id === trainerId);
    if (!trainer || !selectedPrompt) return;

    onComplete({
      trainerId,
      trainer,
      promptId: selectedPromptId,
      prompt: selectedPrompt,
      submissionType
    });
  };

  // Format rewards for display
  const formatRewards = (rewards: string | PromptRewards | undefined) => {
    if (!rewards) return null;

    const rewardObj: PromptRewards = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
    const parts: Array<{ icon: string; text: string }> = [];

    if (rewardObj.levels) parts.push({ icon: 'fa-arrow-up', text: `${rewardObj.levels} levels` });
    if (rewardObj.coins) parts.push({ icon: 'fa-coins', text: `${rewardObj.coins} coins` });
    if (rewardObj.items && rewardObj.items.length > 0) {
      parts.push({ icon: 'fa-gift', text: `${rewardObj.items.length} item${rewardObj.items.length > 1 ? 's' : ''}` });
    }
    if (rewardObj.monsters && rewardObj.monsters.length > 0) {
      parts.push({ icon: 'fa-dragon', text: `${rewardObj.monsters.length} monster roll${rewardObj.monsters.length > 1 ? 's' : ''}` });
    }
    if (rewardObj.monster_roll && rewardObj.monster_roll.enabled) {
      parts.push({ icon: 'fa-dragon', text: 'Monster roll' });
    }

    return parts;
  };

  // Check if form is valid for proceeding
  const isFormValid = trainerId && selectedPromptId && submissionType;

  return (
    <div className="prompt-selection-page">
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Error"
      />

      {/* Trainer Selection Section */}
      <div className="form-section">
        <h3>Select Trainer</h3>
        <div className="form-group">
          <TrainerAutocomplete
            trainers={userTrainers}
            selectedTrainerId={trainerId}
            onSelect={handleTrainerSelect}
            label="Trainer"
            placeholder="Type to search trainers..."
          />
        </div>
      </div>

      {/* Prompt Selection Section */}
      <div className="form-section">
        <h3>Select Prompt</h3>

        {!trainerId && (
          <div className="info-message">
            <i className="fas fa-info-circle"></i>
            Please select a trainer first to see available prompts.
          </div>
        )}

        {trainerId && loading && (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading available prompts...</p>
          </div>
        )}

        {trainerId && !loading && availablePrompts.length === 0 && (
          <div className="info-message">
            <i className="fas fa-info-circle"></i>
            No available prompts found for this trainer. Please check back later or select a different trainer.
          </div>
        )}

        {trainerId && !loading && availablePrompts.length > 0 && (
          <div className="prompt-cards-grid">
            {availablePrompts.map(prompt => (
              <div
                key={prompt.id}
                className={`prompt-selection-card ${selectedPromptId === prompt.id ? 'selected' : ''}`}
                onClick={() => handlePromptSelect(prompt)}
              >
                <div className="prompt-card-header">
                  {prompt.type === 'event' && prompt.event_name && (
                    <div className="prompt-event-name">
                      <i className="fas fa-star"></i>
                      {prompt.event_name}
                    </div>
                  )}
                  <h4 className="submission__prompt-title">{prompt.title}</h4>
                  <div className="prompt-badges">
                    <span className={`badge badge-type-${prompt.type}`}>
                      {prompt.type}
                    </span>
                    {prompt.difficulty && (
                      <span className={`badge badge-difficulty-${prompt.difficulty}`}>
                        {prompt.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <p className="submission__prompt-description">{prompt.description}</p>

                {/* Rewards Preview */}
                <div className="prompt-rewards-preview">
                  {formatRewards(prompt.rewards)?.map((reward, index) => (
                    <span key={index} className="reward-badge">
                      <i className={`fas ${reward.icon}`}></i>
                      {reward.text}
                    </span>
                  ))}
                </div>

                {/* Submission Limits */}
                {prompt.max_submissions_per_trainer && (
                  <div className="prompt-limits">
                    <small>
                      <i className="fas fa-exclamation-circle"></i>
                      Max {prompt.max_submissions_per_trainer} submission{prompt.max_submissions_per_trainer > 1 ? 's' : ''} per trainer
                    </small>
                  </div>
                )}

                {/* Selection Indicator */}
                {selectedPromptId === prompt.id && (
                  <div className="selection-indicator">
                    <i className="fas fa-check-circle"></i>
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Type Section - Shows after prompt selection */}
      <div
        ref={submissionTypeSectionRef}
        className={`form-section submission-type-section ${selectedPromptId ? 'visible' : 'hidden'}`}
      >
        <h3>Choose Submission Type</h3>
        <p className="section-description">
          How would you like to submit your work for this prompt?
        </p>

        <div className="submission-type-selector">
          <div
            className={`submission-type-card ${submissionType === 'art' ? 'selected' : ''}`}
            onClick={() => handleSubmissionTypeSelect('art')}
          >
            <div className="type-icon">
              <i className="fas fa-paint-brush"></i>
            </div>
            <h4>Art Submission</h4>
            <p>Submit artwork (digital, traditional, etc.)</p>
            <ul className="type-features">
              <li><i className="fas fa-check"></i> Quality-based rewards</li>
              <li><i className="fas fa-check"></i> Background bonuses</li>
              <li><i className="fas fa-check"></i> Trainer/monster appearances</li>
            </ul>
            {submissionType === 'art' && (
              <div className="type-selected-indicator">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>

          <div
            className={`submission-type-card ${submissionType === 'writing' ? 'selected' : ''}`}
            onClick={() => handleSubmissionTypeSelect('writing')}
          >
            <div className="type-icon">
              <i className="fas fa-pen-fancy"></i>
            </div>
            <h4>Writing Submission</h4>
            <p>Submit written content (stories, poems, etc.)</p>
            <ul className="type-features">
              <li><i className="fas fa-check"></i> Word count rewards</li>
              <li><i className="fas fa-check"></i> Participant bonuses</li>
              <li><i className="fas fa-check"></i> Book/chapter support</li>
            </ul>
            {submissionType === 'writing' && (
              <div className="type-selected-indicator">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Prompt Summary */}
      {selectedPrompt && submissionType && (
        <div className="form-section selection-summary">
          <h3>Selection Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Trainer:</span>
              <span className="summary-value">
                {userTrainers.find(t => t.id === trainerId)?.name || 'Unknown'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Prompt:</span>
              <span className="summary-value">{selectedPrompt.title}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Type:</span>
              <span className="summary-value">
                {submissionType === 'art' ? 'Art Submission' : 'Writing Submission'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="wizard-navigation">
        <div className="nav-spacer"></div>
        <button
          className="button primary lg"
          onClick={handleNext}
          disabled={!isFormValid}
        >
          Next: {submissionType === 'art' ? 'Art Details' : submissionType === 'writing' ? 'Writing Details' : 'Submission Details'}
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
