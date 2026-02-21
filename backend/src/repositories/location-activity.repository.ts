import { db } from '../database';
import type {
  ActivitySessionRow,
  LocationPromptRow,
  LocationPromptCreateInput,
  LocationPromptUpdateInput,
  LocationFlavorRow,
  LocationFlavorCreateInput,
  LocationFlavorUpdateInput,
} from '../utils/types/location-activity.types';

// ============================================================================
// Session Repository
// ============================================================================

export class LocationActivitySessionRepository {
  async createSession(data: {
    sessionId: string;
    playerId: string;
    location: string;
    activity: string;
    promptId: number;
    difficulty: string;
  }): Promise<ActivitySessionRow> {
    return db.one<ActivitySessionRow>(
      `INSERT INTO location_activity_sessions
       (session_id, player_id, location, activity, prompt_id, difficulty, completed)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [data.sessionId, data.playerId, data.location, data.activity, data.promptId, data.difficulty]
    );
  }

  async findBySessionId(sessionId: string): Promise<ActivitySessionRow | null> {
    return db.maybeOne<ActivitySessionRow>(
      `SELECT * FROM location_activity_sessions WHERE session_id = $1`,
      [sessionId]
    );
  }

  async findActiveByUserId(userId: string): Promise<ActivitySessionRow[]> {
    return db.many<ActivitySessionRow>(
      `SELECT * FROM location_activity_sessions
       WHERE player_id = $1 AND completed = false
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  async findActiveByUserIdAndLocation(userId: string, location: string): Promise<ActivitySessionRow | null> {
    return db.maybeOne<ActivitySessionRow>(
      `SELECT * FROM location_activity_sessions
       WHERE player_id = $1 AND location = $2 AND completed = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, location]
    );
  }

  async markCompleted(sessionId: string): Promise<ActivitySessionRow> {
    return db.one<ActivitySessionRow>(
      `UPDATE location_activity_sessions
       SET completed = true, completed_at = CURRENT_TIMESTAMP
       WHERE session_id = $1
       RETURNING *`,
      [sessionId]
    );
  }

  async updateRewards(sessionId: string, rewardsJson: string): Promise<ActivitySessionRow> {
    return db.one<ActivitySessionRow>(
      `UPDATE location_activity_sessions
       SET rewards = $2
       WHERE session_id = $1
       RETURNING *`,
      [sessionId, rewardsJson]
    );
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db.query(
      `DELETE FROM location_activity_sessions WHERE session_id = $1`,
      [sessionId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findAllActive(limit = 100, offset = 0): Promise<ActivitySessionRow[]> {
    return db.many<ActivitySessionRow>(
      `SELECT * FROM location_activity_sessions
       WHERE completed = false
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  }

  async findAll(limit = 100, offset = 0): Promise<{ rows: ActivitySessionRow[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      db.many<ActivitySessionRow>(
        `SELECT * FROM location_activity_sessions
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM location_activity_sessions`
      ),
    ]);
    return { rows, total: parseInt(countResult.count, 10) };
  }
}

// ============================================================================
// Prompt Repository
// ============================================================================

export class LocationPromptRepository {
  async findByLocationActivity(location: string, activity: string): Promise<LocationPromptRow[]> {
    return db.many<LocationPromptRow>(
      `SELECT * FROM location_prompts
       WHERE location = $1 AND activity = $2
       ORDER BY id`,
      [location, activity]
    );
  }

  async findById(id: number): Promise<LocationPromptRow | null> {
    return db.maybeOne<LocationPromptRow>(
      `SELECT * FROM location_prompts WHERE id = $1`,
      [id]
    );
  }

  async create(input: LocationPromptCreateInput): Promise<LocationPromptRow> {
    return db.one<LocationPromptRow>(
      `INSERT INTO location_prompts (location, activity, prompt_text, difficulty)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.location, input.activity, input.prompt_text, input.difficulty ?? 'normal']
    );
  }

  async update(id: number, input: LocationPromptUpdateInput): Promise<LocationPromptRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.prompt_text !== undefined) {
      values.push(input.prompt_text);
      updates.push(`prompt_text = $${values.length}`);
    }
    if (input.difficulty !== undefined) {
      values.push(input.difficulty);
      updates.push(`difficulty = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Prompt not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return db.one<LocationPromptRow>(
      `UPDATE location_prompts SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      `DELETE FROM location_prompts WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findAll(limit = 100, offset = 0): Promise<{ rows: LocationPromptRow[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      db.many<LocationPromptRow>(
        `SELECT * FROM location_prompts ORDER BY location, activity, id LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM location_prompts`
      ),
    ]);
    return { rows, total: parseInt(countResult.count, 10) };
  }
}

// ============================================================================
// Flavor Repository
// ============================================================================

export class LocationFlavorRepository {
  async findByLocation(location: string): Promise<LocationFlavorRow | null> {
    return db.maybeOne<LocationFlavorRow>(
      `SELECT * FROM location_flavor
       WHERE location = $1
       LIMIT 1`,
      [location]
    );
  }

  async findById(id: number): Promise<LocationFlavorRow | null> {
    return db.maybeOne<LocationFlavorRow>(
      `SELECT * FROM location_flavor WHERE id = $1`,
      [id]
    );
  }

  async create(input: LocationFlavorCreateInput): Promise<LocationFlavorRow> {
    return db.one<LocationFlavorRow>(
      `INSERT INTO location_flavor (location, image_url, flavor_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.location, input.image_url ?? null, input.flavor_text ?? null]
    );
  }

  async update(id: number, input: LocationFlavorUpdateInput): Promise<LocationFlavorRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.image_url !== undefined) {
      values.push(input.image_url);
      updates.push(`image_url = $${values.length}`);
    }
    if (input.flavor_text !== undefined) {
      values.push(input.flavor_text);
      updates.push(`flavor_text = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Flavor not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return db.one<LocationFlavorRow>(
      `UPDATE location_flavor SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      `DELETE FROM location_flavor WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findAll(limit = 100, offset = 0): Promise<{ rows: LocationFlavorRow[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      db.many<LocationFlavorRow>(
        `SELECT * FROM location_flavor ORDER BY location, id LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM location_flavor`
      ),
    ]);
    return { rows, total: parseInt(countResult.count, 10) };
  }
}
