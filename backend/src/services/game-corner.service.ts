import { randomUUID } from 'crypto';
import { db } from '../database';
import {
  TrainerRepository,
  TrainerInventoryRepository,
  MonsterRepository,
  BazarRepository,
} from '../repositories';
import type {
  TrainerWithStats,
  MonsterCreateInput,
  MonsterRow,
  UserPublic,
  MonsterRollerSettings,
  InventoryCategory,
  BazarMonsterCreateInput,
} from '../repositories';
import { MonsterRollerService, type UserSettings, type RollParams } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import { ItemRollerService } from './item-roller.service';
import type { MonsterTable } from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

export type GameCornerSessionInput = {
  completedSessions: number;
  totalFocusMinutes: number;
  productivityScore: number;
  forceMonsterRoll?: boolean;
};

export type RewardType = 'coin' | 'item' | 'level' | 'monster';

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';

type MonsterTier =
  | 'normal'
  | 'evolved'
  | 'mythical_pokemon'
  | 'legendary_pokemon'
  | 'ultimate_digimon'
  | 'srank_yokai';

type CoinRewardData = {
  amount: number;
  title: string;
};

type ItemRewardData = {
  name: string;
  quantity: number;
  title: string;
  description: string;
  category: string;
};

type LevelRewardData = {
  levels: number;
  isMonster: boolean;
  title: string;
  description: string;
};

type MonsterRewardData = {
  species1: string | null;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  title: string;
  description: string;
  tier: MonsterTier;
  is_special: boolean;
};

export type GameCornerReward = {
  id: string;
  type: RewardType;
  reward_type: RewardType;
  rarity: RewardRarity;
  reward_data: CoinRewardData | ItemRewardData | LevelRewardData | MonsterRewardData;
  assigned_to: number | null;
  claimed: boolean;
  claimed_by?: number | null;
  claimed_at?: string | null;
  claimed_by_monster_id?: number;
  claimed_by_monster_name?: string;
  claimed_by_type?: string;
};

type MultiplierResult = {
  timeBonus: number;
  sessionBonus: number;
  performanceBonus: number;
  combined: number;
};

export type GameCornerResult = {
  sessionId: string;
  rewards: GameCornerReward[];
  trainers: TrainerWithStats[];
  stats: {
    completedSessions: number;
    totalFocusMinutes: number;
    productivityScore: number;
    combinedMultiplier: number;
  };
};

// ============================================================================
// Service
// ============================================================================

export class GameCornerService {
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private monsterRepository: MonsterRepository;
  private monsterInitializer: MonsterInitializerService;
  private itemRoller: ItemRollerService;
  private bazarRepository: BazarRepository;

  constructor(
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    monsterRepository?: MonsterRepository,
    monsterInitializer?: MonsterInitializerService,
    itemRoller?: ItemRollerService,
  ) {
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.monsterInitializer = monsterInitializer ?? new MonsterInitializerService();
    this.itemRoller = itemRoller ?? new ItemRollerService();
    this.bazarRepository = new BazarRepository();
  }

  // ==========================================================================
  // Main Entry Point
  // ==========================================================================

