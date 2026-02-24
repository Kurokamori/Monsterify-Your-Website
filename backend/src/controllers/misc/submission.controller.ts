import { Request, Response } from 'express';
import { SubmissionService } from '../../services/submission.service';
import type {
  GalleryFilters,
  LibraryFilters,
  MySubmissionsFilters,
} from '../../services/submission.service';
import type { ArtSubmissionData, WritingSubmissionData, ExternalArtSubmissionData } from '../../services/submission-reward.service';
import cloudinary from '../../utils/cloudinary';

const submissionService = new SubmissionService();

// =============================================================================
// Helpers
// =============================================================================

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== 'string') {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getUserId(req: Request): string {
  const user = req.user as Record<string, unknown> | undefined;
  return (user?.discord_id as string) || (user?.id as string) || '';
}

function getWebsiteUserId(req: Request): string {
  const user = req.user as Record<string, unknown> | undefined;
  return (user?.id as string) || '';
}

function getDiscordUserId(req: Request): string | undefined {
  const user = req.user as Record<string, unknown> | undefined;
  return user?.discord_id as string | undefined;
}

function isAdmin(req: Request): boolean {
  const user = req.user as Record<string, unknown> | undefined;
  return (user?.is_admin as boolean) || false;
}

// =============================================================================
// Admin
// =============================================================================

export async function getAdminSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const options = {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      submissionType: req.query.submissionType as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await submissionService.getAdminSubmissionList(options);
    res.json({ success: true, submissions: result.submissions, pagination: result.pagination });
  } catch (error) {
    console.error('Error getting admin submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin submissions' });
  }
}

// =============================================================================
// Gallery / Browse
// =============================================================================

export async function getArtGallery(req: Request, res: Response): Promise<void> {
  try {
    const tagsParam = (req.query.tags as string) || (req.query.tag as string);
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(t => t) : [];

    const filters: GalleryFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      contentType: req.query.contentType as string,
      tags,
      trainerId: req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined,
      userId: req.query.userId as string,
      monsterId: req.query.monsterId ? parseInt(req.query.monsterId as string) : undefined,
      sort: (req.query.sort as string) || 'newest',
      search: req.query.search as string,
      showMature: req.query.showMature === 'true',
      matureFilters: req.query.matureFilters
        ? parseJsonField<Record<string, boolean>>(req.query.matureFilters, {})
        : undefined,
      isExternal: req.query.isExternal !== undefined ? req.query.isExternal === 'true' : undefined,
    };

    const result = await submissionService.getArtGallery(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting art gallery:', error);
    res.status(500).json({ success: false, message: 'Failed to get art gallery' });
  }
}

export async function getWritingLibrary(req: Request, res: Response): Promise<void> {
  try {
    const tagsParam = (req.query.tags as string) || (req.query.tag as string);
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(t => t) : [];

    const currentUserId = req.user ? getUserId(req) : null;

    const filters: LibraryFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      contentType: req.query.contentType as string,
      tags,
      trainerId: req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined,
      userId: req.query.userId as string,
      monsterId: req.query.monsterId ? parseInt(req.query.monsterId as string) : undefined,
      sort: (req.query.sort as string) || 'newest',
      search: req.query.search as string,
      showMature: req.query.showMature === 'true',
      matureFilters: req.query.matureFilters
        ? parseJsonField<Record<string, boolean>>(req.query.matureFilters, {})
        : undefined,
      booksOnly: req.query.booksOnly === 'true',
      excludeChapters: req.query.excludeChapters === 'true',
      currentUserId,
      isExternal: req.query.isExternal !== undefined ? req.query.isExternal === 'true' : undefined,
    };

    const result = await submissionService.getWritingLibrary(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting writing library:', error);
    res.status(500).json({ success: false, message: 'Failed to get writing library' });
  }
}

export async function getSubmissionTags(_req: Request, res: Response): Promise<void> {
  try {
    const tags = await submissionService.getSubmissionTags();
    res.json({ success: true, tags });
  } catch (error) {
    console.error('Error getting submission tags:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission tags' });
  }
}

export async function getSubmissionById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid submission ID' });
      return;
    }

    const submission = await submissionService.getSubmissionById(id);
    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error('Error getting submission:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission' });
  }
}

