import api from './api';

// --- Types ---

export interface TownInfo {
  id?: number | string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface TownLocation {
  id: string;
  name: string;
  description?: string;
  image_path?: string;
  position?: { x: number; y: number };
  is_locked?: boolean;
  requires_level?: number;
}

export interface ShopItemsParams {
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PurchaseResult {
  success: boolean;
  message?: string;
  remainingCoins?: number;
}

export interface GardenState {
  growth?: number;
  stage?: string;
  can_harvest?: boolean;
  can_tend?: boolean;
  [key: string]: unknown;
}

export interface GardenHarvestSession {
  session_id: string;
  rewards?: unknown[];
  status?: string;
  [key: string]: unknown;
}

export interface ActivitySessionResponse {
  success: boolean;
  message?: string;
  session?: {
    session_id: string;
    location: string;
    activity: string;
    created_at?: string;
    rewards?: unknown[];
    [key: string]: unknown;
  };
  prompt?: {
    prompt_id?: number;
    prompt_text: string;
  };
  flavor?: {
    flavor_id?: number;
    flavor_text: string;
    image_url?: string;
  };
  debug?: Record<string, unknown>;
}

export interface ActivityClaimResponse {
  success: boolean;
  message?: string;
  monster?: Record<string, unknown>;
}

export interface ActivityCooldown {
  active: boolean;
  time_remaining: string;
}

export interface LocationStatusResponse {
  active_session?: {
    session_id: string;
    activity: string;
    [key: string]: unknown;
  } | null;
  cooldown?: Record<string, ActivityCooldown> | ActivityCooldown;
}

export interface StartActivityResponse {
  success: boolean;
  session_id?: string;
  message?: string;
}

export interface FarmState {
  is_active?: boolean;
  current_prompt?: unknown;
  [key: string]: unknown;
}

export interface FarmPrompt {
  id: number;
  prompt_text: string;
  activity_type?: string;
}

export interface GameCornerState {
  active_session?: unknown;
  total_sessions?: number;
  [key: string]: unknown;
}

export interface PomodoroSessionData {
  duration?: number;
  task?: string;
  [key: string]: unknown;
}

export interface GameCornerRewardInput {
  completedSessions: number;
  totalFocusMinutes: number;
  productivityScore: number;
  forceMonsterRoll?: boolean;
}

export interface GameCornerRewardData {
  id: string;
  type: 'coin' | 'item' | 'level' | 'monster';
  reward_type: string;
  rarity: string;
  reward_data: Record<string, unknown>;
  assigned_to: number | null;
  claimed: boolean;
  claimed_by?: number | null;
  claimed_at?: string | null;
  claimed_by_monster_id?: number;
  claimed_by_monster_name?: string;
  claimed_by_type?: string;
}

export interface GameCornerTrainer {
  id: number;
  name: string;
  level?: number;
  player_user_id?: string;
}

export interface GameCornerRewardsResponse {
  success: boolean;
  sessionId: string;
  rewards: GameCornerRewardData[];
  trainers: GameCornerTrainer[];
  stats: {
    completedSessions: number;
    totalFocusMinutes: number;
    productivityScore: number;
    combinedMultiplier: number;
  };
}

export interface GameCornerClaimResponse {
  success: boolean;
  message?: string;
  reward?: GameCornerRewardData;
}

export interface TradeListingParams {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface TradeListing {
  id: number;
  trainer_id: number;
  trainer_name?: string;
  offered_monsters?: number[];
  offered_items?: Record<string, unknown>;
  requested_monsters?: number[];
  requested_items?: Record<string, unknown>;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface TownEvent {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface TownEventParams {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// --- Admin: Location Activity Types ---

export interface LocationPrompt {
  id: number;
  location: string;
  activity: string;
  prompt_text: string;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationFlavor {
  id: number;
  location: string;
  image_url: string | null;
  flavor_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
}

// --- Service ---

const townService = {
  // ── Town info & locations ─────────────────────────────────────────

  getTownInfo: async (): Promise<TownInfo> => {
    const response = await api.get('/town');
    return response.data;
  },

  getTownLocations: async (): Promise<TownLocation[]> => {
    const response = await api.get('/town/locations');
    return response.data;
  },

  getLocationDetails: async (locationId: string): Promise<TownLocation> => {
    const response = await api.get(`/town/locations/${locationId}`);
    return response.data;
  },

  // ── Shop ──────────────────────────────────────────────────────────

  getShopItems: async (shopId: string | number, params: ShopItemsParams = {}) => {
    const response = await api.get(`/town/shops/${shopId}/items`, { params });
    return response.data;
  },

  purchaseItem: async (
    shopId: string | number,
    itemId: number,
    quantity: number,
    trainerId: number | string,
  ): Promise<PurchaseResult> => {
    const response = await api.post(`/town/shops/${shopId}/purchase`, {
      itemId,
      quantity,
      trainerId,
    });
    return response.data;
  },

  // ── Garden ────────────────────────────────────────────────────────

  getGardenState: async (trainerId: number | string): Promise<GardenState> => {
    const response = await api.get(`/town/garden/${trainerId}`);
    return response.data;
  },

  tendGarden: async (trainerId: number | string) => {
    const response = await api.post(`/town/garden/${trainerId}/tend`);
    return response.data;
  },

  harvestGarden: async (trainerId: number | string) => {
    const response = await api.post(`/town/garden/${trainerId}/harvest`);
    return response.data;
  },

  getGardenPoints: async () => {
    const response = await api.get('/garden/points');
    return response.data;
  },

  startGardenHarvest: async (): Promise<GardenHarvestSession> => {
    const response = await api.post('/garden/harvest');
    return response.data;
  },

  getGardenHarvestSession: async (sessionId: string): Promise<GardenHarvestSession> => {
    const response = await api.get(`/garden/session/${sessionId}`);
    return response.data;
  },

  claimGardenHarvestReward: async (
    sessionId: string,
    rewardId: number | string,
    trainerId: number | string,
    monsterName = '',
  ) => {
    const response = await api.post('/garden/claim', {
      sessionId,
      rewardId,
      trainerId,
      monsterName,
    });
    return response.data;
  },

  forfeitGardenHarvestMonster: async (
    sessionId: string,
    rewardId: number | string,
    monsterName = '',
  ) => {
    const response = await api.post('/garden/forfeit', {
      sessionId,
      rewardId,
      monsterName,
    });
    return response.data;
  },

  // ── Activity sessions ────────────────────────────────────────────

  getActivitySession: async (sessionId: string): Promise<ActivitySessionResponse> => {
    const response = await api.get(`/town/activities/session/${sessionId}`);
    return response.data;
  },

  completeActivity: async (sessionId: string): Promise<ActivitySessionResponse> => {
    const response = await api.post('/town/activities/complete', { sessionId });
    return response.data;
  },

  claimActivityReward: async (
    sessionId: string,
    rewardId: number | string,
    trainerId: number | string,
    monsterName?: string,
  ): Promise<ActivityClaimResponse> => {
    const response = await api.post('/town/activities/claim', {
      sessionId,
      rewardId,
      trainerId,
      ...(monsterName != null && { monsterName }),
    });
    return response.data;
  },

  forfeitActivityReward: async (
    sessionId: string,
    rewardId: number | string,
    monsterName?: string,
  ) => {
    const response = await api.post('/town/activities/forfeit', {
      sessionId,
      rewardId,
      ...(monsterName != null && { monsterName }),
    });
    return response.data;
  },

  // ── Location activities (garden, pirates-dock, etc.) ────────────

  getLocationStatus: async (location: string): Promise<LocationStatusResponse> => {
    const response = await api.get(`/town/activities/${location}/status`);
    return response.data;
  },

  startActivity: async (location: string, activity: string): Promise<StartActivityResponse> => {
    const response = await api.post('/town/activities/start', { location, activity });
    return response.data;
  },

  clearActivitySession: async (location: string): Promise<{ success: boolean }> => {
    const response = await api.post('/town/activities/clear-session', { location });
    return response.data;
  },

  // ── Farm ──────────────────────────────────────────────────────────

  getFarmState: async (trainerId: number | string): Promise<FarmState> => {
    const response = await api.get(`/town/farm/${trainerId}`);
    return response.data;
  },

  getFarmPrompts: async (): Promise<FarmPrompt[]> => {
    const response = await api.get('/town/farm/prompts');
    return response.data;
  },

  completeFarmWork: async (trainerId: number | string, promptId: number) => {
    const response = await api.post('/town/farm/work', {
      trainerId,
      promptId,
    });
    return response.data;
  },

  breedMonsters: async (
    trainerId: number | string,
    parent1Id: number,
    parent2Id: number,
  ) => {
    const response = await api.post('/town/farm/breed', {
      trainerId,
      parent1Id,
      parent2Id,
    });
    return response.data;
  },

  // ── Game corner ───────────────────────────────────────────────────

  generateGameCornerRewards: async (input: GameCornerRewardInput): Promise<GameCornerRewardsResponse> => {
    const response = await api.post('/town/game-corner/rewards', input);
    return response.data;
  },

  claimGameCornerReward: async (
    rewardId: string,
    trainerId: number,
    rewardData: GameCornerRewardData,
    monsterName?: string,
  ): Promise<GameCornerClaimResponse> => {
    const response = await api.post('/town/game-corner/claim', {
      rewardId,
      trainerId,
      rewardData,
      ...(monsterName != null && { monsterName }),
    });
    return response.data;
  },

  forfeitGameCornerReward: async (
    rewardData: GameCornerRewardData,
    monsterName?: string,
  ) => {
    const response = await api.post('/town/game-corner/forfeit', {
      rewardData,
      ...(monsterName != null && { monsterName }),
    });
    return response.data;
  },

  // ── Trade center (listings) ───────────────────────────────────────

  getTradeListings: async (params: TradeListingParams = {}): Promise<TradeListing[]> => {
    const response = await api.get('/town/trade-center/listings', { params });
    return response.data;
  },

  createTradeListing: async (tradeData: Partial<TradeListing>): Promise<TradeListing> => {
    const response = await api.post('/town/trade-center/listings', tradeData);
    return response.data;
  },

  getTradeDetails: async (tradeId: number | string): Promise<TradeListing> => {
    const response = await api.get(`/town/trade-center/listings/${tradeId}`);
    return response.data;
  },

  acceptTrade: async (tradeId: number | string, trainerId: number | string) => {
    const response = await api.post(`/town/trade-center/listings/${tradeId}/accept`, {
      trainerId,
    });
    return response.data;
  },

  cancelTrade: async (tradeId: number | string) => {
    const response = await api.post(`/town/trade-center/listings/${tradeId}/cancel`);
    return response.data;
  },

  // ── Events ────────────────────────────────────────────────────────

  getTownEvents: async (params: TownEventParams = {}): Promise<TownEvent[]> => {
    const response = await api.get('/town/events', { params });
    return response.data;
  },

  getTownEventDetails: async (eventId: number | string): Promise<TownEvent> => {
    const response = await api.get(`/town/events/${eventId}`);
    return response.data;
  },

  // ── Admin: Location Activity Prompts ────────────────────────────────

  adminGetPrompts: async (page = 1, limit = 200): Promise<{ prompts: LocationPrompt[]; pagination: PaginationInfo }> => {
    const response = await api.get('/town/activities/admin/prompts', { params: { page, limit } });
    const { data, total, page: p, totalPages } = response.data;
    return { prompts: data || [], pagination: { page: p, totalPages, total } };
  },

  adminCreatePrompt: async (data: {
    location: string;
    activity: string;
    prompt_text: string;
    difficulty?: string;
  }): Promise<{ success: boolean; prompt: LocationPrompt }> => {
    const response = await api.post('/town/activities/admin/prompts', data);
    return response.data;
  },

  adminUpdatePrompt: async (
    id: number,
    data: { prompt_text?: string; difficulty?: string | null },
  ): Promise<{ success: boolean; prompt: LocationPrompt }> => {
    const response = await api.put(`/town/activities/admin/prompts/${id}`, data);
    return response.data;
  },

  adminDeletePrompt: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/town/activities/admin/prompts/${id}`);
    return response.data;
  },

  // ── Admin: Location Activity Flavors ────────────────────────────────

  adminGetFlavors: async (page = 1, limit = 200): Promise<{ flavors: LocationFlavor[]; pagination: PaginationInfo }> => {
    const response = await api.get('/town/activities/admin/flavors', { params: { page, limit } });
    const { data, total, page: p, totalPages } = response.data;
    return { flavors: data || [], pagination: { page: p, totalPages, total } };
  },

  adminCreateFlavor: async (data: {
    location: string;
    image_url?: string;
    flavor_text?: string;
  }): Promise<{ success: boolean; flavor: LocationFlavor }> => {
    const response = await api.post('/town/activities/admin/flavors', data);
    return response.data;
  },

  adminUpdateFlavor: async (
    id: number,
    data: { image_url?: string | null; flavor_text?: string | null },
  ): Promise<{ success: boolean; flavor: LocationFlavor }> => {
    const response = await api.put(`/town/activities/admin/flavors/${id}`, data);
    return response.data;
  },

  adminDeleteFlavor: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/town/activities/admin/flavors/${id}`);
    return response.data;
  },

  // ── Admin: Garden Points Management ─────────────────────────────────

  adminGetAllGardenPoints: async (params: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{
    data: Array<{
      id: number;
      userId: number;
      points: number;
      lastHarvested: string | null;
      createdAt: string;
      updatedAt: string;
      username: string | null;
      display_name: string | null;
      discord_id: string | null;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get('/garden/admin/all', { params });
    return response.data;
  },

  adminSetGardenPoints: async (userId: number, points: number): Promise<{ success: boolean; data: unknown }> => {
    const response = await api.put(`/garden/admin/${userId}/points`, { points });
    return response.data;
  },

  adminAdjustGardenPoints: async (userId: number, amount: number): Promise<{ success: boolean; data: unknown }> => {
    const response = await api.post(`/garden/admin/${userId}/adjust`, { amount });
    return response.data;
  },
};

export default townService;