  async generateRewards(
    input: GameCornerSessionInput,
    userId: string,
    user: UserPublic,
  ): Promise<GameCornerResult> {
    const trainers = await this.trainerRepository.findByUserId(userId);
    console.log(`Game Corner: Found ${trainers.length} trainers for user ${userId}`);

    const multipliers = this.calculateMultipliers(input);
    const userSettings = this.resolveUserSettings(user);
    const isAdmin = user.is_admin === true;

    const rewards: GameCornerReward[] = [];
    const getRandomTrainerId = () => this.pickRandomTrainerId(trainers);

    // Handle forced monster roll
    if (input.forceMonsterRoll) {
      console.log('Force monster roll activated!');
      const monsterReward = await this.generateMonsterReward(getRandomTrainerId(), userSettings);
      if (monsterReward) {
        rewards.push(monsterReward);
      }
    }

    // Admin testing: guarantee at least one monster
    if (isAdmin && !input.forceMonsterRoll) {
      console.log('Admin detected — guaranteeing at least 1 monster reward for testing');
      const monsterReward = await this.generateMonsterReward(getRandomTrainerId(), userSettings);
      if (monsterReward) {
        rewards.push(monsterReward);
      }
    }

    // Generate the reward slots
    const baseCoinAmount = this.calculateBaseCoinAmount(input, multipliers.combined);
    const totalSlots = this.calculateRewardSlotCount(input);
    const chances = this.calculateRewardChances(multipliers.combined, totalSlots);

    console.log(
      `Generating ${totalSlots} reward slots for Game Corner ` +
      `(multiplier: ${multipliers.combined.toFixed(2)}x)`,
    );

    for (let slot = 0; slot < totalSlots; slot++) {
      const roll = Math.random();

      if (roll < chances.coin || slot === 0) {
        rewards.push(this.generateCoinReward(getRandomTrainerId(), baseCoinAmount));
      } else if (roll < chances.coin + chances.item) {
        const itemReward = await this.generateItemReward(
          getRandomTrainerId(),
          input.totalFocusMinutes,
          input.completedSessions,
        );
        if (itemReward) {
          rewards.push(itemReward);
        }
      } else if (roll < chances.coin + chances.item + chances.level) {
        rewards.push(
          this.generateLevelReward(getRandomTrainerId(), input.totalFocusMinutes, input.completedSessions),
        );
      } else if (roll < chances.coin + chances.item + chances.level + chances.monster) {
        const monsterReward = await this.generateMonsterReward(getRandomTrainerId(), userSettings);
        if (monsterReward) {
          rewards.push(monsterReward);
        }
      }
    }

    // Ensure at least one reward
    if (rewards.length === 0) {
      rewards.push(this.generateCoinReward(getRandomTrainerId(), baseCoinAmount));
    }

    console.log(
      'Generated Game Corner rewards:',
      rewards.map((r) => ({ type: r.type, assigned_to: r.assigned_to, title: r.reward_data.title })),
    );

    // Auto-claim all rewards
    for (const reward of rewards) {
      await this.autoClaimReward(reward, trainers);
    }

    const sessionId = randomUUID();
    return {
      sessionId,
      rewards,
      trainers,
      stats: {
        completedSessions: input.completedSessions,
        totalFocusMinutes: input.totalFocusMinutes,
        productivityScore: input.productivityScore,
        combinedMultiplier: multipliers.combined,
      },
    };
  }

  // ==========================================================================
  // Manual Claim (for the /claim endpoint)
  // ==========================================================================

  async claimReward(
    trainerId: number,
    rewardType: RewardType,
    rewardData: CoinRewardData | ItemRewardData | LevelRewardData | MonsterRewardData,
    playerUserId: string,
  ): Promise<void> {
    switch (rewardType) {
      case 'coin':
        await this.claimCoinReward(trainerId, (rewardData as CoinRewardData).amount);
        break;
      case 'item': {
        const itemData = rewardData as ItemRewardData;
        const category = (itemData.category || 'items') as InventoryCategory;
        await this.inventoryRepository.addItem(trainerId, category, itemData.name, itemData.quantity);
        break;
      }
      case 'level': {
        const levelData = rewardData as LevelRewardData;
        await this.claimLevelReward(trainerId, levelData.levels, levelData.isMonster);
        break;
      }
      case 'monster':
        await this.claimMonsterReward(trainerId, playerUserId, rewardData as MonsterRewardData);
        break;
    }
  }

  // ==========================================================================
  // Forfeit Monster Reward (send to bazar)
  // ==========================================================================

