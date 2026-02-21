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
import { FormTextArea } from '../../common/FormTextArea';
import { WritingSubmissionCalculator, type WritingCalculatorValues } from '../WritingSubmissionCalculator';
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

interface SubmissionResult {
  success?: boolean;
  message?: string;
  hasLevelCaps?: boolean;
  cappedMonsters?: CappedMonster[];
  totalGiftLevels?: number;
  rewards?: RewardEstimate;
  giftRewards?: unknown;
  bookId?: number;
}

interface RewardEstimate {
  totalLevels?: number;
  totalCoins?: number;
  levels?: number;
  coins?: number;
  gardenPoints?: number;
  missionProgress?: number;
  bossDamage?: number;
  hasLevelCaps?: boolean;
  cappedMonsters?: CappedMonster[];
  totalGiftLevels?: number;
  trainerRewards?: Array<{ trainerId: number; trainerName?: string; levels: number; coins: number }>;
  monsterRewards?: Array<{ monsterId: number; name?: string; levels: number; coins: number; cappedLevels?: number }>;
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
}

interface Book {
  id: number;
  title: string;
  chapter_count?: number;
}

interface ChapterData {
  title: string;
  content: string;
  contentFile: File | null;
  contentUrl: string;
  inputMethod: 'direct' | 'file' | 'url';
  wordCount: number;
  calculatorValues: WritingCalculatorValues;
  trainers: WritingCalculatorValues['trainers'];
  monsters: WritingCalculatorValues['monsters'];
}

type Allocations = Record<number, Record<string, number>>;

