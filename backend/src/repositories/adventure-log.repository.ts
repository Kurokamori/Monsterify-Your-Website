import { BaseRepository } from './base.repository';
import { db } from '../database';

export type ItemEarned = {
  itemId: number;
  itemName: string;
  quantity: number;
  [key: string]: unknown;
};

export type AdventureLogRow = {
  id: number;
  adventure_id: number;
  discord_user_id: string | null;
  user_id: number | null;
  word_count: number;
  levels_earned: number;
  coins_earned: number;
  items_earned: string | object | null;
  is_claimed: boolean;
  claimed_at: Date | null;
  created_at: Date;
};

export type AdventureLog = {
  id: number;
  adventureId: number;
  discordUserId: string | null;
  userId: number | null;
  wordCount: number;
  levelsEarned: number;
  coinsEarned: number;
  itemsEarned: ItemEarned[];
  isClaimed: boolean;
  claimedAt: Date | null;
  createdAt: Date;
};

export type AdventureLogWithDetails = AdventureLog & {
  adventureTitle: string | null;
  adventureDescription: string | null;
  username: string | null;
  displayName: string | null;
};

export type AdventureLogCreateInput = {
  adventureId: number;
  discordUserId?: string | null;
  userId?: number | null;
  wordCount?: number;
  levelsEarned?: number;
  coinsEarned?: number;
  itemsEarned?: ItemEarned[];
};

export type AdventureLogUpdateInput = {
  wordCount?: number;
  levelsEarned?: number;
  coinsEarned?: number;
  itemsEarned?: ItemEarned[];
  isClaimed?: boolean;
  claimedAt?: Date | null;
};

const parseItemsEarned = (value: string | object | null): ItemEarned[] => {
  if (!value) {return [];}
  if (Array.isArray(value)) {return value as ItemEarned[];}
  if (typeof value === 'object') {return [];}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return [];
    }
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeAdventureLog = (row: AdventureLogRow): AdventureLog => ({
  id: row.id,
  adventureId: row.adventure_id,
  discordUserId: row.discord_user_id,
  userId: row.user_id,
  wordCount: row.word_count,
  levelsEarned: row.levels_earned,
  coinsEarned: row.coins_earned,
  itemsEarned: parseItemsEarned(row.items_earned),
  isClaimed: row.is_claimed,
  claimedAt: row.claimed_at,
  createdAt: row.created_at,
});

type AdventureLogWithDetailsRow = AdventureLogRow & {
  adventure_title: string | null;
  adventure_description: string | null;
  username: string | null;
  display_name: string | null;
};

const normalizeAdventureLogWithDetails = (row: AdventureLogWithDetailsRow): AdventureLogWithDetails => ({
  ...normalizeAdventureLog(row),
  adventureTitle: row.adventure_title,
  adventureDescription: row.adventure_description,
  username: row.username,
  displayName: row.display_name,
});

export class AdventureLogRepository extends BaseRepository<
  AdventureLog,
  AdventureLogCreateInput,
  AdventureLogUpdateInput
