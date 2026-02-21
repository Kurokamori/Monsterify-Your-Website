import { BaseRepository } from './base.repository';
import { db } from '../database';

// Row type as stored in database
export type TrainerRow = {
  id: number;
  player_user_id: string;
  name: string;
  level: number;
  currency_amount: number;
  total_earned_currency: number;
  main_ref: string | null;
  additional_refs: string | null;
  bio: string | null;
  birthday: string | null;
  zodiac: string | null;
  chinese_zodiac: string | null;
  mega_info: string | null;
  created_at: Date;
  updated_at: Date;
};

// Extended trainer with computed fields from joins
export type TrainerWithStats = TrainerRow & {
  player_display_name: string | null;
  player_username: string | null;
  monster_count: number;
  monster_ref_count: number;
  monster_ref_percent: number;
};

export type TrainerCreateInput = {
  playerUserId: string;
  name: string;
  level?: number;
  currencyAmount?: number;
  totalEarnedCurrency?: number;
  mainRef?: string | null;
  bio?: string | null;
  birthday?: string | null;
  zodiac?: string | null;
  chineseZodiac?: string | null;
};

export type TrainerUpdateInput = {
  name?: string;
  mainRef?: string | null;
  additionalRefs?: string | null;
  bio?: string | null;
  birthday?: string | null;
  zodiac?: string | null;
  chineseZodiac?: string | null;
  megaInfo?: string | null;
};

const BASE_SELECT_WITH_STATS = `
  SELECT
    t.*,
    u.display_name AS player_display_name,
    u.username AS player_username,
    COALESCE(mc.monster_count, 0) AS monster_count,
    COALESCE(mc.monster_ref_count, 0) AS monster_ref_count
  FROM trainers t
  LEFT JOIN users u ON t.player_user_id = u.discord_id
  LEFT JOIN (
    SELECT
      trainer_id,
      COUNT(*) AS monster_count,
      COUNT(CASE WHEN img_link IS NOT NULL AND img_link != '' AND img_link != 'null' THEN 1 END) AS monster_ref_count
    FROM monsters
    GROUP BY trainer_id
  ) mc ON t.id = mc.trainer_id
`;

const computeMonsterRefPercent = (trainer: TrainerWithStats): TrainerWithStats => {
  const monsterCount = Number(trainer.monster_count) || 0;
  const monsterRefCount = Number(trainer.monster_ref_count) || 0;
  return {
    ...trainer,
    monster_count: monsterCount,
    monster_ref_count: monsterRefCount,
    monster_ref_percent: monsterCount > 0
      ? Math.round((monsterRefCount / monsterCount) * 100)
      : 0,
  };
};

export class TrainerRepository extends BaseRepository<TrainerWithStats, TrainerCreateInput, TrainerUpdateInput> {
  constructor() {
    super('trainers');
  }

  override async findById(id: number): Promise<TrainerWithStats | null> {
    const result = await db.query<TrainerWithStats>(
      `${BASE_SELECT_WITH_STATS} WHERE t.id = $1`,
      [id]
    );
    const trainer = result.rows[0];
    return trainer ? computeMonsterRefPercent(trainer) : null;
  }

