import { db } from '../database';
import {
  TrainerRepository,
  MonsterRepository,
  GardenPointRepository,
  UserMissionRepository,
  BossRepository,
} from '../repositories';
import { ItemRollerService } from './item-roller.service';
import {
  ART_QUALITY_BASE_LEVELS,
  BACKGROUND_BONUS_LEVELS,
  APPEARANCE_BONUS_LEVELS,
  DEFAULT_REWARD_RATES,
  EXTERNAL_REWARD_RATES,
  EXTERNAL_CHARACTER_COMPLEXITY,
  type ArtQualityLevel,
  type BackgroundType,
  type AppearanceType,
  type ExternalCharacterComplexity,
  type ItemCategoryValue,
} from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

export type Appearance = {
  type: AppearanceType;
  count?: number;
};

export type Background = {
  type: BackgroundType;
};

export type TrainerInput = {
  trainerId: number;
  appearances?: Appearance[];
  customLevels?: number;
  isOwned?: boolean;
  isGift?: boolean;
};

export type MonsterInput = {
  monsterId: number;
  name?: string;
  trainerId?: number;
  appearances?: Appearance[];
  complexityBonus?: number;
  customLevels?: number;
  isGift?: boolean;
};

export type NpcInput = {
  name?: string;
  levels: number;
};

export type ArtSubmissionData = {
  quality: ArtQualityLevel;
  backgroundType?: BackgroundType;
  backgrounds?: Background[];
  uniquelyDifficult?: boolean;
  trainers?: TrainerInput[];
  monsters?: MonsterInput[];
  npcs?: NpcInput[];
  isGift?: boolean;
  useStaticRewards?: boolean;
};

export type WritingSubmissionData = {
  wordCount: number;
  trainers?: TrainerInput[];
  monsters?: MonsterInput[];
  npcs?: NpcInput[];
  trainerId?: number; // Legacy support
  monsterId?: number; // Legacy support
  isGift?: boolean;
};

export type TrainerReward = {
  trainerId: number;
  trainerName?: string;
  levels: number;
  coins: number;
  cappedLevels: number;
  appearances?: Array<{ type: string; bonus: number; count: number }>;
  isGift: boolean;
  isOwned: boolean;
};

export type MonsterReward = {
  monsterId: number;
  name?: string;
  trainerId?: number;
  levels: number;
  coins: number;
  cappedLevels: number;
  complexityBonus?: number;
  appearances?: Array<{ type: string; bonus: number; count: number }>;
  isGift: boolean;
  isTrainerOwned: boolean;
};

export type GiftItem = {
  category: string;
  name: string;
  quantity: number;
  recipientType?: 'trainer' | 'monster';
  recipientId?: number;
};

export type ArtRewardResult = {
  overallLevels: number;
  trainerRewards: TrainerReward[];
  monsterRewards: MonsterReward[];
  gardenPoints: number;
  missionProgress: number;
  bossDamage: number;
  isGift: boolean;
  totalGiftLevels: number;
  giftItems: GiftItem[];
};

export type WritingRewardResult = {
  totalLevels: number;
  totalCoins: number;
  trainerRewards: TrainerReward[];
  monsterRewards: MonsterReward[];
  gardenPoints: number;
  missionProgress: number;
  bossDamage: number;
  totalGiftLevels: number;
  giftItems: GiftItem[];
};

export type AppliedRewardsResult = {
  trainers: Array<{ trainerId: number; levels: number; coins: number; cappedLevels: number }>;
  monsters: Array<{ monsterId: number; name?: string; levels: number; cappedLevels: number }>;
  gardenPoints: number;
  missionProgress: number | { amount: number; success: boolean; message: string };
  bossDamage: number | { amount: number; results: unknown[] };
  giftLevels: number;
  giftCoins: number;
  giftItems: GiftItem[];
  cappedLevels: number;
};

export type ExternalCharacter = {
  name: string;
  appearance: AppearanceType;
  complexity: ExternalCharacterComplexity;
};

export type ExternalArtSubmissionData = {
  quality: ArtQualityLevel;
  backgrounds?: Background[];
  characters?: ExternalCharacter[];
};

export type ExternalWritingSubmissionData = {
  wordCount: number;
};

export type ExternalRewardResult = {
  totalLevels: number;
  totalCoins: number;
  gardenPoints: number;
  missionProgress: number;
  bossDamage: number;
};

