import { get, post, put, withAuth, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes (backend envelope)
// ============================================================================

/** Raw monster row as the backend returns it (snake_case). */
interface RawMonster {
  id: number;
  trainer_id: number;
  player_user_id: string;
  name: string;

  species1: string;
  species2: string | null;
  species3: string | null;

  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;

  attribute: string | null;
  level: number;

  hp_total: number;
  atk_total: number;
  def_total: number;
  spa_total: number;
  spd_total: number;
  spe_total: number;

  nature: string;
  characteristic: string;
  gender: string;
  friendship: number;
  ability: string | null;
  ability1: string | null;
  ability2: string | null;

  moveset: string | string[] | null;
  img_link: string | null;

  date_met: string | null;
  where_met: string | null;
  box_number: number;
  trainer_index: number;

  shiny: boolean | number;
  alpha: boolean | number;
  shadow: boolean | number;
  paradox: boolean | number;
  pokerus: boolean | number;

  [key: string]: unknown;
}

interface GetMonsterResponse extends BaseResponse {
  data: RawMonster & {
    images?: unknown[];
    evolution_data?: unknown;
  };
}

interface GetMonstersResponse extends BaseResponse {
  monsters?: RawMonster[];
  data?: RawMonster[];
  count?: number;
}

interface UpdateMonsterResponse extends BaseResponse {
  data: RawMonster;
}

interface AddLevelsResponse extends BaseResponse {
  data: {
    monsterId: number;
    previousLevel: number;
    newLevel: number;
    levelsAdded: number;
  };
}

interface AdminAddLevelsResponse extends BaseResponse {
  data: {
    monster: {
      id: number;
      name: string;
      newLevel: number;
      trainerId: number;
    } | undefined;
  };
}

interface BulkAddLevelsResponse extends BaseResponse {
  data: {
    success: Array<{ monsterId: number; newLevel: number }>;
    failed: Array<{ monsterId: number; error: string }>;
  };
}

// ============================================================================
// Public types
// ============================================================================

export interface Monster {
  id: number;
  trainerId: number;
  playerUserId: string;
  name: string;

  species1: string;
  species2: string | null;
  species3: string | null;

  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;

  attribute: string | null;
  level: number;

  hpTotal: number;
  atkTotal: number;
  defTotal: number;
  spaTotal: number;
  spdTotal: number;
  speTotal: number;

  nature: string;
  characteristic: string;
  gender: string;
  friendship: number;
  ability: string | null;
  ability1: string | null;
  ability2: string | null;

  moveset: string[];
  imgLink: string | null;

  dateMet: string | null;
  whereMet: string | null;
  boxNumber: number;
  trainerIndex: number;

  shiny: boolean;
  alpha: boolean;
  shadow: boolean;
  paradox: boolean;
  pokerus: boolean;
}

export interface MonsterLevelResult {
  monsterId: number;
  previousLevel: number;
  newLevel: number;
  levelsAdded: number;
}

export interface BulkLevelResult {
  success: Array<{ monsterId: number; newLevel: number }>;
  failed: Array<{ monsterId: number; error: string }>;
}

// ============================================================================
// Helpers
// ============================================================================

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') { return v; }
  return v === 1 || v === '1' || v === 'true';
}

function parseMoveset(raw: string | string[] | null): string[] {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return raw.split(',').map((m) => m.trim()).filter(Boolean);
  }
}

function mapMonster(raw: RawMonster): Monster {
  return {
    id: raw.id,
    trainerId: raw.trainer_id,
    playerUserId: raw.player_user_id,
    name: raw.name,

    species1: raw.species1,
    species2: raw.species2,
    species3: raw.species3,

    type1: raw.type1,
    type2: raw.type2,
    type3: raw.type3,
    type4: raw.type4,
    type5: raw.type5,

    attribute: raw.attribute,
    level: raw.level,

    hpTotal: raw.hp_total,
    atkTotal: raw.atk_total,
    defTotal: raw.def_total,
    spaTotal: raw.spa_total,
    spdTotal: raw.spd_total,
    speTotal: raw.spe_total,

    nature: raw.nature,
    characteristic: raw.characteristic,
    gender: raw.gender,
    friendship: raw.friendship,
    ability: raw.ability,
    ability1: raw.ability1,
    ability2: raw.ability2,

    moveset: parseMoveset(raw.moveset),
    imgLink: raw.img_link,

    dateMet: raw.date_met,
    whereMet: raw.where_met,
    boxNumber: raw.box_number,
    trainerIndex: raw.trainer_index,

    shiny: toBool(raw.shiny),
    alpha: toBool(raw.alpha),
    shadow: toBool(raw.shadow),
    paradox: toBool(raw.paradox),
    pokerus: toBool(raw.pokerus),
  };
}

