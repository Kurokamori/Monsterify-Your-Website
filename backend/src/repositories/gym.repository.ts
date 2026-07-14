import { BaseRepository } from './base.repository';
import { db } from '../database';
import { PartialBattleStatSpec } from '../utils/constants';

/**
 * A monster spec used for gym leader / gauntlet trainer teams.
 * These are generated battle monsters (monster_id = 0), not real monster rows.
 *
 * `stats` holds the optional authored nature/IV/EV inputs. It is deliberately the
 * *input* to the shared stat curve rather than a set of final totals: the battle
 * builder feeds it through MonsterInitializerService.calculateStats, the same
 * formula player-owned monsters use, so a spec monster and a trainer monster of
 * the same level are directly comparable. When absent (every gym authored before
 * this field existed), resolveBattleStatSpec supplies the medium/balanced preset.
 */
export type GymMonsterSpec = {
  name: string;
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  /** One of the values in monster-genders; null when the author left it unset. */
  gender?: string | null;
  level: number;
  imgLink?: string | null;
  moves?: string[];
  stats?: PartialBattleStatSpec | null;
};

/**
 * Optional per-trainer / per-leader battle dialogue. Any combination of the four
 * moments may be authored; each is a list of lines advanced one at a time in the
 * arena. `generic` is shown when the battle ends and no `win`/`loss` line is
 * authored for the outcome. `talkingSprite` is an optional bespoke portrait shown
 * in the dialogue box instead of the trainer/leader's normal battle image.
 */
export type BattleDialogue = {
  intro?: string[];
  win?: string[];
  loss?: string[];
  generic?: string[];
  talkingSprite?: string | null;
};

/**
 * The class of a battle authored in the gym manager:
 * - `ai`: a standalone AI battle / gauntlet that awards no badge.
 * - `gym`: a standard badge gym.
 * - `league`: an elite battle that awards a league badge; only challengeable
 *   once the trainer holds every gym badge. Has no gauntlet stages.
 * - `champion`: the final battle that awards the special champion badge; only
 *   challengeable once the trainer holds every gym badge and every league badge.
 *   Has no gauntlet stages.
 */
export type GymKind = 'ai' | 'gym' | 'league' | 'champion';

export const GYM_KINDS: GymKind[] = ['ai', 'gym', 'league', 'champion'];

/** Kinds that award a badge to the trainer when their final battle is won. */
export const BADGE_GYM_KINDS: GymKind[] = ['gym', 'league', 'champion'];

/** Normalise a persisted gym_kind, falling back to the legacy is_gym flag. */
const normalizeGymKind = (
  value: string | null | undefined,
  isGym: boolean | null | undefined
): GymKind => {
  if (value === 'ai' || value === 'gym' || value === 'league' || value === 'champion') {
    return value;
  }
  return isGym === false ? 'ai' : 'gym';
};

/** Resolve the gym_kind to persist from a create/update input. gymKind wins; the
 * legacy isGym flag is used only when gymKind is absent. */
const resolveGymKindForWrite = (input: {
  gymKind?: GymKind;
  isGym?: boolean;
}): GymKind => {
  if (input.gymKind) {
    return input.gymKind;
  }
  return input.isGym === false ? 'ai' : 'gym';
};

export type GymGauntletTrainer = {
  name: string;
  imgLink?: string | null;
  /** Spec-based team (generated monsters). Used when trainerId is not set. */
  team: GymMonsterSpec[];
  /** Optional: back this gauntlet trainer with a real trainer's monsters. */
  trainerId?: number | null;
  monsterIds?: number[];
  /** Optional dialogue spoken by this trainer before/after the fight. */
  dialogue?: BattleDialogue | null;
  /** Appearance overrides for this trainer's stage (fall back to the gym's). */
  backgroundAssetId?: number | null;
  backgroundRandom?: boolean;
  spotAssetId?: number | null;
  spotRandom?: boolean;
};