  async forfeitMonsterReward(
    rewardData: MonsterRewardData,
    playerUserId: string,
    monsterName?: string,
  ): Promise<{ success: boolean; bazarMonsterId: number }> {
    const trimmedName = (monsterName ?? '').trim();
    const name = trimmedName || (rewardData.species1 as string) || 'Game Corner Monster';

    const bazarInput: BazarMonsterCreateInput = {
      originalMonsterId: -1,
      forfeitedByTrainerId: -1,
      forfeitedByUserId: playerUserId,
      name,
      species1: (rewardData.species1 as string) ?? 'Unknown',
      species2: (rewardData.species2 as string) ?? null,
      species3: (rewardData.species3 as string) ?? null,
      type1: (rewardData.type1 as string) ?? 'Normal',
      type2: (rewardData.type2 as string) ?? null,
      type3: (rewardData.type3 as string) ?? null,
      type4: (rewardData.type4 as string) ?? null,
      type5: (rewardData.type5 as string) ?? null,
      attribute: (rewardData.attribute as string) ?? null,
      level: (rewardData.level as number) ?? 5,
    };

    const bazarMonster = await this.bazarRepository.createMonster(bazarInput);

    try {
      await this.bazarRepository.recordTransaction(
        'forfeit_monster',
        'monster',
        bazarMonster.id,
        -1,
        playerUserId,
        null,
        null,
        { game_corner_reward: true, monster_name: name, species: rewardData.species1 }
      );
    } catch (txError) {
      console.error('Error recording game corner monster forfeit transaction:', txError);
    }

    return { success: true, bazarMonsterId: bazarMonster.id };
  }

  // ==========================================================================
  // Multiplier Calculation
  // ==========================================================================

  private calculateMultipliers(input: GameCornerSessionInput): MultiplierResult {
    const timeBonus = Math.min(2.0, input.totalFocusMinutes / 50);
    const sessionBonus = Math.min(1.5, input.completedSessions / 4);
    const performanceBonus = input.productivityScore / 200;
    const combined = 1 + timeBonus + sessionBonus + performanceBonus;

    console.log(
      `Game Corner scaling: time=${timeBonus.toFixed(2)}, ` +
      `session=${sessionBonus.toFixed(2)}, ` +
      `performance=${performanceBonus.toFixed(2)}, ` +
      `total=${combined.toFixed(2)}x`,
    );

    return { timeBonus, sessionBonus, performanceBonus, combined };
  }

  private calculateBaseCoinAmount(input: GameCornerSessionInput, multiplier: number): number {
    return Math.floor(
      (80 + input.completedSessions * 15 + input.totalFocusMinutes * 2) * multiplier,
    );
  }

  private calculateRewardSlotCount(input: GameCornerSessionInput): number {
    const base = Math.max(2, Math.floor(1 + input.completedSessions * 0.8));
    const bonus = Math.floor(Math.random() * Math.max(1, Math.floor(input.totalFocusMinutes / 30)));
    return base + bonus;
  }

  private calculateRewardChances(
    multiplier: number,
    totalSlots: number,
  ): { coin: number; item: number; level: number; monster: number } {
    const coin = Math.min(2.0, 0.6 + multiplier * 0.2) / totalSlots;
    const item = Math.min(1.8, 0.4 + multiplier * 0.15) / totalSlots;
    const level = Math.min(1.5, 0.3 + multiplier * 0.1) / totalSlots;
    const monster = Math.min(0.8, 0.05 + multiplier * 0.08) / totalSlots;
    return { coin, item, level, monster };
  }

  // ==========================================================================
  // Reward Generation
  // ==========================================================================

  private generateCoinReward(trainerId: number | null, baseAmount: number): GameCornerReward {
    // Gambling variance: 30% to 300% of base
    const gamblingMultiplier = 0.3 + Math.random() * 2.7;
    const amount = Math.floor(baseAmount * gamblingMultiplier);

    return {
      id: `coin-${randomUUID()}`,
      type: 'coin',
      reward_type: 'coin',
      rarity: 'common',
      reward_data: { amount, title: 'Coins' },
      assigned_to: trainerId,
      claimed: false,
    };
  }

