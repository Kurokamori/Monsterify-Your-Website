import {
  AdventureRepository,
  Adventure,
  AdventureLogRepository,
  AdventureLogWithDetails,
  AdventureLogCreateInput,
  AdventureParticipantRepository,
  AdventureParticipantWithDetails,
  ItemRepository,
  ItemRow,
  ItemEarned,
  TrainerRepository,
  TrainerInventoryRepository,
  UserRepository,
} from '../../repositories';

export type RewardRates = {
  wordsPerLevel: number;
  wordsPerCoin: number;
  wordsPerItem: number;
};

export type ParticipantRewards = {
  participant_id: number;
  discord_user_id: string;
  user_id: number | null;
  username: string | null;
  word_count: number;
  message_count: number;
  levels_earned: number;
  coins_earned: number;
  items_earned: ItemEarned[];
};

export type AdventureCompletionResult = {
  adventure: Adventure;
  participants: ParticipantRewards[];
  adventureLogs: AdventureLogWithDetails[];
  totalStats: TotalStatistics;
  completedBy: string;
};

export type TotalStatistics = {
  totalParticipants: number;
  totalWords: number;
  totalMessages: number;
  totalLevels: number;
  totalCoins: number;
  totalItems: number;
  averageWordsPerParticipant: number;
  topContributor: { username: string; word_count: number } | null;
};

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type UnclaimedReward = {
  id: number;
  adventure_id: number;
  adventure_title: string | null;
  adventure_description: string | null;
  word_count: number;
  message_count: number;
  levels_earned: number;
  coins_earned: number;
  items_earned: ItemEarned[];
  created_at: Date;
  is_claimed: boolean;
};

export type ClaimData = {
  adventureLogId: number;
  userId: number;
  levelAllocations?: Record<number, number>; // trainerId -> levels
  itemAllocations?: Record<number, number[]>; // trainerId -> itemIds
};

export type ClaimResult = {
  success: boolean;
  message: string;
  adventureLogId: number;
  userId: number;
};

export type AdventureStatistics = {
  adventure_id: number;
  title: string;
  status: string;
  participant_count: number;
  total_words: number;
  total_messages: number;
  encounter_count: number;
  created_at: Date;
  completed_at: Date | null;
};

const DEFAULT_REWARD_RATES: RewardRates = {
  wordsPerLevel: 50,
  wordsPerCoin: 1,
  wordsPerItem: 1000,
};

const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

/**
 * Service for calculating and managing adventure rewards
 */
export class AdventureRewardService {
  private adventureRepository: AdventureRepository;
  private adventureLogRepository: AdventureLogRepository;
  private participantRepository: AdventureParticipantRepository;
  private itemRepository: ItemRepository;
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private userRepository: UserRepository;
  private rewardRates: RewardRates;

  constructor(
    adventureRepository?: AdventureRepository,
    adventureLogRepository?: AdventureLogRepository,
    participantRepository?: AdventureParticipantRepository,
    itemRepository?: ItemRepository,
    rewardRates?: Partial<RewardRates>,
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    userRepository?: UserRepository
  ) {
    this.adventureRepository = adventureRepository ?? new AdventureRepository();
    this.adventureLogRepository = adventureLogRepository ?? new AdventureLogRepository();
    this.participantRepository = participantRepository ?? new AdventureParticipantRepository();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.userRepository = userRepository ?? new UserRepository();
    this.rewardRates = { ...DEFAULT_REWARD_RATES, ...rewardRates };
  }

  /**
   * End adventure and calculate rewards for all participants
   * @param completionData - Adventure completion data
   * @returns Completion result with rewards
   */
  async endAdventure(completionData: {
    adventureId: number;
    discordUserId: string;
  }): Promise<AdventureCompletionResult> {
    const { adventureId, discordUserId } = completionData;

    // Get adventure
    const adventure = await this.adventureRepository.findById(adventureId);
    if (!adventure) {
      throw new Error('Adventure not found');
    }

    if (adventure.status !== 'active') {
      throw new Error('Adventure is not active');
    }

    // Get all participants
    const participants = await this.participantRepository.findByAdventureId(adventureId);
    if (participants.length === 0) {
      throw new Error('No participants found for this adventure');
    }

    // Calculate rewards for each participant
    const participantRewards = await Promise.all(
      participants.map((participant) => this.calculateParticipantRewards(participant))
    );

    // Create adventure logs for each participant
    const adventureLogs = await Promise.all(
      participantRewards.map((reward) => this.createAdventureLog(adventureId, reward))
    );

    // Mark adventure as completed
    await this.adventureRepository.update(adventureId, {
      status: 'completed',
      completedAt: new Date(),
    });

    // Calculate total statistics
    const totalStats = this.calculateTotalStatistics(participantRewards);

    return {
      adventure,
      participants: participantRewards,
      adventureLogs,
      totalStats,
      completedBy: discordUserId,
    };
  }

