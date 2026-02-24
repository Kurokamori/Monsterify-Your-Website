import { useState, useEffect, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import { WritingSubmissionCalculator, WritingCalculatorValues } from '../WritingSubmissionCalculator';
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

interface PromptWritingSubmissionPageProps {
  trainerId: string | number;
  trainer: Trainer;
  promptId: string | number;
  prompt: Prompt;
  userTrainers?: Trainer[];
  userMonsters?: Monster[];
  onSubmit: (result: SubmissionResult) => void;
  onBack: () => void;
}

export function PromptWritingSubmissionPage({
  trainerId,
  trainer: _trainer,
  promptId,
  prompt,
  userTrainers = [],
  userMonsters = [],
  onSubmit,
  onBack
}: PromptWritingSubmissionPageProps) {
  void _trainer; // Keep for prop consistency with PromptArtSubmissionPage
  // Form state
  const [title, setTitle] = useState(prompt?.title ? `${prompt.title} - Writing` : '');
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

  // Content state
  const [content, setContent] = useState('');
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentUrl, setContentUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'direct' | 'file' | 'url'>('direct');
  const [wordCount, setWordCount] = useState(0);

  // Cover image state
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [useCoverImageUrl, setUseCoverImageUrl] = useState(false);

  // Calculator values state
  const [calculatorValues, setCalculatorValues] = useState<WritingCalculatorValues>({
    wordCount: 0,
    trainers: [],
    monsters: [],
    npcs: []
  });

  // Reward calculation state
  const [rewardEstimate, setRewardEstimate] = useState<Rewards | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // All trainers for calculator
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all trainers for calculator
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

  // Calculate word count for direct input
  useEffect(() => {
    if (inputMethod === 'direct' && content) {
      const words = content.trim().split(/\s+/);
      setWordCount(words.filter(w => w.length > 0).length);
    }
  }, [content, inputMethod]);

  // Handle content file change
  const handleContentFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContentFile(file);

      if (file.type === 'text/plain') {
        const text = await file.text();
        const words = text.trim().split(/\s+/);
        setWordCount(words.filter(w => w.length > 0).length);
      } else {
        setWordCount(0);
      }
    }
  };

  // Handle cover image change
  const handleCoverImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
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
  const handleCalculatorValuesChange = (values: WritingCalculatorValues) => {
    const updatedValues = {
      ...values,
      trainers: Array.isArray(values.trainers) ? values.trainers : [],
      monsters: Array.isArray(values.monsters) ? values.monsters : []
    };
    setCalculatorValues(updatedValues);
  };

  // Calculate reward estimate - accepts optional fresh values to avoid stale state
  const calculateRewardEstimate = async (values?: WritingCalculatorValues) => {
    const source = values || calculatorValues;
    if (source.wordCount <= 0) return;
    if (source.trainers.length === 0 && source.monsters.length === 0) return;

    try {
      setLoading(true);

      const dataToSend = JSON.parse(JSON.stringify({
        ...source,
        trainers: Array.isArray(source.trainers) ? source.trainers : [],
        monsters: Array.isArray(source.monsters) ? source.monsters : []
      }));

      const response = await submissionService.calculateWritingRewards(dataToSend);
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

      const writingData: Record<string, unknown> = {
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

      if (inputMethod === 'direct') {
        writingData.content = content;
      } else if (inputMethod === 'file') {
        writingData.contentFile = contentFile;
      } else if (inputMethod === 'url') {
        writingData.contentUrl = contentUrl;
      }

      if (useCoverImageUrl && coverImageUrl) {
        writingData.coverImageUrl = coverImageUrl;
      } else if (coverImage) {
        writingData.coverImage = coverImage;
      }

      const result = await submissionService.submitPromptCombined({
        submissionType: 'writing',
        promptId,
        trainerId,
        writingData
      });

      onSubmit(result);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit writing. Please try again.'));
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
        <h2>Writing Submission for: {prompt?.title}</h2>
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
            <label htmlFor="writing-title">Title *</label>
            <input
              id="writing-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your writing"
              required
              className="form-input"
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
              className="form-input"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>

          <div className="form-group">
            <label htmlFor="writing-tags">Add Tags</label>
            <div className="form-row">
              <input
                id="writing-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter tags and press Enter"
                className="form-input"
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
            <div className="type-tags">
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
                className="form-input"
              />
              <div className="word-count-display">
                Word Count: {wordCount}
              </div>
            </div>
          )}

          {inputMethod === 'file' && (
            <div className="form-group">
              <label htmlFor="writing-file">Content File *</label>
              <div className="file-upload-area">
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
                <div className="word-count-display">
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
                className="form-input"
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
                className="form-input"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="cover-image">Cover Image</label>
              <div className="file-upload-area">
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
            content={content}
            inputMethod={inputMethod}
          />

          {showRewardEstimate && rewardEstimate && (
            <RewardDisplay
              rewards={rewardEstimate}
              submissionType="writing"
              trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
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
                Submit Writing
                <i className="fas fa-check"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
