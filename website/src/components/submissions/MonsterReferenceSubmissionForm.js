import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import MonsterAutocomplete from '../common/MonsterAutocomplete';
import GiftRewards from './GiftRewards';


const MonsterReferenceSubmissionForm = ({ onSubmissionComplete }) => {
  const { currentUser } = useAuth();

  // Form state
  const [references, setReferences] = useState([{
    trainerId: '',
    monsterName: '',
    referenceUrl: '',
    referenceFile: null,
    referencePreview: '',
    customLevels: 0,
    useCustomLevels: false,
    instanceCount: 1,
    sameAppearanceForEachInstance: true,
    instanceAppearances: [],
    useDropdown: false
  }]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);
  const [rewardEstimate, setRewardEstimate] = useState(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);
  const [trainerMonsters, setTrainerMonsters] = useState({});
  
  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkTrainerId, setBulkTrainerId] = useState('');
  const [bulkCustomLevels, setBulkCustomLevels] = useState(0);
  const [bulkUseCustomLevels, setBulkUseCustomLevels] = useState(false);

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

  // Fetch monsters for a specific trainer
  const fetchTrainerMonsters = async (trainerId) => {
    if (!trainerId || trainerMonsters[trainerId]) {
      return; // Skip if no trainer or already cached
    }

    try {
      const response = await trainerService.getTrainerMonsters(trainerId, { limit: 1000 });
      setTrainerMonsters(prev => ({
        ...prev,
        [trainerId]: response.monsters || []
      }));
    } catch (err) {
      console.error('Error fetching trainer monsters:', err);
      // Don't show error to user as this is optional functionality
    }
  };

  // Add a new reference entry
  const addReference = () => {
    setReferences([
      ...references,
      {
        trainerId: '',
        monsterName: '',
        referenceUrl: '',
        referenceFile: null,
        referencePreview: '',
        customLevels: 0,
        useCustomLevels: false,
        instanceCount: 1,
        sameAppearanceForEachInstance: true,
        instanceAppearances: [],
        useDropdown: false
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

    // If changing trainer, fetch monsters for dropdown
    if (field === 'trainerId' && value) {
      fetchTrainerMonsters(value);
    }

    // If changing instance count, update instance appearances
    if (field === 'instanceCount') {
      const count = parseInt(value) || 1;
      const reference = newReferences[index];

      // If not using same appearance for each instance, create/update instance appearances
      if (!reference.sameAppearanceForEachInstance) {
        // Keep existing instance appearances, add new ones if needed
        const currentAppearances = reference.instanceAppearances || [];

        // We only need appearances for instances beyond the first one
        // (since the first one is handled by the main form)
        const neededAppearances = Math.max(0, count - 1);

        if (neededAppearances > currentAppearances.length) {
          // Add new appearances
          for (let i = currentAppearances.length; i < neededAppearances; i++) {
            currentAppearances.push({
              type: 'bust', // Default to bust
              instanceNumber: i + 2 // +2 because we're starting from the second instance (first is index 0)
            });
          }
        } else if (neededAppearances < currentAppearances.length) {
          // Remove extra appearances
          currentAppearances.splice(neededAppearances);
        }

        reference.instanceAppearances = currentAppearances;
      } else {
        // If using same appearance for all instances, clear instance appearances
        reference.instanceAppearances = [];
      }
    }

    // If toggling sameAppearanceForEachInstance, update instance appearances
    if (field === 'sameAppearanceForEachInstance') {
      const reference = newReferences[index];

      if (value) {
        // If using same appearance for all instances, clear instance appearances
        reference.instanceAppearances = [];
      } else {
        // If not using same appearance, create instance appearances for each instance beyond the first
        const count = parseInt(reference.instanceCount) || 1;
        const neededAppearances = Math.max(0, count - 1);
        const appearances = [];

        for (let i = 0; i < neededAppearances; i++) {
          appearances.push({
            type: 'bust', // Default to bust
            instanceNumber: i + 2 // +2 because we're starting from the second instance
          });
        }

        reference.instanceAppearances = appearances;
      }
    }

    setReferences(newReferences);
  };

  // Toggle between input field and dropdown for monster name
  const toggleMonsterNameInput = (index) => {
    const newReferences = [...references];
    newReferences[index].useDropdown = !newReferences[index].useDropdown;
    // Clear monster name when toggling to prevent confusion
    newReferences[index].monsterName = '';
    setReferences(newReferences);

    // If switching to dropdown and trainer is selected, fetch monsters
    if (newReferences[index].useDropdown && newReferences[index].trainerId) {
      fetchTrainerMonsters(newReferences[index].trainerId);
    }
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
    // Validate that at least one reference has a trainer, monster name, and either a URL or file
    const validReferences = references.filter(ref =>
      ref.trainerId && ref.monsterName && (ref.referenceUrl || ref.referenceFile)
    );

    if (validReferences.length === 0) {
      setError('Please provide at least one valid reference with a trainer, monster name, and image.');
      return;
    }

    try {
      setLoading(true);

      const referenceData = {
        referenceType: 'monster',
        references: validReferences.map(ref => ({
          trainerId: parseInt(ref.trainerId),
          monsterName: ref.monsterName,
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

  // Handle instance appearance change
  const handleInstanceAppearanceChange = (refIndex, instanceIndex, value) => {
    const newReferences = [...references];
    const reference = newReferences[refIndex];

    if (reference.instanceAppearances && reference.instanceAppearances[instanceIndex]) {
      reference.instanceAppearances[instanceIndex].type = value;
      setReferences(newReferences);
    }
  };

  // Handle bulk image upload
  const handleBulkImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!bulkTrainerId) {
      setError('Please select a trainer before uploading multiple images.');
      return;
    }

    // Create new references for each uploaded file
    const newReferences = files.map(file => ({
      trainerId: bulkTrainerId,
      monsterName: '',
      referenceUrl: '',
      referenceFile: file,
      referencePreview: URL.createObjectURL(file),
      customLevels: bulkUseCustomLevels ? bulkCustomLevels : 0,
      useCustomLevels: bulkUseCustomLevels,
      instanceCount: 1,
      sameAppearanceForEachInstance: true,
      instanceAppearances: [],
      useDropdown: false
    }));

    // Replace current references with bulk uploaded ones
    setReferences(newReferences);
    setShowBulkUpload(false);
    setError('');
  };

  // Toggle bulk upload mode
  const toggleBulkUpload = () => {
    if (showBulkUpload) {
      // Reset bulk upload state when hiding
      setBulkTrainerId('');
      setBulkCustomLevels(0);
      setBulkUseCustomLevels(false);
    }
    setShowBulkUpload(!showBulkUpload);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that at least one reference has a trainer, monster name, and either a URL or file
    const validReferences = references.filter(ref =>
      ref.trainerId && ref.monsterName && (ref.referenceUrl || ref.referenceFile)
    );

    if (validReferences.length === 0) {
      setError('Please provide at least one valid reference with a trainer, monster name, and image.');
      return;
    }

    // Validate that all references have a trainer selected
    const missingTrainer = references.some(ref => ref.monsterName && !ref.trainerId);
    if (missingTrainer) {
      setError('All monsters must have a trainer selected. Please select a trainer for each monster.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('referenceType', 'monster');

      // Add references
      validReferences.forEach((ref, index) => {
        formData.append(`trainerId_${index}`, ref.trainerId);
        formData.append(`monsterName_${index}`, ref.monsterName);
        formData.append(`instanceCount_${index}`, ref.instanceCount || 1);
        formData.append(`sameAppearanceForEachInstance_${index}`, ref.sameAppearanceForEachInstance ? 'true' : 'false');

        if (ref.referenceFile) {
          formData.append(`referenceFile_${index}`, ref.referenceFile);
        } else if (ref.referenceUrl) {
          formData.append(`referenceUrl_${index}`, ref.referenceUrl);
        }

        if (ref.useCustomLevels) {
          formData.append(`customLevels_${index}`, ref.customLevels);
        }

        // Add instance appearances if not using same appearance for all instances
        if (!ref.sameAppearanceForEachInstance && ref.instanceAppearances && ref.instanceAppearances.length > 0) {
          ref.instanceAppearances.forEach((appearance, i) => {
            formData.append(`instanceAppearance_${index}_${i}_type`, appearance.type);
            formData.append(`instanceAppearance_${index}_${i}_instanceNumber`, appearance.instanceNumber);
          });
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
      console.error('Error submitting monster references:', err);
      setError('Failed to submit monster references. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle submission completion
  const handleSubmissionComplete = (result) => {
    // Reset form
    setReferences([{
      trainerId: '',
      monsterName: '',
      referenceUrl: '',
      referenceFile: null,
      referencePreview: '',
      customLevels: 0,
      useCustomLevels: false,
      instanceCount: 1,
      sameAppearanceForEachInstance: true,
      instanceAppearances: [],
      useDropdown: false
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
      <h2>Submit Monster References</h2>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      <form className="submission-form" onSubmit={handleSubmit}>
        {/* Bulk Upload Section */}
        <div className="form-section">
          <div className="adopt-card">
            <h3>Upload Options</h3>
            <button
              type="button"
              className={`toggle-button${showBulkUpload ? 'active' : ''}`}
              onClick={toggleBulkUpload}
            >
              {showBulkUpload ? 'Switch to Individual Upload' : 'Upload Many Refs'}
            </button>
          </div>

          {showBulkUpload && (
            <div className="bulk-upload-section">
              <h4>Bulk Upload Settings</h4>
              <p className="form-description">
                Select a trainer and upload multiple images at once. You'll then fill in the monster names for each image.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <TrainerAutocomplete
                    id="bulk-trainer"
                    trainers={userTrainers}
                    selectedTrainerId={bulkTrainerId}
                    onSelect={(id) => setBulkTrainerId(id)}
                    label="Trainer (for all uploads)"
                    placeholder="Type to search trainers..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-container">
                  <input
                    id="bulk-custom-levels"
                    type="checkbox"
                    checked={bulkUseCustomLevels}
                    onChange={(e) => setBulkUseCustomLevels(e.target.checked)}
                  />
                  <label htmlFor="bulk-custom-levels">Use custom level reward for all</label>
                </div>
              </div>

              {bulkUseCustomLevels && (
                <div className="form-group">
                  <label htmlFor="bulk-custom-levels-value">Custom Levels (for all)</label>
                  <input
                    id="bulk-custom-levels-value"
                    type="number"
                    min="0"
                    max="10"
                    value={bulkCustomLevels}
                    onChange={(e) => setBulkCustomLevels(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="bulk-images">Upload Multiple Images</label>
                <div className="file-upload-container">
                  <input
                    id="bulk-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkImageUpload}
                  />
                  <label htmlFor="bulk-images" className="file-upload-label bulk-upload-label">
                    Choose Multiple Images
                  </label>
                </div>
                <p className="form-hint">
                  Hold Ctrl (or Cmd on Mac) to select multiple images at once
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reference Entries */}
        <div className="form-section">
          <h3>{showBulkUpload && references.length > 1 ? 'Review and Name Your Monsters' : 'Monster References'}</h3>
          {!showBulkUpload && (
            <p className="form-description">
              Submit reference images for your monsters. These will be used to help artists draw your monsters accurately.
            </p>
          )}
          {showBulkUpload && references.length > 1 && (
            <p className="form-description">
              Fill in the monster names for each uploaded image. The trainer and settings have been pre-filled.
            </p>
          )}

          {references.map((reference, index) => (
            <div key={index} className="reference-entry">
              <div className="reference-header">
                <h4>Reference #{index + 1}</h4>
                {index > 0 && (
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => removeReference(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Show trainer selection only in individual upload mode */}
              {!showBulkUpload && (
                <div className="form-row">
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

                  <div className="form-group">
                    <MonsterAutocomplete
                      id={`monster-name-${index}`}
                      monsters={reference.trainerId && trainerMonsters[reference.trainerId] ? trainerMonsters[reference.trainerId] : []}
                      onSelect={(name) => handleReferenceChange(index, 'monsterName', name)}
                      label="Monster Name"
                      placeholder={!reference.trainerId ? 'Select a trainer first' : 'Type to search monsters...'}
                      required
                      disabled={!reference.trainerId}
                      returnName={true}
                      allowFreeText={true}
                    />
                  </div>
                </div>
              )}

              {/* Show only monster name in bulk upload mode */}
              {showBulkUpload && (
                <div className="form-row">
                  <div className="form-group">
                    <MonsterAutocomplete
                      id={`monster-name-${index}`}
                      monsters={reference.trainerId && trainerMonsters[reference.trainerId] ? trainerMonsters[reference.trainerId] : []}
                      onSelect={(name) => handleReferenceChange(index, 'monsterName', name)}
                      label="Monster Name"
                      placeholder={!reference.trainerId ? 'Select a trainer first' : 'Type to search monsters...'}
                      required
                      disabled={!reference.trainerId}
                      returnName={true}
                      allowFreeText={true}
                    />
                  </div>
                  <div className="bulk-info">
                    <span>Trainer: {userTrainers.find(t => t.id == reference.trainerId)?.name || 'Unknown'}</span>
                  </div>
                </div>
              )}

              {/* Show file upload only in individual upload mode */}
              {!showBulkUpload && (
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
              )}

              {reference.referencePreview && (
                <div className="image-container medium">
                  <img
                    src={reference.referencePreview}
                    alt="Reference Preview"
                  />
                </div>
              )}

              {/* Advanced options - show all in individual mode, limited in bulk mode */}
              {!showBulkUpload && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`instance-count-${index}`}>Number of Instances</label>
                      <input
                        id={`instance-count-${index}`}
                        type="number"
                        min="1"
                        max="10"
                        value={reference.instanceCount}
                        onChange={(e) => handleReferenceChange(index, 'instanceCount', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <div className="checkbox-container">
                        <input
                          id={`same-appearance-${index}`}
                          type="checkbox"
                          checked={reference.sameAppearanceForEachInstance}
                          onChange={(e) => handleReferenceChange(index, 'sameAppearanceForEachInstance', e.target.checked)}
                        />
                        <label htmlFor={`same-appearance-${index}`}>Same appearance for each instance</label>
                      </div>
                    </div>
                  </div>

                  {/* Instance appearances when not using same appearance for all */}
                  {!reference.sameAppearanceForEachInstance && reference.instanceAppearances && reference.instanceAppearances.length > 0 && (
                    <div className="instance-appearances">
                      <h5>Instance Appearances</h5>
                      {reference.instanceAppearances.map((appearance, i) => (
                        <div key={i} className="option-row">
                          <label>Instance #{appearance.instanceNumber} Appearance:</label>
                          <select
                            value={appearance.type}
                            onChange={(e) => handleInstanceAppearanceChange(index, i, e.target.value)}
                          >
                            <option value="bust">Bust (+1 level)</option>
                            <option value="halfBody">Half Body (+2 levels)</option>
                            <option value="fullBody">Full Body (+3 levels)</option>
                          </select>
                        </div>
                      ))}
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
                </>
              )}

              {/* Simplified view for bulk upload - show custom levels if enabled */}
              {showBulkUpload && reference.useCustomLevels && (
                <div className="bulk-info">
                  <span>Custom Levels: {reference.customLevels}</span>
                </div>
              )}
            </div>
          ))}

          {!showBulkUpload && (
            <button
              type="button"
              className="button primary"
              onClick={addReference}
            >
              Add Another Reference
            </button>
          )}
        </div>

        {/* Reward Estimate */}
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

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="button success"
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

export default MonsterReferenceSubmissionForm;
