import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import TrainerAutocomplete from '../common/TrainerAutocomplete';


const PromptSubmissionForm = ({ onSubmissionComplete, category = 'general' }) => {
  const { currentUser } = useAuth();

  // Form state
  const [trainerId, setTrainerId] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionPreview, setSubmissionPreview] = useState('');
  const [useFileUpload, setUseFileUpload] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [availablePrompts, setAvailablePrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [rewardEstimate, setRewardEstimate] = useState(null);
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
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again later.');
      }
    };

    fetchTrainers();
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
        console.error('Error fetching prompts:', err);
        setError('Failed to load available prompts. Please try again later.');
        setLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, [trainerId, category]);

  // Handle prompt selection
  const handlePromptSelect = (promptId) => {
    setSelectedPromptId(promptId);
    const prompt = availablePrompts.find(p => p.id === parseInt(promptId));
    setSelectedPrompt(prompt || null);
  };

  // Handle submission file change
  const handleSubmissionFileChange = (e) => {
    const file = e.target.files[0];
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
        trainerId: parseInt(trainerId)
      };

      const response = await submissionService.calculatePromptRewards(promptData);
      setRewardEstimate(response);
      setShowRewardEstimate(true);

    } catch (err) {
      console.error('Error calculating rewards:', err);
      setError('Failed to calculate rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
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
      formData.append('trainerId', trainerId);
      
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

      // Notify parent component
      if (onSubmissionComplete) {
        onSubmissionComplete(result);
      }

    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError('Failed to submit prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submission-form-container">
      <h2>Submit Prompt Artwork</h2>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      <form className="submission-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <TrainerAutocomplete
              id="prompt-trainer"
              trainers={userTrainers}
              selectedTrainerId={trainerId}
              onSelect={(id) => setTrainerId(id)}
              label="Trainer"
              placeholder="Type to search trainers..."
              required
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
            <div className="no-prompts-message">
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
                  <h4 className="prompt-title">{prompt.title}</h4>
                  <p className="prompt-description">{prompt.description}</p>
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
                <div className="file-upload-container">
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
              className="button secondary"
              onClick={calculateRewardEstimate}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Rewards'}
            </button>

            {showRewardEstimate && rewardEstimate && (
              <div className="reward-estimate">
                <h4>Estimated Rewards:</h4>

                <div className="reward-section">
                  <h5>Trainer Rewards</h5>
                  <div className="fandom-grid">
                    <div className="reward-item">
                      <span className="reward-label">Levels:</span>
                      <span className="reward-value">{rewardEstimate.levels}</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-label">Coins:</span>
                      <span className="reward-value">{rewardEstimate.coins} <i className="fas fa-coins"></i></span>
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
};

export default PromptSubmissionForm;
