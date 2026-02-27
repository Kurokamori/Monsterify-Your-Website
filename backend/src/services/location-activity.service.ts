import crypto from 'crypto';
import {
  LocationActivitySessionRepository,
  LocationPromptRepository,
  LocationFlavorRepository,
} from '../repositories/location-activity.repository';
import { TrainerRepository, MonsterRepository, TrainerInventoryRepository, BazarRepository } from '../repositories';
import type { InventoryCategory, BazarMonsterCreateInput } from '../repositories';
import type { UserPublic, MonsterRollerSettings } from '../repositories';
import { MonsterRollerService, type RollParams, type UserSettings } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import { ItemRollerService } from './item-roller.service';
import {
  isValidLocation,
  isValidActivity,
  getRewardConfig,
  type LocationId,
  type ActivityId,
  type RewardConfig,
} from '../utils/constants/location-constants';
import type {
  ActivitySession,
  ActivityReward,
  ActivitySessionRow,
  CoinRewardData,
  ItemRewardData,
  LevelRewardData,
  MonsterRewardData,
  ClaimResult,
} from '../utils/types/location-activity.types';

// ============================================================================
// Helpers
// ============================================================================

function parseSessionRow(row: ActivitySessionRow): ActivitySession {
  let rewards: ActivityReward[] = [];
  if (row.rewards) {
    try {
      rewards = typeof row.rewards === 'string' ? JSON.parse(row.rewards) : row.rewards;
    } catch {
      rewards = [];
    }
  }

  return {
    id: row.id,
    session_id: row.session_id,
    player_id: row.player_id,
    location: row.location as LocationId,
    activity: row.activity as ActivityId,
    prompt_id: row.prompt_id,
    difficulty: row.difficulty,
    status: row.completed ? 'completed' : 'active',
    rewards,
    created_at: row.created_at,
    completed_at: row.completed_at,
  };
}

