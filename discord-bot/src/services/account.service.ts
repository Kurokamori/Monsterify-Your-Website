import type { InteractionContext } from '../types/discord.types.js';
import { get, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes
// ============================================================================

interface UserLookupResponse extends BaseResponse {
  user?: {
    id: number;
    username: string;
    display_name: string | null;
    discord_id: string;
    is_admin?: boolean;
  };
}

// ============================================================================
// Service methods
// ============================================================================

/**
 * Look up a site user by their Discord ID.
 *
 * Uses the adventure-discord user lookup endpoint, which is the only
 * unauthenticated endpoint that resolves Discord IDs to user records.
 *
 * Returns `null` if no user is linked to the given Discord ID.
 */
export async function getUserByDiscordId(
  discordId: string,
): Promise<InteractionContext | null> {
  try {
    const res = await get<UserLookupResponse>(
      `/adventures/discord/user/${discordId}`,
    );

    if (!res.success || !res.user) {
      return null;
    }

    return {
      userId: res.user.id,
      username: res.user.username,
      discordId: res.user.discord_id,
      isAdmin: res.user.is_admin ?? false,
    };
  } catch {
    return null;
  }
}
