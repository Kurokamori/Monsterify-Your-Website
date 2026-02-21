// ============================================================================
// Value-type enums — mirrors of the backend constants the bot needs for
// command choices, display, and validating API payloads.
// ============================================================================

// -- Monster Types -----------------------------------------------------------

export const MonsterType = {
  NORMAL: 'Normal',
  FIRE: 'Fire',
  WATER: 'Water',
  ELECTRIC: 'Electric',
  GRASS: 'Grass',
  ICE: 'Ice',
  FIGHTING: 'Fighting',
  POISON: 'Poison',
  GROUND: 'Ground',
  FLYING: 'Flying',
  PSYCHIC: 'Psychic',
  BUG: 'Bug',
  ROCK: 'Rock',
  GHOST: 'Ghost',
  DRAGON: 'Dragon',
  DARK: 'Dark',
  STEEL: 'Steel',
  FAIRY: 'Fairy',
} as const;

export type MonsterTypeValue = (typeof MonsterType)[keyof typeof MonsterType];

// -- Gender ------------------------------------------------------------------

export const Gender = {
  MALE: 'Male',
  FEMALE: 'Female',
  NON_BINARY: 'Non-binary',
  GENDERLESS: 'Genderless',
} as const;

export type GenderValue = (typeof Gender)[keyof typeof Gender];

// -- Monster Attributes ------------------------------------------------------

export const EvolutionStage = {
  BASE_STAGE: 'Base Stage',
  MIDDLE_STAGE: 'Middle Stage',
  FINAL_STAGE: 'Final Stage',
} as const;

export type EvolutionStageValue = (typeof EvolutionStage)[keyof typeof EvolutionStage];

export const DigimonRank = {
  BABY_I: 'Baby I',
  BABY_II: 'Baby II',
  CHILD: 'Child',
  ADULT: 'Adult',
  PERFECT: 'Perfect',
  ULTIMATE: 'Ultimate',
} as const;

export type DigimonRankValue = (typeof DigimonRank)[keyof typeof DigimonRank];

export const MonsterGrade = {
  E: 'E',
  D: 'D',
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
} as const;

export type MonsterGradeValue = (typeof MonsterGrade)[keyof typeof MonsterGrade];

export type MonsterAttributeValue =
  | EvolutionStageValue
  | DigimonRankValue
  | MonsterGradeValue;

// -- Weather & Terrain -------------------------------------------------------

export const Weather = {
  CLEAR: 'clear',
  RAIN: 'rain',
  SUNNY: 'sunny',
  SNOW: 'snow',
  SANDSTORM: 'sandstorm',
  HAIL: 'hail',
  FOG: 'fog',
  THUNDERSTORM: 'thunderstorm',
  WIND: 'wind',
} as const;

export type WeatherValue = (typeof Weather)[keyof typeof Weather];

export const Terrain = {
  NORMAL: 'normal',
  ELECTRIC: 'electric',
  GRASSY: 'grassy',
  MISTY: 'misty',
  PSYCHIC: 'psychic',
} as const;

export type TerrainValue = (typeof Terrain)[keyof typeof Terrain];

// -- Item Categories ---------------------------------------------------------

export const ItemCategory = {
  BALLS: 'balls',
  BERRIES: 'berries',
  PASTRIES: 'pastries',
  EVOLUTION: 'evolution',
  HELD_ITEMS: 'helditems',
  ITEMS: 'items',
  KEY_ITEMS: 'keyitems',
  SEALS: 'seals',
  EGGS: 'eggs',
  ANTIQUES: 'antiques',
} as const;

export type ItemCategoryValue = (typeof ItemCategory)[keyof typeof ItemCategory];

// -- Battle ------------------------------------------------------------------

export const BattleStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type BattleStatusValue = (typeof BattleStatus)[keyof typeof BattleStatus];

export const BattleType = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
  TRIPLES: 'triples',
  ROTATION: 'rotation',
  WILD: 'wild',
  TRAINER: 'trainer',
} as const;

export type BattleTypeValue = (typeof BattleType)[keyof typeof BattleType];

export const BattleActionType = {
  ATTACK: 'attack',
  SWITCH: 'switch',
  ITEM: 'item',
  CAPTURE: 'capture',
  FLEE: 'flee',
  SKIP: 'skip',
} as const;

export type BattleActionTypeValue = (typeof BattleActionType)[keyof typeof BattleActionType];

export const MoveCategory = {
  PHYSICAL: 'Physical',
  SPECIAL: 'Special',
  STATUS: 'Status',
} as const;

export type MoveCategoryValue = (typeof MoveCategory)[keyof typeof MoveCategory];

// -- Status Effects ----------------------------------------------------------

export const PrimaryStatus = {
  POISON: 'poison',
  BURN: 'burn',
  FREEZE: 'freeze',
  PARALYSIS: 'paralysis',
  SLEEP: 'sleep',
  TOXIC: 'toxic',
} as const;

export type PrimaryStatusValue = (typeof PrimaryStatus)[keyof typeof PrimaryStatus];

// -- Adventure ---------------------------------------------------------------