interface WritingSubmissionFormProps {
  onSubmissionComplete?: (result: SubmissionResult) => void;
  preselectedBookId?: number | string;
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'story', label: 'Story' },
  { value: 'book', label: 'Book (can contain chapters)' },
  { value: 'chapter', label: 'Chapter (belongs to a book)' },
  { value: 'profile', label: 'Character Profile' },
  { value: 'prompt', label: 'Prompt-based' },
  { value: 'poem', label: 'Poem' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_MATURE_FILTERS: MatureFilters = {
  gore: false,
  nsfw_light: false,
  nsfw_heavy: false,
  triggering: false,
  intense_violence: false,
};

const DEFAULT_CALCULATOR_VALUES: WritingCalculatorValues = {
  wordCount: 0,
  trainers: [],
  monsters: [],
  npcs: [],
};

export function WritingSubmissionForm({
  onSubmissionComplete,
  preselectedBookId,
}: WritingSubmissionFormProps) {
  const { currentUser } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('story');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isMature, setIsMature] = useState(false);
  const [contentRating, setContentRating] = useState<MatureFilters>(DEFAULT_MATURE_FILTERS);
  const [content, setContent] = useState('');
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentUrl, setContentUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'direct' | 'file' | 'url'>('direct');
  const [wordCount, setWordCount] = useState(0);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [useCoverImageUrl, setUseCoverImageUrl] = useState(false);

  // Book/Chapter state
  const [isBook, setIsBook] = useState(false);
  const [belongsToBook, setBelongsToBook] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [userBooks, setUserBooks] = useState<Book[]>([]);

  // Book mode chapter management state
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterContentFile, setChapterContentFile] = useState<File | null>(null);
  const [chapterContentUrl, setChapterContentUrl] = useState('');
  const [chapterInputMethod, setChapterInputMethod] = useState<'direct' | 'file' | 'url'>('direct');
  const [chapterWordCount, setChapterWordCount] = useState(0);
  const [chapterCalculatorValues, setChapterCalculatorValues] = useState<WritingCalculatorValues>(DEFAULT_CALCULATOR_VALUES);

  // Reward calculation state
  const [calculatorValues, setCalculatorValues] = useState<WritingCalculatorValues>(DEFAULT_CALCULATOR_VALUES);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [rewardEstimate, setRewardEstimate] = useState<RewardEstimate | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);

  // Level cap reallocation state
  const [showLevelCapReallocation, setShowLevelCapReallocation] = useState(false);
  const [cappedMonsters, setCappedMonsters] = useState<CappedMonster[]>([]);
  const [availableTargets, setAvailableTargets] = useState<AllocationTarget[]>([]);

  // Fetch user's trainers and all their monsters (for gift rewards)
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        setUserTrainers(response.trainers || []);

        if (response.trainers && response.trainers.length > 0) {
          const allMonsters: Monster[] = [];
          for (const trainer of response.trainers) {
            try {
              const monstersResponse = await monsterService.getTrainerMonsters(trainer.id);
              if (monstersResponse.monsters) {
                allMonsters.push(...monstersResponse.monsters);
              }
            } catch (monsterErr) {
              console.error(`Error fetching monsters for trainer ${trainer.id}:`, monsterErr);
            }
          }
          setUserMonsters(allMonsters);
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again later.'));
      }
    };

    fetchTrainers();
  }, [currentUser]);

  // Fetch user's books for chapter assignment
  useEffect(() => {
    const fetchUserBooks = async () => {
      try {
        const response = await submissionService.getUserBooks();
        setUserBooks(response.books || []);
      } catch (err) {
        console.error('Error fetching user books:', err);
      }
    };

    if (currentUser) {
      fetchUserBooks();
    }
  }, [currentUser]);

  // Pre-select book if preselectedBookId is provided
  useEffect(() => {
    if (preselectedBookId && userBooks.length > 0) {
      const bookExists = userBooks.some(book => String(book.id) === String(preselectedBookId));
      if (bookExists) {
        setBelongsToBook(true);
        setSelectedBookId(String(preselectedBookId));
        setContentType('chapter');
      }
    }
  }, [preselectedBookId, userBooks]);

  // Fetch all trainers for monster selection (marks owned ones)
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

  // Calculate word count for direct input
  useEffect(() => {
    if (inputMethod === 'direct' && content) {
      const words = content.trim().split(/\s+/);
      setWordCount(words.length);
    }
  }, [content, inputMethod]);

  // Auto-count chapter words for direct input
  useEffect(() => {
    if (chapterInputMethod === 'direct' && chapterContent) {
      const words = chapterContent.trim().split(/\s+/);
      setChapterWordCount(words.length);
    }
  }, [chapterContent, chapterInputMethod]);

  // Handle content file change
  const handleContentFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContentFile(file);
      if (file.type === 'text/plain') {
        const text = await file.text();
        const words = text.trim().split(/\s+/);
        setWordCount(words.length);
      } else {
        setWordCount(0);
      }
    }
  }, []);

  // Handle cover image change
  const handleCoverImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  }, []);

  // Add tag
  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // Handle tag input keydown
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Build available targets from user trainers and monsters
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

  // Calculate reward estimate
  const calculateRewardEstimate = useCallback(async (values?: WritingCalculatorValues) => {
    const source = values || calculatorValues;
    if (source.wordCount <= 0) return;
    if (source.trainers.length === 0 && source.monsters.length === 0) return;

    try {
      setLoading(true);
      const dataToSend = JSON.parse(JSON.stringify({
        ...source,
        trainers: Array.isArray(source.trainers) ? source.trainers : [],
        monsters: Array.isArray(source.monsters) ? source.monsters : [],
      }));

      const response = await submissionService.calculateWritingRewards(dataToSend);
      setRewardEstimate(response);
      setShowRewardEstimate(true);

      // Store level cap information for later use during submission
      if (response.hasLevelCaps && response.cappedMonsters?.length > 0) {
        setCappedMonsters(response.cappedMonsters);
        setAvailableTargets(buildAvailableTargets());
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to calculate rewards. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [calculatorValues, buildAvailableTargets]);

  // Reset chapter form fields
  const resetChapterForm = useCallback(() => {
    setChapterTitle('');
    setChapterContent('');
    setChapterContentFile(null);
    setChapterContentUrl('');
    setChapterInputMethod('direct');
    setChapterWordCount(0);
    setChapterCalculatorValues(DEFAULT_CALCULATOR_VALUES);
    setEditingChapterIndex(null);
    setShowAddChapter(false);
  }, []);

  // Handle submission completion - reset form
  const handleSubmissionComplete = useCallback((result: SubmissionResult) => {
    setTitle('');
    setDescription('');
    setContentType('story');
    setTags([]);
    setTagInput('');
    setContent('');
    setContentFile(null);
    setContentUrl('');
    setInputMethod('direct');
    setCalculatorValues(DEFAULT_CALCULATOR_VALUES);
    setCoverImage(null);
    setCoverImagePreview('');
    setCoverImageUrl('');
    setUseCoverImageUrl(false);
    setRewardEstimate(null);
    setShowRewardEstimate(false);
    setIsBook(false);
    setBelongsToBook(false);
    setSelectedBookId('');
    setChapterNumber('');
    setChapters([]);
    resetChapterForm();

    onSubmissionComplete?.(result);
  }, [onSubmissionComplete, resetChapterForm]);

  // Apply level allocations to monsters and trainers
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

  // Handle gift rewards completion
  const handleGiftRewardsComplete = useCallback((giftRewardsResult: unknown) => {
    setShowGiftRewards(false);
    const combinedResult: SubmissionResult = { ...submissionResult, giftRewards: giftRewardsResult };
    handleSubmissionComplete(combinedResult);
  }, [submissionResult, handleSubmissionComplete]);

  // Handle gift rewards cancellation
  const handleGiftRewardsCancel = useCallback(() => {
    setShowGiftRewards(false);
    handleSubmissionComplete(submissionResult || { success: true });
  }, [submissionResult, handleSubmissionComplete]);

  // Handle level cap reallocation completion
  const handleLevelCapComplete = useCallback(async (allocations: Allocations) => {
    setShowLevelCapReallocation(false);
    setLoading(true);

    try {
      await applyLevelAllocations(allocations);

      const giftLevelsFromEstimate = rewardEstimate?.totalGiftLevels;
      const giftLevelsFromResult = submissionResult?.totalGiftLevels;
      const totalGift = giftLevelsFromResult || giftLevelsFromEstimate;

      if (totalGift && totalGift > 0) {
        setGiftLevels(totalGift);
        setShowGiftRewards(true);
      } else {
        const finalResult = submissionResult || { success: true, message: 'Level cap reallocation completed successfully!' };
        handleSubmissionComplete(finalResult);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to apply level allocations. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [applyLevelAllocations, rewardEstimate, submissionResult, handleSubmissionComplete]);

  // Handle level cap cancellation
  const handleLevelCapCancel = useCallback(() => {
    setShowLevelCapReallocation(false);
  }, []);

  // Handle chapter content file
  const handleChapterContentFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChapterContentFile(file);
      if (file.type === 'text/plain') {
        const text = await file.text();
        const words = text.trim().split(/\s+/);
        setChapterWordCount(words.length);
      } else {
        setChapterWordCount(0);
      }
    }
  }, []);

  // Save chapter (add new or update existing)
  const handleSaveChapter = useCallback(() => {
    if (!chapterTitle.trim()) {
      setError('Please provide a title for the chapter.');
      return;
    }

    const hasContent =
      (chapterInputMethod === 'direct' && chapterContent.trim()) ||
      (chapterInputMethod === 'file' && chapterContentFile) ||
      (chapterInputMethod === 'url' && chapterContentUrl.trim());

    if (!hasContent) {
      setError('Please provide content for the chapter.');
      return;
    }

    if (chapterCalculatorValues.wordCount <= 0 && chapterWordCount <= 0) {
      setError('Please provide a valid word count for the chapter.');
      return;
    }

    if (chapterCalculatorValues.trainers.length === 0 && chapterCalculatorValues.monsters.length === 0) {
      setError('Please add at least one trainer or monster to the chapter.');
      return;
    }

    const chapterData: ChapterData = {
      title: chapterTitle.trim(),
      content: chapterInputMethod === 'direct' ? chapterContent : '',
      contentFile: chapterInputMethod === 'file' ? chapterContentFile : null,
      contentUrl: chapterInputMethod === 'url' ? chapterContentUrl : '',
      inputMethod: chapterInputMethod,
      wordCount: chapterCalculatorValues.wordCount || chapterWordCount,
      calculatorValues: { ...chapterCalculatorValues },
      trainers: [...(chapterCalculatorValues.trainers || [])],
      monsters: [...(chapterCalculatorValues.monsters || [])],
    };

    if (editingChapterIndex !== null) {
      const updated = [...chapters];
      updated[editingChapterIndex] = chapterData;
      setChapters(updated);
    } else {
      setChapters(prev => [...prev, chapterData]);
    }

    setError('');
    resetChapterForm();
  }, [chapterTitle, chapterInputMethod, chapterContent, chapterContentFile, chapterContentUrl, chapterCalculatorValues, chapterWordCount, editingChapterIndex, chapters, resetChapterForm]);

  // Edit an existing chapter
  const handleEditChapter = useCallback((index: number) => {
    const ch = chapters[index];
    setChapterTitle(ch.title);
    setChapterContent(ch.content || '');
    setChapterContentFile(ch.contentFile || null);
    setChapterContentUrl(ch.contentUrl || '');
    setChapterInputMethod(ch.inputMethod || 'direct');
    setChapterWordCount(ch.wordCount || 0);
    setChapterCalculatorValues(ch.calculatorValues || DEFAULT_CALCULATOR_VALUES);
    setEditingChapterIndex(index);
    setShowAddChapter(true);
  }, [chapters]);

  // Remove a chapter
  const handleRemoveChapter = useCallback((index: number) => {
    setChapters(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle form submission (single writing)
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

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
      const dataToSend = {
        ...calculatorValues,
        trainers: calculatorValues.trainers || [],
        monsters: calculatorValues.monsters || [],
      };

      const writingData: Record<string, unknown> = {
        title,
        description,
        contentType,
        tags,
        isBook: isBook ? 1 : 0,
        parentId: belongsToBook && selectedBookId ? parseInt(selectedBookId) : null,
        chapterNumber: belongsToBook && chapterNumber ? parseInt(chapterNumber) : null,
        isMature,
        contentRating,
        ...dataToSend,
      };

      if (inputMethod === 'direct') writingData.content = content;
      else if (inputMethod === 'file') writingData.contentFile = contentFile;
      else if (inputMethod === 'url') writingData.contentUrl = contentUrl;

      if (useCoverImageUrl && coverImageUrl) writingData.coverImageUrl = coverImageUrl;
      else if (coverImage) writingData.coverImage = coverImage;

      const result = await submissionService.submitWriting(writingData);

      // Check for level caps first
      if (result.hasLevelCaps && result.cappedMonsters?.length > 0) {
        setCappedMonsters(result.cappedMonsters);
        setAvailableTargets(buildAvailableTargets());
        setRewardEstimate(result.rewards);
        setShowLevelCapReallocation(true);
        return;
      }

      // Check if there are gift levels
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;
      if (totalGiftLevels > 0) {
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
      } else {
        handleSubmissionComplete(result);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit writing. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [title, description, contentType, tags, isBook, belongsToBook, selectedBookId, chapterNumber, isMature, contentRating, inputMethod, content, contentFile, contentUrl, useCoverImageUrl, coverImageUrl, coverImage, calculatorValues, buildAvailableTargets, handleSubmissionComplete]);

  // Handle book submission
  const handleBookSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a title for your book.');
      return;
    }

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      if (!ch.title.trim()) { setError(`Chapter ${i + 1} needs a title.`); return; }
      const hasContent =
        (ch.inputMethod === 'direct' && ch.content?.trim()) ||
        (ch.inputMethod === 'file' && ch.contentFile) ||
        (ch.inputMethod === 'url' && ch.contentUrl?.trim());
      if (!hasContent) { setError(`Chapter ${i + 1} needs content.`); return; }
      if ((ch.wordCount || 0) <= 0) { setError(`Chapter ${i + 1} needs a valid word count.`); return; }
      if ((ch.trainers?.length || 0) === 0 && (ch.monsters?.length || 0) === 0) {
        setError(`Chapter ${i + 1} needs at least one trainer or monster.`); return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const bookData: Record<string, unknown> = { title, description, tags };
      if (useCoverImageUrl && coverImageUrl) bookData.coverImageUrl = coverImageUrl;
      else if (coverImage) bookData.coverImage = coverImage;

      const bookResult = await submissionService.createBook(bookData);
      const bookId = bookResult.book?.id || bookResult.id;

      if (!bookId) {
        setError('Failed to create book. No book ID returned.');
        setLoading(false);
        return;
      }

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const writingData: Record<string, unknown> = {
          title: ch.title,
          description: '',
          contentType: 'chapter',
          tags: [],
          isBook: 0,
          parentId: bookId,
          chapterNumber: i + 1,
          wordCount: ch.wordCount,
          trainers: ch.trainers || [],
          monsters: ch.monsters || [],
        };

        if (ch.inputMethod === 'direct') writingData.content = ch.content;
        else if (ch.inputMethod === 'file') writingData.contentFile = ch.contentFile;
        else if (ch.inputMethod === 'url') writingData.contentUrl = ch.contentUrl;

        await submissionService.submitWriting(writingData);
      }

      const result: SubmissionResult = {
        success: true,
        message: chapters.length > 0
          ? `Book "${title}" created with ${chapters.length} chapter(s)!`
          : `Book "${title}" created! You can add chapters later.`,
        bookId,
      };

      handleSubmissionComplete(result);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create book. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [title, description, tags, useCoverImageUrl, coverImageUrl, coverImage, chapters, handleSubmissionComplete]);

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

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Submission Error"
      />

      <form className="submission-form" onSubmit={isBook ? handleBookSubmit : handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <FormInput
            name="writing-title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your writing"
            required
            helpText="The title of your story, poem, profile, or chapter."
          />

          <FormTextArea
            name="writing-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your writing (optional)"
            rows={4}
            helpText="A short summary or blurb. Visible on the submission listing."
          />

          <FormSelect
            name="writing-content-type"
            label="Content Type"
            helpText="'Book' creates a container for chapters. 'Chapter' adds to an existing book."
            value={contentType}
            onChange={(e) => {
              const newContentType = e.target.value;
              setContentType(newContentType);

              // Handle book/chapter selection
              if (newContentType === 'book') {
                setIsBook(true);
                setBelongsToBook(false);
                setSelectedBookId('');
                setChapterNumber('');
              } else if (newContentType === 'chapter') {
                setIsBook(false);
                setBelongsToBook(true);
              } else {
                // For other content types, reset book/chapter states
                setIsBook(false);
                setBelongsToBook(false);
                setSelectedBookId('');
                setChapterNumber('');
              }
            }}
            options={CONTENT_TYPE_OPTIONS}
          />

          {/* Book Mode Notice */}
          {isBook && (
            <div className="book-mode-notice">
              <strong>Book Mode:</strong> You are creating a book. Add a title, description, and cover image.
              You can add chapters below, or create the book first and add chapters later.
            </div>
          )}

          {/* Book Selection (for chapters) */}
          {belongsToBook && (
            <div className="form-row">
              <FormSelect
                name="book-select"
                label="Select Book"
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                options={userBooks.map(book => ({
                  value: String(book.id),
                  label: `${book.title} (${book.chapter_count || 0} chapters)`,
                }))}
                placeholder="-- Select a Book --"
                required={belongsToBook}
              />

              <div className="form-group">
                <FormInput
                  name="chapter-number"
                  label="Chapter Number (Optional)"
                  type="number"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  placeholder="Auto-assign if empty"
                  helpText="Leave empty to auto-assign the next chapter number"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>
          <p className="form-tooltip--section">Optional keywords to categorize your writing (e.g. adventure, drama, comedy).</p>
          <div className="form-group">
            <label htmlFor="writing-tags" className="form-label">Add Tags</label>
            <div className="form-row form-row--left">
              <input
                id="writing-tags"
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
            contentRating={contentRating}
            onMatureChange={setIsMature}
            onRatingChange={setContentRating}
          />
        </div>

        {/* Content - hidden in book mode */}
        {!isBook && (
          <div className="form-section">
            <h3>Content</h3>
            <p className="form-tooltip--section">Paste your writing directly, upload a text file, or link to where it's hosted.</p>

            <div className="form-group">
              <label className="form-label">Input Method</label>
              <div className="type-tags">
                <label className="radio-label">
                  <input type="radio" name="input-method" value="direct" checked={inputMethod === 'direct'} onChange={() => setInputMethod('direct')} />
                  Direct Input
                </label>
                <label className="radio-label">
                  <input type="radio" name="input-method" value="file" checked={inputMethod === 'file'} onChange={() => setInputMethod('file')} />
                  Upload File
                </label>
                <label className="radio-label">
                  <input type="radio" name="input-method" value="url" checked={inputMethod === 'url'} onChange={() => setInputMethod('url')} />
                  External URL
                </label>
              </div>
            </div>

            {inputMethod === 'direct' && (
              <div className="form-group">
                <label htmlFor="writing-content" className="form-label">
                  Content <span className="required-indicator"> *</span>
                </label>
                <textarea
                  id="writing-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your writing content here"
                  rows={10}
                  required={inputMethod === 'direct'}
                  className="textarea"
                />
                <div className="word-count-display">Word Count: {wordCount}</div>
              </div>
            )}

            {inputMethod === 'file' && (
              <div className="form-group">
                <label htmlFor="writing-file" className="form-label">
                  Content File <span className="required-indicator"> *</span>
                </label>
                <div className="file-upload-area">
                  <input
                    id="writing-file"
                    type="file"
                    accept=".txt,.doc,.docx,.pdf,.rtf,.md"
                    onChange={handleContentFileChange}
                    required={inputMethod === 'file'}
                  />
                  <label htmlFor="writing-file" className="file-upload-label">Choose File</label>
                  <span className="file-name">{contentFile ? contentFile.name : 'No file chosen'}</span>
                </div>
              </div>
            )}

            {inputMethod === 'url' && (
              <div className="form-group">
                <FormInput
                  name="writing-url"
                  label="Content URL"
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="Enter the URL where your writing is hosted"
                  required={inputMethod === 'url'}
                />
              </div>
            )}
          </div>
        )}

        {/* Cover Image */}
        <div className="form-section">
          <h3>Cover Image (Optional)</h3>
          <p className="form-tooltip--section">Add a cover image for your writing. This appears on listings and the detail page.</p>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                id="use-cover-image-url"
                type="checkbox"
                checked={useCoverImageUrl}
                onChange={() => setUseCoverImageUrl(!useCoverImageUrl)}
                className="checkbox"
              />
              <label htmlFor="use-cover-image-url">Use Image URL</label>
            </div>
          </div>

          {useCoverImageUrl ? (
            <FormInput
              name="cover-image-url"
              label="Cover Image URL"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="Enter the URL of your cover image"
            />
          ) : (
            <div className="form-group">
              <label htmlFor="cover-image" className="form-label">Cover Image</label>
              <div className="file-upload-area">
                <input id="cover-image" type="file" accept="image/*" onChange={handleCoverImageChange} />
                <label htmlFor="cover-image" className="file-upload-label">Choose File</label>
                <span className="file-name">{coverImage ? coverImage.name : 'No file chosen'}</span>
              </div>
            </div>
          )}

          {coverImagePreview && (
            <div className="image-container medium">
              <img src={coverImagePreview} alt="Cover Preview" />
            </div>
          )}
        </div>

        {/* Chapter Management - shown in book mode */}
        {isBook && (
          <div className="form-section">
            <h3>Chapters</h3>

            {chapters.length === 0 && !showAddChapter && (
              <div className="empty-notice">
                No chapters yet. You can add chapters now or create the book first and add them later.
              </div>
            )}

            {chapters.length > 0 && (
              <div className="chapter-list">
                {chapters.map((ch, index) => (
                  <div key={index} className="chapter-card">
                    <div className="option-row">
                      <div className="detail-row">
                        <span className="chapter-card-number">Chapter {index + 1}</span>
                        <span className="chapter-card-title">{ch.title}</span>
                      </div>
                      <div className="chapter-card-actions">
                        <button type="button" className="button primary" onClick={() => handleEditChapter(index)}>Edit</button>
                        <button type="button" className="button danger" onClick={() => handleRemoveChapter(index)}>&times;</button>
                      </div>
                    </div>
                    <div className="type-tags">
                      <span>{ch.wordCount} words</span>
                      <span>{(ch.trainers?.length || 0) + (ch.monsters?.length || 0)} participants</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showAddChapter && (
              <button type="button" className="button primary" onClick={() => { resetChapterForm(); setShowAddChapter(true); }}>
                + Add Chapter
              </button>
            )}

            {showAddChapter && (
              <div className="chapter-form">
                <h4>{editingChapterIndex !== null ? `Edit Chapter ${editingChapterIndex + 1}` : 'New Chapter'}</h4>

                <FormInput
                  name="chapter-title"
                  label="Chapter Title"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Enter chapter title"
                  required
                />

                <div className="form-group">
                  <label className="form-label">Input Method</label>
                  <div className="type-tags">
                    <label className="radio-label">
                      <input type="radio" name="chapter-input-method" value="direct" checked={chapterInputMethod === 'direct'} onChange={() => setChapterInputMethod('direct')} />
                      Direct Input
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="chapter-input-method" value="file" checked={chapterInputMethod === 'file'} onChange={() => setChapterInputMethod('file')} />
                      Upload File
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="chapter-input-method" value="url" checked={chapterInputMethod === 'url'} onChange={() => setChapterInputMethod('url')} />
                      External URL
                    </label>
                  </div>
                </div>

                {chapterInputMethod === 'direct' && (
                  <div className="form-group">
                    <label htmlFor="chapter-content" className="form-label">
                      Content <span className="required-indicator"> *</span>
                    </label>
                    <textarea
                      id="chapter-content"
                      value={chapterContent}
                      onChange={(e) => setChapterContent(e.target.value)}
                      placeholder="Enter chapter content"
                      rows={8}
                      className="textarea"
                    />
                    <div className="word-count-display">Word Count: {chapterWordCount}</div>
                  </div>
                )}

                {chapterInputMethod === 'file' && (
                  <div className="form-group">
                    <label htmlFor="chapter-file" className="form-label">
                      Content File <span className="required-indicator"> *</span>
                    </label>
                    <div className="file-upload-area">
                      <input id="chapter-file" type="file" accept=".txt,.doc,.docx,.pdf,.rtf,.md" onChange={handleChapterContentFileChange} />
                      <label htmlFor="chapter-file" className="file-upload-label">Choose File</label>
                      <span className="file-name">{chapterContentFile ? chapterContentFile.name : 'No file chosen'}</span>
                    </div>
                  </div>
                )}

                {chapterInputMethod === 'url' && (
                  <FormInput
                    name="chapter-url"
                    label="Content URL"
                    type="url"
                    value={chapterContentUrl}
                    onChange={(e) => setChapterContentUrl(e.target.value)}
                    placeholder="Enter the URL where the chapter is hosted"
                    required
                  />
                )}

                <div className="form-group">
                  <label className="form-label">Chapter Rewards</label>
                  <WritingSubmissionCalculator
                    onCalculate={(values) => {
                      setChapterCalculatorValues({
                        ...values,
                        trainers: Array.isArray(values.trainers) ? values.trainers : [],
                        monsters: Array.isArray(values.monsters) ? values.monsters : [],
                      });
                    }}
                    trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
                    content={chapterContent}
                    inputMethod={chapterInputMethod}
                  />
                </div>

                <div className="chapter-form-actions">
                  <button type="button" className="button primary" onClick={handleSaveChapter}>
                    {editingChapterIndex !== null ? 'Update Chapter' : 'Save Chapter'}
                  </button>
                  <button type="button" className="button secondary" onClick={resetChapterForm}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reward Calculator - hidden in book mode */}
        {!isBook && (
          <div className="form-section">
            <h3>Reward Calculator</h3>
            <p className="form-tooltip--section">Add the trainers and monsters featured in your writing. Levels are split evenly among all participants.</p>

            <WritingSubmissionCalculator
              onCalculate={(values) => {
                const updatedValues: WritingCalculatorValues = {
                  ...values,
                  trainers: Array.isArray(values.trainers) ? values.trainers : [],
                  monsters: Array.isArray(values.monsters) ? values.monsters : [],
                };
                setCalculatorValues(updatedValues);
                calculateRewardEstimate(updatedValues);
              }}
              trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
              content={content}
              inputMethod={inputMethod}
            />

            {showRewardEstimate && rewardEstimate && (
              <div className="reward-estimate-section">
                <h4>Estimated Rewards:</h4>

                {rewardEstimate.trainerRewards && rewardEstimate.trainerRewards.length > 0 && (
                  <div className="submission__reward-section">
                    <h5>Trainer Rewards</h5>
                    {rewardEstimate.trainerRewards.map((tr, i) => (
                      <div key={i} className="container cols-2 gap-md mb-xs">
                        <span className="submission-form__reward-label">{tr.trainerName || `Trainer #${tr.trainerId}`}</span>
                        <span className="submission-form__reward-value">{tr.levels} levels, {tr.coins} coins</span>
                      </div>
                    ))}
                  </div>
                )}

                {rewardEstimate.monsterRewards && rewardEstimate.monsterRewards.length > 0 && (
                  <div className="submission__reward-section">
                    <h5>Monster Rewards</h5>
                    {rewardEstimate.monsterRewards.map((mr, i) => (
                      <div key={i} className="container cols-2 gap-md mb-xs">
                        <span className="submission-form__reward-label">{mr.name || `Monster #${mr.monsterId}`}</span>
                        <span className="submission-form__reward-value">{mr.levels} levels, {mr.coins} coins{mr.cappedLevels ? ` (${mr.cappedLevels} capped)` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="submission__reward-section">
                  <h5>Summary</h5>
                  <div className="container cols-2 gap-md">
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Total Levels:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.totalLevels ?? rewardEstimate.levels ?? 0}</span>
                    </div>
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Total Coins:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.totalCoins ?? rewardEstimate.coins ?? 0} <i className="fas fa-coins"></i></span>
                    </div>
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Garden Points:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.gardenPoints ?? 0}</span>
                    </div>
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Gift Levels:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.totalGiftLevels ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="button success" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                {isBook ? 'Creating Book...' : 'Submitting...'}
              </>
            ) : (
              isBook ? 'Create Book' : 'Submit Writing'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

