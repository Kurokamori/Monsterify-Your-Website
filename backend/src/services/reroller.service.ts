import {
  RerollRepository,
  TrainerRepository,
  TrainerInventoryRepository,
  MonsterRepository,
  UserRepository,
  type RerollSession,
  type RerollSessionWithDetails,
  type RerollSessionCreateInput,
  type RerollSessionUpdateInput,
  type RerollSessionQueryOptions,
  type PaginatedRerollSessions,
  type RerollClaimWithDetails,
  type MonsterCreateInput,
  type InventoryCategory,
} from '../repositories';
import { MonsterRollerService, type UserSettings } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import { ItemRollerService, type RolledItem } from './item-roller.service';

// ============================================================================
// Types
// ============================================================================

type RollType = 'monster' | 'item' | 'combined' | 'gift' | 'birthday';

export type CreateSessionInput = {
  rollType: RollType;
  targetUserId: number;
  monsterParams?: Record<string, unknown> | null;
  itemParams?: Record<string, unknown> | null;
  giftLevels?: number;
  monsterCount?: number;
  itemCount?: number;
  monsterClaimLimit?: number | null;
  itemClaimLimit?: number | null;
  notes?: string | null;
  createdBy: number;
};

export type ClaimInput = {
  type: 'monster' | 'item';
  index: number;
  trainerId: number;
  name?: string;
};

export type ClaimSubmitResult = {
  monsters: { id: number; name: string; species1: string; trainerId: number }[];
  items: { name: string; category: string; quantity: number; trainerId: number }[];
};

export type TokenCheckResult = {
  valid: boolean;
  rollType: string;
  targetUserId: number;
};

export type ClaimSessionData = {
  rollType: string;
  giftLevels: number;
  monsters: (Record<string, unknown> & { index: number; claimed: boolean })[];
  items: (Record<string, unknown> & { index: number; claimed: boolean })[];
  monsterClaimLimit: number | null;
  itemClaimLimit: number | null;
  remaining: {
    monstersRemaining: number | 'unlimited';
    itemsRemaining: number | 'unlimited';
    monstersClaimed: number;
    itemsClaimed: number;
  };
  trainers: Record<string, unknown>[];
};

// ============================================================================
// Constants
// ============================================================================

const VALID_ROLL_TYPES = ['monster', 'item', 'combined', 'gift', 'birthday'];

const DEFAULT_ITEM_CATEGORIES = ['berries', 'pastries', 'evolution', 'balls', 'antiques', 'helditems'];

const CATEGORY_TO_INVENTORY: Record<string, string> = {
  berries: 'berries',
  pastries: 'pastries',
  evolution: 'evolution',
  balls: 'balls',
  antiques: 'antiques',
  helditems: 'helditems',
  eggs: 'eggs',
  seals: 'seals',
  keyitems: 'keyitems',
};

const DEFAULT_MONSTER_PARAMS: Record<string, unknown> = {
  includeStages: ['Base Stage', "Doesn't Evolve"],
  legendary: false,
  mythical: false,
  tableFilters: {
    digimon: { includeRanks: ['Baby I', 'Baby II', 'In-Training', 'Rookie'] },
    yokai: { includeRanks: ['E', 'D', 'C'] },
    finalfantasy: { includeStages: ['Base Stage', "Doesn't Evolve"] },
    monsterhunter: { includeRanks: [1, 2, 3] },
  },
};

const BIRTHDAY_MONSTER_PARAMS: Record<string, unknown> = {
  includeStages: ['Base Stage', "Doesn't Evolve", 'Baby I', 'Baby II'],
  legendary: false,
  mythical: false,
  tableFilters: {
    digimon: { includeRanks: ['Baby I', 'Baby II', 'In-Training', 'Rookie'] },
    yokai: { includeRanks: ['E', 'D', 'C'] },
    finalfantasy: { includeStages: ['Base Stage', "Doesn't Evolve"] },
    monsterhunter: { includeRanks: [1, 2, 3] },
  },
};

// ============================================================================
// Service
// ============================================================================

export class RerollerService {
  private rerollRepository: RerollRepository;
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private monsterRepository: MonsterRepository;
  private userRepository: UserRepository;
  private initializerService: MonsterInitializerService;
  private itemRollerService: ItemRollerService;

  constructor(
    rerollRepository?: RerollRepository,
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    monsterRepository?: MonsterRepository,
    userRepository?: UserRepository,
    initializerService?: MonsterInitializerService,
    itemRollerService?: ItemRollerService
  ) {
    this.rerollRepository = rerollRepository ?? new RerollRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.userRepository = userRepository ?? new UserRepository();
    this.initializerService = initializerService ?? new MonsterInitializerService();
    this.itemRollerService = itemRollerService ?? new ItemRollerService();
  }