  private async generateItemReward(
    trainerId: number | null,
    totalFocusMinutes: number,
    completedSessions: number,
  ): Promise<GameCornerReward | null> {
    try {
      const item = await this.itemRoller.rollOne({
        category: ['items', 'berries', 'balls', 'pastries'],
        rarity: this.pickItemRarity(),
      });

      if (!item) {
        return this.generateFallbackItemReward(trainerId, totalFocusMinutes, completedSessions);
      }

      const quantity = this.calculateItemQuantity(
        item.rarity ?? 'common',
        totalFocusMinutes,
        completedSessions,
      );

      return {
        id: `item-${randomUUID()}`,
        type: 'item',
        reward_type: 'item',
        rarity: (item.rarity as RewardRarity) ?? 'common',
        reward_data: {
          name: item.name,
          quantity,
          title: `${quantity} ${item.name}${quantity > 1 ? 's' : ''}`,
          description: item.description ?? `${quantity} ${item.name}${quantity > 1 ? 's' : ''} from the Game Corner.`,
          category: item.category ?? 'items',
        },
        assigned_to: trainerId,
        claimed: false,
      };
    } catch (error) {
      console.error('Error generating item reward:', error);
      return this.generateFallbackItemReward(trainerId, totalFocusMinutes, completedSessions);
    }
  }

  private generateFallbackItemReward(
    trainerId: number | null,
    totalFocusMinutes: number,
    completedSessions: number,
  ): GameCornerReward {
    const quantity = this.calculateItemQuantity('common', totalFocusMinutes, completedSessions);
    return {
      id: `item-${randomUUID()}`,
      type: 'item',
      reward_type: 'item',
      rarity: 'common',
      reward_data: {
        name: 'Potion',
        quantity,
        title: `${quantity} Potion${quantity > 1 ? 's' : ''}`,
        description: `${quantity} Potion${quantity > 1 ? 's' : ''} from the Game Corner.`,
        category: 'items',
      },
      assigned_to: trainerId,
      claimed: false,
    };
  }

  private generateLevelReward(
    trainerId: number | null,
    totalFocusMinutes: number,
    completedSessions: number,
  ): GameCornerReward {
    const timeScale = Math.max(1, totalFocusMinutes / 25);
    const sessionScale = Math.max(1, completedSessions / 2);
    const maxLevels = Math.min(15, Math.floor(1 + timeScale * sessionScale * 2.5));
    const levels = Math.floor(Math.random() * maxLevels) + 1;
    const isMonster = Math.random() < 0.4;

    const target = isMonster ? 'Monster' : 'Trainer';
    return {
      id: `level-${randomUUID()}`,
      type: 'level',
      reward_type: 'level',
      rarity: 'uncommon',
      reward_data: {
        levels,
        isMonster,
        title: `${levels} Level${levels > 1 ? 's' : ''} for ${target}`,
        description: `${levels} level${levels > 1 ? 's' : ''} for ${isMonster ? 'a random monster' : 'your trainer'}`,
      },
      assigned_to: trainerId,
      claimed: false,
    };
  }

