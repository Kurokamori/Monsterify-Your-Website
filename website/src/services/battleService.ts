import api from './api';

// --- Types ---

export interface BattleTeam {
  id: number;
  trainerId: number;
  name: string;
  description?: string | null;
  monsterIds: number[];
  isPublic?: boolean;
  [key: string]: unknown;
}

export interface BattleTeamWithTrainer {
  id: number;
  trainerId: number;
  name: string;
  description?: string | null;
  monsterIds: number[];
  trainerName: string;
  trainerImage?: string | null;
}

/** A value for each of the six stats — used for both IV and EV spreads. */
export interface StatSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/**
 * The authored stat inputs for a generated battle monster. These feed the same
 * stat curve player-owned monsters use, so they are inputs (nature/IVs/EVs), not
 * final totals. Omitted entirely on a spec that has never been tuned, in which
 * case the server applies its medium/balanced preset.
 */
export interface BattleStatSpec {
  nature: string;
  ivs: StatSpread;
  evs: StatSpread;
}

export interface GymLeaderTeamMonster {
  name: string;
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  /** One of MONSTER_GENDERS, or null/'' when the author left it unset. */
  gender?: string | null;
  level: number;
  imgLink?: string | null;
  moves?: string[];
  stats?: BattleStatSpec | null;
}

/** Stat totals produced by a spec at a level. Always computed server-side. */
export interface SpecStatTotals {
  hp_total: number;
  atk_total: number;
  def_total: number;
  spa_total: number;
  spd_total: number;
  spe_total: number;
}

export interface SpecMonsterStatPreview {
  level: number;
  stats: BattleStatSpec;
  totals: SpecStatTotals;
  /** Starting/max HP the monster will actually have in battle. */
  battleHp: number;
}

/** The presets and bounds the stat editor renders its controls from. */
export interface SpecStatPresets {
  difficulties: Array<{
    value: string;
    label: string;
    evBudget: number;
    ivFloor: number;
    ivCeiling: number;
  }>;
  roles: Array<{ value: string; label: string; description: string }>;
  natures: string[];
  bounds: { maxIv: number; maxEvPerStat: number; maxEvTotal: number };
  defaults: { difficulty: string; role: string };
}

/** Optional per-trainer / per-leader battle dialogue (authored in the gym manager). */
export interface BattleDialogue {
  intro?: string[];
  win?: string[];
  loss?: string[];
  generic?: string[];
  talkingSprite?: string | null;
}

export interface GauntletTrainer {
  name: string;
  imgLink?: string | null;
  team: GymLeaderTeamMonster[];
  trainerId?: number | null;
  monsterIds?: number[];
  dialogue?: BattleDialogue | null;
  backgroundAssetId?: number | null;
  backgroundRandom?: boolean;
  spotAssetId?: number | null;
  spotRandom?: boolean;
}

// ── Battle visual assets (backgrounds / place-spots / text-box skins) ──

export type BattleAssetKind = 'background' | 'spot' | 'textbox';

export interface BattleAsset {
  id: number;
  kind: BattleAssetKind;
  name: string;
  imgLink: string;
  sliceInset?: number | null;
  /** Draw with nearest-neighbour scaling (image-rendering: pixelated) for pixel art. */
  pixelated?: boolean;
  isActive: boolean;
}

export type BattleAssetInput = {
  kind: BattleAssetKind;
  name: string;
  imgLink: string;
  sliceInset?: number | null;
  pixelated?: boolean;
  isActive?: boolean;
};

/**
 * Resolved battle scenery sent with the live battle state.
 *
 * The pixelated flags are optional because scenery is frozen into battle_data when
 * a battle is created: fights started before the flag existed simply omit them.
 */
export interface BattleAppearance {
  backgroundUrl: string | null;
  backgroundPixelated?: boolean;
  spotUrl: string | null;
  spotPixelated?: boolean;
  textboxUrl: string | null;
  textboxSlice: number | null;
  textboxPixelated?: boolean;
}

/** Resolved opponent dialogue sent with the live battle state. */
export interface BattleDialogueView {
  intro: string[];
  win: string[];
  loss: string[];
  generic: string[];
  sprite: string | null;
}

/**
 * The class of an authored battle:
 * - `ai`: standalone AI battle / gauntlet, no badge.
 * - `gym`: badge gym.
 * - `league`: awards a league badge; locked until every gym badge is earned.
 * - `champion`: awards the champion badge; locked until every gym + league badge is earned.
 */
export type GymKind = 'ai' | 'gym' | 'league' | 'champion';

