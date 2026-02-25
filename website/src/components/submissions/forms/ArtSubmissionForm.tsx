import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import monsterService from '../../../services/monsterService';
import api from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { FormInput } from '../../common/FormInput';
import { FormSelect } from '../../common/FormSelect';
import { ArtSubmissionCalculator, type ArtCalculatorValues } from '../ArtSubmissionCalculator';
import { RewardDisplay } from '../RewardDisplay';
import { GiftRewards } from '../GiftRewards';
import { LevelCapReallocation } from '../LevelCapReallocation';
import { MatureContentCheckbox } from '../MatureContentCheckbox';
import type { MatureFilters } from '../MatureContentFilter';

interface Trainer {
  id: number;
  name: string;
  level?: number;
  is_owned?: boolean;
}

interface Monster {
  id: number;
  name: string;
  species?: string;
  trainer_id?: number;
  level?: number;
}

interface AllocationData {
  type: string;
  recipientType: 'trainer' | 'monster';
  recipientId: number;
  amount: number;
  itemId?: number;
}

interface SubmissionResult {
  success?: boolean;
  message?: string;
  hasLevelCaps?: boolean;
  cappedMonsters?: CappedMonster[];
  totalGiftLevels?: number;
  rewards?: RewardEstimate;
  giftRewards?: unknown;
}

interface RewardEstimate {
  submissionId?: number;
  overallLevels?: number;
  hasLevelCaps?: boolean;
  cappedMonsters?: CappedMonster[];
  totalGiftLevels?: number;
  [key: string]: unknown;
}

interface CappedMonster {
  monsterId: number;
  name?: string;
  species1?: string;
  img_link?: string;
  image_url?: string;
  currentLevel: number;
  originalLevels: number;
  excessLevels: number;
  trainerName?: string;
}

interface AllocationTarget {
  monsterId?: number;
  trainerId?: number;
  name: string;
  level?: number;
  trainerId_target?: number;
}

type Allocations = Record<number, Record<string, number>>;

interface ArtSubmissionFormProps {
  onSubmissionComplete?: (result: SubmissionResult) => void;
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'general', label: 'General Art' },
  { value: 'monster', label: 'Monster Art' },
  { value: 'trainer', label: 'Trainer Art' },
  { value: 'location', label: 'Location Art' },
  { value: 'event', label: 'Event Art' },
  { value: 'prompt', label: 'Prompt-based Art' },
];

const DEFAULT_CALCULATOR_VALUES: ArtCalculatorValues = {
  quality: 'rendered',
  backgroundType: 'none',
  backgrounds: [{ type: 'none' }],
  uniquelyDifficult: false,
  trainers: [],
  monsters: [],
  npcs: [],
};

const DEFAULT_CONTENT_RATING: MatureFilters = {
  gore: false,
  nsfw_light: false,
  nsfw_heavy: false,
  triggering: false,
  intense_violence: false,
};

