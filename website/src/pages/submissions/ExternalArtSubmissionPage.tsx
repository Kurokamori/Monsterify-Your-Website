import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { ExternalArtCalculator, type ExternalArtCalculatorValues } from '@components/submissions/ExternalArtCalculator';
import { ExternalLevelAllocator } from '@components/submissions/ExternalLevelAllocator';
import { MatureContentCheckbox } from '@components/submissions/MatureContentCheckbox';
import type { MatureFilters } from '@components/submissions/MatureContentFilter';
import { FormInput } from '@components/common/FormInput';
import { FormTextArea } from '@components/common/FormTextArea';
import { ErrorModal } from '@components/common/ErrorModal';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import submissionService, { type ExternalRewardResult } from '../../services/submissionService';
import { extractErrorMessage } from '../../utils/errorUtils';

const ExternalArtSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Submit External Art');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageInputMethod, setImageInputMethod] = useState<'file' | 'url'>('file');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [isMature, setIsMature] = useState(false);
  const [matureFilters, setMatureFilters] = useState<MatureFilters>({
    gore: false,
    nsfw_light: false,
    nsfw_heavy: false,
    triggering: false,
    intense_violence: false,
  });

  // Calculator state
  const [calculatorValues, setCalculatorValues] = useState<ExternalArtCalculatorValues | null>(null);
  const [rewardPreview, setRewardPreview] = useState<ExternalRewardResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: number;
    rewards: ExternalRewardResult;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/external/art');
    }
  }, [isAuthenticated, navigate]);

  // Tag management
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Calculate rewards preview
  const handleCalculate = async (values: ExternalArtCalculatorValues) => {
    setCalculatorValues(values);
    setPreviewLoading(true);
    try {
      const rewards = await submissionService.calculateExternalArtRewards({
        quality: values.quality,
        backgrounds: values.backgrounds,
        characters: values.characters,
      });
      setRewardPreview(rewards);
    } catch (err) {
      console.error('Error calculating rewards:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !calculatorValues) return;

    if (!imageFile && !imageUrl) {
      setError('Please provide an image file or URL.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await submissionService.submitExternalArt({
        title,
        description,
        quality: calculatorValues.quality,
        backgrounds: calculatorValues.backgrounds,
        characters: calculatorValues.characters,
        tags,
        isMature,
        contentRating: matureFilters,
        imageFile: imageFile ?? undefined,
        imageUrl: imageUrl || undefined,
        externalLink: externalLink || undefined,
      });

      if (result.success) {
        setSubmissionResult({
          submissionId: result.submission.id,
          rewards: result.rewards,
        });
      } else {
        setError(result.message || 'Failed to submit external art.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit external art'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  // Show allocator after successful submission
  if (submissionResult) {
    return (
      <div className="main-container">
        <PageHeader
          title="External Art Submitted!"
          subtitle="Your external artwork has been submitted. Now allocate your earned levels."
        />

        <div className="submission-success">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Submission Successful!</h2>
          <div className="rewards-summary">
            <h3>Rewards Earned</h3>
            <div className="rewards-grid">
              <div className="submission__reward-item">
                <h4><i className="fas fa-star"></i> Levels</h4>
                <p>{submissionResult.rewards.totalLevels} levels to allocate</p>
              </div>
              <div className="submission__reward-item">
                <h4><i className="fas fa-coins"></i> Coins</h4>
                <p>{submissionResult.rewards.totalCoins} coins (awarded with level allocation)</p>
              </div>
              <div className="submission__reward-item">
                <h4><i className="fas fa-seedling"></i> Garden Points</h4>
                <p>{submissionResult.rewards.gardenPoints} points</p>
              </div>
              <div className="submission__reward-item">
                <h4><i className="fas fa-tasks"></i> Mission Progress</h4>
                <p>{submissionResult.rewards.missionProgress} progress</p>
              </div>
              <div className="submission__reward-item">
                <h4><i className="fas fa-fist-raised"></i> Boss Damage</h4>
                <p>{submissionResult.rewards.bossDamage} damage</p>
              </div>
            </div>
          </div>
        </div>

        <ExternalLevelAllocator
          submissionId={submissionResult.submissionId}
          totalLevels={submissionResult.rewards.totalLevels}
          totalCoins={submissionResult.rewards.totalCoins}
          onAllocationComplete={() => {
            setTimeout(() => navigate('/submissions?tab=gallery'), 2000);
          }}
        />
      </div>
    );
  }

  return (
    <div className="main-container">
      <PageHeader
        title="Submit External Art"
        subtitle="Submit artwork created outside the game (fan art, commissions, etc.) for reduced rewards."
      />

      <div className="submission-form-container">
        <h2>Submit External Art</h2>

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
              name="ext-art-title"
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your artwork a title"
              required
              helpText="The title of your external artwork."
            />

            <FormTextArea
              name="ext-art-description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your artwork (optional)"
              rows={3}
              helpText="A short description. Visible on the submission listing."
            />

            <FormInput
              name="ext-art-link"
              label="External Link"
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="Link to the original source (optional)"
              helpText="Where the original artwork is hosted (DeviantArt, ArtStation, etc.)"
            />
          </div>

          {/* Tags */}
          <div className="form-section">
            <h3>Tags</h3>
            <p className="form-tooltip--section">Optional keywords to categorize your artwork (e.g. fanart, commission, portrait).</p>
            <div className="form-group">
              <label htmlFor="ext-art-tags" className="form-label">Add Tags</label>
              <div className="form-row form-row--left">
                <input
                  id="ext-art-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Enter tags and press Enter"
                  className="input"
                />
                <button type="button" className="button primary no-flex" onClick={addTag}>
                  Add
                </button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="tags-container">
                {tags.map(tag => (
                  <div key={tag} className="tag">
                    <span>{tag}</span>
                    <button type="button" className="button icon danger no-flex" onClick={() => removeTag(tag)}>
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
              contentRating={matureFilters}
              onMatureChange={setIsMature}
              onRatingChange={setMatureFilters}
            />
          </div>

          {/* Image */}
          <div className="form-section">
            <h3>Image</h3>
            <p className="form-tooltip--section">Upload your artwork or provide a direct image URL.</p>

            <div className="form-group">
              <div className="toggle-switch">
                <input
                  id="use-image-url"
                  type="checkbox"
                  checked={imageInputMethod === 'url'}
                  onChange={() => setImageInputMethod(imageInputMethod === 'file' ? 'url' : 'file')}
                  className="checkbox"
                />
                <label htmlFor="use-image-url">Use Image URL</label>
              </div>
            </div>

            {imageInputMethod === 'file' ? (
              <div className="form-group">
                <label htmlFor="ext-art-image" className="form-label">
                  Image File <span className="required-indicator"> *</span>
                </label>
                <div className="file-upload-area">
                  <input
                    id="ext-art-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                  />
                  <label htmlFor="ext-art-image" className="file-upload-label">Choose File</label>
                  <span className="file-name">{imageFile ? imageFile.name : 'No file chosen'}</span>
                </div>
              </div>
            ) : (
              <FormInput
                name="ext-art-image-url"
                label="Image URL"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                required={imageInputMethod === 'url'}
              />
            )}

            {(imagePreview || (imageInputMethod === 'url' && imageUrl)) && (
              <div className="image-container medium">
                <img
                  src={imagePreview || imageUrl}
                  alt="Preview"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Reward Calculator */}
          <div className="form-section">
            <h3>Reward Calculator</h3>
            <p className="form-tooltip--section">Configure the quality, backgrounds, and characters to calculate your rewards.</p>
            <ExternalArtCalculator onCalculate={handleCalculate} />
          </div>

          {/* Reward Preview */}
          {rewardPreview && (
            <div className="form-section">
              <h3>Reward Preview</h3>
              {previewLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="reward-preview">
                  <div className="rewards-grid">
                    <div className="submission__reward-item">
                      <h4>Levels</h4>
                      <p>{rewardPreview.totalLevels}</p>
                    </div>
                    <div className="submission__reward-item">
                      <h4>Coins</h4>
                      <p>{rewardPreview.totalCoins}</p>
                    </div>
                    <div className="submission__reward-item">
                      <h4>Garden Points</h4>
                      <p>{rewardPreview.gardenPoints}</p>
                    </div>
                    <div className="submission__reward-item">
                      <h4>Mission Progress</h4>
                      <p>{rewardPreview.missionProgress}</p>
                    </div>
                    <div className="submission__reward-item">
                      <h4>Boss Damage</h4>
                      <p>{rewardPreview.bossDamage}</p>
                    </div>
                  </div>
                  <p className="form-tooltip">
                    Note: External art levels are calculated at half the normal rate.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={() => navigate('/submissions')}>
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || !title || (!imageFile && !imageUrl)}
            >
              {submitting ? <LoadingSpinner /> : 'Submit External Art'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExternalArtSubmissionPage;
