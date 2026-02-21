import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandMiddleware, MiddlewareNext } from '../types/command.types.js';
import type { InteractionContext } from '../types/discord.types.js';
import { EmbedColor } from '../constants/colors.js';
import { getUserByDiscordId } from '../services/account.service.js';

// ============================================================================
// Context storage
// ============================================================================

/**
 * WeakMap that associates a Discord interaction with its resolved site context.
 * We use a WeakMap so entries are automatically garbage-collected when the
 * interaction object is no longer referenced.
 */
const contextStore = new WeakMap<ChatInputCommandInteraction, InteractionContext>();

/**
 * Retrieve the resolved InteractionContext for a command interaction.
 * Returns `undefined` if auth middleware hasn't run or the user is not linked.
 */
export function getContext(interaction: ChatInputCommandInteraction): InteractionContext | undefined {
  return contextStore.get(interaction);
}

/**
 * Retrieve the resolved InteractionContext, throwing if it doesn't exist.
 * Use in command handlers that are guaranteed to run after `requireAuth`.
 */
export function requireContext(interaction: ChatInputCommandInteraction): InteractionContext {
  const ctx = contextStore.get(interaction);
  if (!ctx) {
    throw new Error('InteractionContext not found — was auth middleware applied?');
  }
  return ctx;
}

// ============================================================================
// In-memory user cache
// ============================================================================

interface CachedUser {
  context: InteractionContext;
  expiresAt: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedUser(discordId: string): InteractionContext | undefined {
  const cached = userCache.get(discordId);
  if (!cached) {
    return undefined;
  }
  if (Date.now() > cached.expiresAt) {
    userCache.delete(discordId);
    return undefined;
  }
  return cached.context;
}

function setCachedUser(discordId: string, context: InteractionContext): void {
  userCache.set(discordId, {
    context,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clear the cached user for a given Discord ID.
 * Useful after account linking/unlinking.
 */
export function invalidateUserCache(discordId: string): void {
  userCache.delete(discordId);
}

// ============================================================================
// API lookup
// ============================================================================

async function lookupUser(discordId: string): Promise<InteractionContext | null> {
  return getUserByDiscordId(discordId);
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Authentication middleware — resolves the Discord user to a linked site account.
 *
 * On success, attaches the `InteractionContext` so downstream middleware and
 * command handlers can access it via `getContext(interaction)`.
 *
 * On failure (no linked account, API unreachable), replies with an ephemeral
 * error embed and does **not** call `next()`.
 */
export const requireAuth: CommandMiddleware = async (
  interaction: ChatInputCommandInteraction,
  next: MiddlewareNext,
): Promise<void> => {
  const discordId = interaction.user.id;

  // Check cache first
  const cached = getCachedUser(discordId);
  if (cached) {
    contextStore.set(interaction, cached);
    await next();
    return;
  }

  // Look up user via API
  const context = await lookupUser(discordId);

  if (!context) {
    await interaction.reply({
      embeds: [{
        color: EmbedColor.ERROR,
        title: 'Account Not Linked',
        description:
          'Your Discord account is not linked to a Dusk & Dawn account.\n\n' +
          'Please link your account on the website first, or use the `/link-account` command.',
      }],
      ephemeral: true,
    });
    return;
  }

  // Cache and attach
  setCachedUser(discordId, context);
  contextStore.set(interaction, context);
  await next();
};

/**
 * Optional auth middleware — attempts to resolve the user but continues
 * regardless. If the user is linked, `getContext()` will return their
 * context; otherwise it returns `undefined`.
 */
export const optionalAuth: CommandMiddleware = async (
  interaction: ChatInputCommandInteraction,
  next: MiddlewareNext,
): Promise<void> => {
  const discordId = interaction.user.id;

  const cached = getCachedUser(discordId);
  if (cached) {
    contextStore.set(interaction, cached);
    await next();
    return;
  }

  const context = await lookupUser(discordId);
  if (context) {
    setCachedUser(discordId, context);
    contextStore.set(interaction, context);
  }

  await next();
};