> {
  constructor() {
    super('adventure_logs');
  }

  override async findById(id: number): Promise<AdventureLogWithDetails | null> {
    const result = await db.query<AdventureLogWithDetailsRow>(
      `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description,
               u.username, u.display_name
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureLogWithDetails(row) : null;
  }

  async findByAdventureId(adventureId: number): Promise<AdventureLogWithDetails[]> {
    const result = await db.query<AdventureLogWithDetailsRow>(
      `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description,
               u.username, u.display_name
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.adventure_id = $1
        ORDER BY al.created_at DESC
      `,
      [adventureId]
    );
    return result.rows.map(normalizeAdventureLogWithDetails);
  }

  async findUnclaimedByDiscordUser(discordUserId: string): Promise<AdventureLogWithDetails[]> {
    const result = await db.query<AdventureLogWithDetailsRow>(
      `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description,
               u.username, u.display_name
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.discord_user_id = $1 AND al.is_claimed::boolean = false
        ORDER BY al.created_at DESC
      `,
      [discordUserId]
    );
    return result.rows.map(normalizeAdventureLogWithDetails);
  }

  async findByAdventureAndDiscordUser(adventureId: number, discordUserId: string): Promise<AdventureLogWithDetails | null> {
    const result = await db.query<AdventureLogWithDetailsRow>(
      `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description,
               u.username, u.display_name
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.adventure_id = $1 AND al.discord_user_id = $2
      `,
      [adventureId, discordUserId]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureLogWithDetails(row) : null;
  }

  async findByUserId(userId: number): Promise<AdventureLogWithDetails[]> {
    const result = await db.query<AdventureLogWithDetailsRow>(
      `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description,
               u.username, u.display_name
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.user_id = $1
        ORDER BY al.created_at DESC
      `,
      [userId]
    );
    return result.rows.map(normalizeAdventureLogWithDetails);
  }

  override async create(input: AdventureLogCreateInput): Promise<AdventureLog> {
    const itemsEarnedJson = JSON.stringify(input.itemsEarned ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO adventure_logs (
          adventure_id, discord_user_id, user_id, word_count,
          levels_earned, coins_earned, items_earned
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.adventureId,
        input.discordUserId ?? null,
        input.userId ?? null,
        input.wordCount ?? 0,
        input.levelsEarned ?? 0,
        input.coinsEarned ?? 0,
        itemsEarnedJson,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert adventure log');
    }
    const log = await this.findById(insertedRow.id);
    if (!log) {
      throw new Error('Failed to create adventure log');
    }
    return log;
  }

  override async update(id: number, input: AdventureLogUpdateInput): Promise<AdventureLog> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.wordCount !== undefined) {
      values.push(input.wordCount);
      updates.push(`word_count = $${values.length}`);
    }
    if (input.levelsEarned !== undefined) {
      values.push(input.levelsEarned);
      updates.push(`levels_earned = $${values.length}`);
    }
    if (input.coinsEarned !== undefined) {
      values.push(input.coinsEarned);
      updates.push(`coins_earned = $${values.length}`);
    }
    if (input.itemsEarned !== undefined) {
      values.push(JSON.stringify(input.itemsEarned));
      updates.push(`items_earned = $${values.length}`);
    }
    if (input.isClaimed !== undefined) {
      values.push(input.isClaimed);
      updates.push(`is_claimed = $${values.length}`);
    }
    if (input.claimedAt !== undefined) {
      values.push(input.claimedAt);
      updates.push(`claimed_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Adventure log not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE adventure_logs SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Adventure log not found after update');
    }
    return updated;
  }

  async markAsClaimed(id: number): Promise<AdventureLog> {
    return this.update(id, {
      isClaimed: true,
      claimedAt: new Date(),
    });
  }

  async addRewards(
    id: number,
    rewards: { levelsEarned?: number; coinsEarned?: number; itemsEarned?: ItemEarned[] }
  ): Promise<AdventureLog> {
    const log = await this.findById(id);
    if (!log) {
      throw new Error(`Adventure log ${id} not found`);
    }

    const updateData: AdventureLogUpdateInput = {};

    if (rewards.levelsEarned !== undefined) {
      updateData.levelsEarned = log.levelsEarned + rewards.levelsEarned;
    }
    if (rewards.coinsEarned !== undefined) {
      updateData.coinsEarned = log.coinsEarned + rewards.coinsEarned;
    }
    if (rewards.itemsEarned !== undefined) {
      updateData.itemsEarned = [...log.itemsEarned, ...rewards.itemsEarned];
    }

    return this.update(id, updateData);
  }

  async getTotalRewardsByAdventure(adventureId: number): Promise<{
    totalLevels: number;
    totalCoins: number;
    totalWords: number;
    participantCount: number;
  }> {
    const result = await db.query<{
      total_levels: string | null;
      total_coins: string | null;
      total_words: string | null;
      participant_count: string;
    }>(
      `
        SELECT
          SUM(levels_earned) as total_levels,
          SUM(coins_earned) as total_coins,
          SUM(word_count) as total_words,
          COUNT(*) as participant_count
        FROM adventure_logs
        WHERE adventure_id = $1
      `,
      [adventureId]
    );

    const stats = result.rows[0];
    if (!stats) {
      return {
        totalLevels: 0,
        totalCoins: 0,
        totalWords: 0,
        participantCount: 0,
      };
    }
    return {
      totalLevels: parseInt(stats.total_levels ?? '0', 10),
      totalCoins: parseInt(stats.total_coins ?? '0', 10),
      totalWords: parseInt(stats.total_words ?? '0', 10),
      participantCount: parseInt(stats.participant_count, 10),
    };
  }
}