export async function getMySubmissions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const filters: MySubmissionsFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      submissionType: req.query.submissionType as string,
      sortBy: (req.query.sortBy as string) || 'newest',
    };

    const result = await submissionService.getMySubmissions(userId, filters);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting user submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
}

// =============================================================================
// Reward Info
// =============================================================================

export async function getGiftItems(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    if (isNaN(submissionId)) {
      res.status(400).json({ success: false, message: 'Invalid submission ID' });
      return;
    }

    const giftItems = await submissionService.getGiftItems(submissionId);
    res.json({ success: true, giftItems });
  } catch (error) {
    console.error('Error getting gift items:', error);
    res.status(500).json({ success: false, message: 'Failed to get gift items' });
  }
}

export async function getSubmissionRewards(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    if (isNaN(submissionId)) {
      res.status(400).json({ success: false, message: 'Invalid submission ID' });
      return;
    }

    const rewards = await submissionService.getSubmissionRewards(submissionId);
    if (!rewards) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    res.json({ success: true, rewards });
  } catch (error) {
    console.error('Error getting submission rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission rewards' });
  }
}

export async function getAvailablePrompts(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.query.trainerId as string);
    const category = (req.query.category as string) || 'general';

    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Trainer ID is required' });
      return;
    }

    const prompts = await submissionService.getAvailablePrompts(trainerId, category);
    res.json({ success: true, prompts });
  } catch (error) {
    console.error('Error getting available prompts:', error);
    res.status(500).json({ success: false, message: 'Failed to get available prompts' });
  }
}

// =============================================================================
// Reward Calculation
// =============================================================================

export async function calculateArtRewards(req: Request, res: Response): Promise<void> {
  try {
    const quality = req.body.quality as string;
    if (!quality) {
      res.status(400).json({ success: false, message: 'Quality is required' });
      return;
    }

    const data = {
      quality: quality as ArtSubmissionData['quality'],
      backgroundType: req.body.backgroundType as ArtSubmissionData['backgroundType'],
      backgrounds: parseJsonField<unknown[]>(req.body.backgrounds, []) as ArtSubmissionData['backgrounds'],
      uniquelyDifficult: req.body.uniquelyDifficult === 'true' || req.body.uniquelyDifficult === true,
      trainers: parseJsonField<unknown[]>(req.body.trainers, []) as ArtSubmissionData['trainers'],
      monsters: parseJsonField<unknown[]>(req.body.monsters, []) as ArtSubmissionData['monsters'],
      npcs: parseJsonField<unknown[]>(req.body.npcs, []) as ArtSubmissionData['npcs'],
      isGift: req.body.isGift === 'true' || req.body.isGift === true,
      useStaticRewards: req.body.useStaticRewards === 'true' || req.body.useStaticRewards === true,
    };

    const userId = getWebsiteUserId(req);
    const rewards = await submissionService.calculateArtRewards(data, parseInt(userId));
    res.json({ success: true, rewards });
  } catch (error) {
    console.error('Error calculating art rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate art rewards' });
  }
}

export async function calculateWritingRewards(req: Request, res: Response): Promise<void> {
  try {
    const wordCount = parseInt(req.body.wordCount);
    if (!wordCount || wordCount <= 0) {
      res.status(400).json({ success: false, message: 'Valid word count is required' });
      return;
    }

    const trainers = parseJsonField<unknown[]>(req.body.trainers, []);
    const monsters = parseJsonField<unknown[]>(req.body.monsters, []);
    const npcs = parseJsonField<unknown[]>(req.body.npcs, []);
    const trainerId = req.body.trainerId ? parseInt(req.body.trainerId) : undefined;
    const isGift = req.body.isGift === 'true' || req.body.isGift === true;

    // Legacy support: if no trainers/monsters arrays but trainerId provided
    let trainersArray = Array.isArray(trainers) ? trainers : [];
    if (trainersArray.length === 0 && (!monsters || (monsters as unknown[]).length === 0) && trainerId) {
      trainersArray = [{ trainerId, isOwned: true, isGift: isGift || false }];
    }

    if (trainersArray.length === 0 && (!monsters || (monsters as unknown[]).length === 0)) {
      res.status(400).json({ success: false, message: 'At least one trainer or monster is required' });
      return;
    }

    const data = {
      wordCount,
      trainers: trainersArray as WritingSubmissionData['trainers'],
      monsters: (Array.isArray(monsters) ? monsters : []) as WritingSubmissionData['monsters'],
      npcs: (Array.isArray(npcs) ? npcs : []) as WritingSubmissionData['npcs'],
    };

    const userId = getWebsiteUserId(req);
    const rewards = await submissionService.calculateWritingRewards(data, parseInt(userId));
    res.json({ success: true, rewards });
  } catch (error) {
    console.error('Error calculating writing rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate writing rewards' });
  }
}

export async function calculateReferenceRewards(req: Request, res: Response): Promise<void> {
  try {
    const { referenceType, references } = req.body;

    if (!referenceType || !references || !Array.isArray(references) || references.length === 0) {
      res.status(400).json({ success: false, message: 'Reference type and at least one reference are required' });
      return;
    }

    const rewards = submissionService.calculateReferenceRewards(referenceType, references);
    res.json({ success: true, rewards });
  } catch (error) {
    console.error('Error calculating reference rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate reference rewards' });
  }
}

export async function calculatePromptRewards(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.body.promptId);
    if (isNaN(promptId)) {
      res.status(400).json({ success: false, message: 'Prompt ID is required' });
      return;
    }

    const rewards = await submissionService.calculatePromptRewards(promptId);
    if (!rewards) {
      res.status(404).json({ success: false, message: 'Prompt not found' });
      return;
    }

    res.json({ success: true, rewards });
  } catch (error) {
    console.error('Error calculating prompt rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate prompt rewards' });
  }
}

// =============================================================================
// Submission Creation
// =============================================================================

export async function submitArt(req: Request, res: Response): Promise<void> {
  try {
    const title = req.body.title as string;
    const contentType = req.body.contentType as string;
    const quality = req.body.quality as string;

    if (!title || !contentType || !quality) {
      res.status(400).json({ success: false, message: 'Title, content type, and quality are required' });
      return;
    }

    // Upload image to Cloudinary if provided
    let imageUrl: string | undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'submissions/art' });
      imageUrl = result.secure_url;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      res.status(400).json({ success: false, message: 'Image file or URL is required' });
      return;
    }

    const isMature = req.body.isMature === 'true' || req.body.isMature === true;

    const data = {
      title,
      description: req.body.description,
      contentType,
      quality,
      backgroundType: req.body.backgroundType,
      backgrounds: parseJsonField<unknown[]>(req.body.backgrounds, []),
      uniquelyDifficult: req.body.uniquelyDifficult === 'true' || req.body.uniquelyDifficult === true,
      trainers: parseJsonField<unknown[]>(req.body.trainers, []),
      monsters: parseJsonField<unknown[]>(req.body.monsters, []),
      npcs: parseJsonField<unknown[]>(req.body.npcs, []),
      isGift: req.body.isGift === 'true' || req.body.isGift === true,
      tags: parseJsonField<string[]>(req.body.tags, []),
      isMature,
      contentRating: parseJsonField<Record<string, unknown>>(req.body.contentRating, {}),
      imageUrl,
      additionalImages: req.body.additionalImages,
      useStaticRewards: req.body.useStaticRewards === 'true' || req.body.useStaticRewards === true,
    };

    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);
    const discordUserId = getDiscordUserId(req);

    const result = await submissionService.submitArt(data, userId, parseInt(websiteUserId), discordUserId ?? null);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting art:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit art' });
  }
}

export async function submitWriting(req: Request, res: Response): Promise<void> {
  try {
    const title = req.body.title as string;
    const content = req.body.content as string;
    const wordCount = parseInt(req.body.wordCount);

    if (!title || !content || !wordCount || wordCount <= 0) {
      res.status(400).json({ success: false, message: 'Title, content, and valid word count are required' });
      return;
    }

    const isMature = req.body.isMature === 'true' || req.body.isMature === true;

    // Upload cover image if provided
    let coverImageUrl: string | undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'submissions/covers' });
      coverImageUrl = result.secure_url;
    } else if (req.body.coverImageUrl) {
      coverImageUrl = req.body.coverImageUrl;
    }

    const data = {
      title,
      description: req.body.description,
      contentType: req.body.contentType ?? 'story',
      content,
      wordCount,
      trainers: parseJsonField<unknown[]>(req.body.trainers, []),
      monsters: parseJsonField<unknown[]>(req.body.monsters, []),
      npcs: parseJsonField<unknown[]>(req.body.npcs, []),
      trainerId: req.body.trainerId ? parseInt(req.body.trainerId) : undefined,
      isGift: req.body.isGift === 'true' || req.body.isGift === true,
      tags: parseJsonField<string[]>(req.body.tags, []),
      isMature,
      contentRating: parseJsonField<Record<string, unknown>>(req.body.contentRating, {}),
      coverImageUrl,
      isBook: req.body.isBook === 'true' || req.body.isBook === true,
      parentId: req.body.parentId ? parseInt(req.body.parentId) : undefined,
      chapterNumber: req.body.chapterNumber ? parseInt(req.body.chapterNumber) : undefined,
    };

    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);
    const discordUserId = getDiscordUserId(req);

    const result = await submissionService.submitWriting(data, userId, parseInt(websiteUserId), discordUserId ?? null);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting writing:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit writing' });
  }
}

export async function submitReference(req: Request, res: Response): Promise<void> {
  try {
    const referenceType = req.body.referenceType as string;
    const body = req.body as Record<string, unknown>;

    if (!referenceType) {
      res.status(400).json({ success: false, message: 'Reference type is required' });
      return;
    }

    const files = (req.files as Express.Multer.File[] | undefined)?.map(f => ({
      fieldname: f.fieldname,
      path: f.path,
    }));

    const data = {
      referenceType,
      body,
      files,
    };

    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);
    const discordUserId = getDiscordUserId(req);

    const result = await submissionService.submitReference(data, userId, parseInt(websiteUserId), discordUserId ?? null);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting reference:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit reference' });
  }
}

export async function submitPrompt(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.body.promptId);
    const trainerId = parseInt(req.body.trainerId);

    if (isNaN(promptId) || isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Prompt ID and trainer ID are required' });
      return;
    }

    // Upload submission file to Cloudinary if provided
    let submissionUrl: string | undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'submissions/prompts' });
      submissionUrl = result.secure_url;
    } else if (req.body.submissionUrl) {
      submissionUrl = req.body.submissionUrl;
    } else {
      res.status(400).json({ success: false, message: 'Submission file or URL is required' });
      return;
    }

    const data = { promptId, trainerId, submissionUrl };
    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);

    const result = await submissionService.submitPrompt(data, userId, parseInt(websiteUserId));
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting prompt:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit prompt' });
  }
}

export async function submitPromptCombined(req: Request, res: Response): Promise<void> {
  try {
    const submissionType = req.body.submissionType as string;
    const promptId = parseInt(req.body.promptId);
    const trainerId = parseInt(req.body.trainerId);

    if (!submissionType || isNaN(promptId) || isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Submission type, prompt ID, and trainer ID are required' });
      return;
    }

    const isMature = req.body.isMature === 'true' || req.body.isMature === true;

    // Upload image if art submission
    let imageUrl: string | undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'submissions/art' });
      imageUrl = result.secure_url;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const data = {
      submissionType,
      promptId,
      trainerId,
      title: req.body.title,
      description: req.body.description,
      contentType: req.body.contentType,
      quality: req.body.quality,
      backgrounds: parseJsonField<unknown[]>(req.body.backgrounds, []),
      uniquelyDifficult: req.body.uniquelyDifficult === 'true' || req.body.uniquelyDifficult === true,
      trainers: parseJsonField<unknown[]>(req.body.trainers, []),
      monsters: parseJsonField<unknown[]>(req.body.monsters, []),
      npcs: parseJsonField<unknown[]>(req.body.npcs, []),
      tags: parseJsonField<string[]>(req.body.tags, []),
      isMature,
      contentRating: parseJsonField<Record<string, unknown>>(req.body.contentRating, {}),
      content: req.body.content,
      wordCount: req.body.wordCount ? parseInt(req.body.wordCount) : undefined,
      imageUrl,
    };

    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);
    const discordUserId = getDiscordUserId(req);

    const result = await submissionService.submitPromptCombined(data, userId, parseInt(websiteUserId), discordUserId ?? null);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting combined prompt:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit prompt' });
  }
}

// =============================================================================
// Reward Allocation
// =============================================================================

