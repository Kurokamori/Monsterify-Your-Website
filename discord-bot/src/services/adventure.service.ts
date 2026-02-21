/**
 * Adventure service — manages adventure lifecycle via the backend API.
 *
 * Covers: thread registration, message/word tracking, encounter generation,
 * monster capture, adventure completion, and reward claiming.
 *
 * Battle-specific operations (attack, release, withdraw, etc.) live in
 * {@link ./battle.service.ts}.
 */

import type {
  CreateThreadRequest,
  TrackMessageRequest,
  GenerateEncounterRequest,
  CaptureRequest,
  EndAdventureRequest,
} from '../types/api.types.js';
import { get, post, withAuth, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes
// ============================================================================

interface AdventureResponse extends BaseResponse {
  adventure?: RawAdventure;
  data?: RawAdventure;
}

interface AdventuresResponse extends BaseResponse {
  data?: RawAdventure[];
  adventures?: RawAdventure[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

interface ThreadResponse extends BaseResponse {
  data?: unknown;
}

interface ParticipantResponse extends BaseResponse {
  participant?: unknown;
  data?: unknown;
}

interface EncounterResponse extends BaseResponse {
  encounter: RawEncounter;
}

interface CaptureResponse extends BaseResponse {
  captured?: boolean;
  captureResult?: {
    success?: boolean;
    monster?: unknown;
    trainer?: unknown;
    pokeball_used?: string;
    pokepuffs_used?: number;
    capture_chance?: number;
  };
  monster?: unknown;
  data?: unknown;
}

interface EndAdventureResponse extends BaseResponse {
  data?: {
    rewards?: unknown[];
    participants?: unknown[];
    [key: string]: unknown;
  };
}

interface UnclaimedRewardsResponse extends BaseResponse {
  data?: unknown[];
  rewards?: unknown[];
}

interface RegionsResponse extends BaseResponse {
  data?: unknown[];
  regions?: unknown[];
}

// ============================================================================
// Raw backend types
// ============================================================================

interface RawAdventure {
  id: number;
  title: string;
  description: string | null;
  status: string;
  adventure_type: string;
  region: string | null;
  area_id: string | null;
  area_config?: string | Record<string, unknown> | null;
  landmass: string | null;
  thread_emoji: string | null;
  discord_thread_id: string | null;
  discord_channel_id: string | null;
  max_participants: number | null;
  creator_id: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface RawEncounter {
  id: number;
  adventure_id: number;
  encounter_type: string;
  encounter_data: string | Record<string, unknown> | null;
  created_at?: string;
  [key: string]: unknown;
}

// ============================================================================
// Public types
// ============================================================================

export interface Adventure {
  id: number;
  title: string;
  description: string | null;
  status: string;
  adventureType: string;
  region: string | null;
  areaId: string | null;
  areaConfig: Record<string, unknown> | null;
  landmass: string | null;
  threadEmoji: string | null;
  discordThreadId: string | null;
  discordChannelId: string | null;
  maxParticipants: number | null;
  creatorId: number | null;
}

export interface Encounter {
  id: number;
  adventureId: number;
  encounterType: string;
  encounterData: Record<string, unknown>;
}

export interface CapturedMonsterData {
  id?: number;
  species_name?: string;
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level?: number;
  nickname?: string;
  [key: string]: unknown;
}

export interface CaptureResult {
  success: boolean;
  captured: boolean;
  monster?: CapturedMonsterData | null;
  message?: string;
}

export interface EndAdventureResult {
  success: boolean;
  rewards?: unknown[];
  participants?: unknown[];
  message?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function parseJsonField(raw: string | Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!raw) { return null; }
  if (typeof raw === 'object') { return raw; }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapAdventure(raw: RawAdventure): Adventure {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    adventureType: raw.adventure_type,
    region: raw.region,
    areaId: raw.area_id,
    areaConfig: parseJsonField(raw.area_config),
    landmass: raw.landmass,
    threadEmoji: raw.thread_emoji,
    discordThreadId: raw.discord_thread_id,
    discordChannelId: raw.discord_channel_id,
    maxParticipants: raw.max_participants,
    creatorId: raw.creator_id,
  };
}

function mapEncounter(raw: RawEncounter): Encounter {
  return {
    id: raw.id,
    adventureId: raw.adventure_id,
    encounterType: raw.encounter_type,
    encounterData: parseJsonField(raw.encounter_data) ?? {},
  };
}

// ============================================================================
// Adventure lookups
// ============================================================================

/** Get an adventure by its database ID. */
export async function getAdventureById(adventureId: number): Promise<Adventure | null> {
  try {
    const res = await get<AdventureResponse>(`/adventures/${adventureId}`);
    const raw = res.adventure ?? res.data;
    if (!res.success || !raw) { return null; }
    return mapAdventure(raw);
  } catch {
    return null;
  }
}

/** Get an adventure by the Discord thread it's linked to. */
export async function getAdventureByThreadId(discordThreadId: string): Promise<Adventure | null> {
  try {
    const res = await get<AdventureResponse>(
      `/adventures/discord/thread/${discordThreadId}`,
    );
    const raw = res.adventure ?? res.data;
    if (!res.success || !raw) { return null; }
    return mapAdventure(raw);
  } catch {
    return null;
  }
}

/** Get all adventures, optionally filtered by status. */
export async function getAllAdventures(options?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ adventures: Adventure[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.status) { params.set('status', options.status); }
  if (options?.page) { params.set('page', String(options.page)); }
  if (options?.limit) { params.set('limit', String(options.limit)); }
  const query = params.toString();

  const res = await get<AdventuresResponse>(
    `/adventures${query ? `?${query}` : ''}`,
  );
  const list = res.data ?? res.adventures ?? [];
  return {
    adventures: list.map(mapAdventure),
    total: res.total ?? list.length,
  };
}

/** Get adventures for a specific trainer. */
export async function getTrainerAdventures(
  trainerId: number,
  options?: { status?: string; page?: number; limit?: number },
): Promise<{ adventures: Adventure[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.status) { params.set('status', options.status); }
  if (options?.page) { params.set('page', String(options.page)); }
  if (options?.limit) { params.set('limit', String(options.limit)); }
  const query = params.toString();

  const res = await get<AdventuresResponse>(
    `/adventures/trainer/${trainerId}${query ? `?${query}` : ''}`,
  );
  const list = res.data ?? res.adventures ?? [];
  return {
    adventures: list.map(mapAdventure),
    total: res.total ?? list.length,
  };
}

/** Get available adventure regions. */
export async function getAvailableRegions(): Promise<unknown[]> {
  const res = await get<RegionsResponse>('/adventures/regions');
  return res.data ?? res.regions ?? [];
}

// ============================================================================
// Adventure creation
// ============================================================================

/** Create a new adventure via the website-style endpoint. */
export async function createAdventure(
  data: {
    title: string;
    description?: string;
    threadEmoji?: string;
    adventureType?: string;
    region?: string;
    area?: string;
    landmass?: string;
    selectedTrainer?: number;
  },
  discordId: string,
): Promise<Adventure> {
  const res = await post<AdventureResponse>(
    '/adventures',
    data,
    withAuth(discordId),
  );
  const raw = res.adventure ?? res.data;
  if (!raw) { throw new Error(res.message ?? 'Failed to create adventure'); }
  return mapAdventure(raw);
}

// ============================================================================
// Thread management
// ============================================================================

/**
 * Register a Discord thread with the backend.
 *
 * Call this **after** creating the Discord thread via the Discord API.
 * The old JS code's `createAdventureThread` method also created the
 * Discord thread itself — that responsibility now belongs to the command
 * handler, not the service.
 */
export async function registerThread(
  data: CreateThreadRequest,
): Promise<unknown> {
  const res = await post<ThreadResponse>(
    '/adventures/discord/thread',
    data,
  );
  return res.data;
}

// ============================================================================
// Message & word tracking
// ============================================================================

/**
 * Track a user's message in an adventure thread.
 *
 * @param discordThreadId - The Discord thread ID.
 * @param discordUserId   - The message author's Discord user ID.
 * @param wordCount       - Number of words in the message.
 * @param messageCount    - Number of messages (typically 1).
 */
export async function trackMessage(
  data: TrackMessageRequest,
): Promise<unknown> {
  const res = await post<ParticipantResponse>(
    '/adventures/discord/message',
    data,
  );
  return res.participant ?? res.data;
}

/**
 * Count words in a message and track them.
 * Convenience wrapper matching the old `trackMessageWordCount` method.
 */
export async function trackMessageWordCount(
  discordThreadId: string,
  discordUserId: string,
  messageContent: string,
): Promise<unknown> {
  const wordCount = messageContent
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return trackMessage({
    discordThreadId,
    discordUserId,
    wordCount,
    messageCount: 1,
  });
}

// ============================================================================
// Encounters
// ============================================================================

/** Generate a random encounter for an adventure. */
export async function generateEncounter(
  data: GenerateEncounterRequest,
): Promise<Encounter> {
  const res = await post<EncounterResponse>(
    '/adventures/discord/encounter',
    data,
  );
  return mapEncounter(res.encounter);
}

// ============================================================================
// Capture
// ============================================================================

/**
 * Attempt to capture a monster from an encounter.
 *
 * Supports both wild encounters and in-battle captures.
 */
export async function attemptCapture(data: CaptureRequest): Promise<CaptureResult> {
  const res = await post<CaptureResponse>(
    '/adventures/discord/capture',
    data,
  );
  const cr = res.captureResult;
  return {
    success: res.success,
    captured: cr?.success ?? res.captured ?? false,
    monster: (cr?.monster ?? res.monster ?? res.data) as CapturedMonsterData | null | undefined,
    message: res.message,
  };
}

// ============================================================================
// End adventure & rewards
// ============================================================================

/** End an adventure and calculate rewards. */
export async function endAdventure(
  data: EndAdventureRequest,
): Promise<EndAdventureResult> {
  const res = await post<EndAdventureResponse>(
    '/adventures/discord/end',
    data,
  );
  return {
    success: res.success,
    rewards: res.data?.rewards,
    participants: res.data?.participants,
    message: res.message,
  };
}

/** Complete an adventure (website-style endpoint). */
export async function completeAdventure(
  adventureId: number,
  discordId: string,
): Promise<unknown> {
  const res = await post<BaseResponse & { data: unknown }>(
    `/adventures/${adventureId}/complete`,
    {},
    withAuth(discordId),
  );
  return res.data;
}

/** Get a user's unclaimed adventure rewards. */
export async function getUnclaimedRewards(
  discordUserId: string,
): Promise<unknown[]> {
  const res = await get<UnclaimedRewardsResponse>(
    `/adventures/discord/rewards/unclaimed/${discordUserId}`,
  );
  return res.data ?? res.rewards ?? [];
}

/**
 * Claim adventure rewards (website-style endpoint).
 *
 * @param data.adventureLogId    - The adventure log entry to claim from.
 * @param data.userId            - The site user ID.
 * @param data.levelAllocations  - Map of trainerId → levels to assign.
 * @param data.coinAllocations   - Map of trainerId → coins to assign.
 * @param data.itemAllocations   - Map of trainerId → items to assign.
 */
export async function claimRewards(
  data: {
    adventureLogId: number;
    userId: number;
    levelAllocations?: Record<number, number>;
    coinAllocations?: Record<number, number>;
    itemAllocations?: Record<number, unknown[]>;
  },
  discordId: string,
): Promise<unknown> {
  const res = await post<BaseResponse & { data: unknown }>(
    '/adventures/rewards/claim',
    data,
    withAuth(discordId),
  );
  return res.data;
}

/** Claim adventure rewards via the Discord-specific endpoint. */
export async function claimRewardsDiscord(
  data: unknown,
  discordId: string,
): Promise<unknown> {
  const res = await post<BaseResponse & { data: unknown }>(
    '/adventures/discord/rewards/claim',
    data,
    withAuth(discordId),
  );
  return res.data;
}
