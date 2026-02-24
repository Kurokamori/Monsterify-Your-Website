import Redis from 'ioredis';

/** Whether Redis connected successfully. Check before calling redis commands. */
export let redisAvailable = false;

function createRedisClient(name: string): Redis {
  const url = process.env.REDIS_TLS_URL ?? process.env.REDIS_URL;

  if (!url) {
    // No URL configured — create a dummy client that never connects.
    // lazyConnect + retryStrategy returning null = no connection attempts.
    const dummy = new Redis({
      lazyConnect: true,
      retryStrategy: () => null,
      maxRetriesPerRequest: null,
    });
    dummy.on('error', () => {}); // swallow all errors
    return dummy;
  }

  const client = new Redis(url, {
    tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`[Redis:${name}] Giving up after ${times} retries`);
        return null; // stop retrying
      }
      return Math.min(times * 500, 2000);
    },
  });

  client.on('connect', () => console.log(`[Redis:${name}] Connected`));
  client.on('error', (err) => console.error(`[Redis:${name}] Error:`, err.message));

  return client;
}

/** Main Redis client for commands (GET, SET, LPUSH, etc.) */
export const redis = createRedisClient('main');

/** Dedicated subscriber client for Pub/Sub (cannot be reused for commands) */
export const redisSub = createRedisClient('sub');

/** Dedicated publisher client for Pub/Sub */
export const redisPub = createRedisClient('pub');

/**
 * Connect all Redis clients. Call once at startup.
 * Sets `redisAvailable` flag on success. Silently degrades on failure.
 */
export async function connectRedis(): Promise<void> {
  const url = process.env.REDIS_TLS_URL ?? process.env.REDIS_URL;
  if (!url) {
    console.warn('[Redis] No REDIS_URL configured — chat will run without caching');
    return;
  }

  try {
    await Promise.all([redis.connect(), redisSub.connect(), redisPub.connect()]);
    redisAvailable = true;
    console.log('[Redis] All clients connected');
  } catch (err) {
    console.error('[Redis] Failed to connect:', (err as Error).message);
    console.warn('[Redis] Chat will run without caching');
  }
}
