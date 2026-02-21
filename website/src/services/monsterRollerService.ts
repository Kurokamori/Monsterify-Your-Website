import api from './api';
import { MONSTER_TYPES, MONSTER_ATTRIBUTES } from '../utils/staticValues';

// --- Types ---

export type RollContext = 'starter' | 'adoption' | 'event' | 'item' | 'breeding';

export const MONSTER_SOURCES = [
  'Pokemon', 'Digimon', 'Yokai', 'Pals', 'Nexomon',
] as const;

export type MonsterSource = typeof MONSTER_SOURCES[number];

export interface RollParams {
  enabledTypes?: readonly string[] | string[];
  allowedMonsters?: readonly string[] | string[];
  excludedMonsters?: string[];
  minTypes?: number;
  maxTypes?: number;
  userId?: number | string;
  context?: string;
  rarityBoost?: number;
  legendaryEnabled?: boolean;
  mythicalEnabled?: boolean;
  [key: string]: unknown;
}

export interface RolledMonster {
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
  [key: string]: unknown;
}

export interface RollResult {
  success: boolean;
  monster?: RolledMonster;
  message?: string;
  [key: string]: unknown;
}

export interface InitializeMonsterResult {
  success: boolean;
  monster?: RolledMonster;
  message?: string;
  [key: string]: unknown;
}

export interface StarterRollResult {
  success: boolean;
  monsters?: RolledMonster[];
  message?: string;
  [key: string]: unknown;
}

// Starter monster with all fields needed for StarterMonsterCard display
export interface StarterMonster {
  id?: number | string;
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  species1_image?: string;
  species2_image?: string;
  species3_image?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  img_link?: string;
  image_url?: string;
  species_images?: string | Record<string, string>;
}

export interface StarterSet {
  setId: number;
  seed: string;
  monsters: StarterMonster[];
}

export interface StarterRollSetsResponse {
  success: boolean;
  data?: StarterSet[];
  seed?: string;
  message?: string;
}

export interface SelectedStarter {
  monster: StarterMonster;
  name: string;
}

export interface StarterSelectResponse {
  success: boolean;
  data?: {
    trainer: Record<string, unknown>;
    monsters: StarterMonster[];
  };
  message?: string;
}

export interface RollerSettings {
  enabledTypes: string[];
  allowedMonsters: string[];
  excludedMonsters: string[];
  rarityBoost: number;
  legendaryEnabled: boolean;
  mythicalEnabled: boolean;
  [key: string]: unknown;
}

// Default settings used as fallback
const DEFAULT_ROLLER_SETTINGS: RollerSettings = {
  enabledTypes: [...MONSTER_SOURCES],
  allowedMonsters: [...MONSTER_SOURCES],
  excludedMonsters: [],
  rarityBoost: 0,
  legendaryEnabled: false,
  mythicalEnabled: false,
};

// --- Service ---

const monsterRollerService = {
  // Roll a new monster
  rollMonster: async (rollParams: RollParams = {}): Promise<RollResult> => {
    const response = await api.post('/monsters/roll', rollParams);
    return response.data;
  },

  // Initialize a monster for a trainer
  initializeMonster: async (
    trainerId: number | string,
    monster: RolledMonster,
    options: Record<string, unknown> = {},
  ): Promise<InitializeMonsterResult> => {
    const response = await api.post('/monsters/initialize', {
      trainerId,
      monster,
      ...options,
    });
    return response.data;
  },

  // Roll starter monsters for a new trainer
  rollStarterMonsters: async (
    trainerId: number | string,
    userSettings: Partial<RollerSettings> = {},
  ): Promise<StarterRollResult> => {
    const response = await api.post('/monsters/roll-starters', {
      trainerId,
      userSettings,
    });
    return response.data;
  },

  // Roll 3 sets of starter monsters for the selection wizard
  rollStarterSets: async (): Promise<StarterRollSetsResponse> => {
    const response = await api.post('/starter-roller/roll', {});
    return response.data;
  },

  // Submit selected starters for a trainer
  selectStarters: async (
    trainerId: number | string,
    selectedStarters: SelectedStarter[],
  ): Promise<StarterSelectResponse> => {
    const response = await api.post('/starter-roller/select', {
      trainerId,
      selectedStarters,
    });
    return response.data;
  },

  // Get available monster types
  getMonsterTypes: async (): Promise<readonly string[]> => {
    try {
      const response = await api.get('/monsters/types');
      return response.data;
    } catch {
      return MONSTER_TYPES;
    }
  },

  // Get available monster attributes
  getMonsterAttributes: async (): Promise<readonly string[]> => {
    try {
      const response = await api.get('/monsters/attributes');
      return response.data;
    } catch {
      return MONSTER_ATTRIBUTES;
    }
  },

  // Get available monster sources
  getMonsterSources: async (): Promise<readonly string[]> => {
    try {
      const response = await api.get('/monsters/sources');
      return response.data;
    } catch {
      return MONSTER_SOURCES;
    }
  },

  // Get user's monster roller settings
  getUserRollerSettings: async (): Promise<RollerSettings> => {
    try {
      const response = await api.get('/users/roller-settings');
      return response.data;
    } catch {
      return { ...DEFAULT_ROLLER_SETTINGS };
    }
  },

  // Update user's monster roller settings
  updateUserRollerSettings: async (settings: Partial<RollerSettings>): Promise<RollerSettings> => {
    const response = await api.put('/users/roller-settings', settings);
    return response.data;
  },

  // Build default roll parameters based on context
  buildDefaultRollParams: (
    context: RollContext,
    userSettings: Partial<RollerSettings> = {},
  ): RollParams => {
    const baseParams: RollParams = {
      enabledTypes: userSettings.enabledTypes || [...MONSTER_SOURCES],
      allowedMonsters: userSettings.allowedMonsters || [...MONSTER_SOURCES],
      excludedMonsters: userSettings.excludedMonsters || [],
      minTypes: 1,
      maxTypes: 2,
      userId: (userSettings as Record<string, unknown>).userId as number | undefined ?? 1,
      context,
    };

    switch (context) {
      case 'starter':
        return { ...baseParams, rarityBoost: 0, legendaryEnabled: false, mythicalEnabled: false };
      case 'adoption':
        return { ...baseParams, rarityBoost: 1, legendaryEnabled: false, mythicalEnabled: false };
      case 'event':
        return { ...baseParams, rarityBoost: 2, legendaryEnabled: true, mythicalEnabled: false };
      case 'item':
        return { ...baseParams, rarityBoost: 3, legendaryEnabled: true, mythicalEnabled: true };
      case 'breeding':
        return { ...baseParams, rarityBoost: 1, legendaryEnabled: false, mythicalEnabled: false };
      default:
        return baseParams;
    }
  },
};

export default monsterRollerService;