  /**
   * Calculate rewards for a single participant
   * @param participant - Participant data
   * @returns Calculated rewards
   */
  async calculateParticipantRewards(
    participant: AdventureParticipantWithDetails
  ): Promise<ParticipantRewards> {
    const wordCount = participant.wordCount || 0;

    // Calculate levels (50 words = 1 level by default)
    const levelsEarned = Math.floor(wordCount / this.rewardRates.wordsPerLevel);

    // Calculate coins (1 word = 1 coin by default)
    const coinsEarned = Math.floor(wordCount / this.rewardRates.wordsPerCoin);

    // Calculate items (every 1,000 words = 1 item by default)
    const itemCount = Math.floor(wordCount / this.rewardRates.wordsPerItem);
    const itemsEarned = await this.rollRewardItems(itemCount);

    return {
      participant_id: participant.id,
      discord_user_id: participant.discordUserId,
      user_id: participant.userId,
      username: participant.username,
      word_count: wordCount,
      message_count: participant.messageCount || 0,
      levels_earned: levelsEarned,
      coins_earned: coinsEarned,
      items_earned: itemsEarned,
    };
  }

  /**
   * Roll reward items for a participant
   * @param itemCount - Number of items to roll
   * @returns Array of rolled items
   */
  async rollRewardItems(itemCount: number): Promise<ItemEarned[]> {
    if (itemCount <= 0) {return [];}

    const items: ItemEarned[] = [];
    const itemsResult = await this.itemRepository.findAll({ limit: 1000 });
    const availableItems = itemsResult.data || [];

    if (!Array.isArray(availableItems) || availableItems.length === 0) {
      console.warn('No items available for rewards');
      return [];
    }

    for (let i = 0; i < itemCount; i++) {
      // Roll for item rarity
      const rarity = this.rollItemRarity();

      // Filter items by rarity
      const rarityItems = availableItems.filter(
        (item) => item.rarity?.toLowerCase() === rarity.toLowerCase()
      );

      let selectedItem: ItemRow | undefined;
      if (rarityItems.length > 0) {
        selectedItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
      } else {
        // Fallback to any item
        selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      }

      if (selectedItem) {
        items.push({
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: 1,
          rarity: selectedItem.rarity ?? undefined,
          description: selectedItem.description ?? undefined,
        });
      }
    }

    return items;
  }

  /**
   * Roll item rarity for adventure rewards
   * @returns Item rarity
   */
  rollItemRarity(): ItemRarity {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      currentWeight += weight;
      if (roll <= currentWeight) {
        return rarity as ItemRarity;
      }
    }

