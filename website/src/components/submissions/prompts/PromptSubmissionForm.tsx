import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { TrainerAutocomplete } from '../../common/TrainerAutocomplete';

interface Trainer {
  id: number;
  name: string;
  is_owned?: boolean;
}

interface Prompt {
  id: number;
  title: string;
  description: string;
  levelReward?: number;
  coinReward?: number;
}

interface RewardEstimate {
  levels?: number;
  coins?: number;
}

interface SubmissionResult {
  success: boolean;
  [key: string]: unknown;
}

interface PromptSubmissionFormProps {
  onSubmissionComplete?: (result: SubmissionResult) => void;
  category?: string;
}

export function PromptSubmissionForm({
  onSubmissionComplete,
  category = 'general'
}: PromptSubmissionFormProps) {
  const { currentUser } = useAuth();

  // Form state
  const [trainerId, setTrainerId] = useState<string | number | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionPreview, setSubmissionPreview] = useState('');
  const [useFileUpload, setUseFileUpload] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [rewardEstimate, setRewardEstimate] = useState<RewardEstimate | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // Fetch user's trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        setUserTrainers(response.trainers || []);

        if (response.trainers && response.trainers.length > 0) {
          setTrainerId(response.trainers[0].id);
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again later.'));
      }
    };

    if (currentUser) {
      fetchTrainers();
    }
  }, [currentUser]);

  // Fetch available prompts when trainer changes
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!trainerId) return;

      try {
        setLoadingPrompts(true);
        const response = await submissionService.getAvailablePrompts(trainerId, category);
        setAvailablePrompts(response.prompts || []);
        setLoadingPrompts(false);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load available prompts. Please try again later.'));
        setLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, [trainerId, category]);

  // Handle prompt selection
  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
    const prompt = availablePrompts.find(p => p.id === parseInt(promptId));
    setSelectedPrompt(prompt || null);
  };

  // Handle submission file change
  const handleSubmissionFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
      setSubmissionPreview(URL.createObjectURL(file));
    }
  };

  // Calculate reward estimate
  const calculateRewardEstimate = async () => {
    if (!trainerId || !selectedPromptId) {
      setError('Please select a trainer and prompt to calculate rewards.');
      return;
    }

    try {
      setLoading(true);

      const promptData = {
        promptId: parseInt(selectedPromptId),
        trainerId
      };

      const response = await submissionService.calculatePromptRewards(promptData);
      setRewardEstimate(response);
      setShowRewardEstimate(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to calculate rewards. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!trainerId || !selectedPromptId) {
      setError('Please select a trainer and prompt.');
      return;
    }

    if (!submissionUrl && !submissionFile) {
      setError('Please provide either a URL or upload an image for your submission.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('promptId', selectedPromptId);
      formData.append('trainerId', trainerId.toString());

      if (useFileUpload && submissionFile) {
        formData.append('submissionFile', submissionFile);
      } else if (submissionUrl) {
        formData.append('submissionUrl', submissionUrl);
      }

      const result = await submissionService.submitPrompt(formData);

      // Reset form
      setSelectedPromptId('');
      setSubmissionUrl('');
      setSubmissionFile(null);
      setSubmissionPreview('');
      setUseFileUpload(false);
      setSelectedPrompt(null);
      setRewardEstimate(null);
      setShowRewardEstimate(false);

      if (onSubmissionComplete) {
        onSubmissionComplete(result);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit prompt. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submission-form-container">
      <h2>Submit Prompt Artwork</h2>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Submission Error"
      />

      <form className="submission-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <TrainerAutocomplete
              trainers={userTrainers}
              selectedTrainerId={trainerId}
              onSelect={(id) => setTrainerId(id)}
              label="Trainer"
              placeholder="Type to search trainers..."
            />
          </div>
        </div>

        {/* Prompt Selection */}
        <div className="form-section">
          <h3>Select Prompt</h3>

          {loadingPrompts ? (
            <div className="error-container">
              <LoadingSpinner />
              <p>Loading available prompts...</p>
            </div>
          ) : availablePrompts.length === 0 ? (
            <div className="empty-notice">
              <p>No available prompts found for this trainer. Please check back later or select a different trainer.</p>
            </div>
          ) : (
            <div className="prompts-container">
              {availablePrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`prompt-card ${selectedPromptId === prompt.id.toString() ? 'selected' : ''}`}
                  onClick={() => handlePromptSelect(prompt.id.toString())}
                >
                  <h4 className="submission__prompt-title">{prompt.title}</h4>
                  <p className="submission__prompt-description">{prompt.description}</p>
                  <div className="prompt-text">
                    <span className="reward-badge">
                      <i className="fas fa-arrow-up"></i> {prompt.levelReward} Levels
                    </span>
                    <span className="reward-badge">
                      <i className="fas fa-coins"></i> {prompt.coinReward} Coins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submission Details */}
        {selectedPrompt && (
          <div className="form-section">
            <h3>Submission Details</h3>

            <div className="selected-prompt-details">
              <h4>{selectedPrompt.title}</h4>
              <p>{selectedPrompt.description}</p>
              <div className="prompt-text">
                <span className="reward-badge">
                  <i className="fas fa-arrow-up"></i> {selectedPrompt.levelReward} Levels
                </span>
                <span className="reward-badge">
                  <i className="fas fa-coins"></i> {selectedPrompt.coinReward} Coins
                </span>
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-switch">
                <input
                  id="use-file-upload"
                  type="checkbox"
                  checked={useFileUpload}
                  onChange={() => setUseFileUpload(!useFileUpload)}
                />
                <label htmlFor="use-file-upload">Upload Image File</label>
              </div>
            </div>

            {useFileUpload ? (
              <div className="form-group">
                <label htmlFor="submission-file">Upload Artwork *</label>
                <div className="file-upload-area">
                  <input
                    id="submission-file"
                    type="file"
                    accept="image/*"
                    onChange={handleSubmissionFileChange}
                    required={useFileUpload}
                  />
                  <label htmlFor="submission-file" className="file-upload-label">
                    Choose File
                  </label>
                  <span className="file-name">
                    {submissionFile ? submissionFile.name : 'No file chosen'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="submission-url">Artwork URL *</label>
                <input
                  id="submission-url"
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="Enter URL to your artwork"
                  required={!useFileUpload}
                />
              </div>
            )}

            {submissionPreview && (
              <div className="image-container medium">
                <img
                  src={submissionPreview}
                  alt="Submission Preview"
                />
              </div>
            )}
          </div>
        )}

        {/* Reward Estimate */}
        {selectedPrompt && (
          <div className="form-section">
            <h3>Reward Estimate</h3>

            <button
              type="button"
              className="button secondary mb-md"
              onClick={calculateRewardEstimate}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Rewards'}
            </button>

            {showRewardEstimate && rewardEstimate && (
              <div className="reward-estimate-section">
                <h4>Estimated Rewards:</h4>

                <div>
                  <h5>Trainer Rewards</h5>
                  <div className="container cols-2 gap-md">
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Levels:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.levels}</span>
                    </div>
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Coins:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.coins} <i className="fas fa-coins"></i></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="button success"
            disabled={loading || !selectedPrompt}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Submitting...
              </>
            ) : (
              'Submit Prompt'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
