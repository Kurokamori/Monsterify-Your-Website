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
import MatureContentCheckbox from './MatureContentCheckbox';


const WritingSubmissionForm = ({ onSubmissionComplete, preselectedBookId }) => {
  const { currentUser } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('story');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isMature, setIsMature] = useState(false);
  const [contentRating, setContentRating] = useState({
    gore: false,
    nsfw_light: false,
    nsfw_heavy: false,
    triggering: false,
    intense_violence: false
  });
  const [content, setContent] = useState('');
  const [contentFile, setContentFile] = useState(null);
  const [contentUrl, setContentUrl] = useState('');
  const [inputMethod, setInputMethod] = useState('direct'); // 'direct', 'file', or 'url'
  const [wordCount, setWordCount] = useState(0);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [useCoverImageUrl, setUseCoverImageUrl] = useState(false);

  // Book/Chapter state
  const [isBook, setIsBook] = useState(false);
  const [belongsToBook, setBelongsToBook] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [userBooks, setUserBooks] = useState([]);

  // Book mode chapter management state
  const [chapters, setChapters] = useState([]);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterContentFile, setChapterContentFile] = useState(null);
  const [chapterContentUrl, setChapterContentUrl] = useState('');
  const [chapterInputMethod, setChapterInputMethod] = useState('direct');
  const [chapterWordCount, setChapterWordCount] = useState(0);
  const [chapterCalculatorValues, setChapterCalculatorValues] = useState({
    wordCount: 0,
    trainers: [],
    monsters: [],
    giftParticipants: []
  });
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

  // Pre-select book if preselectedBookId is provided (for "Add Chapter" flow)
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
    // Silently skip if not enough data yet — errors only shown on actual submit
    if (calculatorValues.wordCount <= 0) return;
    if (calculatorValues.trainers.length === 0 && calculatorValues.monsters.length === 0) return;

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
        isBook: isBook ? 1 : 0,
        parentId: belongsToBook && selectedBookId ? parseInt(selectedBookId) : null,
        chapterNumber: belongsToBook && chapterNumber ? parseInt(chapterNumber) : null,
        isMature,
        contentRating,
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
    // Reset book/chapter fields
    setIsBook(false);
    setBelongsToBook(false);
    setSelectedBookId('');
    setChapterNumber('');
    setChapters([]);
    resetChapterForm();

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

  // --- Book mode chapter management ---

  // Auto-count chapter words
  useEffect(() => {
    if (chapterInputMethod === 'direct' && chapterContent) {
      const words = chapterContent.trim().split(/\s+/);
      setChapterWordCount(words.length);
    }
  }, [chapterContent, chapterInputMethod]);

  // Reset chapter form fields
  const resetChapterForm = () => {
    setChapterTitle('');
    setChapterContent('');
    setChapterContentFile(null);
    setChapterContentUrl('');
    setChapterInputMethod('direct');
    setChapterWordCount(0);
    setChapterCalculatorValues({
      wordCount: 0,
      trainers: [],
      monsters: [],
      giftParticipants: []
    });
    setEditingChapterIndex(null);
    setShowAddChapter(false);
  };

  // Handle chapter content file
  const handleChapterContentFileChange = async (e) => {
    const file = e.target.files[0];
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
  };

  // Save chapter (add new or update existing)
  const handleSaveChapter = () => {
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

    const chapterData = {
      title: chapterTitle.trim(),
      content: chapterInputMethod === 'direct' ? chapterContent : '',
      contentFile: chapterInputMethod === 'file' ? chapterContentFile : null,
      contentUrl: chapterInputMethod === 'url' ? chapterContentUrl : '',
      inputMethod: chapterInputMethod,
      wordCount: chapterCalculatorValues.wordCount || chapterWordCount,
      calculatorValues: { ...chapterCalculatorValues },
      trainers: [...(chapterCalculatorValues.trainers || [])],
      monsters: [...(chapterCalculatorValues.monsters || [])]
    };

    if (editingChapterIndex !== null) {
      // Update existing chapter
      const updated = [...chapters];
      updated[editingChapterIndex] = chapterData;
      setChapters(updated);
    } else {
      // Add new chapter
      setChapters(prev => [...prev, chapterData]);
    }

    setError('');
    resetChapterForm();
  };

  // Edit an existing chapter
  const handleEditChapter = (index) => {
    const ch = chapters[index];
    setChapterTitle(ch.title);
    setChapterContent(ch.content || '');
    setChapterContentFile(ch.contentFile || null);
    setChapterContentUrl(ch.contentUrl || '');
    setChapterInputMethod(ch.inputMethod || 'direct');
    setChapterWordCount(ch.wordCount || 0);
    setChapterCalculatorValues(ch.calculatorValues || {
      wordCount: 0,
      trainers: [],
      monsters: [],
      giftParticipants: []
    });
    setEditingChapterIndex(index);
    setShowAddChapter(true);
  };

  // Remove a chapter
  const handleRemoveChapter = (index) => {
    setChapters(prev => prev.filter((_, i) => i !== index));
  };

  // Handle book submission
  const handleBookSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a title for your book.');
      return;
    }

    // Validate chapters if any
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      if (!ch.title.trim()) {
        setError(`Chapter ${i + 1} needs a title.`);
        return;
      }
      const hasContent =
        (ch.inputMethod === 'direct' && ch.content?.trim()) ||
        (ch.inputMethod === 'file' && ch.contentFile) ||
        (ch.inputMethod === 'url' && ch.contentUrl?.trim());
      if (!hasContent) {
        setError(`Chapter ${i + 1} needs content.`);
        return;
      }
      if ((ch.wordCount || 0) <= 0) {
        setError(`Chapter ${i + 1} needs a valid word count.`);
        return;
      }
      if ((ch.trainers?.length || 0) === 0 && (ch.monsters?.length || 0) === 0) {
        setError(`Chapter ${i + 1} needs at least one trainer or monster.`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      // 1. Create the book
      const bookData = {
        title,
        description,
        tags,
      };

      if (useCoverImageUrl && coverImageUrl) {
        bookData.coverImageUrl = coverImageUrl;
      } else if (coverImage) {
        bookData.coverImage = coverImage;
      }

      const bookResult = await submissionService.createBook(bookData);
      const bookId = bookResult.book?.id || bookResult.id;

      if (!bookId) {
        setError('Failed to create book. No book ID returned.');
        setLoading(false);
        return;
      }

      // 2. Submit each chapter with parentId = bookId
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const writingData = {
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

        if (ch.inputMethod === 'direct') {
          writingData.content = ch.content;
        } else if (ch.inputMethod === 'file') {
          writingData.contentFile = ch.contentFile;
        } else if (ch.inputMethod === 'url') {
          writingData.contentUrl = ch.contentUrl;
        }

        await submissionService.submitWriting(writingData);
      }

      // 3. Success
      const result = {
        success: true,
        message: chapters.length > 0
          ? `Book "${title}" created with ${chapters.length} chapter(s)!`
          : `Book "${title}" created! You can add chapters later.`,
        bookId
      };

      handleSubmissionComplete(result);

    } catch (err) {
      console.error('Error creating book:', err);
      setError('Failed to create book. Please try again.');
    } finally {
      setLoading(false);
    }
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

      <form className="submission-form" onSubmit={isBook ? handleBookSubmit : handleSubmit}>
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

          {/* Book/Chapter Options */}
          <div className="form-group">
            <label>Book Organization</label>
            <div className="container horizontal">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isBook}
                  onChange={(e) => {
                    setIsBook(e.target.checked);
                    if (e.target.checked) {
                      setBelongsToBook(false);
                      setSelectedBookId('');
                      setChapterNumber('');
                      setContentType('book');
                    }
                  }}
                  disabled={belongsToBook}
                />
                This is a Book (can contain chapters)
              </label>

              {!isBook && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={belongsToBook}
                    onChange={(e) => {
                      setBelongsToBook(e.target.checked);
                      if (e.target.checked) {
                        setIsBook(false);
                      } else {
                        setSelectedBookId('');
                        setChapterNumber('');
                      }
                    }}
                    disabled={isBook}
                  />
                  This is a Chapter (belongs to an existing book)
                </label>
              )}
            </div>
          </div>

          {isBook && (
            <div className="book-mode-notice">
              <strong>Book Mode:</strong> You are creating a book. Add a title, description, and cover image.
              You can add chapters below, or create the book first and add chapters later.
            </div>
          )}

          {/* Book Selection (for chapters) */}
          {belongsToBook && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="book-select">Select Book *</label>
                <select
                  id="book-select"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  required={belongsToBook}
                >
                  <option value="">-- Select a Book --</option>
                  {userBooks.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.chapter_count || 0} chapters)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="chapter-number">Chapter Number (Optional)</label>
                <input
                  id="chapter-number"
                  type="number"
                  min="1"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  placeholder="Auto-assign if empty"
                />
                <small className="form-hint">Leave empty to auto-assign the next chapter number</small>
              </div>
            </div>
          )}
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
                className="button primary"
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

        {/* Content - hidden in book mode */}
        {!isBook && (
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
        )}

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
            <div className="image-container medium">
              <img
                src={coverImagePreview}
                alt="Cover Preview"
              />
            </div>
          )}
        </div>

        {/* Chapter Management - shown in book mode */}
        {isBook && (
          <div className="form-section">
            <h3>Chapters</h3>

            {chapters.length === 0 && !showAddChapter && (
              <div className="empty-chapters-notice">
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
                        <button
                          type="button"
                          className="button primary"
                          onClick={() => handleEditChapter(index)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button danger"
                          onClick={() => handleRemoveChapter(index)}
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                    <div className="type-tags fw">
                      <span>{ch.wordCount} words</span>
                      <span>{(ch.trainers?.length || 0) + (ch.monsters?.length || 0)} participants</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showAddChapter && (
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  resetChapterForm();
                  setShowAddChapter(true);
                }}
              >
                + Add Chapter
              </button>
            )}

            {showAddChapter && (
              <div className="chapter-form">
                <h4>{editingChapterIndex !== null ? `Edit Chapter ${editingChapterIndex + 1}` : 'New Chapter'}</h4>

                <div className="form-group">
                  <label htmlFor="chapter-title">Chapter Title *</label>
                  <input
                    id="chapter-title"
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Enter chapter title"
                  />
                </div>

                <div className="form-group">
                  <label>Input Method</label>
                  <div className="type-tags fw">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="chapter-input-method"
                        value="direct"
                        checked={chapterInputMethod === 'direct'}
                        onChange={() => setChapterInputMethod('direct')}
                      />
                      Direct Input
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="chapter-input-method"
                        value="file"
                        checked={chapterInputMethod === 'file'}
                        onChange={() => setChapterInputMethod('file')}
                      />
                      Upload File
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="chapter-input-method"
                        value="url"
                        checked={chapterInputMethod === 'url'}
                        onChange={() => setChapterInputMethod('url')}
                      />
                      External URL
                    </label>
                  </div>
                </div>

                {chapterInputMethod === 'direct' && (
                  <div className="form-group">
                    <label htmlFor="chapter-content">Content *</label>
                    <textarea
                      id="chapter-content"
                      value={chapterContent}
                      onChange={(e) => setChapterContent(e.target.value)}
                      placeholder="Enter chapter content"
                      rows={8}
                    />
                    <div className="word-count">Word Count: {chapterWordCount}</div>
                  </div>
                )}

                {chapterInputMethod === 'file' && (
                  <div className="form-group">
                    <label htmlFor="chapter-file">Content File *</label>
                    <div className="file-upload-container">
                      <input
                        id="chapter-file"
                        type="file"
                        accept=".txt,.doc,.docx,.pdf,.rtf,.md"
                        onChange={handleChapterContentFileChange}
                      />
                      <label htmlFor="chapter-file" className="file-upload-label">
                        Choose File
                      </label>
                      <span className="file-name">
                        {chapterContentFile ? chapterContentFile.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>
                )}

                {chapterInputMethod === 'url' && (
                  <div className="form-group">
                    <label htmlFor="chapter-url">Content URL *</label>
                    <input
                      id="chapter-url"
                      type="url"
                      value={chapterContentUrl}
                      onChange={(e) => setChapterContentUrl(e.target.value)}
                      placeholder="Enter the URL where the chapter is hosted"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Chapter Rewards</label>
                  <WritingSubmissionCalculator
                    onCalculate={(values) => {
                      setChapterCalculatorValues({
                        ...values,
                        trainers: Array.isArray(values.trainers) ? values.trainers : [],
                        monsters: Array.isArray(values.monsters) ? values.monsters : []
                      });
                    }}
                    trainers={allTrainers.length > 0 ? allTrainers : userTrainers}
                    monsters={userMonsters}
                    content={chapterContent}
                    inputMethod={chapterInputMethod}
                  />
                </div>

                <div className="chapter-form-actions">
                  <button
                    type="button"
                    className="button primary"
                    onClick={handleSaveChapter}
                  >
                    {editingChapterIndex !== null ? 'Update Chapter' : 'Save Chapter'}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={resetChapterForm}
                  >
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
        )}

        {/* Reward Estimate - hidden in book mode */}
        {!isBook && (
          <div className="form-section">
            <h3>Reward Estimate</h3>

            <button
              type="button"
              className="button secondary"
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
                  <div className="container cols-2 gap-md">
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
                  <div className="container cols-2 gap-md">
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
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="button success"
            disabled={loading}
          >
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
};

export default WritingSubmissionForm;
