import { BaseRepository } from './base.repository';
import { db } from '../database';

export type MonsterRollerSettings = {
  pokemon: boolean;
  digimon: boolean;
  yokai: boolean;
  pals: boolean;
  nexomon: boolean;
  fakemon: boolean;
  finalfantasy: boolean;
  monsterhunter: boolean;
  dragonquest: boolean;
};

export type ContentSettings = {
  mature_enabled: boolean;
  gore: boolean;
  nsfw_light: boolean;
  nsfw_heavy: boolean;
  triggering: boolean;
  intense_violence: boolean;
};

export type NotificationSettings = {
  chat_notifications: boolean;
};

const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  mature_enabled: false,
  gore: false,
  nsfw_light: false,
  nsfw_heavy: false,
  triggering: false,
  intense_violence: false,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  chat_notifications: true,
};

export type UserRow = {
  id: number;
  username: string;
  display_name: string;
  discord_id: string | null;
  password: string;
  is_admin: boolean;
  monster_roller_settings: MonsterRollerSettings | string | null;
  theme: string | null;
  content_settings: ContentSettings | string | null;
  notification_settings: NotificationSettings | string | null;
  priority_trainer_ids: number[] | string | null;
  profile_image_url: string | null;
  profile_trainer_id: number | null;
  bio: string | null;
  created_at: Date;
};

export type UserPublic = Omit<UserRow, 'password' | 'monster_roller_settings' | 'content_settings' | 'notification_settings' | 'priority_trainer_ids'> & {
  monster_roller_settings: MonsterRollerSettings | null;
  content_settings: ContentSettings;
  notification_settings: NotificationSettings;
  priority_trainer_ids: number[];
};

export type UserCreateInput = {
  username: string;
  displayName?: string | null;
  discordId?: string | null;
  passwordHash: string;
  isAdmin?: boolean;
};

export type UserUpdateInput = {
  username?: string;
  displayName?: string | null;
  discordId?: string | null;
  passwordHash?: string;
  isAdmin?: boolean;
  monsterRollerSettings?: MonsterRollerSettings | null;
  theme?: string | null;
  contentSettings?: ContentSettings | null;
  notificationSettings?: NotificationSettings | null;
  priorityTrainerIds?: number[];
  profileImageUrl?: string | null;
  profileTrainerId?: number | null;
  bio?: string | null;
};

export type AdminUserQueryOptions = {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedUsers = {
  data: UserPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const DEFAULT_MONSTER_ROLLER_SETTINGS: MonsterRollerSettings = {
  pokemon: true,
  digimon: true,
  yokai: true,
  pals: true,
  nexomon: true,
  fakemon: true,
  finalfantasy: true,
  monsterhunter: true,
  dragonquest: true,
};

const normalizeMonsterRollerSettings = (
  settings: UserRow['monster_roller_settings']
): MonsterRollerSettings | null => {
  if (!settings) {
    return null;
  }

  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings) as MonsterRollerSettings;
    } catch {
      return { ...DEFAULT_MONSTER_ROLLER_SETTINGS };
    }
  }

  return settings;
};

const normalizeContentSettings = (
  settings: UserRow['content_settings']
): ContentSettings => {
  if (!settings) {
    return { ...DEFAULT_CONTENT_SETTINGS };
  }

  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings) as ContentSettings;
    } catch {
      return { ...DEFAULT_CONTENT_SETTINGS };
    }
  }

  return settings;
};

const normalizeNotificationSettings = (
  settings: UserRow['notification_settings']
): NotificationSettings => {
  if (!settings) {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings) as NotificationSettings;
    } catch {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }
  }

  return settings;
};

const normalizePriorityTrainerIds = (
  ids: UserRow['priority_trainer_ids']
): number[] => {
  if (!ids) {
    return [];
  }

  if (typeof ids === 'string') {
    try {
      return JSON.parse(ids) as number[];
    } catch {
      return [];
    }
  }

  return ids;
};