export type GymRow = {
  id: number;
  name: string;
  description: string | null;
  type_theme: string | null;
  badge_name: string;
  badge_img_link: string | null;
  leader_name: string;
  leader_img_link: string | null;
  leader_team: string | object;
  gauntlet_trainers: string | object;
  is_gym: boolean;
  gym_kind: string | null;
  leader_trainer_id: number | null;
  leader_monster_ids: number[] | null;
  leader_dialogue: string | object | null;
  background_asset_id: number | null;
  background_random: boolean;
  spot_asset_id: number | null;
  spot_random: boolean;
  textbox_asset_id: number | null;
  win_reward: number;
  loss_penalty: number;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Gym = {
  id: number;
  name: string;
  description: string | null;
  typeTheme: string | null;
  badgeName: string;
  badgeImgLink: string | null;
  leaderName: string;
  leaderImgLink: string | null;
  leaderTeam: GymMonsterSpec[];
  gauntletTrainers: GymGauntletTrainer[];
  isGym: boolean;
  gymKind: GymKind;
  leaderTrainerId: number | null;
  leaderMonsterIds: number[];
  leaderDialogue: BattleDialogue;
  backgroundAssetId: number | null;
  backgroundRandom: boolean;
  spotAssetId: number | null;
  spotRandom: boolean;
  textboxAssetId: number | null;
  winReward: number;
  lossPenalty: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GymCreateInput = {
  name: string;
  description?: string | null;
  typeTheme?: string | null;
  badgeName: string;
  badgeImgLink?: string | null;
  leaderName: string;
  leaderImgLink?: string | null;
  leaderTeam?: GymMonsterSpec[];
  gauntletTrainers?: GymGauntletTrainer[];
  isGym?: boolean;
  gymKind?: GymKind;
  leaderTrainerId?: number | null;
  leaderMonsterIds?: number[];
  leaderDialogue?: BattleDialogue | null;
  backgroundAssetId?: number | null;
  backgroundRandom?: boolean;
  spotAssetId?: number | null;
  spotRandom?: boolean;
  textboxAssetId?: number | null;
  winReward?: number;
  lossPenalty?: number;
  displayOrder?: number;
  isActive?: boolean;
};

export type GymUpdateInput = Partial<GymCreateInput>;

export type TrainerBadgeRow = {
  id: number;
  trainer_id: number;
  gym_id: number;
  earned_at: Date;
};

export type TrainerBadge = {
  id: number;
  trainerId: number;
  gymId: number;
  earnedAt: Date;
  gymName: string;
  badgeName: string;
  badgeImgLink: string | null;
  typeTheme: string | null;
  leaderName: string;
  badgeKind: GymKind;
};

export type GauntletRunStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export type GauntletRunRow = {
  id: number;
  gym_id: number;
  trainer_id: number;
  user_id: number;
  team_monster_ids: number[];
  current_stage: number;
  total_stages: number;
  current_battle_id: number | null;
  status: GauntletRunStatus;
  created_at: Date;
  completed_at: Date | null;
};

export type GauntletRun = {
  id: number;
  gymId: number;
  trainerId: number;
  userId: number;
  teamMonsterIds: number[];
  currentStage: number;
  totalStages: number;
  currentBattleId: number | null;
  status: GauntletRunStatus;
  createdAt: Date;
  completedAt: Date | null;
};

const parseJson = <T>(value: string | object | null, fallback: T): T => {
  if (!value) {return fallback;}
  if (typeof value === 'object') {return value as T;}
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeGym = (row: GymRow): Gym => ({
  id: row.id,
  name: row.name,
  description: row.description,
  typeTheme: row.type_theme,
  badgeName: row.badge_name,
  badgeImgLink: row.badge_img_link,
  leaderName: row.leader_name,
  leaderImgLink: row.leader_img_link,
  leaderTeam: parseJson<GymMonsterSpec[]>(row.leader_team, []),
  gauntletTrainers: parseJson<GymGauntletTrainer[]>(row.gauntlet_trainers, []),
  isGym: row.is_gym ?? true,
  gymKind: normalizeGymKind(row.gym_kind, row.is_gym),
  leaderTrainerId: row.leader_trainer_id ?? null,
  leaderMonsterIds: row.leader_monster_ids ?? [],
  leaderDialogue: parseJson<BattleDialogue>(row.leader_dialogue, {}),
  backgroundAssetId: row.background_asset_id ?? null,
  backgroundRandom: row.background_random ?? false,
  spotAssetId: row.spot_asset_id ?? null,
  spotRandom: row.spot_random ?? false,
  textboxAssetId: row.textbox_asset_id ?? null,
  winReward: row.win_reward,
  lossPenalty: row.loss_penalty,
  displayOrder: row.display_order,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeGauntletRun = (row: GauntletRunRow): GauntletRun => ({
  id: row.id,
  gymId: row.gym_id,
  trainerId: row.trainer_id,
  userId: row.user_id,
  teamMonsterIds: row.team_monster_ids ?? [],
  currentStage: row.current_stage,
  totalStages: row.total_stages,
  currentBattleId: row.current_battle_id,
  status: row.status,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

export class GymRepository extends BaseRepository<Gym, GymCreateInput, GymUpdateInput> {
  constructor() {
    super('gyms');
  }

  override async findById(id: number): Promise<Gym | null> {
    const result = await db.query<GymRow>('SELECT * FROM gyms WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? normalizeGym(row) : null;
  }

  async findAllActive(): Promise<Gym[]> {
    const result = await db.query<GymRow>(
      'SELECT * FROM gyms WHERE is_active = TRUE ORDER BY display_order, id'
    );
    return result.rows.map(normalizeGym);
  }

  async findAll(): Promise<Gym[]> {
    const result = await db.query<GymRow>('SELECT * FROM gyms ORDER BY display_order, id');
    return result.rows.map(normalizeGym);
  }

  override async create(input: GymCreateInput): Promise<Gym> {
    const gymKind = resolveGymKindForWrite(input);
    const isGym = gymKind !== 'ai';
    // League / champion battles never have gauntlet stages.
    const gauntletTrainers =
      gymKind === 'league' || gymKind === 'champion' ? [] : input.gauntletTrainers ?? [];
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO gyms (
          name, description, type_theme, badge_name, badge_img_link,
          leader_name, leader_img_link, leader_team, gauntlet_trainers,
          is_gym, gym_kind, leader_trainer_id, leader_monster_ids, leader_dialogue,
          background_asset_id, background_random, spot_asset_id, spot_random, textbox_asset_id,
          win_reward, loss_penalty, display_order, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id
      `,
      [
        input.name,
        input.description ?? null,
        input.typeTheme ?? null,
        input.badgeName,
        input.badgeImgLink ?? null,
        input.leaderName,
        input.leaderImgLink ?? null,
        JSON.stringify(input.leaderTeam ?? []),
        JSON.stringify(gauntletTrainers),
        isGym,
        gymKind,
        input.leaderTrainerId ?? null,
        input.leaderMonsterIds ?? [],
        JSON.stringify(input.leaderDialogue ?? {}),
        input.backgroundAssetId ?? null,
        input.backgroundRandom ?? false,
        input.spotAssetId ?? null,
        input.spotRandom ?? false,
        input.textboxAssetId ?? null,
        input.winReward ?? 500,
        input.lossPenalty ?? 150,
        input.displayOrder ?? 0,
        input.isActive ?? true,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert gym');
    }
    const gym = await this.findById(insertedRow.id);
    if (!gym) {
      throw new Error('Failed to create gym');
    }
    return gym;
  }

  override async update(id: number, input: GymUpdateInput): Promise<Gym> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const push = (column: string, value: unknown): void => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (input.name !== undefined) {push('name', input.name);}
    if (input.description !== undefined) {push('description', input.description);}
    if (input.typeTheme !== undefined) {push('type_theme', input.typeTheme);}
    if (input.badgeName !== undefined) {push('badge_name', input.badgeName);}
    if (input.badgeImgLink !== undefined) {push('badge_img_link', input.badgeImgLink);}
    if (input.leaderName !== undefined) {push('leader_name', input.leaderName);}
    if (input.leaderImgLink !== undefined) {push('leader_img_link', input.leaderImgLink);}
    if (input.leaderTeam !== undefined) {push('leader_team', JSON.stringify(input.leaderTeam));}
    // League / champion battles never keep gauntlet stages — force them empty.
    const forcedNoGauntlet = input.gymKind === 'league' || input.gymKind === 'champion';
    if (forcedNoGauntlet) {
      push('gauntlet_trainers', JSON.stringify([]));
    } else if (input.gauntletTrainers !== undefined) {
      push('gauntlet_trainers', JSON.stringify(input.gauntletTrainers));
    }
    // Keep gym_kind and the legacy is_gym flag in sync. gymKind wins when present.
    if (input.gymKind !== undefined) {
      push('gym_kind', input.gymKind);
      push('is_gym', input.gymKind !== 'ai');
    } else if (input.isGym !== undefined) {
      push('is_gym', input.isGym);
      push('gym_kind', input.isGym ? 'gym' : 'ai');
    }
    if (input.leaderTrainerId !== undefined) {push('leader_trainer_id', input.leaderTrainerId);}
    if (input.leaderMonsterIds !== undefined) {push('leader_monster_ids', input.leaderMonsterIds);}
    if (input.leaderDialogue !== undefined) {push('leader_dialogue', JSON.stringify(input.leaderDialogue ?? {}));}
    if (input.backgroundAssetId !== undefined) {push('background_asset_id', input.backgroundAssetId);}
    if (input.backgroundRandom !== undefined) {push('background_random', input.backgroundRandom);}
    if (input.spotAssetId !== undefined) {push('spot_asset_id', input.spotAssetId);}
    if (input.spotRandom !== undefined) {push('spot_random', input.spotRandom);}
    if (input.textboxAssetId !== undefined) {push('textbox_asset_id', input.textboxAssetId);}
    if (input.winReward !== undefined) {push('win_reward', input.winReward);}
    if (input.lossPenalty !== undefined) {push('loss_penalty', input.lossPenalty);}
    if (input.displayOrder !== undefined) {push('display_order', input.displayOrder);}
    if (input.isActive !== undefined) {push('is_active', input.isActive);}

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Gym not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(`UPDATE gyms SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Gym not found after update');
    }
    return updated;
  }

  // ==========================================================================
  // Trainer Badges
  // ==========================================================================

  async findBadgesByTrainerId(trainerId: number): Promise<TrainerBadge[]> {
    const result = await db.query<TrainerBadgeRow & {
      gym_name: string;
      badge_name: string;
      badge_img_link: string | null;
      type_theme: string | null;
      leader_name: string;
      gym_kind: string | null;
      is_gym: boolean;
    }>(
      `
        SELECT tb.*, g.name as gym_name, g.badge_name, g.badge_img_link, g.type_theme,
               g.leader_name, g.gym_kind, g.is_gym
        FROM trainer_badges tb
        JOIN gyms g ON tb.gym_id = g.id
        WHERE tb.trainer_id = $1
        ORDER BY g.display_order, tb.earned_at
      `,
      [trainerId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      trainerId: row.trainer_id,
      gymId: row.gym_id,
      earnedAt: row.earned_at,
      gymName: row.gym_name,
      badgeName: row.badge_name,
      badgeImgLink: row.badge_img_link,
      typeTheme: row.type_theme,
      leaderName: row.leader_name,
      badgeKind: normalizeGymKind(row.gym_kind, row.is_gym),
    }));
  }

  async hasBadge(trainerId: number, gymId: number): Promise<boolean> {
    const result = await db.query<{ id: number }>(
      'SELECT id FROM trainer_badges WHERE trainer_id = $1 AND gym_id = $2',
      [trainerId, gymId]
    );
    return result.rows.length > 0;
  }

  async awardBadge(trainerId: number, gymId: number): Promise<void> {
    await db.query(
      `
        INSERT INTO trainer_badges (trainer_id, gym_id)
        VALUES ($1, $2)
        ON CONFLICT (trainer_id, gym_id) DO NOTHING
      `,
      [trainerId, gymId]
    );
  }

  // ==========================================================================
  // Gauntlet Runs
  // ==========================================================================

  async findGauntletRunById(id: number): Promise<GauntletRun | null> {
    const result = await db.query<GauntletRunRow>(
      'SELECT * FROM gauntlet_runs WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeGauntletRun(row) : null;
  }

  async findActiveGauntletRun(trainerId: number, gymId?: number): Promise<GauntletRun | null> {
    const params: unknown[] = [trainerId];
    let gymCondition = '';
    if (gymId !== undefined) {
      params.push(gymId);
      gymCondition = `AND gym_id = $${params.length}`;
    }

    const result = await db.query<GauntletRunRow>(
      `
        SELECT * FROM gauntlet_runs
        WHERE trainer_id = $1 AND status = 'active' ${gymCondition}
        ORDER BY created_at DESC
        LIMIT 1
      `,
      params
    );
    const row = result.rows[0];
    return row ? normalizeGauntletRun(row) : null;
  }

  async createGauntletRun(input: {
    gymId: number;
    trainerId: number;
    userId: number;
    teamMonsterIds: number[];
    totalStages: number;
  }): Promise<GauntletRun> {
    const result = await db.query<GauntletRunRow>(
      `
        INSERT INTO gauntlet_runs (gym_id, trainer_id, user_id, team_monster_ids, total_stages)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [input.gymId, input.trainerId, input.userId, input.teamMonsterIds, input.totalStages]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create gauntlet run');
    }
    return normalizeGauntletRun(row);
  }

  async updateGauntletRun(
    id: number,
    input: {
      currentStage?: number;
      currentBattleId?: number | null;
      status?: GauntletRunStatus;
      completedAt?: Date | null;
    }
  ): Promise<GauntletRun> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.currentStage !== undefined) {
      values.push(input.currentStage);
      updates.push(`current_stage = $${values.length}`);
    }
    if (input.currentBattleId !== undefined) {
      values.push(input.currentBattleId);
      updates.push(`current_battle_id = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.completedAt !== undefined) {
      values.push(input.completedAt);
      updates.push(`completed_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findGauntletRunById(id);
      if (!existing) {
        throw new Error('Gauntlet run not found');
      }
      return existing;
    }

    values.push(id);
    await db.query(
      `UPDATE gauntlet_runs SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findGauntletRunById(id);
    if (!updated) {
      throw new Error('Gauntlet run not found after update');
    }
    return updated;
  }
}