  // ==========================================================================
  // Admin: Create Session
  // ==========================================================================

  async createSession(input: CreateSessionInput): Promise<{ session: RerollSession; claimUrl: string }> {
    if (!VALID_ROLL_TYPES.includes(input.rollType)) {
      throw new Error('Invalid roll type. Must be monster, item, combined, gift, or birthday.');
    }

    if (!input.targetUserId) {
      throw new Error('Target user ID is required.');
    }

    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) {
      throw new Error('Target user not found.');
    }

    // Get target user's settings
    const targetUserSettings = await this.getUserSettings(input.targetUserId);

    let rolledMonsters: unknown[] = [];
    let rolledItems: unknown[] = [];

    switch (input.rollType) {
      case 'monster': {
        const count = input.monsterCount ?? 1;
        rolledMonsters = await this.rollMonsters(input.monsterParams ?? {}, count, targetUserSettings);
        break;
      }
      case 'item': {
        const count = input.itemCount ?? 1;
        rolledItems = await this.rollItems(input.itemParams ?? {}, count);
        break;
      }
      case 'combined': {
        const mCount = input.monsterCount ?? 1;
        const iCount = input.itemCount ?? 1;
        rolledMonsters = await this.rollMonsters(input.monsterParams ?? {}, mCount, targetUserSettings);
        rolledItems = await this.rollItems(input.itemParams ?? {}, iCount);
        break;
      }
      case 'gift': {
        if (!input.giftLevels || input.giftLevels < 1) {
          throw new Error('Gift levels must be at least 1.');
        }
        const { itemCount: giftItemCount, monsterCount: giftMonsterCount } =
          this.calculateGiftCounts(input.giftLevels);

        const giftParams = { ...DEFAULT_MONSTER_PARAMS, legendary: false, mythical: false };

        if (giftMonsterCount > 0) {
          rolledMonsters = await this.rollMonsters(giftParams, giftMonsterCount, targetUserSettings);
        }
        if (giftItemCount > 0) {
          rolledItems = await this.rollItems({ categories: DEFAULT_ITEM_CATEGORIES }, giftItemCount);
        }
        break;
      }
      case 'birthday': {
        rolledMonsters = await this.rollMonsters(BIRTHDAY_MONSTER_PARAMS, 10, targetUserSettings);
        rolledItems = await this.rollItems({ categories: DEFAULT_ITEM_CATEGORIES }, 10);
        break;
      }
    }

    // For gift/birthday, claim limits are null (unlimited)
    const isGiftOrBirthday = input.rollType === 'gift' || input.rollType === 'birthday';

    const createInput: RerollSessionCreateInput = {
      rollType: input.rollType === 'combined' || input.rollType === 'gift' || input.rollType === 'birthday'
        ? 'both'
        : (input.rollType as 'monster' | 'item' | 'both'),
      targetUserId: input.targetUserId,
      monsterParams: input.monsterParams ?? null,
      itemParams: input.itemParams ?? null,
      giftLevels: input.giftLevels ?? 0,
      rolledMonsters,
      rolledItems,
      monsterClaimLimit: isGiftOrBirthday ? null : (input.monsterClaimLimit ?? null),
      itemClaimLimit: isGiftOrBirthday ? null : (input.itemClaimLimit ?? null),
      createdBy: input.createdBy,
      notes: input.notes ?? null,
    };

    const session = await this.rerollRepository.create(createInput);

