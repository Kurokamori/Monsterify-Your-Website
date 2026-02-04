import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import GiftRewards from './GiftRewards';


const TrainerReferenceSubmissionForm = ({ onSubmissionComplete }) => {
  const { currentUser } = useAuth();

  // Form state
  const [references, setReferences] = useState([{
    trainerId: '',
    referenceUrl: '',
    referenceFile: null,
    referencePreview: '',
    customLevels: 0,
    useCustomLevels: false
  }]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);
  const [rewardEstimate, setRewardEstimate] = useState(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Fetch user's trainers and monsters
  useEffect(() => {
    const fetchTrainersAndMonsters = async () => {
      try {
        const userId = currentUser?.discord_id;
        
        // Fetch trainers
        const response = await trainerService.getAllTrainers();
        setUserTrainers(response.trainers || []);

        // Fetch ALL monsters for ALL user trainers (for gift rewards)
        if (response.trainers && response.trainers.length > 0) {
          const allMonsters = [];

          for (const trainer of response.trainers) {
            try {
              // Fetch monsters for this trainer with high limit to get all
              const monstersResponse = await trainerService.getTrainerMonsters(trainer.id, { limit: 1000 });
              if (monstersResponse.monsters) {
                allMonsters.push(...monstersResponse.monsters);
              }
            } catch (monsterErr) {
              console.error(`Error fetching monsters for trainer ${trainer.id}:`, monsterErr);
            }
          }

          setUserMonsters(allMonsters);
          console.log(`Loaded ${allMonsters.length} total monsters for gift rewards`);
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again later.');
      }
    };

    fetchTrainersAndMonsters();
  }, [currentUser]);

  // Add a new reference entry
  const addReference = () => {
    setReferences([
      ...references,
      {
        trainerId: '',
        referenceUrl: '',
        referenceFile: null,
        referencePreview: '',
        customLevels: 0,
        useCustomLevels: false
      }
    ]);
  };

  // Remove a reference entry
  const removeReference = (index) => {
    const newReferences = [...references];
    newReferences.splice(index, 1);
    setReferences(newReferences);
  };

  // Handle reference field changes
  const handleReferenceChange = (index, field, value) => {
    const newReferences = [...references];
    newReferences[index][field] = value;
    setReferences(newReferences);
  };

  // Handle reference image change
  const handleReferenceImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const newReferences = [...references];
      newReferences[index].referenceFile = file;
      newReferences[index].referencePreview = URL.createObjectURL(file);
      setReferences(newReferences);
    }
  };

  // Calculate reward estimate
  const calculateRewardEstimate = async () => {
    // Validate that at least one reference has a trainer and either a URL or file
    const validReferences = references.filter(ref =>
      ref.trainerId && (ref.referenceUrl || ref.referenceFile)
    );

    if (validReferences.length === 0) {
      setError('Please provide at least one valid reference with a trainer and image.');
      return;
    }

    try {
      setLoading(true);

      const referenceData = {
        referenceType: 'trainer',
        references: validReferences.map(ref => ({
          trainerId: parseInt(ref.trainerId),
          customLevels: ref.useCustomLevels ? parseInt(ref.customLevels) : undefined
        }))
      };

      const response = await submissionService.calculateReferenceRewards(referenceData);
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

    // Validate that at least one reference has a trainer and either a URL or file
    const validReferences = references.filter(ref =>
      ref.trainerId && (ref.referenceUrl || ref.referenceFile)
    );

    if (validReferences.length === 0) {
      setError('Please provide at least one valid reference with a trainer and image.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('referenceType', 'trainer');

      // Add references
      validReferences.forEach((ref, index) => {
        formData.append(`trainerId_${index}`, ref.trainerId);

        if (ref.referenceFile) {
          formData.append(`referenceFile_${index}`, ref.referenceFile);
        } else if (ref.referenceUrl) {
          formData.append(`referenceUrl_${index}`, ref.referenceUrl);
        }

        if (ref.useCustomLevels) {
          formData.append(`customLevels_${index}`, ref.customLevels);
        }
      });

      const result = await submissionService.submitReference(formData);

      // Check if there are gift levels to distribute
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;

      if (totalGiftLevels > 0) {
        // Show gift rewards interface
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
        console.log('Gift levels detected for reference submission:', {
          totalGiftLevels,
          giftItems: result.rewards?.giftItems?.length || 0,
          giftMonsters: result.rewards?.giftMonsters?.length || 0
        });
      } else {
        // No gift levels, proceed with normal completion
        handleSubmissionComplete(result);
      }

    } catch (err) {
      console.error('Error submitting trainer references:', err);
      setError('Failed to submit trainer references. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle submission completion
  const handleSubmissionComplete = (result) => {
    // Reset form
    setReferences([{
      trainerId: '',
      referenceUrl: '',
      referenceFile: null,
      referencePreview: '',
      customLevels: 0,
      useCustomLevels: false
    }]);
    setRewardEstimate(null);
    setShowRewardEstimate(false);

    // Notify parent component
    if (onSubmissionComplete) {
      onSubmissionComplete(result);
    }
  };

  // Handle gift rewards completion
  const handleGiftRewardsComplete = (giftRewardsResult) => {
    setShowGiftRewards(false);
    handleSubmissionComplete(submissionResult);
  };

  // Handle gift rewards cancellation
  const handleGiftRewardsCancel = () => {
    setShowGiftRewards(false);
    handleSubmissionComplete(submissionResult);
  };

  return (
    <div className="submission-form-container">
      <h2>Submit Trainer References</h2>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      <form className="submission-form" onSubmit={handleSubmit}>
        {/* Reference Entries */}
        <div className="form-section">
          <h3>Trainer References</h3>
          <p className="form-description">
            Submit reference images for your trainers. These will be used to help artists draw your characters accurately.
          </p>

          {references.map((reference, index) => (
            <div key={index} className="reference-entry">
              <div className="reference-header">
                <h4>Reference #{index + 1}</h4>
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeReference(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <TrainerAutocomplete
                  id={`trainer-${index}`}
                  trainers={userTrainers}
                  selectedTrainerId={reference.trainerId}
                  onSelect={(id) => handleReferenceChange(index, 'trainerId', id)}
                  label="Trainer"
                  placeholder="Type to search trainers..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`reference-url-${index}`}>Reference URL</label>
                  <input
                    id={`reference-url-${index}`}
                    type="url"
                    value={reference.referenceUrl}
                    onChange={(e) => handleReferenceChange(index, 'referenceUrl', e.target.value)}
                    placeholder="Enter URL to reference image"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`reference-file-${index}`}>Or Upload Image</label>
                  <div className="file-upload-container">
                    <input
                      id={`reference-file-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleReferenceImageChange(index, e)}
                    />
                    <label htmlFor={`reference-file-${index}`} className="file-upload-label">
                      Choose File
                    </label>
                    <span className="file-name">
                      {reference.referenceFile ? reference.referenceFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>
              </div>

              {reference.referencePreview && (
                <div className="image-preview-container">
                  <img
                    src={reference.referencePreview}
                    alt="Reference Preview"
                    className="image-preview"
                  />
                </div>
              )}

              <div className="form-group">
                <div className="checkbox-container">
                  <input
                    id={`custom-levels-${index}`}
                    type="checkbox"
                    checked={reference.useCustomLevels}
                    onChange={(e) => handleReferenceChange(index, 'useCustomLevels', e.target.checked)}
                  />
                  <label htmlFor={`custom-levels-${index}`}>Use custom level reward</label>
                </div>
              </div>

              {reference.useCustomLevels && (
                <div className="form-group">
                  <label htmlFor={`custom-levels-value-${index}`}>Custom Levels</label>
                  <input
                    id={`custom-levels-value-${index}`}
                    type="number"
                    min="0"
                    max="10"
                    value={reference.customLevels}
                    onChange={(e) => handleReferenceChange(index, 'customLevels', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            className="add-button"
            onClick={addReference}
          >
            Add Another Reference
          </button>
        </div>

        {/* Reward Estimate */}
        <div className="form-section">
          <h3>Reward Estimate</h3>

          <button
            type="button"
            className="estimate-button"
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
                <div className="reward-items">
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

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Submitting...
              </>
            ) : (
              'Submit References'
            )}
          </button>
        </div>
      </form>

      {showGiftRewards && (
        <GiftRewards
          giftLevels={giftLevels}
          userTrainers={userTrainers}
          userMonsters={userMonsters}
          onComplete={handleGiftRewardsComplete}
          onCancel={handleGiftRewardsCancel}
          submissionType="reference"
        />
      )}
    </div>
  );
};

export default TrainerReferenceSubmissionForm;
