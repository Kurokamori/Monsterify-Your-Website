import { db } from '../database';
import {
  MissionRepository,
  UserMissionRepository,
  MonsterRepository,
  ItemRepository,
  TrainerInventoryRepository,
} from '../repositories';
import type {
  Mission,
  MissionCreateInput,
  MissionUpdateInput,
  MissionQueryOptions,
  PaginatedMissions,
  UserMission,
  UserMissionUpdateInput,
  UserMissionWithDetails,
  MonsterWithTrainer,
  MissionMonster,
  AdminUserMissionQueryOptions,
  PaginatedAdminUserMissions,
  ItemRow,
} from '../repositories';
import type {
  MissionRewardConfig,
  MissionItemRewardEntry,
  MissionRewardSummary,
  MissionRewardSummaryMonster,
  MissionRewardSummaryTrainer,
  MissionRewardSummaryItem,
  MissionRewardSummaryReallocation,
  LevelAllocationInput,
  ItemTrainerAssignment,
} from '../utils/types';
import { ItemRollerService } from './item-roller.service';

// ============================================================================
// Types
// ============================================================================

export type UserMissionWithMonsters = UserMissionWithDetails & {
  monsters: MissionMonster[];
};

export type AvailableMissionsResult = {
  availableMissions: Mission[];
  hasActiveMission: boolean;
  activeMissions: UserMissionWithMonsters[];
};

export type StartMissionResult = {
  success: boolean;
  message: string;
  userMission?: UserMission;
};

export type ClaimMissionResult = {
  success: boolean;
  message: string;
  needsAllocation?: boolean;
  excessLevels?: number;
  redistributableLevels?: number;
  rewardPreview?: {
    totalLevels: number;
    totalCoins: number;
    items: MissionRewardSummaryItem[];
    monsters: MissionRewardSummaryMonster[];
  };
  rewardSummary?: MissionRewardSummary;
  mission?: UserMissionWithDetails;
};

export type LastCompletedMissionResult = UserMissionWithMonsters & {
  rewardConfig: MissionRewardConfig | null;
};

// ============================================================================
// Service
// ============================================================================

export class MissionService {
  private missionRepo: MissionRepository;
  private userMissionRepo: UserMissionRepository;
  private monsterRepo: MonsterRepository;
  private itemRepo: ItemRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private itemRoller: ItemRollerService;

  constructor(
    missionRepo?: MissionRepository,
    userMissionRepo?: UserMissionRepository,
    monsterRepo?: MonsterRepository,
  ) {
    this.missionRepo = missionRepo ?? new MissionRepository();
    this.userMissionRepo = userMissionRepo ?? new UserMissionRepository();
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.itemRepo = new ItemRepository();
    this.inventoryRepo = new TrainerInventoryRepository();
    this.itemRoller = new ItemRollerService();
  }

  // ==========================================================================
  // Mission Queries
  // ==========================================================================

  async getAllMissions(options: MissionQueryOptions = {}): Promise<PaginatedMissions> {
    return this.missionRepo.findAll(options);
  }

  async getMissionById(id: number): Promise<Mission | null> {
    return this.missionRepo.findById(id);
  }

  async getAvailableMissions(userId: string): Promise<AvailableMissionsResult> {
    const [activeMissions, allActiveMissions] = await Promise.all([
      this.userMissionRepo.findActiveByUserId(userId),
      this.missionRepo.findActiveMissions(),
    ]);

    const hasActiveMission = activeMissions.length > 0;

    // Attach monsters to active missions
    const activeMissionsWithMonsters: UserMissionWithMonsters[] = await Promise.all(
      activeMissions.map(async (m) => ({
        ...m,
        monsters: await this.userMissionRepo.getMissionMonsters(m.id),
      })),
    );

    // Filter out missions the user already has active
    const activeMissionIds = new Set(activeMissions.map(m => m.missionId));
    const availableMissions = allActiveMissions.filter(
      m => !activeMissionIds.has(m.id),
    );

    return {
      availableMissions,
      hasActiveMission,
      activeMissions: activeMissionsWithMonsters,
    };
  }

