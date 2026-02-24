import { BaseRepository } from './base.repository';
import { db } from '../database';
import type {
  ChatRoomMemberRow,
  ChatRoomMember,
  ChatRoomMemberCreateInput,
  ChatRoomMemberUpdateInput,
} from '../utils/types';

const normalize = (row: ChatRoomMemberRow): ChatRoomMember => ({
  id: row.id,
  chatRoomId: row.chat_room_id,
  trainerId: row.trainer_id,
  role: row.role,
  joinedAt: row.joined_at,
  lastReadAt: row.last_read_at,
});

export class ChatRoomMemberRepository extends BaseRepository<
  ChatRoomMember,
  ChatRoomMemberCreateInput,
  ChatRoomMemberUpdateInput
> {
  constructor() {
    super('chat_room_members');
  }

  override async findById(id: number): Promise<ChatRoomMember | null> {
    const result = await db.query<ChatRoomMemberRow>(
      'SELECT * FROM chat_room_members WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findByRoomAndTrainer(roomId: number, trainerId: number): Promise<ChatRoomMember | null> {
    const result = await db.query<ChatRoomMemberRow>(
      'SELECT * FROM chat_room_members WHERE chat_room_id = $1 AND trainer_id = $2',
      [roomId, trainerId],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async isMember(roomId: number, trainerId: number): Promise<boolean> {
    const result = await db.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM chat_room_members WHERE chat_room_id = $1 AND trainer_id = $2) AS exists',
      [roomId, trainerId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async getMembers(roomId: number): Promise<ChatRoomMember[]> {
    const result = await db.query<ChatRoomMemberRow>(
      'SELECT * FROM chat_room_members WHERE chat_room_id = $1 ORDER BY joined_at ASC',
      [roomId],
    );
    return result.rows.map(normalize);
  }

  async updateLastRead(roomId: number, trainerId: number): Promise<void> {
    await db.query(
      'UPDATE chat_room_members SET last_read_at = NOW() WHERE chat_room_id = $1 AND trainer_id = $2',
      [roomId, trainerId],
    );
  }

  override async create(input: ChatRoomMemberCreateInput): Promise<ChatRoomMember> {
    const result = await db.query<ChatRoomMemberRow>(
      `INSERT INTO chat_room_members (chat_room_id, trainer_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (chat_room_id, trainer_id) DO NOTHING
       RETURNING *`,
      [input.chat_room_id, input.trainer_id, input.role ?? 'member'],
    );
    const row = result.rows[0];
    if (!row) {
      // Already exists
      const existing = await this.findByRoomAndTrainer(input.chat_room_id, input.trainer_id);
      if (!existing) {throw new Error('Failed to add room member');}
      return existing;
    }
    return normalize(row);
  }

  override async update(id: number, input: ChatRoomMemberUpdateInput): Promise<ChatRoomMember> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.role !== undefined) {
      values.push(input.role);
      updates.push(`role = $${values.length}`);
    }
    if (input.last_read_at !== undefined) {
      values.push(input.last_read_at);
      updates.push(`last_read_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {throw new Error('Member not found');}
      return existing;
    }

    values.push(id);
    await db.query(
      `UPDATE chat_room_members SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values,
    );

    const updated = await this.findById(id);
    if (!updated) {throw new Error('Member not found after update');}
    return updated;
  }

  async removeFromRoom(roomId: number, trainerId: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM chat_room_members WHERE chat_room_id = $1 AND trainer_id = $2',
      [roomId, trainerId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
