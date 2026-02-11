import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import WritingSubmissionCalculator from './WritingSubmissionCalculator';
import MatureContentCheckbox from './MatureContentCheckbox';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

/**
 * PromptWritingSubmissionPage - Page 2b of the Prompt Submission Wizard
 *
 * Full writing submission form with:
 * - Title, description, tags
 * - Content input (direct, file, URL)
 * - WritingSubmissionCalculator for participants
 * - Real-time reward preview
 * - Content rating
 */
const PromptWritingSubmissionPage = ({
  trainerId,
  trainer,
  promptId,
  prompt,
  userTrainers = [],
  userMonsters = [],
  onSubmit,
  onBack
}) => {
  // Form state
  const [title, setTitle] = useState(prompt?.title ? `${prompt.title} - Writing` : '');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('prompt');
  const [tags, setTags] = useState(prompt?.title ? [prompt.title, 'prompt'] : ['prompt']);
  const [tagInput, setTagInput] = useState('');
  const [isMature, setIsMature] = useState(false);
  const [contentRating, setContentRating] = useState({
    gore: false,
    nsfw_light: false,
    nsfw_heavy: false,
    triggering: false,
    intense_violence: false
  });

  // Content state
  const [content, setContent] = useState('');
  const [contentFile, setContentFile] = useState(null);
  const [contentUrl, setContentUrl] = useState('');
  const [inputMethod, setInputMethod] = useState('direct'); // 'direct', 'file', 'url'
  const [wordCount, setWordCount] = useState(0);

  // Cover image state
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [useCoverImageUrl, setUseCoverImageUrl] = useState(false);

  // Calculator values state
  const [calculatorValues, setCalculatorValues] = useState({
    wordCount: 0,
    trainers: [],
    monsters: [],
    npcs: []
  });

  // Reward calculation state
  const [rewardEstimate, setRewardEstimate] = useState(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // All trainers for calculator
  const [allTrainers, setAllTrainers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all trainers for calculator (for selecting non-owned trainers)
  useEffect(() => {
    const fetchAllTrainers = async () => {
      try {
        const response = await trainerService.getAllTrainers();
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
      setWordCount(words.filter(w => w.length > 0).length);
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
        setWordCount(words.filter(w => w.length > 0).length);
      } else {
        // For other file types, rely on user input through calculator
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

  // Handle calculator values change
  const handleCalculatorValuesChange = (values) => {
    const updatedValues = {
      ...values,
      trainers: Array.isArray(values.trainers) ? values.trainers : [],
      monsters: Array.isArray(values.monsters) ? values.monsters : []
    };
    setCalculatorValues(updatedValues);
  };

  // Calculate reward estimate
  const calculateRewardEstimate = async () => {
    if (calculatorValues.wordCount <= 0) return;
    if (calculatorValues.trainers.length === 0 && calculatorValues.monsters.length === 0) return;

    try {
      setLoading(true);

      const dataToSend = JSON.parse(JSON.stringify({
        ...calculatorValues,
        trainers: Array.isArray(calculatorValues.trainers) ? calculatorValues.trainers : [],
        monsters: Array.isArray(calculatorValues.monsters) ? calculatorValues.monsters : []
      }));

      const response = await submissionService.calculateWritingRewards(dataToSend);
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

    // Validate form
    if (!title) {
      setError('Please provide a title for your submission.');
      return;
    }

    const hasContent =
      (inputMethod === 'direct' && content.trim()) ||
      (inputMethod === 'file' && contentFile) ||
      (inputMethod === 'url' && contentUrl.trim());

    if (!hasContent) {
      setError('Please provide content for your submission.');
      return;
    }

    if (calculatorValues.wordCount <= 0) {
      setError('Please enter a valid word count in the calculator.');
      return;
    }

    if (calculatorValues.trainers.length === 0 && calculatorValues.monsters.length === 0) {
      setError('Please add at least one trainer or monster in the calculator.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare writing data
      const writingData = {
        title,
        description,
        contentType,
        tags,
        isMature,
        contentRating,
        promptId, // Link to prompt
        ...calculatorValues,
        trainers: calculatorValues.trainers || [],
        monsters: calculatorValues.monsters || []
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

      // Submit combined writing + prompt submission
      const result = await submissionService.submitPromptCombined({
        submissionType: 'writing',
        promptId,
        trainerId,
        writingData
      });

      // Pass result to parent for rewards claiming page
      onSubmit(result);

    } catch (err) {
      console.error('Error submitting writing:', err);
      setError(err.response?.data?.message || 'Failed to submit writing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prompt-submission-page">
      {/* Prompt Info Header */}
      <div className="prompt-info-header">
        <h2>Writing Submission for: {prompt?.title}</h2>
        <p className="prompt-description">{prompt?.description}</p>
      </div>

      {error && (
        <ErrorMessage message={error} onClose={() => setError('')} />
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
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>

          <div className="form-group">
            <label htmlFor="writing-tags">Add Tags</label>
            <div className="type-row">
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
                className="button primary lg no-flex"
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
                    className="button icon danger"
                    onClick={() => removeTag(tag)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Rating */}
        <div className="form-section">
          <h3>Content Rating</h3>
          <MatureContentCheckbox
            isMature={isMature}
            contentRating={contentRating}
            onMatureChange={setIsMature}
            onRatingChange={setContentRating}
          />
        </div>

        {/* Content Input */}
        <div className="form-section">
          <h3>Content</h3>

          <div className="form-group">
            <label>Input Method</label>
            <div className="type-tags fw">
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
              {wordCount > 0 && (
                <div className="word-count">
                  Estimated Word Count: {wordCount}
                </div>
              )}
            </div>
          )}

          {inputMethod === 'url' && (
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
          )}
        </div>

        {/* Cover Image (Optional) */}
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
            <div className="image-container medium">
              <img src={coverImagePreview} alt="Cover Preview" />
            </div>
          )}
        </div>

        {/* Reward Calculator */}
        <div className="form-section">
          <h3>Reward Calculator</h3>

          <WritingSubmissionCalculator
            onCalculate={(values) => {
              handleCalculatorValuesChange(values);
              calculateRewardEstimate();
            }}
            trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
            monsters={userMonsters}
            content={content}
            inputMethod={inputMethod}
          />

          {showRewardEstimate && rewardEstimate && (
            <div className="reward-estimate">
              <h4>Estimated Rewards:</h4>

              <div className="reward-section">
                <h5>Participant Rewards</h5>
                <div className="container cols-2 gap-md">
                  <div className="reward-item">
                    <span className="reward-label">Levels:</span>
                    <span className="reward-value">{rewardEstimate.levels || 0}</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Coins:</span>
                    <span className="reward-value">{rewardEstimate.coins || 0} <i className="fas fa-coins"></i></span>
                  </div>
                </div>
              </div>

              {(rewardEstimate.gardenPoints > 0 || rewardEstimate.missionProgress > 0 || rewardEstimate.bossDamage > 0) && (
                <div className="reward-section">
                  <h5>Additional Rewards</h5>
                  <div className="container cols-2 gap-md">
                    {rewardEstimate.gardenPoints > 0 && (
                      <div className="reward-item">
                        <span className="reward-label">Garden Points:</span>
                        <span className="reward-value">{rewardEstimate.gardenPoints}</span>
                      </div>
                    )}
                    {rewardEstimate.missionProgress > 0 && (
                      <div className="reward-item">
                        <span className="reward-label">Mission Progress:</span>
                        <span className="reward-value">{rewardEstimate.missionProgress}</span>
                      </div>
                    )}
                    {rewardEstimate.bossDamage > 0 && (
                      <div className="reward-item">
                        <span className="reward-label">Boss Damage:</span>
                        <span className="reward-value">{rewardEstimate.bossDamage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Rewards Preview */}
        <div className="form-section prompt-rewards-section">
          <h3>Prompt Rewards (on completion)</h3>
          <p className="section-description">
            These rewards will be added after your submission is processed:
          </p>
          <div className="prompt-rewards-preview-detailed">
            {prompt?.rewards && (
              <>
                {(() => {
                  const rewards = typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;
                  return (
                    <div className="prompt-reward-items">
                      {rewards.levels > 0 && (
                        <div className="prompt-reward-item">
                          <i className="fas fa-arrow-up"></i>
                          <span>{rewards.levels} levels</span>
                        </div>
                      )}
                      {rewards.coins > 0 && (
                        <div className="prompt-reward-item">
                          <i className="fas fa-coins"></i>
                          <span>{rewards.coins} coins</span>
                        </div>
                      )}
                      {rewards.items && rewards.items.length > 0 && (
                        <div className="prompt-reward-item">
                          <i className="fas fa-gift"></i>
                          <span>{rewards.items.length} item{rewards.items.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {rewards.monsters && rewards.monsters.length > 0 && (
                        <div className="prompt-reward-item">
                          <i className="fas fa-dragon"></i>
                          <span>{rewards.monsters.length} monster roll{rewards.monsters.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {rewards.monster_roll && rewards.monster_roll.enabled && (
                        <div className="prompt-reward-item">
                          <i className="fas fa-dragon"></i>
                          <span>Monster roll</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="wizard-navigation">
          <button
            type="button"
            className="button secondary lg"
            onClick={onBack}
            disabled={loading}
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </button>

          <button
            type="submit"
            className="button success lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Submitting...
              </>
            ) : (
              <>
                Submit Writing
                <i className="fas fa-check"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromptWritingSubmissionPage;