export interface Gym {
  id: number;
  name: string;
  description?: string | null;
  typeTheme: string;
  badgeName: string;
  badgeImgLink?: string | null;
  leaderName: string;
  leaderImgLink?: string | null;
  leaderTeam: GymLeaderTeamMonster[];
  gauntletTrainers: GauntletTrainer[];
  /** true = badge gym/league/champion; false = admin-authored AI battle. */
  isGym?: boolean;
  gymKind: GymKind;
  winReward: number;
  lossPenalty: number;
  displayOrder: number;
  earned: boolean;
  /** league/champion battles the trainer has not yet unlocked. */
  locked?: boolean;
  lockReason?: string | null;
}

// ── Admin gym / AI-battle authoring ─────────────────────────────────

export interface AdminGym {
  id: number;
  name: string;
  description?: string | null;
  typeTheme?: string | null;
  badgeName: string;
  badgeImgLink?: string | null;
  leaderName: string;
  leaderImgLink?: string | null;
  leaderTeam: GymLeaderTeamMonster[];
  gauntletTrainers: GauntletTrainer[];
  isGym: boolean;
  gymKind: GymKind;
  leaderTrainerId?: number | null;
  leaderMonsterIds?: number[];
  leaderDialogue?: BattleDialogue | null;
  backgroundAssetId?: number | null;
  backgroundRandom?: boolean;
  spotAssetId?: number | null;
  spotRandom?: boolean;
  textboxAssetId?: number | null;
  winReward: number;
  lossPenalty: number;
  displayOrder: number;
  isActive: boolean;
}

export type AdminGymInput = Omit<AdminGym, 'id'>;

export interface TrainerBadge {
  id: number;
  gymId: number;
  gymName: string;
  badgeName: string;
  badgeImgLink?: string | null;
  typeTheme: string;
  leaderName: string;
  earnedAt: string;
  badgeKind: GymKind;
}

export type BattleDifficulty = 'easy' | 'medium' | 'hard';

export interface BattleParticipant {
  id: number;
  trainerId: number | null;
  trainerName: string;
  trainerImage?: string | null;
  teamSide: 'players' | 'opponents';
  participantType: string;
  isYou: boolean;
}

/**
 * The seven stat stages a monster can carry in battle. Mirrors BATTLE_STAT_STAGE_KEYS
 * on the backend, which is the whitelist the state view is built from.
 */
export const BATTLE_STAT_STAGE_KEYS = [
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
  'accuracy',
  'evasion',
] as const;

export type BattleStatStageKey = typeof BATTLE_STAT_STAGE_KEYS[number];

/** Stage values, -6..+6. Only stats that are actually modified are present. */
export type BattleStatStages = Partial<Record<BattleStatStageKey, number>>;

export interface BattleMonster {
  id: number; // battleMonsterId
  monsterId: number;
  participantId: number;
  name: string;
  /** The species, joined with "/". */
  species: string;
  /** The same species, unjoined (up to 3). Absent on battles started before it existed. */
  speciesList?: string[];
  types: string[];
  attribute?: string | null;
  /** Frozen at battle creation — null for battles that predate it, and for unauthored specs. */
  gender?: string | null;
  level: number;
  currentHp: number;
  maxHp: number;
  isActive: boolean;
  isFainted: boolean;
  teamSide: 'players' | 'opponents';
  imgLink?: string | null;
  backSprite?: string | null;
  statusEffects: string[];
  statStages?: BattleStatStages;
  moves?: string[]; // only present for YOUR monsters
}

export interface BattleMove {
  moveName: string;
  moveType: string;
  moveCategory: 'Physical' | 'Special' | 'Status';
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number | null;
  description?: string | null;
}

export interface BattleLogEntry {
  id: number;
  message: string;
  createdAt: string;
}

/**
 * A recorded action, trimmed to what the arena needs to animate it. Mirrors
 * WebBattleTurnView on the backend.
 *
 * The actor matters: it cannot be inferred from an HP diff, because end-of-turn chip
 * damage (burn, poison) drops HP with nobody attacking.
 */
export interface BattleTurnView {
  id: number;
  turnNumber: number;
  actionType: string;
  actorMonsterId: number | null;
  actorSide: 'players' | 'opponents' | null;
  targetMonsterId: number | null;
  moveName: string | null;
  damageDealt: number;
}

export interface BattleLevelReward {
  monsterId: number;
  name: string;
  levels: number;
  newLevel: number;
}

/** In a mock battle each side is driven either by the owning user or by the AI. */
export type MockSideControl = 'user' | 'ai';

/** Mock-battle outcome: which of the owner's trainers won (no rewards). */
export interface BattleMockResult {
  winnerSide: 'players' | 'opponents' | 'draw' | null;
  winnerLabel: string | null;
}

