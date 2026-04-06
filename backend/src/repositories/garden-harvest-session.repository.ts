import { db } from '../database';

export type GardenHarvestSessionRow = {
  id: string;
  user_id: number;
  session_data: Record<string, unknown>;
  created_at: Date;
};

export class GardenHarvestSessionRepository {
  async findById(sessionId: string): Promise<GardenHarvestSessionRow | null> {
    const result = await db.query<GardenHarvestSessionRow>(
      'SELECT * FROM garden_harvest_sessions WHERE id = $1',
      [sessionId]
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: number): Promise<GardenHarvestSessionRow | null> {
    const result = await db.query<GardenHarvestSessionRow>(
      'SELECT * FROM garden_harvest_sessions WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] ?? null;
  }

  async create(sessionId: string, userId: number, sessionData: Record<string, unknown>): Promise<GardenHarvestSessionRow> {
    const result = await db.query<GardenHarvestSessionRow>(
      `INSERT INTO garden_harvest_sessions (id, user_id, session_data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, userId, JSON.stringify(sessionData)]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create garden harvest session');
    }
    return row;
  }

  async updateSessionData(sessionId: string, sessionData: Record<string, unknown>): Promise<void> {
    await db.query(
      'UPDATE garden_harvest_sessions SET session_data = $1 WHERE id = $2',
      [JSON.stringify(sessionData), sessionId]
    );
  }

  async delete(sessionId: string): Promise<void> {
    await db.query('DELETE FROM garden_harvest_sessions WHERE id = $1', [sessionId]);
  }

  async deleteByUserId(userId: number): Promise<void> {
    await db.query('DELETE FROM garden_harvest_sessions WHERE user_id = $1', [userId]);
  }
}
