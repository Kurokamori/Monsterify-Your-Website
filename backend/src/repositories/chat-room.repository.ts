import { BaseRepository } from './base.repository';
import { db } from '../database';
import type {
  ChatRoomRow,
  ChatRoom,
  ChatRoomWithUnread,
  ChatRoomMemberInfo,
  ChatRoomCreateInput,
  ChatRoomUpdateInput,
  ChatMemberRole,
} from '../utils/types';

const normalize = (row: ChatRoomRow): ChatRoom => ({
  id: row.id,
  name: row.name,
  iconUrl: row.icon_url ?? null,
  type: row.type,
  createdByTrainerId: row.created_by_trainer_id,
  factionName: row.faction_name ?? null,
  lastMessageAt: row.last_message_at,
  lastMessagePreview: row.last_message_preview,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class ChatRoomRepository extends BaseRepository<
  ChatRoom,
  ChatRoomCreateInput,
  ChatRoomUpdateInput
> {
  constructor() {
    super('chat_rooms');
  }

  override async findById(id: number): Promise<ChatRoom | null> {
    const result = await db.query<ChatRoomRow>(
      'SELECT * FROM chat_rooms WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  /**
   * Get all rooms a trainer belongs to, with unread counts and member info.
   */
  async findByTrainerId(trainerId: number): Promise<ChatRoomWithUnread[]> {
    // Step 1: Get all rooms the trainer is in
    const roomsResult = await db.query<ChatRoomRow & { last_read_at: Date | null }>(
      `SELECT cr.*, crm.last_read_at
       FROM chat_rooms cr
       JOIN chat_room_members crm ON cr.id = crm.chat_room_id
       WHERE crm.trainer_id = $1
       ORDER BY cr.last_message_at DESC NULLS LAST, cr.created_at DESC`,
      [trainerId],
    );

    if (roomsResult.rows.length === 0) {return [];}

    const roomIds = roomsResult.rows.map((r) => r.id);

    // Step 2: Get all members for those rooms
    const membersResult = await db.query<{
      chat_room_id: number;
      trainer_id: number;
      role: ChatMemberRole;
      nickname: string;
      avatar_url: string | null;
    }>(
      `SELECT crm.chat_room_id, crm.trainer_id, crm.role,
              COALESCE(cp.nickname, t.name) AS nickname,
              cp.avatar_url
       FROM chat_room_members crm
       JOIN trainers t ON t.id = crm.trainer_id
       LEFT JOIN chat_profiles cp ON cp.trainer_id = crm.trainer_id
       WHERE crm.chat_room_id = ANY($1)`,
      [roomIds],
    );

    const membersByRoom = new Map<number, ChatRoomMemberInfo[]>();
    for (const m of membersResult.rows) {
      const list = membersByRoom.get(m.chat_room_id) ?? [];
      list.push({
        trainerId: m.trainer_id,
        nickname: m.nickname,
        avatarUrl: m.avatar_url,
        role: m.role,
      });
      membersByRoom.set(m.chat_room_id, list);
    }

    return roomsResult.rows.map((row) => {
      // Unread = messages since last_read_at. We approximate with 0 for now
      // since actual message counts are in S3, not Postgres.
      // The frontend will use last_read_at vs last_message_at for the badge.
      const unreadCount =
        row.last_read_at && row.last_message_at && row.last_message_at > row.last_read_at
          ? 1 // At least one unread
          : 0;

      return {
        ...normalize(row),
        unreadCount,
        members: membersByRoom.get(row.id) ?? [],
      };
    });
  }

  /**
   * Find an existing DM room between two trainers.
   */
  async findDmBetween(trainerIdA: number, trainerIdB: number): Promise<ChatRoom | null> {
    const result = await db.query<ChatRoomRow>(
      `SELECT cr.* FROM chat_rooms cr
       WHERE cr.type = 'dm'
         AND (SELECT COUNT(*) FROM chat_room_members crm
              WHERE crm.chat_room_id = cr.id
                AND crm.trainer_id IN ($1, $2)) = 2
         AND (SELECT COUNT(*) FROM chat_room_members crm
              WHERE crm.chat_room_id = cr.id) = 2
       LIMIT 1`,
      [trainerIdA, trainerIdB],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  override async create(input: ChatRoomCreateInput): Promise<ChatRoom> {
    const result = await db.query<ChatRoomRow>(
      `INSERT INTO chat_rooms (name, type, created_by_trainer_id, faction_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.name ?? null, input.type, input.created_by_trainer_id ?? null, input.faction_name ?? null],
    );
    return normalize(result.rows[0] as ChatRoomRow);
  }

  /**
   * Find a faction chat room by its canonical faction name.
   */
  async findByFactionName(factionName: string): Promise<ChatRoom | null> {
    const result = await db.query<ChatRoomRow>(
      `SELECT * FROM chat_rooms WHERE faction_name = $1 AND type = 'faction' LIMIT 1`,
      [factionName],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  override async update(id: number, input: ChatRoomUpdateInput): Promise<ChatRoom> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.icon_url !== undefined) {
      values.push(input.icon_url);
      updates.push(`icon_url = $${values.length}`);
    }
    if (input.last_message_at !== undefined) {
      values.push(input.last_message_at);
      updates.push(`last_message_at = $${values.length}`);
    }
    if (input.last_message_preview !== undefined) {
      values.push(input.last_message_preview);
      updates.push(`last_message_preview = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {throw new Error('Chat room not found');}
      return existing;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await db.query(
      `UPDATE chat_rooms SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values,
    );

    const updated = await this.findById(id);
    if (!updated) {throw new Error('Chat room not found after update');}
    return updated;
  }

  async findAll(): Promise<ChatRoom[]> {
    const result = await db.query<ChatRoomRow>(
      'SELECT * FROM chat_rooms ORDER BY last_message_at DESC NULLS LAST, created_at DESC',
    );
    return result.rows.map(normalize);
  }
}