export const AdventureStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type AdventureStatusValue = (typeof AdventureStatus)[keyof typeof AdventureStatus];

// -- Regions -----------------------------------------------------------------

export const Landmass = {
  CONOCO_ISLAND: 'conoco-island',
  CONOOCOO_ARCHIPELAGO: 'conoocoo-archipelago',
  SKY_ISLES: 'sky-isles',
} as const;

export type LandmassValue = (typeof Landmass)[keyof typeof Landmass];

export const Region = {
  HEARTHFALL_COMMONS: 'hearthfall-commons',
  AGNI_PEAKS: 'agni-peaks',
  POSEIDONS_REACH: 'poseidons-reach',
  JOTUN_TUNDRA: 'jotun-tundra',
  ANANSI_WOODS: 'anansi-woods',
  CROWSFOOT_MARSH: 'crowsfoot-marsh',
  MICTLAN_HOLLOWS: 'mictlan-hollows',
  THUNDERHEAD_PLATEAU: 'thunderhead-plateau',
  JADE_GARDENS: 'jade-gardens',
  RUST_WASTES: 'rust-wastes',
  MYSTIC_GROVES: 'mystic-groves',
  SHADOW_VALE: 'shadow-vale',
  CRYSTAL_CAVERNS: 'crystal-caverns',
  STORM_PEAKS: 'storm-peaks',
  PRIMORDIAL_JUNGLE: 'primordial-jungle',
  CORAL_REEFS: 'coral-reefs',
  VOLCANIC_ISLANDS: 'volcanic-islands',
  TRADING_PORTS: 'trading-ports',
  ANCIENT_RUINS: 'ancient-ruins',
  FLOATING_GARDENS: 'floating-gardens',
  CLOUD_CITADEL: 'cloud-citadel',
  WIND_TEMPLE: 'wind-temple',
  STARFALL_OBSERVATORY: 'starfall-observatory',
  AURORA_PEAKS: 'aurora-peaks',
} as const;

export type RegionValue = (typeof Region)[keyof typeof Region];

// -- Factions ----------------------------------------------------------------

export const FactionName = {
  NYAKUZA: 'Nyakuza',
  DIGITAL_DAWN: 'Digital Dawn',
  POKEMON_RANCHERS: 'Pokemon Ranchers',
  KOAS_LABORATORY: "Koa's Laboratory",
  PROJECT_OBSIDIAN: 'Project Obsidian',
  SPIRIT_KEEPERS: 'Spirit Keepers',
  TRIBES: 'Tribes',
  TWILIGHT_ORDER: 'Twilight Order',
  LEAGUE: 'League',
  RANGERS: 'Rangers',
  TAMERS: 'Tamers',
} as const;

export type FactionNameValue = (typeof FactionName)[keyof typeof FactionName];

// -- Stats -------------------------------------------------------------------

export const StatKey = {
  HP: 'hp',
  ATK: 'atk',
  DEF: 'def',
  SPA: 'spa',
  SPD: 'spd',
  SPE: 'spe',
} as const;

export type StatKeyValue = (typeof StatKey)[keyof typeof StatKey];

// -- Item Rarity -------------------------------------------------------------

export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHICAL: 'mythical',
} as const;

export type ItemRarityValue = (typeof ItemRarity)[keyof typeof ItemRarity];

// ============================================================================
// Domain entity interfaces — shapes returned by the backend API.
// ============================================================================

// -- User (minimal: what the bot needs for account linking) ------------------

export interface LinkedUser {
  id: number;
  username: string;
  displayName: string | null;
  discordId: string;
}

// -- Trainer -----------------------------------------------------------------

export interface Trainer {
  id: number;
  playerUserId: string;
  name: string;
  level: number;
  currencyAmount: number;
  totalEarnedCurrency: number;
  imgLink: string | null;
  additionalRefs: string[];
  bio: string | null;
}

export interface TrainerWithStats extends Trainer {
  monsterCount: number;
  monsterRefCount: number;
  monsterRefPercent: number;
  playerDisplayName: string | null;
  playerUsername: string;
}

export interface TrainerSummary {
  id: number;
  name: string;
  level: number;
  imgLink: string | null;
  playerUsername: string;
}

export interface TrainerInventory {
  trainerId: number;
  items: Record<string, number>;
  balls: Record<string, number>;
  berries: Record<string, number>;
  pastries: Record<string, number>;
  evolution: Record<string, number>;
  eggs: Record<string, number>;
  antiques: Record<string, number>;
  heldItems: Record<string, number>;
  seals: Record<string, number>;
  keyItems: Record<string, number>;
}

// -- Monster -----------------------------------------------------------------

export interface Monster {
  id: number;
  trainerId: number;
  playerUserId: string;
  name: string;

  species1: string;
  species2: string | null;
  species3: string | null;

  type1: MonsterTypeValue;
  type2: MonsterTypeValue | null;
  type3: MonsterTypeValue | null;
  type4: MonsterTypeValue | null;
  type5: MonsterTypeValue | null;

  attribute: MonsterAttributeValue | null;
  level: number;