  private async generateMonsterReward(
    trainerId: number | null,
    userSettings: UserSettings,
  ): Promise<GameCornerReward | null> {
    try {
      const { tier, rollParams, rarity: baseRarity, levelRange } = this.determineMonsterTier();

      const enabledTables = this.resolveEnabledTables(userSettings);
      const finalTables = this.applyUserSettingsToTables(rollParams, enabledTables);

      console.log(
        `Game Corner monster generation — User enabled: [${enabledTables.join(', ')}], ` +
        `Using: [${finalTables.join(', ')}]`,
      );

      const roller = new MonsterRollerService({
        seed: `game-corner-${tier}-${Date.now()}-${Math.random()}`,
        enabledTables: finalTables,
        userSettings,
      });

      const monster = await roller.rollMonster(rollParams);
      if (!monster) {
        return null;
      }

      const rarity = this.determineMonsterRarity(monster, baseRarity);
      const level = Math.floor(Math.random() * (levelRange[1] - levelRange[0] + 1)) + levelRange[0];
      const { title, description } = this.buildMonsterDescription(tier, monster.species1 ?? 'Unknown');

      return {
        id: `monster-${randomUUID()}`,
        type: 'monster',
        reward_type: 'monster',
        rarity,
        reward_data: {
          species1: monster.species1 ?? null,
          species2: monster.species2 ?? null,
          species3: monster.species3 ?? null,
          type1: monster.type1 ?? null,
          type2: monster.type2 ?? null,
          type3: monster.type3 ?? null,
          type4: monster.type4 ?? null,
          type5: monster.type5 ?? null,
          attribute: monster.attribute ?? null,
          level,
          title,
          description,
          tier,
          is_special: tier !== 'normal',
        },
        assigned_to: trainerId,
        claimed: false,
      };
    } catch (error) {
      console.error('Error generating monster reward:', error);
      return null;
    }
  }

  // ==========================================================================
  // Monster Tier System
  // ==========================================================================

  private determineMonsterTier(): {
    tier: MonsterTier;
    rollParams: RollParams;
    rarity: RewardRarity;
    levelRange: [number, number];
  } {
    const roll = Math.random();

    // 0.01% — Legendary Pokemon
    if (roll < 0.0001) {
      console.log('LEGENDARY POKEMON rolled in Game Corner! (0.01% chance)');
      return {
        tier: 'legendary_pokemon',
        rollParams: {
          includeStages: ['Base Stage', 'Stage 1', 'Stage 2'],
          legendary: true,
          mythical: false,
          enabledTables: ['pokemon'] as MonsterTable[],
        },
        rarity: 'legendary',
        levelRange: [10, 25],
      };
    }

    // 0.1% — Mythical / Ultimate / S-Rank
    if (roll < 0.001) {
      const subRoll = Math.random();

      if (subRoll < 0.33) {
        console.log('MYTHICAL POKEMON rolled in Game Corner! (0.033% chance)');
        return {
          tier: 'mythical_pokemon',
          rollParams: {
            includeStages: ['Base Stage', 'Stage 1'],
            legendary: false,
            mythical: true,
            enabledTables: ['pokemon'] as MonsterTable[],
          },
          rarity: 'mythical',
          levelRange: [8, 20],
        };
      }

      if (subRoll < 0.66) {
        console.log('ULTIMATE DIGIMON rolled in Game Corner! (0.033% chance)');
        return {
          tier: 'ultimate_digimon',
          rollParams: {
            includeRanks: ['Ultimate'],
            enabledTables: ['digimon'] as MonsterTable[],
          },
          rarity: 'mythical',
          levelRange: [8, 20],
        };
      }

      console.log('S-RANK YOKAI rolled in Game Corner! (0.033% chance)');
      return {
        tier: 'srank_yokai',
        rollParams: {
          includeRanks: ['S'],
          enabledTables: ['yokai'] as MonsterTable[],
        },
        rarity: 'mythical',
        levelRange: [8, 20],
      };
    }

    // 2% — Evolved
    if (roll < 0.02) {
      console.log('EVOLVED MONSTER rolled in Game Corner! (2% chance)');
      return {
        tier: 'evolved',
        rollParams: {
          includeStages: ['Stage 1', 'Stage 2'],
          includeRanks: ['Child', 'Adult', 'Perfect', 'A', 'B'],
        },
        rarity: 'epic',
        levelRange: [5, 12],
      };
    }

    // Normal
    return {
      tier: 'normal',
      rollParams: {
        includeStages: ['Base Stage', "Doesn't Evolve"],
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
      },
      rarity: 'rare',
      levelRange: [1, 5],
    };
  }

