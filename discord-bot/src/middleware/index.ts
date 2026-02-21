import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandMiddleware, MiddlewareNext } from '../types/command.types.js';

// ============================================================================
// Re-exports
// ============================================================================

// Auth
export {
  requireAuth,
  optionalAuth,
  getContext,
  requireContext,
  invalidateUserCache,
} from './auth.middleware.js';

// Cooldowns
export { cooldown, cooldowns } from './cooldown.middleware.js';

// Permissions
export {
  requireAdmin,
  requireDiscordPermission,
  requireGuild,
} from './permissions.middleware.js';

// Error handling & error classes
export {
  errorHandler,
  BotError,
  AccountNotLinkedError,
  NotFoundError,
  PermissionError,
  ValidationError,
  ApiError,
} from './error.middleware.js';

// ============================================================================
// Pipeline runner
// ============================================================================

/**
 * Execute a middleware pipeline followed by the command handler.
 *
 * Middleware are composed right-to-left: the first middleware in the array
 * runs first and is the outermost wrapper. Each middleware calls `next()`
 * to invoke the next middleware or, finally, the command handler.
 *
 * @param interaction - The incoming slash command interaction.
 * @param middlewares - Ordered array of middleware to run.
 * @param handler    - The final command handler.
 *
 * @example
 * ```ts
 * // In interaction-create.ts:
 * await runMiddleware(interaction, command.middleware ?? [], () => command.execute(interaction));
 * ```
 */
export async function runMiddleware(
  interaction: ChatInputCommandInteraction,
  middlewares: CommandMiddleware[],
  handler: () => Promise<void>,
): Promise<void> {
  // Build the chain from right to left
  let current: MiddlewareNext = handler;

  for (let i = middlewares.length - 1; i >= 0; i--) {
    const mw = middlewares[i];
    if (!mw) {
      continue;
    }
    const next = current;
    current = () => mw(interaction, next);
  }

  await current();
}