  hpTotal: number;
  atkTotal: number;
  defTotal: number;
  spaTotal: number;
  spdTotal: number;
  speTotal: number;

  nature: string;
  characteristic: string;
  gender: GenderValue;
  friendship: number;
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

export interface MonsterSummary {
  id: number;
  name: string;
  species1: string;
  type1: MonsterTypeValue;
  type2: MonsterTypeValue | null;
  level: number;
  imgLink: string | null;
  shiny: boolean;
  alpha: boolean;
}

// -- Adventure ---------------------------------------------------------------

export interface Adventure {
  id: number;
  title: string;
  description: string;
  region: RegionValue;
  areaKey: string;
  creatorId: number;
  status: AdventureStatusValue;
  discordThreadId: string | null;
  discordChannelId: string | null;
  maxParticipants: number | null;
  isPublic: boolean;
}

export interface AdventureEncounter {
  id: number;
  adventureId: number;
  encounterId: number;
  monsterSpecies: string;
  monsterLevel: number;
  monsterTypes: MonsterTypeValue[];
  isShiny: boolean;
  isAlpha: boolean;
  agroLevel: number;
  encountered: boolean;
  captured: boolean;
  defeated: boolean;
  fled: boolean;
}

export interface AdventureParticipant {
  id: number;
  adventureId: number;
  trainerId: number;
  joinedAt: string;
  isActive: boolean;
  trainerName: string;
  trainerLevel: number;
  trainerImgLink: string | null;
  playerUsername: string;
}

// -- Battle ------------------------------------------------------------------

export interface BattleInstance {
  id: number;
  adventureId: number | null;
  battleType: BattleTypeValue;
  status: BattleStatusValue;
  currentTurn: number;
  weather: WeatherValue;
  weatherTurnsRemaining: number | null;
  terrain: TerrainValue;
  terrainTurnsRemaining: number | null;
  winnerId: number | null;
}

export interface BattleMonster {
  id: number;
  battleId: number;
  participantId: number;
  monsterId: number;
  position: number;
  currentHp: number;
  maxHp: number;
  primaryStatus: PrimaryStatusValue | null;
  statModifiers: Record<StatKeyValue, number>;
  isActive: boolean;
  isFainted: boolean;
}

export interface BattleAction {
  type: BattleActionTypeValue;
  moveName?: string;
  itemName?: string;
  switchToMonsterId?: number;
  targetMonsterId?: number;
}

export interface BattleTurnResult {
  success: boolean;
  damage?: number;
  healing?: number;
  critical?: boolean;
  effectiveness?: number;
  effectivenessText?: string;
  statusApplied?: PrimaryStatusValue;
  statusRemoved?: PrimaryStatusValue;
  statChanges?: Record<StatKeyValue, number>;
  captured?: boolean;
  fled?: boolean;
  switched?: boolean;
  fainted?: boolean;
  message?: string;
  additionalEffects?: string[];
}

// -- Item & Shop -------------------------------------------------------------

export interface Item {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  category: ItemCategoryValue;
  type: string | null;
  rarity: ItemRarityValue | null;
  effect: string | null;
  basePrice: number;
}

export interface ShopItem {
  id: number;
  shopId: number;
  itemId: number;
  itemName: string;
  itemDescription: string;
  itemImageUrl: string | null;
  itemCategory: ItemCategoryValue;
  itemRarity: ItemRarityValue | null;
  price: number;
  stock: number | null;
  discountPercent: number;
  finalPrice: number;
  isActive: boolean;
}

// -- Faction Standing --------------------------------------------------------

export interface FactionStanding {
  trainerId: number;
  factionId: number;
  factionName: FactionNameValue;
  standing: number;
  currentTitle: string | null;
  nextTitle: string | null;
  standingToNextTitle: number | null;
  factionColor: string;
}

// -- Move --------------------------------------------------------------------

export interface Move {
  moveName: string;
  type: MonsterTypeValue;
  moveType: MoveCategoryValue;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  effect: string | null;
  description: string | null;
}

// -- Trade -------------------------------------------------------------------

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired' | 'completed';

export interface Trade {
  id: number;
  offerTrainerId: number;
  receiveTrainerId: number;
  status: TradeStatus;
  offerItems: Array<{ itemName: string; category: ItemCategoryValue; quantity: number }>;
  receiveItems: Array<{ itemName: string; category: ItemCategoryValue; quantity: number }>;
  offerMonsterIds: number[];
  receiveMonsterIds: number[];
  offerCurrency: number;
  receiveCurrency: number;
  message: string | null;
}

// -- Location Activities -----------------------------------------------------

export type RewardType = 'coin' | 'item' | 'level' | 'monster';

export interface ActivityReward {
  id: string;
  type: RewardType;
  rarity: string;
  rewardData: Record<string, unknown>;
  assignedTo: number | null;
  claimed: boolean;
}

export interface ActivitySession {
  id: string;
  sessionId: string;
  playerId: string;
  location: string;
  activity: string;
  promptId: number;
  difficulty: string;
  completed: boolean;
  rewards: ActivityReward[];
  createdAt: string;
  completedAt: string | null;
}
