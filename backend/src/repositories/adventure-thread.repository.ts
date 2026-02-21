import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AdventureThreadRow = {
  id: number;
  adventure_id: number;
  discord_thread_id: string;
  discord_channel_id: string;
  thread_name: string;
  created_at: Date;
  updated_at: Date;
};

export type AdventureThread = {
  id: number;
  adventureId: number;
  discordThreadId: string;
  discordChannelId: string;
  threadName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AdventureThreadWithDetails = AdventureThread & {
  adventureTitle: string | null;
  adventureStatus: string | null;
  encounterCount: number | null;
  maxEncounters: number | null;
};

export type AdventureThreadCreateInput = {
  adventureId: number;
  discordThreadId: string;
  discordChannelId: string;
  threadName: string;
};

export type AdventureThreadUpdateInput = {
  threadName?: string;
  discordChannelId?: string;
};

const normalizeAdventureThread = (row: AdventureThreadRow): AdventureThread => ({
  id: row.id,
  adventureId: row.adventure_id,
  discordThreadId: row.discord_thread_id,
  discordChannelId: row.discord_channel_id,
  threadName: row.thread_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type AdventureThreadWithDetailsRow = AdventureThreadRow & {
  adventure_title: string | null;
  adventure_status: string | null;
  encounter_count: number | null;
  max_encounters: number | null;
};

const normalizeAdventureThreadWithDetails = (row: AdventureThreadWithDetailsRow): AdventureThreadWithDetails => ({
  ...normalizeAdventureThread(row),
  adventureTitle: row.adventure_title,
  adventureStatus: row.adventure_status,
  encounterCount: row.encounter_count,
  maxEncounters: row.max_encounters,
});

export class AdventureThreadRepository extends BaseRepository<
  AdventureThread,
  AdventureThreadCreateInput,
  AdventureThreadUpdateInput
> {
  constructor() {
    super('adventure_threads');
  }

  override async findById(id: number): Promise<AdventureThreadWithDetails | null> {
    const result = await db.query<AdventureThreadWithDetailsRow>(
      `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status,
               a.encounter_count, a.max_encounters
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE at.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureThreadWithDetails(row) : null;
  }

  async findByDiscordThreadId(discordThreadId: string): Promise<AdventureThreadWithDetails | null> {
    const result = await db.query<AdventureThreadWithDetailsRow>(
      `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status,
               a.encounter_count, a.max_encounters
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE at.discord_thread_id = $1
      `,
      [discordThreadId]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureThreadWithDetails(row) : null;
  }

  async findByAdventureId(adventureId: number): Promise<AdventureThreadWithDetails | null> {
    const result = await db.query<AdventureThreadWithDetailsRow>(
      `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status,
               a.encounter_count, a.max_encounters
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE at.adventure_id = $1
      `,
      [adventureId]
    );
    const row = result.rows[0];
    return row ? normalizeAdventureThreadWithDetails(row) : null;
  }

  async findByChannelId(discordChannelId: string): Promise<AdventureThreadWithDetails[]> {
    const result = await db.query<AdventureThreadWithDetailsRow>(
      `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status,
               a.encounter_count, a.max_encounters
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE at.discord_channel_id = $1
        ORDER BY at.created_at DESC
      `,
      [discordChannelId]
    );
    return result.rows.map(normalizeAdventureThreadWithDetails);
  }

  async findActiveThreads(): Promise<AdventureThreadWithDetails[]> {
    const result = await db.query<AdventureThreadWithDetailsRow>(
      `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status,
               a.encounter_count, a.max_encounters
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE a.status = 'active'
        ORDER BY at.created_at DESC
      `
    );
    return result.rows.map(normalizeAdventureThreadWithDetails);
  }

  override async create(input: AdventureThreadCreateInput): Promise<AdventureThread> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO adventure_threads (adventure_id, discord_thread_id, discord_channel_id, thread_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [
        input.adventureId,
        input.discordThreadId,
        input.discordChannelId,
        input.threadName,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert adventure thread');
    }
    const thread = await this.findById(insertedRow.id);
    if (!thread) {
      throw new Error('Failed to create adventure thread');
    }
    return thread;
  }

  override async update(id: number, input: AdventureThreadUpdateInput): Promise<AdventureThread> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.threadName !== undefined) {
      values.push(input.threadName);
      updates.push(`thread_name = $${values.length}`);
    }
    if (input.discordChannelId !== undefined) {
      values.push(input.discordChannelId);
      updates.push(`discord_channel_id = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Adventure thread not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE adventure_threads SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Adventure thread not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM adventure_threads WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByDiscordThreadId(discordThreadId: string): Promise<boolean> {
    const result = await db.query('DELETE FROM adventure_threads WHERE discord_thread_id = $1', [discordThreadId]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByAdventureId(adventureId: number): Promise<boolean> {
    const result = await db.query('DELETE FROM adventure_threads WHERE adventure_id = $1', [adventureId]);
    return (result.rowCount ?? 0) > 0;
  }

  async exists(discordThreadId: string): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM adventure_threads WHERE discord_thread_id = $1',
      [discordThreadId]
    );
    const countRow = result.rows[0];
    return parseInt(countRow?.count ?? '0', 10) > 0;
  }
}
