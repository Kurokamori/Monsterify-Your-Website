import { get, post, put, withAuth, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes (backend envelope)
// ============================================================================

/** Raw trainer row as the backend returns it (snake_case). */
interface RawTrainer {
  id: number;
  player_user_id: string;
  name: string;
  level: number;
  currency_amount: number;
  total_earned_currency: number;
  main_ref: string | null;
  additional_refs: string | null;
  bio: string | null;
  birthday: string | null;
  mega_info: string | null;
  img_link?: string | null;
  [key: string]: unknown;
}

interface GetTrainerResponse extends BaseResponse {
  trainer: RawTrainer;
}

interface GetTrainersResponse extends BaseResponse {
  trainers?: RawTrainer[];
  data?: RawTrainer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalTrainers?: number;
}

interface UpdateTrainerResponse extends BaseResponse {
  data: RawTrainer;
}

interface AddLevelsResponse extends BaseResponse {
  data: {
    trainerId: number;
    previousLevel: number;
    newLevel: number;
    levelsAdded: number;
    previousCoins?: number;
    newCoins?: number;
    coinsAdded?: number;
  };
}

interface AdminAddLevelsResponse extends BaseResponse {
  data: {
    trainer: RawTrainer;
    previousLevel: number;
    newLevel: number;
    levelsAdded: number;
    previousCoins: number;
    newCoins: number;
    coinsAdded: number;
  };
}

interface BulkAddLevelsResponse extends BaseResponse {
  data: {
    success: Array<{ trainerId: number; newLevel: number; newCoins: number }>;
    failed: Array<{ trainerId: number; error: string }>;
  };
}

interface InventoryResponse extends BaseResponse {
  data: Record<string, Record<string, number>>;
}

interface MonstersResponse extends BaseResponse {
  monsters: unknown[];
  totalMonsters?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ============================================================================
// Public types
// ============================================================================

export interface Trainer {
  id: number;
  playerUserId: string;
  name: string;
  level: number;
  currencyAmount: number;
  totalEarnedCurrency: number;
  mainRef: string | null;
  bio: string | null;
  birthday: string | null;
  zodiac: string | null;
  chineseZodiac: string | null;
  createdAt: string | null;
  monsterCount: number;
  monsterRefCount: number;
  monsterRefPercent: number;
}

export interface TrainerLevelResult {
  trainerId: number;
  previousLevel: number;
  newLevel: number;
  levelsAdded: number;
  previousCoins?: number;
  newCoins?: number;
  coinsAdded?: number;
}

export interface BulkLevelResult {
  success: Array<{ trainerId: number; newLevel: number; newCoins: number }>;
  failed: Array<{ trainerId: number; error: string }>;
}

// ============================================================================
// Helpers
// ============================================================================

function mapTrainer(raw: RawTrainer): Trainer {
  return {
    id: raw.id,
    playerUserId: raw.player_user_id,
    name: raw.name,
    level: raw.level,
    currencyAmount: raw.currency_amount,
    totalEarnedCurrency: raw.total_earned_currency,
    mainRef: raw.main_ref ?? raw.img_link ?? null,
    bio: raw.bio,
    birthday: raw.birthday,
    zodiac: (raw.zodiac as string) ?? null,
    chineseZodiac: (raw.chinese_zodiac as string) ?? null,
    createdAt: (raw.created_at as string) ?? null,
    monsterCount: Number(raw.monster_count ?? 0),
    monsterRefCount: Number(raw.monster_ref_count ?? 0),
    monsterRefPercent: Number(raw.monster_ref_percent ?? 0),
  };
}

// ============================================================================
// Lookups
// ============================================================================

/** Get a trainer by their database ID. */
export async function getTrainerById(id: number): Promise<Trainer | null> {
  try {
    const res = await get<GetTrainerResponse>(`/trainers/${id}`);
    if (!res.success || !res.trainer) {
      return null;
    }
    return mapTrainer(res.trainer);
  } catch {
    return null;
  }
}

/**
 * Get all trainers belonging to a user (by their discord_id / player_user_id).
 * Returns all pages combined.
 */
export async function getTrainersByUserId(userId: string): Promise<Trainer[]> {
  const res = await get<GetTrainersResponse>(
    `/trainers/user/${userId}?limit=100`,
  );
  return (res.trainers ?? res.data ?? []).map(mapTrainer);
}

/** Get a paginated list of all trainers, with optional search. */
export async function getAllTrainers(options?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{ trainers: Trainer[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options?.page) { params.set('page', String(options.page)); }
  if (options?.limit) { params.set('limit', String(options.limit)); }
  if (options?.search) { params.set('search', options.search); }
  if (options?.sortBy) { params.set('sort_by', options.sortBy); }
  if (options?.sortOrder) { params.set('sort_order', options.sortOrder); }

  const query = params.toString();
  const res = await get<GetTrainersResponse>(
    `/trainers${query ? `?${query}` : ''}`,
  );
  return {
    trainers: (res.trainers ?? res.data ?? []).map(mapTrainer),
    total: res.total ?? res.totalTrainers ?? 0,
    page: res.page ?? 1,
    totalPages: res.totalPages ?? 1,
  };
}

// ============================================================================
// Updates
// ============================================================================

/** Update individual fields on a trainer (snake_case body). */
export async function updateTrainer(
  id: number,
  fields: Record<string, unknown>,
  discordId?: string,
): Promise<Trainer> {
  const cfg = discordId ? withAuth(discordId) : undefined;
  const res = await put<UpdateTrainerResponse>(
    `/trainers/${id}`,
    fields,
    cfg,
  );
  return mapTrainer(res.data);
}

// ============================================================================
// Levels & Coins
// ============================================================================

/**
 * Self-service: add levels to a trainer.
 * The calling user must own the trainer.
 */
export async function addLevels(
  trainerId: number,
  levels: number,
  discordId: string,
): Promise<TrainerLevelResult> {
  const res = await post<AddLevelsResponse>(
    '/trainers/add-levels',
    { trainerId, levels },
    withAuth(discordId),
  );
  return res.data;
}

/**
 * Admin: add levels (and optionally coins) to a single trainer.
 * Coins default to `levels * 50` on the backend if omitted.
 */
export async function adminAddLevels(
  trainerId: number,
  levels: number,
  options?: { coins?: number; reason?: string; discordId?: string },
): Promise<TrainerLevelResult> {
  const cfg = options?.discordId ? withAuth(options.discordId) : undefined;
  const res = await post<AdminAddLevelsResponse>(
    `/trainers/admin/levels/${trainerId}`,
    { levels, coins: options?.coins, reason: options?.reason },
    cfg,
  );
  return {
    trainerId,
    previousLevel: res.data.previousLevel,
    newLevel: res.data.newLevel,
    levelsAdded: res.data.levelsAdded,
    previousCoins: res.data.previousCoins,
    newCoins: res.data.newCoins,
    coinsAdded: res.data.coinsAdded,
  };
}

/**
 * Admin: bulk add levels (and optionally coins) to multiple trainers.
 */
export async function adminAddLevelsBulk(
  trainerIds: number[],
  levels: number,
  options?: { coins?: number; reason?: string; discordId?: string },
): Promise<BulkLevelResult> {
  const cfg = options?.discordId ? withAuth(options.discordId) : undefined;
  const res = await post<BulkAddLevelsResponse>(
    '/trainers/admin/levels',
    { trainerIds, levels, coins: options?.coins, reason: options?.reason },
    cfg,
  );
  return res.data;
}

// ============================================================================
// Inventory
// ============================================================================

/** Get a trainer's full inventory, keyed by category. */
export async function getInventory(
  trainerId: number,
): Promise<Record<string, Record<string, number>>> {
  const res = await get<InventoryResponse>(`/trainers/${trainerId}/inventory`);
  return res.data;
}

/** Update a single inventory item quantity. */
export async function updateInventoryItem(
  trainerId: number,
  category: string,
  itemName: string,
  quantity: number,
  discordId?: string,
): Promise<Record<string, Record<string, number>>> {
  const cfg = discordId ? withAuth(discordId) : undefined;
  const res = await put<InventoryResponse>(
    `/trainers/${trainerId}/inventory`,
    { category, itemName, quantity },
    cfg,
  );
  return res.data;
}

// ============================================================================
// Trainer's monsters
// ============================================================================

/** Get all monsters belonging to a trainer (unpaginated). */
export async function getTrainerMonsters(trainerId: number): Promise<unknown[]> {
  const res = await get<MonstersResponse>(
    `/trainers/${trainerId}/monsters/all`,
  );
  return res.monsters ?? [];
}

// ============================================================================
// Name-based lookups
// ============================================================================

/**
 * Find a trainer by name within a specific user's trainers.
 * Case-insensitive match. Returns the first match or null.
 */
export async function findTrainerByName(
  discordId: string,
  name: string,
): Promise<Trainer | null> {
  const trainers = await getTrainersByUserId(discordId);
  const lower = name.toLowerCase();
  return trainers.find((t) => t.name.toLowerCase() === lower) ?? null;
}

/**
 * Get trainers for a user filtered by a partial name (for autocomplete).
 * Returns up to `limit` trainers whose name includes the search string.
 */
export async function searchTrainersByName(
  discordId: string,
  search: string,
  limit = 25,
): Promise<Trainer[]> {
  const trainers = await getTrainersByUserId(discordId);
  if (!search) {
    return trainers.slice(0, limit);
  }
  const lower = search.toLowerCase();
  return trainers
    .filter((t) => t.name.toLowerCase().includes(lower))
    .slice(0, limit);
}
