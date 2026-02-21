import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { ExternalLevelAllocator } from '@components/submissions/ExternalLevelAllocator';
import { MatureContentCheckbox } from '@components/submissions/MatureContentCheckbox';
import type { MatureFilters } from '@components/submissions/MatureContentFilter';
import { FormInput } from '@components/common/FormInput';
import { FormTextArea } from '@components/common/FormTextArea';
import { FormSelect } from '@components/common/FormSelect';
import { ErrorModal } from '@components/common/ErrorModal';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import submissionService, { type ExternalRewardResult } from '../../services/submissionService';
import { extractErrorMessage } from '../../utils/errorUtils';

interface Book {
  id: number;
  title: string;
  chapter_count?: number;
}

const ExternalWritingSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Submit External Writing');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [contentInputMethod, setContentInputMethod] = useState<'paste' | 'link'>('paste');
  const [isMature, setIsMature] = useState(false);
  const [matureFilters, setMatureFilters] = useState<MatureFilters>({
    gore: false,
    nsfw_light: false,
    nsfw_heavy: false,
    triggering: false,
    intense_violence: false,
  });

  // Book state
  const [isBook, setIsBook] = useState(false);
  const [isChapter, setIsChapter] = useState(false);
  const [parentBookId, setParentBookId] = useState<string>('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [userBooks, setUserBooks] = useState<Book[]>([]);

  // Reward preview
  const [rewardPreview, setRewardPreview] = useState<ExternalRewardResult | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: number;
    rewards: ExternalRewardResult;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/external/writing');
    }
  }, [isAuthenticated, navigate]);

  // Load user books when chapter mode selected
  useEffect(() => {
    if (isChapter && isAuthenticated) {
      submissionService.getUserBooks().then(response => {
        setUserBooks(response.books || []);
      }).catch(err => console.error('Error loading books:', err));
    }
  }, [isChapter, isAuthenticated]);

  // Auto-count words from pasted content
  useEffect(() => {
    if (contentInputMethod === 'paste' && content) {
      const count = content.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(count);
    }
  }, [content, contentInputMethod]);

  // Calculate reward preview when word count changes
  useEffect(() => {
    if (wordCount > 0) {
      submissionService.calculateExternalWritingRewards({ wordCount })
        .then(rewards => setRewardPreview(rewards))
        .catch(err => console.error('Error calculating rewards:', err));
    } else {
      setRewardPreview(null);
    }
  }, [wordCount]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || wordCount <= 0) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await submissionService.submitExternalWriting({
        title,
        description,
        content: contentInputMethod === 'paste' ? content : undefined,
        externalLink: externalLink || undefined,
        wordCount,
        tags,
        isMature,
        contentRating: matureFilters,
        isBook: isBook && !isChapter,
        parentId: isChapter && parentBookId ? parseInt(parentBookId) : undefined,
        chapterNumber: isChapter && chapterNumber ? parseInt(chapterNumber) : undefined,
      });

      if (result.success) {
        setSubmissionResult({
          submissionId: result.submission.id,
          rewards: result.rewards,
        });
      } else {
        setError(result.message || 'Failed to submit external writing.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit external writing'));
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
          title="External Writing Submitted!"
          subtitle="Your external writing has been submitted. Now allocate your earned levels."
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
            setTimeout(() => navigate('/submissions?tab=library'), 2000);
          }}
        />
      </div>
    );
  }

  return (
    <div className="main-container">
      <PageHeader
        title="Submit External Writing"
        subtitle="Submit writing created outside the game (fan fiction, published stories, etc.) for reduced rewards."
      />

      <div className="submission-form-container">
        <h2>Submit External Writing</h2>

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
              name="ext-writing-title"
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your writing a title"
              required
              helpText="The title of your story, poem, or chapter."
            />

            <FormTextArea
              name="ext-writing-description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={3}
              helpText="A short summary or blurb. Visible on the submission listing."
            />

            <FormSelect
              name="ext-writing-book-type"
              label="Content Type"
              helpText="'Book' creates a container for chapters. 'Chapter' adds to an existing book."
              value={isChapter ? 'chapter' : isBook ? 'book' : 'standalone'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'book') {
                  setIsBook(true);
                  setIsChapter(false);
                } else if (val === 'chapter') {
                  setIsBook(true);
                  setIsChapter(true);
                } else {
                  setIsBook(false);
                  setIsChapter(false);
                  setParentBookId('');
                  setChapterNumber('');
                }
              }}
              options={[
                { value: 'standalone', label: 'Standalone Writing' },
                { value: 'book', label: 'Create New Book' },
                { value: 'chapter', label: 'Add Chapter to Existing Book' },
              ]}
            />

            {/* Book Selection (for chapters) */}
            {isChapter && (
              <div className="form-row">
                <FormSelect
                  name="ext-book-select"
                  label="Select Book"
                  value={parentBookId}
                  onChange={(e) => setParentBookId(e.target.value)}
                  options={userBooks.map(book => ({
                    value: String(book.id),
                    label: `${book.title} (${book.chapter_count || 0} chapters)`,
                  }))}
                  placeholder="-- Select a Book --"
                  required={isChapter}
                />

                <FormInput
                  name="ext-chapter-number"
                  label="Chapter Number (Optional)"
                  type="number"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  placeholder="Auto-assign if empty"
                  helpText="Leave empty to auto-assign the next chapter number"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="form-section">
            <h3>Tags</h3>
            <p className="form-tooltip--section">Optional keywords to categorize your writing (e.g. fanfic, novel, poetry).</p>
            <div className="form-group">
              <label htmlFor="ext-writing-tags" className="form-label">Add Tags</label>
              <div className="form-row form-row--left">
                <input
                  id="ext-writing-tags"
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

          {/* Content */}
          <div className="form-section">
            <h3>Content</h3>
            <p className="form-tooltip--section">Paste your writing directly or provide a link to where it's hosted.</p>

            <div className="form-group">
              <label className="form-label">Input Method</label>
              <div className="type-tags">
                <label className="radio-label">
                  <input type="radio" name="ext-input-method" value="paste" checked={contentInputMethod === 'paste'} onChange={() => setContentInputMethod('paste')} />
                  Direct Input
                </label>
                <label className="radio-label">
                  <input type="radio" name="ext-input-method" value="link" checked={contentInputMethod === 'link'} onChange={() => setContentInputMethod('link')} />
                  External URL
                </label>
              </div>
            </div>

            {contentInputMethod === 'paste' ? (
              <div className="form-group">
                <label htmlFor="ext-writing-content" className="form-label">
                  Content <span className="required-indicator"> *</span>
                </label>
                <textarea
                  id="ext-writing-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your writing here..."
                  rows={12}
                  required={contentInputMethod === 'paste'}
                  className="textarea"
                />
                <div className="word-count-display">Word Count: {wordCount}</div>
              </div>
            ) : (
              <>
                <FormInput
                  name="ext-writing-url"
                  label="Content URL"
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://example.com/your-story"
                  required={contentInputMethod === 'link'}
                />
                <FormInput
                  name="ext-writing-word-count"
                  label="Word Count"
                  type="number"
                  value={wordCount || ''}
                  onChange={(e) => setWordCount(parseInt(e.target.value) || 0)}
                  placeholder="Enter the word count manually"
                  required
                  helpText="Please enter the word count for your externally linked content."
                />
              </>
            )}
          </div>

          {/* Reward Preview */}
          {rewardPreview && (
            <div className="form-section">
              <h3>Reward Preview</h3>
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
                  Note: External writing earns 1 level per 100 words (half the normal rate).
                </p>
              </div>
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
              disabled={submitting || !title || wordCount <= 0}
            >
              {submitting ? <LoadingSpinner /> : 'Submit External Writing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExternalWritingSubmissionPage;
