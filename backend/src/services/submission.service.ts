import { db } from '../database';
import { TrainerRepository } from '../repositories/trainer.repository';
import { MonsterRepository } from '../repositories/monster.repository';
import { TrainerInventoryRepository, type InventoryCategory } from '../repositories/trainer-inventory.repository';
import { UserRepository } from '../repositories/user.repository';
import { SubmissionRepository } from '../repositories/submission.repository';
import type {
  GalleryFilters,
  LibraryFilters,
  MySubmissionsFilters,
  FullSubmissionCreateInput,
  AdminSubmissionQueryOptions,
  AdminSubmissionRow,
} from '../repositories/submission.repository';
import { PromptSubmissionRepository } from '../repositories/prompt-submission.repository';

import { PromptRepository } from '../repositories/prompt.repository';
import { ItemRepository } from '../repositories/item.repository';
import { SubmissionRewardService } from './submission-reward.service';
import type {
  ArtSubmissionData,
  WritingSubmissionData,
  ArtRewardResult,
  WritingRewardResult,
  LevelCapResult,
  MonsterReward,
  TrainerReward,
  ExternalArtSubmissionData,
  ExternalWritingSubmissionData,
  ExternalRewardResult,
} from './submission-reward.service';
import { SpecialBerryService } from './special-berry.service';
import { MonsterRollerService } from './monster-roller.service';
import type { RollParams, RolledMonster, UserSettings } from './monster-roller.service';
import { ItemRollerService } from './item-roller.service';
import type { RolledItem, ItemRollOptions } from './item-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import type { MonsterData } from './monster-initializer.service';
import type { MonsterTable } from '../utils/constants';
import cloudinary from '../utils/cloudinary';

// =============================================================================
// Types
// =============================================================================

export type { GalleryFilters, LibraryFilters, MySubmissionsFilters, AdminSubmissionQueryOptions, AdminSubmissionRow } from '../repositories/submission.repository';

export type SubmitArtData = {
  title: string;
  description?: string;
  contentType: string;
  quality: string;
  backgroundType?: string;
  backgrounds?: unknown[];
  uniquelyDifficult?: boolean;
  trainers?: unknown[];
  monsters?: unknown[];
  npcs?: unknown[];
  isGift?: boolean;
  tags?: string[];
  isMature?: boolean;
  contentRating?: Record<string, unknown>;
  imageUrl?: string;
  additionalImages?: string[];
  useStaticRewards?: boolean;
};

export type SubmitWritingData = {
  title: string;
  description?: string;
  contentType: string;
  content: string;
  wordCount: number;
  trainers?: unknown[];
  monsters?: unknown[];
  npcs?: unknown[];
  trainerId?: number;
  isGift?: boolean;
  tags?: string[];
  isMature?: boolean;
  contentRating?: Record<string, unknown>;
  coverImageUrl?: string;
  isBook?: boolean;
  parentId?: number;
  chapterNumber?: number;
};

export type SubmitReferenceData = {
  referenceType: string;
  body: Record<string, unknown>;
  files?: Array<{ fieldname: string; path: string }>;
};

export type SubmitPromptData = {
  promptId: number;
  trainerId: number;
  submissionUrl?: string;
};

export type SubmitPromptCombinedData = {
  submissionType: string;
  promptId: number;
  trainerId: number;
  title?: string;
  description?: string;
  contentType?: string;
  quality?: string;
  backgrounds?: unknown[];
  uniquelyDifficult?: boolean;
  trainers?: unknown[];
  monsters?: unknown[];
  npcs?: unknown[];
  tags?: string[];
  isMature?: boolean;
  contentRating?: Record<string, unknown>;
  content?: string;
  wordCount?: number;
  imageUrl?: string;
};

export type SubmitExternalArtData = {
  title: string;
  description?: string;
  quality: string;
  backgrounds?: unknown[];
  characters?: unknown[];
  tags?: string[];
  isMature?: boolean;
  contentRating?: Record<string, unknown>;
  imageUrl?: string;
  externalLink?: string;
};

export type SubmitExternalWritingData = {
  title: string;
  description?: string;
  content?: string;
  externalLink?: string;
  wordCount: number;
  tags?: string[];
  isMature?: boolean;
  contentRating?: Record<string, unknown>;
  coverImageUrl?: string;
  isBook?: boolean;
  parentId?: number;
  chapterNumber?: number;
};

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

// =============================================================================
// Service
// =============================================================================

export type RewardSnapshotEntry = {
  id: number;
  name?: string;
  type: 'trainer' | 'monster';
  levels: number;
  coins: number;
  cappedLevels?: number;
};

export class SubmissionService {
  private trainerRepo: TrainerRepository;
  private monsterRepo: MonsterRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private submissionRepo: SubmissionRepository;
  private promptSubmissionRepo: PromptSubmissionRepository;
  private promptRepo: PromptRepository;
  private itemRepo: ItemRepository;
  private rewardService: SubmissionRewardService;
  private specialBerryService: SpecialBerryService;
  private monsterInitService: MonsterInitializerService;
  private userRepo: UserRepository;

  constructor(
    submissionRepo?: SubmissionRepository,
    promptSubmissionRepo?: PromptSubmissionRepository,
    promptRepo?: PromptRepository,
    itemRepo?: ItemRepository,
    trainerRepo?: TrainerRepository,
    monsterRepo?: MonsterRepository,
    inventoryRepo?: TrainerInventoryRepository,
    rewardService?: SubmissionRewardService,
    specialBerryService?: SpecialBerryService,
    monsterInitService?: MonsterInitializerService,
  ) {
    this.submissionRepo = submissionRepo ?? new SubmissionRepository();
    this.promptSubmissionRepo = promptSubmissionRepo ?? new PromptSubmissionRepository();
    this.promptRepo = promptRepo ?? new PromptRepository();
    this.itemRepo = itemRepo ?? new ItemRepository();
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.inventoryRepo = inventoryRepo ?? new TrainerInventoryRepository();
    this.rewardService = rewardService ?? new SubmissionRewardService();
    this.specialBerryService = specialBerryService ?? new SpecialBerryService();
    this.monsterInitService = monsterInitService ?? new MonsterInitializerService();
    this.userRepo = new UserRepository();
  }

  // ===========================================================================
  // Gallery / Browse
  // ===========================================================================

  async getArtGallery(filters: GalleryFilters): Promise<{
    submissions: unknown[];
    page: number;
    totalPages: number;
    totalSubmissions: number;
  }> {
    const result = await this.submissionRepo.findArtGallery(filters);
    return {
      submissions: result.rows,
      page: result.page,
      totalPages: result.totalPages,
      totalSubmissions: result.total,
    };
  }

  async getWritingLibrary(filters: LibraryFilters): Promise<{
    submissions: unknown[];
    page: number;
    totalPages: number;
    totalSubmissions: number;
  }> {
    const result = await this.submissionRepo.findWritingLibrary(filters);
    return {
      submissions: result.rows,
      page: result.page,
      totalPages: result.totalPages,
      totalSubmissions: result.total,
    };
  }

  async getSubmissionTags(): Promise<string[]> {
    return this.submissionRepo.findAllDistinctTags();
  }

  async getSubmissionById(id: number): Promise<unknown | null> {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) {
      return null;
    }

    const [images, tags, monsters, trainers] = await Promise.all([
      this.submissionRepo.findImagesBySubmissionId(id),
      this.submissionRepo.findTagsBySubmissionId(id),
      this.submissionRepo.findMonstersBySubmissionId(id),
      this.submissionRepo.findTrainersBySubmissionId(id),
    ]);

    // Get chapters if this is a book
    let chapters: unknown[] = [];
    if (submission.isBook) {
      const bookData = await this.submissionRepo.findBookWithChapters(id);
      chapters = bookData.chapters;
    }

    // Process monsters
    const processedMonsters = monsters.map((monster) => {
      const speciesArray = [monster.species1, monster.species2, monster.species3]
        .filter(s => s && String(s).trim() !== '');
      const typeArray = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
        .filter(t => t && String(t).trim() !== '');
      return {
        ...monster,
        species: speciesArray.join('/'),
        type: typeArray.join('/'),
      };
    });

    const mainImage = images.find(img => img.is_main) ?? images[0];

    return {
      id: submission.id,
      title: submission.title,
      description: submission.description,
      content_type: submission.contentType,
      content: submission.content,
      submission_date: submission.submissionDate,
      user_id: submission.userId,
      trainer_id: submission.trainerId,
      is_book: submission.isBook,
      parent_id: submission.parentId,
      submission_type: submission.submissionType,
      username: submission.userUsername,
      display_name: submission.userDisplayName,
      trainer_name: submission.trainerName,
      image_url: mainImage ? mainImage.image_url : null,
      images,
      tags,
      monsters: processedMonsters,
      trainers,
      chapters,
      is_external: submission.isExternal,
      external_characters: submission.externalCharacters,
      external_levels: submission.externalLevels,
      external_coins: submission.externalCoins,
    };
  }

  async getGiftItems(submissionId: number): Promise<unknown[]> {
    return this.submissionRepo.findGiftItems(submissionId);
  }

  async getSubmissionRewards(submissionId: number): Promise<unknown> {
    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) {
      return null;
    }

    const allocations = await this.submissionRepo.findRewardAllocations(submissionId);

    return {
      giftLevels: {
        total: submission.giftLevels,
        allocated: allocations.giftLevelAllocations,
      },
      giftCoins: {
        total: submission.giftCoins,
        allocated: allocations.giftCoinAllocations,
      },
      cappedLevels: {
        total: submission.cappedLevels,
        allocated: allocations.cappedLevelAllocations,
      },
    };
  }

  async getMySubmissions(userId: string, filters: MySubmissionsFilters): Promise<{
    submissions: unknown[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const limit = filters.limit ?? 12;
    const result = await this.submissionRepo.findMySubmissions(userId, filters);

    return {
      submissions: result.rows,
      pagination: { page: result.page, limit, total: result.total, totalPages: result.totalPages },
    };
  }

  async getAdminSubmissionList(options: AdminSubmissionQueryOptions): Promise<{
    submissions: AdminSubmissionRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.submissionRepo.findAdminList(options);
    return {
      submissions: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    };
  }

  async getAvailablePrompts(trainerId: number, category: string): Promise<unknown[]> {
    return this.promptRepo.findAvailableByCategory(category, trainerId);
  }

  // ===========================================================================
  // Reward Calculation
  // ===========================================================================

  async calculateArtRewards(
    data: ArtSubmissionData,
    userId?: number
  ): Promise<{ rewards: ArtRewardResult & { cappedMonsters: LevelCapResult['cappedMonsters']; hasLevelCaps: boolean } }> {
    const rewards = await this.rewardService.calculateArtRewards(data, userId);
    const levelCapInfo = await this.rewardService.checkLevelCaps(rewards.monsterRewards || []);
    return {
      rewards: {
        ...rewards,
        cappedMonsters: levelCapInfo.cappedMonsters,
        hasLevelCaps: levelCapInfo.cappedMonsters.length > 0,
      },
    };
  }

  async calculateWritingRewards(
    data: WritingSubmissionData,
    userId?: number
  ): Promise<{ rewards: WritingRewardResult & { cappedMonsters: LevelCapResult['cappedMonsters']; hasLevelCaps: boolean } }> {
    const rewards = await this.rewardService.calculateWritingRewards(data, userId);
    const levelCapInfo = await this.rewardService.checkLevelCaps(rewards.monsterRewards || []);
    return {
      rewards: {
        ...rewards,
        cappedMonsters: levelCapInfo.cappedMonsters,
        hasLevelCaps: levelCapInfo.cappedMonsters.length > 0,
      },
    };
  }

  calculateReferenceRewards(
    referenceType: string,
    references: Array<{ trainerId?: number; monsterName?: string; customLevels?: number }>
  ): { levels: number; coins: number; giftLevels: number; cappedLevels: number } {
    let totalLevels = 0;
    let totalCoins = 0;

    for (const ref of references) {
      if (referenceType === 'trainer' && !ref.trainerId) {
        continue;
      }
      if (referenceType === 'monster' && (!ref.trainerId || !ref.monsterName)) {
        continue;
      }
      const levels = ref.customLevels && ref.customLevels > 0 ? ref.customLevels : 6;
      const coins = ref.customLevels && ref.customLevels > 0 ? ref.customLevels * 50 : 200;
      totalLevels += levels;
      totalCoins += coins;
    }

    return {
      levels: totalLevels,
      coins: totalCoins,
      giftLevels: 0,
      cappedLevels: Math.ceil(totalLevels * 0.05),
    };
  }

  async calculatePromptRewards(promptId: number): Promise<unknown> {
    const prompt = await this.promptRepo.findById(promptId);
    if (!prompt) {
      return null;
    }
    return prompt.rewards;
  }

  // ===========================================================================
  // Submission Creation
  // ===========================================================================

  async submitArt(
    data: SubmitArtData,
    userId: string,
    websiteUserId: number,
    _discordUserId: string | null,
    file?: { path: string }
  ): Promise<unknown> {
    const trainers = parseJsonField<unknown[]>(data.trainers, []);
    const monsters = parseJsonField<unknown[]>(data.monsters, []);
    const npcs = parseJsonField<unknown[]>(data.npcs, []);
    const backgrounds = parseJsonField<unknown[]>(data.backgrounds, []);
    const tags = parseJsonField<string[]>(data.tags, []);
    const contentRating = parseJsonField<Record<string, unknown>>(data.contentRating, {});
    const isMature = data.isMature === true || (data.isMature as unknown) === 'true';

    const trainersArray = Array.isArray(trainers) ? trainers : [];
    const monstersArray = Array.isArray(monsters) ? monsters : [];
    const npcsArray = Array.isArray(npcs) ? npcs : [];

    // Upload image
    let imageUrl: string | null = null;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/art' });
      imageUrl = result.secure_url;
    } else if (data.imageUrl) {
      imageUrl = data.imageUrl;
    } else {
      throw new Error('Image file or URL is required');
    }

    // Calculate rewards
    const rewards = await this.rewardService.calculateArtRewards({
      quality: data.quality as ArtSubmissionData['quality'],
      backgroundType: data.backgroundType as ArtSubmissionData['backgroundType'],
      backgrounds: backgrounds as ArtSubmissionData['backgrounds'],
      uniquelyDifficult: data.uniquelyDifficult,
      trainers: trainersArray as ArtSubmissionData['trainers'],
      monsters: monstersArray as ArtSubmissionData['monsters'],
      npcs: npcsArray as ArtSubmissionData['npcs'],
      isGift: data.isGift,
      useStaticRewards: data.useStaticRewards ?? false,
    }, websiteUserId);

    // Create submission
    const firstTrainer = trainersArray[0] as { trainerId?: number } | undefined;
    const input: FullSubmissionCreateInput = {
      userId,
      trainerId: firstTrainer?.trainerId ?? null,
      title: data.title,
      description: data.description ?? null,
      contentType: data.contentType,
      content: imageUrl,
      submissionType: 'art',
      status: 'approved',
      isMature,
      contentRating: JSON.stringify(contentRating),
    };
    const { id: submissionId } = await this.submissionRepo.createSubmission(input);

    // Add image, tags, monsters, trainers
    await this.addSubmissionRelatedRecords(submissionId, imageUrl, null, tags, monstersArray, trainersArray);

    // Add additional images
    if (data.additionalImages && Array.isArray(data.additionalImages)) {
      for (let i = 0; i < data.additionalImages.length; i++) {
        const img = data.additionalImages[i];
        if (img) {
          await this.submissionRepo.addImage(submissionId, img, false, i + 1);
        }
      }
    }

    // Build and store calculator config and reward snapshot
    const calculatorConfig = {
      type: 'art' as const,
      quality: data.quality,
      backgroundType: data.backgroundType,
      backgrounds,
      uniquelyDifficult: data.uniquelyDifficult,
      trainers: trainersArray,
      monsters: monstersArray,
      npcs: npcsArray,
      isGift: data.isGift,
      useStaticRewards: data.useStaticRewards,
    };
    const rewardSnapshot = this.buildRewardSnapshot(rewards.trainerRewards, rewards.monsterRewards);
    await this.submissionRepo.updateCalculatorConfig(submissionId, calculatorConfig, rewardSnapshot);

    const levelCapInfo = await this.rewardService.checkLevelCaps(rewards.monsterRewards || []);

    // Level caps detected — still apply rewards
    if (levelCapInfo.cappedMonsters.length > 0) {
      const appliedRewards = await this.rewardService.applyRewards(rewards, websiteUserId, submissionId);
      return {
        success: true,
        hasLevelCaps: true,
        cappedMonsters: levelCapInfo.cappedMonsters,
        rewards: { ...appliedRewards, totalGiftLevels: rewards.totalGiftLevels },
        submission: { id: submissionId, title: data.title, description: data.description, contentType: data.contentType, submissionType: 'art', status: 'approved', imageUrl },
        message: 'Level caps detected. Please reallocate excess levels before submitting.',
      };
    }

    // Apply rewards (always apply non-gift rewards)
    const appliedRewards = await this.rewardService.applyRewards(rewards, websiteUserId, submissionId);

    // Gift levels detected
    if (rewards.totalGiftLevels && rewards.totalGiftLevels > 0) {
      return {
        success: true,
        hasGiftLevels: true,
        totalGiftLevels: rewards.totalGiftLevels,
        rewards: { ...appliedRewards, totalGiftLevels: rewards.totalGiftLevels },
        submission: { id: submissionId, title: data.title, description: data.description, contentType: data.contentType, submissionType: 'art', status: 'approved', imageUrl },
        message: 'Gift levels detected. Please allocate gift rewards before submitting.',
      };
    }

    return {
      success: true,
      submission: { id: submissionId, title: data.title, description: data.description, contentType: data.contentType, submissionType: 'art', status: 'approved', imageUrl },
      rewards: { ...appliedRewards, totalGiftLevels: rewards.totalGiftLevels },
    };
  }

  async submitWriting(
    data: SubmitWritingData,
    userId: string,
    websiteUserId: number,
    _discordUserId: string | null,
    file?: { path: string }
  ): Promise<unknown> {
    const trainers = parseJsonField<unknown[]>(data.trainers, []);
    const monsters = parseJsonField<unknown[]>(data.monsters, []);
    const npcs = parseJsonField<unknown[]>(data.npcs, []);
    const tags = parseJsonField<string[]>(data.tags, []);
    const contentRating = parseJsonField<Record<string, unknown>>(data.contentRating, {});
    const isMature = data.isMature === true || (data.isMature as unknown) === 'true';

    let trainersArray = Array.isArray(trainers) ? trainers : [];
    const monstersArray = Array.isArray(monsters) ? monsters : [];
    const npcsArray = Array.isArray(npcs) ? npcs : [];

    // Legacy support
    if (trainersArray.length === 0 && monstersArray.length === 0 && data.trainerId) {
      trainersArray = [{ trainerId: data.trainerId, isOwned: true, isGift: data.isGift ?? false }];
    }

    // Upload cover image
    let coverImageUrl: string | null = null;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/writing/covers' });
      coverImageUrl = result.secure_url;
    } else if (data.coverImageUrl) {
      coverImageUrl = data.coverImageUrl;
    }

    // Calculate rewards
    const rewards = await this.rewardService.calculateWritingRewards({
      wordCount: data.wordCount,
      trainers: trainersArray as WritingSubmissionData['trainers'],
      monsters: monstersArray as WritingSubmissionData['monsters'],
      npcs: npcsArray as WritingSubmissionData['npcs'],
    }, websiteUserId);

    const levelCapInfo = await this.rewardService.checkLevelCaps(rewards.monsterRewards || []);

    // Chapter handling
    let chapterNumber = data.chapterNumber ?? null;
    if (data.parentId) {
      const parentSubmission = await this.submissionRepo.findById(data.parentId);
      if (!parentSubmission) {
        throw new Error('Parent book not found');
      }
      if (!parentSubmission.isBook) {
        throw new Error('Parent submission is not a book');
      }

      const isOwner = String(parentSubmission.userId) === userId;
      let isEditorCollaborator = false;
      if (!isOwner) {
        const role = await this.submissionRepo.findCollaboratorRole(data.parentId, userId);
        isEditorCollaborator = role === 'editor';
      }
      if (!isOwner && !isEditorCollaborator) {
        throw new Error('You do not have permission to add chapters to this book');
      }

      if (!chapterNumber) {
        const maxChapter = await this.submissionRepo.getMaxChapterNumber(data.parentId);
        chapterNumber = maxChapter + 1;
      }
    }

    const firstTrainer = trainersArray[0] as { trainerId?: number } | undefined;
    const { id: submissionId } = await this.submissionRepo.createSubmission({
      userId,
      trainerId: firstTrainer?.trainerId ?? null,
      title: data.title,
      description: data.description ?? null,
      contentType: data.contentType,
      content: data.content,
      submissionType: 'writing',
      status: 'approved',
      isBook: data.isBook ?? false,
      parentId: data.parentId ?? null,
      chapterNumber,
      isMature,
      contentRating: JSON.stringify(contentRating),
    });

    await this.addSubmissionRelatedRecords(submissionId, null, coverImageUrl, tags, monstersArray, trainersArray);

    // Build and store calculator config and reward snapshot
    const calculatorConfig = {
      type: 'writing' as const,
      wordCount: data.wordCount,
      trainers: trainersArray,
      monsters: monstersArray,
      npcs: npcsArray,
      isGift: data.isGift,
    };
    const rewardSnapshot = this.buildRewardSnapshot(rewards.trainerRewards, rewards.monsterRewards);
    await this.submissionRepo.updateCalculatorConfig(submissionId, calculatorConfig, rewardSnapshot);

    // Apply rewards (always apply non-gift rewards)
    const appliedRewards = await this.rewardService.applyRewards(rewards, websiteUserId, submissionId);

    if (levelCapInfo.cappedMonsters.length > 0) {
      return {
        success: true,
        hasLevelCaps: true,
        cappedMonsters: levelCapInfo.cappedMonsters,
        rewards: { ...appliedRewards, totalGiftLevels: rewards.totalGiftLevels },
        submission: { id: submissionId, title: data.title, description: data.description, contentType: data.contentType, submissionType: 'writing', status: 'approved', coverImageUrl },
        message: 'Level caps detected. Please reallocate excess levels before submitting.',
      };
    }

    if (rewards.totalGiftLevels && rewards.totalGiftLevels > 0) {
      return {
        success: true,
        hasGiftLevels: true,
        totalGiftLevels: rewards.totalGiftLevels,
        rewards: { ...appliedRewards, totalGiftLevels: rewards.totalGiftLevels },
        submission: { id: submissionId, title: data.title, description: data.description, contentType: data.contentType, submissionType: 'writing', status: 'approved', coverImageUrl },
        message: 'Gift levels detected. Please allocate gift rewards before submitting.',
      };
    }

    return {
      success: true,
      submission: { id: submissionId, title: data.title, description: data.description, contentType: data.contentType, submissionType: 'writing', status: 'approved', coverImageUrl },
      rewards: { ...appliedRewards, totalGiftLevels: rewards.totalGiftLevels },
    };
  }

  // ===========================================================================
  // Calculator Config Helpers
  // ===========================================================================

  private buildRewardSnapshot(
    trainerRewards: TrainerReward[],
    monsterRewards: MonsterReward[]
  ): RewardSnapshotEntry[] {
    const entries: RewardSnapshotEntry[] = [];
    for (const tr of trainerRewards) {
      entries.push({
        id: tr.trainerId,
        name: tr.trainerName,
        type: 'trainer',
        levels: tr.levels,
        coins: tr.coins,
        cappedLevels: tr.cappedLevels,
      });
    }
    for (const mr of monsterRewards) {
      entries.push({
        id: mr.monsterId,
        name: mr.name,
        type: 'monster',
        levels: mr.levels,
        coins: mr.coins,
        cappedLevels: mr.cappedLevels,
      });
    }
    return entries;
  }

  async getLevelBreakdown(submissionId: number): Promise<{
    calculatorConfig: unknown | null;
    rewardSnapshot: unknown | null;
  }> {
    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    return {
      calculatorConfig: submission.calculatorConfig,
      rewardSnapshot: submission.rewardSnapshot,
    };
  }

  // ===========================================================================
  // Edit Participants
  // ===========================================================================

  async editParticipants(
    submissionId: number,
    userId: string,
    websiteUserId: number,
    newCalculatorConfig: Record<string, unknown>
  ): Promise<{
    success: boolean;
    rewardSnapshot: RewardSnapshotEntry[];
    deltas: Array<{ type: string; id: number; name?: string; levelDelta: number; coinDelta: number }>;
  }> {
    // 1. Validate ownership
    const ownership = await this.submissionRepo.findByIdForOwnership(submissionId);
    if (!ownership) {
      throw new Error('Submission not found');
    }

    const isOwner = String(ownership.user_id) === userId
      || (ownership.user_discord_id && String(ownership.user_discord_id) === userId);
    if (!isOwner) {
      throw new Error('Not authorized to edit this submission');
    }

    // 2. Validate submission type (only art/writing, not external/reference)
    if (ownership.submission_type !== 'art' && ownership.submission_type !== 'writing') {
      throw new Error('Can only edit participants on art or writing submissions');
    }

    // 3. Get old reward snapshot
    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (!submission.rewardSnapshot) {
      throw new Error('This submission has no reward snapshot (old submission). Cannot edit participants.');
    }

    const oldSnapshot = (Array.isArray(submission.rewardSnapshot)
      ? submission.rewardSnapshot
      : []) as RewardSnapshotEntry[];

    // 4. Recalculate rewards from new config
    const configType = newCalculatorConfig.type as string;
    let newTrainerRewards: TrainerReward[] = [];
    let newMonsterRewards: MonsterReward[] = [];

    if (configType === 'art') {
      const rewards = await this.rewardService.calculateArtRewards({
        quality: newCalculatorConfig.quality as ArtSubmissionData['quality'],
        backgroundType: newCalculatorConfig.backgroundType as ArtSubmissionData['backgroundType'],
        backgrounds: (newCalculatorConfig.backgrounds ?? []) as ArtSubmissionData['backgrounds'],
        uniquelyDifficult: newCalculatorConfig.uniquelyDifficult as boolean,
        trainers: (newCalculatorConfig.trainers ?? []) as ArtSubmissionData['trainers'],
        monsters: (newCalculatorConfig.monsters ?? []) as ArtSubmissionData['monsters'],
        npcs: (newCalculatorConfig.npcs ?? []) as ArtSubmissionData['npcs'],
        isGift: newCalculatorConfig.isGift as boolean,
        useStaticRewards: newCalculatorConfig.useStaticRewards as boolean,
      }, websiteUserId);
      newTrainerRewards = rewards.trainerRewards;
      newMonsterRewards = rewards.monsterRewards;
    } else if (configType === 'writing') {
      const rewards = await this.rewardService.calculateWritingRewards({
        wordCount: newCalculatorConfig.wordCount as number,
        trainers: (newCalculatorConfig.trainers ?? []) as WritingSubmissionData['trainers'],
        monsters: (newCalculatorConfig.monsters ?? []) as WritingSubmissionData['monsters'],
        npcs: (newCalculatorConfig.npcs ?? []) as WritingSubmissionData['npcs'],
      }, websiteUserId);
      newTrainerRewards = rewards.trainerRewards;
      newMonsterRewards = rewards.monsterRewards;
    } else {
      throw new Error('Invalid calculator config type');
    }

    const newSnapshot = this.buildRewardSnapshot(newTrainerRewards, newMonsterRewards);

    // 5. Compute per-entity deltas (old vs new)
    const oldByKey = new Map(oldSnapshot.map(e => [`${e.type}-${e.id}`, e]));
    const newByKey = new Map(newSnapshot.map(e => [`${e.type}-${e.id}`, e]));

    // All entity keys (union of old + new)
    const allKeys = new Set([...oldByKey.keys(), ...newByKey.keys()]);
    const deltas: Array<{ type: string; id: number; name?: string; levelDelta: number; coinDelta: number }> = [];

    // 6. Apply deltas
    for (const key of allKeys) {
      const old = oldByKey.get(key);
      const cur = newByKey.get(key);

      const oldLevels = old?.levels ?? 0;
      const newLevels = cur?.levels ?? 0;
      const levelDelta = newLevels - oldLevels;

      const oldCoins = old?.coins ?? 0;
      const newCoins = cur?.coins ?? 0;
      const coinDelta = newCoins - oldCoins;

      const entityType = (cur?.type ?? old?.type) as string;
      const entityId = (cur?.id ?? old?.id) as number;
      const entityName = cur?.name ?? old?.name;

      if (levelDelta !== 0 || coinDelta !== 0) {
        deltas.push({ type: entityType, id: entityId, name: entityName, levelDelta, coinDelta });
      }

      // Apply level changes
      if (levelDelta > 0) {
        if (entityType === 'monster') {
          await this.monsterInitService.levelUpMonster(entityId, levelDelta);
        } else {
          await this.trainerRepo.addLevels(entityId, levelDelta);
        }
      } else if (levelDelta < 0) {
        const absDelta = Math.abs(levelDelta);
        if (entityType === 'monster') {
          await this.monsterRepo.subtractLevels(entityId, absDelta);
          await this.monsterInitService.recalculateStats(entityId);
        } else {
          await this.trainerRepo.subtractLevels(entityId, absDelta);
        }
      }

      // Apply coin changes
      if (coinDelta !== 0) {
        const trainerId = entityType === 'trainer'
          ? entityId
          : cur?.id ? (await this.monsterRepo.findById(cur.id))?.trainer_id : undefined;

        if (trainerId) {
          if (coinDelta > 0) {
            await this.trainerRepo.updateCurrency(trainerId, coinDelta);
          } else {
            // Subtract coins, clamp at 0
            await db.query(
              'UPDATE trainers SET currency_amount = GREATEST(currency_amount + $1, 0) WHERE id = $2',
              [coinDelta, trainerId]
            );
          }
        }
      }
    }

    // 7. Update calculator_config, reward_snapshot, and junction tables
    await this.submissionRepo.updateCalculatorConfig(submissionId, newCalculatorConfig, newSnapshot);

    // Update monster/trainer links
    const newMonsterIds = newMonsterRewards.map(m => m.monsterId).filter(Boolean);
    const newTrainerIds = newTrainerRewards.map(t => t.trainerId).filter(Boolean);
    await this.submissionRepo.replaceMonsterLinks(submissionId, newMonsterIds);
    await this.submissionRepo.replaceTrainerLinks(submissionId, newTrainerIds);

    return {
      success: true,
      rewardSnapshot: newSnapshot,
      deltas,
    };
  }

  async submitReference(
    data: SubmitReferenceData,
    userId: string,
    websiteUserId: number,
    _discordUserId: string | null
  ): Promise<unknown> {
    const { referenceType, body, files } = data;

    const references: Array<Record<string, unknown>> = [];
    const totalRewards = { levels: 0, coins: 0, giftLevels: 0, cappedLevels: 0 };

    const referenceCount = Object.keys(body)
      .filter(key => String(key).startsWith('trainerId_'))
      .length;

    for (let i = 0; i < referenceCount; i++) {
      const trainerId = body[`trainerId_${i}`] as string | undefined;
      if (!trainerId) {
        continue;
      }

      // Check gift status
      let isGift = false;
      const playerUserId = await this.submissionRepo.findPlayerUserId(parseInt(trainerId));
      if (playerUserId && playerUserId !== userId) {
        isGift = true;
      }

      const reference: Record<string, unknown> = {
        trainerId: parseInt(trainerId),
        referenceType,
        isGift,
      };

      if (referenceType === 'monster' || referenceType === 'mega image') {
        reference.monsterName = body[`monsterName_${i}`];
        if (!reference.monsterName) {
          continue;
        }
        if (referenceType === 'monster') {
          reference.instanceCount = parseInt(String(body[`instanceCount_${i}`] ?? '1'));
          reference.sameAppearanceForEachInstance = body[`sameAppearanceForEachInstance_${i}`] === 'true';
          if (!reference.sameAppearanceForEachInstance) {
            reference.instanceAppearances = [];
            const appearanceKeys = Object.keys(body).filter(key => key.startsWith(`instanceAppearance_${i}_`) && key.endsWith('_type'));
            for (const key of appearanceKeys) {
              const instanceIndex = key.split('_')[2];
              (reference.instanceAppearances as unknown[]).push({
                instanceNumber: parseInt(String(body[`instanceAppearance_${i}_${instanceIndex}_instanceNumber`])),
                type: body[`instanceAppearance_${i}_${instanceIndex}_type`],
              });
            }
          }
        }
      }

      if (referenceType === 'trainer mega') {
        reference.megaArtist = body[`megaArtist_${i}`] ?? '';
        reference.megaSpecies1 = body[`megaSpecies1_${i}`] ?? '';
        reference.megaSpecies2 = body[`megaSpecies2_${i}`] ?? '';
        reference.megaSpecies3 = body[`megaSpecies3_${i}`] ?? '';
        reference.megaType1 = body[`megaType1_${i}`] ?? '';
        reference.megaType2 = body[`megaType2_${i}`] ?? '';
        reference.megaType3 = body[`megaType3_${i}`] ?? '';
        reference.megaType4 = body[`megaType4_${i}`] ?? '';
        reference.megaType5 = body[`megaType5_${i}`] ?? '';
        reference.megaType6 = body[`megaType6_${i}`] ?? '';
        reference.megaAbility = body[`megaAbility_${i}`] ?? '';
      }

      // Reference URL
      if (body[`referenceUrl_${i}`]) {
        reference.referenceUrl = body[`referenceUrl_${i}`];
      } else if (files && files.length > 0) {
        const referenceFile = files.find(f => f.fieldname === `referenceFile_${i}`);
        if (referenceFile) {
          const result = await cloudinary.uploader.upload(referenceFile.path, {
            folder: `submissions/references/${referenceType}`,
          });
          reference.referenceUrl = result.secure_url;
        }
      }

      if (!reference.referenceUrl) {
        continue;
      }

      if (body[`customLevels_${i}`]) {
        reference.customLevels = parseInt(String(body[`customLevels_${i}`]));
      }

      // Calculate reference rewards
      const customLevels = reference.customLevels as number | undefined;
      let refLevels = 6;
      let refCoins = 200;
      if (referenceType === 'trainer mega') {
        refLevels = customLevels ?? 9;
        refCoins = customLevels ? customLevels * 50 : 200;
      } else {
        refLevels = customLevels ?? 6;
        refCoins = customLevels ? customLevels * 50 : 200;
      }

      // Apply reference-specific side effects
      await this.applyReferenceSideEffects(reference, referenceType);

      totalRewards.levels += refLevels;
      totalRewards.coins += refCoins;
      if (isGift) {
        totalRewards.giftLevels += refLevels;
      }

      references.push({ ...reference, rewards: { levels: refLevels, coins: refCoins } });
    }

    if (references.length === 0) {
      throw new Error('No valid references provided');
    }

    totalRewards.cappedLevels = Math.ceil(totalRewards.levels * 0.05);

    // Create submission
    const { id: submissionId } = await this.submissionRepo.createSubmission({
      userId,
      title: `${referenceType.charAt(0).toUpperCase() + referenceType.slice(1)} Reference`,
      description: `Reference for ${references.length} ${referenceType}(s)`,
      contentType: referenceType,
      submissionType: 'reference',
      status: 'approved',
    });

    // Add submission references
    for (const ref of references) {
      await this.submissionRepo.addReference(submissionId, {
        referenceType,
        trainerId: ref.trainerId as number,
        monsterName: (ref.monsterName as string) ?? null,
        referenceUrl: ref.referenceUrl as string,
        instanceCount: (ref.instanceCount as number) ?? 1,
      });
    }

    // Build structured rewards for level cap checking
    const monsterRewards: MonsterReward[] = [];
    const trainerRewards: TrainerReward[] = [];

    for (const ref of references) {
      const refRewards = ref.rewards as { levels: number; coins: number };
      if (ref.monsterName && ref.trainerId) {
        const monster = await this.monsterRepo.findByTrainerAndName(ref.trainerId as number, String(ref.monsterName));
        if (monster) {
          monsterRewards.push({
            monsterId: monster.id,
            name: String(ref.monsterName),
            trainerId: ref.trainerId as number,
            levels: refRewards.levels,
            coins: refRewards.coins,
            cappedLevels: 0,
            isGift: false,
            isTrainerOwned: true,
          });
        }
      } else if (ref.trainerId) {
        trainerRewards.push({
          trainerId: ref.trainerId as number,
          levels: refRewards.levels,
          coins: refRewards.coins,
          cappedLevels: 0,
          isGift: false,
          isOwned: true,
        });
      }
    }

    // Check level caps
    let levelCapInfo: LevelCapResult = { cappedMonsters: [], adjustedRewards: [] };
    if (monsterRewards.length > 0) {
      levelCapInfo = await this.rewardService.checkLevelCaps(monsterRewards);
    }

    if (levelCapInfo.cappedMonsters.length > 0) {
      return {
        success: true,
        hasLevelCaps: true,
        cappedMonsters: levelCapInfo.cappedMonsters,
        rewards: { monsterRewards, trainerRewards, ...totalRewards },
        submission: { id: submissionId, title: `${referenceType.charAt(0).toUpperCase() + referenceType.slice(1)} Reference`, references },
        message: 'Level caps detected. Please reallocate excess levels before submitting.',
      };
    }

    // Build structured rewards
    // Calculate bonuses: totalLevels / rand(2-4) + rand(1-4), each independently
    const structuredRewards = {
      trainerRewards,
      monsterRewards,
      gardenPoints: Math.floor(totalRewards.levels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1,
      missionProgress: Math.floor(totalRewards.levels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1,
      bossDamage: Math.floor(totalRewards.levels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1,
    };

    // Handle gift levels
    if (totalRewards.giftLevels > 0) {
      const giftItems = await this.generateGiftItems(Math.floor(totalRewards.giftLevels / 5));
      const giftMonsters = await this.generateGiftMonsters(Math.floor(totalRewards.giftLevels / 10));

      const appliedRewards = await this.rewardService.applyRewards(
        structuredRewards as unknown as ArtRewardResult,
        websiteUserId,
        submissionId
      );

      return {
        success: true,
        hasGiftLevels: true,
        totalGiftLevels: totalRewards.giftLevels,
        rewards: { ...appliedRewards, totalGiftLevels: totalRewards.giftLevels, giftItems, giftMonsters },
        submission: { id: submissionId, references },
        message: 'Gift levels detected. Please allocate your gift level rewards.',
      };
    }

    const appliedRewards = await this.rewardService.applyRewards(
      structuredRewards as unknown as ArtRewardResult,
      websiteUserId,
      submissionId
    );

    return {
      success: true,
      submission: { id: submissionId, references },
      rewards: appliedRewards,
    };
  }

  async submitPrompt(
    data: SubmitPromptData,
    _userId: string,
    _websiteUserId: number,
    file?: { path: string }
  ): Promise<unknown> {
    // Get prompt
    const prompt = await this.promptRepo.findById(data.promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Get trainer and verify ownership
    const trainer = await this.trainerRepo.findById(data.trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Upload submission file
    let submissionUrl: string | null = null;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/prompts' });
      submissionUrl = result.secure_url;
    } else if (data.submissionUrl) {
      submissionUrl = data.submissionUrl;
    } else {
      throw new Error('Submission file or URL is required');
    }

    // Create prompt submission
    const { id: submissionId } = await this.promptSubmissionRepo.createPromptSubmission({
      promptId: data.promptId,
      trainerId: data.trainerId,
      submissionContent: submissionUrl,
      submissionNotes: `Prompt submission for: ${prompt.title}`,
      status: 'approved',
    });

    // Apply prompt rewards
    const rawRewardConfig = prompt.rewards ?? {};
    const rewardConfig = (typeof rawRewardConfig === 'string' ? JSON.parse(rawRewardConfig) : rawRewardConfig) as Record<string, unknown>;
    const userSettings = await this.getUserSettingsForTrainer(data.trainerId);
    const appliedRewards = await this.applyPromptRewards(data.trainerId, rewardConfig, submissionId, userSettings);

    await this.promptSubmissionRepo.updateRewardsGranted(submissionId, JSON.stringify(appliedRewards));

    return {
      success: true,
      submission: { id: submissionId, prompt_id: data.promptId, trainer_id: data.trainerId, submission_content: submissionUrl, status: 'approved' },
      rewards: appliedRewards,
      message: 'Prompt submitted successfully and rewards have been applied!',
    };
  }

  async submitPromptCombined(
    data: SubmitPromptCombinedData,
    userId: string,
    websiteUserId: number,
    _discordUserId: string | null,
    file?: { path: string }
  ): Promise<unknown> {
    const trainers = parseJsonField<unknown[]>(data.trainers, []);
    const monsters = parseJsonField<unknown[]>(data.monsters, []);
    const npcs = parseJsonField<unknown[]>(data.npcs, []);
    const backgrounds = parseJsonField<unknown[]>(data.backgrounds, []);
    const tags = parseJsonField<string[]>(data.tags, []);
    const contentRating = parseJsonField<Record<string, unknown>>(data.contentRating, {});
    const isMature = data.isMature === true || (data.isMature as unknown) === 'true';

    const trainersArray = Array.isArray(trainers) ? trainers : [];
    const monstersArray = Array.isArray(monsters) ? monsters : [];
    const npcsArray = Array.isArray(npcs) ? npcs : [];

    // Get prompt
    const prompt = await this.promptRepo.findById(data.promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Verify trainer ownership
    const trainer = await this.trainerRepo.findById(data.trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    let imageUrl: string | null = null;
    let artWritingRewards: ArtRewardResult | WritingRewardResult;
    let submissionId: number;

    if (data.submissionType === 'art') {
      if (file) {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/art' });
        imageUrl = result.secure_url;
      } else if (data.imageUrl) {
        imageUrl = data.imageUrl;
      } else {
        throw new Error('Image file or URL is required for art submissions');
      }

      artWritingRewards = await this.rewardService.calculateArtRewards({
        quality: data.quality as ArtSubmissionData['quality'],
        backgrounds: (backgrounds || []) as ArtSubmissionData['backgrounds'],
        uniquelyDifficult: data.uniquelyDifficult,
        trainers: trainersArray as ArtSubmissionData['trainers'],
        monsters: monstersArray as ArtSubmissionData['monsters'],
        npcs: npcsArray as ArtSubmissionData['npcs'],
        isGift: false,
        useStaticRewards: false,
      }, websiteUserId);

      const trainerId = trainersArray.length > 0 ? (trainersArray[0] as { trainerId: number }).trainerId : data.trainerId;
      const { id } = await this.submissionRepo.createSubmission({
        userId,
        trainerId,
        title: data.title ?? '',
        description: data.description ?? null,
        contentType: data.contentType ?? 'prompt',
        content: imageUrl,
        submissionType: 'art',
        status: 'approved',
        isMature,
        contentRating: JSON.stringify(contentRating),
      });
      submissionId = id;

      if (imageUrl) {
        await this.submissionRepo.addImage(submissionId, imageUrl, true);
      }
      await this.addMonstersAndTrainers(submissionId, monstersArray, trainersArray);
    } else if (data.submissionType === 'writing') {
      artWritingRewards = await this.rewardService.calculateWritingRewards({
        wordCount: data.wordCount ?? 0,
        trainers: trainersArray as WritingSubmissionData['trainers'],
        monsters: monstersArray as WritingSubmissionData['monsters'],
        npcs: npcsArray as WritingSubmissionData['npcs'],
      }, websiteUserId);

      const trainerId = trainersArray.length > 0 ? (trainersArray[0] as { trainerId: number }).trainerId : data.trainerId;
      const { id } = await this.submissionRepo.createSubmission({
        userId,
        trainerId,
        title: data.title ?? '',
        description: data.description ?? null,
        contentType: data.contentType ?? 'prompt',
        content: data.content ?? null,
        submissionType: 'writing',
        status: 'approved',
        isMature,
        contentRating: JSON.stringify(contentRating),
      });
      submissionId = id;
      await this.addMonstersAndTrainers(submissionId, monstersArray, trainersArray);
    } else {
      throw new Error('Invalid submission type. Must be "art" or "writing".');
    }

    // Add tags including prompt name
    const allTags = [...new Set([...tags, String(prompt.title), 'prompt'])];
    await this.submissionRepo.addTags(submissionId, allTags);

    // Generate prompt rewards preview
    const rawRewards = prompt.rewards ?? {};
    const promptRewardConfig = (typeof rawRewards === 'string' ? JSON.parse(rawRewards) : rawRewards) as Record<string, unknown>;
    const promptRewardsPreview = await this.buildPromptRewardsPreview(promptRewardConfig);

    // Create prompt_submission record
    const { id: promptSubmissionId } = await this.promptSubmissionRepo.createPromptSubmission({
      promptId: data.promptId,
      trainerId: data.trainerId,
      submissionContent: imageUrl ?? data.content ?? null,
      submissionNotes: `Combined prompt submission for: ${prompt.title}`,
      status: 'approved',
      submissionId,
      rewardsGranted: JSON.stringify({ ...promptRewardsPreview, applied: false }),
    });

    // Store calculator config and reward snapshot
    const calculatorConfig = data.submissionType === 'art'
      ? { type: 'art' as const, quality: data.quality, backgrounds, uniquelyDifficult: data.uniquelyDifficult, trainers: trainersArray, monsters: monstersArray, npcs: npcsArray, promptId: data.promptId }
      : { type: 'writing' as const, wordCount: data.wordCount, trainers: trainersArray, monsters: monstersArray, npcs: npcsArray, promptId: data.promptId };
    const rewardSnapshot = this.buildRewardSnapshot(artWritingRewards.trainerRewards, artWritingRewards.monsterRewards);
    await this.submissionRepo.updateCalculatorConfig(submissionId, calculatorConfig, rewardSnapshot);

    const levelCapInfo = await this.rewardService.checkLevelCaps(artWritingRewards.monsterRewards || []);
    const appliedArtWritingRewards = await this.rewardService.applyRewards(artWritingRewards, websiteUserId, submissionId);

    return {
      success: true,
      submission: { id: submissionId, title: data.title, submissionType: data.submissionType, status: 'approved', imageUrl },
      promptSubmission: { id: promptSubmissionId, prompt_id: data.promptId, trainer_id: data.trainerId },
      artWritingRewards: { ...appliedArtWritingRewards, totalGiftLevels: artWritingRewards.totalGiftLevels },
      promptRewards: promptRewardsPreview,
      hasLevelCaps: levelCapInfo.cappedMonsters.length > 0,
      cappedMonsters: levelCapInfo.cappedMonsters,
      hasGiftLevels: artWritingRewards.totalGiftLevels > 0,
      message: 'Submission created successfully! Art/Writing rewards applied. Please claim your prompt rewards.',
    };
  }

  // ===========================================================================
  // Reward Allocation / Claiming
  // ===========================================================================

  async allocateGiftLevels(submissionId: number, recipientType: 'trainer' | 'monster', recipientId: number, levels: number) {
    return this.rewardService.allocateGiftLevels(submissionId, recipientType, recipientId, levels);
  }

  async allocateGiftCoins(submissionId: number, trainerId: number, coins: number) {
    return this.rewardService.allocateGiftCoins(submissionId, trainerId, coins);
  }

  async allocateCappedLevels(submissionId: number, recipientType: 'trainer' | 'monster', recipientId: number, levels: number) {
    return this.rewardService.allocateCappedLevels(submissionId, recipientType, recipientId, levels);
  }

  async allocateGiftItem(itemId: number, trainerId: number): Promise<{ success: boolean }> {
    const item = await this.submissionRepo.findUnclaimedGiftItem(itemId);
    if (!item) {
      throw new Error('Gift item not found or already claimed');
    }
    await this.inventoryRepo.addItem(trainerId, item.item_category as InventoryCategory, item.item_name, item.quantity);
    await this.submissionRepo.claimGiftItem(itemId, trainerId);
    return { success: true };
  }

  async generateGiftItems(count: number): Promise<RolledItem[]> {
    if (count < 1) {
      return [];
    }
    const items: RolledItem[] = [];
    const categories: ItemRollOptions['category'][] = ['berries', 'pastries', 'evolution', 'balls', 'antiques', 'helditems'];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      try {
        const rolledItem = await ItemRollerService.rollOne({ category: randomCategory });
        if (rolledItem) {
          items.push(rolledItem);
        }
      } catch {
        // Skip failed rolls
      }
    }
    return items;
  }

  async generateGiftMonsters(count: number, userSettings?: UserSettings): Promise<RolledMonster[]> {
    if (count < 1) {
      return [];
    }
    const rolledMonsters: RolledMonster[] = [];
    const defaultParams: Partial<RollParams> = {
      tables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals'] as MonsterTable[],
      includeStages: ['Base Stage', "Doesn't Evolve"],
      legendary: false,
      mythical: false,
      includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
      species_max: 2,
      types_max: 3,
      includeAttributes: ['Virus', 'Vaccine', 'Data', 'Free', 'Variable'],
    };

    for (let i = 0; i < Math.min(count, 10); i++) {
      try {
        const roller = new MonsterRollerService({
          seed: `gift-reward-${Date.now()}-${i}`,
          enabledTables: defaultParams.tables,
          userSettings,
        });
        const monster = await roller.rollMonster(defaultParams as RollParams);
        if (monster) {
          rolledMonsters.push(monster);
        }
      } catch {
        // Skip failed rolls
      }
    }
    return rolledMonsters;
  }

  async finalizeGiftRewards(
    levelAllocations: Array<{ type: string; entityId: number; levels: number }>,
    itemAssignments: Array<{ trainerId: number; item: { name: string; category: string; quantity?: number } }>,
    monsterAssignments: Array<{ trainerId: number; name: string; monster: Record<string, unknown> }>
  ): Promise<{ levelsAllocated: number; itemsAwarded: number; monstersAwarded: number }> {
    // Process levels
    for (const alloc of levelAllocations) {
      if (alloc.type === 'trainer') {
        await this.trainerRepo.addLevels(alloc.entityId, alloc.levels);
      } else if (alloc.type === 'monster') {
        await this.monsterInitService.levelUpMonster(alloc.entityId, alloc.levels);
      }
    }

    // Process items
    for (const assignment of itemAssignments) {
      const category = (assignment.item.category ? String(assignment.item.category).toLowerCase() : 'items') as InventoryCategory;
      await this.inventoryRepo.addItem(assignment.trainerId, category, assignment.item.name, assignment.item.quantity ?? 1);
    }

    // Process monsters
    for (const assignment of monsterAssignments) {
      // Look up the trainer's player_user_id so the monster belongs to the correct player
      const trainer = await this.trainerRepo.findById(assignment.trainerId);
      const playerUserId = trainer?.player_user_id ?? null;

      const monsterData: Partial<MonsterData> = {
        ...assignment.monster,
        name: assignment.name,
        trainer_id: assignment.trainerId,
        level: 1,
        where_met: 'Gift Reward',
      };
      const initialized = await this.monsterInitService.initializeMonster(monsterData as MonsterData);

      const created = await this.monsterRepo.create({
        trainerId: assignment.trainerId,
        playerUserId: playerUserId ?? undefined,
        name: initialized.name ?? assignment.name,
        species1: initialized.species1 ?? (monsterData.species1 as string) ?? '',
        species2: initialized.species2 as string | undefined,
        species3: initialized.species3 as string | undefined,
        type1: initialized.type1 ?? '' as never,
        type2: initialized.type2 as never,
        type3: initialized.type3 as never,
        type4: initialized.type4 as never,
        type5: initialized.type5 as never,
        attribute: initialized.attribute as never,
        level: initialized.level,
        hpTotal: initialized.hp_total,
        hpIv: initialized.hp_iv,
        hpEv: initialized.hp_ev,
        atkTotal: initialized.atk_total,
        atkIv: initialized.atk_iv,
        atkEv: initialized.atk_ev,
        defTotal: initialized.def_total,
        defIv: initialized.def_iv,
        defEv: initialized.def_ev,
        spaTotal: initialized.spa_total,
        spaIv: initialized.spa_iv,
        spaEv: initialized.spa_ev,
        spdTotal: initialized.spd_total,
        spdIv: initialized.spd_iv,
        spdEv: initialized.spd_ev,
        speTotal: initialized.spe_total,
        speIv: initialized.spe_iv,
        speEv: initialized.spe_ev,
        nature: initialized.nature,
        characteristic: initialized.characteristic,
        gender: initialized.gender as never,
        friendship: initialized.friendship,
        ability1: initialized.ability1,
        ability2: initialized.ability2,
        moveset: typeof initialized.moveset === 'string'
          ? JSON.parse(initialized.moveset)
          : Array.isArray(initialized.moveset)
            ? initialized.moveset
            : [],
        whereMet: 'Gift Reward',
      });

      // Initialize the created monster in the database with full stats/moves
      if (created?.id) {
        await this.monsterInitService.initializeMonster(created.id);
      }
    }

    return {
      levelsAllocated: levelAllocations.reduce((sum, a) => sum + a.levels, 0),
      itemsAwarded: itemAssignments.length,
      monstersAwarded: monsterAssignments.length,
    };
  }

  async claimPromptRewards(
    promptSubmissionId: number,
    levelTarget: string | null,
    targetMonsterId: number | null,
    claimItems: boolean,
    _userId: string
  ): Promise<unknown> {
    const submission = await this.promptSubmissionRepo.findRawById(promptSubmissionId);
    if (!submission) {
      throw new Error('Prompt submission not found');
    }

    const rewards = typeof submission.rewards_granted === 'string'
      ? JSON.parse(submission.rewards_granted)
      : submission.rewards_granted ?? {};

    if (rewards.applied) {
      throw new Error('Prompt rewards have already been claimed');
    }

    const appliedRewards: Record<string, unknown> = {
      levels: 0,
      levelTarget: levelTarget ?? 'trainer',
      coins: 0,
      items: [],
      trainer_id: submission.trainer_id,
    };

    // Apply levels
    if (rewards.levels && rewards.levels > 0) {
      if (levelTarget === 'monster' && targetMonsterId) {
        const monster = await this.monsterRepo.findById(targetMonsterId);
        if (monster) {
          await this.monsterInitService.levelUpMonster(targetMonsterId, rewards.levels);
          appliedRewards.levels = rewards.levels;
          appliedRewards.levelTargetName = monster.name;
        } else {
          await this.trainerRepo.addLevels(submission.trainer_id, rewards.levels);
          appliedRewards.levels = rewards.levels;
          appliedRewards.levelTarget = 'trainer';
        }
      } else {
        await this.trainerRepo.addLevels(submission.trainer_id, rewards.levels);
        appliedRewards.levels = rewards.levels;
      }
    }

    // Apply coins
    if (rewards.coins && rewards.coins > 0) {
      await this.trainerRepo.updateCurrency(submission.trainer_id, rewards.coins);
      appliedRewards.coins = rewards.coins;
    }

    // Apply items
    if (claimItems && rewards.items && Array.isArray(rewards.items)) {
      const appliedItems: unknown[] = [];
      for (const item of rewards.items) {
        const appliedItem = await this.applyItemReward(submission.trainer_id, item);
        if (appliedItem) {
          appliedItems.push(appliedItem);
        }
      }
      appliedRewards.items = appliedItems;
    }

    // Mark as applied
    rewards.applied = true;
    rewards.appliedAt = new Date().toISOString();
    rewards.appliedDetails = appliedRewards;

    await this.promptSubmissionRepo.updateRewardsGranted(promptSubmissionId, JSON.stringify(rewards));

    return {
      appliedRewards,
      unclaimedMonsters: rewards.monsters ? (rewards.monsters as unknown[]).filter((m: unknown) => !(m as { claimed: boolean }).claimed) : [],
    };
  }

  // ===========================================================================
  // Rerolls / Claims
  // ===========================================================================

  async rerollSubmissionItems(submissionId: number, trainerId: number): Promise<{ newItems: unknown[] }> {
    const submissionRow = await this.promptSubmissionRepo.findRawById(submissionId);
    if (!submissionRow) {
      throw new Error('Submission not found');
    }

    const promptRow = await this.promptRepo.findById(submissionRow.prompt_id);
    if (!promptRow) {
      throw new Error('Original prompt not found');
    }

    const rewardConfig = (promptRow.rewards ?? {}) as Record<string, unknown>;
    const items = rewardConfig.items as Array<Record<string, unknown>> | undefined;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const hasRandomItems = items?.some(item => item.is_random_from_category || item.is_random_from_set);
    if (!hasRandomItems || !items) {
      throw new Error('This prompt does not have random items that can be rerolled');
    }

    const hasForgetMeNot = await this.specialBerryService.hasSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      throw new Error('Trainer does not have any Forget-Me-Not berries');
    }

    const berryConsumed = await this.specialBerryService.consumeSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!berryConsumed) {
      throw new Error('Failed to consume Forget-Me-Not berry');
    }

    const newItems: unknown[] = [];
    for (const item of items) {
      if (item.is_random_from_category || item.is_random_from_set) {
        const rerolledItem = await this.applyItemReward(trainerId, item);
        if (rerolledItem) {
          newItems.push(rerolledItem);
        }
      }
    }

    const currentRewards = parseJsonField<Record<string, unknown>>(submissionRow.rewards_granted, {});
    currentRewards.items = newItems;
    currentRewards.hasRandomItems = true;

    await this.promptSubmissionRepo.updateRewardsGranted(submissionId, JSON.stringify(currentRewards));

    return { newItems };
  }

  async rerollSubmissionMonsters(submissionId: number, trainerId: number): Promise<{ newMonsters: unknown[] }> {
    const monsterSubRow = await this.promptSubmissionRepo.findRawById(submissionId);
    if (!monsterSubRow) {
      throw new Error('Submission not found');
    }

    const monsterPromptRow = await this.promptRepo.findById(monsterSubRow.prompt_id);
    if (!monsterPromptRow) {
      throw new Error('Original prompt not found');
    }

    const rewardConfig = (monsterPromptRow.rewards ?? {}) as Record<string, unknown>;
    const monstersConfig = rewardConfig.monsters as Array<Record<string, unknown>> | undefined;
    const monsterRollConfig = rewardConfig.monster_roll as { enabled: boolean; parameters?: Record<string, unknown> } | undefined;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const hasMonsterRolls = (monstersConfig && monstersConfig.length > 0) || (monsterRollConfig?.enabled);

    if (!hasMonsterRolls) {
      throw new Error('This submission does not have monster rolls that can be rerolled');
    }

    const hasForgetMeNot = await this.specialBerryService.hasSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      throw new Error('Trainer does not have any Forget-Me-Not berries');
    }

    const berryConsumed = await this.specialBerryService.consumeSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!berryConsumed) {
      throw new Error('Failed to consume Forget-Me-Not berry');
    }

    // Delete old monsters
    const currentRewards = parseJsonField<Record<string, unknown>>(monsterSubRow.rewards_granted, {});
    const oldMonsters = currentRewards.monsters as Array<{ id?: number }> | undefined;
    if (oldMonsters) {
      for (const monster of oldMonsters) {
        if (monster.id) {
          await this.monsterRepo.delete(monster.id);
        }
      }
    }

    // Reroll
    const userSettings = await this.getUserSettingsForTrainer(trainerId);
    const newMonsters: unknown[] = [];
    if (monstersConfig && Array.isArray(monstersConfig)) {
      for (const monsterRoll of monstersConfig) {
        const rerolled = await this.applyMonsterRoll(trainerId, monsterRoll, userSettings);
        if (rerolled) {
          newMonsters.push(rerolled);
        }
      }
    }
    if (monsterRollConfig?.enabled) {
      const rerolled = await this.applyMonsterRoll(trainerId, monsterRollConfig.parameters ?? {}, userSettings);
      if (rerolled) {
        newMonsters.push(rerolled);
      }
    }

    currentRewards.monsters = newMonsters;
    await this.promptSubmissionRepo.updateRewardsGranted(submissionId, JSON.stringify(currentRewards));

    return { newMonsters };
  }

  async claimSubmissionMonster(
    submissionId: number,
    trainerId: number,
    monsterIndex: number,
    monsterName: string
  ): Promise<unknown> {
    const claimSubRow = await this.promptSubmissionRepo.findRawById(submissionId);
    if (!claimSubRow) {
      throw new Error('Submission not found');
    }

    const rewards = parseJsonField<Record<string, unknown>>(claimSubRow.rewards_granted, {});
    const monstersArray = rewards.monsters as Array<Record<string, unknown>> | undefined;

    if (!monstersArray?.[monsterIndex]) {
      throw new Error('Monster not found in submission rewards');
    }

    const monster = monstersArray[monsterIndex];
    if (monster.claimed) {
      throw new Error('Monster has already been claimed');
    }

    const monsterData: Partial<MonsterData> = {
      trainer_id: trainerId,
      name: monsterName || String(monster.species1) || 'Unnamed',
      species1: String(monster.species1 ?? ''),
      species2: monster.species2 ? String(monster.species2) : undefined,
      species3: monster.species3 ? String(monster.species3) : undefined,
      type1: String(monster.type1 ?? ''),
      type2: monster.type2 ? String(monster.type2) : undefined,
      type3: monster.type3 ? String(monster.type3) : undefined,
      type4: monster.type4 ? String(monster.type4) : undefined,
      type5: monster.type5 ? String(monster.type5) : undefined,
      attribute: String(monster.attribute ?? ''),
      level: (monster.level as number) || 1,
      img_link: monster.img_link ? String(monster.img_link) : undefined,
      where_met: 'Prompt Submission',
    };

    const initializedMonster = await this.monsterInitService.initializeMonster(monsterData as MonsterData);

    // Mark as claimed
    monstersArray[monsterIndex] = {
      ...monstersArray[monsterIndex],
      claimed: true,
      claimed_by: trainerId,
      claimed_at: new Date().toISOString(),
      final_name: monsterName,
      monster_id: (initializedMonster as { id?: number }).id,
    };

    rewards.monsters = monstersArray;
    await this.promptSubmissionRepo.updateRewardsGranted(submissionId, JSON.stringify(rewards));

    return {
      monster: { ...initializedMonster, claimed: true },
    };
  }

  // ===========================================================================
  // External Submissions
  // ===========================================================================

  async calculateExternalArtRewards(data: ExternalArtSubmissionData): Promise<{ rewards: ExternalRewardResult }> {
    const rewards = this.rewardService.calculateExternalArtRewards(data);
    return { rewards };
  }

  async calculateExternalWritingRewards(data: ExternalWritingSubmissionData): Promise<{ rewards: ExternalRewardResult }> {
    const rewards = this.rewardService.calculateExternalWritingRewards(data);
    return { rewards };
  }

  async submitExternalArt(
    data: SubmitExternalArtData,
    userId: string,
    websiteUserId: number,
    file?: { path: string }
  ): Promise<unknown> {
    const backgrounds = parseJsonField<unknown[]>(data.backgrounds, []);
    const characters = parseJsonField<unknown[]>(data.characters, []);
    const tags = parseJsonField<string[]>(data.tags, []);
    const contentRating = parseJsonField<Record<string, unknown>>(data.contentRating, {});
    const isMature = data.isMature === true || (data.isMature as unknown) === 'true';

    // Upload image
    let imageUrl: string | null = null;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/external/art' });
      imageUrl = result.secure_url;
    } else if (data.imageUrl) {
      imageUrl = data.imageUrl;
    } else {
      throw new Error('Image file or URL is required');
    }

    // Calculate rewards
    const rewards = this.rewardService.calculateExternalArtRewards({
      quality: data.quality as ExternalArtSubmissionData['quality'],
      backgrounds: backgrounds as ExternalArtSubmissionData['backgrounds'],
      characters: characters as ExternalArtSubmissionData['characters'],
    });

    // Create submission
    const { id: submissionId } = await this.submissionRepo.createSubmission({
      userId,
      title: data.title,
      description: data.description ?? null,
      contentType: 'image',
      content: data.externalLink ?? imageUrl,
      submissionType: 'art',
      status: 'approved',
      isMature,
      contentRating: JSON.stringify(contentRating),
      isExternal: true,
      externalCharacters: JSON.stringify(characters),
      externalLevels: rewards.totalLevels,
      externalCoins: rewards.totalCoins,
    });

    // Add image and tags
    await this.submissionRepo.addImage(submissionId, imageUrl, true);
    await this.submissionRepo.addTags(submissionId, [...tags, 'external']);

    // Apply bonus rewards (garden points, mission progress, boss damage) at half rate
    await this.rewardService.applyExternalBonusRewards(rewards, websiteUserId, submissionId);

    return {
      success: true,
      submission: {
        id: submissionId,
        title: data.title,
        description: data.description,
        submissionType: 'art',
        status: 'approved',
        imageUrl,
        isExternal: true,
      },
      rewards: {
        totalLevels: rewards.totalLevels,
        totalCoins: rewards.totalCoins,
        gardenPoints: rewards.gardenPoints,
        missionProgress: rewards.missionProgress,
        bossDamage: rewards.bossDamage,
      },
    };
  }

  async submitExternalWriting(
    data: SubmitExternalWritingData,
    userId: string,
    websiteUserId: number,
    file?: { path: string }
  ): Promise<unknown> {
    const tags = parseJsonField<string[]>(data.tags, []);
    const contentRating = parseJsonField<Record<string, unknown>>(data.contentRating, {});
    const isMature = data.isMature === true || (data.isMature as unknown) === 'true';

    // Upload cover image
    let coverImageUrl: string | null = null;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/external/writing/covers' });
      coverImageUrl = result.secure_url;
    } else if (data.coverImageUrl) {
      coverImageUrl = data.coverImageUrl;
    }

    // Calculate rewards
    const rewards = this.rewardService.calculateExternalWritingRewards({
      wordCount: data.wordCount,
    });

    // Chapter handling
    let chapterNumber = data.chapterNumber ?? null;
    if (data.parentId) {
      const parentSubmission = await this.submissionRepo.findById(data.parentId);
      if (!parentSubmission) {
        throw new Error('Parent book not found');
      }
      if (!parentSubmission.isBook) {
        throw new Error('Parent submission is not a book');
      }
      if (!chapterNumber) {
        const maxChapter = await this.submissionRepo.getMaxChapterNumber(data.parentId);
        chapterNumber = maxChapter + 1;
      }
    }

    // Create submission
    const { id: submissionId } = await this.submissionRepo.createSubmission({
      userId,
      title: data.title,
      description: data.description ?? null,
      contentType: 'text',
      content: data.content ?? data.externalLink ?? null,
      submissionType: 'writing',
      status: 'approved',
      isBook: data.isBook ?? false,
      parentId: data.parentId ?? null,
      chapterNumber,
      isMature,
      contentRating: JSON.stringify(contentRating),
      isExternal: true,
      externalLevels: rewards.totalLevels,
      externalCoins: rewards.totalCoins,
    });

    // Add cover image and tags
    if (coverImageUrl) {
      await this.submissionRepo.addImage(submissionId, coverImageUrl, true);
    }
    await this.submissionRepo.addTags(submissionId, [...tags, 'external']);

    // Apply bonus rewards at half rate
    await this.rewardService.applyExternalBonusRewards(rewards, websiteUserId, submissionId);

    return {
      success: true,
      submission: {
        id: submissionId,
        title: data.title,
        description: data.description,
        submissionType: 'writing',
        status: 'approved',
        coverImageUrl,
        isExternal: true,
      },
      rewards: {
        totalLevels: rewards.totalLevels,
        totalCoins: rewards.totalCoins,
        gardenPoints: rewards.gardenPoints,
        missionProgress: rewards.missionProgress,
        bossDamage: rewards.bossDamage,
      },
    };
  }

  async allocateExternalLevels(
    submissionId: number,
    recipientType: 'trainer' | 'monster',
    recipientId: number,
    levels: number
  ) {
    return this.rewardService.allocateExternalLevels(submissionId, recipientType, recipientId, levels);
  }

  // ===========================================================================
  // Book / Chapter Management
  // ===========================================================================

  async getUserBooks(userId: string): Promise<unknown[]> {
    const ownedBooks = await this.submissionRepo.findUserOwnedBooks(userId);

    let collaboratedBooks: unknown[] = [];
    try {
      const collabRows = await this.submissionRepo.findUserCollaboratedBooks(userId);
      collaboratedBooks = collabRows.map(b => ({ ...b, isCollaboration: true }));
    } catch {
      // book_collaborators table might not exist yet
    }

    return [
      ...ownedBooks.map((b) => ({ ...b, isCollaboration: false })),
      ...collaboratedBooks,
    ];
  }

  async getBookChapters(bookId: number): Promise<unknown> {
    const { book, chapters } = await this.submissionRepo.findBookWithChapters(bookId);

    if (!book) {
      return null;
    }
    if (!book.is_book) {
      throw new Error('This submission is not a book');
    }

    return {
      bookId,
      bookTitle: book.title,
      chapters,
    };
  }

  async updateChapterOrder(bookId: number, chapterOrder: number[], userId: string): Promise<void> {
    const ownership = await this.submissionRepo.findByIdForOwnership(bookId);
    if (!ownership?.is_book) {
      throw new Error('Book not found');
    }

    const isOwner = ownership.user_id === userId;
    let isEditorCollaborator = false;
    if (!isOwner) {
      const role = await this.submissionRepo.findCollaboratorRole(bookId, userId);
      isEditorCollaborator = role === 'editor';
    }
    if (!isOwner && !isEditorCollaborator) {
      throw new Error('You do not have permission to modify this book');
    }

    for (let i = 0; i < chapterOrder.length; i++) {
      const chapterId = chapterOrder[i];
      if (chapterId !== undefined) {
        await this.submissionRepo.updateChapterNumber(chapterId, i + 1, bookId);
      }
    }
  }

  async createBook(
    data: { title: string; description?: string; tags?: string[]; coverImageUrl?: string },
    userId: string,
    file?: { path: string }
  ): Promise<unknown> {
    const { id: submissionId } = await this.submissionRepo.createSubmission({
      userId,
      title: data.title,
      description: data.description ?? '',
      contentType: 'book',
      submissionType: 'writing',
      isBook: true,
      status: 'approved',
    });

    // Cover image
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'submissions/covers' });
      await this.submissionRepo.addImage(submissionId, result.secure_url, true, 0);
    } else if (data.coverImageUrl) {
      await this.submissionRepo.addImage(submissionId, data.coverImageUrl, true, 0);
    }

    // Tags
    const tags = parseJsonField<string[]>(data.tags, []);
    await this.submissionRepo.addTags(submissionId, tags);

    return { id: submissionId, title: data.title };
  }

  // ===========================================================================
  // Collaborators
  // ===========================================================================

  async getBookCollaborators(bookId: number): Promise<unknown> {
    const ownership = await this.submissionRepo.findByIdForOwnership(bookId);
    if (!ownership) {
      return null;
    }
    if (!ownership.is_book) {
      throw new Error('This submission is not a book');
    }

    const collaborators = await this.submissionRepo.findCollaboratorsByBookId(bookId);

    return {
      bookId,
      bookTitle: '', // caller can enrich from ownership if needed
      ownerId: ownership.user_id,
      collaborators,
    };
  }

  async addBookCollaborator(
    bookId: number,
    targetUserId: string,
    currentUserId: string,
    role: string = 'editor'
  ): Promise<unknown> {
    const ownership = await this.submissionRepo.findByIdForOwnership(bookId);
    if (!ownership) {
      throw new Error('Book not found');
    }
    if (!ownership.is_book) {
      throw new Error('This submission is not a book');
    }
    if (ownership.user_id !== currentUserId) {
      throw new Error('Only the book owner can add collaborators');
    }
    if (targetUserId === currentUserId) {
      throw new Error('You cannot add yourself as a collaborator');
    }

    const targetUser = await this.submissionRepo.findUserByDiscordIdOrId(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    const collaboratorUserId = targetUser.discord_id || String(targetUser.id);
    const { id } = await this.submissionRepo.addCollaborator(bookId, collaboratorUserId, role, currentUserId);

    return {
      id,
      book_id: bookId,
      user_id: collaboratorUserId,
      role,
      username: targetUser.username,
      display_name: targetUser.display_name,
    };
  }

  async removeBookCollaborator(bookId: number, collaboratorUserId: string, currentUserId: string): Promise<boolean> {
    const ownership = await this.submissionRepo.findByIdForOwnership(bookId);
    if (!ownership) {
      throw new Error('Book not found');
    }
    if (ownership.user_id !== currentUserId && collaboratorUserId !== currentUserId) {
      throw new Error('Only the book owner can remove collaborators');
    }

    return this.submissionRepo.removeCollaborator(bookId, collaboratorUserId);
  }

  async updateCollaboratorRole(bookId: number, collaboratorUserId: string, role: string, currentUserId: string): Promise<boolean> {
    const ownership = await this.submissionRepo.findByIdForOwnership(bookId);
    if (!ownership) {
      throw new Error('Book not found');
    }
    if (ownership.user_id !== currentUserId) {
      throw new Error('Only the book owner can update collaborator roles');
    }

    return this.submissionRepo.updateCollaboratorRole(bookId, collaboratorUserId, role);
  }

  async getUserCollaborations(userId: string): Promise<unknown[]> {
    try {
      return await this.submissionRepo.findCollaborationsByUserId(userId);
    } catch {
      return [];
    }
  }

  async searchCollaboratorUsers(bookId: number, search: string, currentUserId: string): Promise<unknown[]> {
    const ownership = await this.submissionRepo.findByIdForOwnership(bookId);
    if (!ownership) {
      throw new Error('Book not found');
    }
    if (ownership.user_id !== currentUserId) {
      throw new Error('Only the book owner can add collaborators');
    }

    return this.submissionRepo.searchUsersForCollaboration(bookId, search, currentUserId);
  }

  // ===========================================================================
  // Submission Management
  // ===========================================================================

  async updateSubmission(
    submissionId: number,
    updates: { title?: string; description?: string; content?: string; tags?: string[]; parentId?: number | null },
    userId: string,
    isAdmin: boolean
  ): Promise<unknown> {
    const ownership = await this.submissionRepo.findByIdForOwnership(submissionId);
    if (!ownership) {
      throw new Error('Submission not found');
    }

    const isOwner = ownership.user_id === userId
      || String(ownership.user_id) === String(userId)
      || ownership.user_discord_id === userId;

    if (!isOwner && !isAdmin) {
      throw new Error('You do not have permission to edit this submission');
    }
    if (ownership.status === 'deleted') {
      throw new Error('Cannot edit a deleted submission');
    }

    // Build update fields
    const fields: Record<string, unknown> = {};
    if (updates.title !== undefined) {
      fields.title = updates.title;
    }
    if (updates.description !== undefined) {
      fields.description = updates.description;
    }
    if (updates.content !== undefined && ownership.submission_type === 'writing') {
      fields.content = updates.content;
    }

    // Handle book chapter assignment changes
    if (updates.parentId !== undefined && ownership.submission_type === 'writing') {
      if (updates.parentId === null || updates.parentId === 0) {
        // Remove from book
        fields.parent_id = null;
        fields.chapter_number = null;
      } else {
        // Adding to a book - validate the book exists
        const parentSubmission = await this.submissionRepo.findById(updates.parentId);
        if (!parentSubmission || !(parentSubmission as Record<string, unknown>).is_book) {
          throw new Error('Selected book not found or is not a book');
        }

        // Check permission on the target book
        const bookUserId = String((parentSubmission as Record<string, unknown>).user_id);
        const bookOwner = bookUserId === userId || String(bookUserId) === String(userId);
        if (!bookOwner && !isAdmin) {
          const role = await this.submissionRepo.findCollaboratorRole(updates.parentId, userId);
          if (role !== 'editor') {
            throw new Error('You do not have permission to add chapters to this book');
          }
        }

        // Auto-assign next chapter number
        const maxChapter = await this.submissionRepo.getMaxChapterNumber(updates.parentId);
        fields.parent_id = updates.parentId;
        fields.chapter_number = maxChapter + 1;
      }
    }

    if (Object.keys(fields).length > 0) {
      await this.submissionRepo.updateFields(submissionId, fields);
    }

    // Update tags
    if (updates.tags !== undefined && Array.isArray(updates.tags)) {
      await this.submissionRepo.replaceTags(submissionId, updates.tags);
    }

    // Return updated
    return this.submissionRepo.findByIdWithTagsAndImage(submissionId);
  }

  async deleteSubmission(submissionId: number, userId: string, isAdmin: boolean): Promise<void> {
    const ownership = await this.submissionRepo.findByIdForOwnership(submissionId);
    if (!ownership) {
      throw new Error('Submission not found');
    }

    const isOwner = ownership.user_id === userId
      || String(ownership.user_id) === String(userId)
      || ownership.user_discord_id === userId;

    if (!isOwner && !isAdmin) {
      throw new Error('You do not have permission to delete this submission');
    }
    await this.submissionRepo.hardDelete(submissionId);
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private async addSubmissionRelatedRecords(
    submissionId: number,
    imageUrl: string | null,
    coverImageUrl: string | null,
    tags: string[],
    monsters: unknown[],
    trainers: unknown[]
  ): Promise<void> {
    // Main image
    const mainUrl = imageUrl ?? coverImageUrl;
    if (mainUrl) {
      await this.submissionRepo.addImage(submissionId, mainUrl, true);
    }

    // Tags
    await this.submissionRepo.addTags(submissionId, tags);

    await this.addMonstersAndTrainers(submissionId, monsters, trainers);
  }

  private async addMonstersAndTrainers(submissionId: number, monsters: unknown[], trainers: unknown[]): Promise<void> {
    // Monsters
    for (const monster of monsters) {
      const m = monster as { name?: string; trainerId?: number };
      if (m.name && m.trainerId) {
        try {
          const monsterData = await this.monsterRepo.findByTrainerAndName(m.trainerId, m.name);
          if (monsterData) {
            await this.submissionRepo.linkMonster(submissionId, monsterData.id);
          }
        } catch {
          // Skip failed monster linking
        }
      }
    }

    // Trainers
    for (const trainer of trainers) {
      const t = trainer as { trainerId?: number; id?: number };
      const tId = t.trainerId ?? t.id;
      if (tId) {
        try {
          await this.submissionRepo.linkTrainer(submissionId, tId);
        } catch {
          // Skip failed trainer linking
        }
      }
    }
  }

  private async applyReferenceSideEffects(reference: Record<string, unknown>, referenceType: string): Promise<void> {
    const trainerId = reference.trainerId as number;
    const referenceUrl = reference.referenceUrl as string;

    if (referenceType === 'trainer') {
      await this.trainerRepo.update(trainerId, { mainRef: referenceUrl });
    } else if (referenceType === 'monster') {
      const monsterName = reference.monsterName as string;
      const monster = await this.monsterRepo.findByTrainerAndName(trainerId, monsterName);
      if (monster) {
        await this.monsterRepo.addImage(monster.id, referenceUrl, 'main');
        await this.monsterRepo.update(monster.id, { imgLink: referenceUrl });
      }
    } else if (referenceType === 'mega image') {
      const monsterName = reference.monsterName as string;
      const monster = await this.monsterRepo.findByTrainerAndName(trainerId, monsterName);
      if (monster) {
        await this.monsterRepo.addMegaImage(monster.id, referenceUrl);
      }
    } else if (referenceType === 'trainer mega') {
      const megaInfo = {
        mega_ref: referenceUrl ?? '',
        mega_artist: reference.megaArtist ?? '',
        mega_species1: reference.megaSpecies1 ?? '',
        mega_species2: reference.megaSpecies2 ?? '',
        mega_species3: reference.megaSpecies3 ?? '',
        mega_type1: reference.megaType1 ?? '',
        mega_type2: reference.megaType2 ?? '',
        mega_type3: reference.megaType3 ?? '',
        mega_type4: reference.megaType4 ?? '',
        mega_type5: reference.megaType5 ?? '',
        mega_type6: reference.megaType6 ?? '',
        mega_ability: reference.megaAbility ?? '',
      };
      await this.trainerRepo.update(trainerId, { megaInfo: JSON.stringify(megaInfo) });
    }
  }

  private async applyPromptRewards(
    trainerId: number,
    rewardConfig: Record<string, unknown>,
    _submissionId: number,
    userSettings?: UserSettings
  ): Promise<Record<string, unknown>> {
    const appliedRewards: Record<string, unknown> = {
      levels: 0,
      coins: 0,
      items: [],
      monsters: [],
      trainer_id: trainerId,
      hasRandomItems: false,
    };

    if (rewardConfig.levels && (rewardConfig.levels as number) > 0) {
      await this.trainerRepo.addLevels(trainerId, rewardConfig.levels as number);
      appliedRewards.levels = rewardConfig.levels;
    }

    if (rewardConfig.coins && (rewardConfig.coins as number) > 0) {
      await this.trainerRepo.updateCurrency(trainerId, rewardConfig.coins as number);
      appliedRewards.coins = rewardConfig.coins;
    }

    // Items
    if (rewardConfig.items && Array.isArray(rewardConfig.items)) {
      const hasRandom = (rewardConfig.items as Array<Record<string, unknown>>).some(
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        item => item.is_random_from_category || item.is_random_from_set
      );
      appliedRewards.hasRandomItems = hasRandom;

      const appliedItems: unknown[] = [];
      for (const item of rewardConfig.items as Array<Record<string, unknown>>) {
        const applied = await this.applyItemReward(trainerId, item);
        if (applied) {
          appliedItems.push(applied);
        }
      }
      appliedRewards.items = appliedItems;
    }

    // Monsters (new format)
    if (rewardConfig.monsters && Array.isArray(rewardConfig.monsters)) {
      const appliedMonsters: unknown[] = [];
      for (const monsterRoll of rewardConfig.monsters as Array<Record<string, unknown>>) {
        const rolled = await this.applyMonsterRoll(trainerId, monsterRoll, userSettings);
        if (rolled) {
          appliedMonsters.push(rolled);
        }
      }
      appliedRewards.monsters = appliedMonsters;
    }

    // Monster roll (legacy format)
    const monsterRoll = rewardConfig.monster_roll as { enabled: boolean; parameters?: Record<string, unknown> } | undefined;
    if (monsterRoll?.enabled) {
      const rolled = await this.applyMonsterRoll(trainerId, monsterRoll.parameters ?? {}, userSettings);
      if (rolled) {
        (appliedRewards.monsters as unknown[]).push(rolled);
      }
    }

    return appliedRewards;
  }

  private async applyItemReward(
    trainerId: number,
    item: Record<string, unknown>
  ): Promise<{ item_name: string; category: string; quantity: number } | null> {
    try {
      let itemToAdd: { item_name: string; inventory_category: string; quantity: number; chance: number } | null = null;

      if (item.is_random_from_category && item.category) {
        const categoryItems = await this.itemRepo.findByCategory(String(item.category));
        if (categoryItems.length > 0) {
          const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
          if (randomItem) {
            itemToAdd = {
              item_name: randomItem.name,
              inventory_category: randomItem.category,
              quantity: (item.quantity as number) || 1,
              chance: (item.chance as number) || 100,
            };
          }
        }
      } else if (item.is_random_from_set && Array.isArray(item.random_set_items) && item.random_set_items.length > 0) {
        const validItems = (item.random_set_items as unknown[]).filter(id => id);
        if (validItems.length > 0) {
          const randomId = validItems[Math.floor(Math.random() * validItems.length)];
          const randomItem = await this.itemRepo.findById(randomId as number);
          if (randomItem) {
            itemToAdd = {
              item_name: randomItem.name,
              inventory_category: randomItem.category,
              quantity: (item.quantity as number) || 1,
              chance: (item.chance as number) || 100,
            };
          }
        }
      } else {
        let itemName = item.item_name as string | undefined;
        let inventoryCategory = item.category as string | undefined;

        if (item.item_id && !itemName) {
          const itemRecord = await this.itemRepo.findById(item.item_id as number);
          if (itemRecord) {
            itemName = itemRecord.name;
            inventoryCategory = itemRecord.category;
          }
        }

        if (itemName) {
          itemToAdd = {
            item_name: itemName,
            inventory_category: inventoryCategory ?? 'items',
            quantity: (item.quantity as number) ?? 1,
            chance: (item.chance as number) ?? 100,
          };
        }
      }

      if (!itemToAdd) {
        return null;
      }

      // Chance check
      if (Math.random() * 100 > itemToAdd.chance) {
        return null;
      }

      await this.inventoryRepo.addItem(trainerId, itemToAdd.inventory_category as InventoryCategory, itemToAdd.item_name, itemToAdd.quantity);

      return {
        item_name: itemToAdd.item_name,
        category: itemToAdd.inventory_category,
        quantity: itemToAdd.quantity,
      };
    } catch {
      return null;
    }
  }

  private async getUserSettingsForTrainer(trainerId: number): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
    };

    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer?.player_user_id) {
      return defaultSettings;
    }

    const user = await this.userRepo.findByDiscordId(trainer.player_user_id);
    if (!user?.monster_roller_settings) {
      return defaultSettings;
    }

    try {
      const settings =
        typeof user.monster_roller_settings === 'string'
          ? JSON.parse(user.monster_roller_settings)
          : user.monster_roller_settings;
      return { ...defaultSettings, ...settings };
    } catch {
      return defaultSettings;
    }
  }

  private async applyMonsterRoll(
    _trainerId: number,
    rollParams: Record<string, unknown>,
    userSettings?: UserSettings
  ): Promise<RolledMonster | null> {
    try {
      const roller = new MonsterRollerService(userSettings ? { userSettings } : {});
      const params: Partial<RollParams> = {
        tables: (rollParams.tables as MonsterTable[]) ?? (['pokemon', 'digimon', 'yokai'] as MonsterTable[]),
        legendary: (rollParams.legendary as boolean) || false,
        mythical: (rollParams.mythical as boolean) || false,
        ...rollParams,
      };
      return await roller.rollMonster(params as RollParams);
    } catch {
      return null;
    }
  }

  private async buildPromptRewardsPreview(rewardConfig: Record<string, unknown>): Promise<Record<string, unknown>> {
    const preview: Record<string, unknown> = {
      levels: (rewardConfig.levels as number) || 0,
      coins: (rewardConfig.coins as number) || 0,
      items: [],
      monsters: [],
    };

    // Roll items preview
    if (rewardConfig.items && Array.isArray(rewardConfig.items)) {
      const itemPreviews: unknown[] = [];
      for (const item of rewardConfig.items as Array<Record<string, unknown>>) {
        let itemPreview: Record<string, unknown> = { ...item, quantity: (item.quantity as number) || 1 };

        if (item.is_random_from_category && item.category) {
          const categoryItems = await this.itemRepo.findByCategory(String(item.category));
          if (categoryItems.length > 0) {
            const rolled = categoryItems[Math.floor(Math.random() * categoryItems.length)];
            if (rolled) {
              itemPreview = { ...itemPreview, item_id: rolled.id, item_name: rolled.name, category: rolled.category, display: rolled.name, image_url: rolled.image_url, was_random: true };
            }
          }
        } else if (item.is_random_from_set && Array.isArray(item.random_set_items) && item.random_set_items.length > 0) {
          const validItems = (item.random_set_items as unknown[]).filter(id => id);
          if (validItems.length > 0) {
            const randomId = validItems[Math.floor(Math.random() * validItems.length)];
            const rolled = await this.itemRepo.findById(randomId as number);
            if (rolled) {
              itemPreview = { ...itemPreview, item_id: rolled.id, item_name: rolled.name, category: rolled.category, display: rolled.name, image_url: rolled.image_url, was_random: true };
            }
          }
        } else if (item.item_id) {
          const itemRecord = await this.itemRepo.findById(item.item_id as number);
          if (itemRecord) {
            itemPreview = { ...itemPreview, item_name: itemRecord.name, category: itemRecord.category, display: itemRecord.name, image_url: itemRecord.image_url };
          }
        }

        itemPreviews.push(itemPreview);
      }
      preview.items = itemPreviews;
    }

    // Roll monsters preview
    if (rewardConfig.monsters && Array.isArray(rewardConfig.monsters)) {
      const monsterPreviews: unknown[] = [];
      for (const monsterRoll of rewardConfig.monsters as Array<Record<string, unknown>>) {
        try {
          const roller = new MonsterRollerService();
          const rolled = await roller.rollMonster(monsterRoll as RollParams);
          if (rolled) {
            monsterPreviews.push({ ...rolled, claimed: false, roll_config: monsterRoll });
          }
        } catch {
          // Skip failed rolls
        }
      }
      preview.monsters = monsterPreviews;
    }

    // Legacy monster_roll
    const monsterRoll = rewardConfig.monster_roll as { enabled: boolean; parameters?: Record<string, unknown> } | undefined;
    if (monsterRoll?.enabled) {
      try {
        const roller = new MonsterRollerService();
        const rolled = await roller.rollMonster((monsterRoll.parameters ?? {}) as RollParams);
        if (rolled) {
          (preview.monsters as unknown[]).push({ ...rolled, claimed: false, roll_config: monsterRoll.parameters });
        }
      } catch {
        // Skip failed rolls
      }
    }

    return preview;
  }
}
