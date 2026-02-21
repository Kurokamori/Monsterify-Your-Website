import type { ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';
import type { CommandMiddleware, MiddlewareNext } from '../types/command.types.js';
import { getContext } from './auth.middleware.js';
import { EmbedColor } from '../constants/colors.js';

// ============================================================================
// Site admin check
// ============================================================================

/**
 * Requires the user to be a site admin (from the linked account).
 *
 * Must be placed **after** `requireAuth` in the middleware chain so that
 * `getContext()` returns a valid `InteractionContext`.
 */
export const requireAdmin: CommandMiddleware = async (
  interaction: ChatInputCommandInteraction,
  next: MiddlewareNext,
): Promise<void> => {
  const ctx = getContext(interaction);

  if (!ctx) {
    await interaction.reply({
      embeds: [{
        color: EmbedColor.ERROR,
        description: 'You must be logged in to use this command.',
      }],
      ephemeral: true,
    });
    return;
  }

  if (!ctx.isAdmin) {
    await interaction.reply({
      embeds: [{
        color: EmbedColor.ERROR,
        title: 'Permission Denied',
        description: 'This command requires **admin** privileges.',
      }],
      ephemeral: true,
    });
    return;
  }

  await next();
};

// ============================================================================
// Discord permission check
// ============================================================================

/**
 * Creates a middleware that checks for specific Discord server permissions
 * on the invoking guild member.
 *
 * @param permissions - One or more Discord permissions to require.
 *
 * @example
 * // Require ManageMessages permission
 * requireDiscordPermission(PermissionFlagsBits.ManageMessages)
 */
export function requireDiscordPermission(
  ...permissions: PermissionResolvable[]
): CommandMiddleware {
  return async (
    interaction: ChatInputCommandInteraction,
    next: MiddlewareNext,
  ): Promise<void> => {
    const member = interaction.member;

    if (!member || !('permissions' in member)) {
      await interaction.reply({
        embeds: [{
          color: EmbedColor.ERROR,
          description: 'This command can only be used in a server.',
        }],
        ephemeral: true,
      });
      return;
    }

    const memberPerms = member.permissions;
    if (typeof memberPerms === 'string') {
      // Shouldn't happen with gateway interactions, but guard against it
      await interaction.reply({
        embeds: [{
          color: EmbedColor.ERROR,
          description: 'Could not verify your permissions.',
        }],
        ephemeral: true,
      });
      return;
    }

    const missing = permissions.filter((perm) => !memberPerms.has(perm));
    if (missing.length > 0) {
      await interaction.reply({
        embeds: [{
          color: EmbedColor.ERROR,
          title: 'Missing Permissions',
          description: 'You do not have the required Discord permissions to use this command.',
        }],
        ephemeral: true,
      });
      return;
    }

    await next();
  };
}

// ============================================================================
// Guild-only check
// ============================================================================

/**
 * Restricts a command to guild (server) contexts only.
 * DM usage will be rejected with an ephemeral message.
 */
export const requireGuild: CommandMiddleware = async (
  interaction: ChatInputCommandInteraction,
  next: MiddlewareNext,
): Promise<void> => {
  if (!interaction.guild) {
    await interaction.reply({
      embeds: [{
        color: EmbedColor.ERROR,
        description: 'This command can only be used in a server.',
      }],
      ephemeral: true,
    });
    return;
  }

  await next();
};