  private determineMonsterRarity(
    monster: { is_legendary?: boolean; is_mythical?: boolean; stage?: string | null; rank?: string | null },
    baseRarity: RewardRarity,
  ): RewardRarity {
    if (monster.is_legendary) {
      return 'legendary';
    }
    if (monster.is_mythical || monster.rank === 'Ultimate' || monster.rank === 'S') {
      return 'mythical';
    }
    if (monster.stage === 'Stage 2' || monster.rank === 'Perfect' || monster.rank === 'A') {
      return 'epic';
    }
    if (monster.stage === 'Stage 1' || monster.rank === 'Adult' || monster.rank === 'B') {
      return 'rare';
    }
    return baseRarity;
  }

  private buildMonsterDescription(
    tier: MonsterTier,
    speciesName: string,
  ): { title: string; description: string } {
    switch (tier) {
      case 'legendary_pokemon':
        return {
          title: `LEGENDARY ${speciesName}`,
          description: `A LEGENDARY ${speciesName} has emerged from the depths of the Game Corner! This is incredibly rare!`,
        };
      case 'mythical_pokemon':
        return {
          title: `MYTHICAL ${speciesName}`,
          description: `A MYTHICAL ${speciesName} has blessed you from the Game Corner! Extraordinary luck!`,
        };
      case 'ultimate_digimon':
        return {
          title: `ULTIMATE ${speciesName}`,
          description: `An ULTIMATE level ${speciesName} has digitized from the Game Corner! Ultimate power!`,
        };
      case 'srank_yokai':
        return {
          title: `S-RANK ${speciesName}`,
          description: `An S-RANK ${speciesName} has manifested from the Game Corner! Supreme spiritual energy!`,
        };
      case 'evolved':
        return {
          title: speciesName,
          description: `An evolved ${speciesName} has appeared from the Game Corner! Higher power awaits!`,
        };
      default:
        return {
          title: speciesName,
          description: `A wild ${speciesName} appeared from the Game Corner!`,
        };
    }
  }

  // ==========================================================================
  // Auto-Claim
  // ==========================================================================

  private async autoClaimReward(
    reward: GameCornerReward,
    trainers: TrainerWithStats[],
  ): Promise<void> {
    if (reward.assigned_to === null) {
      console.warn(`Cannot auto-claim reward ${reward.id}: no trainer assigned`);
      return;
    }

    const trainerId = reward.assigned_to;

    try {
      switch (reward.type) {
        case 'coin':
          await this.claimCoinReward(trainerId, (reward.reward_data as CoinRewardData).amount);
          console.log(`AUTO-CLAIMED: ${(reward.reward_data as CoinRewardData).amount} coins for trainer ${trainerId}`);
          break;

        case 'item': {
          const itemData = reward.reward_data as ItemRewardData;
          const category = (itemData.category || 'items') as InventoryCategory;
          await this.inventoryRepository.addItem(trainerId, category, itemData.name, itemData.quantity);
          console.log(`AUTO-CLAIMED: ${itemData.quantity} ${itemData.name} (${category}) for trainer ${trainerId}`);
          break;
        }

        case 'level': {
          const levelData = reward.reward_data as LevelRewardData;
          if (levelData.isMonster) {
            await this.claimMonsterLevelReward(reward, trainerId);
          } else {
            await this.trainerRepository.addLevels(trainerId, levelData.levels);
            console.log(`AUTO-CLAIMED: ${levelData.levels} level(s) for trainer ${trainerId}`);
          }
          break;
        }

        case 'monster': {
          const monsterData = reward.reward_data as MonsterRewardData;
          const trainer = trainers.find((t) => t.id === trainerId);
          const playerUserId = trainer?.player_user_id ?? '';
          await this.claimMonsterReward(trainerId, playerUserId, monsterData);
          console.log(
            `AUTO-CLAIMED: ${monsterData.species1} (Level ${monsterData.level}) for trainer ${trainerId}`,
          );
          break;
        }
      }

      reward.claimed = true;
      reward.claimed_by = trainerId;
      reward.claimed_at = new Date().toISOString();
    } catch (error) {
      console.error('Error auto-claiming reward:', error);
    }
  }

