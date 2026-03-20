import { db } from '../database';
import {
  TrainerRepository,
  TrainerInventoryRepository,
  ItemRepository,
  ItemRow,
  MonsterRepository,
  MonsterCreateInput,
} from '../repositories';
import { SpecialBerryService } from './special-berry.service';
import { MonsterRollerService } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import { consumeBallFromInventory } from '../utils/ballUtils';

export type RewardItem = {
  item_id?: number;
  item_name?: string;
  quantity?: number;
  chance?: number;
};

export type PromptRewards = {
  levels?: number;
  coins?: number;
  items?: RewardItem[];
  monster_roll?: {
    enabled: boolean;
    parameters?: MonsterRollParameters;
  };
  bonus_conditions?: {
    quality_threshold: number;
    bonus_levels?: number;
    bonus_coins?: number;
    bonus_items?: RewardItem[];
  };
};

export type MonsterRollParameters = {
  legendary_allowed?: boolean;
  mythical_allowed?: boolean;
  max_stage?: number;
  baby_allowed?: boolean;
  [key: string]: unknown;
};

export type RolledMonster = {
  id: number;
  species_name: string;
  nickname?: string;
  level: number;
  [key: string]: unknown;
};

export type AppliedRewards = {
  levels: number;
  coins: number;
  items: RewardItem[];
  monsters: RolledMonster[];
  trainer_id: number;
};

export type RerollResult = {
  success: boolean;
  oldMonster: {
    id: number;
    species_name: string;
    nickname?: string;
  };
  newMonster: RolledMonster;
  berries_remaining: number;
};

export type RewardSummary = {
  levels: number;
  coins: number;
  items: Array<{ name: string; quantity: number }>;
  monsters: RolledMonster[];
  special_items: unknown[];
};

/**
 * Service for calculating and immediately applying rewards for approved submissions
 */
export class ImmediateRewardService {
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private itemRepository: ItemRepository;
  private monsterRepository: MonsterRepository;
  private specialBerryService: SpecialBerryService;
  private monsterInitializer: MonsterInitializerService;

  constructor(
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    itemRepository?: ItemRepository,
    specialBerryService?: SpecialBerryService,
    monsterRepository?: MonsterRepository
  ) {
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.specialBerryService = specialBerryService ?? new SpecialBerryService();
    this.monsterInitializer = new MonsterInitializerService();
  }

  /**
   * Calculate and immediately apply rewards for approved submission
   * @param prompt - Prompt object with rewards
   * @param submission - Submission object with trainer_id
   * @param qualityScore - Quality score (1-10)
   * @param bonusApplied - Whether bonus was applied
   * @returns Applied rewards with details
   */
  async calculateAndApplyRewards(
    prompt: { rewards: PromptRewards | string },
    submission: { trainer_id: number },
    qualityScore = 5,
    _bonusApplied = false
  ): Promise<AppliedRewards> {
    const rewards: PromptRewards =
      typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;

    const appliedRewards: AppliedRewards = {
      levels: 0,
      coins: 0,
      items: [],
      monsters: [],
      trainer_id: submission.trainer_id,
    };

    // Use transaction for atomicity
    await db.transaction(async (client) => {
      // Base rewards
      if (rewards.levels) {
        appliedRewards.levels += rewards.levels;
      }

      if (rewards.coins) {
        appliedRewards.coins += rewards.coins;
      }

      if (rewards.items) {
        appliedRewards.items = [...rewards.items];
      }

      // Quality-based bonuses
      if (qualityScore >= 8 && rewards.bonus_conditions) {
        const bonus = rewards.bonus_conditions;
        if (qualityScore >= bonus.quality_threshold) {
          if (bonus.bonus_levels) {
            appliedRewards.levels += bonus.bonus_levels;
          }
          if (bonus.bonus_coins) {
            appliedRewards.coins += bonus.bonus_coins;
          }
          if (bonus.bonus_items) {
            appliedRewards.items.push(...bonus.bonus_items);
          }
        }
      }

      // Apply levels to trainer
      if (appliedRewards.levels > 0) {
        await client.query(
          'UPDATE trainers SET level = level + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [appliedRewards.levels, submission.trainer_id]
        );
      }

      // Apply coins to trainer
      if (appliedRewards.coins > 0) {
        await client.query(
          'UPDATE trainers SET currency_amount = currency_amount + $1, total_earned_currency = total_earned_currency + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [appliedRewards.coins, submission.trainer_id]
        );
      }

      // Apply items to trainer inventory
      for (const item of appliedRewards.items) {
        await this.addItemToTrainerInventory(submission.trainer_id, item);
      }

      // Handle monster rolls - roll immediately and add to trainer
      if (rewards.monster_roll?.enabled) {
        const rolledMonster = await this.rollAndAddMonster(
          submission.trainer_id,
          rewards.monster_roll.parameters ?? {}
        );
        if (rolledMonster) {
          appliedRewards.monsters.push(rolledMonster);
        }
      }
    });

    return appliedRewards;
  }