    return {
      session,
      claimUrl: `/claim/${session.token}`,
    };
  }

  // ==========================================================================
  // Admin: List Sessions
  // ==========================================================================

  async listSessions(options: RerollSessionQueryOptions = {}): Promise<PaginatedRerollSessions> {
    return this.rerollRepository.findAll(options);
  }

  // ==========================================================================
  // Admin: Get Session
  // ==========================================================================

  async getSession(id: number): Promise<{ session: RerollSessionWithDetails; claims: RerollClaimWithDetails[] }> {
    const session = await this.rerollRepository.findById(id);
    if (!session) {
      throw new Error('Session not found.');
    }

    const claims = await this.rerollRepository.getClaimsBySession(session.id);

    return { session, claims };
  }

  // ==========================================================================
  // Admin: Update Session
  // ==========================================================================

  async updateSession(id: number, input: RerollSessionUpdateInput): Promise<RerollSession> {
    const session = await this.rerollRepository.findById(id);
    if (!session) {
      throw new Error('Session not found.');
    }

    return this.rerollRepository.update(id, input);
  }

  // ==========================================================================
  // Admin: Delete Session
  // ==========================================================================

  async deleteSession(id: number): Promise<void> {
    const session = await this.rerollRepository.findById(id);
    if (!session) {
      throw new Error('Session not found.');
    }

    await this.rerollRepository.delete(id);
  }

  // ==========================================================================
  // Admin: Update Result
  // ==========================================================================

  async updateResult(
    sessionId: number,
    type: 'monster' | 'item',
    index: number,
    data: unknown
  ): Promise<RerollSession> {
    const session = await this.rerollRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found.');
    }

    const isClaimed = await this.rerollRepository.isIndexClaimed(session.id, type, index);
    if (isClaimed) {
      throw new Error('Cannot modify a claimed result.');
    }

    return this.rerollRepository.updateResult(sessionId, type, index, data);
  }

  // ==========================================================================
  // Admin: Delete Result
  // ==========================================================================

  async deleteResult(sessionId: number, type: 'monster' | 'item', index: number): Promise<RerollSession> {
    const session = await this.rerollRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found.');
    }

    const isClaimed = await this.rerollRepository.isIndexClaimed(session.id, type, index);
    if (isClaimed) {
      throw new Error('Cannot delete a claimed result.');
    }

    return this.rerollRepository.deleteResult(sessionId, type, index);
  }

  // ==========================================================================
  // Admin: Reroll Single Result
  // ==========================================================================

  async rerollResult(sessionId: number, type: 'monster' | 'item', index: number): Promise<RerollSession> {
    const session = await this.rerollRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found.');
    }

    const isClaimed = await this.rerollRepository.isIndexClaimed(session.id, type, index);
    if (isClaimed) {
      throw new Error('Cannot reroll a claimed result.');
    }

    const targetUserSettings = await this.getUserSettings(session.targetUserId);

    let newResult: unknown;
    if (type === 'monster') {
      const monsters = await this.rollMonsters(session.monsterParams ?? {}, 1, targetUserSettings);
      newResult = monsters[0];
    } else {
      const items = await this.rollItems(session.itemParams ?? {}, 1);
      newResult = items[0];
    }

    if (!newResult) {
      throw new Error('Failed to generate new result.');
    }

    return this.rerollRepository.updateResult(sessionId, type, index, newResult);
  }

  // ==========================================================================
  // Admin: Reroll All
  // ==========================================================================

  async rerollAll(sessionId: number): Promise<RerollSession> {
    const session = await this.rerollRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found.');
    }

    const claims = await this.rerollRepository.getClaimsBySession(session.id);
    if (claims.length > 0) {
      throw new Error('Cannot reroll session with existing claims.');
    }

    const targetUserSettings = await this.getUserSettings(session.targetUserId);

    let rolledMonsters: unknown[] = [];
    let rolledItems: unknown[] = [];

    // Determine the effective roll type
    // The DB stores 'both' for combined/gift/birthday, so check giftLevels to differentiate
    const isBirthday = session.giftLevels === 0 &&
      session.rolledMonsters.length === 10 &&
      session.rolledItems.length === 10;
    const isGift = session.giftLevels > 0;

    if (isGift) {
      const { itemCount, monsterCount } = this.calculateGiftCounts(session.giftLevels);
      if (monsterCount > 0) {
        rolledMonsters = await this.rollMonsters(DEFAULT_MONSTER_PARAMS, monsterCount, targetUserSettings);
      }
      if (itemCount > 0) {
        rolledItems = await this.rollItems({ categories: DEFAULT_ITEM_CATEGORIES }, itemCount);
      }
    } else if (isBirthday) {
      rolledMonsters = await this.rollMonsters(BIRTHDAY_MONSTER_PARAMS, 10, targetUserSettings);
      rolledItems = await this.rollItems({ categories: DEFAULT_ITEM_CATEGORIES }, 10);
    } else if (session.rollType === 'monster') {
      rolledMonsters = await this.rollMonsters(
        session.monsterParams ?? {},
        session.rolledMonsters.length,
        targetUserSettings
      );
    } else if (session.rollType === 'item') {
      rolledItems = await this.rollItems(session.itemParams ?? {}, session.rolledItems.length);
    } else {
      // 'both' (combined)
      rolledMonsters = await this.rollMonsters(
        session.monsterParams ?? {},
        session.rolledMonsters.length,
        targetUserSettings
      );
      rolledItems = await this.rollItems(session.itemParams ?? {}, session.rolledItems.length);
    }

    return this.rerollRepository.update(sessionId, { rolledMonsters, rolledItems });
  }

  // ==========================================================================
  // Player: Check Token
  // ==========================================================================

  async checkToken(token: string): Promise<TokenCheckResult> {
    const session = await this.rerollRepository.findByToken(token);
    if (!session) {
      throw new Error('Invalid or expired claim link.');
    }

    if (session.status !== 'active') {
      throw new Error(`This claim link is ${session.status}.`);
    }

    return {
      valid: true,
      rollType: session.rollType,
      targetUserId: session.targetUserId,
    };
  }

  // ==========================================================================
  // Player: Get Claim Session
  // ==========================================================================

  async getClaimSession(token: string, userId: number, discordId: string): Promise<ClaimSessionData> {
    const session = await this.rerollRepository.findByToken(token);
    if (!session) {
      throw new Error('Invalid or expired claim link.');
    }

    if (session.status !== 'active') {
      throw new Error(`This claim link is ${session.status}.`);
    }

    if (session.targetUserId !== userId) {
      throw new Error('This claim link is not for your account.');
    }

    // Get claimed indices
    const monsterClaimedIndices = await this.rerollRepository.getClaimedIndices(session.id, 'monster');
    const itemClaimedIndices = await this.rerollRepository.getClaimedIndices(session.id, 'item');

    // Get remaining claims
    const remaining = await this.rerollRepository.getRemainingClaims(
      session.id,
      userId,
      session.monsterClaimLimit,
      session.itemClaimLimit
    );

    // Get user's trainers
    const trainers = await this.trainerRepository.findByUserId(discordId);

    // Mark availability
    const availableMonsters = session.rolledMonsters.map((m, i) => ({
      ...(m as Record<string, unknown>),
      index: i,
      claimed: monsterClaimedIndices.includes(i),
    }));

    const availableItems = session.rolledItems.map((item, i) => ({
      ...(item as Record<string, unknown>),
      index: i,
      claimed: itemClaimedIndices.includes(i),
    }));

    return {
      rollType: session.rollType,
      giftLevels: session.giftLevels,
      monsters: availableMonsters,
      items: availableItems,
      monsterClaimLimit: session.monsterClaimLimit,
      itemClaimLimit: session.itemClaimLimit,
      remaining,
      trainers: trainers as unknown as Record<string, unknown>[],
    };
  }

  // ==========================================================================
  // Player: Submit Claims
  // ==========================================================================

  async submitClaims(
    token: string,
    userId: number,
    discordId: string,
    claims: ClaimInput[]
  ): Promise<ClaimSubmitResult> {
    if (!claims || claims.length === 0) {
      throw new Error('Claims array is required.');
    }

    const session = await this.rerollRepository.findByToken(token);
    if (!session) {
      throw new Error('Invalid or expired claim link.');
    }

    if (session.status !== 'active') {
      throw new Error(`This claim link is ${session.status}.`);
    }

    if (session.targetUserId !== userId) {
      throw new Error('This claim link is not for your account.');
    }

    // Separate claims by type
    const monsterClaims = claims.filter((c) => c.type === 'monster');
    const itemClaims = claims.filter((c) => c.type === 'item');

    // Validate claim limits
    const remaining = await this.rerollRepository.getRemainingClaims(
      session.id,
      userId,
      session.monsterClaimLimit,
      session.itemClaimLimit
    );

    if (
      session.monsterClaimLimit !== null &&
      remaining.monstersRemaining !== 'unlimited' &&
      monsterClaims.length > remaining.monstersRemaining
    ) {
      throw new Error(`You can only claim ${remaining.monstersRemaining} more monster(s).`);
    }

    if (
      session.itemClaimLimit !== null &&
      remaining.itemsRemaining !== 'unlimited' &&
      itemClaims.length > remaining.itemsRemaining
    ) {
      throw new Error(`You can only claim ${remaining.itemsRemaining} more item(s).`);
    }

    const createdMonsters: ClaimSubmitResult['monsters'] = [];
    const addedItems: ClaimSubmitResult['items'] = [];

    for (const claim of claims) {
      // Validate trainer ownership
      const trainer = await this.trainerRepository.findById(claim.trainerId);
      if (!trainer) {
        throw new Error(`Trainer ${claim.trainerId} not found.`);
      }

      if (trainer.player_user_id !== discordId && trainer.player_user_id !== userId.toString()) {
        throw new Error(`Trainer ${trainer.name} does not belong to you.`);
      }

      // Check if already claimed
      const alreadyClaimed = await this.rerollRepository.isIndexClaimed(session.id, claim.type, claim.index);
      if (alreadyClaimed) {
        throw new Error(`${claim.type} at index ${claim.index} has already been claimed.`);
      }

      if (claim.type === 'monster') {
        const monsterData = session.rolledMonsters[claim.index] as Record<string, unknown> | undefined;
        if (!monsterData) {
          throw new Error(`Invalid monster index ${claim.index}.`);
        }

        const monsterName = claim.name ?? (monsterData.species1 as string) ?? 'New Monster';

        const monsterInput: MonsterCreateInput = {
          trainerId: claim.trainerId,
          playerUserId: discordId,
          name: monsterName,
          species1: monsterData.species1 as string,
          species2: (monsterData.species2 as string | null) ?? null,
          species3: (monsterData.species3 as string | null) ?? null,
          type1: monsterData.type1 as string,
          type2: (monsterData.type2 as string | null) ?? null,
          type3: (monsterData.type3 as string | null) ?? null,
          type4: (monsterData.type4 as string | null) ?? null,
          type5: (monsterData.type5 as string | null) ?? null,
          attribute: (monsterData.attribute as string | null) ?? null,
          level: 1,
          whereMet: 'Reroller Reward',
          dateMet: new Date(),
        };

        const createdMonster = await this.monsterRepository.create(monsterInput);

        // Initialize monster
        try {
          await this.initializerService.initializeMonster(createdMonster.id);
        } catch (initError) {
          console.error('Failed to initialize reroller monster:', initError);
        }

        createdMonsters.push({
          id: createdMonster.id,
          name: monsterName,
          species1: monsterData.species1 as string,
          trainerId: claim.trainerId,
        });

        // Record claim
        await this.rerollRepository.createClaim({
          sessionId: session.id,
          userId,
          trainerId: claim.trainerId,
          claimType: 'monster',
          resultIndex: claim.index,
          claimedData: monsterData,
          monsterName,
        });
      } else if (claim.type === 'item') {
        const itemData = session.rolledItems[claim.index] as Record<string, unknown> | undefined;
        if (!itemData) {
          throw new Error(`Invalid item index ${claim.index}.`);
        }

        const category = (itemData.category as string)?.toLowerCase() ?? '';
        const inventoryField = (CATEGORY_TO_INVENTORY[category] ?? 'items') as InventoryCategory;
        const quantity = (itemData.quantity as number) ?? 1;

        await this.inventoryRepository.addItem(
          claim.trainerId,
          inventoryField,
          itemData.name as string,
          quantity
        );

        addedItems.push({
          name: itemData.name as string,
          category: itemData.category as string,
          quantity,
          trainerId: claim.trainerId,
        });

        // Record claim
        await this.rerollRepository.createClaim({
          sessionId: session.id,
          userId,
          trainerId: claim.trainerId,
          claimType: 'item',
          resultIndex: claim.index,
          claimedData: itemData,
          itemQuantity: quantity,
        });
      }
    }

    // Check if fully claimed
    const isFullyClaimed = await this.rerollRepository.isFullyClaimed(session.id);
    if (isFullyClaimed) {
      await this.rerollRepository.update(session.id, { status: 'completed' });
    }

    return { monsters: createdMonsters, items: addedItems };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private async rollMonsters(
    params: Record<string, unknown>,
    count: number,
    userSettings: UserSettings
  ): Promise<unknown[]> {
    const monsters: unknown[] = [];

    for (let i = 0; i < count; i++) {
      const seed = params.seed ? `${params.seed}-${i}` : `${Date.now()}-${i}`;
      const monsterRoller = new MonsterRollerService({ seed: seed.toString(), userSettings });

      const rollParams = { ...DEFAULT_MONSTER_PARAMS, ...params };

      try {
        const monster = await monsterRoller.rollMonster(rollParams);
        if (monster) {
          monsters.push({ ...(monster as Record<string, unknown>), index: i });
        }
      } catch (error) {
        console.error(`Error rolling monster ${i}:`, error);
      }
    }

    return monsters;
  }

  private async rollItems(params: Record<string, unknown>, count: number): Promise<unknown[]> {
    const categories = (params.categories as string[]) ?? DEFAULT_ITEM_CATEGORIES;
    const rarity = (params.rarity as string) ?? undefined;

    const items: RolledItem[] = await this.itemRollerService.rollItems({
      category: categories as unknown as 'ALL',
      rarity: rarity ?? null,
      quantity: count,
    });

    return items.map((item, index) => ({
      ...item,
      index,
      quantity: item.quantity ?? 1,
    }));
  }

  private calculateGiftCounts(giftLevels: number): { itemCount: number; monsterCount: number } {
    return {
      itemCount: Math.ceil(giftLevels / 5),
      monsterCount: Math.floor(giftLevels / 10),
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
