import { db } from '../database';
import {
  TrainerRepository,
  TrainerInventoryRepository,
  ItemRepository,
  MonsterRepository,
  type InventoryCategory,
  type MonsterCreateInput,
} from '../repositories';
import { MonsterRollerService, type UserSettings } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import {
  MONSTER_TYPES,
  DIGIMON_ATTRIBUTES,
  type MonsterTable,
  getTableName,
  getTableSchema,
  getRandomElement,
  MONSTER_TABLES,
} from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

export type StaticMonsterConfig = {
  table: MonsterTable;
  species_id?: number;
  species_name?: string;
  level?: number;
  image_url?: string;
};

export type SemiRandomMonsterConfig = {
  table: MonsterTable;
  species_id?: number;
  species_name?: string;
  image_url?: string;
  allow_fusion?: boolean;
  type_mode?: 'fixed' | 'random';
  fixed_types?: string[];
  types_min?: number;
  types_max?: number;
  attribute_mode?: 'fixed' | 'random';
  fixed_attribute?: string;
  level_mode?: 'fixed' | 'random';
  fixed_level?: number;
  level_min?: number;
  level_max?: number;
};

export type RewardItemConfig = {
  item_id?: number;
  item_name?: string;
  quantity?: number;
  chance?: number;
  is_random_from_category?: boolean;
  category?: string;
  is_random_from_set?: boolean;
  random_set_items?: number[];
};

export type SpecialItemConfig = {
  type: 'berry' | 'keyitem';
  name: string;
  quantity?: number;
};

export type MonsterRollConfig = {
  enabled: boolean;
  parameters?: Record<string, unknown>;
};

export type BonusConditions = {
  quality_threshold: number;
  bonus_levels?: number;
  bonus_coins?: number;
  bonus_items?: RewardItemConfig[];
};

export type PromptRewardConfig = {
  levels?: number;
  coins?: number;
  items?: RewardItemConfig[];
  special_items?: SpecialItemConfig[];
  static_monsters?: StaticMonsterConfig[];
  semi_random_monsters?: SemiRandomMonsterConfig[];
  monster_roll?: MonsterRollConfig;
  bonus_conditions?: BonusConditions;
};

export type PromptBonusRewardConfig = {
  levels?: number;
  coins?: number;
  items?: RewardItemConfig[];
  special_items?: SpecialItemConfig[];
};

export type CreatedMonster = {
  id: number;
  name: string;
  species1: string;
  species2?: string | null;
  level: number;
  types: string[];
  attribute?: string | null;
};

export type DistributedRewards = {
  levels: number;
  coins: number;
  items: RewardItemConfig[];
  special_items: SpecialItemConfig[];
  monster_rolls: number;
  static_monsters: StaticMonsterConfig[];
  semi_random_monsters: SemiRandomMonsterConfig[];
  created_monsters: CreatedMonster[];
  bonus_applied: boolean;
};

export type PromptInput = {
  rewards: PromptRewardConfig | string;
  bonus_rewards?: PromptBonusRewardConfig | string;
};

export type SubmissionInput = {
  id: number;
  trainer_id: number;
};

export type RewardHistoryEntry = {
  submission_id: number;
  prompt_id: number;
  prompt_title: string;
  prompt_type: string;
  rewards_given: string;
  distributed_at: string;
  submitted_at: string;
};

export type TotalRewardsSummary = {
  levels: number;
  coins: number;
  itemCount: number;
  monsterRolls: number;
  staticMonsters: number;
  semiRandomMonsters: number;
  totalMonstersCreated: number;
  submissionsRewarded: number;
};

