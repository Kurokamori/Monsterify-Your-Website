// ============================================================================
// API response wrappers — shapes returned by the backend HTTP API.
// ============================================================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

// ============================================================================
// Endpoint-specific request / response shapes
// ============================================================================

// -- Account -----------------------------------------------------------------

export interface LinkAccountRequest {
  discordUserId: string;
  discordUsername: string;
}

// -- Adventure ---------------------------------------------------------------

export interface CreateThreadRequest {
  adventureId: number;
  discordThreadId: string;
  discordChannelId: string;
  threadName: string;
}

export interface TrackMessageRequest {
  discordThreadId: string;
  discordUserId: string;
  wordCount: number;
  messageCount: number;
}

export interface GenerateEncounterRequest {
  adventureId: number;
  discordUserId: string;
}

export interface CaptureRequest {
  adventureId: number;
  discordUserId: string;
  trainerName: string;
  pokeballType: string;
  pokepuffCount: number;
  monsterIndex: number;
  isBattleCapture: boolean;
}

export interface EndAdventureRequest {
  adventureId: number;
  discordUserId: string;
}

// -- Battle ------------------------------------------------------------------

export interface InitiateBattleRequest {
  adventureId: number;
  discordUserId: string;
  trainerName: string;
}

export interface AttackRequest {
  adventureId: number;
  discordUserId: string;
  moveName: string;
  targetName: string;
  message: string;
  attackerName?: string;
}

export interface UseItemRequest {
  adventureId: number;
  discordUserId: string;
  itemName: string;
  targetName: string;
  message: string;
}

export interface ReleaseWithdrawRequest {
  adventureId: number;
  discordUserId: string;
  monsterName: string;
  monsterIndex: number;
  message: string;
}

export interface SetWeatherRequest {
  adventureId: number;
  discordUserId: string;
  weather: string;
}

export interface SetTerrainRequest {
  adventureId: number;
  discordUserId: string;
  terrain: string;
}

export interface FleeOrForfeitRequest {
  adventureId: number;
  discordUserId: string;
  message: string;
}

export interface ForceResultRequest {
  adventureId: number;
  discordUserId: string;
  message: string;
}

export interface WinConditionRequest {
  adventureId: number;
  discordUserId: string;
  count: number;
}

export interface PvpBattleRequest {
  adventureId: number;
  discordUserId: string;
  trainerName: string;
  opponentTrainers: string[];
  opponentIds: string[];
}

// -- Shop / Items ------------------------------------------------------------

export interface PurchaseItemRequest {
  quantity: number;
  trainerId: number;
}

export interface UseItemOnTargetRequest {
  targetId: number;
  trainerId: number;
}

export interface PurchaseResult {
  success: boolean;
  itemName: string;
  quantity: number;
  totalCost: number;
  newBalance: number;
  message?: string;
}

// -- Trade -------------------------------------------------------------------

export interface CreateTradeRequest {
  offerTrainerId: number;
  receiveTrainerId: number;
  offerItems: Array<{ itemName: string; category: string; quantity: number }>;
  receiveItems: Array<{ itemName: string; category: string; quantity: number }>;
  offerMonsterIds: number[];
  receiveMonsterIds: number[];
  offerCurrency: number;
  receiveCurrency: number;
  message?: string;
}

// -- Town Activities ---------------------------------------------------------

export interface ClaimRewardRequest {
  rewardId: string;
  trainerId: number;
}

export interface ClaimResult {
  success: boolean;
  message?: string;
}