export async function allocateGiftLevels(req: Request, res: Response): Promise<void> {
  try {
    const { submissionId, recipientType, recipientId, levels } = req.body;

    if (!submissionId || !recipientType || !recipientId || !levels || levels <= 0) {
      res.status(400).json({ success: false, message: 'Submission ID, recipient type, recipient ID, and valid levels are required' });
      return;
    }

    if (recipientType !== 'trainer' && recipientType !== 'monster') {
      res.status(400).json({ success: false, message: 'Recipient type must be either "trainer" or "monster"' });
      return;
    }

    const allocation = await submissionService.allocateGiftLevels(submissionId, recipientType, recipientId, levels);
    res.json({ success: true, allocation });
  } catch (error) {
    console.error('Error allocating gift levels:', error);
    res.status(500).json({ success: false, message: 'Failed to allocate gift levels' });
  }
}

export async function allocateGiftCoins(req: Request, res: Response): Promise<void> {
  try {
    const { submissionId, trainerId, coins } = req.body;

    if (!submissionId || !trainerId || !coins || coins <= 0) {
      res.status(400).json({ success: false, message: 'Submission ID, trainer ID, and valid coins are required' });
      return;
    }

    const allocation = await submissionService.allocateGiftCoins(submissionId, trainerId, coins);
    res.json({ success: true, allocation });
  } catch (error) {
    console.error('Error allocating gift coins:', error);
    res.status(500).json({ success: false, message: 'Failed to allocate gift coins' });
  }
}

export async function allocateCappedLevels(req: Request, res: Response): Promise<void> {
  try {
    const { submissionId, recipientType, recipientId, levels } = req.body;

    if (!submissionId || !recipientType || !recipientId || !levels || levels <= 0) {
      res.status(400).json({ success: false, message: 'Submission ID, recipient type, recipient ID, and valid levels are required' });
      return;
    }

    if (recipientType !== 'trainer' && recipientType !== 'monster') {
      res.status(400).json({ success: false, message: 'Recipient type must be either "trainer" or "monster"' });
      return;
    }

    const allocation = await submissionService.allocateCappedLevels(submissionId, recipientType, recipientId, levels);
    res.json({ success: true, allocation });
  } catch (error) {
    console.error('Error allocating capped levels:', error);
    res.status(500).json({ success: false, message: 'Failed to allocate capped levels' });
  }
}

export async function allocateGiftItem(req: Request, res: Response): Promise<void> {
  try {
    const { itemId, trainerId } = req.body;

    if (!itemId || !trainerId) {
      res.status(400).json({ success: false, message: 'Item ID and trainer ID are required' });
      return;
    }

    const allocation = await submissionService.allocateGiftItem(itemId, trainerId);
    res.json({ success: true, allocation });
  } catch (error) {
    console.error('Error allocating gift item:', error);
    res.status(500).json({ success: false, message: 'Failed to allocate gift item' });
  }
}

export async function claimPromptRewards(req: Request, res: Response): Promise<void> {
  try {
    const promptSubmissionId = parseInt(req.params.id as string);
    if (isNaN(promptSubmissionId)) {
      res.status(400).json({ success: false, message: 'Invalid prompt submission ID' });
      return;
    }

    const { levelTarget, targetMonsterId, claimItems = true } = req.body;
    const userId = getUserId(req);

    const result = await submissionService.claimPromptRewards(
      promptSubmissionId,
      levelTarget ?? 'trainer',
      targetMonsterId ? parseInt(targetMonsterId) : null,
      claimItems,
      userId,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error claiming prompt rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to claim prompt rewards' });
  }
}

export async function generateGiftItems(req: Request, res: Response): Promise<void> {
  try {
    const count = parseInt(req.body.count);

    if (!count || count < 1 || count > 20) {
      res.status(400).json({ success: false, message: 'Count must be between 1 and 20' });
      return;
    }

    const items = await submissionService.generateGiftItems(count);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error generating gift items:', error);
    res.status(500).json({ success: false, message: 'Failed to generate gift items' });
  }
}

export async function generateGiftMonsters(req: Request, res: Response): Promise<void> {
  try {
    const count = parseInt(req.body.count);

    if (!count || count < 1 || count > 20) {
      res.status(400).json({ success: false, message: 'Count must be between 1 and 20' });
      return;
    }

    const rawSettings = (req.user as Record<string, unknown>)?.monster_roller_settings ?? null;
    const userSettings = rawSettings
      ? (typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings)
      : undefined;

    const monsters = await submissionService.generateGiftMonsters(count, userSettings);
    res.json({ success: true, monsters });
  } catch (error) {
    console.error('Error generating gift monsters:', error);
    res.status(500).json({ success: false, message: 'Failed to generate gift monsters' });
  }
}

export async function finalizeGiftRewards(req: Request, res: Response): Promise<void> {
  try {
    const { levelAllocations, itemAssignments, monsterAssignments } = req.body;

    if (!Array.isArray(levelAllocations) || !Array.isArray(itemAssignments) || !Array.isArray(monsterAssignments)) {
      res.status(400).json({ success: false, message: 'Invalid input data' });
      return;
    }

    const result = await submissionService.finalizeGiftRewards(levelAllocations, itemAssignments, monsterAssignments);
    res.json({ success: true, message: 'Gift rewards processed successfully', data: result });
  } catch (error) {
    console.error('Error finalizing gift rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to process gift rewards' });
  }
}

