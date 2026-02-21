import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AdventureParticipantRow = {
  id: number;
  adventure_id: number;
  discord_user_id: string;
  user_id: number | null;
  word_count: number;
  message_count: number;
  last_message_at: Date | null;
  joined_at: Date;
};

export type AdventureParticipant = {
  id: number;
  adventureId: number;
  discordUserId: string;
  userId: number | null;
  wordCount: number;
  messageCount: number;
  lastMessageAt: Date | null;
  joinedAt: Date;
};

export type AdventureParticipantWithDetails = AdventureParticipant & {
  username: string | null;
  adventureTitle: string | null;
  adventureStatus: string | null;
};

export type AdventureParticipantCreateInput = {
  adventureId: number;
  discordUserId: string;
  userId?: number | null;
  wordCount?: number;
  messageCount?: number;
};

export type AdventureParticipantUpdateInput = {
  userId?: number | null;
  wordCount?: number;
  messageCount?: number;
  lastMessageAt?: Date;
};

const normalizeAdventureParticipant = (row: AdventureParticipantRow): AdventureParticipant => ({
  id: row.id,
  adventureId: row.adventure_id,
  discordUserId: row.discord_user_id,
  userId: row.user_id,
  wordCount: row.word_count,
  messageCount: row.message_count,
  lastMessageAt: row.last_message_at,
  joinedAt: row.joined_at,
});

type AdventureParticipantWithDetailsRow = AdventureParticipantRow & {
  username: string | null;
  adventure_title: string | null;
  adventure_status: string | null;
};

const normalizeAdventureParticipantWithDetails = (row: AdventureParticipantWithDetailsRow): AdventureParticipantWithDetails => ({
  ...normalizeAdventureParticipant(row),
  username: row.username,
  adventureTitle: row.adventure_title,
  adventureStatus: row.adventure_status,
});

export class AdventureParticipantRepository extends BaseRepository<
  AdventureParticipant,
  AdventureParticipantCreateInput,
  AdventureParticipantUpdateInput
> {
  constructor() {
    super('adventure_participants');
  }

  override async findById(id: number): Promise<AdventureParticipantWithDetails | null> {
    const result = await db.query<AdventureParticipantWithDetailsRow>(
      `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureParticipantWithDetails(row) : null;
  }

  async findByAdventureId(adventureId: number): Promise<AdventureParticipantWithDetails[]> {
    const result = await db.query<AdventureParticipantWithDetailsRow>(
      `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.adventure_id = $1
        ORDER BY ap.word_count DESC
      `,
      [adventureId]
    );
    return result.rows.map(normalizeAdventureParticipantWithDetails);
  }

  async findByDiscordUser(discordUserId: string): Promise<AdventureParticipantWithDetails[]> {
    const result = await db.query<AdventureParticipantWithDetailsRow>(
      `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.discord_user_id = $1
        ORDER BY ap.joined_at DESC
      `,
      [discordUserId]
    );
    return result.rows.map(normalizeAdventureParticipantWithDetails);
  }

  async findByAdventureAndDiscordUser(adventureId: number, discordUserId: string): Promise<AdventureParticipantWithDetails | null> {
    const result = await db.query<AdventureParticipantWithDetailsRow>(
      `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.adventure_id = $1 AND ap.discord_user_id = $2
      `,
      [adventureId, discordUserId]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureParticipantWithDetails(row) : null;
  }

  async findByUserId(userId: number): Promise<AdventureParticipantWithDetails[]> {
    const result = await db.query<AdventureParticipantWithDetailsRow>(
      `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.user_id = $1
        ORDER BY ap.joined_at DESC
      `,
      [userId]
    );
    return result.rows.map(normalizeAdventureParticipantWithDetails);
  }

  override async create(input: AdventureParticipantCreateInput): Promise<AdventureParticipant> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO adventure_participants (adventure_id, discord_user_id, user_id, word_count, message_count)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        input.adventureId,
        input.discordUserId,
        input.userId ?? null,
        input.wordCount ?? 0,
        input.messageCount ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert adventure participant');
    }
    const participant = await this.findById(insertedRow.id);
    if (!participant) {
      throw new Error('Failed to create adventure participant');
    }
    return participant;
  }

  override async update(id: number, input: AdventureParticipantUpdateInput): Promise<AdventureParticipant> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.userId !== undefined) {
      values.push(input.userId);
      updates.push(`user_id = $${values.length}`);
    }
    if (input.wordCount !== undefined) {
      values.push(input.wordCount);
      updates.push(`word_count = $${values.length}`);
    }
    if (input.messageCount !== undefined) {
      values.push(input.messageCount);
      updates.push(`message_count = $${values.length}`);
    }
    if (input.lastMessageAt !== undefined) {
      values.push(input.lastMessageAt);
      updates.push(`last_message_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Adventure participant not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE adventure_participants SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Adventure participant not found after update');
    }
    return updated;
  }

  async addOrUpdate(input: AdventureParticipantCreateInput): Promise<AdventureParticipant> {
    const existing = await this.findByAdventureAndDiscordUser(input.adventureId, input.discordUserId);

    if (existing) {
      return this.addMessage(existing.id, input.wordCount ?? 0, input.messageCount ?? 1);
    }

    return this.create(input);
  }

  async addMessage(id: number, wordCount: number, messageCount = 1): Promise<AdventureParticipant> {
    const participant = await this.findById(id);
    if (!participant) {
      throw new Error(`Adventure participant ${id} not found`);
    }

    return this.update(id, {
      wordCount: participant.wordCount + wordCount,
      messageCount: participant.messageCount + messageCount,
      lastMessageAt: new Date(),
    });
  }

  async linkUser(id: number, userId: number): Promise<AdventureParticipant> {
    return this.update(id, { userId });
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM adventure_participants WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByAdventureId(adventureId: number): Promise<number> {
    const result = await db.query('DELETE FROM adventure_participants WHERE adventure_id = $1', [adventureId]);
    return result.rowCount ?? 0;
  }

  async getLeaderboard(adventureId: number, limit = 10): Promise<AdventureParticipantWithDetails[]> {
    const result = await db.query<AdventureParticipantWithDetailsRow>(
      `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.adventure_id = $1
        ORDER BY ap.word_count DESC
        LIMIT $2
      `,
      [adventureId, limit]
    );
    return result.rows.map(normalizeAdventureParticipantWithDetails);
  }

  async getStatsByAdventure(adventureId: number): Promise<{
    totalParticipants: number;
    totalWords: number;
    totalMessages: number;
    avgWordsPerParticipant: number;
  }> {
    const result = await db.query<{
      total_participants: string;
      total_words: string | null;
      total_messages: string | null;
      avg_words: string | null;
    }>(
      `
        SELECT
          COUNT(*) as total_participants,
          SUM(word_count) as total_words,
          SUM(message_count) as total_messages,
          AVG(word_count) as avg_words
        FROM adventure_participants
        WHERE adventure_id = $1
      `,
      [adventureId]
    );

    const stats = result.rows[0];
    if (!stats) {
      return {
        totalParticipants: 0,
        totalWords: 0,
        totalMessages: 0,
        avgWordsPerParticipant: 0,
      };
    }
    return {
      totalParticipants: parseInt(stats.total_participants, 10),
      totalWords: parseInt(stats.total_words ?? '0', 10),
      totalMessages: parseInt(stats.total_messages ?? '0', 10),
      avgWordsPerParticipant: parseFloat(stats.avg_words ?? '0'),
    };
  }
}