    return 'common'; // Fallback
  }

  /**
   * Create adventure log entry for a participant
   * @param adventureId - Adventure ID
   * @param rewardData - Participant reward data
   * @returns Created adventure log
   */
  async createAdventureLog(
    adventureId: number,
    rewardData: ParticipantRewards
  ): Promise<AdventureLogWithDetails> {
    const logData: AdventureLogCreateInput = {
      adventureId,
      discordUserId: rewardData.discord_user_id,
      userId: rewardData.user_id ?? undefined,
      wordCount: rewardData.word_count,
      levelsEarned: rewardData.levels_earned,
      coinsEarned: rewardData.coins_earned,
      itemsEarned: rewardData.items_earned,
    };

    const adventureLog = await this.adventureLogRepository.create(logData);
    console.log(`Created adventure log for ${rewardData.username ?? rewardData.discord_user_id}`);

    // Fetch the full log with details
    const fullLog = await this.adventureLogRepository.findById(adventureLog.id);
    if (!fullLog) {
      throw new Error('Failed to retrieve created adventure log');
    }

    return fullLog;
  }

  /**
   * Calculate total statistics for the adventure
   * @param participantRewards - Array of participant reward data
   * @returns Total statistics
   */
  calculateTotalStatistics(participantRewards: ParticipantRewards[]): TotalStatistics {
    const stats: TotalStatistics = {
      totalParticipants: participantRewards.length,
      totalWords: 0,
      totalMessages: 0,
      totalLevels: 0,
      totalCoins: 0,
      totalItems: 0,
      averageWordsPerParticipant: 0,
      topContributor: null,
    };

    let topWordCount = 0;

    participantRewards.forEach((reward) => {
      stats.totalWords += reward.word_count;
      stats.totalMessages += reward.message_count;
      stats.totalLevels += reward.levels_earned;
      stats.totalCoins += reward.coins_earned;
      stats.totalItems += reward.items_earned.length;

      if (reward.word_count > topWordCount) {
        topWordCount = reward.word_count;
        stats.topContributor = {
          username: reward.username ?? 'Unknown',
          word_count: reward.word_count,
        };
      }
    });

    stats.averageWordsPerParticipant =
      stats.totalParticipants > 0 ? Math.round(stats.totalWords / stats.totalParticipants) : 0;

    return stats;
  }

  /**
   * Get unclaimed adventure rewards for a Discord user
   * @param discordUserId - Discord user ID
   * @returns Array of unclaimed adventure logs
   */
  async getUnclaimedRewards(discordUserId: string): Promise<UnclaimedReward[]> {
    console.log(`Getting unclaimed rewards for Discord user: ${discordUserId}`);

    const unclaimedLogs = await this.adventureLogRepository.findUnclaimedByDiscordUser(discordUserId);

    // Format the logs for the frontend
    const formattedRewards: UnclaimedReward[] = unclaimedLogs.map((log) => ({
      id: log.id,
      adventure_id: log.adventureId,
      adventure_title: log.adventureTitle,
      adventure_description: log.adventureDescription,
      word_count: log.wordCount,
      message_count: 0, // Not stored in adventure_logs
      levels_earned: log.levelsEarned,
      coins_earned: log.coinsEarned,
      items_earned: log.itemsEarned,
      created_at: log.createdAt,
      is_claimed: log.isClaimed,
    }));

    console.log(`Found ${formattedRewards.length} unclaimed rewards for user ${discordUserId}`);
    return formattedRewards;
  }

  /**
   * Claim adventure rewards
   * @param claimData - Claim data
   * @returns Claim result
   */
  async claimRewards(claimData: ClaimData): Promise<ClaimResult> {
    const { adventureLogId, userId, levelAllocations, itemAllocations } = claimData;

    // Validate claim data
    if (!adventureLogId || !userId) {
      throw new Error('Missing required claim data');
    }

    // Get the adventure log
    const log = await this.adventureLogRepository.findById(adventureLogId);
    if (!log) {
      throw new Error('Adventure log not found');
    }

    if (log.isClaimed) {
      throw new Error('Rewards already claimed');
    }

    // Validate the adventure log belongs to the user
    if (log.userId !== null && log.userId !== userId) {
      throw new Error('This reward does not belong to you');
    }

    console.log(`Processing reward claim for adventure log ${adventureLogId}`);

    // Look up the user to get their discord_id for trainer lookup
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const discordId = user.discord_id;
    if (!discordId) {
      throw new Error('User does not have a linked Discord account');
    }

    // Helper to get user's trainers
    const getUserTrainers = async () => this.trainerRepository.findByUserId(discordId);

    // Apply level allocations to trainers
    if (levelAllocations && Object.keys(levelAllocations).length > 0) {
      const totalAllocated = Object.values(levelAllocations).reduce((sum, lvl) => sum + lvl, 0);
      if (totalAllocated > log.levelsEarned) {
        throw new Error(
          `Cannot allocate ${totalAllocated} levels — only ${log.levelsEarned} earned`
        );
      }

      for (const [trainerIdStr, levels] of Object.entries(levelAllocations)) {
        const trainerId = parseInt(trainerIdStr, 10);
        if (levels > 0 && !isNaN(trainerId)) {
          await this.trainerRepository.addLevels(trainerId, levels);
          console.log(`Added ${levels} level(s) to trainer ${trainerId}`);
        }
      }
    } else if (log.levelsEarned > 0) {
      // If no allocations specified, apply to first trainer
      const trainers = await getUserTrainers();
      if (trainers.length > 0 && trainers[0]) {
        await this.trainerRepository.addLevels(trainers[0].id, log.levelsEarned);
        console.log(`Added ${log.levelsEarned} level(s) to trainer ${trainers[0].id} (default)`);
      }
    }

    // Apply coins to the user's first trainer
    if (log.coinsEarned > 0) {
      const trainers = await getUserTrainers();
      if (trainers.length > 0 && trainers[0]) {
        await this.trainerRepository.updateCurrency(trainers[0].id, log.coinsEarned);
        console.log(`Added ${log.coinsEarned} coins to trainer ${trainers[0].id}`);
      }
    }

    // Apply item allocations to trainer inventories
    if (itemAllocations && Object.keys(itemAllocations).length > 0) {
      for (const [trainerIdStr, itemIds] of Object.entries(itemAllocations)) {
        const trainerId = parseInt(trainerIdStr, 10);
        if (isNaN(trainerId)) {continue;}

        for (const itemId of itemIds) {
          const item = log.itemsEarned.find((i) => i.itemId === itemId);
          if (item) {
            const itemRecord = await this.itemRepository.findById(item.itemId);
            const category = itemRecord?.category?.toLowerCase() ?? 'items';
            await this.inventoryRepository.addItem(
              trainerId,
              category as 'items' | 'balls' | 'berries' | 'pastries' | 'evolution' | 'eggs' | 'antiques' | 'helditems' | 'seals' | 'keyitems',
              item.itemName,
              item.quantity
            );
            console.log(`Added ${item.quantity}x ${item.itemName} to trainer ${trainerId}`);
          }
        }
      }
    } else if (log.itemsEarned.length > 0) {
      // If no allocations specified, add items to user's first trainer
      const trainers = await getUserTrainers();
      if (trainers.length > 0 && trainers[0]) {
        for (const item of log.itemsEarned) {
          const itemRecord = await this.itemRepository.findById(item.itemId);
          const category = itemRecord?.category?.toLowerCase() ?? 'items';
          await this.inventoryRepository.addItem(
            trainers[0].id,
            category as 'items' | 'balls' | 'berries' | 'pastries' | 'evolution' | 'eggs' | 'antiques' | 'helditems' | 'seals' | 'keyitems',
            item.itemName,
            item.quantity
          );
          console.log(`Added ${item.quantity}x ${item.itemName} to trainer ${trainers[0].id} (default)`);
        }
      }
    }

    // Mark as claimed
    await this.adventureLogRepository.markAsClaimed(adventureLogId);

    return {
      success: true,
      message: 'Rewards claimed successfully',
      adventureLogId,
      userId,
    };
  }

  /**
   * Get adventure completion statistics
   * @param adventureId - Adventure ID
   * @returns Adventure statistics
   */
  async getAdventureStatistics(adventureId: number): Promise<AdventureStatistics> {
    const adventure = await this.adventureRepository.findById(adventureId);
    if (!adventure) {
      throw new Error('Adventure not found');
    }

    const participantStats = await this.participantRepository.getStatsByAdventure(adventureId);

    return {
      adventure_id: adventureId,
      title: adventure.title,
      status: adventure.status,
      participant_count: participantStats.totalParticipants,
      total_words: participantStats.totalWords,
      total_messages: participantStats.totalMessages,
      encounter_count: adventure.encounterCount,
      created_at: adventure.createdAt,
      completed_at: adventure.completedAt,
    };
  }

  /**
   * Get current reward rates
   * @returns Reward rates
   */
  getRewardRates(): RewardRates {
    return { ...this.rewardRates };
  }

  /**
   * Update reward rates
   * @param rates - New rates (partial)
   */
  setRewardRates(rates: Partial<RewardRates>): void {
    this.rewardRates = { ...this.rewardRates, ...rates };
  }
}
