import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import GiftRewards from './GiftRewards';
import WritingSubmissionCalculator from './WritingSubmissionCalculator';
import LevelCapReallocation from './LevelCapReallocation';


const WritingSubmissionForm = ({ onSubmissionComplete }) => {
  const { currentUser } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('story');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [contentFile, setContentFile] = useState(null);
  const [contentUrl, setContentUrl] = useState('');
  const [inputMethod, setInputMethod] = useState('direct'); // 'direct', 'file', or 'url'
  const [wordCount, setWordCount] = useState(0);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [useCoverImageUrl, setUseCoverImageUrl] = useState(false);
  // Reward calculation state
  const [calculatorValues, setCalculatorValues] = useState({
    wordCount: 0,
    trainers: [],
    monsters: [],
    giftParticipants: []
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [rewardEstimate, setRewardEstimate] = useState(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // State for gift rewards
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [userMonsters, setUserMonsters] = useState([]);

  // State for level cap reallocation
  const [showLevelCapReallocation, setShowLevelCapReallocation] = useState(false);
  const [cappedMonsters, setCappedMonsters] = useState([]);
  const [availableTargets, setAvailableTargets] = useState([]);

  // Fetch user's trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        setUserTrainers(response.trainers || []);

        // Fetch ALL monsters for ALL user trainers (for gift rewards)
        if (response.trainers && response.trainers.length > 0) {
          const allMonsters = [];

          for (const trainer of response.trainers) {
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

    fetchTrainers();
  }, [currentUser]);

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

  // Calculate word count for direct input
  useEffect(() => {
    if (inputMethod === 'direct' && content) {
      const words = content.trim().split(/\s+/);
      setWordCount(words.length);
    }
  }, [content, inputMethod]);

  // Handle content file change
  const handleContentFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setContentFile(file);

      // Try to read the file to estimate word count
      if (file.type === 'text/plain') {
        const text = await file.text();
        const words = text.trim().split(/\s+/);
        setWordCount(words.length);
      } else {
        // For other file types, rely on user input
        setWordCount(0);
      }
    }
  };

  // Handle cover image change
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
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

  // Calculate reward estimate
  const calculateRewardEstimate = async () => {
    if (!title || (inputMethod === 'direct' && !content) || (inputMethod === 'file' && !contentFile) || (inputMethod === 'url' && !contentUrl)) {
      setError('Please provide a title and content to calculate rewards.');
      return;
    }

    if (calculatorValues.wordCount <= 0) {
      setError('Please provide a valid word count to calculate rewards.');
      return;
    }

    if (calculatorValues.trainers.length === 0 && calculatorValues.monsters.length === 0) {
      setError('Please add at least one trainer or monster to this submission.');
      return;
    }

    try {
      setLoading(true);

      console.log('Sending calculator values to backend:', calculatorValues);

      // Create a deep copy to avoid reference issues
      const dataToSend = JSON.parse(JSON.stringify({
        ...calculatorValues,
        // Ensure we're sending arrays, not undefined or null values
        trainers: Array.isArray(calculatorValues.trainers) ? calculatorValues.trainers : [],
        monsters: Array.isArray(calculatorValues.monsters) ? calculatorValues.monsters : []
      }));

      const response = await submissionService.calculateWritingRewards(dataToSend);
      setRewardEstimate(response);
      setShowRewardEstimate(true);

      // Store level cap information for later use during submission, but don't show popup during calculation
      if (response.hasLevelCaps && response.cappedMonsters && response.cappedMonsters.length > 0) {
        setCappedMonsters(response.cappedMonsters);

        // Get available targets (only user-owned monsters and trainers) for later use
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!title) {
      setError('Please provide a title for your submission.');
      return;
    }

    if ((inputMethod === 'direct' && !content) || (inputMethod === 'file' && !contentFile) || (inputMethod === 'url' && !contentUrl)) {
      setError('Please provide content for your submission.');
      return;
    }

    if (calculatorValues.wordCount <= 0) {
      setError('Please provide a valid word count for your submission.');
      return;
    }

    if (calculatorValues.trainers.length === 0 && calculatorValues.monsters.length === 0) {
      setError('Please add at least one trainer or monster to this submission.');
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

      const writingData = {
        title,
        description,
        contentType,
        tags,
        ...dataToSend
      };

      // Add content based on input method
      if (inputMethod === 'direct') {
        writingData.content = content;
      } else if (inputMethod === 'file') {
        writingData.contentFile = contentFile;
      } else if (inputMethod === 'url') {
        writingData.contentUrl = contentUrl;
      }

      // Add cover image if provided
      if (useCoverImageUrl && coverImageUrl) {
        writingData.coverImageUrl = coverImageUrl;
      } else if (coverImage) {
        writingData.coverImage = coverImage;
      }

      const result = await submissionService.submitWriting(writingData);

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
      console.error('Error submitting writing:', err);
      setError('Failed to submit writing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle submission completion
  const handleSubmissionComplete = (result) => {
    // Reset form
    setTitle('');
    setDescription('');
    setContentType('story');
    setTags([]);
    setTagInput('');
    setContent('');
    setContentFile(null);
    setContentUrl('');
    setInputMethod('direct');
    setCalculatorValues({
      wordCount: 0,
      trainers: [],
      monsters: [],
      giftParticipants: []
    });
    setCoverImage(null);
    setCoverImagePreview('');
    setCoverImageUrl('');
    setUseCoverImageUrl(false);
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
      // Apply the level allocations
      await applyLevelAllocations(allocations);

      // Check for gift levels from either rewardEstimate (calculate phase) or submissionResult (submit phase)
      const giftLevelsFromEstimate = rewardEstimate && rewardEstimate.totalGiftLevels;
      const giftLevelsFromResult = submissionResult && submissionResult.totalGiftLevels;
      const totalGiftLevels = giftLevelsFromResult || giftLevelsFromEstimate;

      console.log('After level cap completion - checking gift levels:', {
        giftLevelsFromEstimate,
        giftLevelsFromResult,
        totalGiftLevels,
        hasSubmissionResult: !!submissionResult
      });

      if (totalGiftLevels && totalGiftLevels > 0) {
        setGiftLevels(totalGiftLevels);
        setShowGiftRewards(true);
      } else {
        // No gift levels, submission is complete
        const finalResult = submissionResult || { success: true, message: 'Level cap reallocation completed successfully!' };
        handleSubmissionComplete(finalResult);
      }
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

    for (const [monsterId, targets] of Object.entries(allocations)) {
      for (const [targetKey, levels] of Object.entries(targets)) {
        if (levels > 0) {
          const [targetType, targetId] = targetKey.split('_');

          if (targetType === 'monster') {
            // Apply levels to monster
            promises.push(
              api.post('/monsters/add-levels', {
                monsterId: parseInt(targetId),
                levels: levels
              })
            );
          } else if (targetType === 'trainer') {
            // Apply levels to trainer
            promises.push(
              api.post('/trainers/add-levels', {
                trainerId: parseInt(targetId),
                levels: levels
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
        submissionType="writing"
      />
    );
  }

  return (
    <div className="submission-form-container">
      <h2>Submit Writing</h2>

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
            <label htmlFor="writing-title">Title *</label>
            <input
              id="writing-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your writing"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="writing-description">Description</label>
            <textarea
              id="writing-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your writing (optional)"
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="writing-content-type">Content Type</label>
              <select
                id="writing-content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="story">Story</option>
                <option value="chapter">Chapter</option>
                <option value="profile">Character Profile</option>
                <option value="prompt">Prompt-based</option>
                <option value="poem">Poem</option>
                <option value="other">Other</option>
              </select>
            </div>


          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>

          <div className="form-group">
            <label htmlFor="writing-tags">Add Tags</label>
            <div className="tag-input-container">
              <input
                id="writing-tags"
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

        {/* Content */}
        <div className="form-section">
          <h3>Content</h3>

          <div className="form-group">
            <label>Input Method</label>
            <div className="input-method-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="input-method"
                  value="direct"
                  checked={inputMethod === 'direct'}
                  onChange={() => setInputMethod('direct')}
                />
                Direct Input
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="input-method"
                  value="file"
                  checked={inputMethod === 'file'}
                  onChange={() => setInputMethod('file')}
                />
                Upload File
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="input-method"
                  value="url"
                  checked={inputMethod === 'url'}
                  onChange={() => setInputMethod('url')}
                />
                External URL
              </label>
            </div>
          </div>

          {inputMethod === 'direct' && (
            <div className="form-group">
              <label htmlFor="writing-content">Content *</label>
              <textarea
                id="writing-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your writing content here"
                rows={10}
                required={inputMethod === 'direct'}
              />
              <div className="word-count">
                Word Count: {wordCount}
              </div>
            </div>
          )}

          {inputMethod === 'file' && (
            <div className="form-group">
              <label htmlFor="writing-file">Content File *</label>
              <div className="file-upload-container">
                <input
                  id="writing-file"
                  type="file"
                  accept=".txt,.doc,.docx,.pdf,.rtf,.md"
                  onChange={handleContentFileChange}
                  required={inputMethod === 'file'}
                />
                <label htmlFor="writing-file" className="file-upload-label">
                  Choose File
                </label>
                <span className="file-name">
                  {contentFile ? contentFile.name : 'No file chosen'}
                </span>
              </div>

            </div>
          )}

          {inputMethod === 'url' && (
            <>
              <div className="form-group">
                <label htmlFor="writing-url">Content URL *</label>
                <input
                  id="writing-url"
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="Enter the URL where your writing is hosted"
                  required={inputMethod === 'url'}
                />
              </div>

            </>
          )}
        </div>

        {/* Cover Image */}
        <div className="form-section">
          <h3>Cover Image (Optional)</h3>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                id="use-cover-image-url"
                type="checkbox"
                checked={useCoverImageUrl}
                onChange={() => setUseCoverImageUrl(!useCoverImageUrl)}
              />
              <label htmlFor="use-cover-image-url">Use Image URL</label>
            </div>
          </div>

          {useCoverImageUrl ? (
            <div className="form-group">
              <label htmlFor="cover-image-url">Cover Image URL</label>
              <input
                id="cover-image-url"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="Enter the URL of your cover image"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="cover-image">Cover Image</label>
              <div className="file-upload-container">
                <input
                  id="cover-image"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                />
                <label htmlFor="cover-image" className="file-upload-label">
                  Choose File
                </label>
                <span className="file-name">
                  {coverImage ? coverImage.name : 'No file chosen'}
                </span>
              </div>
            </div>
          )}

          {coverImagePreview && (
            <div className="image-preview-container">
              <img
                src={coverImagePreview}
                alt="Cover Preview"
                className="image-preview"
              />
            </div>
          )}
        </div>

        {/* Reward Calculator */}
        <div className="form-section">
          <h3>Reward Calculator</h3>

          <WritingSubmissionCalculator
            onCalculate={(values) => {
              console.log('WritingSubmissionCalculator values received:', values);

              // Ensure trainers and monsters are valid arrays
              const updatedValues = {
                ...values,
                trainers: Array.isArray(values.trainers) ? values.trainers : [],
                monsters: Array.isArray(values.monsters) ? values.monsters : []
              };

              // Update state with the validated values
              setCalculatorValues(updatedValues);

              // Calculate rewards with the updated values
              calculateRewardEstimate();
            }}
            trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
            monsters={userMonsters}
            content={content}
            inputMethod={inputMethod}
          />
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

              <div className="reward-section">
                <h5>Additional Rewards</h5>
                <div className="reward-items">
                  <div className="reward-item">
                    <span className="reward-label">Garden Points:</span>
                    <span className="reward-value">{rewardEstimate.gardenPoints}</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Mission Progress:</span>
                    <span className="reward-value">{rewardEstimate.missionProgress}</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Boss Damage:</span>
                    <span className="reward-value">{rewardEstimate.bossDamage}</span>
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
              'Submit Writing'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WritingSubmissionForm;
