import { BaseRepository } from './base.repository';
import { db } from '../database';

export type BattleTeamRow = {
  id: number;
  trainer_id: number;
  name: string;
  description: string | null;
  monster_ids: number[];
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
};

export type BattleTeam = {
  id: number;
  trainerId: number;
  name: string;
  description: string | null;
  monsterIds: number[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BattleTeamWithTrainer = BattleTeam & {
  trainerName: string;
  trainerImage: string | null;
  playerUserId: string | null;
};

export type BattleTeamCreateInput = {
  trainerId: number;
  name: string;
  description?: string | null;
  monsterIds: number[];
  isPublic?: boolean;
};

export type BattleTeamUpdateInput = {
  name?: string;
  description?: string | null;
  monsterIds?: number[];
  isPublic?: boolean;
};

const normalizeBattleTeam = (row: BattleTeamRow): BattleTeam => ({
  id: row.id,
  trainerId: row.trainer_id,
  name: row.name,
  description: row.description,
  monsterIds: row.monster_ids ?? [],
  isPublic: row.is_public,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type BattleTeamWithTrainerRow = BattleTeamRow & {
  trainer_name: string;
  trainer_image: string | null;
  player_user_id: string | null;
};

const normalizeBattleTeamWithTrainer = (row: BattleTeamWithTrainerRow): BattleTeamWithTrainer => ({
  ...normalizeBattleTeam(row),
  trainerName: row.trainer_name,
  trainerImage: row.trainer_image,
  playerUserId: row.player_user_id,
});

const BASE_SELECT = `
  SELECT bt.*, t.name as trainer_name, t.main_ref as trainer_image, t.player_user_id
  FROM battle_teams bt
  JOIN trainers t ON bt.trainer_id = t.id
`;

export class BattleTeamRepository extends BaseRepository<
  BattleTeam,
  BattleTeamCreateInput,
  BattleTeamUpdateInput
> {
  constructor() {
    super('battle_teams');
  }

  override async findById(id: number): Promise<BattleTeamWithTrainer | null> {
    const result = await db.query<BattleTeamWithTrainerRow>(
      `${BASE_SELECT} WHERE bt.id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBattleTeamWithTrainer(row) : null;
  }

  async findByTrainerId(trainerId: number): Promise<BattleTeamWithTrainer[]> {
    const result = await db.query<BattleTeamWithTrainerRow>(
      `${BASE_SELECT} WHERE bt.trainer_id = $1 ORDER BY bt.created_at DESC`,
      [trainerId]
    );
    return result.rows.map(normalizeBattleTeamWithTrainer);
  }

  async findPublicTeams(excludeUserId?: string, limit = 100): Promise<BattleTeamWithTrainer[]> {
    const conditions = ['bt.is_public = TRUE', 'cardinality(bt.monster_ids) > 0'];
    const params: unknown[] = [];

    if (excludeUserId) {
      params.push(excludeUserId);
      conditions.push(`(t.player_user_id IS NULL OR t.player_user_id != $${params.length})`);
    }

    params.push(limit);

    const result = await db.query<BattleTeamWithTrainerRow>(
      `
        ${BASE_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY bt.updated_at DESC
        LIMIT $${params.length}
      `,
      params
    );
    return result.rows.map(normalizeBattleTeamWithTrainer);
  }

  override async create(input: BattleTeamCreateInput): Promise<BattleTeamWithTrainer> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO battle_teams (trainer_id, name, description, monster_ids, is_public)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        input.trainerId,
        input.name,
        input.description ?? null,
        input.monsterIds,
        input.isPublic ?? true,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert battle team');
    }
    const team = await this.findById(insertedRow.id);
    if (!team) {
      throw new Error('Failed to create battle team');
    }
    return team;
  }

  override async update(id: number, input: BattleTeamUpdateInput): Promise<BattleTeamWithTrainer> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.monsterIds !== undefined) {
      values.push(input.monsterIds);
      updates.push(`monster_ids = $${values.length}`);
    }
    if (input.isPublic !== undefined) {
      values.push(input.isPublic);
      updates.push(`is_public = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Battle team not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE battle_teams SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Battle team not found after update');
    }
    return updated;
  }
}