// =============================================================================
// External Submissions
// =============================================================================

export async function calculateExternalArtRewards(req: Request, res: Response): Promise<void> {
  try {
    const quality = req.body.quality as string;
    if (!quality) {
      res.status(400).json({ success: false, message: 'Quality is required' });
      return;
    }

    const data = {
      quality: quality as ExternalArtSubmissionData['quality'],
      backgrounds: parseJsonField<unknown[]>(req.body.backgrounds, []) as ExternalArtSubmissionData['backgrounds'],
      characters: parseJsonField<unknown[]>(req.body.characters, []) as ExternalArtSubmissionData['characters'],
    };

    const result = await submissionService.calculateExternalArtRewards(data);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error calculating external art rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate external art rewards' });
  }
}

export async function calculateExternalWritingRewards(req: Request, res: Response): Promise<void> {
  try {
    const wordCount = parseInt(req.body.wordCount);
    if (!wordCount || wordCount <= 0) {
      res.status(400).json({ success: false, message: 'Valid word count is required' });
      return;
    }

    const result = await submissionService.calculateExternalWritingRewards({ wordCount });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error calculating external writing rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate external writing rewards' });
  }
}

export async function submitExternalArt(req: Request, res: Response): Promise<void> {
  try {
    const title = req.body.title as string;
    const quality = req.body.quality as string;

    if (!title || !quality) {
      res.status(400).json({ success: false, message: 'Title and quality are required' });
      return;
    }

    const data = {
      title,
      description: req.body.description,
      quality,
      backgrounds: req.body.backgrounds,
      characters: req.body.characters,
      tags: req.body.tags,
      isMature: req.body.isMature === 'true' || req.body.isMature === true,
      contentRating: req.body.contentRating,
      imageUrl: req.body.imageUrl,
      externalLink: req.body.externalLink,
    };

    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);

    const result = await submissionService.submitExternalArt(data, userId, parseInt(websiteUserId), req.file);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting external art:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit external art' });
  }
}

export async function submitExternalWriting(req: Request, res: Response): Promise<void> {
  try {
    const title = req.body.title as string;
    const wordCount = parseInt(req.body.wordCount);

    if (!title || !wordCount || wordCount <= 0) {
      res.status(400).json({ success: false, message: 'Title and valid word count are required' });
      return;
    }

    const data = {
      title,
      description: req.body.description,
      content: req.body.content,
      externalLink: req.body.externalLink,
      wordCount,
      tags: req.body.tags,
      isMature: req.body.isMature === 'true' || req.body.isMature === true,
      contentRating: req.body.contentRating,
      coverImageUrl: req.body.coverImageUrl,
      isBook: req.body.isBook === 'true' || req.body.isBook === true,
      parentId: req.body.parentId ? parseInt(req.body.parentId) : undefined,
      chapterNumber: req.body.chapterNumber ? parseInt(req.body.chapterNumber) : undefined,
    };

    const userId = getUserId(req);
    const websiteUserId = getWebsiteUserId(req);

    const result = await submissionService.submitExternalWriting(data, userId, parseInt(websiteUserId), req.file);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting external writing:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit external writing' });
  }
}

