import {
  AdventureRepository,
  AdventureEncounterRow,
} from '../../repositories/adventure.repository';
import { AdventureParticipantRepository } from '../../repositories/adventure-participant.repository';
import { ItemRepository } from '../../repositories/item.repository';

// ============================================================================
// Types
// ============================================================================

export type BattleOutcome = 'victory' | 'retreat' | 'draw';

export type BattleOutcomeConfig = {
  weight: number;
  coinMultiplier: number;
  itemChance: number;
};

export type BattleOutcomes = {
  victory: BattleOutcomeConfig;
  retreat: BattleOutcomeConfig;
  draw: BattleOutcomeConfig;
};

export type ItemReward = {
  id: number;
  name: string;
  description: string | null;
  rarity: string | null;
  quantity: number;
};

export type BattleRewards = {
  coins: number;
  items: ItemReward[];
};

export type BattleResolutionData = {
  encounterId: number;
  discordUserId: string;
};

export type BattleResolutionResult = {
  outcome: BattleOutcome;
  rewards: BattleRewards;
  resolvedBy: string;
};

export type BattleStatistics = {
  totalBattles: number;
  victories: number;
  retreats: number;
  draws: number;
  totalCoinsEarned: number;
  totalItemsEarned: number;
};

export type BattleDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export type RarityWeights = {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
};

