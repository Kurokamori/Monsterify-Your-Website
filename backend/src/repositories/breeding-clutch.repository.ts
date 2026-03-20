import { db } from '../database';

export type BreedingClutchRow = {
  id: number;
  session_id: string;
  user_id: string;
  trainer_id: number;
  parent1_id: number;
  parent2_id: number;
  parent1_data: object;
  parent2_data: object;
  offspring: object;
  user_settings: object;
  special_berries: object;
  claimed_monsters: object;
  created_at: Date;
};

export type BreedingClutch = {
  id: number;
  sessionId: string;
  userId: string;
  trainerId: number;
  parent1Id: number;
  parent2Id: number;
  parent1Data: unknown;
  parent2Data: unknown;
  offspring: unknown[];
  userSettings: Record<string, boolean>;
  specialBerries: Record<string, number>;
  claimedMonsters: number[];
  createdAt: Date;
};

export type BreedingClutchCreateInput = {
  sessionId: string;
  userId: string;
  trainerId: number;
  parent1Id: number;
  parent2Id: number;
  parent1Data: unknown;
  parent2Data: unknown;
  offspring: unknown[];
  userSettings: Record<string, boolean>;
  specialBerries: Record<string, number>;
};

const parseJson = <T>(value: string | object | null | undefined, fallback: T): T => {
  if (value === null || value === undefined) { return fallback; }
  if (typeof value === 'object') { return value as T; }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalize = (row: BreedingClutchRow): BreedingClutch => ({
  id: row.id,
  sessionId: row.session_id,
  userId: row.user_id,
  trainerId: row.trainer_id,
  parent1Id: row.parent1_id,
  parent2Id: row.parent2_id,
  parent1Data: parseJson(row.parent1_data as string | object, {}),
  parent2Data: parseJson(row.parent2_data as string | object, {}),
  offspring: parseJson<unknown[]>(row.offspring as string | object, []),
  userSettings: parseJson<Record<string, boolean>>(row.user_settings as string | object, {}),
  specialBerries: parseJson<Record<string, number>>(row.special_berries as string | object, {}),
  claimedMonsters: parseJson<number[]>(row.claimed_monsters as string | object, []),
  createdAt: row.created_at,
});

export class BreedingClutchRepository {
  async create(input: BreedingClutchCreateInput): Promise<BreedingClutch> {
    const result = await db.query<BreedingClutchRow>(
      `INSERT INTO breeding_clutches (
        session_id, user_id, trainer_id, parent1_id, parent2_id,
        parent1_data, parent2_data, offspring, user_settings, special_berries, claimed_monsters
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.sessionId,
        input.userId,
        input.trainerId,
        input.parent1Id,
        input.parent2Id,
        JSON.stringify(input.parent1Data),
        JSON.stringify(input.parent2Data),
        JSON.stringify(input.offspring),
        JSON.stringify(input.userSettings),
        JSON.stringify(input.specialBerries),
        JSON.stringify([]),
      ]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create breeding clutch'); }
    return normalize(row);
  }

  async findBySessionId(sessionId: string): Promise<BreedingClutch | null> {
    const result = await db.query<BreedingClutchRow>(
      'SELECT * FROM breeding_clutches WHERE session_id = $1',
      [sessionId]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findActiveByUserId(userId: string): Promise<BreedingClutch | null> {
    const result = await db.query<BreedingClutchRow>(
      'SELECT * FROM breeding_clutches WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async updateClaimedMonsters(sessionId: string, claimedMonsters: number[]): Promise<void> {
    await db.query(
      'UPDATE breeding_clutches SET claimed_monsters = $1 WHERE session_id = $2',
      [JSON.stringify(claimedMonsters), sessionId]
    );
  }

  async updateOffspringAndClaimed(
    sessionId: string,
    offspring: unknown[],
    claimedMonsters: number[],
    specialBerries: Record<string, number>,
  ): Promise<void> {
    await db.query(
      `UPDATE breeding_clutches
       SET offspring = $1, claimed_monsters = $2, special_berries = $3
       WHERE session_id = $4`,
      [JSON.stringify(offspring), JSON.stringify(claimedMonsters), JSON.stringify(specialBerries), sessionId]
    );
  }

  async updateSpecialBerries(sessionId: string, specialBerries: Record<string, number>): Promise<void> {
    await db.query(
      'UPDATE breeding_clutches SET special_berries = $1 WHERE session_id = $2',
      [JSON.stringify(specialBerries), sessionId]
    );
  }

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    const result = await db.query('DELETE FROM breeding_clutches WHERE session_id = $1', [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM breeding_clutches WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
