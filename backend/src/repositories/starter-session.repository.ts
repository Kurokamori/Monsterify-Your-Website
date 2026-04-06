import { db } from '../database';

// ============================================================================
// Types
// ============================================================================

export type StarterSessionRow = {
  id: number;
  user_id: number;
  trainer_id: number;
  seed: string;
  starter_sets: unknown[];
  selected_starters: unknown[];
  starter_names: string[];
  current_step: number;
  created_at: Date;
  updated_at: Date;
};

// ============================================================================
// Repository
// ============================================================================

export class StarterSessionRepository {
  /**
   * Save or update a session. Uses upsert keyed on (user_id, trainer_id).
   */
  async save(
    userId: number,
    trainerId: number,
    data: {
      seed: string;
      starterSets: unknown[];
      selectedStarters: unknown[];
      starterNames: string[];
      currentStep: number;
    },
  ): Promise<StarterSessionRow> {
    const row = await db.one<StarterSessionRow>(
      `INSERT INTO starter_sessions (user_id, trainer_id, seed, starter_sets, selected_starters, starter_names, current_step, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (user_id, trainer_id)
       DO UPDATE SET
         seed = $3,
         starter_sets = $4,
         selected_starters = $5,
         starter_names = $6,
         current_step = $7,
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        trainerId,
        data.seed,
        JSON.stringify(data.starterSets),
        JSON.stringify(data.selectedStarters),
        JSON.stringify(data.starterNames),
        data.currentStep,
      ],
    );
    return row;
  }

  /**
   * Find a session by user and trainer.
   */
  async findByUserAndTrainer(userId: number, trainerId: number): Promise<StarterSessionRow | null> {
    return db.maybeOne<StarterSessionRow>(
      'SELECT * FROM starter_sessions WHERE user_id = $1 AND trainer_id = $2',
      [userId, trainerId],
    );
  }

  /**
   * Delete a session (called when starters are claimed).
   */
  async deleteByUserAndTrainer(userId: number, trainerId: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM starter_sessions WHERE user_id = $1 AND trainer_id = $2',
      [userId, trainerId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete stale sessions older than the given number of days.
   */
  async deleteStale(days: number = 7): Promise<number> {
    const result = await db.query(
      'DELETE FROM starter_sessions WHERE created_at < NOW() - $1::interval',
      [`${days} days`],
    );
    return result.rowCount ?? 0;
  }
}
