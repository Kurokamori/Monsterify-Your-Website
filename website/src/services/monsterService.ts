import api from './api';

// --- Types ---

export interface Monster {
  id: number;
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  main_ref?: string;
  trainer_id?: number;
  box_number?: number;
  box_position?: number;
  gender?: string;
  friendship?: number;
  nature?: string;
  [key: string]: unknown;
}

export interface MonsterListResponse {
  monsters?: Monster[];
  data?: Monster[];
  success?: boolean;
  total?: number;
  totalMonsters?: number;
  page?: number;
  totalPages?: number;
}

export interface MonsterResponse {
  success: boolean;
  data: Monster | null;
  message?: string;
}

export interface MonsterArrayResponse {
  success: boolean;
  data: Monster[] | unknown[];
  message?: string;
}

export interface MonsterMove {
  name: string;
  type?: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  [key: string]: unknown;
}

export interface MonsterImage {
  id?: number;
  image_url?: string;
  image_path?: string;
  caption?: string;
  artist?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface EvolutionData {
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  [key: string]: unknown;
}

export interface LineageData {
  parents?: Monster[];
  children?: Monster[];
  siblings?: Monster[];
  [key: string]: unknown;
}

export interface SearchResult {
  success: boolean;
  data: Monster[];
  message?: string;
}

// --- ID validation helper ---

function parseValidId(id: string | number): number | null {
  if (id === undefined || id === null || id === 'undefined' || id === 'null') return null;
  const parsed = typeof id === 'number' ? id : parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

// --- Response normalization ---

function normalizeResponse(data: Record<string, unknown>): MonsterResponse {
  if (!data) {
    return { success: false, data: null, message: 'Empty response from API' };
  }
  if (Object.prototype.hasOwnProperty.call(data, 'success')) {
    return data as unknown as MonsterResponse;
  }
  return { success: true, data: data as unknown as Monster };
}

function normalizeArrayResponse(data: unknown): MonsterArrayResponse {
  if (!data) {
    return { success: false, data: [], message: 'Empty response from API' };
  }
  if (typeof data === 'object' && data !== null && Object.prototype.hasOwnProperty.call(data, 'success')) {
    return data as MonsterArrayResponse;
  }
  return { success: true, data: Array.isArray(data) ? data : [] };
}

// --- Service ---

const monsterService = {
  // ── CRUD ──────────────────────────────────────────────────────────

  // Get all monsters with optional query params
  getAllMonsters: async (params: Record<string, unknown> = {}): Promise<MonsterListResponse> => {
    const response = await api.get('/monsters', { params });
    return response.data;
  },

  // Get all monsters for a user (by discord_id). Omit userId to use authenticated user.
  getMonstersByUserId: async (userId?: string): Promise<Monster[]> => {
    const endpoint = userId ? `/monsters/user/${userId}` : '/monsters/user';
    const response = await api.get(endpoint);
    const data = response.data;
    return data?.data ?? data?.monsters ?? (Array.isArray(data) ? data : []);
  },

  // Get monster by ID with validation and response normalization
  getMonsterById: async (id: string | number): Promise<MonsterResponse> => {
    const monsterId = parseValidId(id);
    if (monsterId === null) {
      return { success: false, data: null, message: 'Invalid monster ID' };
    }

    try {
      const response = await api.get(`/monsters/${monsterId}`);
      return normalizeResponse(response.data);
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: null, message: error.message || 'Failed to fetch monster' };
    }
  },

  // Create a new monster
  createMonster: async (monsterData: Partial<Monster>) => {
    const response = await api.post('/monsters', monsterData);
    return response.data;
  },

  // Update a monster
  updateMonster: async (id: string | number, monsterData: Partial<Monster>) => {
    const response = await api.put(`/monsters/${id}`, monsterData);
    return response.data;
  },

  // Delete a monster
  deleteMonster: async (id: string | number): Promise<void> => {
    await api.delete(`/monsters/${id}`);
  },

  // ── Level & evolution ─────────────────────────────────────────────

  // Level up a monster
  levelUpMonster: async (id: string | number, levels = 1) => {
    const response = await api.post(`/monsters/${id}/level-up`, { levels });
    return response.data;
  },

  // Evolve a monster (supports optional image file upload)
  evolveMonster: async (
    id: string | number,
    evolutionData: EvolutionData,
    imageFile?: File,
  ) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      for (const [key, value] of Object.entries(evolutionData)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      const response = await api.post(`/monsters/${id}/evolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    const response = await api.post(`/monsters/${id}/evolve`, evolutionData);
    return response.data;
  },

  // Get evolution options for a monster
  getEvolutionOptions: async (id: string | number, speciesSlot = 'species1') => {
    const response = await api.get(`/monsters/${id}/evolution-options`, {
      params: { speciesSlot },
    });
    return response.data;
  },

  // Set monster evolution data
  setMonsterEvolutionData: async (id: string | number, evolutionData: EvolutionData) => {
    const response = await api.post(`/monsters/${id}/evolution`, {
      evolution_data: evolutionData,
    });
    return response.data;
  },

  // Get monster evolution data (with validation)
  getMonsterEvolutionData: async (id: string | number): Promise<MonsterResponse> => {
    const monsterId = parseValidId(id);
    if (monsterId === null) {
      return { success: false, data: null, message: 'Invalid monster ID' };
    }

    try {
      const response = await api.get(`/monsters/${monsterId}/evolution`);
      return normalizeResponse(response.data);
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: null, message: error.message || 'Failed to fetch evolution data' };
    }
  },

  // Get monster evolution chain (with validation)
  getMonsterEvolutionChain: async (id: string | number): Promise<MonsterArrayResponse> => {
    const monsterId = parseValidId(id);
    if (monsterId === null) {
      return { success: false, data: [], message: 'Invalid monster ID' };
    }

    try {
      const response = await api.get(`/monsters/${monsterId}/evolution-chain`);
      return normalizeArrayResponse(response.data);
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: [], message: error.message || 'Failed to fetch evolution chain' };
    }
  },

  // ── Moves ─────────────────────────────────────────────────────────

  // Get monster moves (with validation)
  getMonsterMoves: async (id: string | number): Promise<MonsterArrayResponse> => {
    const monsterId = parseValidId(id);
    if (monsterId === null) {
      return { success: false, data: [], message: 'Invalid monster ID' };
    }

    try {
      const response = await api.get(`/monsters/${monsterId}/moves`);
      return normalizeArrayResponse(response.data);
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: [], message: error.message || 'Failed to fetch monster moves' };
    }
  },

  // Update monster moves
  updateMonsterMoves: async (id: string | number, moves: MonsterMove[]) => {
    const response = await api.put(`/monsters/${id}/moves`, { moves });
    return response.data;
  },

  // ── Images ────────────────────────────────────────────────────────

  // Get monster images
  getMonsterImages: async (id: string | number) => {
    const response = await api.get(`/monsters/${id}/images`);
    return response.data;
  },

  // Add an image to a monster
  addMonsterImage: async (id: string | number, imageData: Partial<MonsterImage>) => {
    const response = await api.post(`/monsters/${id}/images`, imageData);
    return response.data;
  },

  // Get mega images for a monster
  getMegaImages: async (id: string | number) => {
    const response = await api.get(`/monsters/${id}/mega-images`);
    return response.data;
  },

  // Add mega stone image to a monster
  addMegaStoneImage: async (id: string | number, imageData: Partial<MonsterImage>) => {
    const response = await api.post(`/monsters/${id}/mega-stone-image`, imageData);
    return response.data;
  },

  // Add mega image to a monster
  addMegaImage: async (id: string | number, imageData: Partial<MonsterImage>) => {
    const response = await api.post(`/monsters/${id}/mega-image`, imageData);
    return response.data;
  },

  // Get monster gallery (with validation)
  getMonsterGallery: async (id: string | number): Promise<MonsterArrayResponse> => {
    const monsterId = parseValidId(id);
    if (monsterId === null) {
      return { success: false, data: [], message: 'Invalid monster ID' };
    }

    try {
      const response = await api.get(`/monsters/${monsterId}/gallery`);
      return normalizeArrayResponse(response.data);
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: [], message: error.message || 'Failed to fetch gallery' };
    }
  },

  // ── Trainer monsters ──────────────────────────────────────────────

  // Get monsters for a trainer (non-paginated, for dropdowns/forms)
  getTrainerMonsters: async (trainerId: string | number, params: Record<string, unknown> = {}) => {
    const response = await api.get(`/trainers/${trainerId}/monsters/all`, { params });
    return response.data;
  },

  // Get monsters for a trainer with pagination (for listing pages)
  getTrainerMonstersPaginated: async (trainerId: string | number, params: Record<string, unknown> = {}) => {
    const response = await api.get(`/trainers/${trainerId}/monsters`, { params });
    return response.data;
  },

  // Get monsters by trainer ID (admin version with more details)
  getMonstersByTrainerId: async (trainerId: string | number, params: Record<string, unknown> = {}) => {
    const response = await api.get(`/trainers/${trainerId}/monsters`, { params });
    return response.data;
  },

  // ── Lineage ───────────────────────────────────────────────────────

  // Get monster lineage (with validation)
  getMonsterLineage: async (id: string | number): Promise<MonsterResponse> => {
    const monsterId = parseValidId(id);
    if (monsterId === null) {
      return { success: false, data: null, message: 'Invalid monster ID' };
    }

    try {
      const response = await api.get(`/monsters/${monsterId}/lineage`);
      return normalizeResponse(response.data);
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: null, message: error.message || 'Failed to fetch lineage' };
    }
  },

  // Add manual lineage relationship
  addLineageRelationship: async (
    monsterId: string | number,
    relatedMonsterId: string | number,
    relationshipType: string,
    notes = '',
  ) => {
    const response = await api.post(`/monsters/${monsterId}/lineage`, {
      related_monster_id: relatedMonsterId,
      relationship_type: relationshipType,
      notes,
    });
    return response.data;
  },

  // Remove lineage relationship
  removeLineageRelationship: async (
    monsterId: string | number,
    relatedMonsterId: string | number,
    relationshipType: string,
  ) => {
    const response = await api.delete(`/monsters/${monsterId}/lineage`, {
      data: {
        related_monster_id: relatedMonsterId,
        relationship_type: relationshipType,
      },
    });
    return response.data;
  },

  // ── Search & initialization ───────────────────────────────────────

  // Search monsters by name, species, or trainer name
  searchMonsters: async (searchTerm: string, limit = 10): Promise<SearchResult> => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, data: [] };
    }

    try {
      const response = await api.get('/monsters/search', {
        params: { search: searchTerm.trim(), limit },
      });
      return { success: true, data: response.data.data || [] };
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, data: [], message: error.message || 'Failed to search monsters' };
    }
  },

  // Initialize a monster with stats, moves, etc.
  initializeMonster: async (id: string | number) => {
    const response = await api.post(`/monsters/${id}/initialize`);
    return response.data;
  },

  // ── Admin Monster Manager ────────────────────────────────────────

  // Admin: Get monsters paginated with filters
  adminGetMonstersPaginated: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/monsters/admin/paginated', { params });
    return response.data;
  },

  // Admin: Change monster owner (move to different trainer)
  adminChangeMonsterOwner: async (monsterId: number | string, newTrainerId: number) => {
    const response = await api.put(`/monsters/admin/${monsterId}/owner`, { newTrainerId });
    return response.data;
  },

  // Admin: Delete monster with optional forfeit
  adminDeleteMonster: async (monsterId: number | string, forfeitToBazar: boolean) => {
    const response = await api.delete(`/monsters/admin/${monsterId}`, { data: { forfeitToBazar } });
    return response.data;
  },

  // Admin: Search moves database
  adminSearchMoves: async (search?: string, type?: string, limit = 50): Promise<MonsterMove[]> => {
    const response = await api.get('/monsters/moves/search', {
      params: { search, type, limit },
    });
    const raw = response.data?.data ?? [];
    return raw.map((m: Record<string, unknown>) => ({
      name: (m.moveName ?? m.move_name ?? m.name ?? '') as string,
      type: (m.moveType ?? m.move_type ?? m.type ?? '') as string,
      power: (m.power ?? null) as number | null,
      accuracy: (m.accuracy ?? null) as number | null,
      pp: (m.pp ?? null) as number | null,
    }));
  },

  // Admin: Update monster (admin-level fields like EVs, IVs, level, moves, abilities)
  adminUpdateMonster: async (id: number | string, data: Record<string, unknown>) => {
    const response = await api.put(`/monsters/${id}`, data);
    return response.data;
  },

  // Admin: Get filter options (types + attributes from actual monster data)
  adminGetFilterOptions: async (): Promise<{ types: string[]; attributes: string[] }> => {
    const response = await api.get('/monsters/admin/filter-options');
    return { types: response.data.types ?? [], attributes: response.data.attributes ?? [] };
  },

  // Initialize a monster from breeding
  initializeBreedingMonster: async (trainerId: string | number, monster: Partial<Monster>) => {
    const response = await api.post('/monsters/initialize', {
      trainerId,
      monster,
      context: 'breeding',
    });
    return response.data;
  },

  // ── Reference data ────────────────────────────────────────────────

  // Get all trainers (for monster assignment dropdowns)
  getAllTrainers: async () => {
    const response = await api.get('/trainers/all');
    return response.data;
  },

  // Get all fakemon (for species selection)
  getAllFakemon: async () => {
    const response = await api.get('/fakedex', { params: { limit: 1000 } });
    return response.data;
  },

  // Get all types (for type selection)
  getAllTypes: async () => {
    const response = await api.get('/fakedex/types');
    return response.data;
  },
};

export default monsterService;
