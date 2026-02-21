import { randomUUID } from 'crypto';
import {
  GardenPointRepository,
  TrainerRepository,
  TrainerInventoryRepository,
  MonsterRepository,
  UserRepository,
  ItemRepository,
  BazarRepository,
  type GardenPoint,
  type MonsterCreateInput,
  type BazarMonsterCreateInput,
  type ItemRow,
  type InventoryCategory,
} from '../repositories';
import { MonsterRollerService, type UserSettings } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';

// ============================================================================
// Types
// ============================================================================

export type HarvestReward = {
  id: string;
  type: 'item' | 'monster';
  rewardType: string;
  rarity: string;
  rewardData: Record<string, unknown>;
  assignedTo: number | null;
  claimed: boolean;
  claimedBy?: number | string;
  claimedAt?: string;
  forfeited?: boolean;
};

export type HarvestSession = {
  id: string;
  userId: number;
  location: string;
  activity: string;
  status: string;
  points: number;
  rewards: HarvestReward[];
  createdAt: string;
  completedAt: string;
  trainers: Record<string, unknown>[];
};

export type HarvestResult = {
  success: boolean;
  message: string;
  sessionId?: string;
  session?: HarvestSession;
  rewards?: HarvestReward[];
};

export type ClaimResult = {
  reward: HarvestReward;
  claimResult: Record<string, unknown>;
};

export type ForfeitResult = {
  success: boolean;
  bazarMonsterId?: number;
  message?: string;
};

// Garden monster roller parameters
const GARDEN_ROLLER_PARAMS: Record<string, unknown> = {
  includeStages: ['Base Stage', "Doesn't Evolve"],
  excludeStages: [
    'Stage 1', 'Stage 2', 'Stage 3',
    'Middle Stage', 'Final Stage', 'Evolves',
    'First Evolution', 'Second Evolution', 'Final Evolution',
  ],
  tableFilters: {
    pokemon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
      mythical: false,
    },
    digimon: {
      includeRanks: ['Baby I', 'Baby II'],
      excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion'],
    },
    yokai: {
      includeRanks: ['E', 'D', 'C'],
      excludeRanks: ['S', 'A', 'B'],
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
    },
    nexomon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
    },
    pals: {},
    finalfantasy: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
    },
    monsterhunter: {
      includeRanks: [1, 2, 3],
      excludeRanks: [4, 5, 6, 7, 8, 9, 10],
    },
  },
  legendary: false,
  mythical: false,
  species_min: 1,
  species_max: 2,
  types_min: 1,
  types_max: 3,
};

const GARDEN_TYPES = ['Grass', 'Bug', 'Ground', 'Normal', 'Water', 'Rock'];

// ============================================================================
// Service
// ============================================================================

export class GardenService {
  private gardenPointRepository: GardenPointRepository;
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private monsterRepository: MonsterRepository;
  private userRepository: UserRepository;
  private itemRepository: ItemRepository;
  private bazarRepository: BazarRepository;
  private initializerService: MonsterInitializerService;

  // In-memory storage for active harvest sessions
  private static activeHarvestSessions = new Map<string, HarvestSession>();

  constructor(
    gardenPointRepository?: GardenPointRepository,
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    monsterRepository?: MonsterRepository,
    userRepository?: UserRepository,
    itemRepository?: ItemRepository,
    bazarRepository?: BazarRepository,
    initializerService?: MonsterInitializerService
  ) {
    this.gardenPointRepository = gardenPointRepository ?? new GardenPointRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.userRepository = userRepository ?? new UserRepository();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.bazarRepository = bazarRepository ?? new BazarRepository();
    this.initializerService = initializerService ?? new MonsterInitializerService();
  }

  // ==========================================================================
  // Get Garden Points
  // ==========================================================================

  async getGardenPoints(userId: number): Promise<GardenPoint | { userId: number; points: number; lastHarvested: null }> {
    const gardenPoints = await this.gardenPointRepository.findByUserId(userId);
    return gardenPoints ?? { userId, points: 0, lastHarvested: null };
  }

  // ==========================================================================
  // Harvest
  // ==========================================================================

  async harvestGarden(userId: number, discordId: string): Promise<HarvestResult> {
    const gardenPoints = await this.gardenPointRepository.findByUserId(userId);

    if (!gardenPoints || gardenPoints.points <= 0) {
      return { success: false, message: 'No garden points to harvest' };
    }

    // Calculate rewards based on points
    const rewards = await this.calculateHarvestRewards(gardenPoints.points, userId);

    // Generate session
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    // Get user's trainers for the session
    const trainers = await this.trainerRepository.findByUserId(discordId);

    const session: HarvestSession = {
      id: sessionId,
      userId,
      location: 'garden',
      activity: 'harvest',
      status: 'completed',
      points: gardenPoints.points,
      rewards,
      createdAt: now,
      completedAt: now,
      trainers: trainers as unknown as Record<string, unknown>[],
    };

    // Update last harvested time (points reset when all rewards claimed)
    await this.gardenPointRepository.updateLastHarvested(userId);

    // Store in memory
    GardenService.activeHarvestSessions.set(sessionId, session);

    return {
      success: true,
      message: 'Garden harvested successfully',
      sessionId,
      session,
      rewards,
    };
  }