export type LevelCapResult = {
  cappedMonsters: Array<{
    monsterId: number;
    name: string;
    currentLevel: number;
    originalLevels: number;
    cappedLevels: number;
    excessLevels: number;
    trainerId: number;
    trainerName: string;
    image_url?: string;
  }>;
  adjustedRewards: MonsterReward[];
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for calculating and applying submission rewards.
 * Handles art and writing submissions with different reward formulas.
 */
export class SubmissionRewardService {
  private trainerRepository: TrainerRepository;
  private monsterRepository: MonsterRepository;
  private itemRollerService: ItemRollerService;
  private gardenPointRepository: GardenPointRepository;
  private userMissionRepository: UserMissionRepository;
  private bossRepository: BossRepository;

  constructor(
    trainerRepository?: TrainerRepository,
    monsterRepository?: MonsterRepository,
    itemRollerService?: ItemRollerService
  ) {
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.itemRollerService = itemRollerService ?? new ItemRollerService();
    this.gardenPointRepository = new GardenPointRepository();
    this.userMissionRepository = new UserMissionRepository();
    this.bossRepository = new BossRepository();
  }

  // ==========================================================================
  // Art Reward Calculation
  // ==========================================================================

  /**
   * Calculate rewards for an art submission
   * @param artData - Art submission data
   * @param userId - User ID for gift detection
   * @returns Calculated rewards
   */
  async calculateArtRewards(artData: ArtSubmissionData, userId?: number): Promise<ArtRewardResult> {
    const {
      quality,
      backgroundType,
      backgrounds = [],
      uniquelyDifficult = false,
      trainers = [],
      monsters = [],
      npcs = [],
      isGift = false,
      useStaticRewards = false,
    } = artData;

    const shouldUseStaticRewards = useStaticRewards === true;

    // Base levels based on quality
    const baseLevels = ART_QUALITY_BASE_LEVELS[quality] ?? 2;

    // Background bonus
    let backgroundBonus = 0;
    if (backgrounds.length > 0) {
      for (const bg of backgrounds) {
        const bgValue = BACKGROUND_BONUS_LEVELS[bg.type] ?? 0;
        backgroundBonus = Math.max(backgroundBonus, bgValue);
      }
    } else if (backgroundType) {
      backgroundBonus = BACKGROUND_BONUS_LEVELS[backgroundType] ?? 0;
    }

    // Uniquely difficult bonus
    const difficultyBonus = uniquelyDifficult ? 3 : 0;

    // Calculate overall image levels
    const overallLevels = baseLevels + backgroundBonus + difficultyBonus;

    // Process rewards
    const trainerRewards: TrainerReward[] = [];
    const monsterRewards: MonsterReward[] = [];
    let totalGiftLevels = 0;

    // Process trainers
    for (const trainer of trainers) {
      const reward = await this.calculateTrainerReward(
        trainer,
        overallLevels,
        shouldUseStaticRewards
      );
      trainerRewards.push(reward);

      if (!trainer.isOwned) {
        totalGiftLevels += reward.levels;
      }
    }

    // Process monsters
    for (const monster of monsters) {
      const reward = await this.calculateMonsterReward(
        monster,
        overallLevels,
        shouldUseStaticRewards,
        userId,
        trainers
      );
      monsterRewards.push(reward);

      if (!reward.isTrainerOwned) {
        totalGiftLevels += reward.levels + reward.cappedLevels;
      }
    }

    // Process NPCs - all NPC levels become gift levels
    for (const npc of npcs) {
      const npcLevels = npc.levels || 0;
      totalGiftLevels += npcLevels;
    }

    // Calculate total levels across all participants
    const totalLevelsForBonuses = trainerRewards.reduce((sum, r) => sum + r.levels, 0)
      + monsterRewards.reduce((sum, r) => sum + r.levels, 0);

    // Calculate bonuses: totalLevels / rand(2-4) + rand(1-4), each independently
    const gardenPoints = Math.floor(totalLevelsForBonuses / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1;
    const missionProgress = Math.floor(totalLevelsForBonuses / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1;
    const bossDamage = Math.floor(totalLevelsForBonuses / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1;

    // Calculate gift items
    const giftItems = await this.calculateGiftItems(
      isGift,
      trainerRewards,
      monsterRewards
    );

    return {
      overallLevels,
      trainerRewards,
      monsterRewards,
      gardenPoints,
      missionProgress,
      bossDamage,
      isGift,
      totalGiftLevels,
      giftItems,
    };
  }

  /**
   * Calculate reward for a single trainer
   */
  private async calculateTrainerReward(
    trainer: TrainerInput,
    overallLevels: number,
    useStaticRewards: boolean
  ): Promise<TrainerReward> {
    const { trainerId, appearances = [], customLevels = 0, isOwned = true, isGift = false } = trainer;

    let trainerLevels = 0;
    const appearancesData: Array<{ type: string; bonus: number; count: number }> = [];

    if (useStaticRewards) {
      // Static rewards: 6 levels
      trainerLevels = customLevels > 0 ? customLevels : 6;

      // Process appearances for display
      for (const appearance of appearances) {
        const appearanceBonus = APPEARANCE_BONUS_LEVELS[appearance.type] ?? 0;
        appearancesData.push({
          type: appearance.type,
          bonus: appearanceBonus,
          count: appearance.count ?? 1,
        });
      }
    } else {
      // Dynamic reward calculation
      trainerLevels = overallLevels;

      for (const appearance of appearances) {
        const appearanceBonus = APPEARANCE_BONUS_LEVELS[appearance.type] ?? 0;
        appearancesData.push({
          type: appearance.type,
          bonus: appearanceBonus,
          count: appearance.count ?? 1,
        });
        trainerLevels += appearanceBonus * (appearance.count ?? 1);
      }

      // Add trainer bonus
      trainerLevels += 3;

      if (customLevels > 0) {
        trainerLevels = customLevels;
      }
    }

    // Calculate coins
    const trainerCoins = useStaticRewards && !customLevels ? 200 : trainerLevels * DEFAULT_REWARD_RATES.coinsPerLevel;

    // Look up trainer name
    let trainerName: string | undefined;
    try {
      const trainerData = await this.trainerRepository.findById(trainerId);
      if (trainerData) {
        trainerName = trainerData.name;
      }
    } catch {
      // Ignore lookup errors
    }

    return {
      trainerId,
      trainerName,
      levels: trainerLevels,
      coins: trainerCoins,
      cappedLevels: 0,
      appearances: appearancesData,
      isGift,
      isOwned,
    };
  }

  /**
   * Calculate reward for a single monster
   */
  private async calculateMonsterReward(
    monster: MonsterInput,
    overallLevels: number,
    useStaticRewards: boolean,
    userId?: number,
    trainers: TrainerInput[] = []
  ): Promise<MonsterReward> {
    const {
      monsterId,
      name,
      trainerId: monsterTrainerId,
      appearances = [],
      complexityBonus = 0,
      customLevels = 0,
      isGift = false,
    } = monster;

    let monsterLevels = 0;
    const appearancesData: Array<{ type: string; bonus: number; count: number }> = [];
    const complexityValue = complexityBonus || 0;

    // Check trainer ownership
    let isTrainerOwned = true;
    if (monsterTrainerId && userId) {
      const trainer = await this.trainerRepository.findById(monsterTrainerId);
      if (trainer) {
        isTrainerOwned = trainer.player_user_id === String(userId);
      }
    }
    // Also check trainers array
    if (monsterTrainerId) {
      const matchedTrainer = trainers.find((t) => t.trainerId === monsterTrainerId);
      if (matchedTrainer) {
        isTrainerOwned = matchedTrainer.isOwned !== false;
      }
    }

    if (useStaticRewards) {
      monsterLevels = customLevels > 0 ? customLevels : 6;

      for (const appearance of appearances) {
        const appearanceBonus = APPEARANCE_BONUS_LEVELS[appearance.type] ?? 0;
        appearancesData.push({
          type: appearance.type,
          bonus: appearanceBonus,
          count: appearance.count ?? 1,
        });
      }
    } else {
      monsterLevels = overallLevels;

      for (const appearance of appearances) {
        const appearanceBonus = APPEARANCE_BONUS_LEVELS[appearance.type] ?? 0;
        appearancesData.push({
          type: appearance.type,
          bonus: appearanceBonus,
          count: appearance.count ?? 1,
        });
        monsterLevels += appearanceBonus * (appearance.count ?? 1);
      }

      monsterLevels += complexityValue;

      if (customLevels > 0) {
        monsterLevels = customLevels;
      }
    }

    const monsterCoins = useStaticRewards && !customLevels ? 200 : monsterLevels * DEFAULT_REWARD_RATES.coinsPerLevel;

    // Check level cap and look up name
    let cappedLevels = 0;
    let resolvedName = name;
    if (monsterId) {
      try {
        const monsterData = await this.monsterRepository.findById(monsterId);
        if (monsterData) {
          resolvedName ??= monsterData.name;
          const currentLevel = monsterData.level;
          if (currentLevel >= 100) {
            cappedLevels = monsterLevels;
            monsterLevels = 0;
          } else if (currentLevel + monsterLevels > 100) {
            cappedLevels = currentLevel + monsterLevels - 100;
            monsterLevels = 100 - currentLevel;
          }
        }
      } catch {
        // Ignore level cap check errors
      }
    }

    return {
      monsterId,
      name: resolvedName,
      trainerId: monsterTrainerId,
      levels: monsterLevels,
      coins: monsterCoins,
      cappedLevels,
      complexityBonus: complexityValue,
      appearances: appearancesData,
      isGift,
      isTrainerOwned,
    };
  }

  // ==========================================================================
  // Writing Reward Calculation
  // ==========================================================================

  /**
   * Calculate rewards for a writing submission
   * @param writingData - Writing submission data
   * @param userId - User ID for gift detection
   * @returns Calculated rewards
   */
  async calculateWritingRewards(
    writingData: WritingSubmissionData,
    userId?: number
  ): Promise<WritingRewardResult> {
    const {
      wordCount,
      trainers = [],
      monsters = [],
      npcs = [],
      trainerId,
      monsterId,
      isGift = false,
    } = writingData;

    // Calculate total levels and coins
    const totalLevels = Math.floor(wordCount / DEFAULT_REWARD_RATES.wordsPerLevel);
    const totalCoins = Math.floor(wordCount / DEFAULT_REWARD_RATES.wordsPerCoin);

    // Handle legacy format
    let processedTrainers = trainers;
    let processedMonsters = monsters;

    if (trainerId && processedTrainers.length === 0) {
      processedTrainers = [{ trainerId, isOwned: true, isGift }];
    }

    if (monsterId && processedMonsters.length === 0) {
      processedMonsters = [{ monsterId, isGift }];
    }

    const totalParticipants = processedTrainers.length + processedMonsters.length + npcs.length;

    if (totalParticipants === 0) {
      throw new Error('No trainers or monsters specified for writing submission');
    }

    // Split rewards among participants (including NPCs)
    const levelsPerParticipant = Math.floor(totalLevels / totalParticipants);
    const coinsPerParticipant = Math.floor(totalCoins / totalParticipants);
    const remainderLevels = totalLevels % totalParticipants;
    const remainderCoins = totalCoins % totalParticipants;

    // Process trainer rewards
    const trainerRewards: TrainerReward[] = [];
    let totalGiftLevels = 0;

    for (let i = 0; i < processedTrainers.length; i++) {
      const trainer = processedTrainers[i];
      if (!trainer) { continue; }
      const { trainerId: tId, isOwned = true, isGift: tIsGift = false } = trainer;

      const trainerLevels = levelsPerParticipant + (i < remainderLevels ? 1 : 0);
      const trainerCoins = coinsPerParticipant + (i < remainderCoins ? 1 : 0);

      if (!isOwned) {
        totalGiftLevels += trainerLevels;
      }

      // Get trainer name
      let trainerName = `Trainer #${tId}`;
      try {
        const trainerData = await this.trainerRepository.findById(tId);
        if (trainerData) {
          trainerName = trainerData.name;
        }
      } catch {
        // Ignore name lookup errors
      }

      trainerRewards.push({
        trainerId: tId,
        trainerName,
        levels: trainerLevels,
        coins: trainerCoins,
        cappedLevels: 0,
        isGift: tIsGift,
        isOwned,
      });
    }

    // Process monster rewards
    const monsterRewards: MonsterReward[] = [];

    for (let i = 0; i < processedMonsters.length; i++) {
      const monster = processedMonsters[i];
      if (!monster) { continue; }
      const { monsterId: mId, trainerId: mTrainerId, isGift: mIsGift = false } = monster;

      const participantIndex = processedTrainers.length + i;
      let monsterLevels = levelsPerParticipant + (participantIndex < remainderLevels ? 1 : 0);
      const monsterCoins = coinsPerParticipant + (participantIndex < remainderCoins ? 1 : 0);

      // Check level cap and look up name
      let cappedLevels = 0;
      let monsterName: string | undefined;
      if (mId) {
        try {
          const monsterData = await this.monsterRepository.findById(mId);
          if (monsterData) {
            monsterName = monsterData.name;
            const currentLevel = monsterData.level;
            if (currentLevel >= 100) {
              cappedLevels = monsterLevels;
              monsterLevels = 0;
            } else if (currentLevel + monsterLevels > 100) {
              cappedLevels = currentLevel + monsterLevels - 100;
              monsterLevels = 100 - currentLevel;
            }
          }
        } catch {
          // Ignore level cap check errors
        }
      }

      // Check trainer ownership
      let isTrainerOwned = true;
      if (mTrainerId && userId) {
        try {
          const trainerData = await this.trainerRepository.findById(mTrainerId);
          if (trainerData) {
            isTrainerOwned = trainerData.player_user_id === String(userId);
          }
        } catch {
          // Default to owned
        }
      }

      if (!isTrainerOwned) {
        totalGiftLevels += monsterLevels + cappedLevels;
      }

      monsterRewards.push({
        monsterId: mId,
        name: monsterName,
        trainerId: mTrainerId,
        levels: monsterLevels,
        coins: monsterCoins,
        cappedLevels,
        isGift: mIsGift,
        isTrainerOwned,
      });
    }

    // Process NPCs - each NPC gets a participant share, which becomes gift levels
    const npcStartIndex = processedTrainers.length + processedMonsters.length;
    for (let i = 0; i < npcs.length; i++) {
      const participantIndex = npcStartIndex + i;
      const npcLevels = levelsPerParticipant + (participantIndex < remainderLevels ? 1 : 0);
      totalGiftLevels += npcLevels;
    }

    // Calculate bonuses: totalLevels / rand(2-4) + rand(1-4), each independently
    const gardenPoints = Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1;
    const missionProgress = Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1;
    const bossDamage = Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1;

    // Calculate gift items (1 item per 5 gift levels)
    const giftItems: GiftItem[] = [];
    if (totalGiftLevels > 0) {
      const itemCount = Math.ceil(totalGiftLevels / 5);
      const itemCategories = ['berries', 'pastries', 'balls', 'antiques', 'helditems'];

      for (let i = 0; i < itemCount; i++) {
        try {
          const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)] ?? 'items';
          const rolledItem = await this.itemRollerService.rollOne({ category: randomCategory as ItemCategoryValue });
          if (rolledItem) {
            giftItems.push({
              category: randomCategory,
              name: rolledItem.name,
              quantity: 1,
            });
          }
        } catch {
          // Fallback
          const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)] ?? 'items';
          giftItems.push({
            category: randomCategory,
            name: `Random ${randomCategory.slice(0, -1)}`,
            quantity: 1,
          });
        }
      }
    }

    return {
      totalLevels,
      totalCoins,
      trainerRewards,
      monsterRewards,
      gardenPoints,
      missionProgress,
      bossDamage,
      totalGiftLevels,
      giftItems,
    };
  }

  // ==========================================================================
  // Gift Items
  // ==========================================================================

  /**
   * Calculate gift items for art submissions
   */
  private async calculateGiftItems(
    isGift: boolean,
    trainerRewards: TrainerReward[],
    monsterRewards: MonsterReward[]
  ): Promise<GiftItem[]> {
    const giftItems: GiftItem[] = [];

    if (!isGift) {
      return giftItems;
    }

    const itemCategories = ['items', 'balls', 'berries', 'pastries', 'antique', 'helditems'];

    // Process trainers
    for (const trainer of trainerRewards) {
      if (trainer.isGift && trainer.levels > 0) {
        const itemCount = Math.ceil(trainer.levels / 5);

        for (let i = 0; i < itemCount; i++) {
          try {
            const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)] ?? 'items';
            const rolledItem = await this.itemRollerService.rollOne({ category: randomCategory as ItemCategoryValue });
            if (rolledItem) {
              giftItems.push({
                category: randomCategory,
                name: rolledItem.name,
                quantity: 1,
                recipientType: 'trainer',
                recipientId: trainer.trainerId,
              });
            }
          } catch {
            // Ignore roll errors
          }
        }
      }
    }

    // Process monsters
    for (const monster of monsterRewards) {
      if (monster.isGift && monster.levels > 0) {
        const itemCount = Math.ceil(monster.levels / 5);

        for (let i = 0; i < itemCount; i++) {
          try {
            const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)] ?? 'items';
            const rolledItem = await this.itemRollerService.rollOne({ category: randomCategory as ItemCategoryValue });
            if (rolledItem) {
              giftItems.push({
                category: randomCategory,
                name: rolledItem.name,
                quantity: 1,
                recipientType: 'monster',
                recipientId: monster.monsterId,
              });
            }
          } catch {
            // Ignore roll errors
          }
        }
      }
    }

    return giftItems;
  }

  // ==========================================================================
  // Level Cap Check
  // ==========================================================================

  /**
   * Check for monsters that would exceed level cap
   * @param monsterRewards - Array of monster rewards
   * @returns Capped monsters and adjusted rewards
   */
  async checkLevelCaps(monsterRewards: MonsterReward[]): Promise<LevelCapResult> {
    const cappedMonsters: LevelCapResult['cappedMonsters'] = [];
    const adjustedRewards: MonsterReward[] = [];

    const LEVEL_CAP = 100;

    for (const reward of monsterRewards) {
      try {
        const monster = await this.monsterRepository.findById(reward.monsterId);
        if (!monster) {
          adjustedRewards.push(reward);
          continue;
        }

        const currentLevel = monster.level || 1;
        const levelsToGain = reward.levels || 0;
        const existingCappedLevels = reward.cappedLevels || 0;
        const originalLevels = levelsToGain + existingCappedLevels;
        const newLevel = currentLevel + originalLevels;

        if (newLevel > LEVEL_CAP || existingCappedLevels > 0) {
          const excessLevels = Math.max(newLevel - LEVEL_CAP, existingCappedLevels);

          cappedMonsters.push({
            monsterId: reward.monsterId,
            name: monster.species1,
            currentLevel,
            originalLevels,
            cappedLevels: existingCappedLevels,
            excessLevels,
            trainerId: monster.trainer_id,
            trainerName: 'Unknown',
          });

          adjustedRewards.push({
            ...reward,
            levels: levelsToGain,
          });
        } else {
          adjustedRewards.push(reward);
        }
      } catch {
        adjustedRewards.push(reward);
      }
    }

    return { cappedMonsters, adjustedRewards };
  }

  // ==========================================================================
  // Reward Application
  // ==========================================================================

  /**
   * Apply rewards from a submission
   * @param rewards - Calculated rewards
   * @param userId - User ID
   * @param submissionId - Submission ID
   * @returns Applied rewards result
   */
  async applyRewards(
    rewards: ArtRewardResult | WritingRewardResult,
    userId: number,
    submissionId: number
  ): Promise<AppliedRewardsResult> {
    const result: AppliedRewardsResult = {
      trainers: [],
      monsters: [],
      gardenPoints: rewards.gardenPoints,
      missionProgress: rewards.missionProgress,
      bossDamage: rewards.bossDamage,
      giftLevels: 0,
      giftCoins: 0,
      giftItems: [],
      cappedLevels: 0,
    };

    let totalGiftLevels = 0;
    let totalGiftCoins = 0;
    let totalCappedLevels = 0;

    // Apply trainer rewards
    if (rewards.trainerRewards) {
      for (const trainerReward of rewards.trainerRewards) {
        const { trainerId, levels, coins, cappedLevels = 0, isOwned } = trainerReward;

        if (!isOwned) {
          totalGiftLevels += levels;
          totalGiftCoins += coins;
        }

        if (levels > 0) {
          await this.trainerRepository.addLevels(trainerId, levels);
        }
        if (coins > 0) {
          await this.trainerRepository.updateCurrency(trainerId, coins);
        }

        if (cappedLevels > 0) {
          totalCappedLevels += cappedLevels;
        }

        result.trainers.push({
          trainerId,
          levels,
          coins,
          cappedLevels: cappedLevels > 0 ? Math.ceil(cappedLevels / 2) : 0,
        });
      }
    }

    // Apply monster rewards
    if (rewards.monsterRewards) {
      for (const monsterReward of rewards.monsterRewards) {
        const { monsterId, levels, coins, cappedLevels = 0, isTrainerOwned } = monsterReward;

        if (!isTrainerOwned) {
          totalGiftLevels += levels;
        }

        if (levels > 0) {
          await this.monsterRepository.addLevels(monsterId, levels);
        }

        if (coins > 0 && monsterReward.trainerId) {
          await this.trainerRepository.updateCurrency(monsterReward.trainerId, coins);
        }

        if (cappedLevels > 0) {
          totalCappedLevels += cappedLevels;
        }

        result.monsters.push({
          monsterId,
          name: monsterReward.name,
          levels,
          cappedLevels: cappedLevels > 0 ? Math.ceil(cappedLevels / 2) : 0,
        });
      }
    }

    // Store gift items
    if ('giftItems' in rewards && rewards.giftItems.length > 0) {
      result.giftItems = rewards.giftItems;
    }

    // Update totals
    if (totalGiftLevels > 0 || totalGiftCoins > 0 || totalCappedLevels > 0) {
      await this.updateSubmissionRewards(submissionId, totalGiftLevels, totalGiftCoins, totalCappedLevels);
      result.giftLevels = totalGiftLevels;
      result.giftCoins = totalGiftCoins;
      result.cappedLevels = Math.ceil(totalCappedLevels / 2);
    }

    // Apply garden points
    if (rewards.gardenPoints > 0) {
      try {
        await this.gardenPointRepository.addPoints(userId, rewards.gardenPoints);
      } catch (err) {
        console.error('[applyRewards] Failed to add garden points:', err);
      }
    }

    // Apply mission progress
    if (rewards.missionProgress > 0) {
      try {
        const missionResult = await this.userMissionRepository.addProgress(String(userId), rewards.missionProgress);
        result.missionProgress = {
          amount: rewards.missionProgress,
          success: true,
          message: missionResult.completedMissions.length > 0
            ? `Completed ${missionResult.completedMissions.length} mission(s)!`
            : `Added ${rewards.missionProgress} mission progress`,
        };
      } catch (err) {
        console.error('[applyRewards] Failed to add mission progress:', err);
        result.missionProgress = rewards.missionProgress;
      }
    }

    // Apply boss damage
    if (rewards.bossDamage > 0) {
      try {
        const activeBoss = await this.bossRepository.findActiveBoss();
        if (activeBoss) {
          await this.bossRepository.addDamage(activeBoss.id, userId, rewards.bossDamage, submissionId);
          // Update boss HP
          const newHp = Math.max(0, activeBoss.currentHp - rewards.bossDamage);
          await this.bossRepository.update(activeBoss.id, {
            currentHp: newHp,
            status: newHp <= 0 ? 'defeated' : activeBoss.status,
          });
          result.bossDamage = { amount: rewards.bossDamage, results: [] };
        }
      } catch (err) {
        console.error('[applyRewards] Failed to add boss damage:', err);
        result.bossDamage = rewards.bossDamage;
      }
    }

    return result;
  }

  /**
   * Update submission with gift and capped levels
   */
  private async updateSubmissionRewards(
    submissionId: number,
    giftLevels: number,
    giftCoins: number,
    cappedLevels: number
  ): Promise<void> {
    await db.query(
      `UPDATE submissions SET gift_levels = $1, gift_coins = $2, capped_levels = $3 WHERE id = $4`,
      [giftLevels, giftCoins, Math.ceil(cappedLevels / 2), submissionId]
    );
  }

  // ==========================================================================
  // Gift Allocation
  // ==========================================================================

  /**
   * Allocate gift levels to a trainer or monster
   */
  async allocateGiftLevels(
    submissionId: number,
    recipientType: 'trainer' | 'monster',
    recipientId: number,
    levels: number
  ): Promise<{ success: boolean; remainingGiftLevels: number }> {
    // Get submission
    const result = await db.query<{ gift_levels: number }>(
      'SELECT gift_levels FROM submissions WHERE id = $1',
      [submissionId]
    );

    const submission = result.rows[0];
    if (!submission) {
      throw new Error(`Submission with ID ${submissionId} not found`);
    }

    const currentGiftLevels = submission.gift_levels;

    if (currentGiftLevels < levels) {
      throw new Error(`Not enough gift levels available. Requested: ${levels}, Available: ${currentGiftLevels}`);
    }

    // Apply levels
    if (recipientType === 'trainer') {
      await this.trainerRepository.addLevels(recipientId, levels);
    } else {
      await this.monsterRepository.addLevels(recipientId, levels);
    }

    // Update submission
    await db.query(
      'UPDATE submissions SET gift_levels = gift_levels - $1 WHERE id = $2',
      [levels, submissionId]
    );

    return {
      success: true,
      remainingGiftLevels: currentGiftLevels - levels,
    };
  }

  /**
   * Allocate gift coins to a trainer
   */
  async allocateGiftCoins(
    submissionId: number,
    trainerId: number,
    coins: number
  ): Promise<{ success: boolean; remainingGiftCoins: number }> {
    // Get submission
    const result = await db.query<{ gift_coins: number }>(
      'SELECT gift_coins FROM submissions WHERE id = $1',
      [submissionId]
    );

    const submission = result.rows[0];
    if (!submission) {
      throw new Error(`Submission with ID ${submissionId} not found`);
    }

    const currentGiftCoins = submission.gift_coins;

    if (currentGiftCoins < coins) {
      throw new Error(`Not enough gift coins available. Requested: ${coins}, Available: ${currentGiftCoins}`);
    }

    // Apply coins
    await this.trainerRepository.updateCurrency(trainerId, coins);

    // Update submission
    await db.query(
      'UPDATE submissions SET gift_coins = gift_coins - $1 WHERE id = $2',
      [coins, submissionId]
    );

    return {
      success: true,
      remainingGiftCoins: currentGiftCoins - coins,
    };
  }

  /**
   * Allocate capped levels to a trainer or monster
   */
  async allocateCappedLevels(
    submissionId: number,
    recipientType: 'trainer' | 'monster',
    recipientId: number,
    levels: number
  ): Promise<{ success: boolean; remainingCappedLevels: number }> {
    // Get submission
    const result = await db.query<{ capped_levels: number }>(
      'SELECT capped_levels FROM submissions WHERE id = $1',
      [submissionId]
    );

    const submission = result.rows[0];
    if (!submission) {
      throw new Error(`Submission with ID ${submissionId} not found`);
    }

    const currentCappedLevels = submission.capped_levels;

    if (currentCappedLevels < levels) {
      throw new Error(`Not enough capped levels available. Requested: ${levels}, Available: ${currentCappedLevels}`);
    }

    // Apply levels
    if (recipientType === 'trainer') {
      await this.trainerRepository.addLevels(recipientId, levels);
    } else {
      await this.monsterRepository.addLevels(recipientId, levels);
    }

    // Update submission
    await db.query(
      'UPDATE submissions SET capped_levels = capped_levels - $1 WHERE id = $2',
      [levels, submissionId]
    );

    return {
      success: true,
      remainingCappedLevels: currentCappedLevels - levels,
    };
  }

  // ==========================================================================
  // External Submission Rewards
  // ==========================================================================

  calculateExternalArtRewards(data: ExternalArtSubmissionData): ExternalRewardResult {
    const { quality, backgrounds = [], characters = [] } = data;

    const baseLevels = ART_QUALITY_BASE_LEVELS[quality] ?? 2;

    let backgroundBonus = 0;
    for (const bg of backgrounds) {
      const bgValue = BACKGROUND_BONUS_LEVELS[bg.type] ?? 0;
      backgroundBonus = Math.max(backgroundBonus, bgValue);
    }

    let characterLevels = 0;
    for (const char of characters) {
      const appearanceBonus = APPEARANCE_BONUS_LEVELS[char.appearance] ?? 0;
      const complexityBonus = EXTERNAL_CHARACTER_COMPLEXITY[char.complexity] ?? 0;
      characterLevels += appearanceBonus + complexityBonus;
    }

    const rawLevels = baseLevels + backgroundBonus + characterLevels;
    const totalLevels = Math.floor(rawLevels / EXTERNAL_REWARD_RATES.artLevelDivisor);
    const totalCoins = totalLevels * EXTERNAL_REWARD_RATES.coinsPerLevel;

    const gardenPoints = Math.floor(
      (Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1) / EXTERNAL_REWARD_RATES.bonusRewardDivisor
    );
    const missionProgress = Math.floor(
      (Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1) / EXTERNAL_REWARD_RATES.bonusRewardDivisor
    );
    const bossDamage = Math.floor(
      (Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1) / EXTERNAL_REWARD_RATES.bonusRewardDivisor
    );

    return { totalLevels, totalCoins, gardenPoints, missionProgress, bossDamage };
  }

  calculateExternalWritingRewards(data: ExternalWritingSubmissionData): ExternalRewardResult {
    const totalLevels = Math.floor(data.wordCount / EXTERNAL_REWARD_RATES.wordsPerLevel);
    const totalCoins = totalLevels * EXTERNAL_REWARD_RATES.coinsPerLevel;

    const gardenPoints = Math.floor(
      (Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1) / EXTERNAL_REWARD_RATES.bonusRewardDivisor
    );
    const missionProgress = Math.floor(
      (Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1) / EXTERNAL_REWARD_RATES.bonusRewardDivisor
    );
    const bossDamage = Math.floor(
      (Math.floor(totalLevels / (Math.floor(Math.random() * 3) + 2)) + Math.floor(Math.random() * 4) + 1) / EXTERNAL_REWARD_RATES.bonusRewardDivisor
    );

    return { totalLevels, totalCoins, gardenPoints, missionProgress, bossDamage };
  }

  async applyExternalBonusRewards(
    rewards: ExternalRewardResult,
    userId: number,
    submissionId: number
  ): Promise<void> {
    if (rewards.gardenPoints > 0) {
      try {
        await this.gardenPointRepository.addPoints(userId, rewards.gardenPoints);
      } catch (err) {
        console.error('[applyExternalBonusRewards] Failed to add garden points:', err);
      }
    }

    if (rewards.missionProgress > 0) {
      try {
        await this.userMissionRepository.addProgress(String(userId), rewards.missionProgress);
      } catch (err) {
        console.error('[applyExternalBonusRewards] Failed to add mission progress:', err);
      }
    }

    if (rewards.bossDamage > 0) {
      try {
        const activeBoss = await this.bossRepository.findActiveBoss();
        if (activeBoss) {
          await this.bossRepository.addDamage(activeBoss.id, userId, rewards.bossDamage, submissionId);
          const newHp = Math.max(0, activeBoss.currentHp - rewards.bossDamage);
          await this.bossRepository.update(activeBoss.id, {
            currentHp: newHp,
            status: newHp <= 0 ? 'defeated' : activeBoss.status,
          });
        }
      } catch (err) {
        console.error('[applyExternalBonusRewards] Failed to add boss damage:', err);
      }
    }
  }

  async allocateExternalLevels(
    submissionId: number,
    recipientType: 'trainer' | 'monster',
    recipientId: number,
    levels: number
  ): Promise<{ success: boolean; remainingExternalLevels: number; coinsAwarded: number }> {
    const result = await db.query<{ external_levels: number }>(
      'SELECT external_levels FROM submissions WHERE id = $1',
      [submissionId]
    );

    const submission = result.rows[0];
    if (!submission) {
      throw new Error(`Submission with ID ${submissionId} not found`);
    }

    if (submission.external_levels < levels) {
      throw new Error(`Not enough external levels available. Requested: ${levels}, Available: ${submission.external_levels}`);
    }

    // Apply levels to recipient
    if (recipientType === 'trainer') {
      await this.trainerRepository.addLevels(recipientId, levels);
      // Award coins to the trainer
      const coins = levels * DEFAULT_REWARD_RATES.coinsPerLevel;
      await this.trainerRepository.updateCurrency(recipientId, coins);

      await db.query(
        'UPDATE submissions SET external_levels = external_levels - $1, external_coins = external_coins - $2 WHERE id = $3',
        [levels, coins, submissionId]
      );

      return {
        success: true,
        remainingExternalLevels: submission.external_levels - levels,
        coinsAwarded: coins,
      };
    } else {
      // Monster - apply levels, award coins to monster's trainer
      await this.monsterRepository.addLevels(recipientId, levels);

      let trainerId: number | null = null;
      try {
        const monster = await this.monsterRepository.findById(recipientId);
        if (monster) {
          trainerId = monster.trainer_id;
        }
      } catch {
        // Ignore lookup errors
      }

      const coins = levels * DEFAULT_REWARD_RATES.coinsPerLevel;
      if (trainerId) {
        await this.trainerRepository.updateCurrency(trainerId, coins);
      }

      await db.query(
        'UPDATE submissions SET external_levels = external_levels - $1, external_coins = external_coins - $2 WHERE id = $3',
        [levels, coins, submissionId]
      );

      return {
        success: true,
        remainingExternalLevels: submission.external_levels - levels,
        coinsAwarded: coins,
      };
    }
  }
}
