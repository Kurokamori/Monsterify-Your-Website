import { db } from '../database';

// ============================================================================
// Types
// ============================================================================

export type NurserySessionRow = {
  session_id: string;
  user_id: string;
  trainer_id: number;
  session_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

// ============================================================================
// Repository
// ============================================================================

export class NurserySessionRepository {
  /**
   * Save or update a session. Uses upsert so it works for both create and update.
   */
  async save(sessionId: string, userId: string, trainerId: number, sessionData: Record<string, unknown>): Promise<void> {
    await db.query(
      `INSERT INTO nursery_sessions (session_id, user_id, trainer_id, session_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (session_id)
       DO UPDATE SET session_data = $4, updated_at = NOW()`,
      [sessionId, userId, trainerId, JSON.stringify(sessionData)],
    );
  }

  /**
   * Find a session by its ID.
   */
  async findBySessionId(sessionId: string): Promise<NurserySessionRow | null> {
    return db.maybeOne<NurserySessionRow>(
      'SELECT * FROM nursery_sessions WHERE session_id = $1',
      [sessionId],
    );
  }

  /**
   * Find all active sessions for a user.
   */
  async findByUserId(userId: string): Promise<NurserySessionRow[]> {
    const result = await db.query<NurserySessionRow>(
      'SELECT * FROM nursery_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return result.rows;
  }

  /**
   * Delete a session (called when all eggs are claimed).
   */
  async delete(sessionId: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM nursery_sessions WHERE session_id = $1',
      [sessionId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete stale sessions older than the given number of days.
   */
  async deleteStale(days: number = 7): Promise<number> {
    const result = await db.query(
      'DELETE FROM nursery_sessions WHERE created_at < NOW() - $1::interval',
      [`${days} days`],
    );
    return result.rowCount ?? 0;
  }
}
