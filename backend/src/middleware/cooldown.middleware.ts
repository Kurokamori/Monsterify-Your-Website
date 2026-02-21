import { Request, Response, NextFunction } from 'express';

/**
 * Configuration for a rate limit window.
 */
interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Window duration in seconds. */
  windowSeconds: number;
  /** Optional message returned when rate limited. */
  message?: string;
}

/**
 * Tracks request timestamps for a single key.
 */
interface RateLimitEntry {
  timestamps: number[];
}

/**
 * In-memory rate limiter store.
 *
 * Tracks request counts per key within sliding time windows.
 * Periodically prunes expired entries to prevent memory leaks.
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private pruneInterval: ReturnType<typeof setInterval>;

  constructor(pruneIntervalMs = 60_000) {
    // Periodically clean up expired entries
    this.pruneInterval = setInterval(() => {
      this.prune();
    }, pruneIntervalMs);

    // Allow the process to exit without waiting for the interval
    if (this.pruneInterval.unref) {
      this.pruneInterval.unref();
    }
  }

  /**
   * Record a request and check if the key has exceeded the limit.
   * Returns the number of remaining requests, or -1 if the limit is exceeded.
   */
  hit(key: string, maxRequests: number, windowSeconds: number): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= maxRequests) {
      // Find when the oldest request in the window expires
      const oldestInWindow = entry.timestamps[0] ?? now;
      const resetMs = oldestInWindow + windowMs - now;

      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(resetMs, 0),
      };
    }

    entry.timestamps.push(now);

    return {
      allowed: true,
      remaining: maxRequests - entry.timestamps.length,
      resetMs: windowMs,
    };
  }

  /**
   * Remove all entries that have no timestamps within any reasonable window.
   */
  private prune(): void {
    const now = Date.now();
    // Prune entries older than 10 minutes (conservative)
    const maxAge = 10 * 60 * 1000;

    for (const [key, entry] of this.store) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < maxAge);
      if (entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries. Useful for testing.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Stop the prune interval. Call when shutting down.
   */
  destroy(): void {
    clearInterval(this.pruneInterval);
    this.store.clear();
  }
}

/** Singleton store shared across all cooldown middleware instances. */
const globalStore = new RateLimitStore();

/**
 * Resolve the rate limit key from the request.
 * Uses the authenticated user's ID if available, otherwise falls back to IP.
 */
function resolveKey(req: Request, prefix: string): string {
  const userId = req.user?.id;
  if (userId) {
    return `${prefix}:user:${userId}`;
  }

  // Fall back to IP address
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  return `${prefix}:ip:${ip}`;
}

/**
 * Create a rate limiting middleware.
 *
 * @param config - Rate limit configuration
 * @param keyPrefix - Optional prefix to namespace rate limit keys.
 *   Use different prefixes for different route groups to have independent limits.
 *
 * @example
 * // 10 requests per minute for general API
 * router.use(cooldown({ maxRequests: 10, windowSeconds: 60 }));
 *
 * @example
 * // 3 requests per 30 seconds for a specific expensive endpoint
 * router.post('/roll', cooldown({ maxRequests: 3, windowSeconds: 30 }, 'monster-roll'), handler);
 */
export function cooldown(config: RateLimitConfig, keyPrefix = 'global'): (req: Request, res: Response, next: NextFunction) => void {
  const { maxRequests, windowSeconds, message } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = resolveKey(req, keyPrefix);
    const result = globalStore.hit(key, maxRequests, windowSeconds);

    // Always set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(result.remaining, 0));
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetMs / 1000));

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.resetMs / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: message ?? 'Too many requests. Please try again later.',
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

/**
 * Pre-configured rate limits for common use cases.
 */
export const rateLimits = {
  /** Standard API: 60 requests per minute. */
  standard: (prefix = 'api') => cooldown({ maxRequests: 60, windowSeconds: 60 }, prefix),

  /** Strict: 10 requests per minute. For sensitive operations. */
  strict: (prefix = 'strict') => cooldown({ maxRequests: 10, windowSeconds: 60 }, prefix),

  /** Auth: 5 login attempts per 15 minutes. */
  auth: () => cooldown({ maxRequests: 5, windowSeconds: 900, message: 'Too many login attempts. Please try again later.' }, 'auth'),

  /** Rolling: 3 requests per 30 seconds. For gacha/roller endpoints. */
  rolling: (prefix = 'roll') => cooldown({ maxRequests: 3, windowSeconds: 30, message: 'Please wait before rolling again.' }, prefix),

  /** Bot commands: 20 requests per minute. For Discord bot API calls. */
  bot: (prefix = 'bot') => cooldown({ maxRequests: 20, windowSeconds: 60 }, prefix),
} as const;

export { globalStore as _rateLimitStore };