export async function allocateExternalLevels(req: Request, res: Response): Promise<void> {
  try {
    const { submissionId, recipientType, recipientId, levels } = req.body;

    if (!submissionId || !recipientType || !recipientId || !levels || levels <= 0) {
      res.status(400).json({ success: false, message: 'Submission ID, recipient type, recipient ID, and valid levels are required' });
      return;
    }

    if (recipientType !== 'trainer' && recipientType !== 'monster') {
      res.status(400).json({ success: false, message: 'Recipient type must be either "trainer" or "monster"' });
      return;
    }

    const allocation = await submissionService.allocateExternalLevels(
      parseInt(submissionId),
      recipientType,
      parseInt(recipientId),
      parseInt(levels),
    );
    res.json({ success: true, allocation });
  } catch (error) {
    const err = error as Error;
    console.error('Error allocating external levels:', error);
    res.status(400).json({ success: false, message: err.message || 'Failed to allocate external levels' });
  }
}

// =============================================================================
// Rerolls / Claims
// =============================================================================

export async function rerollSubmissionItems(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    const trainerId = parseInt(req.body.trainerId);

    if (isNaN(submissionId) || isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Valid submission ID and trainer ID are required' });
      return;
    }

    const result = await submissionService.rerollSubmissionItems(submissionId, trainerId);
    res.json({ success: true, message: 'Items rerolled successfully', newItems: result.newItems });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('not found') || err.message.includes('does not have')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error('Error rerolling submission items:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function rerollSubmissionMonsters(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    const trainerId = parseInt(req.body.trainerId);

    if (isNaN(submissionId) || isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Valid submission ID and trainer ID are required' });
      return;
    }

    const result = await submissionService.rerollSubmissionMonsters(submissionId, trainerId);
    res.json({ success: true, message: 'Monsters rerolled successfully', newMonsters: result.newMonsters });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('not found') || err.message.includes('does not have')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error('Error rerolling submission monsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function claimSubmissionMonster(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    const trainerId = parseInt(req.body.trainerId);
    const monsterIndex = parseInt(req.body.monsterIndex);
    const monsterName = req.body.monsterName as string;

    if (isNaN(submissionId) || isNaN(trainerId) || isNaN(monsterIndex)) {
      res.status(400).json({ success: false, message: 'Valid submission ID, trainer ID, and monster index are required' });
      return;
    }

    const result = await submissionService.claimSubmissionMonster(submissionId, trainerId, monsterIndex, monsterName);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('not found') || err.message.includes('already been claimed')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error('Error claiming submission monster:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Books / Chapters
// =============================================================================

export async function getUserBooks(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const books = await submissionService.getUserBooks(userId);
    res.json({ success: true, books });
  } catch (error) {
    console.error('Error fetching user books:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user books' });
  }
}

export async function getBookChapters(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    if (isNaN(bookId)) {
      res.status(400).json({ success: false, message: 'Invalid book ID' });
      return;
    }

    const result = await submissionService.getBookChapters(bookId);
    if (!result) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    res.json({ success: true, ...result });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'This submission is not a book') {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error('Error fetching book chapters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch book chapters' });
  }
}

export async function updateChapterOrder(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    const { chapterOrder } = req.body;
    const userId = getUserId(req);

    if (isNaN(bookId) || !Array.isArray(chapterOrder)) {
      res.status(400).json({ success: false, message: 'Valid book ID and chapter order array are required' });
      return;
    }

    await submissionService.updateChapterOrder(bookId, chapterOrder, userId);
    res.json({ success: true, message: 'Chapter order updated successfully' });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('not found') || err.message.includes('permission')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error updating chapter order:', error);
    res.status(500).json({ success: false, message: 'Failed to update chapter order' });
  }
}

export async function createBook(req: Request, res: Response): Promise<void> {
  try {
    const title = req.body.title as string;
    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    // Upload cover image if provided
    let coverImageUrl: string | undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'submissions/covers' });
      coverImageUrl = result.secure_url;
    } else if (req.body.coverImageUrl) {
      coverImageUrl = req.body.coverImageUrl;
    }

    const tags = parseJsonField<string[]>(req.body.tags, []);
    const userId = getUserId(req);

    const book = await submissionService.createBook(
      { title, description: req.body.description, coverImageUrl, tags },
      userId,
    );

    res.json({ success: true, book });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ success: false, message: 'Failed to create book' });
  }
}

// =============================================================================
// Submission Management
// =============================================================================

export async function updateSubmission(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    if (isNaN(submissionId)) {
      res.status(400).json({ success: false, message: 'Invalid submission ID' });
      return;
    }

    const userId = getUserId(req);
    const admin = isAdmin(req);
    const { title, description, tags, content, parentId } = req.body;

    const result = await submissionService.updateSubmission(submissionId, { title, description, tags, content, parentId }, userId, admin);
    res.json({ success: true, message: 'Submission updated successfully', submission: result });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('permission') || err.message.includes('Cannot edit')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error updating submission:', error);
    res.status(500).json({ success: false, message: 'Failed to update submission' });
  }
}

