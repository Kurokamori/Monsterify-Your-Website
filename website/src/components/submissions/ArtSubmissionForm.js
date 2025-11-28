import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ArtSubmissionCalculator from './ArtSubmissionCalculator';
import RewardDisplay from './RewardDisplay';
import GiftRewards from './GiftRewards';
import LevelCapReallocation from './LevelCapReallocation';


const ArtSubmissionForm = ({ onSubmissionComplete }) => {
  const { currentUser } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('general');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);

  // Reward calculation state
  const [calculatorValues, setCalculatorValues] = useState({
    quality: 'rendered',
    backgrounds: [{ type: 'none' }],
    uniquelyDifficult: false,
    trainers: [],
    monsters: [],
    giftParticipants: []
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [rewardEstimate, setRewardEstimate] = useState(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // State for gift rewards
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);

  // State for level cap reallocation
  const [showLevelCapReallocation, setShowLevelCapReallocation] = useState(false);
  const [cappedMonsters, setCappedMonsters] = useState([]);
  const [availableTargets, setAvailableTargets] = useState([]);

  // Fetch user's trainers and monsters
  useEffect(() => {
    const fetchTrainersAndMonsters = async () => {
      try {
        const userId = currentUser?.discord_id;

        // Fetch trainers
        const trainersResponse = await trainerService.getUserTrainers(userId);
        setUserTrainers(trainersResponse.trainers || []);

        // Fetch ALL monsters for ALL user trainers (for gift rewards)
        if (trainersResponse.trainers && trainersResponse.trainers.length > 0) {
          const allMonsters = [];

          for (const trainer of trainersResponse.trainers) {
            try {
              // Use monsterService to get ALL monsters for each trainer (non-paginated)
              const { default: monsterService } = await import('../../services/monsterService');
              const monstersResponse = await monsterService.getTrainerMonsters(trainer.id);
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
  }, []);

  // Fetch all trainers for monster selection
  useEffect(() => {
    const fetchAllTrainers = async () => {
      try {
        const response = await trainerService.getAllTrainers();
        // Mark user's trainers as owned
        if (response.trainers && userTrainers.length > 0) {
          const updatedTrainers = response.trainers.map(trainer => ({
            ...trainer,
            is_owned: userTrainers.some(ut => ut.id === trainer.id)
          }));
          setAllTrainers(updatedTrainers);
        }
      } catch (err) {
        console.error('Error fetching all trainers:', err);
      }
    };

    if (userTrainers.length > 0) {
      fetchAllTrainers();
    }
  }, [userTrainers]);

  // Handle main image change
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle additional images change
  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAdditionalImages(prev => [...prev, ...files]);

      const newPreviews = files.map(file => URL.createObjectURL(file));
      setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove additional image
  const removeAdditionalImage = (index) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove tag
  const removeTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  // These functions are no longer needed as we're using the ArtSubmissionCalculator component
  // They are kept as empty functions to avoid errors in the existing JSX
  const handleTrainerAppearanceChange = () => {};
  const handleMonsterSelection = () => {};
  const handleMonsterAppearanceChange = () => {};
  const handleComplexityBonusChange = () => {};

  // Handle calculator values change
  const handleCalculatorValuesChange = (values) => {
    setCalculatorValues(values);
  };

  // Calculate reward estimate
  const calculateRewardEstimate = async () => {
    if (!title || (!mainImage && !mainImageUrl)) {
      setError('Please provide a title and image to calculate rewards.');
      return;
    }

    try {
      setLoading(true);

      // Debug log the calculator values
      console.log('Sending calculator values to backend:', calculatorValues);

      // Create a deep copy to avoid reference issues
      const dataToSend = JSON.parse(JSON.stringify({
        ...calculatorValues,
        // Ensure we're sending arrays, not undefined or null values
        trainers: Array.isArray(calculatorValues.trainers) ? calculatorValues.trainers : [],
        monsters: Array.isArray(calculatorValues.monsters) ? calculatorValues.monsters : [],
        backgrounds: Array.isArray(calculatorValues.backgrounds) ? calculatorValues.backgrounds : [{type: 'none'}]
      }));

      // Log the data being sent to the backend for debugging
      console.log('Art submission form - Data being sent to backend:', JSON.stringify({
        quality: dataToSend.quality,
        backgroundType: dataToSend.backgroundType,
        backgrounds: dataToSend.backgrounds,
        uniquelyDifficult: dataToSend.uniquelyDifficult,
        trainers: dataToSend.trainers,
        monsters: dataToSend.monsters
      }, null, 2));

      // Verify trainers and monsters arrays
      console.log('Art submission form - Trainers array check:', {
        isArray: Array.isArray(dataToSend.trainers),
        length: dataToSend.trainers.length,
        sample: dataToSend.trainers.length > 0 ? JSON.stringify(dataToSend.trainers[0]) : null
      });

      console.log('Art submission form - Monsters array check:', {
        isArray: Array.isArray(dataToSend.monsters),
        length: dataToSend.monsters.length,
        sample: dataToSend.monsters.length > 0 ? JSON.stringify(dataToSend.monsters[0]) : null
      });

      const response = await submissionService.calculateArtRewards(dataToSend);
      setRewardEstimate(response);
      setShowRewardEstimate(true);

      // Store level cap information for later use during submission, but don't show popup during calculation
      if (response.hasLevelCaps && response.cappedMonsters && response.cappedMonsters.length > 0) {
        setCappedMonsters(response.cappedMonsters);

        // Get available targets (all user monsters and trainers) for later use
        const targets = [];

        // Add all user monsters as targets
        userMonsters.forEach(monster => {
          targets.push({
            monsterId: monster.id,
            name: monster.name,
            level: monster.level,
            trainerId: monster.trainer_id
          });
        });

        setAvailableTargets(targets);
        // Don't show level cap reallocation popup during calculation - only during submission
      }
      // Note: Don't automatically show gift rewards during calculation
      // Gift rewards should only be shown after actual submission

    } catch (err) {
      console.error('Error calculating rewards:', err);
      setError('Failed to calculate rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reward allocation
  const handleRewardAllocation = async (allocation) => {
    try {
      setLoading(true);

      // Call the appropriate API based on allocation type
      if (allocation.type === 'giftLevels') {
        await submissionService.allocateGiftLevels(
          rewardEstimate.submissionId,
          allocation.recipientType,
          allocation.recipientId,
          allocation.amount
        );
      } else if (allocation.type === 'giftCoins') {
        await submissionService.allocateGiftCoins(
          rewardEstimate.submissionId,
          allocation.recipientId,
          allocation.amount
        );
      } else if (allocation.type === 'cappedLevels') {
        await submissionService.allocateCappedLevels(
          rewardEstimate.submissionId,
          allocation.recipientType,
          allocation.recipientId,
          allocation.amount
        );
      } else if (allocation.type === 'giftItem') {
        await submissionService.allocateGiftItem(
          allocation.itemId,
          allocation.recipientId
        );
      }

      // Refresh reward estimate
      const response = await submissionService.getSubmissionRewards(rewardEstimate.submissionId);
      setRewardEstimate({
        ...rewardEstimate,
        ...response
      });

    } catch (err) {
      console.error('Error allocating rewards:', err);
      setError('Failed to allocate rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!title) {
      setError('Please provide a title for your submission.');
      return;
    }

    if (!mainImage && !mainImageUrl) {
      setError('Please provide an image for your submission.');
      return;
    }

    try {
      setLoading(true);

      // Make sure trainers and monsters arrays are properly initialized
      const dataToSend = {
        ...calculatorValues,
        trainers: calculatorValues.trainers || [],
        monsters: calculatorValues.monsters || []
      };

      console.log('Submission data being sent to backend:', dataToSend);

      const artData = {
        title,
        description,
        contentType,
        ...dataToSend,
        tags
      };

      if (useImageUrl) {
        artData.imageUrl = mainImageUrl;
      } else {
        artData.imageFile = mainImage;
      }

      if (additionalImages.length > 0) {
        artData.additionalImages = additionalImages;
      }

      const result = await submissionService.submitArt(artData);

      // Check for level caps first
      if (result.hasLevelCaps && result.cappedMonsters && result.cappedMonsters.length > 0) {
        setCappedMonsters(result.cappedMonsters);

        // Get available targets (only user-owned monsters and trainers)
        const targets = [];

        // Add all user trainers as targets
        userTrainers.forEach(trainer => {
          targets.push({
            trainerId: trainer.id,
            name: trainer.name,
            level: trainer.level
          });
        });

        // Add all user monsters as targets
        userMonsters.forEach(monster => {
          targets.push({
            monsterId: monster.id,
            name: monster.name,
            level: monster.level,
            trainerId: monster.trainer_id
          });
        });

        console.log('Available targets for level cap reallocation:', targets);
        console.log('User trainers:', userTrainers);
        console.log('User monsters:', userMonsters);

        setAvailableTargets(targets);
        setRewardEstimate(result.rewards);
        setShowLevelCapReallocation(true);
        return;
      }

      // Check if there are gift levels to distribute
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;

      if (totalGiftLevels > 0) {
        // Show gift rewards interface
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
      } else {
        // No gift levels, proceed with normal completion
        handleSubmissionComplete(result);
      }

    } catch (err) {
      console.error('Error submitting art:', err);
      setError('Failed to submit art. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle submission completion
  const handleSubmissionComplete = (result) => {
    // Reset form
    setTitle('');
    setDescription('');
    setContentType('general');
    setTags([]);
    setTagInput('');
    setMainImage(null);
    setMainImagePreview('');
    setMainImageUrl('');
    setUseImageUrl(false);
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setCalculatorValues({
      quality: 'rendered',
      backgrounds: [{ type: 'none' }],
      uniquelyDifficult: false,
      trainers: [],
      monsters: [],
      giftParticipants: []
    });
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

    // Combine the original submission result with gift rewards result
    const combinedResult = {
      ...submissionResult,
      giftRewards: giftRewardsResult
    };

    handleSubmissionComplete(combinedResult);
  };

  // Handle gift rewards cancellation
  const handleGiftRewardsCancel = () => {
    setShowGiftRewards(false);
    handleSubmissionComplete(submissionResult);
  };

  // Handle level cap reallocation completion
  const handleLevelCapComplete = async (allocations) => {
    console.log('Level cap allocations:', allocations);
    setShowLevelCapReallocation(false);
    setLoading(true);

    try {
      // Apply the level allocations (reallocated excess levels)
      await applyLevelAllocations(allocations);

      // IMPORTANT: Now continue with the normal reward application flow
      // This is the missing step that causes the bug - after reallocation, we need to
      // let the normal submission flow continue to apply all rewards properly
      await continueNormalRewardFlow();

    } catch (error) {
      console.error('Error applying level allocations:', error);
      setError('Failed to apply level allocations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply level allocations to monsters and trainers
  const applyLevelAllocations = async (allocations) => {
    const promises = [];

    console.log('Applying level allocations:', allocations);

    for (const [monsterId, targets] of Object.entries(allocations)) {
      console.log(`Processing allocations for capped monster ${monsterId}:`, targets);

      for (const [targetKey, levels] of Object.entries(targets)) {
        if (levels > 0) {
          const [targetType, targetId] = targetKey.split('_');

          console.log(`Allocating ${levels} levels to ${targetType} ${targetId}`);

          if (targetType === 'monster') {
            // Apply levels to monster
            promises.push(
              api.post('/monsters/add-levels', {
                monsterId: parseInt(targetId),
                levels: levels
              }).catch(error => {
                console.error(`Failed to add levels to monster ${targetId}:`, error.response?.data || error.message);
                throw error;
              })
            );
          } else if (targetType === 'trainer') {
            // Apply levels to trainer
            promises.push(
              api.post('/trainers/add-levels', {
                trainerId: parseInt(targetId),
                levels: levels
              }).catch(error => {
                console.error(`Failed to add levels to trainer ${targetId}:`, error.response?.data || error.message);
                throw error;
              })
            );
          }
        }
      }
    }

    // Execute all level applications
    await Promise.all(promises);
    console.log('Successfully applied all level allocations');
  };

  // Continue with the normal reward application flow after level cap reallocation
  const continueNormalRewardFlow = async () => {
    console.log('Continuing with normal reward application flow after level cap reallocation');

    // Now that level cap reallocation is complete, continue with the normal submission flow
    // The backend has already applied all the normal rewards (trainers get levels/coins, 
    // non-capped monsters get levels, etc.) when the submission was first created.
    // We just need to check if there are gift levels to distribute.
    
    // Get the reward data from the submission result
    const rewards = submissionResult?.rewards || rewardEstimate;
    
    if (!rewards) {
      console.error('No rewards found to continue normal flow');
      // Fallback: just complete the submission
      handleSubmissionComplete(submissionResult);
      return;
    }

    console.log('Continuing normal flow after level cap reallocation. Checking for gift levels...');

    // Check if there are gift levels to distribute
    const totalGiftLevels = rewards.totalGiftLevels || 0;

    console.log('After level cap reallocation - checking gift levels:', {
      totalGiftLevels,
      hasSubmissionResult: !!submissionResult
    });

    if (totalGiftLevels > 0) {
      // Show gift rewards interface
      setGiftLevels(totalGiftLevels);
      setShowGiftRewards(true);
    } else {
      // No gift levels, submission is complete
      handleSubmissionComplete(submissionResult);
    }
  };

  // Handle level cap reallocation cancellation
  const handleLevelCapCancel = () => {
    setShowLevelCapReallocation(false);
  };

  // Show level cap reallocation interface if needed
  if (showLevelCapReallocation) {
    return (
      <LevelCapReallocation
        cappedMonsters={cappedMonsters}
        availableTargets={availableTargets}
        onComplete={handleLevelCapComplete}
        onCancel={handleLevelCapCancel}
      />
    );
  }

  // Show gift rewards interface if needed
  if (showGiftRewards) {
    return (
      <GiftRewards
        giftLevels={giftLevels}
        userTrainers={userTrainers}
        userMonsters={userMonsters}
        onComplete={handleGiftRewardsComplete}
        onCancel={handleGiftRewardsCancel}
        submissionType="art"
      />
    );
  }

  return (
    <div className="submission-form-container">
      <h2>Submit Artwork</h2>

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
            <label htmlFor="art-title">Title *</label>
            <input
              id="art-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your artwork"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="art-description">Description</label>
            <textarea
              id="art-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your artwork (optional)"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="art-content-type">Content Type</label>
            <select
              id="art-content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="general">General Art</option>
              <option value="monster">Monster Art</option>
              <option value="trainer">Trainer Art</option>
              <option value="location">Location Art</option>
              <option value="event">Event Art</option>
              <option value="prompt">Prompt-based Art</option>
            </select>
          </div>

          {/* Trainer selection and gift checkbox removed as they are now handled by participants */}
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>

          <div className="form-group">
            <label htmlFor="art-tags">Add Tags</label>
            <div className="tag-input-container">
              <input
                id="art-tags"
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter tags and press Enter"
              />
              <button
                type="button"
                className="tag-add-button"
                onClick={addTag}
              >
                Add
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="tags-container">
              {tags.map(tag => (
                <div key={tag} className="tag">
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="tag-remove-button"
                    onClick={() => removeTag(tag)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="form-section">
          <h3>Artwork</h3>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                id="use-image-url"
                type="checkbox"
                checked={useImageUrl}
                onChange={() => setUseImageUrl(!useImageUrl)}
              />
              <label htmlFor="use-image-url">Use Image URL</label>
            </div>
          </div>

          {useImageUrl ? (
            <div className="form-group">
              <label htmlFor="art-image-url">Image URL *</label>
              <input
                id="art-image-url"
                type="url"
                value={mainImageUrl}
                onChange={(e) => setMainImageUrl(e.target.value)}
                placeholder="Enter the URL of your artwork"
                required={useImageUrl}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="art-image">Main Image *</label>
              <div className="file-upload-container">
                <input
                  id="art-image"
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  required={!useImageUrl}
                />
                <label htmlFor="art-image" className="file-upload-label">
                  Choose File
                </label>
                <span className="file-name">
                  {mainImage ? mainImage.name : 'No file chosen'}
                </span>
              </div>
            </div>
          )}

          {mainImagePreview && (
            <div className="image-preview-container">
              <img
                src={mainImagePreview}
                alt="Preview"
                className="image-preview"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="additional-images">Additional Images (Optional)</label>
            <div className="file-upload-container">
              <input
                id="additional-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
              />
              <label htmlFor="additional-images" className="file-upload-label">
                Choose Files
              </label>
              <span className="file-name">
                {additionalImages.length > 0 ? `${additionalImages.length} files selected` : 'No files chosen'}
              </span>
            </div>
          </div>

          {additionalImagePreviews.length > 0 && (
            <div className="additional-images-preview">
              {additionalImagePreviews.map((preview, index) => (
                <div key={index} className="additional-image-item">
                  <img
                    src={preview}
                    alt={`Additional ${index + 1}`}
                    className="additional-image-preview"
                  />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => removeAdditionalImage(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reward Calculator */}
        <div className="form-section">
          <h3>Reward Calculator</h3>

          <ArtSubmissionCalculator
            onCalculate={(values) => {
              console.log('ArtSubmissionCalculator values received:', values);

              // Ensure trainers and monsters are valid arrays
              const updatedValues = {
                ...values,
                trainers: Array.isArray(values.trainers) ? values.trainers : [],
                monsters: Array.isArray(values.monsters) ? values.monsters : []
              };

              // Log the updated values for debugging
              console.log('ArtSubmissionForm - Updated calculator values:', {
                trainers: updatedValues.trainers,
                trainersLength: updatedValues.trainers.length,
                monsters: updatedValues.monsters,
                monstersLength: updatedValues.monsters.length
              });

              // Update state with the validated values
              setCalculatorValues(updatedValues);

              // Calculate rewards with the updated values
              calculateRewardEstimate();
            }}
            trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
            monsters={userMonsters}
          />

          {showRewardEstimate && rewardEstimate && (
            <RewardDisplay
              rewards={rewardEstimate}
              submissionType="art"
              trainers={userTrainers}
              monsters={userMonsters}
              onAllocate={handleRewardAllocation}
            />
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
              'Submit Artwork'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArtSubmissionForm;