/**
 * The live control picture for a mock battle. Both trainers belong to the owner,
 * and each side is controlled by the user (hotseat) or the AI.
 */
export interface WebBattleMockView {
  playersControl: MockSideControl;
  opponentsControl: MockSideControl;
  playersLabel: string;
  opponentsLabel: string;
  turnSide: 'players' | 'opponents';
  /** The side the user should act for right now (null while an AI turn is up). */
  controlledSide: 'players' | 'opponents' | null;
  /** True when the active side is AI-controlled and the user should advance it. */
  awaitingStep: boolean;
}

export interface BattleSettlement {
  won: boolean;
  currencyDelta: number;
  levelRewards?: BattleLevelReward[];
  badge: {
    gymName: string;
    badgeName: string;
    badgeImgLink?: string | null;
  } | null;
  gauntlet: {
    runId: number;
    status: string;
    currentStage: number;
    totalStages: number;
    nextBattleId: number | null;
  } | null;
  /** Present only for mock battles. */
  mock?: BattleMockResult | null;
}

export interface BattleStage {
  gymId: number;
  stageType: 'trainer' | 'leader';
  stageNumber: number;
  totalStages: number;
}

export interface WebBattleStateView {
  battleId: number;
  status: 'active' | 'completed' | 'cancelled';
  mode: 'friendly' | 'gauntlet' | 'pvp' | 'mock';
  pending: boolean;
  winnerType: 'players' | 'opponents' | 'draw' | null;
  yourSide: 'players' | 'opponents' | null;
  isYourTurn: boolean;
  mustSwitch: boolean;
  opponentLabel: string;
  winReward: number;
  lossPenalty: number;
  stage: BattleStage | null;
  appearance: BattleAppearance | null;
  dialogue: BattleDialogueView | null;
  participants: BattleParticipant[];
  monsters: BattleMonster[];
  activeMoves: BattleMove[];
  logs: BattleLogEntry[]; // newest first
  /** The last few actions, oldest-first. Absent on battles served by an older backend. */
  recentTurns?: BattleTurnView[];
  settlement: BattleSettlement | null;
  /** Present only for mock battles: the two-sided control/turn picture. */
  mock?: WebBattleMockView | null;
}

export interface IncomingChallenge {
  battleId: number;
  challengerName: string;
  createdAt: string;
}

export interface MyBattleSummary {
  battleId: number;
  mode: 'friendly' | 'gauntlet' | 'pvp' | 'mock';
  opponentLabel: string;
  pending: boolean;
  isYourTurn: boolean;
  createdAt: string;
}

export type BattleAction =
  | { type: 'move'; moveName: string }
  | { type: 'switch'; battleMonsterId: number }
  | { type: 'forfeit' }
  | { type: 'advance' };

export interface StartMockBattleInput {
  playersTrainerId: number;
  playersMonsterIds: number[];
  opponentsTrainerId: number;
  opponentsMonsterIds: number[];
  playersControl: MockSideControl;
  opponentsControl: MockSideControl;
  difficulty?: BattleDifficulty;
}

export interface BattleActionResult {
  success: boolean;
  message?: string;
  battleEnded?: boolean;
  state: WebBattleStateView;
}

// --- Service ---