export type UnclaimedMonsterRoll = {
  id: number;
  trainer_id: number;
  roll_parameters: string;
  source: string;
  created_at: string;
  is_claimed: boolean;
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for calculating and distributing prompt-specific rewards.
 * Handles static monsters, semi-random monsters, monster rolls,
 * item distribution, special items, and reward history tracking.
 */
export class PromptRewardService {
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private itemRepository: ItemRepository;
  private monsterRepository: MonsterRepository;
  private monsterInitializer: MonsterInitializerService;

  constructor(
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    itemRepository?: ItemRepository,
    monsterRepository?: MonsterRepository
  ) {
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.monsterInitializer = new MonsterInitializerService();
  }

  // ==========================================================================
  // Reward Calculation & Distribution
  // ==========================================================================

  /**
   * Calculate and distribute rewards for an approved prompt submission
   * @param prompt - Prompt with reward configuration
   * @param submission - Submission with trainer_id
   * @param qualityScore - Quality score (1-10)
   * @param bonusApplied - Whether manual bonus was applied
   * @returns Distributed rewards summary
   */
  async calculateAndDistributeRewards(
    prompt: PromptInput,
    submission: SubmissionInput,
    qualityScore = 5,
    bonusApplied = false
  ): Promise<DistributedRewards> {
    const rewards: PromptRewardConfig =
      typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;

    const distributedRewards: DistributedRewards = {
      levels: 0,
      coins: 0,
      items: [],
      special_items: [],
      monster_rolls: 0,
      static_monsters: [],
      semi_random_monsters: [],
      created_monsters: [],
      bonus_applied: bonusApplied,
    };

    // Base rewards
    if (rewards.levels) {
      distributedRewards.levels += rewards.levels;
    }
    if (rewards.coins) {
      distributedRewards.coins += rewards.coins;
    }
    if (rewards.items) {
      distributedRewards.items = [...rewards.items];
    }
    if (rewards.special_items) {
      distributedRewards.special_items = [...rewards.special_items];
    }
    if (rewards.static_monsters?.length) {
      distributedRewards.static_monsters = [...rewards.static_monsters];
    }
    if (rewards.semi_random_monsters?.length) {
      distributedRewards.semi_random_monsters = [...rewards.semi_random_monsters];
    }

    // Quality-based bonuses
    if (qualityScore >= 8 && rewards.bonus_conditions) {
      const bonus = rewards.bonus_conditions;
      if (qualityScore >= bonus.quality_threshold) {
        if (bonus.bonus_levels) {
          distributedRewards.levels += bonus.bonus_levels;
        }
        if (bonus.bonus_coins) {
          distributedRewards.coins += bonus.bonus_coins;
        }
        if (bonus.bonus_items) {
          distributedRewards.items.push(...bonus.bonus_items);
        }
      }
    }

    // Manual bonus application
    if (bonusApplied && prompt.bonus_rewards) {
      const bonusRewards: PromptBonusRewardConfig =
        typeof prompt.bonus_rewards === 'string'
          ? JSON.parse(prompt.bonus_rewards)
          : prompt.bonus_rewards;

      if (bonusRewards.levels) {
        distributedRewards.levels += bonusRewards.levels;
      }
      if (bonusRewards.coins) {
        distributedRewards.coins += bonusRewards.coins;
      }
      if (bonusRewards.items) {
        distributedRewards.items.push(...bonusRewards.items);
      }
      if (bonusRewards.special_items) {
        distributedRewards.special_items.push(...bonusRewards.special_items);
      }
    }

    // Monster roll rewards
    if (rewards.monster_roll?.enabled) {
      distributedRewards.monster_rolls = 1;
    }

    // Distribute everything to the trainer within a transaction
    await this.distributeRewardsToTrainer(
      submission.trainer_id,
      distributedRewards,
      rewards.monster_roll?.parameters
    );

    // Log the distribution (non-blocking)
    await this.logRewardDistribution(submission.id, distributedRewards);

    return distributedRewards;
  }

  // ==========================================================================
  // Reward Distribution
  // ==========================================================================

  /**
   * Apply all rewards to a trainer's account within a transaction
   */
  private async distributeRewardsToTrainer(
    trainerId: number,
    rewards: DistributedRewards,
    monsterRollParams?: Record<string, unknown>
  ): Promise<void> {
    await db.transaction(async (client) => {
      // Add levels
      if (rewards.levels > 0) {
        await client.query(
          'UPDATE trainers SET level = level + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [rewards.levels, trainerId]
        );
      }

      // Add coins
      if (rewards.coins > 0) {
        await client.query(
          `UPDATE trainers
           SET currency_amount = currency_amount + $1,
               total_earned_currency = total_earned_currency + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [rewards.coins, trainerId]
        );
      }

      // Add items
      for (const item of rewards.items) {
        await this.addItemToTrainerInventory(trainerId, item);
      }

      // Add special items (berries, key items)
      for (const specialItem of rewards.special_items) {
        await this.addSpecialItemToTrainer(trainerId, specialItem);
      }

      // Store monster rolls for later claiming
      if (rewards.monster_rolls > 0) {
        await this.addMonsterRollToTrainer(trainerId, monsterRollParams);
      }

      // Create static monsters immediately
      for (const staticConfig of rewards.static_monsters) {
        const created = await this.createStaticMonster(trainerId, staticConfig);
        if (created) {
          rewards.created_monsters.push(created);
        }
      }

      // Create semi-random monsters immediately
      for (const semiRandomConfig of rewards.semi_random_monsters) {
        const created = await this.createSemiRandomMonster(trainerId, semiRandomConfig);
        if (created) {
          rewards.created_monsters.push(created);
        }
      }
    });
  }

  // ==========================================================================
  // Item Distribution
  // ==========================================================================

  /**
   * Add an item to trainer inventory, supporting random-from-category and random-from-set
   */
  private async addItemToTrainerInventory(
    trainerId: number,
    item: RewardItemConfig
  ): Promise<void> {
    try {
      let resolvedItem: { id: number; name: string; category: string } | null = null;

      if (item.is_random_from_category && item.category) {
        // Random item from a category
        const categoryItems = await db.query<{ id: number; name: string; category: string }>(
          'SELECT id, name, category FROM items WHERE category = $1',
          [item.category]
        );
        if (categoryItems.rows.length > 0) {
          resolvedItem = getRandomElement(categoryItems.rows);
        }
      } else if (item.is_random_from_set && item.random_set_items?.length) {
        // Random item from a predefined set
        const validIds = item.random_set_items.filter((id) => id);
        if (validIds.length > 0) {
          const randomId = getRandomElement(validIds);
          const result = await db.query<{ id: number; name: string; category: string }>(
            'SELECT id, name, category FROM items WHERE id = $1',
            [randomId]
          );
          resolvedItem = result.rows[0] ?? null;
        }
      } else {
        // Specific item - look up by ID or name
        if (item.item_id) {
          const record = await this.itemRepository.findById(item.item_id);
          if (record) {
            resolvedItem = { id: record.id, name: record.name, category: record.category ?? 'items' };
          }
        } else if (item.item_name) {
          const record = await this.itemRepository.findByName(item.item_name);
          if (record) {
            resolvedItem = { id: record.id, name: record.name, category: record.category ?? 'items' };
          }
        }
      }

      if (!resolvedItem) {
        console.warn('No item resolved for configuration:', item);
        return;
      }

      const quantity = item.quantity ?? 1;
      const chance = item.chance ?? 100;

      // Check if item should be given based on chance
      if (Math.random() * 100 > chance) {
        console.log(`Item ${resolvedItem.name} not given due to chance (${chance}%)`);
        return;
      }

      // Map item category to inventory category
      const inventoryCategory = this.mapToInventoryCategory(resolvedItem.category);
      await this.inventoryRepository.addItem(trainerId, inventoryCategory, resolvedItem.name, quantity);

      console.log(`Added ${quantity}x ${resolvedItem.name} to trainer ${trainerId}`);
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  /**
   * Add a special item (berry or key item) to trainer inventory
   */
  private async addSpecialItemToTrainer(
    trainerId: number,
    specialItem: SpecialItemConfig
  ): Promise<void> {
    const quantity = specialItem.quantity ?? 1;
    const category: InventoryCategory = specialItem.type === 'berry' ? 'berries' : 'keyitems';

    await this.inventoryRepository.addItem(trainerId, category, specialItem.name, quantity);
    console.log(`Added ${quantity}x ${specialItem.name} (${specialItem.type}) to trainer ${trainerId}`);
  }

  /**
   * Store a monster roll for later claiming
   */
  private async addMonsterRollToTrainer(
    trainerId: number,
    rollParams?: Record<string, unknown>
  ): Promise<void> {
    await db.query(
      `INSERT INTO trainer_monster_rolls (trainer_id, roll_parameters, source, created_at, is_claimed)
       VALUES ($1, $2, 'prompt_reward', CURRENT_TIMESTAMP, false)`,
      [trainerId, JSON.stringify(rollParams ?? {})]
    );
    console.log(`Added monster roll to trainer ${trainerId}`);
  }

  /**
   * Map an item's category string to a valid inventory category
   */
  private mapToInventoryCategory(category: string): InventoryCategory {
    const map: Record<string, InventoryCategory> = {
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
    return map[category.toLowerCase()] ?? 'items';
  }

  // ==========================================================================
  // Static Monster Creation
  // ==========================================================================

  /**
   * Create a predefined monster for a trainer
   */
  private async createStaticMonster(
    trainerId: number,
    config: StaticMonsterConfig
  ): Promise<CreatedMonster | null> {
    if (!config.species_name && !config.species_id) {
      console.warn('Static monster missing species information:', config);
      return null;
    }

    const tableName = getTableName(config.table);
    const schema = getTableSchema(config.table);

    let speciesData: Record<string, unknown> | null = null;

    if (config.species_id) {
      const result = await db.query<Record<string, unknown>>(
        `SELECT * FROM ${tableName} WHERE ${schema.idField} = $1`,
        [config.species_id]
      );
      speciesData = result.rows[0] ?? null;
    } else if (config.species_name) {
      const result = await db.query<Record<string, unknown>>(
        `SELECT * FROM ${tableName} WHERE ${schema.nameField} = $1`,
        [config.species_name]
      );
      speciesData = result.rows[0] ?? null;
    }

    if (!speciesData) {
      console.warn(`Species not found in ${tableName}:`, config.species_id ?? config.species_name);
      return null;
    }

    const types = this.extractTypesFromSpecies(speciesData, config.table);
    const attribute = (speciesData[schema.attributeField ?? ''] as string) ?? null;
    const name = speciesData[schema.nameField] as string;
    const imageUrl = config.image_url ?? (speciesData[schema.imageField] as string) ?? null;

    const monsterInput: MonsterCreateInput = {
      trainerId,
      name,
      species1: name,
      type1: types[0] ?? 'Normal',
      type2: types[1] ?? null,
      type3: types[2] ?? null,
      type4: types[3] ?? null,
      type5: types[4] ?? null,
      attribute,
      level: config.level ?? 1,
      imgLink: imageUrl,
      dateMet: new Date(),
      whereMet: 'Prompt Reward',
    };

    const created = await this.monsterRepository.create(monsterInput);
    console.log(`Created static monster ${name} (level ${config.level ?? 1}) for trainer ${trainerId}`);

    return {
      id: created.id,
      name,
      species1: name,
      level: config.level ?? 1,
      types: types.filter(Boolean) as string[],
      attribute,
    };
  }

  // ==========================================================================
  // Semi-Random Monster Creation
  // ==========================================================================

  /**
   * Create a monster with some randomized attributes
   */
  private async createSemiRandomMonster(
    trainerId: number,
    config: SemiRandomMonsterConfig
  ): Promise<CreatedMonster | null> {
    if (!config.species_name && !config.species_id) {
      console.warn('Semi-random monster missing species information:', config);
      return null;
    }

    const tableName = getTableName(config.table);
    const schema = getTableSchema(config.table);

    let speciesData: Record<string, unknown> | null = null;

    if (config.species_id) {
      const result = await db.query<Record<string, unknown>>(
        `SELECT * FROM ${tableName} WHERE ${schema.idField} = $1`,
        [config.species_id]
      );
      speciesData = result.rows[0] ?? null;
    } else if (config.species_name) {
      const result = await db.query<Record<string, unknown>>(
        `SELECT * FROM ${tableName} WHERE ${schema.nameField} = $1`,
        [config.species_name]
      );
      speciesData = result.rows[0] ?? null;
    }

    if (!speciesData) {
      console.warn(`Species not found in ${tableName}:`, config.species_id ?? config.species_name);
      return null;
    }

    const primaryName = speciesData[schema.nameField] as string;
    let species2: string | null = null;
    const fusionImageUrl = config.image_url ?? (speciesData[schema.imageField] as string) ?? null;

    // Optional fusion with a random species
    if (config.allow_fusion) {
      const fusionSpecies = await this.getRandomFusionSpecies();
      if (fusionSpecies) {
        species2 = fusionSpecies.name;
      }
    }

    // Determine types
    let types: string[];
    if (config.type_mode === 'fixed' && config.fixed_types?.length) {
      types = [...config.fixed_types];
    } else {
      const minTypes = config.types_min ?? 1;
      const maxTypes = config.types_max ?? 2;
      const numTypes = Math.floor(Math.random() * (maxTypes - minTypes + 1)) + minTypes;
      const shuffled = [...MONSTER_TYPES].sort(() => Math.random() - 0.5);
      types = shuffled.slice(0, numTypes);
    }

    // Determine attribute
    let attribute: string | null;
    if (config.attribute_mode === 'fixed' && config.fixed_attribute) {
      attribute = config.fixed_attribute;
    } else {
      attribute = getRandomElement(DIGIMON_ATTRIBUTES);
    }

    // Determine level
    let level: number;
    if (config.level_mode === 'fixed') {
      level = config.fixed_level ?? 1;
    } else {
      const minLevel = config.level_min ?? 1;
      const maxLevel = config.level_max ?? 10;
      level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
    }

    const monsterName = species2 ? `${primaryName}/${species2}` : primaryName;

    const monsterInput: MonsterCreateInput = {
      trainerId,
      name: monsterName,
      species1: primaryName,
      species2,
      type1: types[0] ?? 'Normal',
      type2: types[1] ?? null,
      type3: types[2] ?? null,
      type4: types[3] ?? null,
      type5: types[4] ?? null,
      attribute,
      level,
      imgLink: fusionImageUrl,
      dateMet: new Date(),
      whereMet: 'Prompt Reward',
    };

    const created = await this.monsterRepository.create(monsterInput);
    console.log(`Created semi-random monster ${monsterName} (level ${level}) for trainer ${trainerId}`);

    return {
      id: created.id,
      name: monsterName,
      species1: primaryName,
      species2,
      level,
      types: types.filter(Boolean),
      attribute,
    };
  }

  // ==========================================================================
  // Monster Roll Claiming
  // ==========================================================================

  /**
   * Get unclaimed monster rolls for a trainer
   */
  async getUnclaimedMonsterRolls(trainerId: number): Promise<UnclaimedMonsterRoll[]> {
    const result = await db.query<UnclaimedMonsterRoll>(
      `SELECT * FROM trainer_monster_rolls
       WHERE trainer_id = $1 AND is_claimed::boolean = false
       ORDER BY created_at ASC`,
      [trainerId]
    );
    return result.rows;
  }

  /**
   * Claim a monster roll and generate the monster
   * @param rollId - Monster roll ID
   * @param trainerId - Trainer ID
   * @returns Generated monster data
   */
  async claimMonsterRoll(
    rollId: number,
    trainerId: number
  ): Promise<CreatedMonster> {
    // Fetch the roll
    const rollResult = await db.query<UnclaimedMonsterRoll>(
      `SELECT * FROM trainer_monster_rolls
       WHERE id = $1 AND trainer_id = $2 AND is_claimed::boolean = false`,
      [rollId, trainerId]
    );

    const roll = rollResult.rows[0];
    if (!roll) {
      throw new Error('Monster roll not found or already claimed');
    }

    const rollParams = JSON.parse(roll.roll_parameters || '{}') as Record<string, unknown>;

    // Get user settings for monster rolling
    const trainer = await this.trainerRepository.findById(trainerId);
    let userSettings: UserSettings = {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
      dragonquest: true,
    };

    if (trainer?.player_user_id) {
      const userResult = await db.query<{ monster_roller_settings: string | null }>(
        'SELECT monster_roller_settings FROM users WHERE discord_id = $1',
        [trainer.player_user_id]
      );
      const user = userResult.rows[0];
      if (user?.monster_roller_settings) {
        try {
          const settings =
            typeof user.monster_roller_settings === 'string'
              ? JSON.parse(user.monster_roller_settings)
              : user.monster_roller_settings;
          userSettings = { ...userSettings, ...settings };
        } catch (err) {
          console.error('Error parsing user monster roller settings:', err);
        }
      }
    }

    // Roll a monster using MonsterRollerService
    const roller = new MonsterRollerService({ userSettings });
    const rolledMonster = await roller.rollMonster(rollParams);

    if (!rolledMonster) {
      throw new Error('Failed to roll a monster');
    }

    // Create the monster in the database
    const monsterInput: MonsterCreateInput = {
      trainerId,
      name: rolledMonster.name,
      species1: rolledMonster.species1 ?? rolledMonster.name,
      species2: rolledMonster.species2 ?? null,
      type1: rolledMonster.type1 ?? rolledMonster.type_primary ?? 'Normal',
      type2: rolledMonster.type2 ?? rolledMonster.type_secondary ?? null,
      type3: rolledMonster.type3 ?? null,
      type4: rolledMonster.type4 ?? null,
      type5: rolledMonster.type5 ?? null,
      attribute: rolledMonster.attribute ?? null,
      level: 1,
      imgLink: rolledMonster.image_url ?? null,
      dateMet: new Date(),
      whereMet: 'Monster Roll (Prompt Reward)',
    };

    const createdMonster = await this.monsterRepository.create(monsterInput);

    // Initialize monster with stats, moves, abilities, etc.
    try {
      await this.monsterInitializer.initializeMonster(createdMonster.id);
    } catch (err) {
      console.error(`Failed to initialize monster ${createdMonster.id} from prompt reward:`, err);
    }

    // Mark the roll as claimed
    await db.query(
      `UPDATE trainer_monster_rolls
       SET is_claimed = 1, claimed_at = CURRENT_TIMESTAMP, generated_monster_id = $1
       WHERE id = $2`,
      [createdMonster.id, rollId]
    );

    console.log(`Trainer ${trainerId} claimed monster roll ${rollId}, generated monster ${createdMonster.id}`);

    return {
      id: createdMonster.id,
      name: monsterInput.name,
      species1: monsterInput.species1,
      species2: monsterInput.species2,
      level: 1,
      types: [monsterInput.type1, monsterInput.type2, monsterInput.type3, monsterInput.type4, monsterInput.type5]
        .filter((t): t is string => t !== null && t !== undefined),
      attribute: monsterInput.attribute,
    };
  }

  // ==========================================================================
  // Reward History
  // ==========================================================================

  /**
   * Get reward distribution history for a trainer
   */
  async getRewardHistory(
    trainerId: number,
    filters: { startDate?: string; endDate?: string; limit?: number } = {}
  ): Promise<RewardHistoryEntry[]> {
    const params: unknown[] = [trainerId];
    let query = `
      SELECT
        rdl.submission_id,
        ps.prompt_id,
        p.title AS prompt_title,
        p.type AS prompt_type,
        rdl.rewards_given,
        rdl.distributed_at,
        ps.submitted_at
      FROM reward_distribution_log rdl
      JOIN prompt_submissions ps ON rdl.submission_id = ps.id
      JOIN prompts p ON ps.prompt_id = p.id
      WHERE ps.trainer_id = $1`;

    if (filters.startDate) {
      params.push(filters.startDate);
      query += ` AND rdl.distributed_at >= $${params.length}`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      query += ` AND rdl.distributed_at <= $${params.length}`;
    }

    query += ' ORDER BY rdl.distributed_at DESC';

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    const result = await db.query<RewardHistoryEntry>(query, params);
    return result.rows;
  }

  /**
   * Calculate total rewards ever given to a trainer
   */
  async getTotalRewardsGiven(trainerId: number): Promise<TotalRewardsSummary> {
    const history = await this.getRewardHistory(trainerId);

    const totals: TotalRewardsSummary = {
      levels: 0,
      coins: 0,
      itemCount: 0,
      monsterRolls: 0,
      staticMonsters: 0,
      semiRandomMonsters: 0,
      totalMonstersCreated: 0,
      submissionsRewarded: history.length,
    };

    for (const record of history) {
      const rewards: DistributedRewards = JSON.parse(record.rewards_given);
      totals.levels += rewards.levels ?? 0;
      totals.coins += rewards.coins ?? 0;
      totals.itemCount += (rewards.items?.length ?? 0) + (rewards.special_items?.length ?? 0);
      totals.monsterRolls += rewards.monster_rolls ?? 0;
      totals.staticMonsters += rewards.static_monsters?.length ?? 0;
      totals.semiRandomMonsters += rewards.semi_random_monsters?.length ?? 0;
      totals.totalMonstersCreated += rewards.created_monsters?.length ?? 0;
    }

    return totals;
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Extract type information from species data based on the table's schema
   */
  private extractTypesFromSpecies(
    speciesData: Record<string, unknown>,
    table: MonsterTable
  ): (string | null)[] {
    const schema = getTableSchema(table);
    const types: (string | null)[] = [];

    for (const typeField of schema.typeFields) {
      const value = speciesData[typeField];
      if (typeof value === 'string' && value) {
        types.push(value);
      }
    }

    // Fallback for tables with no typed fields but an element/attribute
    if (types.length === 0 && schema.attributeField) {
      const attr = speciesData[schema.attributeField];
      if (typeof attr === 'string' && attr) {
        types.push(attr);
      }
    }

    return types;
  }

  /**
   * Get a random species from any monster table for fusion
   */
  private async getRandomFusionSpecies(): Promise<{ name: string; image_url: string | null } | null> {
    try {
      const tables = [...MONSTER_TABLES];
      const randomTable = getRandomElement(tables);
      const tableName = getTableName(randomTable);
      const schema = getTableSchema(randomTable);

      const result = await db.query<{ name: string; image_url: string | null }>(
        `SELECT ${schema.nameField} AS name, ${schema.imageField} AS image_url
         FROM ${tableName}
         ORDER BY RANDOM()
         LIMIT 1`
      );

      return result.rows[0] ?? null;
    } catch (error) {
      console.error('Error getting random fusion species:', error);
      return null;
    }
  }

  /**
   * Log reward distribution for audit tracking
   */
  private async logRewardDistribution(
    submissionId: number,
    rewards: DistributedRewards
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO reward_distribution_log (submission_id, rewards_given, distributed_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [submissionId, JSON.stringify(rewards)]
      );
    } catch (error) {
      // Don't throw for logging failures
      console.error('Error logging reward distribution:', error);
    }
  }
}
