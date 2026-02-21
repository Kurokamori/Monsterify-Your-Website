/**
 * Town service — placeholder for town location sub-services.
 *
 * Each town location (adoption center, nursery, garden, farm, game corner,
 * antique shop, bazar, etc.) will be added here as individual groups of
 * methods once the corresponding commands are built.
 */

import { get, post, withAuth, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes
// ============================================================================

interface LocationActivityResponse extends BaseResponse {
  data: unknown;
}

// ============================================================================
// Bazar (forfeit & adopt)
// ============================================================================

/** Get monsters available for adoption in the bazar. */
export async function getBazarMonsters(
  discordId: string,
): Promise<unknown> {
  const res = await get<LocationActivityResponse>(
    '/town/bazar/monsters',
    withAuth(discordId),
  );
  return res.data;
}

/** Get items available for collection in the bazar. */
export async function getBazarItems(
  discordId: string,
): Promise<unknown> {
  const res = await get<LocationActivityResponse>(
    '/town/bazar/items',
    withAuth(discordId),
  );
  return res.data;
}

/** Forfeit a monster to the bazar. */
export async function forfeitMonster(
  monsterId: number,
  trainerId: number,
  discordId: string,
): Promise<unknown> {
  const res = await post<LocationActivityResponse>(
    '/town/bazar/forfeit/monster',
    { monsterId, trainerId },
    withAuth(discordId),
  );
  return res.data;
}

/** Adopt a monster from the bazar. */
export async function adoptMonster(
  bazarMonsterId: number,
  trainerId: number,
  newName: string,
  discordId: string,
): Promise<unknown> {
  const res = await post<LocationActivityResponse>(
    '/town/bazar/adopt/monster',
    { bazarMonsterId, trainerId, newName },
    withAuth(discordId),
  );
  return res.data;
}

// ============================================================================
// Game Corner
// ============================================================================

/** Get game corner activities. */
export async function getGameCornerActivities(
  discordId: string,
): Promise<unknown> {
  const res = await get<LocationActivityResponse>(
    '/town/game-corner',
    withAuth(discordId),
  );
  return res.data;
}

// ============================================================================
// Location Activities (generic prompt-based system)
// ============================================================================

/** Start a location activity session. */
export async function startActivity(
  location: string,
  activity: string,
  trainerId: number,
  discordId: string,
): Promise<unknown> {
  const res = await post<LocationActivityResponse>(
    '/town/activities/start',
    { location, activity, trainerId },
    withAuth(discordId),
  );
  return res.data;
}

/** Complete a location activity session. */
export async function completeActivity(
  sessionId: string,
  response: string,
  discordId: string,
): Promise<unknown> {
  const res = await post<LocationActivityResponse>(
    '/town/activities/complete',
    { sessionId, response },
    withAuth(discordId),
  );
  return res.data;
}

/** Claim rewards from a completed activity. */
export async function claimActivityReward(
  rewardId: string,
  trainerId: number,
  discordId: string,
): Promise<unknown> {
  const res = await post<LocationActivityResponse>(
    '/town/activities/claim',
    { rewardId, trainerId },
    withAuth(discordId),
  );
  return res.data;
}