  // ==========================================================================
  // Get Harvest Session
  // ==========================================================================

  getHarvestSession(sessionId: string, userId: number): HarvestSession | null {
    const session = GardenService.activeHarvestSessions.get(sessionId);
    if (!session) {
      return null;
    }
    if (session.userId !== userId) {
      throw new Error('Unauthorized');
    }
    return session;
  }

  // ==========================================================================
  // Claim Reward
  // ==========================================================================

  async claimReward(
    sessionId: string,
    rewardId: string,
    trainerId: number,
    userId: number,
    monsterName?: string
  ): Promise<ClaimResult> {
    const session = GardenService.activeHarvestSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const reward = session.rewards.find((r) => r.id === rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }
    if (reward.claimed) {
      throw new Error('Reward already claimed');
    }

    const trainer = await this.trainerRepository.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    let claimResult: Record<string, unknown>;

    switch (reward.type) {
      case 'item': {
        const rewardData = reward.rewardData;
        await this.inventoryRepository.addItem(
          trainerId,
          rewardData.category as InventoryCategory,
          rewardData.name as string,
          (rewardData.quantity as number) ?? 1
        );
        claimResult = { type: 'item', name: rewardData.name, category: rewardData.category };
        break;
      }

      case 'monster': {
        claimResult = await this.claimMonsterReward(reward, trainerId, userId, trainer.player_user_id, monsterName);
        break;
      }

      default:
        throw new Error(`Unsupported reward type: ${reward.type}`);
    }

    // Mark reward as claimed
    reward.claimed = true;
    reward.claimedBy = trainerId;

    // Check if all rewards are claimed
    const allClaimed = session.rewards.every((r) => r.claimed);
    if (allClaimed) {
      await this.gardenPointRepository.resetPoints(userId);
      GardenService.activeHarvestSessions.delete(sessionId);
    }

    return {
      reward: { ...reward, claimed: true, claimedBy: trainerId },
      claimResult,
    };
  }

  // ==========================================================================
  // Forfeit Monster
  // ==========================================================================