export type EncounterData = {
  trainers?: unknown[];
  monsters?: unknown[];
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for resolving battle encounters in adventures
 */
export class BattleService {
  private adventureRepository: AdventureRepository;
  private adventureParticipantRepository: AdventureParticipantRepository;
  private itemRepository: ItemRepository;

  private battleOutcomes: BattleOutcomes = {
    victory: { weight: 50, coinMultiplier: 1.5, itemChance: 0.4 },
    retreat: { weight: 30, coinMultiplier: 0.8, itemChance: 0.2 },
    draw: { weight: 20, coinMultiplier: 1.0, itemChance: 0.3 },
  };

  constructor(
    adventureRepository?: AdventureRepository,
    adventureParticipantRepository?: AdventureParticipantRepository,
    itemRepository?: ItemRepository
  ) {
    this.adventureRepository = adventureRepository ?? new AdventureRepository();
    this.adventureParticipantRepository =
      adventureParticipantRepository ?? new AdventureParticipantRepository();
    this.itemRepository = itemRepository ?? new ItemRepository();
  }

  /**
   * Resolve a battle encounter
   */
  async resolveBattle(battleData: BattleResolutionData): Promise<BattleResolutionResult> {
    const { encounterId, discordUserId } = battleData;

    // Get encounter data from adventure
    const encounter = await this.getEncounterById(encounterId);
    if (!encounter || encounter?.encounter_type !== 'battle') {
      throw new Error('Invalid battle encounter');
    }

    if (this.isEncounterResolved(encounter)) {
      throw new Error('Battle encounter already resolved');
    }

    // Roll battle outcome
    const outcome = this.rollBattleOutcome();

    // Parse encounter data
    const encounterData = this.parseEncounterData(encounter.encounter_data);

    // Calculate rewards
    const rewards = await this.calculateBattleRewards(encounterData, outcome);

    // Distribute rewards to all participants
    await this.distributeRewardsToParticipants(encounter.adventure_id, rewards);

    // Mark encounter as resolved
    await this.adventureRepository.updateEncounter(encounterId, { isResolved: true });

    return {
      outcome,
      rewards,
      resolvedBy: discordUserId,
    };
  }

  /**
   * Roll battle outcome based on weights
   */
  rollBattleOutcome(): BattleOutcome {
    const totalWeight = Object.values(this.battleOutcomes).reduce(
      (sum, outcome) => sum + outcome.weight,
      0
    );
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [outcome, data] of Object.entries(this.battleOutcomes)) {
      currentWeight += data.weight;
      if (roll <= currentWeight) {
        return outcome as BattleOutcome;
      }
    }

    return 'victory'; // Fallback
  }

  /**
   * Calculate battle rewards based on encounter and outcome
   */
  async calculateBattleRewards(
    encounterData: EncounterData,
    outcome: BattleOutcome
  ): Promise<BattleRewards> {
    const outcomeData = this.battleOutcomes[outcome];
    const rewards: BattleRewards = {
      coins: 0,
      items: [],
    };

    // Calculate base coin reward
    const enemyCount =
      (encounterData.trainers?.length ?? 0) + (encounterData.monsters?.length ?? 0);
    const baseCoinReward = enemyCount * 100 + Math.floor(Math.random() * 200); // 100-300 per enemy
    rewards.coins = Math.floor(baseCoinReward * outcomeData.coinMultiplier);

    // Roll for item rewards
    if (Math.random() < outcomeData.itemChance) {
      const itemRewards = await this.rollBattleItems(outcome, enemyCount);
      rewards.items = itemRewards;
    }

    return rewards;
  }

  /**
   * Roll for battle item rewards
   */
  async rollBattleItems(outcome: BattleOutcome, enemyCount: number): Promise<ItemReward[]> {
    const items: ItemReward[] = [];

    // Determine number of items to roll
    let itemCount = 1;
    if (outcome === 'victory' && enemyCount >= 3) {
      itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items for big victories
    }

    // Get available items
    const availableItemsResult = await this.itemRepository.findAll({ limit: 1000 });
    const availableItems = availableItemsResult.data;

    for (let i = 0; i < itemCount; i++) {
      // Roll for item rarity based on outcome
      const rarityWeights = this.getItemRarityWeights(outcome);
      const rarity = this.rollItemRarity(rarityWeights);

      // Filter items by rarity
      const rarityItems = availableItems.filter(
        (item) => item.rarity?.toLowerCase() === rarity.toLowerCase()
      );

      if (rarityItems.length > 0) {
        const randomItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
        if (randomItem) {
          items.push({
            id: randomItem.id,
            name: randomItem.name,
            description: randomItem.description,
            rarity: randomItem.rarity,
            quantity: 1,
          });
        }
      } else if (availableItems.length > 0) {
        // Fallback to any item if no items of the rolled rarity exist
        const fallbackItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        if (fallbackItem) {
          items.push({
            id: fallbackItem.id,
            name: fallbackItem.name,
            description: fallbackItem.description,
            rarity: fallbackItem.rarity,
            quantity: 1,
          });
        }
      }
    }

    return items;
  }

  /**
   * Get item rarity weights based on battle outcome
   */
  getItemRarityWeights(outcome: BattleOutcome): RarityWeights {
    const baseWeights: RarityWeights = {
      common: 50,
      uncommon: 30,
      rare: 15,
      epic: 4,
      legendary: 1,
    };

    switch (outcome) {
      case 'victory':
        return {
          common: 30,
          uncommon: 35,
          rare: 25,
          epic: 8,
          legendary: 2,
        };
      case 'retreat':
        return {
          common: 70,
          uncommon: 20,
          rare: 8,
          epic: 2,
          legendary: 0,
        };
      case 'draw':
        return baseWeights;
      default:
        return baseWeights;
    }
  }

  /**
   * Roll item rarity based on weights
   */
  rollItemRarity(rarityWeights: RarityWeights): string {
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      currentWeight += weight;
      if (roll <= currentWeight) {
        return rarity;
      }
    }

    return 'common'; // Fallback
  }

  /**
   * Distribute rewards to all adventure participants
   */
  async distributeRewardsToParticipants(
    adventureId: number,
    rewards: BattleRewards
  ): Promise<void> {
    // Get all participants for this adventure
    const participants = await this.adventureParticipantRepository.findByAdventureId(adventureId);

    // For now, just log the distribution
    // In a full implementation, you would add these rewards to adventure logs
    console.log(`Distributing battle rewards to ${participants.length} participants:`);
    console.log(`- Coins: ${rewards.coins} each`);
    console.log(`- Items: ${rewards.items.map((item) => item.name).join(', ')}`);

    // TODO: Implement actual reward distribution to adventure logs
    // This would involve creating or updating adventure_logs entries for each participant
  }

  /**
   * Get battle statistics for an adventure
   */
  async getBattleStatistics(adventureId: number): Promise<BattleStatistics> {
    const encounters = await this.adventureRepository.getEncounters(adventureId);
    const battles = encounters.filter(
      (e) => e.encounter_type === 'battle' && this.isEncounterResolved(e)
    );

    const stats: BattleStatistics = {
      totalBattles: battles.length,
      victories: 0,
      retreats: 0,
      draws: 0,
      totalCoinsEarned: 0,
      totalItemsEarned: 0,
    };

    // Parse battle results from encounter data if stored
    // For now, just count battles
    stats.totalBattles = battles.length;

    return stats;
  }

  /**
   * Check if a battle encounter can be resolved
   */
  async canResolveBattle(encounterId: number): Promise<boolean> {
    const encounter = await this.getEncounterById(encounterId);

    return (
      encounter !== null &&
      encounter.encounter_type === 'battle' &&
      !this.isEncounterResolved(encounter)
    );
  }

  /**
   * Get battle difficulty based on encounter data
   */
  getBattleDifficulty(encounterData: EncounterData): BattleDifficulty {
    const enemyCount =
      (encounterData.trainers?.length ?? 0) + (encounterData.monsters?.length ?? 0);

    if (enemyCount <= 2) {
      return 'easy';
    }
    if (enemyCount <= 4) {
      return 'medium';
    }
    if (enemyCount <= 6) {
      return 'hard';
    }
    return 'extreme';
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get encounter by ID
   */
  private async getEncounterById(encounterId: number): Promise<AdventureEncounterRow | null> {
    // Get all encounters and find the one with matching ID
    // This is a workaround since there's no direct getEncounterById method
    // TODO: Add getEncounterById to AdventureRepository for better performance
    const adventures = await this.adventureRepository.findAll({ limit: 1000 });
    for (const adventure of adventures.adventures) {
      const encounters = await this.adventureRepository.getEncounters(adventure.id);
      const encounter = encounters.find((e) => e.id === encounterId);
      if (encounter) {
        return encounter;
      }
    }
    return null;
  }

  /**
   * Check if encounter is resolved
   */
  private isEncounterResolved(encounter: AdventureEncounterRow): boolean {
    return encounter.is_resolved;
  }

  /**
   * Parse encounter data from string
   */
  private parseEncounterData(data: string | null): EncounterData {
    if (!data) {
      return { trainers: [], monsters: [] };
    }
    try {
      return JSON.parse(data) as EncounterData;
    } catch {
      return { trainers: [], monsters: [] };
    }
  }
}
