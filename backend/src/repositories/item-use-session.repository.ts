import { db } from '../database';

// ============================================================================
// Types
// ============================================================================

export type ItemUseSessionType = 'apothecary' | 'adoption_item' | 'mass_edit';

export type ItemUseSessionRow = {
  id: number;
  user_id: string;
  session_type: string;
  session_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type ItemUseSession = {
  id: number;
  userId: string;
  sessionType: string;
  sessionData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// Normalizer
// ============================================================================

function normalize(row: ItemUseSessionRow): ItemUseSession {
  return {
    id: row.id,
    userId: row.user_id,
    sessionType: row.session_type,
    sessionData: typeof row.session_data === 'string'
      ? JSON.parse(row.session_data)
      : row.session_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// Repository
// ============================================================================

export class ItemUseSessionRepository {
  /**
   * Find a session by user ID and session type.
   */
  async findByUserAndType(userId: string, sessionType: ItemUseSessionType): Promise<ItemUseSession | null> {
    const row = await db.maybeOne<ItemUseSessionRow>(
      'SELECT * FROM item_use_sessions WHERE user_id = $1 AND session_type = $2',
      [userId, sessionType],
    );
    return row ? normalize(row) : null;
  }

  /**
   * Save or update a session. Uses upsert so it works for both create and update.
   */
  async upsert(userId: string, sessionType: ItemUseSessionType, sessionData: Record<string, unknown>): Promise<ItemUseSession> {
    const row = await db.one<ItemUseSessionRow>(
      `INSERT INTO item_use_sessions (user_id, session_type, session_data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, session_type)
       DO UPDATE SET session_data = $3, updated_at = NOW()
       RETURNING *`,
      [userId, sessionType, JSON.stringify(sessionData)],
    );
    return normalize(row);
  }

  /**
   * Delete a session by user ID and session type.
   */
  async delete(userId: string, sessionType: ItemUseSessionType): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM item_use_sessions WHERE user_id = $1 AND session_type = $2',
      [userId, sessionType],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