  async forfeitMonster(
    sessionId: string,
    rewardId: string,
    userId: number,
    monsterName?: string
  ): Promise<ForfeitResult> {
    const session = GardenService.activeHarvestSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const reward = session.rewards.find((r) => r.id === rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }
    if (reward.claimed) {
      throw new Error('Reward already claimed');
    }
    if (reward.type !== 'monster') {
      throw new Error('Only monster rewards can be forfeited');
    }

    const rewardData = reward.rewardData;
    const trimmedName = (monsterName ?? '').trim();
    const name = trimmedName ? trimmedName : ((rewardData.species1 as string) ?? 'Garden Monster');

    // Create monster in bazar
    const bazarInput: BazarMonsterCreateInput = {
      originalMonsterId: -1,
      forfeitedByTrainerId: -1,
      forfeitedByUserId: userId.toString(),
      name,
      species1: (rewardData.species1 as string) ?? 'Unknown',
      species2: rewardData.species2 as string | null,
      species3: rewardData.species3 as string | null,
      type1: (rewardData.type1 as string) ?? 'Normal',
      type2: rewardData.type2 as string | null,
      type3: rewardData.type3 as string | null,
      type4: rewardData.type4 as string | null,
      type5: rewardData.type5 as string | null,
      attribute: rewardData.attribute as string | null,
      level: (rewardData.level as number) ?? 5,
    };

    const bazarMonster = await this.bazarRepository.createMonster(bazarInput);

    // Record transaction (non-critical)
    try {
      await this.bazarRepository.recordTransaction(
        'forfeit_monster',
        'monster',
        bazarMonster.id,
        -1,
        userId.toString(),
        null,
        null,
        { garden_reward: true, monster_name: name, species: rewardData.species1 }
      );
    } catch (txError) {
      console.error('Error recording garden monster forfeit transaction:', txError);
    }

    // Mark reward as claimed/forfeited
    reward.claimed = true;
    reward.claimedAt = new Date().toISOString();
    reward.forfeited = true;
    reward.claimedBy = 'Garden-Forfeit';

    return { success: true, bazarMonsterId: bazarMonster.id };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private async claimMonsterReward(
    reward: HarvestReward,
    trainerId: number,
    userId: number,
    playerUserId: string,
    monsterName?: string
  ): Promise<Record<string, unknown>> {
    const rewardData = reward.rewardData;

    // Check if monster was pre-rolled
    if (rewardData.monster_id) {
      return this.claimPreRolledMonster(rewardData, trainerId, playerUserId, monsterName);
    }

    // Roll monster on-demand
    return this.rollAndClaimMonster(rewardData, trainerId, userId, playerUserId, reward.id, monsterName);
  }

  private async claimPreRolledMonster(
    rewardData: Record<string, unknown>,
    trainerId: number,
    playerUserId: string,
    monsterName?: string
  ): Promise<Record<string, unknown>> {
    const name = monsterName?.trim() ?? (rewardData.monster_name as string) ?? 'Unnamed';

    const monsterInput: MonsterCreateInput = {
      trainerId,
      playerUserId,
      name,
      species1: rewardData.species1 as string,
      species2: rewardData.species2 as string | null,
      species3: rewardData.species3 as string | null,
      type1: (rewardData.type1 as string) ?? 'Normal',
      type2: rewardData.type2 as string | null,
      type3: rewardData.type3 as string | null,
      level: (rewardData.level as number) ?? 1,
      imgLink: null,
      whereMet: 'Garden Activity',
      dateMet: new Date(),
    };

    const createdMonster = await this.monsterRepository.create(monsterInput);

    // Initialize monster stats
    try {
      const initialized = await this.initializerService.initializeMonster(createdMonster.id);
      return initialized as unknown as Record<string, unknown>;
    } catch (initError) {
      console.error('Failed to initialize pre-rolled garden monster:', initError);
      return createdMonster as unknown as Record<string, unknown>;
    }
  }

  private async rollAndClaimMonster(
    rewardData: Record<string, unknown>,
    trainerId: number,
    userId: number,
    playerUserId: string,
    rewardId: string,
    monsterName?: string
  ): Promise<Record<string, unknown>> {
    const userSettings = await this.getUserSettings(userId);
    const sessionId = rewardId;

    const monsterRoller = new MonsterRollerService({
      seed: `${sessionId}-${rewardId}`,
      userSettings,
    });

    const params = (rewardData.params as Record<string, unknown>) ?? {};
    const rolledMonster = await monsterRoller.rollMonster(params);

    if (!rolledMonster) {
      throw new Error('Failed to roll monster');
    }

    const name = monsterName ?? (rolledMonster as Record<string, unknown>).species1 as string;

    const monsterInput: MonsterCreateInput = {
      trainerId,
      playerUserId,
      name,
      species1: (rolledMonster as Record<string, unknown>).species1 as string,
      species2: (rolledMonster as Record<string, unknown>).species2 as string | null,
      species3: (rolledMonster as Record<string, unknown>).species3 as string | null,
      type1: (rolledMonster as Record<string, unknown>).type1 as string,
      type2: (rolledMonster as Record<string, unknown>).type2 as string | null,
      type3: (rolledMonster as Record<string, unknown>).type3 as string | null,
      type4: (rolledMonster as Record<string, unknown>).type4 as string | null,
      type5: (rolledMonster as Record<string, unknown>).type5 as string | null,
      attribute: (rolledMonster as Record<string, unknown>).attribute as string | null,
      level: 5,
      whereMet: 'Garden Activity',
      dateMet: new Date(),
    };

    const createdMonster = await this.monsterRepository.create(monsterInput);

    try {
      const initialized = await this.initializerService.initializeMonster(createdMonster.id);
      return initialized as unknown as Record<string, unknown>;
    } catch (initError) {
      console.error('Failed to initialize garden monster:', initError);
      return createdMonster as unknown as Record<string, unknown>;
    }
  }

  private async calculateHarvestRewards(points: number, userId: number): Promise<HarvestReward[]> {
    const rewards: HarvestReward[] = [];

    // Fetch berries by rarity
    const [allCommonBerries, allUncommonBerries, allRareBerries] = await Promise.all([
      this.itemRepository.findByCategory('berries').then((items) =>
        items.filter((i) => i.rarity?.toLowerCase() === 'common')
      ),
      this.itemRepository.findByCategory('berries').then((items) =>
        items.filter((i) => i.rarity?.toLowerCase() === 'uncommon')
      ),
      this.itemRepository.findByCategory('berries').then((items) =>
        items.filter((i) => i.rarity?.toLowerCase() === 'rare')
      ),
    ]);

    const pickRandom = (arr: ItemRow[]): ItemRow | undefined =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

    // Guaranteed berry if points > 0
    if (points > 0 && allCommonBerries.length > 0) {
      const berry = pickRandom(allCommonBerries);
      if (berry) {
        rewards.push({
          id: `berry-${randomUUID()}`,
          type: 'item',
          rewardType: 'item',
          rarity: 'common',
          rewardData: {
            name: berry.name,
            category: 'berries',
            title: berry.name,
            description: `A ${berry.name} from your garden.`,
          },
          assignedTo: null,
          claimed: false,
        });
      }
    }

    // 40% chance per point for an extra berry
    for (let i = 0; i < points; i++) {
      if (Math.random() < 0.4) {
        let berry: ItemRow | undefined;
        let rarity: string;

        const rarityRoll = Math.random();
        if (rarityRoll < 0.7) {
          berry = pickRandom(allCommonBerries);
          rarity = 'common';
        } else if (rarityRoll < 0.9) {
          berry = pickRandom(allUncommonBerries);
          rarity = 'uncommon';
        } else {
          berry = pickRandom(allRareBerries);
          rarity = 'rare';
        }

        if (berry) {
          let quantity = 1;
          const quantityRoll = Math.random();
          if (quantityRoll < 0.2) {
            quantity = 2;
          } else if (quantityRoll < 0.3) {
            quantity = 3;
          }

          rewards.push({
            id: `berry-${randomUUID()}`,
            type: 'item',
            rewardType: 'item',
            rarity,
            rewardData: {
              name: berry.name,
              category: 'berries',
              title: `${quantity} ${berry.name}${quantity > 1 ? 's' : ''}`,
              description: `${quantity} ${berry.name}${quantity > 1 ? 's' : ''} from your garden.`,
              quantity,
            },
            assignedTo: null,
            claimed: false,
          });
        }
      }
    }

    // 20% chance per point for a monster
    for (let i = 0; i < points; i++) {
      if (Math.random() < 0.2) {
        const monsterReward = await this.preRollGardenMonster(userId, i);
        if (monsterReward) {
          rewards.push(monsterReward);
        }
      }
    }

    return rewards;
  }

  private async preRollGardenMonster(userId: number, index: number): Promise<HarvestReward | null> {
    try {
      const userSettings = await this.getUserSettings(userId);

      const monsterRoller = new MonsterRollerService({
        seed: `garden-${Date.now()}-${index}`,
        userSettings,
      });

      const rollerParams = {
        ...GARDEN_ROLLER_PARAMS,
        level: Math.floor(Math.random() * 10) + 5,
        context: 'garden_reward',
      };

      const rolledMonster = await monsterRoller.rollMonster(rollerParams as Record<string, unknown>);
      const monster = rolledMonster as Record<string, unknown> | null;

      if (!monster?.species1) {
        return this.fallbackMonsterReward();
      }

      // Apply garden types
      const numTypes = Math.floor(Math.random() * 3) + 1;
      const selectedTypes: string[] = [];
      for (let t = 0; t < numTypes; t++) {
        const available = GARDEN_TYPES.filter((type) => !selectedTypes.includes(type));
        if (available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          if (picked) {
            selectedTypes.push(picked);
          }
        }
      }

      monster.type1 = selectedTypes[0] ?? 'Normal';
      monster.type2 = selectedTypes[1] ?? null;
      monster.type3 = selectedTypes[2] ?? null;
      monster.type4 = null;
      monster.type5 = null;

      return {
        id: `monster-${randomUUID()}`,
        type: 'monster',
        rewardType: 'monster',
        rarity: 'rare',
        rewardData: {
          title: 'Garden Monster',
          description: 'A monster from your garden.',
          params: GARDEN_ROLLER_PARAMS,
          monster_id: monster.id,
          monster_name: (monster.name as string) || 'Garden Monster',
          monster_species: (monster.species1 as string) || 'Unknown',
          monster_image: monster.species1_image ?? monster.image_url ?? null,
          species1: monster.species1,
          species1_image: monster.species1_image ?? monster.image_url ?? null,
          species2: monster.species2,
          species2_image: monster.species2_image ?? null,
          species3: monster.species3,
          species3_image: monster.species3_image ?? null,
          type1: monster.type1,
          type2: monster.type2,
          type3: monster.type3,
          attribute: monster.attribute,
          level: monster.level,
        },
        assignedTo: null,
        claimed: false,
      };
    } catch (error) {
      console.error('Error pre-rolling garden monster:', error);
      return this.fallbackMonsterReward();
    }
  }

  private fallbackMonsterReward(): HarvestReward {
    return {
      id: `monster-${randomUUID()}`,
      type: 'monster',
      rewardType: 'monster',
      rarity: 'rare',
      rewardData: {
        title: 'Garden Monster',
        description: 'A monster from your garden.',
        params: GARDEN_ROLLER_PARAMS,
      },
      assignedTo: null,
      claimed: false,
    };
  }

  private async getUserSettings(userId: number): Promise<UserSettings> {
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

    const user = await this.userRepository.findById(userId);
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
}