const battleService = {
  // ── Teams ──────────────────────────────────────────────────────────

  getTeams: async (trainerId: number | string): Promise<BattleTeam[]> => {
    const response = await api.get('/battle/teams', { params: { trainerId } });
    return response.data.teams || [];
  },

  createTeam: async (data: {
    trainerId: number;
    name: string;
    description?: string;
    monsterIds: number[];
    isPublic?: boolean;
  }): Promise<BattleTeam> => {
    const response = await api.post('/battle/teams', data);
    return response.data.team;
  },

  updateTeam: async (teamId: number, data: {
    name?: string;
    description?: string;
    monsterIds?: number[];
    isPublic?: boolean;
  }): Promise<BattleTeam> => {
    const response = await api.put(`/battle/teams/${teamId}`, data);
    return response.data.team;
  },

  deleteTeam: async (teamId: number): Promise<void> => {
    await api.delete(`/battle/teams/${teamId}`);
  },

  getOpponentTeams: async (): Promise<BattleTeamWithTrainer[]> => {
    const response = await api.get('/battle/opponents');
    return response.data.teams || [];
  },

  // ── Gyms / Badges ──────────────────────────────────────────────────

  getGyms: async (trainerId: number | string): Promise<Gym[]> => {
    const response = await api.get('/battle/gyms', { params: { trainerId } });
    return response.data.gyms || [];
  },

  getTrainerBadges: async (trainerId: number | string): Promise<TrainerBadge[]> => {
    const response = await api.get(`/battle/badges/trainer/${trainerId}`);
    return response.data.badges || [];
  },

  // ── Admin: gym / AI-battle CRUD ────────────────────────────────────

  adminListGyms: async (): Promise<AdminGym[]> => {
    const response = await api.get('/battle/admin/gyms');
    return response.data.gyms || [];
  },

  adminCreateGym: async (data: AdminGymInput): Promise<AdminGym> => {
    const response = await api.post('/battle/admin/gyms', data);
    return response.data.gym;
  },

  adminUpdateGym: async (gymId: number, data: Partial<AdminGymInput>): Promise<AdminGym> => {
    const response = await api.put(`/battle/admin/gyms/${gymId}`, data);
    return response.data.gym;
  },

  adminDeleteGym: async (gymId: number): Promise<void> => {
    await api.delete(`/battle/admin/gyms/${gymId}`);
  },

  // ── Admin: generated-monster stat authoring ────────────────────────
  //
  // The stat curve lives on the server; these endpoints are the only source of
  // computed totals, so what a designer previews is what the battle uses.

  adminGetSpecStatPresets: async (): Promise<SpecStatPresets> => {
    const response = await api.get('/battle/admin/spec-stats/presets');
    return response.data;
  },

  adminRollSpecStats: async (
    level: number,
    difficulty: string,
    role: string
  ): Promise<SpecMonsterStatPreview> => {
    const response = await api.post('/battle/admin/spec-stats/roll', { level, difficulty, role });
    return response.data.preview;
  },

  adminPreviewSpecStats: async (
    level: number,
    stats: BattleStatSpec | null
  ): Promise<SpecMonsterStatPreview> => {
    const response = await api.post('/battle/admin/spec-stats/preview', { level, stats });
    return response.data.preview;
  },

  // ── Admin: battle visual assets ────────────────────────────────────

  adminListAssets: async (): Promise<BattleAsset[]> => {
    const response = await api.get('/battle/admin/assets');
    return response.data.assets || [];
  },

  adminCreateAsset: async (data: BattleAssetInput): Promise<BattleAsset> => {
    const response = await api.post('/battle/admin/assets', data);
    return response.data.asset;
  },

  adminUpdateAsset: async (assetId: number, data: Partial<BattleAssetInput>): Promise<BattleAsset> => {
    const response = await api.put(`/battle/admin/assets/${assetId}`, data);
    return response.data.asset;
  },

  adminDeleteAsset: async (assetId: number): Promise<void> => {
    await api.delete(`/battle/admin/assets/${assetId}`);
  },

  // ── Battles ────────────────────────────────────────────────────────

  startBattle: async (data: {
    trainerId: number;
    monsterIds: number[];
    opponentTeamId: number;
    difficulty?: BattleDifficulty;
  }): Promise<WebBattleStateView> => {
    const response = await api.post('/battle/start', data);
    return response.data.state;
  },

  startMockBattle: async (data: StartMockBattleInput): Promise<WebBattleStateView> => {
    const response = await api.post('/battle/mock/start', data);
    return response.data.state;
  },

  startGauntlet: async (data: {
    trainerId: number;
    monsterIds: number[];
    gymId: number;
  }): Promise<WebBattleStateView> => {
    const response = await api.post('/battle/gauntlet/start', data);
    return response.data.state;
  },

  challengePvp: async (data: {
    trainerId: number;
    monsterIds: number[];
    opponentTrainerId: number;
  }): Promise<WebBattleStateView> => {
    const response = await api.post('/battle/pvp/challenge', data);
    return response.data.state;
  },

  acceptPvp: async (battleId: number, data: {
    trainerId: number;
    monsterIds: number[];
  }): Promise<WebBattleStateView> => {
    const response = await api.post(`/battle/pvp/${battleId}/accept`, data);
    return response.data.state;
  },

  declinePvp: async (battleId: number): Promise<void> => {
    await api.post(`/battle/pvp/${battleId}/decline`);
  },

  getIncomingChallenges: async (): Promise<IncomingChallenge[]> => {
    const response = await api.get('/battle/pvp/incoming');
    return response.data.challenges || [];
  },

  getMyBattles: async (): Promise<MyBattleSummary[]> => {
    const response = await api.get('/battle/mine');
    return response.data.battles || [];
  },

  getBattleState: async (battleId: number | string): Promise<WebBattleStateView> => {
    const response = await api.get(`/battle/${battleId}/state`);
    return response.data.state;
  },

  sendAction: async (battleId: number | string, action: BattleAction): Promise<BattleActionResult> => {
    const response = await api.post(`/battle/${battleId}/action`, action);
    return response.data;
  },
};

export default battleService;
