import React, { useState, useEffect } from 'react';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import ArtSubmissionCalculator from './ArtSubmissionCalculator';
import RewardDisplay from './RewardDisplay';
import MatureContentCheckbox from './MatureContentCheckbox';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

/**
 * PromptArtSubmissionPage - Page 2a of the Prompt Submission Wizard
 *
 * Full art submission form with:
 * - Title, description, tags
 * - Image upload (file or URL)
 * - ArtSubmissionCalculator for quality, backgrounds, participants
 * - Real-time reward preview
 * - Content rating
 */
const PromptArtSubmissionPage = ({
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
  const [title, setTitle] = useState(prompt?.title ? `${prompt.title} - Art` : '');
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

  // Image state
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);

  // Calculator values state
  const [calculatorValues, setCalculatorValues] = useState({
    quality: 'rendered',
    backgrounds: [{ type: 'none' }],
    uniquelyDifficult: false,
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
    if (!title || (!mainImage && !mainImageUrl)) {
      return;
    }

    try {
      setLoading(true);

      const dataToSend = JSON.parse(JSON.stringify({
        ...calculatorValues,
        trainers: Array.isArray(calculatorValues.trainers) ? calculatorValues.trainers : [],
        monsters: Array.isArray(calculatorValues.monsters) ? calculatorValues.monsters : [],
        backgrounds: Array.isArray(calculatorValues.backgrounds) ? calculatorValues.backgrounds : [{ type: 'none' }]
      }));

      const response = await submissionService.calculateArtRewards(dataToSend);
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

    if (!mainImage && !mainImageUrl) {
      setError('Please provide an image for your submission.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare art data
      const artData = {
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

      if (useImageUrl) {
        artData.imageUrl = mainImageUrl;
      } else {
        artData.imageFile = mainImage;
      }

      if (additionalImages.length > 0) {
        artData.additionalImages = additionalImages;
      }

      // Submit combined art + prompt submission
      const result = await submissionService.submitPromptCombined({
        submissionType: 'art',
        promptId,
        trainerId,
        artData
      });

      // Pass result to parent for rewards claiming page
      onSubmit(result);

    } catch (err) {
      console.error('Error submitting art:', err);
      setError(err.response?.data?.message || 'Failed to submit artwork. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prompt-submission-page">
      {/* Prompt Info Header */}
      <div className="prompt-info-header">
        <h2>Art Submission for: {prompt?.title}</h2>
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
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>

          <div className="form-group">
            <label htmlFor="art-tags">Add Tags</label>
            <div className="type-row">
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
            <div className="image-container medium">
              <img src={mainImagePreview} alt="Preview" />
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
            <div className="species-images-grid">
              {additionalImagePreviews.map((preview, index) => (
                <div key={index} className="additional-image-item">
                  <img
                    src={preview}
                    alt={`Additional ${index + 1}`}
                    className="additional-image-preview"
                  />
                  <button
                    type="button"
                    className="button icon danger"
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
              handleCalculatorValuesChange(values);
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
            />
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
                Submit Artwork
                <i className="fas fa-check"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromptArtSubmissionPage;
