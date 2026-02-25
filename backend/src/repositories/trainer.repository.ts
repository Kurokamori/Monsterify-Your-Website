import { BaseRepository } from './base.repository';
import { db } from '../database';

// Row type as stored in database
export type TrainerRow = {
  id: number;
  player_user_id: string;
  name: string;
  nickname: string | null;
  full_name: string | null;
  level: number;
  currency_amount: number;
  total_earned_currency: number;
  alter_human: number | null;
  faction: string | null;
  title: string | null;
  species1: string | null;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  type6: string | null;
  ability: string | null;
  nature: string | null;
  characteristic: string | null;
  fav_berry: string | null;
  fav_type1: string | null;
  fav_type2: string | null;
  fav_type3: string | null;
  fav_type4: string | null;
  fav_type5: string | null;
  fav_type6: string | null;
  gender: string | null;
  pronouns: string | null;
  sexuality: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  birthplace: string | null;
  residence: string | null;
  race: string | null;
  occupation: string | null;
  theme: string | null;
  voice_claim: string | null;
  quote: string | null;
  tldr: string | null;
  biography: string | null;
  strengths: string | null;
  weaknesses: string | null;
  likes: string | null;
  dislikes: string | null;
  flaws: string | null;
  values: string | null;
  quirks: string | null;
  secrets: string | null;
  relations: string | null;
  icon: string | null;
  main_ref: string | null;
  additional_refs: string | null;
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

// All profile fields that can be set on create/update (using DB column names)
export type TrainerProfileFields = {
  nickname?: string | null;
  full_name?: string | null;
  faction?: string | null;
  title?: string | null;
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  type6?: string | null;
  ability?: string | null;
  nature?: string | null;
  characteristic?: string | null;
  fav_berry?: string | null;
  fav_type1?: string | null;
  fav_type2?: string | null;
  fav_type3?: string | null;
  fav_type4?: string | null;
  fav_type5?: string | null;
  fav_type6?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  sexuality?: string | null;
  age?: string | null;
  height?: string | null;
  weight?: string | null;
  birthplace?: string | null;
  residence?: string | null;
  race?: string | null;
  occupation?: string | null;
  theme?: string | null;
  voice_claim?: string | null;
  quote?: string | null;
  tldr?: string | null;
  biography?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  likes?: string | null;
  dislikes?: string | null;
  flaws?: string | null;
  values?: string | null;
  quirks?: string | null;
  secrets?: string | null;
  relations?: string | null;
  icon?: string | null;
};

export type TrainerCreateInput = {
  playerUserId: string;
  name: string;
  level?: number;
  currencyAmount?: number;
  totalEarnedCurrency?: number;
  mainRef?: string | null;
  birthday?: string | null;
  zodiac?: string | null;
  chineseZodiac?: string | null;
} & TrainerProfileFields;

export type TrainerUpdateInput = {
  name?: string;
  mainRef?: string | null;
  additionalRefs?: string | null;
  birthday?: string | null;
  zodiac?: string | null;
  chineseZodiac?: string | null;
  megaInfo?: string | null;
} & TrainerProfileFields;

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

    // Build columns and values dynamically
    const columns: string[] = ['player_user_id', 'name', 'level', 'currency_amount', 'total_earned_currency',
      'main_ref', 'birthday', 'zodiac', 'chinese_zodiac'];
    const vals: unknown[] = [
      input.playerUserId, input.name, level, currencyAmount, totalEarnedCurrency,
      input.mainRef ?? null, input.birthday ?? null,
      input.zodiac ?? null, input.chineseZodiac ?? null,
    ];

    const profileFields = [
      'nickname', 'full_name', 'faction', 'title',
      'species1', 'species2', 'species3',
      'type1', 'type2', 'type3', 'type4', 'type5', 'type6',
      'ability', 'nature', 'characteristic',
      'fav_berry', 'fav_type1', 'fav_type2', 'fav_type3', 'fav_type4', 'fav_type5', 'fav_type6',
      'gender', 'pronouns', 'sexuality', 'age', 'height', 'weight',
      'birthplace', 'residence', 'race', 'occupation', 'theme', 'voice_claim',
      'quote', 'tldr', 'biography',
      'strengths', 'weaknesses', 'likes', 'dislikes', 'flaws', 'values', 'quirks',
      'secrets', 'relations', 'icon',
    ];

    for (const field of profileFields) {
      const val = (input as Record<string, unknown>)[field];
      if (val !== undefined && val !== null) {
        columns.push(field);
        vals.push(val);
      }
    }

    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await db.query<TrainerRow>(
      `INSERT INTO trainers (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      vals
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

    // Map of input key -> DB column (for keys where they differ)
    const fieldMap: Record<string, string> = {
      name: 'name',
      mainRef: 'main_ref',
      additionalRefs: 'additional_refs',
      birthday: 'birthday',
      zodiac: 'zodiac',
      chineseZodiac: 'chinese_zodiac',
      megaInfo: 'mega_info',
    };

    // Fields where input key matches DB column exactly
    const directFields = [
      'nickname', 'full_name', 'faction', 'title',
      'species1', 'species2', 'species3',
      'type1', 'type2', 'type3', 'type4', 'type5', 'type6',
      'ability', 'nature', 'characteristic',
      'fav_berry', 'fav_type1', 'fav_type2', 'fav_type3', 'fav_type4', 'fav_type5', 'fav_type6',
      'gender', 'pronouns', 'sexuality', 'age', 'height', 'weight',
      'birthplace', 'residence', 'race', 'occupation', 'theme', 'voice_claim',
      'quote', 'tldr', 'biography',
      'strengths', 'weaknesses', 'likes', 'dislikes', 'flaws', 'values', 'quirks',
      'secrets', 'relations', 'icon',
    ];

    for (const [key, column] of Object.entries(fieldMap)) {
      const val = (input as Record<string, unknown>)[key];
      if (val !== undefined) {
        pushUpdate(column, val);
      }
    }

    for (const field of directFields) {
      const val = (input as Record<string, unknown>)[field];
      if (val !== undefined) {
        pushUpdate(field, val);
      }
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

  async subtractLevels(id: number, levels: number): Promise<TrainerWithStats> {
    await db.query(
      `
        UPDATE trainers
        SET level = level - $1, updated_at = CURRENT_TIMESTAMP
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