export function ArtSubmissionForm({ onSubmissionComplete }: ArtSubmissionFormProps) {
  const { currentUser } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isMature, setIsMature] = useState(false);
  const [contentRating, setContentRating] = useState<MatureFilters>(DEFAULT_CONTENT_RATING);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  // Reward calculation state
  const [calculatorValues, setCalculatorValues] = useState<ArtCalculatorValues>(DEFAULT_CALCULATOR_VALUES);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [rewardEstimate, setRewardEstimate] = useState<RewardEstimate | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Level cap reallocation state
  const [showLevelCapReallocation, setShowLevelCapReallocation] = useState(false);
  const [cappedMonsters, setCappedMonsters] = useState<CappedMonster[]>([]);
  const [availableTargets, setAvailableTargets] = useState<AllocationTarget[]>([]);

  // Fetch user's trainers and monsters
  useEffect(() => {
    const fetchTrainersAndMonsters = async () => {
      try {
        const userId = currentUser?.discord_id;
        const trainersResponse = await trainerService.getUserTrainers(userId);
        setUserTrainers(trainersResponse.trainers || []);

        if (trainersResponse.trainers?.length > 0) {
          const allMons: Monster[] = [];
          for (const trainer of trainersResponse.trainers) {
            try {
              const monstersResponse = await monsterService.getTrainerMonsters(trainer.id);
              if (monstersResponse.monsters) {
                allMons.push(...monstersResponse.monsters);
              }
            } catch (monsterErr) {
              console.error(`Error fetching monsters for trainer ${trainer.id}:`, monsterErr);
            }
          }
          setUserMonsters(allMons);
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again later.'));
      }
    };

    fetchTrainersAndMonsters();
  }, [currentUser]);

  // Fetch all trainers for calculator
  useEffect(() => {
    const fetchAllTrainers = async () => {
      try {
        const response = await trainerService.getAllTrainers();
        if (response.trainers && userTrainers.length > 0) {
          const updatedTrainers = response.trainers.map((trainer: Trainer) => ({
            ...trainer,
            is_owned: userTrainers.some(ut => ut.id === trainer.id),
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

  // Image handlers
  const handleMainImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleAdditionalImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAdditionalImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
    }
  }, []);

  const removeAdditionalImage = useCallback((index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Tag handlers
  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Build available targets from user data
  const buildAvailableTargets = useCallback((): AllocationTarget[] => {
    const targets: AllocationTarget[] = [];
    userTrainers.forEach(trainer => {
      targets.push({ trainerId: trainer.id, name: trainer.name, level: trainer.level });
    });
    userMonsters.forEach(monster => {
      targets.push({ monsterId: monster.id, name: monster.name, level: monster.level });
    });
    return targets;
  }, [userTrainers, userMonsters]);

  // Calculate reward estimate - accepts optional values to use instead of stale state
  const calculateRewardEstimate = useCallback(async (values?: ArtCalculatorValues) => {
    if (!title || (!mainImage && !mainImageUrl)) return;

    const source = values || calculatorValues;
    try {
      setLoading(true);
      const dataToSend = JSON.parse(JSON.stringify({
        ...source,
        trainers: Array.isArray(source.trainers) ? source.trainers : [],
        monsters: Array.isArray(source.monsters) ? source.monsters : [],
        backgrounds: Array.isArray(source.backgrounds) ? source.backgrounds : [{ type: 'none' }],
      }));

      const response = await submissionService.calculateArtRewards(dataToSend);
      setRewardEstimate(response);
      setShowRewardEstimate(true);

      if (response.hasLevelCaps && response.cappedMonsters?.length > 0) {
        setCappedMonsters(response.cappedMonsters);
        setAvailableTargets(buildAvailableTargets());
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to calculate rewards. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [title, mainImage, mainImageUrl, calculatorValues, buildAvailableTargets]);

  // Reward allocation handler
  const handleRewardAllocation = useCallback(async (allocation: AllocationData) => {
    if (!rewardEstimate?.submissionId) return;
    try {
      setLoading(true);
      if (allocation.type === 'giftLevels') {
        await submissionService.allocateGiftLevels(rewardEstimate.submissionId, allocation.recipientType, allocation.recipientId, allocation.amount);
      } else if (allocation.type === 'giftCoins') {
        await submissionService.allocateGiftCoins(rewardEstimate.submissionId, allocation.recipientId, allocation.amount);
      } else if (allocation.type === 'cappedLevels') {
        await submissionService.allocateCappedLevels(rewardEstimate.submissionId, allocation.recipientType, allocation.recipientId, allocation.amount);
      } else if (allocation.type === 'giftItem' && allocation.itemId) {
        await submissionService.allocateGiftItem(allocation.itemId, allocation.recipientId);
      }
      const response = await submissionService.getSubmissionRewards(rewardEstimate.submissionId);
      setRewardEstimate(prev => ({ ...prev, ...response }));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to allocate rewards. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [rewardEstimate]);

  // Handle submission completion
  const handleSubmissionComplete = useCallback((result: SubmissionResult) => {
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
    setCalculatorValues(DEFAULT_CALCULATOR_VALUES);
    setRewardEstimate(null);
    setShowRewardEstimate(false);
    onSubmissionComplete?.(result);
  }, [onSubmissionComplete]);

  // Gift rewards handlers
  const handleGiftRewardsComplete = useCallback((giftRewardsResult: unknown) => {
    setShowGiftRewards(false);
    handleSubmissionComplete({ ...submissionResult, giftRewards: giftRewardsResult });
  }, [submissionResult, handleSubmissionComplete]);

  const handleGiftRewardsCancel = useCallback(() => {
    setShowGiftRewards(false);
    if (submissionResult) handleSubmissionComplete(submissionResult);
  }, [submissionResult, handleSubmissionComplete]);

  // Apply level allocations
  const applyLevelAllocations = useCallback(async (allocations: Allocations) => {
    const promises: Promise<unknown>[] = [];
    for (const [, targets] of Object.entries(allocations)) {
      for (const [targetKey, levels] of Object.entries(targets)) {
        if (levels > 0) {
          const [targetType, targetId] = targetKey.split('_');
          if (targetType === 'monster') {
            promises.push(api.post('/monsters/add-levels', { monsterId: parseInt(targetId), levels }));
          } else if (targetType === 'trainer') {
            promises.push(api.post('/trainers/add-levels', { trainerId: parseInt(targetId), levels }));
          }
        }
      }
    }
    await Promise.all(promises);
  }, []);

  // Continue normal reward flow after level cap reallocation
  const continueNormalRewardFlow = useCallback(() => {
    const rewards = submissionResult?.rewards || rewardEstimate;
    if (!rewards) {
      if (submissionResult) handleSubmissionComplete(submissionResult);
      return;
    }
    const totalGift = rewards.totalGiftLevels || 0;
    if (totalGift > 0) {
      setGiftLevels(totalGift);
      setShowGiftRewards(true);
    } else {
      if (submissionResult) handleSubmissionComplete(submissionResult);
    }
  }, [submissionResult, rewardEstimate, handleSubmissionComplete]);

  // Level cap reallocation handlers
  const handleLevelCapComplete = useCallback(async (allocations: Allocations) => {
    setShowLevelCapReallocation(false);
    setLoading(true);
    try {
      await applyLevelAllocations(allocations);
      continueNormalRewardFlow();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to apply level allocations. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [applyLevelAllocations, continueNormalRewardFlow]);

  const handleLevelCapCancel = useCallback(() => {
    setShowLevelCapReallocation(false);
  }, []);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      const dataToSend = {
        ...calculatorValues,
        trainers: calculatorValues.trainers || [],
        monsters: calculatorValues.monsters || [],
      };

      const artData: Record<string, unknown> = {
        title,
        description,
        contentType,
        ...dataToSend,
        tags,
        isMature,
        contentRating,
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

      // Check for level caps
      if (result.hasLevelCaps && result.cappedMonsters?.length > 0) {
        setCappedMonsters(result.cappedMonsters);
        setAvailableTargets(buildAvailableTargets());
        setRewardEstimate(result.rewards);
        setSubmissionResult(result);
        setShowLevelCapReallocation(true);
        return;
      }

      // Check for gift levels
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;
      if (totalGiftLevels > 0) {
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
      } else {
        handleSubmissionComplete(result);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit art. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [title, description, contentType, tags, isMature, contentRating, mainImage, mainImageUrl, useImageUrl, additionalImages, calculatorValues, buildAvailableTargets, handleSubmissionComplete]);

  // Level cap reallocation view
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

  // Gift rewards view
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

          <FormInput
            name="art-title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your artwork"
            required
            helpText="A descriptive name for your submission, visible to others."
          />

          <div className="form-group">
            <label htmlFor="art-description">Description</label>
            <textarea
              id="art-description"
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your artwork (optional)"
              rows={4}
            />
          </div>

          <FormSelect
            name="art-content-type"
            label="Content Type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            options={CONTENT_TYPE_OPTIONS}
            helpText="Categorize your artwork to help others find it."
          />
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>
          <p className="form-tooltip--section">Optional keywords to help others discover your art (e.g. landscape, portrait, fanart).</p>
          <div className="form-group">
            <label htmlFor="art-tags">Add Tags</label>
            <div className="tag-input-row">
              <input
                id="art-tags"
                className="input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter tags and press Enter"
              />
              <button type="button" className="button primary" onClick={addTag}>
                Add
              </button>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="tags-container">
              {tags.map(tag => (
                <span key={tag} className="submission-tag">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    &times;
                  </button>
                </span>
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
          <p className="form-tooltip--section">Upload your artwork or provide a direct URL. You can also add additional images for multi-page or process shots.</p>

          <div className="form-group">
            <label className="upload-toggle">
              <input
                type="checkbox"
                checked={useImageUrl}
                onChange={() => setUseImageUrl(!useImageUrl)}
              />
              Use Image URL
            </label>
          </div>

          {useImageUrl ? (
            <FormInput
              name="art-image-url"
              label="Image URL"
              type="url"
              value={mainImageUrl}
              onChange={(e) => setMainImageUrl(e.target.value)}
              placeholder="Enter the URL of your artwork"
              required={useImageUrl}
            />
          ) : (
            <div className="form-group">
              <label htmlFor="art-image">Main Image *</label>
              <div className="file-upload-area">
                <input
                  id="art-image"
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                />
                <label htmlFor="art-image" className="file-upload-label">Choose File</label>
                <span className="file-name">{mainImage ? mainImage.name : 'No file chosen'}</span>
              </div>
            </div>
          )}

          {mainImagePreview && (
            <div className="image-preview">
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
              <label htmlFor="additional-images" className="file-upload-label">Choose Files</label>
              <span className="file-name">
                {additionalImages.length > 0 ? `${additionalImages.length} files selected` : 'No files chosen'}
              </span>
            </div>
          </div>

          {additionalImagePreviews.length > 0 && (
            <div className="reference-list">
              {additionalImagePreviews.map((preview, index) => (
                <div key={index} className="reference-entry">
                  <img src={preview} alt={`Additional ${index + 1}`} className="image-preview" style={{ maxHeight: '100px' }} />
                  <button type="button" className="button danger" onClick={() => removeAdditionalImage(index)}>
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
          <p className="form-tooltip--section">Configure the details of your art to estimate rewards. Add trainers, monsters, and select quality/background options.</p>
          <ArtSubmissionCalculator
            onCalculate={(values) => {
              const updatedValues = {
                ...values,
                trainers: Array.isArray(values.trainers) ? values.trainers : [],
                monsters: Array.isArray(values.monsters) ? values.monsters : [],
              };
              setCalculatorValues(updatedValues);
              calculateRewardEstimate(updatedValues);
            }}
            trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
            monsters={userMonsters}
          />

          {showRewardEstimate && rewardEstimate && (
            <RewardDisplay
              rewards={rewardEstimate as never}
              submissionType="art"
              trainers={userTrainers}
              monsters={userMonsters}
              onAllocate={handleRewardAllocation as never}
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions flex flex-col">
          <div className="form-tooltip--section">Before submitting, confirm you have added all the backgrounds, trainers, monsters, and NPCs you would like to add. While you are able to somewhat adjust this later, those adjustments will not award extra levels/points such as gift levels/rewards, level cap reallocation, garden, etc. So it's best you ensure everything is correct now.</div>
          <button type="submit" className="button success" disabled={loading}>
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
}
