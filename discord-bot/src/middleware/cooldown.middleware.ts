import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandMiddleware, MiddlewareNext } from '../types/command.types.js';
import { EmbedColor } from '../constants/colors.js';

// ============================================================================
// Types
// ============================================================================

interface CooldownEntry {
  timestamps: number[];
}

interface CooldownConfig {
  /** Maximum uses allowed within the window. Default: 1. */
  maxUses?: number;
  /** Window duration in seconds. Default: 3. */
  windowSeconds?: number;
  /** Custom message shown when rate-limited. */
  message?: string;
}

// ============================================================================
// Store
// ============================================================================

const store = new Map<string, CooldownEntry>();

// Periodic cleanup every 60 seconds
const PRUNE_INTERVAL = setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < maxAge);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 60_000);

if (PRUNE_INTERVAL.unref) {
  PRUNE_INTERVAL.unref();
}

// ============================================================================
// Middleware factory
// ============================================================================

/**
 * Creates a cooldown middleware for a Discord bot command.
 *
 * Tracks usage per `discordUserId:commandName` key in a sliding time window.
 * When a user exceeds the limit, the bot replies with an ephemeral cooldown
 * message and does **not** call `next()`.
 *
 * @param config - Cooldown configuration.
 *
 * @example
 * // 1 use every 5 seconds (default for most commands)
 * const cmd: Command = {
 *   data: new SlashCommandBuilder().setName('roll')...,
 *   middleware: [requireAuth, cooldown({ windowSeconds: 5 })],
 *   execute: async (interaction) => { ... },
 * };
 *
 * @example
 * // 3 uses per 30 seconds for a gacha endpoint
 * cooldown({ maxUses: 3, windowSeconds: 30, message: 'The roller needs time to recharge!' })
 */
export function cooldown(cfg: CooldownConfig = {}): CommandMiddleware {
  const maxUses = cfg.maxUses ?? 1;
  const windowSeconds = cfg.windowSeconds ?? 3;
  const windowMs = windowSeconds * 1000;
  const customMessage = cfg.message;

  return async (interaction: ChatInputCommandInteraction, next: MiddlewareNext): Promise<void> => {
    const key = `${interaction.user.id}:${interaction.commandName}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= maxUses) {
      const oldestInWindow = entry.timestamps[0] ?? now;
      const retryMs = oldestInWindow + windowMs - now;
      const retrySeconds = Math.ceil(retryMs / 1000);

      await interaction.reply({
        embeds: [{
          color: EmbedColor.WARNING,
          title: 'Slow Down!',
          description:
            customMessage ??
            `Please wait **${retrySeconds}** second${retrySeconds === 1 ? '' : 's'} before using this command again.`,
        }],
        ephemeral: true,
      });
      return;
    }

    entry.timestamps.push(now);
    await next();
  };
}

// ============================================================================
// Presets
// ============================================================================

/**
 * Pre-configured cooldown presets for common command types.
 */
export const cooldowns = {
  /** Default: 1 use per 3 seconds. */
  standard: () => cooldown({ maxUses: 1, windowSeconds: 3 }),

  /** Gacha / rolling: 3 uses per 30 seconds. */
  rolling: () => cooldown({
    maxUses: 3,
    windowSeconds: 30,
    message: 'The roller needs time to recharge! Please wait a moment.',
  }),

  /** Economy / trade: 1 use per 10 seconds. */
  economy: () => cooldown({
    maxUses: 1,
    windowSeconds: 10,
    message: 'Please wait before making another transaction.',
  }),

  /** Battle actions: 1 use per 2 seconds. */
  battle: () => cooldown({ maxUses: 1, windowSeconds: 2 }),

  /** Info / lookup: 2 uses per 5 seconds. */
  info: () => cooldown({ maxUses: 2, windowSeconds: 5 }),
} as const;
