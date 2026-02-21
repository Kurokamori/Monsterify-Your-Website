import { useState, useEffect, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import { ArtSubmissionCalculator, ArtCalculatorValues } from '../ArtSubmissionCalculator';
import { RewardDisplay } from '../RewardDisplay';
import { MatureContentCheckbox } from '../MatureContentCheckbox';
import { MatureFilters } from '../MatureContentFilter';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import type {
  Trainer,
  Monster,
  Prompt,
  PromptRewards,
  SubmissionResult,
} from './types';

interface TrainerReward {
  trainerId: string | number;
  trainerName?: string;
  levels: number;
  coins: number;
  cappedLevels?: number;
}

interface MonsterReward {
  monsterId: string | number;
  trainerName?: string;
  levels: number;
  coins: number;
  cappedLevels?: number;
}

interface Rewards {
  overallLevels: number;
  trainerRewards?: TrainerReward[];
  monsterRewards?: MonsterReward[];
  gardenPoints?: number | { amount: number };
  missionProgress?: number | { amount: number; message?: string };
  bossDamage?: number | { amount: number };
  totalGiftLevels?: number;
  giftLevels?: number;
  giftCoins?: number;
  cappedLevels?: number;
}

interface PromptArtSubmissionPageProps {
  trainerId: string | number;
  trainer: Trainer;
  promptId: string | number;
  prompt: Prompt;
  userTrainers?: Trainer[];
  userMonsters?: Monster[];
  onSubmit: (result: SubmissionResult) => void;
  onBack: () => void;
}

export function PromptArtSubmissionPage({
  trainerId,
  trainer: _trainer,
  promptId,
  prompt,
  userTrainers = [],
  userMonsters = [],
  onSubmit,
  onBack
}: PromptArtSubmissionPageProps) {
  void _trainer; // Keep for prop consistency with PromptWritingSubmissionPage
  // Form state
  const [title, setTitle] = useState(prompt?.title ? `${prompt.title} - Art` : '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(prompt?.title ? [prompt.title, 'prompt'] : ['prompt']);
  const [tagInput, setTagInput] = useState('');
  const [isMature, setIsMature] = useState(false);
  const [contentRating, setContentRating] = useState<MatureFilters>({
    gore: false,
    nsfw_light: false,
    nsfw_heavy: false,
    triggering: false,
    intense_violence: false
  });

  // Image state
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  // Calculator values state
  const [calculatorValues, setCalculatorValues] = useState<ArtCalculatorValues>({
    quality: 'rendered',
    backgroundType: 'none',
    backgrounds: [{ type: 'none' }],
    uniquelyDifficult: false,
    trainers: [],
    monsters: [],
    npcs: [],
  });

  // Reward calculation state
  const [rewardEstimate, setRewardEstimate] = useState<Rewards | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // All trainers for calculator
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all trainers for calculator (for selecting non-owned trainers)
  useEffect(() => {
    const fetchAllTrainers = async () => {
      try {
        const response = await trainerService.getAllTrainers();
        if (response.trainers && userTrainers.length > 0) {
          const updatedTrainers = response.trainers.map((t: Trainer) => ({
            ...t,
            is_owned: userTrainers.some(ut => ut.id === t.id)
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
  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle additional images change
  const handleAdditionalImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAdditionalImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  // Handle calculator values change
  const handleCalculatorValuesChange = (values: ArtCalculatorValues) => {
    const updatedValues = {
      ...values,
      trainers: Array.isArray(values.trainers) ? values.trainers : [],
      monsters: Array.isArray(values.monsters) ? values.monsters : []
    };
    setCalculatorValues(updatedValues);
  };

  // Calculate reward estimate - accepts optional fresh values to avoid stale state
  const calculateRewardEstimate = async (values?: ArtCalculatorValues) => {
    const source = values || calculatorValues;
    if (source.trainers.length === 0 && source.monsters.length === 0) return;

    try {
      setLoading(true);

      const dataToSend = JSON.parse(JSON.stringify({
        ...source,
        trainers: Array.isArray(source.trainers) ? source.trainers : [],
        monsters: Array.isArray(source.monsters) ? source.monsters : [],
        backgrounds: Array.isArray(source.backgrounds) ? source.backgrounds : [{ type: 'none' }]
      }));

      const response = await submissionService.calculateArtRewards(dataToSend);
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

      const artData: Record<string, unknown> = {
        title,
        description,
        contentType: 'prompt',
        tags,
        isMature,
        contentRating,
        promptId,
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

      const result = await submissionService.submitPromptCombined({
        submissionType: 'art',
        promptId,
        trainerId,
        artData
      });

      onSubmit(result);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit artwork. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Parse prompt rewards for display
  const getPromptRewards = (): PromptRewards | null => {
    if (!prompt?.rewards) return null;
    return typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;
  };

  const promptRewards = getPromptRewards();

  return (
    <div className="prompt-submission-page">
      {/* Prompt Info Header */}
      <div className="prompt-info-header">
        <h2>Art Submission for: {prompt?.title}</h2>
        <p className="submission__prompt-description">{prompt?.description}</p>
      </div>

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
            <label htmlFor="art-title">Title *</label>
            <input
              id="art-title"
              type="text"
              className="form-input"
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
              className="form-input"
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
            <div className="form-row">
              <input
                id="art-tags"
                type="text"
                className="form-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
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
              <div className="file-upload-area">
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
            <div className="file-upload-area">
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
              const updatedValues = {
                ...values,
                trainers: Array.isArray(values.trainers) ? values.trainers : [],
                monsters: Array.isArray(values.monsters) ? values.monsters : [],
              };
              handleCalculatorValuesChange(updatedValues);
              calculateRewardEstimate(updatedValues);
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
            {promptRewards && (
              <div className="prompt-reward-items">
                {(promptRewards.levels ?? 0) > 0 && (
                  <div className="prompt-reward-item">
                    <i className="fas fa-arrow-up"></i>
                    <span>{promptRewards.levels} levels</span>
                  </div>
                )}
                {(promptRewards.coins ?? 0) > 0 && (
                  <div className="prompt-reward-item">
                    <i className="fas fa-coins"></i>
                    <span>{promptRewards.coins} coins</span>
                  </div>
                )}
                {promptRewards.items && promptRewards.items.length > 0 && (
                  <div className="prompt-reward-item">
                    <i className="fas fa-gift"></i>
                    <span>{promptRewards.items.length} item{promptRewards.items.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {promptRewards.monsters && promptRewards.monsters.length > 0 && (
                  <div className="prompt-reward-item">
                    <i className="fas fa-dragon"></i>
                    <span>{promptRewards.monsters.length} monster roll{promptRewards.monsters.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {promptRewards.monster_roll && promptRewards.monster_roll.enabled && (
                  <div className="prompt-reward-item">
                    <i className="fas fa-dragon"></i>
                    <span>Monster roll</span>
                  </div>
                )}
              </div>
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
}