export async function deleteSubmission(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.id as string);
    if (isNaN(submissionId)) {
      res.status(400).json({ success: false, message: 'Invalid submission ID' });
      return;
    }

    const userId = getUserId(req);
    const admin = isAdmin(req);

    await submissionService.deleteSubmission(submissionId, userId, admin);
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('permission') || err.message.includes('already deleted')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error deleting submission:', error);
    res.status(500).json({ success: false, message: 'Failed to delete submission' });
  }
}

// =============================================================================
// Collaborators
// =============================================================================

export async function getBookCollaborators(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    if (isNaN(bookId)) {
      res.status(400).json({ success: false, message: 'Invalid book ID' });
      return;
    }

    const result = await submissionService.getBookCollaborators(bookId);
    if (!result) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    res.json({ success: true, ...result });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'This submission is not a book') {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error('Error getting book collaborators:', error);
    res.status(500).json({ success: false, message: 'Failed to get collaborators' });
  }
}

export async function addBookCollaborator(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    const { userId, role = 'editor' } = req.body;
    const currentUserId = getUserId(req);

    if (isNaN(bookId) || !userId) {
      res.status(400).json({ success: false, message: 'Valid book ID and user ID are required' });
      return;
    }

    const collaborator = await submissionService.addBookCollaborator(bookId, userId, currentUserId, role);
    res.json({ success: true, collaborator });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('already a collaborator') || err.message.includes('cannot add yourself')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('Only the book owner')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error adding collaborator:', error);
    res.status(500).json({ success: false, message: 'Failed to add collaborator' });
  }
}

export async function removeBookCollaborator(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    const collaboratorUserId = req.params.userId as string;
    const currentUserId = getUserId(req);

    if (isNaN(bookId) || !collaboratorUserId) {
      res.status(400).json({ success: false, message: 'Valid book ID and user ID are required' });
      return;
    }

    const removed = await submissionService.removeBookCollaborator(bookId, collaboratorUserId, currentUserId);
    if (!removed) {
      res.status(404).json({ success: false, message: 'Collaborator not found' });
      return;
    }

    res.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('permission') || err.message.includes('Only the book owner')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error removing collaborator:', error);
    res.status(500).json({ success: false, message: 'Failed to remove collaborator' });
  }
}

export async function updateCollaboratorRole(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    const collaboratorUserId = req.params.userId as string;
    const { role } = req.body;
    const currentUserId = getUserId(req);

    if (isNaN(bookId) || !collaboratorUserId) {
      res.status(400).json({ success: false, message: 'Valid book ID and user ID are required' });
      return;
    }

    if (!role || !['editor', 'viewer'].includes(role)) {
      res.status(400).json({ success: false, message: 'Valid role (editor or viewer) is required' });
      return;
    }

    const updated = await submissionService.updateCollaboratorRole(bookId, collaboratorUserId, role, currentUserId);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Collaborator not found' });
      return;
    }

    res.json({ success: true, message: 'Collaborator role updated successfully' });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('Only the book owner')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error updating collaborator role:', error);
    res.status(500).json({ success: false, message: 'Failed to update collaborator role' });
  }
}

export async function getUserCollaborations(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const collaborations = await submissionService.getUserCollaborations(userId);
    res.json({ success: true, collaborations });
  } catch (error) {
    console.error('Error getting user collaborations:', error);
    res.status(500).json({ success: false, message: 'Failed to get collaborations' });
  }
}

export async function searchCollaboratorUsers(req: Request, res: Response): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId as string);
    const search = req.query.search as string;
    const currentUserId = getUserId(req);

    if (isNaN(bookId)) {
      res.status(400).json({ success: false, message: 'Invalid book ID' });
      return;
    }

    if (!search || search.length < 2) {
      res.status(400).json({ success: false, message: 'Search term must be at least 2 characters' });
      return;
    }

    const users = await submissionService.searchCollaboratorUsers(bookId, search, currentUserId);
    res.json({ success: true, users });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('Only the book owner')) {
      res.status(403).json({ success: false, message: err.message });
      return;
    }
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
}
