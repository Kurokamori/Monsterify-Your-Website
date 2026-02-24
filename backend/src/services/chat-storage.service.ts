import { getObject, putObject } from '../utils/s3.js';
import type { StoredMessage, CompactMessage, RoomIndex } from '../utils/types';

/**
 * Handles reading/writing chat messages to S3 (Bucketeer).
 *
 * Storage optimizations for the 5 GB Bucketeer limit:
 *   1. Messages are stored in compact format (short keys, nulls omitted)
 *   2. All objects are gzip-compressed at level 9 (handled by s3.ts)
 *   3. room_id is implicit in the key path, not stored per message
 *
 * Key structure:
 *   chats/{room_id}/{year}/{month}/{day}.json   – gzipped CompactMessage[]
 *   chats/{room_id}/index.json                  – gzipped RoomIndex
 */
export class ChatStorageService {
  private keyForDay(roomId: number, dateStr: string): string {
    return `chats/${roomId}/${dateStr}.json`;
  }

  private indexKey(roomId: number): string {
    return `chats/${roomId}/index.json`;
  }

  /** Parse a Date or ISO string into 'YYYY/MM/DD'. */
  private toDayPath(d: Date | string): string {
    const dt = typeof d === 'string' ? new Date(d) : d;
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  // ---------------------------------------------------------------------------
  // Compact format conversion
  // ---------------------------------------------------------------------------

  /** Convert a full StoredMessage to compact S3 format. */
  private toCompact(msg: StoredMessage): CompactMessage {
    const compact: CompactMessage = {
      i: msg.id,
      s: msg.sender_trainer_id,
      n: msg.sender_nickname,
      t: msg.timestamp,
    };
    if (msg.sender_avatar_url) {compact.a = msg.sender_avatar_url;}
    if (msg.content) {compact.c = msg.content;}
    if (msg.image_url) {compact.m = msg.image_url;}
    if (msg.reply_to) {
      compact.r = {
        i: msg.reply_to.message_id,
        n: msg.reply_to.sender_nickname,
        p: msg.reply_to.content_preview,
      };
    }
    if (msg.edited_at) {compact.e = msg.edited_at;}
    if (msg.deleted) {compact.d = true;}
    return compact;
  }

  /** Convert a compact message back to full StoredMessage. */
  private fromCompact(c: CompactMessage, roomId: number): StoredMessage {
    return {
      id: c.i,
      room_id: roomId,
      sender_trainer_id: c.s,
      sender_nickname: c.n,
      sender_avatar_url: c.a ?? null,
      content: c.c ?? null,
      image_url: c.m ?? null,
      reply_to: c.r
        ? { message_id: c.r.i, sender_nickname: c.r.n, content_preview: c.r.p }
        : null,
      timestamp: c.t,
      edited_at: c.e ?? null,
      deleted: c.d ?? false,
    };
  }

  /**
   * Detect whether raw data is compact or legacy full format.
   * Legacy data has 'id' field; compact has 'i' field.
   */
  private parseBucket(raw: unknown[], roomId: number): StoredMessage[] {
    if (raw.length === 0) {return [];}
    const first = raw[0] as Record<string, unknown>;
    if ('i' in first) {
      // Compact format
      return (raw as CompactMessage[]).map((c) => this.fromCompact(c, roomId));
    }
    // Legacy full format (StoredMessage[])
    return raw as StoredMessage[];
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async getDayBucket(roomId: number, dayPath: string): Promise<StoredMessage[]> {
    const data = await getObject<unknown[]>(this.keyForDay(roomId, dayPath));
    if (!data) {return [];}
    return this.parseBucket(data, roomId);
  }

  async getRoomIndex(roomId: number): Promise<RoomIndex | null> {
    return getObject<RoomIndex>(this.indexKey(roomId));
  }

  /**
   * Fetch messages older than the given timestamp (for pagination).
   * Walks backward through day buckets.
   */
  async getMessagesBeforeTimestamp(
    roomId: number,
    beforeTimestamp: string,
    limit: number,
  ): Promise<StoredMessage[]> {
    const index = await this.getRoomIndex(roomId);
    if (!index || index.days.length === 0) {return [];}

    const target = new Date(beforeTimestamp).getTime();
    const messages: StoredMessage[] = [];

    for (const day of index.days) {
      const bucket = await this.getDayBucket(roomId, day);
      const older = bucket.filter((m) => new Date(m.timestamp).getTime() < target);
      messages.unshift(...older);
      if (messages.length >= limit) {break;}
    }

    // Sort newest-first, then take the most recent `limit`
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return messages.slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /**
   * Append messages to their respective day buckets in compact format.
   * Also updates the room index.
   */
  async appendMessages(roomId: number, messages: StoredMessage[]): Promise<void> {
    if (messages.length === 0) {return;}

    // Group messages by day
    const byDay = new Map<string, StoredMessage[]>();
    for (const msg of messages) {
      const day = this.toDayPath(msg.timestamp);
      const list = byDay.get(day) ?? [];
      list.push(msg);
      byDay.set(day, list);
    }

    // Write each day bucket in compact format (read-modify-write)
    for (const [day, dayMessages] of byDay.entries()) {
      const existing = await this.getDayBucket(roomId, day);
      const merged = [...existing, ...dayMessages];
      merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      // Store in compact format
      const compact = merged.map((m) => this.toCompact(m));
      await putObject(this.keyForDay(roomId, day), compact);
    }

    // Update room index
    await this.updateRoomIndex(roomId, [...byDay.keys()], messages.length);
  }

  async updateRoomIndex(
    roomId: number,
    newDays: string[],
    addedCount: number,
  ): Promise<void> {
    const existing = await this.getRoomIndex(roomId);
    const index: RoomIndex = existing ?? {
      room_id: roomId,
      days: [],
      total_messages: 0,
      last_updated: new Date().toISOString(),
    };

    const daySet = new Set(index.days);
    for (const d of newDays) {daySet.add(d);}
    index.days = [...daySet].sort((a, b) => b.localeCompare(a));
    index.total_messages += addedCount;
    index.last_updated = new Date().toISOString();

    await putObject(this.indexKey(roomId), index);
  }
}