  async findAll(limit = 100, offset = 0): Promise<TrainerWithStats[]> {
    const result = await db.query<TrainerWithStats>(
      `${BASE_SELECT_WITH_STATS} ORDER BY t.name LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows.map(computeMonsterRefPercent);
  }

  async findByUserId(userId: string): Promise<TrainerWithStats[]> {
    const result = await db.query<TrainerWithStats>(
      `${BASE_SELECT_WITH_STATS} WHERE t.player_user_id = $1 ORDER BY t.name`,
      [userId]
    );
    return result.rows.map(computeMonsterRefPercent);
  }

  async findByName(name: string): Promise<TrainerWithStats | null> {
    const result = await db.query<TrainerWithStats>(
      `${BASE_SELECT_WITH_STATS} WHERE LOWER(t.name) = LOWER($1) LIMIT 1`,
      [name]
    );
    const trainer = result.rows[0];
    return trainer ? computeMonsterRefPercent(trainer) : null;
  }

  async findByNameAndUser(name: string, discordUserId: string): Promise<TrainerWithStats | null> {
    const result = await db.query<TrainerWithStats>(
      `${BASE_SELECT_WITH_STATS} WHERE LOWER(t.name) = LOWER($1) AND t.player_user_id = $2`,
      [name, discordUserId]
    );
    const trainer = result.rows[0];
    return trainer ? computeMonsterRefPercent(trainer) : null;
  }

  override async create(input: TrainerCreateInput): Promise<TrainerWithStats> {
    const level = input.level ?? 1;
    const currencyAmount = input.currencyAmount ?? 500;
    const totalEarnedCurrency = input.totalEarnedCurrency ?? 500;

    const result = await db.query<TrainerRow>(
      `
        INSERT INTO trainers (
          player_user_id, name, level, currency_amount, total_earned_currency,
          main_ref, bio, birthday, zodiac, chinese_zodiac
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        input.playerUserId,
        input.name,
        level,
        currencyAmount,
        totalEarnedCurrency,
        input.mainRef ?? null,
        input.bio ?? null,
        input.birthday ?? null,
        input.zodiac ?? null,
        input.chineseZodiac ?? null,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create trainer');
    }
    const trainer = await this.findById(row.id);
    if (!trainer) {
      throw new Error('Failed to retrieve newly created trainer');
    }
    return trainer;
  }

  override async update(id: number, input: TrainerUpdateInput): Promise<TrainerWithStats> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const pushUpdate = (column: string, value: unknown) => {
      updates.push(`${column} = $${values.length + 1}`);
      values.push(value);
    };

    if (input.name !== undefined) {
      pushUpdate('name', input.name);
    }
    if (input.mainRef !== undefined) {
      pushUpdate('main_ref', input.mainRef);
    }
    if (input.additionalRefs !== undefined) {
      pushUpdate('additional_refs', input.additionalRefs);
    }
    if (input.bio !== undefined) {
      pushUpdate('bio', input.bio);
    }
    if (input.birthday !== undefined) {
      pushUpdate('birthday', input.birthday);
    }
    if (input.zodiac !== undefined) {
      pushUpdate('zodiac', input.zodiac);
    }
    if (input.chineseZodiac !== undefined) {
      pushUpdate('chinese_zodiac', input.chineseZodiac);
    }
    if (input.megaInfo !== undefined) {
      pushUpdate('mega_info', input.megaInfo);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Trainer not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE trainers SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Trainer not found after update');
    }
    return updated;
  }

  async updateOwner(id: number, newPlayerUserId: string): Promise<TrainerWithStats> {
    await db.query(
      `UPDATE trainers SET player_user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newPlayerUserId, id]
    );
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Trainer not found after owner update');
    }
    return updated;
  }

  async updateCurrency(id: number, amount: number): Promise<TrainerWithStats> {
    const trainer = await this.findById(id);
    if (!trainer) {
      throw new Error(`Trainer with ID ${id} not found`);
    }

    const currentAmount = trainer.currency_amount || 0;
    const newAmount = Math.max(0, currentAmount + amount);

    if (amount > 0) {
      await db.query(
        `
          UPDATE trainers
          SET currency_amount = $1, total_earned_currency = total_earned_currency + $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [newAmount, amount, id]
      );
    } else {
      await db.query(
        `
          UPDATE trainers
          SET currency_amount = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [newAmount, id]
      );
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Trainer not found after currency update');
    }
    return updated;
  }

  async addLevels(id: number, levels: number): Promise<TrainerWithStats> {
    await db.query(
      `
        UPDATE trainers
        SET level = level + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [levels, id]
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Trainer not found after level update');
    }
    return updated;
  }

  async addLevelsAndCoins(id: number, levels: number, coins: number): Promise<TrainerWithStats> {
    await db.query(
      `
        UPDATE trainers
        SET
          level = level + $1,
          currency_amount = currency_amount + $2,
          total_earned_currency = total_earned_currency + $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [levels, coins, id]
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Trainer not found after update');
    }
    return updated;
  }
}
