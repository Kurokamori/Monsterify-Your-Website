import { BaseRepository } from './base.repository';
import { db } from '../database';
import type {
  ChatProfileRow,
  ChatProfile,
  ChatProfileCreateInput,
  ChatProfileUpdateInput,
} from '../utils/types';

const normalize = (row: ChatProfileRow): ChatProfile => ({
  id: row.id,
  trainerId: row.trainer_id,
  nickname: row.nickname,
  status: row.status,
  bio: row.bio,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class ChatProfileRepository extends BaseRepository<
  ChatProfile,
  ChatProfileCreateInput,
  ChatProfileUpdateInput
> {
  constructor() {
    super('chat_profiles');
  }

  override async findById(id: number): Promise<ChatProfile | null> {
    const result = await db.query<ChatProfileRow>(
      'SELECT * FROM chat_profiles WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findByTrainerId(trainerId: number): Promise<ChatProfile | null> {
    const result = await db.query<ChatProfileRow>(
      'SELECT * FROM chat_profiles WHERE trainer_id = $1',
      [trainerId],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  override async create(input: ChatProfileCreateInput): Promise<ChatProfile> {
    const result = await db.query<ChatProfileRow>(
      `INSERT INTO chat_profiles (trainer_id, nickname, status, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.trainer_id,
        input.nickname,
        input.status ?? null,
        input.bio ?? null,
        input.avatar_url ?? null,
      ],
    );
    return normalize(result.rows[0] as ChatProfileRow);
  }

  override async update(id: number, input: ChatProfileUpdateInput): Promise<ChatProfile> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.nickname !== undefined) {
      values.push(input.nickname);
      updates.push(`nickname = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.bio !== undefined) {
      values.push(input.bio);
      updates.push(`bio = $${values.length}`);
    }
    if (input.avatar_url !== undefined) {
      values.push(input.avatar_url);
      updates.push(`avatar_url = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {throw new Error('Chat profile not found');}
      return existing;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await db.query(
      `UPDATE chat_profiles SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values,
    );

    const updated = await this.findById(id);
    if (!updated) {throw new Error('Chat profile not found after update');}
    return updated;
  }

  async upsert(trainerId: number, nickname: string): Promise<ChatProfile> {
    const result = await db.query<ChatProfileRow>(
      `INSERT INTO chat_profiles (trainer_id, nickname)
       VALUES ($1, $2)
       ON CONFLICT (trainer_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [trainerId, nickname],
    );
    return normalize(result.rows[0] as ChatProfileRow);
  }
}
