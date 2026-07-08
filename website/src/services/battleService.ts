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
  level: number;
  imgLink?: string | null;
  moves?: string[];
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
  isActive: boolean;
}

export type BattleAssetInput = {
  kind: BattleAssetKind;
  name: string;
  imgLink: string;
  sliceInset?: number | null;
  isActive?: boolean;
};

/** Resolved battle scenery sent with the live battle state. */
export interface BattleAppearance {
  backgroundUrl: string | null;
  spotUrl: string | null;
  textboxUrl: string | null;
  textboxSlice: number | null;
}

/** Resolved opponent dialogue sent with the live battle state. */
export interface BattleDialogueView {
  intro: string[];
  win: string[];
  loss: string[];
  generic: string[];
  sprite: string | null;
}

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
  /** true = badge gym; false = admin-authored AI battle (one-off or gauntlet). */
  isGym?: boolean;
  winReward: number;
  lossPenalty: number;
  displayOrder: number;
  earned: boolean;
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

export interface BattleMonster {
  id: number; // battleMonsterId
  monsterId: number;
  participantId: number;
  name: string;
  species: string;
  types: string[];
  level: number;
  currentHp: number;
  maxHp: number;
  isActive: boolean;
  isFainted: boolean;
  teamSide: 'players' | 'opponents';
  imgLink?: string | null;
  backSprite?: string | null;
  statusEffects: string[];
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

export interface BattleLevelReward {
  monsterId: number;
  name: string;
  levels: number;
  newLevel: number;
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
  mode: 'friendly' | 'gauntlet' | 'pvp';
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
  settlement: BattleSettlement | null;
}

export interface IncomingChallenge {
  battleId: number;
  challengerName: string;
  createdAt: string;
}

export interface MyBattleSummary {
  battleId: number;
  mode: 'friendly' | 'gauntlet' | 'pvp';
  opponentLabel: string;
  pending: boolean;
  isYourTurn: boolean;
  createdAt: string;
}

export type BattleAction =
  | { type: 'move'; moveName: string }
  | { type: 'switch'; battleMonsterId: number }
  | { type: 'forfeit' };

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
