/**
 * Battle service — manages all battle-related operations via the backend API.
 *
 * Covers: initiating battles (PvE & PvP), executing attacks, using items,
 * releasing/withdrawing monsters, weather/terrain, flee/forfeit,
 * force win/lose, win conditions, battle resolution, and status queries.
 *
 * Adventure lifecycle methods (encounters, captures, rewards) live in
 * {@link ./adventure.service.ts}.
 */

import type {
  InitiateBattleRequest,
  AttackRequest,
  UseItemRequest,
  ReleaseWithdrawRequest,
  SetWeatherRequest,
  SetTerrainRequest,
  FleeOrForfeitRequest,
  ForceResultRequest,
  WinConditionRequest,
  PvpBattleRequest,
} from '../types/api.types.js';
import { get, post, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes
// ============================================================================

interface BattleResponse extends BaseResponse {
  battle?: unknown;
  data?: unknown;
}

interface BattleStatusResponse extends BaseResponse {
  battle?: unknown;
  data?: unknown;
  participants?: unknown[];
  log?: unknown[];
}

// ============================================================================
// Public types
// ============================================================================

export interface BattleResult {
  success: boolean;
  battle?: unknown;
  data?: unknown;
  message?: string;
}

export interface BattleStatus {
  success: boolean;
  battle?: unknown;
  participants?: unknown[];
  log?: unknown[];
  message?: string;
}

// ============================================================================
// Initiate battles
// ============================================================================

/**
 * Initiate or join a PvE battle in an adventure.
 *
 * The trainer joins the existing battle if one is active, or starts a new one.
 */
export async function initiateBattle(
  data: InitiateBattleRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/initiate',
    data,
  );
  return {
    success: res.success,
    battle: res.battle ?? res.data,
    message: res.message,
  };
}

/**
 * Initiate a PvP battle between trainers in an adventure.
 *
 * The old JS code sent this with two slightly different signatures
 * (opponentTrainers vs opponentIds); the backend accepts both.
 */
export async function initiatePvPBattle(
  data: PvpBattleRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/pvp',
    data,
  );
  return {
    success: res.success,
    battle: res.battle ?? res.data,
    message: res.message,
  };
}

// ============================================================================
// Battle actions
// ============================================================================

/**
 * Execute an attack in the current battle.
 *
 * @param data.moveName     - Name of the move to use.
 * @param data.targetName   - Target monster name or index.
 * @param data.message      - The player's battle RP message.
 * @param data.attackerName - (Optional) specific attacking monster name.
 */
export async function executeAttack(
  data: AttackRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/attack',
    data,
  );
  return {
    success: res.success,
    battle: res.battle,
    data: res.data,
    message: res.message,
  };
}

/**
 * Use an item during battle.
 *
 * @param data.itemName   - Name of the item to use.
 * @param data.targetName - Target monster name or index.
 * @param data.message    - The player's RP message.
 */
export async function useItem(
  data: UseItemRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/use-item',
    data,
  );
  return {
    success: res.success,
    battle: res.battle,
    data: res.data,
    message: res.message,
  };
}

// ============================================================================
// Monster management (release / withdraw)
// ============================================================================

/**
 * Release (send out) a monster to the battlefield.
 *
 * The old JS code passed either `monsterName` or `monsterIndex` depending
 * on the call site. The backend accepts both via the same endpoint.
 */
export async function releaseMonster(
  data: ReleaseWithdrawRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/release',
    data,
  );
  return {
    success: res.success,
    battle: res.battle,
    data: res.data,
    message: res.message,
  };
}

/**
 * Withdraw (recall) a monster from the battlefield.
 */
export async function withdrawMonster(
  data: ReleaseWithdrawRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/withdraw',
    data,
  );
  return {
    success: res.success,
    battle: res.battle,
    data: res.data,
    message: res.message,
  };
}

// ============================================================================
// Environment (weather / terrain)
// ============================================================================

/** Set the battle weather condition. */
export async function setBattleWeather(
  data: SetWeatherRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/weather',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

/** Set the battle terrain. */
export async function setBattleTerrain(
  data: SetTerrainRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/terrain',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

// ============================================================================
// Battle flow control
// ============================================================================

/** Attempt to flee from the current battle. */
export async function fleeBattle(
  data: FleeOrForfeitRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/flee',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

/** Forfeit the current battle. */
export async function forfeitBattle(
  data: FleeOrForfeitRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/forfeit',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

/** Force-win the current battle (admin/narrative). */
export async function forceWinBattle(
  data: ForceResultRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/forcewin',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

/** Force-lose the current battle (admin/narrative). */
export async function forceLoseBattle(
  data: ForceResultRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/forcelose',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

/**
 * Set the win condition for the battle (number of KOs needed to win).
 */
export async function setWinCondition(
  data: WinConditionRequest,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/win-condition',
    data,
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

/**
 * Resolve a battle encounter.
 *
 * Accepts either an encounterId or adventureId. When adventureId is provided,
 * the backend resolves the active battle encounter automatically.
 *
 * @param id            - The encounter ID or adventure ID.
 * @param discordUserId - The user requesting resolution.
 */
export async function resolveBattle(
  id: number,
  discordUserId: string,
): Promise<BattleResult> {
  const res = await post<BattleResponse>(
    '/adventures/discord/battle/resolve',
    { adventureId: id, discordUserId },
  );
  return {
    success: res.success,
    data: res.data,
    message: res.message,
  };
}

// ============================================================================
// Status
// ============================================================================

/** Get the current battle status for an adventure. */
export async function getBattleStatus(
  adventureId: number,
): Promise<BattleStatus> {
  const res = await get<BattleStatusResponse>(
    `/adventures/discord/battle/status/${adventureId}`,
  );
  return {
    success: res.success,
    battle: res.battle ?? res.data,
    participants: res.participants,
    log: res.log,
    message: res.message,
  };
}