const normalizeUser = (user: UserRow): UserPublic => ({
  id: user.id,
  username: user.username,
  display_name: user.display_name,
  discord_id: user.discord_id,
  is_admin: user.is_admin,
  monster_roller_settings: normalizeMonsterRollerSettings(user.monster_roller_settings),
  theme: user.theme,
  content_settings: normalizeContentSettings(user.content_settings),
  notification_settings: normalizeNotificationSettings(user.notification_settings),
  priority_trainer_ids: normalizePriorityTrainerIds(user.priority_trainer_ids),
  profile_image_url: user.profile_image_url,
  profile_trainer_id: user.profile_trainer_id,
  bio: user.bio,
  created_at: user.created_at,
});

export class UserRepository extends BaseRepository<UserPublic, UserCreateInput, UserUpdateInput> {
  constructor() {
    super('users');
  }

  protected override get selectColumns(): string {
    return [
      'id',
      'username',
      'display_name',
      'discord_id',
      'is_admin',
      'monster_roller_settings',
      'theme',
      'content_settings',
      'notification_settings',
      'priority_trainer_ids',
      'profile_image_url',
      'profile_trainer_id',
      'bio',
      'created_at',
    ].join(', ');
  }

  override async findById(id: number): Promise<UserPublic | null> {
    const result = await db.query<UserRow>(
      `SELECT ${this.selectColumns} FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  }

  async findByUsername(username: string): Promise<UserRow | null> {
    const result = await db.query<UserRow>('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ?? null;
  }

  async findByDisplayName(displayName: string): Promise<UserRow | null> {
    const result = await db.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(display_name) = LOWER($1)',
      [displayName]
    );
    return result.rows[0] ?? null;
  }

  async findByDiscordId(discordId: string): Promise<UserRow | null> {
    const result = await db.query<UserRow>('SELECT * FROM users WHERE discord_id = $1', [discordId]);
    return result.rows[0] ?? null;
  }

  async getAll(): Promise<UserPublic[]> {
    const result = await db.query<UserRow>(
      `SELECT ${this.selectColumns} FROM users ORDER BY id`
    );
    return result.rows.map(normalizeUser);
  }

  async findAdminList(options: AdminUserQueryOptions = {}): Promise<PaginatedUsers> {
    const {
      search,
      sortBy = 'id',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = options;

    const allowedSortColumns = ['id', 'username', 'display_name', 'created_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'id';
    const safeOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(username ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    const dataParams = [...params, limit, offset];

    const result = await db.query<UserRow>(
      `SELECT ${this.selectColumns} FROM users ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    return {
      data: result.rows.map(normalizeUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async create(input: UserCreateInput): Promise<UserPublic> {
    const displayName = input.displayName ?? input.username;
    const result = await db.query<UserRow>(
      `
        INSERT INTO users (username, display_name, discord_id, password, is_admin, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING ${this.selectColumns}
      `,
      [
        input.username,
        displayName,
        input.discordId ?? null,
        input.passwordHash,
        input.isAdmin ? 1 : 0,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create user');
    }
    return normalizeUser(row);
  }

  override async update(id: number, input: UserUpdateInput): Promise<UserPublic> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const pushUpdate = (column: string, value: unknown) => {
      updates.push(`${column} = $${values.length + 1}`);
      values.push(value);
    };

    if (input.username !== undefined) {
      pushUpdate('username', input.username);
    }
    if (input.displayName !== undefined) {
      pushUpdate('display_name', input.displayName ?? input.username ?? null);
    }
    if (input.discordId !== undefined) {
      pushUpdate('discord_id', input.discordId);
    }
    if (input.passwordHash !== undefined) {
      pushUpdate('password', input.passwordHash);
    }
    if (input.isAdmin !== undefined) {
      pushUpdate('is_admin', input.isAdmin);
    }
    if (input.monsterRollerSettings !== undefined) {
      pushUpdate('monster_roller_settings', JSON.stringify(input.monsterRollerSettings));
    }
    if (input.theme !== undefined) {
      pushUpdate('theme', input.theme);
    }
    if (input.contentSettings !== undefined) {
      pushUpdate('content_settings', JSON.stringify(input.contentSettings));
    }
    if (input.notificationSettings !== undefined) {
      pushUpdate('notification_settings', JSON.stringify(input.notificationSettings));
    }
    if (input.priorityTrainerIds !== undefined) {
      pushUpdate('priority_trainer_ids', JSON.stringify(input.priorityTrainerIds));
    }
    if (input.profileImageUrl !== undefined) {
      pushUpdate('profile_image_url', input.profileImageUrl);
    }
    if (input.profileTrainerId !== undefined) {
      pushUpdate('profile_trainer_id', input.profileTrainerId);
    }
    if (input.bio !== undefined) {
      pushUpdate('bio', input.bio);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('User not found');
      }
      return existing;
    }

    values.push(id);

    const result = await db.query<UserRow>(
      `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING ${this.selectColumns}
      `,
      values
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('User not found after update');
    }
    return normalizeUser(row);
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getMonsterRollerSettings(id: number): Promise<MonsterRollerSettings> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return user.monster_roller_settings ?? { ...DEFAULT_MONSTER_ROLLER_SETTINGS };
  }

  async updateMonsterRollerSettings(
    id: number,
    settings: MonsterRollerSettings
  ): Promise<UserPublic> {
    return this.update(id, { monsterRollerSettings: settings });
  }

  async updateTheme(id: number, theme: string | null): Promise<UserPublic> {
    return this.update(id, { theme });
  }

  async updateContentSettings(id: number, settings: ContentSettings): Promise<UserPublic> {
    return this.update(id, { contentSettings: settings });
  }

  async updateNotificationSettings(id: number, settings: NotificationSettings): Promise<UserPublic> {
    return this.update(id, { notificationSettings: settings });
  }

  async updatePriorityTrainers(id: number, trainerIds: number[]): Promise<UserPublic> {
    return this.update(id, { priorityTrainerIds: trainerIds });
  }

  async findPublicProfile(id: number): Promise<{
    id: number;
    username: string;
    display_name: string;
    profile_image_url: string | null;
    profile_trainer_id: number | null;
    profile_trainer_image: string | null;
    bio: string | null;
    created_at: Date | null;
    trainer_count: number;
    monster_count: number;
  } | null> {
    const result = await db.query(
      `SELECT
        u.id, u.username, u.display_name, u.profile_image_url, u.profile_trainer_id, u.bio, u.created_at,
        pt.main_ref as profile_trainer_image,
        (SELECT COUNT(*)::int FROM trainers WHERE player_user_id = u.id::text OR player_user_id = u.discord_id) as trainer_count,
        (SELECT COUNT(*)::int FROM monsters m
         JOIN trainers t ON m.trainer_id = t.id
         WHERE t.player_user_id = u.id::text OR t.player_user_id = u.discord_id) as monster_count
      FROM users u
      LEFT JOIN trainers pt ON pt.id = u.profile_trainer_id
      WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findPublicProfileByDiscordId(discordId: string): Promise<{
    id: number;
    username: string;
    display_name: string;
    profile_image_url: string | null;
    profile_trainer_id: number | null;
    profile_trainer_image: string | null;
    bio: string | null;
    created_at: Date | null;
    trainer_count: number;
    monster_count: number;
  } | null> {
    const result = await db.query(
      `SELECT
        u.id, u.username, u.display_name, u.profile_image_url, u.profile_trainer_id, u.bio, u.created_at,
        pt.main_ref as profile_trainer_image,
        (SELECT COUNT(*)::int FROM trainers WHERE player_user_id = u.id::text OR player_user_id = u.discord_id) as trainer_count,
        (SELECT COUNT(*)::int FROM monsters m
         JOIN trainers t ON m.trainer_id = t.id
         WHERE t.player_user_id = u.id::text OR t.player_user_id = u.discord_id) as monster_count
      FROM users u
      LEFT JOIN trainers pt ON pt.id = u.profile_trainer_id
      WHERE u.discord_id = $1`,
      [discordId]
    );
    return result.rows[0] ?? null;
  }
}