  // ==========================================================================
  // Claim Helpers
  // ==========================================================================

  private async claimCoinReward(trainerId: number, amount: number): Promise<void> {
    await this.trainerRepository.updateCurrency(trainerId, amount);
  }

  private async claimLevelReward(
    trainerId: number,
    levels: number,
    isMonster: boolean,
  ): Promise<void> {
    if (isMonster) {
      const randomMonster = await this.getRandomMonsterForTrainer(trainerId);
      if (randomMonster) {
        await this.monsterInitializer.levelUpMonster(randomMonster.id, levels);
        console.log(
          `MONSTER LEVEL REWARD: Added ${levels} level(s) to monster ` +
          `"${randomMonster.name || randomMonster.species1}" (ID: ${randomMonster.id})`,
        );
      } else {
        // No monsters — fall back to trainer levels
        await this.trainerRepository.addLevels(trainerId, levels);
        console.log(`No monsters found for trainer ${trainerId}, giving levels to trainer instead`);
      }
    } else {
      await this.trainerRepository.addLevels(trainerId, levels);
    }
  }

  private async claimMonsterLevelReward(
    reward: GameCornerReward,
    trainerId: number,
  ): Promise<void> {
    const levelData = reward.reward_data as LevelRewardData;
    try {
      const randomMonster = await this.getRandomMonsterForTrainer(trainerId);
      if (randomMonster) {
        const updatedMonster = await this.monsterInitializer.levelUpMonster(
          randomMonster.id,
          levelData.levels,
        );
        console.log(
          `AUTO-CLAIMED: ${levelData.levels} level(s) for monster ` +
          `"${randomMonster.name || randomMonster.species1}". ` +
          `Level: ${randomMonster.level ?? 1} -> ${updatedMonster.level ?? 'unknown'}`,
        );
        reward.claimed_by_monster_id = randomMonster.id;
        reward.claimed_by_monster_name = randomMonster.name || randomMonster.species1;
        reward.claimed_by_type = 'monster';
      } else {
        await this.trainerRepository.addLevels(trainerId, levelData.levels);
        console.log(`AUTO-CLAIMED: ${levelData.levels} level(s) for trainer ${trainerId} (no monsters found)`);
      }
    } catch (error) {
      console.error('Error adding levels to monster:', error);
      await this.trainerRepository.addLevels(trainerId, levelData.levels);
      console.log(`AUTO-CLAIMED: ${levelData.levels} level(s) for trainer ${trainerId} (fallback)`);
    }
  }

