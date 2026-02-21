import {
  MissionRepository,
  UserMissionRepository,
  MonsterRepository,
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
} from '../repositories';

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
  mission?: UserMissionWithDetails;
};

// ============================================================================
// Service
// ============================================================================

export class MissionService {
  private missionRepo: MissionRepository;
  private userMissionRepo: UserMissionRepository;
  private monsterRepo: MonsterRepository;

  constructor(
    missionRepo?: MissionRepository,
    userMissionRepo?: UserMissionRepository,
    monsterRepo?: MonsterRepository,
  ) {
    this.missionRepo = missionRepo ?? new MissionRepository();
    this.userMissionRepo = userMissionRepo ?? new UserMissionRepository();
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
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
    missionId: number,
    userId: string,
  ): Promise<ClaimMissionResult> {
    const mission = await this.userMissionRepo.claimReward(missionId, userId);

    if (!mission) {
      return {
        success: false,
        message: 'No completed unclaimed mission found',
      };
    }

    return {
      success: true,
      message: 'Mission rewards claimed successfully',
      mission,
    };
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