  /**
   * Roll and add monster to trainer immediately
   * Note: This is a placeholder that will need a proper MonsterRoller implementation
   * @param trainerId - Trainer ID
   * @param rollParams - Roll parameters
   * @returns Generated monster
   */
  async rollAndAddMonster(
    trainerId: number,
    rollParams: MonsterRollParameters = {}
  ): Promise<RolledMonster | null> {
    try {
      const monsterRoller = new MonsterRollerService();

      // Roll a random monster with the given parameters
      const rolledSpecies = await monsterRoller.rollMonster({
        legendary: rollParams.legendary_allowed ?? false,
        mythical: rollParams.mythical_allowed ?? false,
        includeStages: rollParams.max_stage
          ? Array.from({ length: rollParams.max_stage }, (_, i) => String(i + 1))
          : undefined,
      });

      if (!rolledSpecies) {
        console.warn(`MonsterRoller returned null for trainer ${trainerId}`);
        return null;
      }

      // Generate IVs and stats
      const level = 1;
      const ivs = this.monsterInitializer.generateIVs();
      const nature = this.monsterInitializer.generateNature();
      const stats = this.monsterInitializer.calculateStats(level, { ...ivs, nature });

      // Create the monster in the database
      const createInput: MonsterCreateInput = {
        trainerId,
        name: rolledSpecies.name,
        species1: rolledSpecies.species1 ?? rolledSpecies.name,
        species2: rolledSpecies.species2 ?? null,
        species3: rolledSpecies.species3 ?? null,
        type1: rolledSpecies.type1 ?? rolledSpecies.type_primary ?? 'Normal',
        type2: rolledSpecies.type2 ?? rolledSpecies.type_secondary ?? null,
        type3: rolledSpecies.type3 ?? null,
        type4: rolledSpecies.type4 ?? null,
        type5: rolledSpecies.type5 ?? null,
        attribute: rolledSpecies.attribute ?? null,
        level,
        nature,
        hpIv: ivs.hp_iv,
        atkIv: ivs.atk_iv,
        defIv: ivs.def_iv,
        spaIv: ivs.spa_iv,
        spdIv: ivs.spd_iv,
        speIv: ivs.spe_iv,
        hpTotal: stats.hp_total,
        atkTotal: stats.atk_total,
        defTotal: stats.def_total,
        spaTotal: stats.spa_total,
        spdTotal: stats.spd_total,
        speTotal: stats.spe_total,
        imgLink: rolledSpecies.image_url ?? null,
        dateMet: new Date(),
        whereMet: 'Prompt Reward',
        ball: 'Poke Ball',
      };

      const createdMonster = await this.monsterRepository.create(createInput);

      // Consume the ball from trainer inventory
      await consumeBallFromInventory(trainerId, 'Poke Ball');

      console.log(`Rolled and added monster ${rolledSpecies.name} (ID: ${createdMonster.id}) to trainer ${trainerId}`);

      return {
        id: createdMonster.id,
        species_name: rolledSpecies.name,
        level,
      };
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  }

  /**
   * Reroll a monster using Forget-Me-Not berry
   * @param trainerId - Trainer ID
   * @param monsterId - Monster ID to reroll
   * @param originalParams - Original roll parameters
   * @returns New monster and old monster info
   */
  async rerollMonsterWithForgetMeNot(
    trainerId: number,
    monsterId: number,
    originalParams: MonsterRollParameters = {}
  ): Promise<RerollResult> {
    // Check if trainer has Forget-Me-Not berry
    const hasForgetMeNot = await this.specialBerryService.hasSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      throw new Error('No Forget-Me-Not berries available');
    }

    // Get the old monster info
    const oldMonsterResult = await db.query<{
      id: number;
      species_name: string;
      nickname: string | null;
    }>('SELECT id, species_name, nickname FROM monsters WHERE id = $1 AND trainer_id = $2', [
      monsterId,
      trainerId,
    ]);

    const oldMonster = oldMonsterResult.rows[0];
    if (!oldMonster) {
      throw new Error('Monster not found or not owned by trainer');
    }

    return await db.transaction(async (client) => {
      // Consume the Forget-Me-Not berry
      const consumed = await this.specialBerryService.consumeSpecialBerry(trainerId, 'Forget-Me-Not');
      if (!consumed) {
        throw new Error('Failed to consume Forget-Me-Not berry');
      }

      // Delete the old monster
      await client.query('DELETE FROM monsters WHERE id = $1', [monsterId]);

      // Roll a new monster with the same parameters
      const newMonster = await this.rollAndAddMonster(trainerId, originalParams);
      if (!newMonster) {
        throw new Error('Failed to roll new monster');
      }

      // Get remaining berries
      const remainingBerries = await this.specialBerryService.getBerryQuantity(
        trainerId,
        'Forget-Me-Not'
      );

      return {
        success: true,
        oldMonster: {
          id: oldMonster.id,
          species_name: oldMonster.species_name,
          nickname: oldMonster.nickname ?? undefined,
        },
        newMonster,
        berries_remaining: remainingBerries,
      };
    });
  }