  private async claimMonsterReward(
    trainerId: number,
    playerUserId: string,
    monsterData: MonsterRewardData,
  ): Promise<void> {
    const createInput: MonsterCreateInput = {
      trainerId,
      playerUserId,
      name: monsterData.species1 ?? 'Game Corner Monster',
      species1: monsterData.species1 ?? 'Unknown',
      species2: monsterData.species2,
      species3: monsterData.species3,
      type1: monsterData.type1 ?? 'Normal',
      type2: monsterData.type2,
      type3: monsterData.type3,
      attribute: monsterData.attribute,
      level: monsterData.level || 1,
      whereMet: 'Game Corner',
    };

    const created = await this.monsterRepository.create(createInput);
    if (created?.id) {
      await this.monsterInitializer.initializeMonster(created.id);
      console.log(
        `Created ${monsterData.species1} (Level ${monsterData.level}) for trainer ${trainerId} — ` +
        `Fully initialized with ID ${created.id}`,
      );
    }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private async getRandomMonsterForTrainer(trainerId: number): Promise<MonsterRow | null> {
    const result = await db.query<MonsterRow>(
      'SELECT * FROM monsters WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1',
      [trainerId],
    );
    return result.rows[0] ?? null;
  }

  private pickRandomTrainerId(trainers: TrainerWithStats[]): number | null {
    if (trainers.length === 0) {
      console.warn('No trainers available for reward assignment');
      return null;
    }
    const index = Math.floor(Math.random() * trainers.length);
    const trainer = trainers[index];
    if (!trainer) {
      return null;
    }
    console.log(`Assigning reward to trainer: ${trainer.name} (ID: ${trainer.id})`);
    return trainer.id;
  }

  private resolveUserSettings(user: UserPublic): UserSettings {
    const defaults: UserSettings = {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
    };

    if (!user.monster_roller_settings) {
      return defaults;
    }

    const settings: MonsterRollerSettings = user.monster_roller_settings;
    return {
      pokemon: settings.pokemon ?? true,
      digimon: settings.digimon ?? true,
      yokai: settings.yokai ?? true,
      nexomon: settings.nexomon ?? true,
      pals: settings.pals ?? true,
      fakemon: settings.fakemon ?? true,
      finalfantasy: settings.finalfantasy ?? true,
      monsterhunter: settings.monsterhunter ?? true,
    };
  }

  private resolveEnabledTables(userSettings: UserSettings): MonsterTable[] {
    const tables: MonsterTable[] = [];
    if (userSettings.pokemon) {
      tables.push('pokemon');
    }
    if (userSettings.digimon) {
      tables.push('digimon');
    }
    if (userSettings.yokai) {
      tables.push('yokai');
    }
    if (userSettings.nexomon) {
      tables.push('nexomon');
    }
    if (userSettings.pals) {
      tables.push('pals');
    }
    if (userSettings.fakemon) {
      tables.push('fakemon');
    }
    if (userSettings.finalfantasy) {
      tables.push('finalfantasy');
    }
    if (userSettings.monsterhunter) {
      tables.push('monsterhunter');
    }

    if (tables.length === 0) {
      console.warn('No monster types enabled for user, defaulting to pokemon only');
      tables.push('pokemon');
    }

    return tables;
  }

  private applyUserSettingsToTables(
    rollParams: RollParams,
    enabledTables: MonsterTable[],
  ): MonsterTable[] {
    if (rollParams.enabledTables && rollParams.enabledTables.length > 0) {
      // Filter special-tier tables by user settings
      const filtered = rollParams.enabledTables.filter((t) => enabledTables.includes(t));
      if (filtered.length > 0) {
        return filtered;
      }

      // If filtering removes everything, fall back to user's full list
      console.log(
        `Special tier had no enabled tables matching user settings, using user settings: ${enabledTables.join(', ')}`,
      );
    }
    return enabledTables;
  }

  private pickItemRarity(): string {
    const roll = Math.random();
    if (roll < 0.1) {
      return 'rare';
    }
    if (roll < 0.35) {
      return 'uncommon';
    }
    return 'common';
  }

  private calculateItemQuantity(
    rarity: string,
    totalFocusMinutes: number,
    completedSessions: number,
  ): number {
    const timeScale = Math.max(1, totalFocusMinutes / 25);
    const sessionScale = Math.max(1, completedSessions / 2);
    const scale = timeScale * sessionScale;

    let base: number;
    let max: number;

    switch (rarity.toLowerCase()) {
      case 'common':
        base = 2;
        max = Math.min(9, Math.floor(2 + scale * 2));
        break;
      case 'uncommon':
        base = 1;
        max = Math.min(6, Math.floor(1 + scale * 1.5));
        break;
      default:
        base = 1;
        max = Math.min(4, Math.floor(1 + scale));
        break;
    }

    return Math.floor(Math.random() * (max - base + 1)) + base;
  }
}
