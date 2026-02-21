// Nursery type definitions

/** Monster data from hatching — compatible with MonsterCard's Monster interface */
export interface NurseryMonster {
  id?: number | string;
  name?: string;
  level?: number;
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
  type_primary?: string;
  type_secondary?: string;
  attribute?: string;
  monster_type?: string;
  rank?: string;
  stage?: string;
  img_link?: string;
  image_url?: string;
  gender?: string;
  nature?: string;
  species?: string;
  species_name?: string;
}

export interface HatchedEgg {
  eggId: number;
  monsters: NurseryMonster[];
  seed: string;
}

export interface SpecialBerryInventory {
  'Forget-Me-Not': number;
  'Edenwiess': number;
}

export interface SelectedMonsterInfo {
  monsterIndex: number;
  monsterId: number;
  monsterName: string;
  selectedAt: string;
}

export interface HatchSession {
  sessionId: string;
  userId: string;
  trainerId: number;
  type: 'hatch' | 'nurture';
  eggCount: number;
  useIncubator: boolean;
  imageUrl: string | null;
  selectedItems: Record<string, number>;
  hatchedEggs: HatchedEgg[];
  selectedMonsters: Record<string, SelectedMonsterInfo>;
  claimedMonsters: string[];
  specialBerries: SpecialBerryInventory;
  createdAt: string;
}

export interface SpeciesInputs {
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

export interface EggItemCategories {
  poolFilters: string[];
  outcomeModifiers: string[];
  iceCreams: string[];
  speciesControls: string[];
  incubators: string[];
}

// API response types

export interface EggsResponse {
  success: boolean;
  eggs: Record<string, number>;
  trainer?: { id: number; name: string };
}

export interface EggItemsResponse {
  success: boolean;
  items: Record<string, number>;
  categories?: EggItemCategories;
}

export interface HatchResponse {
  success: boolean;
  sessionId: string;
  hatchedEggs: HatchedEgg[];
  specialBerries: SpecialBerryInventory;
  message?: string;
}

export interface SessionResponse {
  success: boolean;
  session: HatchSession;
  message?: string;
}

export interface SelectMonsterResponse {
  success: boolean;
  message: string;
  monster: NurseryMonster & { id: number; name: string };
  session: {
    sessionId: string;
    selectedMonsters: Record<string, SelectedMonsterInfo>;
    claimedMonsters: string[];
    totalEggs: number;
    selectedCount: number;
  };
  specialBerries: SpecialBerryInventory;
}

export interface RerollResponse {
  success: boolean;
  sessionId: string;
  hatchedEggs: HatchedEgg[];
  specialBerries: SpecialBerryInventory;
  session?: HatchSession;
  message?: string;
}
