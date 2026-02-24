import { redis, redisPub, redisAvailable } from '../utils/redis.js';
import type { StoredMessage } from '../utils/types';
import { ChatStorageService } from './chat-storage.service.js';

const RECENT_CACHE_CAP = 100;
const FLUSH_INTERVAL_MS = 5_000;

/**
 * Redis-backed real-time operations for the chat system.
 * All methods gracefully no-op when Redis is unavailable.
 */
export class ChatRealtimeService {
  private chatStorage: ChatStorageService;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private knownRooms = new Set<number>();

  constructor() {
    this.chatStorage = new ChatStorageService();
  }

  // ---------------------------------------------------------------------------
  // Typing Indicators
  // ---------------------------------------------------------------------------

  async setTyping(roomId: number, trainerId: number, nickname: string): Promise<void> {
    if (!redisAvailable) {return;}
    const key = `chat:typing:${roomId}`;
    await redis.hset(key, String(trainerId), JSON.stringify({ nickname, ts: Date.now() }));
  }

  async clearTyping(roomId: number, trainerId: number): Promise<void> {
    if (!redisAvailable) {return;}
    const key = `chat:typing:${roomId}`;
    await redis.hdel(key, String(trainerId));
  }

  async getTypers(roomId: number): Promise<{ trainer_id: number; nickname: string }[]> {
    if (!redisAvailable) {return [];}
    const key = `chat:typing:${roomId}`;
    const all = await redis.hgetall(key);
    const now = Date.now();
    const result: { trainer_id: number; nickname: string }[] = [];

    for (const [tid, json] of Object.entries(all)) {
      try {
        const data = JSON.parse(json) as { nickname: string; ts: number };
        if (now - data.ts < 5_000) {
          result.push({ trainer_id: Number(tid), nickname: data.nickname });
        } else {
          await redis.hdel(key, tid);
        }
      } catch {
        await redis.hdel(key, tid);
      }
    }

    return result;
  }

  async cleanupStaleTyping(): Promise<void> {
    if (!redisAvailable) {return;}
    for (const roomId of this.knownRooms) {
      await this.getTypers(roomId);
    }
  }

  // ---------------------------------------------------------------------------
  // Presence / Online
  // ---------------------------------------------------------------------------

  async setOnline(userId: string, trainerId: number): Promise<void> {
    if (!redisAvailable) {return;}
    await redis.set(`chat:online:${userId}`, String(trainerId), 'EX', 60);
  }

  async isOnline(userId: string): Promise<boolean> {
    if (!redisAvailable) {return false;}
    const val = await redis.get(`chat:online:${userId}`);
    return val !== null;
  }

  // ---------------------------------------------------------------------------
  // Recent Messages Cache (last N messages per room)
  // ---------------------------------------------------------------------------

  async cacheMessage(roomId: number, message: StoredMessage): Promise<void> {
    if (!redisAvailable) {return;}
    const key = `chat:recent:${roomId}`;
    await redis.lpush(key, JSON.stringify(message));
    await redis.ltrim(key, 0, RECENT_CACHE_CAP - 1);
  }

  async getRecentMessages(roomId: number, count: number): Promise<StoredMessage[]> {
    if (!redisAvailable) {return [];}
    const key = `chat:recent:${roomId}`;
    const raw = await redis.lrange(key, 0, count - 1);
    return raw.map((s) => JSON.parse(s) as StoredMessage).reverse();
  }

  // ---------------------------------------------------------------------------
  // Pending Message Queue (messages waiting to be flushed to S3)
  // ---------------------------------------------------------------------------

  async queuePending(roomId: number, message: StoredMessage): Promise<void> {
    if (!redisAvailable) {
      // No Redis — flush directly to S3
      await this.chatStorage.appendMessages(roomId, [message]);
      return;
    }
    const key = `chat:pending:${roomId}`;
    await redis.lpush(key, JSON.stringify(message));
    this.knownRooms.add(roomId);
  }

  private async flushRoom(roomId: number): Promise<void> {
    if (!redisAvailable) {return;}
    const key = `chat:pending:${roomId}`;
    const messages: StoredMessage[] = [];

    let batch: string[];
    do {
      batch = await redis.lrange(key, -100, -1);
      if (batch.length > 0) {
        for (let i = 0; i < batch.length; i++) {
          await redis.rpop(key);
        }
        messages.push(...batch.map((s) => JSON.parse(s) as StoredMessage));
      }
    } while (batch.length === 100);

    if (messages.length > 0) {
      await this.chatStorage.appendMessages(roomId, messages);
    }
  }

  async flushAll(): Promise<void> {
    if (!redisAvailable) {return;}
    for (const roomId of this.knownRooms) {
      try {
        await this.flushRoom(roomId);
      } catch (err) {
        console.error(`[ChatRealtime] Failed to flush room ${roomId}:`, err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pub/Sub
  // ---------------------------------------------------------------------------

  async publishMessage(roomId: number, message: StoredMessage): Promise<void> {
    if (!redisAvailable) {return;}
    await redisPub.publish(
      'chat:messages',
      JSON.stringify({ room_id: roomId, message }),
    );
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  startFlushWorker(): void {
    if (this.flushTimer) {return;}
    this.flushTimer = setInterval(() => {
      this.flushAll().catch((err) =>
        console.error('[ChatRealtime] Flush worker error:', err),
      );
    }, FLUSH_INTERVAL_MS);
    console.log('[ChatRealtime] Flush worker started');
  }

  stopFlushWorker(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