// ============================================================================
// Lookups
// ============================================================================

/** Get a monster by its database ID (includes images & evolution data). */
export async function getMonsterById(id: number): Promise<Monster | null> {
  try {
    const res = await get<GetMonsterResponse>(`/monsters/${id}`);
    if (!res.success || !res.data) {
      return null;
    }
    return mapMonster(res.data);
  } catch {
    return null;
  }
}

/** Get all monsters belonging to a trainer. */
export async function getMonstersByTrainerId(trainerId: number): Promise<Monster[]> {
  const res = await get<GetMonstersResponse>(
    `/monsters/trainer/${trainerId}`,
  );
  const list = res.monsters ?? res.data ?? [];
  return list.map(mapMonster);
}

/** Get all monsters belonging to a user (by discord_id). */
export async function getMonstersByUserId(userId: string): Promise<Monster[]> {
  const res = await get<GetMonstersResponse>(`/monsters/user/${userId}`);
  const list = res.monsters ?? res.data ?? [];
  return list.map(mapMonster);
}

/** Search monsters by name/species. */
export async function searchMonsters(
  query: string,
  limit = 20,
): Promise<Monster[]> {
  const res = await get<GetMonstersResponse>(
    `/monsters/search?search=${encodeURIComponent(query)}&limit=${limit}`,
  );
  const list = res.data ?? res.monsters ?? [];
  return list.map(mapMonster);
}

// ============================================================================
// Updates
// ============================================================================

/**
 * Update individual fields on a monster.
 * Body keys should be snake_case to match the backend's field mapping.
 */
export async function updateMonster(
  id: number,
  fields: Record<string, unknown>,
  discordId?: string,
): Promise<Monster> {
  const cfg = discordId ? withAuth(discordId) : undefined;
  const res = await put<UpdateMonsterResponse>(
    `/monsters/${id}`,
    fields,
    cfg,
  );
  return mapMonster(res.data);
}

// ============================================================================
// Levels
// ============================================================================

/**
 * Self-service: add levels to a monster.
 * The calling user must own the monster's trainer.
 */
export async function addLevels(
  monsterId: number,
  levels: number,
  discordId: string,
): Promise<MonsterLevelResult> {
  const res = await post<AddLevelsResponse>(
    '/monsters/add-levels',
    { monsterId, levels },
    withAuth(discordId),
  );
  return res.data;
}

/** Admin: add levels to a single monster. */
export async function adminAddLevels(
  monsterId: number,
  levels: number,
  options?: { reason?: string; discordId?: string },
): Promise<{ monsterId: number; name: string; newLevel: number; trainerId: number }> {
  const cfg = options?.discordId ? withAuth(options.discordId) : undefined;
  const res = await post<AdminAddLevelsResponse>(
    `/monsters/admin/levels/${monsterId}`,
    { levels, reason: options?.reason },
    cfg,
  );
  const m = res.data.monster;
  return {
    monsterId: m?.id ?? monsterId,
    name: m?.name ?? '',
    newLevel: m?.newLevel ?? 0,
    trainerId: m?.trainerId ?? 0,
  };
}

/** Admin: bulk add levels to multiple monsters. */
export async function adminAddLevelsBulk(
  monsterIds: number[],
  levels: number,
  options?: { reason?: string; discordId?: string },
): Promise<BulkLevelResult> {
  const cfg = options?.discordId ? withAuth(options.discordId) : undefined;
  const res = await post<BulkAddLevelsResponse>(
    '/monsters/admin/levels',
    { monsterIds, levels, reason: options?.reason },
    cfg,
  );
  return res.data;
}

// ============================================================================
// Name-based lookups
// ============================================================================

/**
 * Find a monster by name within a specific user's monsters.
 * Case-insensitive match. Returns the first match or null.
 */
export async function findMonsterByName(
  discordId: string,
  name: string,
): Promise<Monster | null> {
  const monsters = await getMonstersByUserId(discordId);
  const lower = name.toLowerCase();
  return monsters.find((m) => m.name.toLowerCase() === lower) ?? null;
}

/**
 * Get monsters for a user filtered by a partial name (for autocomplete).
 * Returns up to `limit` monsters whose name includes the search string.
 */
export async function searchMonstersByName(
  discordId: string,
  search: string,
  limit = 25,
): Promise<Monster[]> {
  const monsters = await getMonstersByUserId(discordId);
  if (!search) {
    return monsters.slice(0, limit);
  }
  const lower = search.toLowerCase();
  return monsters
    .filter((m) => m.name.toLowerCase().includes(lower))
    .slice(0, limit);
}