  /**
   * Add item to trainer inventory
   * @param trainerId - Trainer ID
   * @param item - Item object
   */
  async addItemToTrainerInventory(trainerId: number, item: RewardItem): Promise<void> {
    try {
      let itemRecord: ItemRow | null = null;

      // If item_name is provided instead of item_id, look up the ID
      if (!item.item_id && item.item_name) {
        itemRecord = await this.itemRepository.findByName(item.item_name);
        if (!itemRecord) {
          console.warn(`Item not found: ${item.item_name}`);
          return;
        }
      } else if (item.item_id) {
        itemRecord = await this.itemRepository.findById(item.item_id);
        if (!itemRecord) {
          console.warn(`Item not found with ID: ${item.item_id}`);
          return;
        }
      }

      if (!itemRecord) {
        console.warn('No valid item ID found for item:', item);
        return;
      }

      const quantity = item.quantity ?? 1;
      const chance = item.chance ?? 100;

      // Check if item should be given based on chance
      if (Math.random() * 100 > chance) {
        console.log(`Item ${itemRecord.name} not given due to chance (${chance}%)`);
        return;
      }

      // Determine the category based on item type
      const category = this.getInventoryCategory(itemRecord);

      // Add to trainer inventory
      await this.inventoryRepository.addItem(trainerId, category, itemRecord.name, quantity);

      console.log(`Added ${quantity}x ${itemRecord.name} to trainer ${trainerId}`);
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  /**
   * Determine inventory category from item record
   * @param item - Item record
   * @returns Inventory category
   */
  private getInventoryCategory(
    item: ItemRow
  ): 'items' | 'balls' | 'berries' | 'pastries' | 'evolution' | 'eggs' | 'antiques' | 'helditems' | 'seals' | 'keyitems' {
    const category = item.category?.toLowerCase() ?? 'items';
    const categoryMap: Record<
      string,
      'items' | 'balls' | 'berries' | 'pastries' | 'evolution' | 'eggs' | 'antiques' | 'helditems' | 'seals' | 'keyitems'
    > = {
      items: 'items',
      balls: 'balls',
      berries: 'berries',
      pastries: 'pastries',
      evolution: 'evolution',
      eggs: 'eggs',
      antiques: 'antiques',
      helditems: 'helditems',
      seals: 'seals',
      keyitems: 'keyitems',
    };

    return categoryMap[category] ?? 'items';
  }

  /**
   * Apply levels to trainer directly
   * @param trainerId - Trainer ID
   * @param levels - Number of levels to add
   */
  async applyLevels(trainerId: number, levels: number): Promise<void> {
    await this.trainerRepository.addLevels(trainerId, levels);
  }

  /**
   * Apply coins to trainer directly
   * @param trainerId - Trainer ID
   * @param coins - Number of coins to add
   */
  async applyCoins(trainerId: number, coins: number): Promise<void> {
    await this.trainerRepository.updateCurrency(trainerId, coins);
  }

  /**
   * Apply levels and coins to trainer in one operation
   * @param trainerId - Trainer ID
   * @param levels - Number of levels to add
   * @param coins - Number of coins to add
   */
  async applyLevelsAndCoins(trainerId: number, levels: number, coins: number): Promise<void> {
    await this.trainerRepository.addLevelsAndCoins(trainerId, levels, coins);
  }

  /**
   * Get formatted reward summary for display
   * @param rewards - Applied rewards object
   * @returns Formatted reward summary
   */
  formatRewardSummary(rewards: AppliedRewards): RewardSummary {
    const summary: RewardSummary = {
      levels: rewards.levels,
      coins: rewards.coins,
      items: [],
      monsters: rewards.monsters || [],
      special_items: [],
    };

    // Format items for display
    for (const item of rewards.items || []) {
      summary.items.push({
        name: item.item_name ?? `Item ${item.item_id}`,
        quantity: item.quantity ?? 1,
      });
    }

    return summary;
  }
}