  async getActiveMissions(userId: string): Promise<UserMissionWithMonsters[]> {
    const missions = await this.userMissionRepo.findActiveByUserId(userId);
    return Promise.all(
      missions.map(async (m) => ({
        ...m,
        monsters: await this.userMissionRepo.getMissionMonsters(m.id),
      })),
    );
  }

  async getEligibleMonsters(
    userId: string,
    missionId: number,
  ): Promise<MonsterWithTrainer[]> {
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error('Mission not found');
    }

    const monsters = await this.monsterRepo.findByUserId(userId);

    const requirements = mission.requirements as { types?: string[]; attributes?: string[]; minLevel?: number } | null;
    const requiredTypes = requirements?.types ?? [];
    const requiredAttributes = requirements?.attributes ?? [];

    return monsters.filter(m => {
      // Level check
      if (m.level < mission.minLevel) {
        return false;
      }

      // Type check: monster must have at least one of the required types
      if (requiredTypes.length > 0) {
        const monsterTypes = [m.type1, m.type2, m.type3, m.type4, m.type5]
          .filter((t): t is string => t !== null)
          .map(t => t.toLowerCase());
        const hasMatchingType = requiredTypes.some(rt => monsterTypes.includes(rt.toLowerCase()));
        if (!hasMatchingType) {
          return false;
        }
      }

      // Attribute check
      if (requiredAttributes.length > 0 && m.attribute) {
        if (!requiredAttributes.some(a => a.toLowerCase() === m.attribute?.toLowerCase())) {
          return false;
        }
      } else if (requiredAttributes.length > 0 && !m.attribute) {
        return false;
      }

      return true;
    });
  }

  // ==========================================================================
  // Last Completed Mission
  // ==========================================================================

  async getLastCompletedMission(userId: string): Promise<LastCompletedMissionResult | null> {
    const userMission = await this.userMissionRepo.findLastCompletedByUserId(userId);
    if (!userMission) { return null; }

    const [monsters, mission] = await Promise.all([
      this.userMissionRepo.getMissionMonsters(userMission.id),
      this.missionRepo.findById(userMission.missionId),
    ]);

    return {
      ...userMission,
      monsters,
      rewardConfig: (mission?.rewardConfig as MissionRewardConfig) ?? null,
    };
  }

  // ==========================================================================
  // Mission Actions
  // ==========================================================================

  async startMission(
    userId: string,
    missionId: number,
    monsterIds: number[] = [],
  ): Promise<StartMissionResult> {
    // Check if mission exists
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      return { success: false, message: 'Mission not found' };
    }

    if (mission.status !== 'active') {
      return { success: false, message: 'This mission is not currently available' };
    }

    // Check if user already has this mission active
    const activeMissions = await this.userMissionRepo.findActiveByUserId(userId);
    const alreadyActive = activeMissions.some(m => m.missionId === missionId);
    if (alreadyActive) {
      return { success: false, message: 'You already have this mission active' };
    }

    // Create user mission
    const userMission = await this.userMissionRepo.create({
      userId,
      missionId,
      requiredProgress: mission.requiredProgress,
    });

    // Assign monsters to the mission
    if (monsterIds.length > 0) {
      await this.userMissionRepo.addMonsters(userMission.id, monsterIds);
    }

    return {
      success: true,
      message: 'Mission started successfully',
      userMission,
    };
  }

  async claimRewards(
    userMissionId: number,
    userId: string,
    body?: { itemAssignments?: ItemTrainerAssignment[]; levelAllocations?: LevelAllocationInput[] },
  ): Promise<ClaimMissionResult> {
    // 1. Validate
    const userMission = await this.userMissionRepo.findById(userMissionId);
    if (!userMission) {
      return { success: false, message: 'Mission not found' };
    }
    if (userMission.userId !== userId) {
      return { success: false, message: 'This mission does not belong to you' };
    }
    if (userMission.status !== 'completed') {
      return { success: false, message: 'Mission is not completed yet' };
    }
    if (userMission.rewardClaimed) {
      return { success: false, message: 'Rewards already claimed' };
    }

    // 2. Fetch mission config and deployed monsters
    const mission = await this.missionRepo.findById(userMission.missionId);
    if (!mission) {
      return { success: false, message: 'Mission definition not found' };
    }

    const rewardConfig = (mission.rewardConfig ?? {}) as MissionRewardConfig;
    const monsters = await this.userMissionRepo.getMissionMonsters(userMission.id);

    // 3. Resolve reward amounts — reuse cached preview if available to avoid re-rolling
    const cachedPreview = userMission.rewardSummary as unknown as
      | { pending: true; totalLevels: number; totalCoins: number; rolledItems: MissionRewardSummaryItem[]; monsterLevelResults: MissionRewardSummaryMonster[] }
      | null;
    const hasCachedPreview = cachedPreview && typeof cachedPreview === 'object' && 'pending' in cachedPreview && cachedPreview.pending === true;

    const totalLevels = hasCachedPreview ? cachedPreview.totalLevels : (rewardConfig.levels ? this.resolveAmount(rewardConfig.levels) : 0);
    const totalCoins = hasCachedPreview ? cachedPreview.totalCoins : (rewardConfig.coins ? this.resolveAmount(rewardConfig.coins) : 0);
    const rolledItems = hasCachedPreview ? cachedPreview.rolledItems : await this.rollItemRewards(rewardConfig.items ?? []);
    const monsterLevelResults: MissionRewardSummaryMonster[] = hasCachedPreview ? cachedPreview.monsterLevelResults : [];

    // 4. Distribute levels to deployed monsters — cap at 100, track excess
    let totalExcess = 0;

    if (!hasCachedPreview) {
      const levelsPerMonster = monsters.length > 0 ? Math.floor(totalLevels / monsters.length) : 0;
      const extraLevels = monsters.length > 0 ? totalLevels % monsters.length : totalLevels;

      monsters.forEach((monster, i) => {
        const assignedLevels = levelsPerMonster + (i < extraLevels ? 1 : 0);
        const newLevel = Math.min(monster.level + assignedLevels, 100);
        const excess = Math.max(0, (monster.level + assignedLevels) - 100);

        monsterLevelResults.push({
          monsterId: monster.id,
          name: monster.name,
          levelsGained: newLevel - monster.level,
          newLevel,
          capped: excess > 0,
          excessLevels: excess,
        });

        totalExcess += excess;
      });
    } else {
      totalExcess = monsterLevelResults.reduce((sum, m) => sum + m.excessLevels, 0);
    }

    const redistributableLevels = Math.floor(totalExcess / 2);

    // 5. If level reallocation needed or items need a trainer selection, return preview
    const needsLevelReallocation = redistributableLevels > 0 && (!body?.levelAllocations || body.levelAllocations.length === 0);
    const needsTrainerSelection = rolledItems.length > 0 && (!body?.itemAssignments || body.itemAssignments.length === 0);

    if (needsLevelReallocation || needsTrainerSelection) {
      // Cache the rolled values so the confirmation call uses the same results
      if (!hasCachedPreview) {
        await db.query(
          'UPDATE user_missions SET reward_summary = $1 WHERE id = $2',
          [JSON.stringify({ pending: true, totalLevels, totalCoins, rolledItems, monsterLevelResults }), userMission.id]
        );
      }

      return {
        success: false,
        needsAllocation: true,
        excessLevels: totalExcess,
        redistributableLevels,
        rewardPreview: {
          totalLevels,
          totalCoins,
          items: rolledItems,
          monsters: monsterLevelResults,
        },
        message: needsLevelReallocation
          ? 'Level reallocation needed — some monsters exceed the level cap'
          : 'Select a trainer to receive item rewards',
      };
    }

    // Validate level allocations if provided
    const levelAllocations = body?.levelAllocations ?? [];
    if (redistributableLevels > 0) {
      const totalAllocated = levelAllocations.reduce((sum, a) => sum + a.levels, 0);
      if (totalAllocated > redistributableLevels) {
        return { success: false, message: `Cannot allocate more than ${redistributableLevels} redistributable levels` };
      }
    }

    // 6. Execute in transaction (levels, coins, summary — NOT items, which use separate connections)
    const itemAssignments = body?.itemAssignments ?? [];

    const rewardSummary = await db.transaction(async (client) => {
      // Apply monster levels
      for (const result of monsterLevelResults) {
        if (result.levelsGained > 0) {
          await client.query(
            'UPDATE monsters SET level = LEAST(level + $1, 100) WHERE id = $2',
            [result.levelsGained, result.monsterId]
          );
        }
      }

      // Apply reallocation levels
      const reallocations: MissionRewardSummaryReallocation[] = [];
      for (const alloc of levelAllocations) {
        if (alloc.levels <= 0) { continue; }

        if (alloc.targetType === 'monster') {
          await client.query(
            'UPDATE monsters SET level = LEAST(level + $1, 100) WHERE id = $2',
            [alloc.levels, alloc.targetId]
          );
          const nameResult = await client.query<{ name: string }>(
            'SELECT name FROM monsters WHERE id = $1',
            [alloc.targetId]
          );
          reallocations.push({
            targetType: 'monster',
            targetId: alloc.targetId,
            targetName: nameResult.rows[0]?.name ?? `Monster #${alloc.targetId}`,
            levels: alloc.levels,
          });
        } else {
          await client.query(
            'UPDATE trainers SET level = level + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [alloc.levels, alloc.targetId]
          );
          const nameResult = await client.query<{ name: string }>(
            'SELECT name FROM trainers WHERE id = $1',
            [alloc.targetId]
          );
          reallocations.push({
            targetType: 'trainer',
            targetId: alloc.targetId,
            targetName: nameResult.rows[0]?.name ?? `Trainer #${alloc.targetId}`,
            levels: alloc.levels,
          });
        }
      }

      // Apply coins — distribute proportionally to unique trainers of deployed monsters
      const trainerSummaries: MissionRewardSummaryTrainer[] = [];
      if (totalCoins > 0 && monsters.length > 0) {
        const uniqueTrainerIds = [...new Set(monsters.map(m => m.trainerId).filter((id): id is number => id !== null))];
        const coinsPerTrainer = uniqueTrainerIds.length > 0 ? Math.floor(totalCoins / uniqueTrainerIds.length) : 0;
        const extraCoins = uniqueTrainerIds.length > 0 ? totalCoins % uniqueTrainerIds.length : 0;

        for (let i = 0; i < uniqueTrainerIds.length; i++) {
          const tid = uniqueTrainerIds[i] as number;
          const coins = coinsPerTrainer + (i === 0 ? extraCoins : 0);
          if (coins > 0) {
            await client.query(
              'UPDATE trainers SET currency_amount = currency_amount + $1, total_earned_currency = total_earned_currency + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [coins, tid]
            );
            const nameResult = await client.query<{ name: string }>(
              'SELECT name FROM trainers WHERE id = $1',
              [tid]
            );
            trainerSummaries.push({
              trainerId: tid,
              name: nameResult.rows[0]?.name ?? `Trainer #${tid}`,
              coinsGained: coins,
            });
          }
        }
      }

      // Build reward summary
      const summary: MissionRewardSummary = {
        totalLevels,
        totalCoins,
        monsters: monsterLevelResults,
        trainers: trainerSummaries,
        items: rolledItems,
        reallocations,
      };

      // Save summary and mark claimed
      await client.query(
        'UPDATE user_missions SET reward_claimed = 1, completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP), reward_summary = $1 WHERE id = $2',
        [JSON.stringify(summary), userMission.id]
      );

      return summary;
    });

    // Apply items AFTER transaction commits — uses separate connections so must not be inside transaction
    if (rolledItems.length > 0 && itemAssignments.length > 0) {
      // Look up trainer names for the summary
      const trainerNameCache: Record<number, string> = {};

      for (let i = 0; i < rolledItems.length; i++) {
        const assignment = itemAssignments.find(a => a.itemIndex === i);
        if (!assignment) { continue; }

        const item = rolledItems[i]!;
        try {
          let itemRecord: ItemRow | null = null;
          if (item.itemName) {
            itemRecord = await this.itemRepo.findByName(item.itemName);
          }
          if (itemRecord) {
            const category = this.getInventoryCategory(itemRecord);
            await this.inventoryRepo.addItem(assignment.trainerId, category, itemRecord.name, item.quantity);
          }

          // Attach trainer info to the summary item
          item.trainerId = assignment.trainerId;
          if (!trainerNameCache[assignment.trainerId]) {
            const result = await db.query<{ name: string }>('SELECT name FROM trainers WHERE id = $1', [assignment.trainerId]);
            trainerNameCache[assignment.trainerId] = result.rows[0]?.name ?? `Trainer #${assignment.trainerId}`;
          }
          item.trainerName = trainerNameCache[assignment.trainerId];
        } catch (err) {
          console.error(`Failed to distribute item "${item.itemName}" to trainer ${assignment.trainerId}:`, err);
        }
      }

      // Re-save the summary with trainer info on items
      await db.query(
        'UPDATE user_missions SET reward_summary = $1 WHERE id = $2',
        [JSON.stringify(rewardSummary), userMissionId]
      );
    }

    return {
      success: true,
      message: 'Mission rewards claimed successfully',
      rewardSummary,
    };
  }

  // ==========================================================================
  // Reward Helpers
  // ==========================================================================

  private resolveAmount(val: number | { min: number; max: number }): number {
    if (typeof val === 'number') { return val; }
    return Math.floor(Math.random() * (val.max - val.min + 1)) + val.min;
  }

  private async rollItemRewards(entries: MissionItemRewardEntry[]): Promise<MissionRewardSummaryItem[]> {
    const results: MissionRewardSummaryItem[] = [];

    for (const entry of entries) {
      // Chance check
      const chance = entry.chance ?? 100;
      if (Math.random() * 100 > chance) { continue; }

      const quantity = entry.quantity ?? 1;

      // Static item by name
      if (entry.itemName) {
        const item = await this.itemRepo.findByName(entry.itemName);
        if (item) {
          results.push({ itemName: item.name, quantity, category: item.category ?? undefined, wasRandom: false });
        }
        continue;
      }

      // Static item by ID
      if (entry.itemId) {
        const item = await this.itemRepo.findById(entry.itemId);
        if (item) {
          results.push({ itemName: item.name, quantity, category: item.category ?? undefined, wasRandom: false });
        }
        continue;
      }

      // Random from category
      if (entry.category) {
        const rolled = await this.itemRoller.rollOne({ category: entry.category as 'berries' | 'items' | 'balls' });
        if (rolled) {
          results.push({ itemName: rolled.name, quantity, category: entry.category, wasRandom: true });
        }
        continue;
      }

      // Random from pool
      if (entry.itemPool && entry.itemPool.length > 0) {
        const randomId = entry.itemPool[Math.floor(Math.random() * entry.itemPool.length)] as number;
        const item = await this.itemRepo.findById(randomId);
        if (item) {
          results.push({ itemName: item.name, quantity, category: item.category ?? undefined, wasRandom: true });
        }
      }
    }

    return results;
  }

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

  // ==========================================================================
  // Admin
  // ==========================================================================

  async createMission(input: MissionCreateInput): Promise<Mission> {
    return this.missionRepo.create(input);
  }

  async updateMission(id: number, input: MissionUpdateInput): Promise<Mission> {
    return this.missionRepo.update(id, input);
  }

  async deleteMission(id: number): Promise<boolean> {
    return this.missionRepo.delete(id);
  }

  async getDifficulties(): Promise<string[]> {
    return this.missionRepo.getDifficulties();
  }

  // ==========================================================================
  // Admin – User Missions
  // ==========================================================================

  async adminGetUserMissions(options: AdminUserMissionQueryOptions): Promise<PaginatedAdminUserMissions> {
    return this.userMissionRepo.findAllPaginated(options);
  }

  async adminUpdateUserMission(id: number, input: UserMissionUpdateInput): Promise<UserMission> {
    return this.userMissionRepo.update(id, input);
  }

  async adminDeleteUserMission(id: number): Promise<boolean> {
    return this.userMissionRepo.adminDelete(id);
  }

  async adminCompleteMission(id: number): Promise<UserMission> {
    const mission = await this.userMissionRepo.findById(id);
    if (!mission) {
      throw new Error('User mission not found');
    }
    return this.userMissionRepo.update(id, {
      status: 'completed',
      currentProgress: mission.requiredProgress,
      completedAt: new Date(),
    });
  }
}
