import { BaseRepository } from './base.repository';
import { db } from '../database';

export type UserMissionRow = {
  id: number;
  user_id: string;
  mission_id: number;
  status: string;
  current_progress: number;
  required_progress: number;
  reward_claimed: boolean;
  started_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserMission = {
  id: number;
  userId: string;
  missionId: number;
  status: string;
  currentProgress: number;
  requiredProgress: number;
  rewardClaimed: boolean;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserMissionWithDetails = UserMission & {
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
};

export type UserMissionCreateInput = {
  userId: string;
  missionId: number;
  requiredProgress: number;
};

export type UserMissionUpdateInput = {
  status?: string;
  currentProgress?: number;
  rewardClaimed?: boolean;
  completedAt?: Date | null;
};

type MissionMonsterRow = {
  id: number;
  name: string;
  level: number;
  img_link: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  trainer_name: string | null;
};

export type MissionMonster = {
  id: number;
  name: string;
  level: number;
  imgLink: string | null;
  types: string[];
  attribute: string | null;
  trainerName: string | null;
};

const normalizeUserMission = (row: UserMissionRow): UserMission => ({
  id: row.id,
  userId: row.user_id,
  missionId: row.mission_id,
  status: row.status,
  currentProgress: row.current_progress,
  requiredProgress: row.required_progress,
  rewardClaimed: row.reward_claimed,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type UserMissionWithDetailsRow = UserMissionRow & {
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
};

const normalizeUserMissionWithDetails = (row: UserMissionWithDetailsRow): UserMissionWithDetails => ({
  ...normalizeUserMission(row),
  title: row.title,
  description: row.description,
  difficulty: row.difficulty,
  duration: row.duration,
});

type AdminUserMissionRow = UserMissionWithDetailsRow & {
  username: string | null;
  display_name: string | null;
};

export type AdminUserMission = UserMissionWithDetails & {
  username: string | null;
  displayName: string | null;
};

export type AdminUserMissionQueryOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  missionId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedAdminUserMissions = {
  data: AdminUserMission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeAdminUserMission = (row: AdminUserMissionRow): AdminUserMission => ({
  ...normalizeUserMissionWithDetails(row),
  username: row.username,
  displayName: row.display_name,
});

export class UserMissionRepository extends BaseRepository<
  UserMission,
  UserMissionCreateInput,
  UserMissionUpdateInput
> {
  constructor() {
    super('user_missions');
  }

  override async findById(id: number): Promise<UserMission | null> {
    const result = await db.query<UserMissionRow>(
      'SELECT * FROM user_missions WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeUserMission(row) : null;
  }

  async findActiveByUserId(userId: string): Promise<UserMissionWithDetails[]> {
    const result = await db.query<UserMissionWithDetailsRow>(
      `
        SELECT um.*, m.title, m.description, m.difficulty, m.duration
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = $1 AND um.status = 'active'
      `,
      [userId]
    );
    return result.rows.map(normalizeUserMissionWithDetails);
  }

  async findByUserId(userId: string): Promise<UserMissionWithDetails[]> {
    const result = await db.query<UserMissionWithDetailsRow>(
      `
        SELECT um.*, m.title, m.description, m.difficulty, m.duration
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = $1
        ORDER BY um.started_at DESC
      `,
      [userId]
    );
    return result.rows.map(normalizeUserMissionWithDetails);
  }

  async hasActiveMission(userId: string): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_missions WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  override async create(input: UserMissionCreateInput): Promise<UserMission> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO user_missions (user_id, mission_id, status, current_progress, required_progress, started_at)
        VALUES ($1, $2, 'active', 0, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [input.userId, input.missionId, input.requiredProgress]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create user mission');
    }
    const userMission = await this.findById(row.id);
    if (!userMission) {
      throw new Error('Failed to create user mission');
    }
    return userMission;
  }

  override async update(id: number, input: UserMissionUpdateInput): Promise<UserMission> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.currentProgress !== undefined) {
      values.push(input.currentProgress);
      updates.push(`current_progress = $${values.length}`);
    }
    if (input.rewardClaimed !== undefined) {
      values.push(input.rewardClaimed);
      updates.push(`reward_claimed = $${values.length}`);
    }
    if (input.completedAt !== undefined) {
      values.push(input.completedAt);
      updates.push(`completed_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('User mission not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE user_missions SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('User mission not found after update');
    }
    return updated;
  }

  async addProgress(userId: string, progress: number): Promise<{
    updatedMissions: UserMissionWithDetails[];
    completedMissions: UserMissionWithDetails[];
  }> {
    const activeMissions = await this.findActiveByUserId(userId);

    const updatedMissions: UserMissionWithDetails[] = [];
    const completedMissions: UserMissionWithDetails[] = [];

    for (const mission of activeMissions) {
      const newProgress = mission.currentProgress + progress;
      const isCompleted = newProgress >= mission.requiredProgress;

      await db.query(
        `UPDATE user_missions SET current_progress = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [newProgress, isCompleted ? 'completed' : 'active', mission.id]
      );

      const updatedMission = { ...mission, currentProgress: newProgress, status: isCompleted ? 'completed' : 'active' };

      if (isCompleted) {
        completedMissions.push(updatedMission);
      } else {
        updatedMissions.push(updatedMission);
      }
    }

    return { updatedMissions, completedMissions };
  }

  async claimReward(missionId: number, userId: string): Promise<UserMissionWithDetails | null> {
    const result = await db.query<UserMissionWithDetailsRow>(
      `
        SELECT um.*, m.title, m.description, m.difficulty, m.duration
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.id = $1 AND um.user_id = $2 AND um.status = 'completed' AND um.reward_claimed::boolean = false
      `,
      [missionId, userId]
    );

    const mission = result.rows[0];
    if (!mission) {
      return null;
    }

    await db.query(
      `UPDATE user_missions SET reward_claimed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [missionId]
    );

    return normalizeUserMissionWithDetails({ ...mission, reward_claimed: true });
  }

  async findUnclaimedCompletedByUserId(userId: string): Promise<UserMissionWithDetails[]> {
    const result = await db.query<UserMissionWithDetailsRow>(
      `
        SELECT um.*, m.title, m.description, m.difficulty, m.duration
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = $1 AND um.status = 'completed' AND um.reward_claimed::boolean = false
      `,
      [userId]
    );
    return result.rows.map(normalizeUserMissionWithDetails);
  }

  // ── Admin Queries ────────────────────────────────────────────────────

  async findAllPaginated(options: AdminUserMissionQueryOptions = {}): Promise<PaginatedAdminUserMissions> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      missionId,
      sortBy = 'startedAt',
      sortOrder = 'desc',
    } = options;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(u.username ILIKE $${values.length} OR u.display_name ILIKE $${values.length})`);
    }
    if (status) {
      values.push(status);
      conditions.push(`um.status = $${values.length}`);
    }
    if (missionId) {
      values.push(missionId);
      conditions.push(`um.mission_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortColumnMap: Record<string, string> = {
      startedAt: 'um.started_at',
      title: 'm.title',
      status: 'um.status',
      currentProgress: 'um.current_progress',
      player: 'u.display_name',
    };
    const sortColumn = sortColumnMap[sortBy] ?? 'um.started_at';
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       LEFT JOIN users u ON u.discord_id = um.user_id
       ${whereClause}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await db.query<AdminUserMissionRow>(
      `SELECT um.*, m.title, m.description, m.difficulty, m.duration,
              u.username, u.display_name
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       LEFT JOIN users u ON u.discord_id = um.user_id
       ${whereClause}
       ORDER BY ${sortColumn} ${direction}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return {
      data: result.rows.map(normalizeAdminUserMission),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminDelete(id: number): Promise<boolean> {
    await db.query('DELETE FROM mission_monsters WHERE user_mission_id = $1', [id]);
    const result = await db.query('DELETE FROM user_missions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ── Mission Monsters ───────────────────────────────────────────────────

  async addMonsters(userMissionId: number, monsterIds: number[]): Promise<void> {
    for (const monsterId of monsterIds) {
      await db.query(
        'INSERT INTO mission_monsters (user_mission_id, monster_id) VALUES ($1, $2)',
        [userMissionId, monsterId]
      );
    }
  }

  async getMissionMonsters(userMissionId: number): Promise<MissionMonster[]> {
    const result = await db.query<MissionMonsterRow>(
      `
        SELECT m.id, m.name, m.level, m.img_link, m.type1, m.type2, m.type3, m.type4, m.type5, m.attribute,
               t.name as trainer_name
        FROM mission_monsters mm
        JOIN monsters m ON mm.monster_id = m.id
        LEFT JOIN trainers t ON m.trainer_id = t.id
        WHERE mm.user_mission_id = $1
      `,
      [userMissionId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      level: row.level,
      imgLink: row.img_link,
      types: [row.type1, row.type2, row.type3, row.type4, row.type5].filter((t): t is string => t !== null),
      attribute: row.attribute,
      trainerName: row.trainer_name,
    }));
  }
}