function transformUserSettings(settings: MonsterRollerSettings | null): UserSettings {
  if (!settings) {
    return {
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
  }
  return {
    pokemon: settings.pokemon ?? true,
    digimon: settings.digimon ?? true,
    yokai: settings.yokai ?? true,
    nexomon: settings.nexomon ?? true,
    pals: settings.pals ?? true,
    fakemon: settings.fakemon ?? true,
    finalfantasy: settings.finalfantasy ?? true,
    monsterhunter: settings.monsterhunter ?? true,
    dragonquest: settings.dragonquest ?? true,
  };
}

// ============================================================================
// Service
// ============================================================================

export class LocationActivityService {
  private sessionRepo: LocationActivitySessionRepository;
  private promptRepo: LocationPromptRepository;
  private flavorRepo: LocationFlavorRepository;
  private trainerRepo: TrainerRepository;
  private monsterRepo: MonsterRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private itemRoller: ItemRollerService;
  private monsterInitializer: MonsterInitializerService;
  private bazarRepo: BazarRepository;

  constructor() {
    this.sessionRepo = new LocationActivitySessionRepository();
    this.promptRepo = new LocationPromptRepository();
    this.flavorRepo = new LocationFlavorRepository();
    this.trainerRepo = new TrainerRepository();
    this.monsterRepo = new MonsterRepository();
    this.inventoryRepo = new TrainerInventoryRepository();
    this.itemRoller = new ItemRollerService();
    this.monsterInitializer = new MonsterInitializerService();
    this.bazarRepo = new BazarRepository();
  }

  // ==========================================================================
  // Start Activity
  // ==========================================================================

  async startActivity(
    userId: string,
    location: string,
    activity: string
  ): Promise<{ session_id: string; redirect: string }> {
    if (!isValidLocation(location)) {
      throw new Error(`Invalid location: ${location}`);
    }
    if (!isValidActivity(location, activity)) {
      throw new Error(`Invalid activity '${activity}' for location '${location}'`);
    }

    // Check for existing active session
    const activeSessions = await this.sessionRepo.findActiveByUserId(userId);
    if (activeSessions.length > 0) {
      const existing = activeSessions[0];
      if (!existing) {
        throw new Error('Unexpected error: active session not found');
      }
      return {
        session_id: existing.session_id,
        redirect: `/town/activities/session/${existing.session_id}`,
      };
    }

    // Fetch prompts for this location/activity
    const prompts = await this.promptRepo.findByLocationActivity(location, activity);
    if (prompts.length === 0) {
      throw new Error('No prompts available for this location and activity');
    }

    // Select random prompt
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    if (!prompt) {
      throw new Error('Failed to select prompt');
    }

    // Create session in database
    const sessionId = crypto.randomUUID();
    await this.sessionRepo.createSession({
      sessionId,
      playerId: userId,
      location,
      activity,
      promptId: prompt.id,
      difficulty: prompt.difficulty ?? 'normal',
    });

    return {
      session_id: sessionId,
      redirect: `/town/activities/session/${sessionId}`,
    };
  }

  // ==========================================================================
  // Get Session
  // ==========================================================================

  async getSession(sessionId: string, userId: string): Promise<{
    session: ActivitySession;
    prompt: { id: number; prompt_text: string; difficulty: string | null };
    flavor: { image_url: string | null; flavor_text: string | null };
  }> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    if (row.player_id !== userId) {
      throw new Error('Not authorized to view this session');
    }

    const session = parseSessionRow(row);

    // Get the prompt
    const prompt = await this.promptRepo.findById(session.prompt_id);
    const promptData = prompt ?? {
      id: session.prompt_id,
      prompt_text: 'Complete the activity to earn rewards.',
      difficulty: session.difficulty,
    };

    // Get the flavor
    const flavor = await this.flavorRepo.findByLocation(session.location);
    const flavorData = flavor ?? {
      image_url: null,
      flavor_text: null,
    };

    return {
      session,
      prompt: {
        id: promptData.id,
        prompt_text: promptData.prompt_text,
        difficulty: promptData.difficulty,
      },
      flavor: {
        image_url: flavorData.image_url,
        flavor_text: flavorData.flavor_text,
      },
    };
  }

  // ==========================================================================
  // Complete Activity
  // ==========================================================================

  async completeActivity(sessionId: string, userId: string, user: UserPublic): Promise<{
    session: ActivitySession;
    rewards: ActivityReward[];
  }> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    if (row.player_id !== userId) {
      throw new Error('Not authorized to complete this session');
    }
    if (row.completed) {
      throw new Error('Session already completed');
    }

    // Get trainers for reward assignment
    const trainers = await this.trainerRepo.findByUserId(userId);

    // Get user settings for monster rolling
    const userSettings = transformUserSettings(user.monster_roller_settings);

    // Generate rewards
    const session = parseSessionRow(row);
    const rewards = await this.generateRewards(session, trainers, userSettings);

    // Update session in DB
    await this.sessionRepo.markCompleted(sessionId);
    await this.sessionRepo.updateRewards(sessionId, JSON.stringify(rewards));

    session.status = 'completed';
    session.rewards = rewards;

    return { session, rewards };
  }

  // ==========================================================================
  // Claim Reward
  // ==========================================================================

  async claimReward(
    sessionId: string,
    rewardId: string,
    trainerId: number,
    userId: string,
    monsterName?: string
  ): Promise<ClaimResult> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    if (row.player_id !== userId) {
      throw new Error('Not authorized to claim rewards from this session');
    }
    if (!row.completed) {
      throw new Error('Cannot claim rewards from an incomplete session');
    }

    const session = parseSessionRow(row);
    const rewardIndex = session.rewards.findIndex((r) => r.id === rewardId);
    if (rewardIndex === -1) {
      throw new Error('Reward not found');
    }

    const reward = session.rewards[rewardIndex];
    if (!reward) {
      throw new Error('Reward not found');
    }
    if (reward.claimed) {
      throw new Error('Reward already claimed');
    }

    // Process the reward based on type
    switch (reward.type) {
      case 'coin':
        await this.claimCoinReward(trainerId, reward.reward_data as CoinRewardData);
        break;
      case 'item':
        await this.claimItemReward(trainerId, reward.reward_data as ItemRewardData);
        break;
      case 'level':
        await this.claimLevelReward(trainerId, reward.reward_data as LevelRewardData);
        break;
      case 'monster':
        await this.claimMonsterReward(trainerId, userId, reward.reward_data as MonsterRewardData, monsterName);
        break;
    }

    // Mark reward as claimed
    const claimedReward: ActivityReward = {
      ...reward,
      claimed: true,
      claimed_by: trainerId,
      claimed_at: new Date().toISOString(),
    };
    session.rewards[rewardIndex] = claimedReward;

    // Persist updated rewards
    await this.sessionRepo.updateRewards(sessionId, JSON.stringify(session.rewards));

    return {
      success: true,
      reward: claimedReward,
    };
  }

  // ==========================================================================
  // Forfeit Reward (send monster to bazar)
  // ==========================================================================

  async forfeitReward(
    sessionId: string,
    rewardId: string,
    userId: string,
    monsterName?: string
  ): Promise<{ success: boolean; bazarMonsterId?: number }> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    if (row.player_id !== userId) {
      throw new Error('Not authorized to forfeit rewards from this session');
    }
    if (!row.completed) {
      throw new Error('Cannot forfeit rewards from an incomplete session');
    }

    const session = parseSessionRow(row);
    const rewardIndex = session.rewards.findIndex((r) => r.id === rewardId);
    if (rewardIndex === -1) {
      throw new Error('Reward not found');
    }

    const reward = session.rewards[rewardIndex];
    if (!reward) {
      throw new Error('Reward not found');
    }
    if (reward.claimed) {
      throw new Error('Reward already claimed');
    }
    if (reward.type !== 'monster') {
      throw new Error('Only monster rewards can be forfeited');
    }

    const rewardData = reward.reward_data as MonsterRewardData;
    const trimmedName = (monsterName ?? '').trim();
    const name = trimmedName || (rewardData.species1 as string) || 'Activity Monster';

    const bazarInput: BazarMonsterCreateInput = {
      originalMonsterId: -1,
      forfeitedByTrainerId: -1,
      forfeitedByUserId: userId,
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

    const bazarMonster = await this.bazarRepo.createMonster(bazarInput);

    try {
      await this.bazarRepo.recordTransaction(
        'forfeit_monster',
        'monster',
        bazarMonster.id,
        -1,
        userId,
        null,
        null,
        { activity_reward: true, monster_name: name, species: rewardData.species1 }
      );
    } catch (txError) {
      console.error('Error recording activity monster forfeit transaction:', txError);
    }

    // Mark reward as claimed/forfeited
    const forfeitedReward: ActivityReward = {
      ...reward,
      claimed: true,
      claimed_by: -1,
      claimed_at: new Date().toISOString(),
    };
    session.rewards[rewardIndex] = forfeitedReward;

    await this.sessionRepo.updateRewards(sessionId, JSON.stringify(session.rewards));

    return { success: true, bazarMonsterId: bazarMonster.id };
  }

  // ==========================================================================
  // Clear Session
  // ==========================================================================

  async clearSession(sessionId: string, userId: string): Promise<void> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    if (row.player_id !== userId) {
      throw new Error('Not authorized to clear this session');
    }

    await this.sessionRepo.deleteSession(sessionId);
  }

  // ==========================================================================
  // Get Location Status
  // ==========================================================================

  async getLocationStatus(userId: string, location: string): Promise<{
    active_session: ActivitySession | null;
  }> {
    if (!isValidLocation(location)) {
      throw new Error(`Invalid location: ${location}`);
    }

    const row = await this.sessionRepo.findActiveByUserIdAndLocation(userId, location);
    return {
      active_session: row ? parseSessionRow(row) : null,
    };
  }

  // ==========================================================================
  // Private: Reward Processors
  // ==========================================================================

  private async claimCoinReward(trainerId: number, data: CoinRewardData): Promise<void> {
    await this.trainerRepo.updateCurrency(trainerId, data.amount);
  }

  private async claimItemReward(trainerId: number, data: ItemRewardData): Promise<void> {
    const category = (data.category || 'items') as InventoryCategory;
    await this.inventoryRepo.addItem(trainerId, category, data.name, data.quantity);
  }

  private async claimLevelReward(trainerId: number, data: LevelRewardData): Promise<void> {
    if (data.isMonster) {
      const monsters = await this.monsterRepo.findByTrainerId(trainerId);
      if (monsters.length > 0) {
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
        if (!randomMonster) {
          throw new Error('Failed to select random monster');
        }
        await this.monsterInitializer.levelUpMonster(randomMonster.id, data.levels);
        data.monster_id = randomMonster.id;
        data.monster_name = randomMonster.name ?? 'Unnamed';
      } else {
        // No monsters, give levels to trainer instead
        await this.trainerRepo.addLevels(trainerId, data.levels);
      }
    } else {
      await this.trainerRepo.addLevels(trainerId, data.levels);
    }
  }

  private async claimMonsterReward(
    trainerId: number,
    userId: string,
    data: MonsterRewardData,
    monsterName?: string
  ): Promise<void> {
    const rolledMonster = data.rolled_monster;
    if (!rolledMonster) {
      throw new Error('No rolled monster data available');
    }

    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Initialize monster from rolled data
    const monsterData = {
      trainer_id: trainerId,
      player_user_id: userId,
      name: monsterName ?? (rolledMonster.name as string) ?? 'New Monster',
      level: data.level ?? 1,
      species1: (rolledMonster.species1 as string) ?? (rolledMonster.name as string),
      species2: (rolledMonster.species2 as string) ?? null,
      species3: (rolledMonster.species3 as string) ?? null,
      type1: (rolledMonster.type1 as string) ?? '',
      type2: (rolledMonster.type2 as string) ?? null,
      type3: (rolledMonster.type3 as string) ?? null,
      type4: (rolledMonster.type4 as string) ?? null,
      type5: (rolledMonster.type5 as string) ?? null,
      attribute: (rolledMonster.attribute as string) ?? null,
    };

    const initializedMonster = await this.monsterInitializer.initializeMonster(monsterData);
    const newMonster = await this.monsterRepo.create({
      trainerId,
      playerUserId: userId,
      name: initializedMonster.name ?? monsterData.name,
      species1: initializedMonster.species1 ?? monsterData.species1,
      species2: initializedMonster.species2,
      species3: initializedMonster.species3,
      type1: initializedMonster.type1 ?? monsterData.type1,
      type2: initializedMonster.type2,
      type3: initializedMonster.type3,
      type4: initializedMonster.type4,
      type5: initializedMonster.type5,
      attribute: initializedMonster.attribute,
      level: initializedMonster.level ?? monsterData.level,
      hpTotal: initializedMonster.hp_total,
      hpIv: initializedMonster.hp_iv,
      hpEv: initializedMonster.hp_ev,
      atkTotal: initializedMonster.atk_total,
      atkIv: initializedMonster.atk_iv,
      atkEv: initializedMonster.atk_ev,
      defTotal: initializedMonster.def_total,
      defIv: initializedMonster.def_iv,
      defEv: initializedMonster.def_ev,
      spaTotal: initializedMonster.spa_total,
      spaIv: initializedMonster.spa_iv,
      spaEv: initializedMonster.spa_ev,
      spdTotal: initializedMonster.spd_total,
      spdIv: initializedMonster.spd_iv,
      spdEv: initializedMonster.spd_ev,
      speTotal: initializedMonster.spe_total,
      speIv: initializedMonster.spe_iv,
      speEv: initializedMonster.spe_ev,
      nature: initializedMonster.nature,
      characteristic: initializedMonster.characteristic,
      gender: initializedMonster.gender,
      friendship: initializedMonster.friendship,
      ability1: initializedMonster.ability1,
      ability2: initializedMonster.ability2,
      moveset: initializedMonster.moveset as string[] | undefined,
      imgLink: null,
      whereMet: 'Town Activity',
    });

    // Update reward data with the created monster info
    data.monster_id = newMonster.id;
    data.monster_name = newMonster.name;
    data.monster_species = newMonster.species1 ?? 'Unknown';
  }

  // ==========================================================================
  // Private: Reward Generation
  // ==========================================================================

  private async generateRewards(
    session: ActivitySession,
    trainers: { id: number }[],
    userSettings: UserSettings
  ): Promise<ActivityReward[]> {
    const rewards: ActivityReward[] = [];
    const rewardConfig = getRewardConfig(session.location, session.activity);
    if (!rewardConfig) {
      throw new Error(`No reward config for ${session.location}/${session.activity}`);
    }

    const getRandomTrainerId = (): number | null => {
      if (trainers.length === 0) {
        return null;
      }
      const randomTrainer = trainers[Math.floor(Math.random() * trainers.length)];
      return randomTrainer?.id ?? null;
    };

    const difficulty = session.difficulty ?? 'normal';

    // 1. Coin reward (always)
    rewards.push(this.generateCoinReward(rewardConfig, getRandomTrainerId));

    // 2. Item reward (chance-based)
    if (Math.random() < rewardConfig.itemChance) {
      const itemReward = await this.generateItemReward(rewardConfig, getRandomTrainerId);
      if (itemReward) {
        rewards.push(itemReward);
      }
    }

    // 3. Level reward (chance-based)
    if (Math.random() < rewardConfig.levelChance) {
      rewards.push(this.generateLevelReward(getRandomTrainerId));
    }

    // 4. Monster reward (chance-based or guaranteed on hard)
    const guaranteedMonster = rewardConfig.guaranteedMonsterOnHard && difficulty === 'hard';
    if (guaranteedMonster || Math.random() < rewardConfig.monsterChance) {
      const monsterReward = await this.generateMonsterReward(
        rewardConfig,
        session,
        userSettings,
        guaranteedMonster,
        difficulty
      );
      if (monsterReward) {
        rewards.push(monsterReward);
      }
    }

    return rewards;
  }

  private generateCoinReward(
    config: RewardConfig,
    getTrainerId: () => number | null
  ): ActivityReward {
    const amount = Math.floor(Math.random() * config.coinVariance) + config.baseCoinAmount;
    return {
      id: `coin-${crypto.randomUUID()}`,
      type: 'coin',
      reward_type: 'coin',
      rarity: 'common',
      reward_data: {
        amount,
        title: 'Coins',
      },
      assigned_to: getTrainerId(),
      claimed: false,
    };
  }

  private async generateItemReward(
    config: RewardConfig,
    getTrainerId: () => number | null
  ): Promise<ActivityReward | null> {
    try {
      const category = config.itemCategory;
      let rolledItems;

      if (category === 'any') {
        rolledItems = await this.itemRoller.rollItems({ quantity: 1 });
      } else if (category === 'any_except_key') {
        // Roll from all categories except keyitems
        rolledItems = await this.itemRoller.rollItems({
          category: ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals'],
          quantity: 1,
        });
      } else if (category) {
        rolledItems = await this.itemRoller.rollItems({
          category: category as 'berries' | 'eggs' | 'items',
          quantity: 1,
        });
      } else {
        rolledItems = await this.itemRoller.rollItems({ quantity: 1 });
      }

      if (!rolledItems || rolledItems.length === 0) {
        return null;
      }

      const item = rolledItems[0];
      if (!item) {
        return null;
      }
      const quantity = Math.floor(Math.random() * 3) + 1;

      return {
        id: `item-${crypto.randomUUID()}`,
        type: 'item',
        reward_type: 'item',
        rarity: item.rarity ?? 'uncommon',
        reward_data: {
          name: item.name,
          quantity,
          title: `${quantity} ${item.name}${quantity > 1 ? 's' : ''}`,
          description: item.description ?? null,
          image_url: item.image_url ?? null,
          category: item.category ?? 'items',
          effect: item.effect ?? null,
        },
        assigned_to: getTrainerId(),
        claimed: false,
      };
    } catch (error) {
      console.error('Error generating item reward:', error);
      return null;
    }
  }

  private generateLevelReward(getTrainerId: () => number | null): ActivityReward {
    const levels = Math.floor(Math.random() * 2) + 1;
    const isMonster = false; // Currently always trainer level

    return {
      id: `level-${crypto.randomUUID()}`,
      type: 'level',
      reward_type: 'level',
      rarity: 'uncommon',
      reward_data: {
        levels,
        isMonster,
        title: `${levels} Level${levels > 1 ? 's' : ''} for Trainer`,
      },
      assigned_to: getTrainerId(),
      claimed: false,
    };
  }

  private async generateMonsterReward(
    config: RewardConfig,
    session: ActivitySession,
    userSettings: UserSettings,
    guaranteedMonster: boolean,
    _difficulty: string
  ): Promise<ActivityReward | null> {
    try {
      // Determine rarity and level
      let rarity = 'uncommon';
      const level = Math.floor(Math.random() * 10);

      const isLegendary = config.legendaryChance > 0 && Math.random() < config.legendaryChance;

      if (guaranteedMonster && Math.random() < 0.4) {
        rarity = 'rare';
      } else if (isLegendary) {
        rarity = 'legendary';
      } else if (Math.random() < 0.2) {
        rarity = 'rare';
      }

      // Build roller params
      const rollerParams: RollParams = {
        includeStages: ['Base Stage', "Doesn't Evolve"],
        legendary: isLegendary,
        mythical: false,
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
        species_min: 1,
        species_max: 2,
        types_min: 1,
        types_max: 2,
        userSettings,
      };

      if (config.allowedMonsterTypes && config.allowedMonsterTypes.length > 0) {
        rollerParams.speciesTypesOptions = config.allowedMonsterTypes;
      }

      // Roll the monster
      const monsterRoller = new MonsterRollerService({
        seed: Date.now().toString(),
        userSettings,
      });

      const rolledMonsters = await monsterRoller.rollMany(rollerParams, 1);
      if (!rolledMonsters || rolledMonsters.length === 0) {
        return null;
      }

      const rolledMonster = rolledMonsters[0];
      if (!rolledMonster) {
        return null;
      }

      // Determine title
      let monsterTitle = 'Mystery Monster';
      if (session.location === 'pirates_dock' && session.activity === 'fishing') {
        monsterTitle = guaranteedMonster ? 'Rare Water Monster' : 'Water Monster';
      } else if (session.location === 'garden') {
        monsterTitle = 'Grass Monster';
      } else if (session.location === 'farm') {
        monsterTitle = 'Farm Monster';
      } else if (session.location === 'game_corner') {
        monsterTitle = isLegendary ? 'Legendary Monster' : 'Game Corner Monster';
      }

      return {
        id: `monster-${crypto.randomUUID()}`,
        type: 'monster',
        reward_type: 'monster',
        rarity,
        reward_data: {
          level,
          title: monsterTitle,
          rolled_monster: rolledMonster as unknown as Record<string, unknown>,
          monster_name: rolledMonster.name ?? 'Unnamed',
          monster_species: rolledMonster.species1 ?? rolledMonster.name ?? 'Unknown',
          monster_image: rolledMonster.image_url ?? null,
          species1: rolledMonster.species1 ?? rolledMonster.name ?? null,
          species2: rolledMonster.species2 ?? null,
          species3: rolledMonster.species3 ?? null,
          type1: rolledMonster.type1 ?? null,
          type2: rolledMonster.type2 ?? null,
          type3: rolledMonster.type3 ?? null,
          type4: rolledMonster.type4 ?? null,
          type5: rolledMonster.type5 ?? null,
          attribute: rolledMonster.attribute ?? null,
          monster_type: rolledMonster.monster_type ?? null,
          species_image_url: rolledMonster.image_url ?? null,
          species1_image: rolledMonster.species1_image ?? rolledMonster.image_url ?? null,
          species2_image: rolledMonster.species2_image ?? null,
          species3_image: rolledMonster.species3_image ?? null,
          allowed_types: config.allowedMonsterTypes,
          is_legendary: isLegendary,
        },
        assigned_to: null,
        claimed: false,
      };
    } catch (error) {
      console.error('Error generating monster reward:', error);
      return null;
    }
  }
}
