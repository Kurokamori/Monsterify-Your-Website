import { BaseRepository } from './base.repository';
import { db } from '../database';

export type GardenPointRow = {
  id: number;
  user_id: number;
  points: number;
  last_harvested: Date | null;
  created_at: Date;
};

export type GardenPoint = {
  id: number;
  userId: number;
  points: number;
  lastHarvested: Date | null;
  createdAt: Date;
};

export type GardenPointCreateInput = {
  userId: number;
  points?: number;
};

export type GardenPointUpdateInput = {
  points?: number;
  lastHarvested?: Date | null;
};

const normalizeGardenPoint = (row: GardenPointRow): GardenPoint => ({
  id: row.id,
  userId: row.user_id,
  points: row.points,
  lastHarvested: row.last_harvested,
  createdAt: row.created_at,
});

export class GardenPointRepository extends BaseRepository<
  GardenPoint,
  GardenPointCreateInput,
  GardenPointUpdateInput
> {
  constructor() {
    super('garden_points');
  }

  override async findById(id: number): Promise<GardenPoint | null> {
    const result = await db.query<GardenPointRow>(
      'SELECT * FROM garden_points WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeGardenPoint(row) : null;
  }

  async findByUserId(userId: number): Promise<GardenPoint | null> {
    const result = await db.query<GardenPointRow>(
      'SELECT * FROM garden_points WHERE user_id = $1',
      [userId]
    );
    const row = result.rows[0];
    return row ? normalizeGardenPoint(row) : null;
  }

  override async create(input: GardenPointCreateInput): Promise<GardenPoint> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO garden_points (user_id, points) VALUES ($1, $2) RETURNING id`,
      [input.userId, input.points ?? 0]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert garden point');
    }
    const gardenPoint = await this.findById(insertedRow.id);
    if (!gardenPoint) {
      throw new Error('Failed to create garden point record');
    }
    return gardenPoint;
  }

  override async update(id: number, input: GardenPointUpdateInput): Promise<GardenPoint> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.points !== undefined) {
      values.push(input.points);
      updates.push(`points = $${values.length}`);
    }
    if (input.lastHarvested !== undefined) {
      values.push(input.lastHarvested);
      updates.push(`last_harvested = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Garden point record not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE garden_points SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Garden point record not found after update');
    }
    return updated;
  }

  async addPoints(userId: number, pointsToAdd: number): Promise<GardenPoint> {
    const gardenPoint = await this.findByUserId(userId);

    if (gardenPoint) {
      const newPoints = gardenPoint.points + pointsToAdd;
      return this.update(gardenPoint.id, { points: newPoints });
    } else {
      return this.create({ userId, points: pointsToAdd });
    }
  }

  async updateLastHarvested(userId: number): Promise<GardenPoint | null> {
    const gardenPoint = await this.findByUserId(userId);
    if (!gardenPoint) {
      return null;
    }

    await db.query(
      `UPDATE garden_points SET last_harvested = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    );

    return this.findByUserId(userId);
  }

  async resetPoints(userId: number): Promise<GardenPoint | null> {
    const gardenPoint = await this.findByUserId(userId);
    if (!gardenPoint) {
      return null;
    }

    await db.query(
      `UPDATE garden_points SET points = 0 WHERE user_id = $1`,
      [userId]
    );

    return this.findByUserId(userId);
  }

  async getAllWithUsers(
    options: { search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
  ): Promise<{ data: (GardenPoint & { username: string | null; display_name: string | null; discord_id: string | null })[]; total: number; page: number; totalPages: number }> {
    const { search, page = 1, limit = 20, sortBy = 'points', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(u.username ILIKE $${values.length} OR u.display_name ILIKE $${values.length} OR CAST(u.discord_id AS TEXT) ILIKE $${values.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSorts: Record<string, string> = {
      points: 'gp.points',
      username: 'u.username',
      id: 'gp.id',
      last_harvested: 'gp.last_harvested',
    };
    const orderCol = allowedSorts[sortBy] ?? 'gp.points';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM garden_points gp LEFT JOIN users u ON gp.user_id = u.id ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const dataValues = [...values, limit, offset];
    const result = await db.query<GardenPointRow & { username: string | null; display_name: string | null; discord_id: string | null }>(
      `SELECT gp.*, u.username, u.display_name, u.discord_id
       FROM garden_points gp
       LEFT JOIN users u ON gp.user_id = u.id
       ${where}
       ORDER BY ${orderCol} ${order}
       LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
      dataValues
    );

    return {
      data: result.rows.map((row) => ({
        ...normalizeGardenPoint(row),
        username: row.username,
        display_name: row.display_name,
        discord_id: row.discord_id,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async setPoints(userId: number, points: number): Promise<GardenPoint> {
    const gardenPoint = await this.findByUserId(userId);
    if (gardenPoint) {
      await db.query(
        `UPDATE garden_points SET points = $1 WHERE user_id = $2`,
        [points, userId]
      );
      const updated = await this.findByUserId(userId);
      if (!updated) { throw new Error('Garden point record not found after update'); }
      return updated;
    } else {
      return this.create({ userId, points });
    }
  }

  async getLeaderboard(limit = 10): Promise<(GardenPoint & { username: string | null })[]> {
    const result = await db.query<GardenPointRow & { username: string | null }>(
      `
        SELECT gp.*, u.username
        FROM garden_points gp
        LEFT JOIN users u ON gp.user_id = u.id
        ORDER BY gp.points DESC
        LIMIT $1
      `,
      [limit]
    );

    return result.rows.map((row) => ({
      ...normalizeGardenPoint(row),
      username: row.username,
    }));
  }
}
