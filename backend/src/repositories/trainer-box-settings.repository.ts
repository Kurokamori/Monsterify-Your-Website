import { db } from '../database';

export interface TrainerBoxSettingRow {
  id: number;
  trainer_id: number;
  box_number: number;
  is_locked: boolean;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BoxSettingInput {
  boxNumber: number;
  isLocked: boolean;
  isDefault: boolean;
}

export class TrainerBoxSettingsRepository {
  async findByTrainerId(trainerId: number): Promise<TrainerBoxSettingRow[]> {
    const result = await db.query<TrainerBoxSettingRow>(
      `SELECT * FROM trainer_box_settings WHERE trainer_id = $1 ORDER BY box_number`,
      [trainerId]
    );
    return result.rows;
  }

  async upsertMany(trainerId: number, settings: BoxSettingInput[]): Promise<TrainerBoxSettingRow[]> {
    if (settings.length === 0) {
      // Remove all settings for this trainer
      await db.query(`DELETE FROM trainer_box_settings WHERE trainer_id = $1`, [trainerId]);
      return [];
    }

    // Enforce max 1 default
    const defaults = settings.filter(s => s.isDefault);
    if (defaults.length > 1) {
      throw new Error('Only one box can be set as default');
    }

    // Remove settings for boxes not included
    const boxNumbers = settings.map(s => s.boxNumber);
    await db.query(
      `DELETE FROM trainer_box_settings WHERE trainer_id = $1 AND box_number != ALL($2::int[])`,
      [trainerId, boxNumbers]
    );

    // Upsert each setting
    for (const setting of settings) {
      await db.query(
        `INSERT INTO trainer_box_settings (trainer_id, box_number, is_locked, is_default)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (trainer_id, box_number)
         DO UPDATE SET is_locked = $3, is_default = $4, updated_at = CURRENT_TIMESTAMP`,
        [trainerId, setting.boxNumber, setting.isLocked, setting.isDefault]
      );
    }

    return this.findByTrainerId(trainerId);
  }

  async getLockedBoxNumbers(trainerId: number): Promise<number[]> {
    const result = await db.query<{ box_number: number }>(
      `SELECT box_number FROM trainer_box_settings WHERE trainer_id = $1 AND is_locked = true ORDER BY box_number`,
      [trainerId]
    );
    return result.rows.map(r => r.box_number);
  }

  async getDefaultBoxNumber(trainerId: number): Promise<number | null> {
    const result = await db.query<{ box_number: number }>(
      `SELECT box_number FROM trainer_box_settings WHERE trainer_id = $1 AND is_default = true LIMIT 1`,
      [trainerId]
    );
    return result.rows[0]?.box_number ?? null;
  }

  async clearDefault(trainerId: number): Promise<void> {
    await db.query(
      `UPDATE trainer_box_settings SET is_default = false, updated_at = CURRENT_TIMESTAMP WHERE trainer_id = $1`,
      [trainerId]
    );
  }
}
