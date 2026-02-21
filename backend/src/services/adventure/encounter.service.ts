import { ItemRepository, ItemRow } from '../../repositories';
import { MonsterRollerService, RollParams, type UserSettings } from '../monster-roller.service';
import { getActivityByAgro } from '../../utils/contents/monster-activities';
import type {
  SpecialEncounter,
  MonsterRollerParameters,
  LevelRange,
  AgroRange,
  BattleParameters,
} from '../../utils/contents/area-configurations';
import type { Adventure } from '../../repositories/adventure.repository';

// ============================================================================
// Types
// ============================================================================

export type EncounterType = 'battle' | 'wild' | 'item' | 'special' | 'auto_battle';

export type EncounterWeights = {
  battle: number;
  wild: number;
  item: number;
};

export type LocationParameters = {
  levelRange?: LevelRange;
  agroRange?: AgroRange;
  monsterParams?: Partial<RollParams>;
  battleParameters?: BattleParameters;
  specialEncounters?: SpecialEncounter[];
  groupSizeModifier?: number;
};

export type EnemyTrainer = {
  name: string;
  level: number;
  type: 'enemy';
};

export type BattleMonster = {
  name: string;
  species1: string | null;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  health: number;
  maxHealth: number;
  isWild: boolean;
  originalGroup?: WildMonsterGroup;
  targetIndex?: number;
};

export type BattleEncounterData = {
  trainers: EnemyTrainer[];
  monsters: BattleMonster[];
};

export type WildMonsterGroup = {
  count: number;
  species1: string | null;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  activity: string;
  agro: number;
  level: number;
  available: number;
  captured: string[];
};

export type WildEncounterData = {
  groups: WildMonsterGroup[];
};

export type ItemEncounterData = {
  item: ItemRow;
};

export type SpecialEncounterData = {
  encounterType: string;
  description: string;
  [key: string]: unknown;
};

export type AutoBattleData = {
  battleData: BattleEncounterData;
  originalGroups: WildMonsterGroup[];
};

export type EncounterData =
  | BattleEncounterData
  | WildEncounterData
  | ItemEncounterData
  | SpecialEncounterData
  | AutoBattleData;

export type EncounterResult = {
  type: EncounterType;
  data: EncounterData;
};

export type BattleRewards = {
  coins: number;
  items: Array<{ name: string; description: string }>;
};

export type BattleOutcome = 'victory' | 'retreat' | 'draw';

// ============================================================================
// Constants
// ============================================================================

const TRAINER_NAMES = [
  'Rival Trainer',
  'Wild Researcher',
  'Rogue Explorer',
  'Mysterious Wanderer',
  'Seasoned Adventurer',
  'Lost Traveler',
  'Treasure Hunter',
  'Monster Tamer',
];

const DEFAULT_ENCOUNTER_WEIGHTS: EncounterWeights = {
  battle: 30,
  wild: 50,
  item: 20,
};

const DEFAULT_LOCATION_PARAMS: LocationParameters = {
  levelRange: { min: 5, max: 25 },
  agroRange: { min: 10, max: 60 },
  monsterParams: {
    legendary: false,
    mythical: false,
    species_max: 3,
    types_max: 5,
  },
};

const FALLBACK_MONSTER_GROUP: WildMonsterGroup = {
  count: 1,
  species1: 'Pikachu',
  species2: null,
  species3: null,
  type1: 'Electric',
  type2: null,
  type3: null,
  type4: null,
  type5: null,
  attribute: null,
  level: 10,
  agro: 25,
  activity: 'is playing in the grass',
  available: 1,
  captured: [],
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for generating random encounters during adventures
 */
export class EncounterService {
  private encounterWeights: EncounterWeights;
  private monsterRollerService: MonsterRollerService;
  private itemRepository: ItemRepository;

  constructor(
    monsterRollerService?: MonsterRollerService,
    itemRepository?: ItemRepository,
    encounterWeights?: Partial<EncounterWeights>
  ) {
    this.encounterWeights = { ...DEFAULT_ENCOUNTER_WEIGHTS, ...encounterWeights };
    this.monsterRollerService = monsterRollerService ?? new MonsterRollerService();
    this.itemRepository = itemRepository ?? new ItemRepository();
  }

  /**
   * Generate a random encounter for an adventure
   */
  async generateRandomEncounter(
    adventure: Adventure,
    location: LocationParameters | null = null,
    userSettings?: UserSettings
  ): Promise<EncounterResult> {
    // Use a per-call roller with user settings if provided
    const originalRoller = this.monsterRollerService;
    if (userSettings) {
      this.monsterRollerService = new MonsterRollerService({ userSettings });
    }

    try {
      return await this._generateRandomEncounterInner(adventure, location);
    } finally {
      this.monsterRollerService = originalRoller;
    }
  }

  private async _generateRandomEncounterInner(
    adventure: Adventure,
    location: LocationParameters | null = null,
  ): Promise<EncounterResult> {
    // Get area-specific parameters if available
    const areaParams = await this.getAreaParameters(adventure);

    // Merge parameters with defaults
    const effectiveLocation: LocationParameters = {
      ...DEFAULT_LOCATION_PARAMS,
      ...location,
      ...areaParams,
    };

    // Check for special encounters first
    const specialEncounter = await this.checkSpecialEncounters(effectiveLocation);
    if (specialEncounter) {
      return specialEncounter;
    }

    // Determine encounter type based on weights
    const encounterType = this.rollEncounterType();

    switch (encounterType) {
      case 'battle':
        return {
          type: 'battle',
          data: await this.generateBattleEncounter(effectiveLocation),
        };

      case 'wild': {
        const wildResult = await this.generateWildEncounter(effectiveLocation);
        // Check if wild encounter was converted to auto-battle
        if ('type' in wildResult && wildResult.type === 'auto_battle') {
          return wildResult as EncounterResult;
        }
        return {
          type: 'wild',
          data: wildResult as WildEncounterData,
        };
      }

      case 'item':
        return {
          type: 'item',
          data: await this.generateItemEncounter(),
        };

      default:
        throw new Error(`Unknown encounter type: ${encounterType}`);
    }
  }

  /**
   * Roll encounter type based on weights
   */
  rollEncounterType(): EncounterType {
    const totalWeight = Object.values(this.encounterWeights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [type, weight] of Object.entries(this.encounterWeights)) {
      currentWeight += weight;
      if (roll <= currentWeight) {
        return type as EncounterType;
      }
    }

    return 'wild'; // Fallback
  }

  /**
   * Generate a battle encounter
   */
  async generateBattleEncounter(location: LocationParameters): Promise<BattleEncounterData> {
    const battleData: BattleEncounterData = {
      trainers: [],
      monsters: [],
    };

    // Determine if this is a trainer battle or wild monster battle
    const isTrainerBattle = Math.random() < 0.6; // 60% chance for trainer battle

    if (isTrainerBattle) {
      // Generate enemy trainers
      const trainerCount = Math.floor(Math.random() * 2) + 1; // 1-2 trainers
      for (let i = 0; i < trainerCount; i++) {
        battleData.trainers.push(this.generateEnemyTrainer());
      }
    }

    // Generate enemy monsters (2-4 monsters)
    const monsterCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < monsterCount; i++) {
      const monster = await this.generateEnemyMonster(location);
      battleData.monsters.push(monster);
    }

    return battleData;
  }

  /**
   * Generate a wild encounter
   */
  async generateWildEncounter(
    location: LocationParameters
  ): Promise<WildEncounterData | EncounterResult> {
    const encounterData: WildEncounterData = {
      groups: [],
    };

    // Generate 1-3 groups of monsters
    const groupCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < groupCount; i++) {
      try {
        const group = await this.generateWildMonsterGroup(location);
        if (group) {
          encounterData.groups.push(group);
        }
      } catch (error) {
        console.error(`Error generating wild monster group ${i + 1}:`, error);
        // Continue with other groups even if one fails
      }
    }

    // Ensure we have at least one group, if not, generate a fallback
    if (encounterData.groups.length === 0) {
      console.warn('No monster groups generated, creating fallback group');
      try {
        const fallbackGroup = await this.generateFallbackMonsterGroup();
        encounterData.groups.push(fallbackGroup);
      } catch (fallbackError) {
        console.error('Failed to generate fallback monster group:', fallbackError);
        throw new Error('Unable to generate any wild monsters for this encounter');
      }
    }

    // Check if any monsters have high agro and should trigger automatic battle
    const highAgroMonsters = encounterData.groups.filter((group) => group.agro >= 75);

    if (highAgroMonsters.length > 0) {
      // Convert to automatic battle encounter
      return {
        type: 'auto_battle',
        data: {
          battleData: {
            trainers: [],
            monsters: highAgroMonsters.map((group, index) => {
              const species = [group.species1, group.species2, group.species3]
                .filter(Boolean)
                .join('/');
              const attribute = group.attribute ? ` (${group.attribute})` : '';

              return {
                name: `Wild ${species}${attribute} #${index + 1}`,
                species1: group.species1,
                species2: group.species2,
                species3: group.species3,
                type1: group.type1,
                type2: group.type2,
                type3: group.type3,
                type4: group.type4,
                type5: group.type5,
                attribute: group.attribute,
                level: group.level,
                health: 100,
                maxHealth: 100,
                isWild: true,
                originalGroup: group,
                targetIndex: index + 1,
              };
            }),
          },
          originalGroups: encounterData.groups,
        } as AutoBattleData,
      };
    }

    return encounterData;
  }

  /**
   * Generate an item encounter
   */
  async generateItemEncounter(): Promise<ItemEncounterData> {
    const itemsResult = await this.itemRepository.findAll({ limit: 1000 });
    const items = itemsResult.data;

    if (!items || items.length === 0) {
      throw new Error('No items available for item encounter');
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];

    if (!randomItem) {
      throw new Error('Failed to select random item');
    }

    return {
      item: randomItem,
    };
  }

  /**
   * Generate an enemy trainer
   */
  generateEnemyTrainer(): EnemyTrainer {
    const nameIndex = Math.floor(Math.random() * TRAINER_NAMES.length);
    const name = TRAINER_NAMES[nameIndex] ?? 'Unknown Trainer';
    const level = Math.floor(Math.random() * 20) + 10; // Level 10-30

    return {
      name,
      level,
      type: 'enemy',
    };
  }

  /**
   * Get area-specific parameters for an adventure
   */
  async getAreaParameters(adventure: Adventure): Promise<LocationParameters> {
    if (!adventure.areaConfig) {
      return {};
    }

    let areaConfig = adventure.areaConfig;
    if (typeof areaConfig === 'string') {
      try {
        areaConfig = JSON.parse(areaConfig);
      } catch {
        return {};
      }
    }

    const config = areaConfig as {
      monsterRollerParameters?: MonsterRollerParameters;
      levelRange?: LevelRange;
      agroRange?: AgroRange;
      battleParameters?: BattleParameters;
      specialEncounters?: SpecialEncounter[];
      allowedWildTypes?: string[];
    };

    const monsterParams = this.convertAreaConfigToMonsterParams(config.monsterRollerParameters);

    // Area-level type restriction overrides roller speciesTypesOptions
    if (config.allowedWildTypes && config.allowedWildTypes.length > 0) {
      monsterParams.speciesTypesOptions = config.allowedWildTypes;
    }

    return {
      monsterParams,
      levelRange: config.levelRange,
      agroRange: config.agroRange,
      battleParameters: config.battleParameters,
      specialEncounters: config.specialEncounters ?? [],
    };
  }

  /**
   * Convert area configuration to monster roller parameters
   */
  convertAreaConfigToMonsterParams(areaParams?: MonsterRollerParameters): Partial<RollParams> {
    if (!areaParams) {
      return {};
    }

    const params: Partial<RollParams> = {};

    // Handle type restrictions
    if (areaParams.speciesTypesOptions && areaParams.speciesTypesOptions.length > 0) {
      params.speciesTypesOptions = areaParams.speciesTypesOptions;
    }

    // Handle evolution stage restrictions
    if (areaParams.includeStages) {
      params.includeStages = areaParams.includeStages;
    }

    if (areaParams.includeRanks) {
      params.includeRanks = areaParams.includeRanks;
    }

    // Handle species limits
    if (areaParams.species_min !== undefined) {
      params.species_min = areaParams.species_min;
    }
    if (areaParams.species_max !== undefined) {
      params.species_max = areaParams.species_max;
    }

    // Handle type limits
    if (areaParams.types_min !== undefined) {
      params.types_min = areaParams.types_min;
    }
    if (areaParams.types_max !== undefined) {
      params.types_max = areaParams.types_max;
    }

    // Handle legendary/mythical settings
    if (areaParams.enableLegendaries !== undefined) {
      params.legendary = areaParams.enableLegendaries;
    }
    if (areaParams.enableMythicals !== undefined) {
      params.mythical = areaParams.enableMythicals;
    }

    return params;
  }

  /**
   * Check for special encounters based on area configuration
   */
  async checkSpecialEncounters(location: LocationParameters): Promise<EncounterResult | null> {
    const specialEncounters = location.specialEncounters ?? [];

    for (const encounter of specialEncounters) {
      if (Math.random() < encounter.chance) {
        return {
          type: 'special',
          data: {
            ...encounter,
            encounterType: encounter.type,
          },
        };
      }
    }

    return null;
  }

  /**
   * Generate an enemy monster
   */
  async generateEnemyMonster(location: LocationParameters): Promise<BattleMonster> {
    // Set up roll parameters based on location
    const rollParams: RollParams = {
      legendary: false,
      mythical: false,
      species_max: 2,
      types_max: 3,
      ...location.monsterParams,
    };

    const monster = await this.monsterRollerService.rollMonster(rollParams);

    if (!monster) {
      throw new Error('Failed to generate enemy monster');
    }

    // Set level based on location or random
    const level = location.levelRange
      ? Math.floor(Math.random() * (location.levelRange.max - location.levelRange.min + 1)) +
        location.levelRange.min
      : Math.floor(Math.random() * 20) + 10; // Default level 10-30

    // Add a name for battle targeting
    const species = [monster.species1, monster.species2, monster.species3]
      .filter(Boolean)
      .join('/');

    return {
      name: `Enemy ${species}`,
      species1: monster.species1 ?? null,
      species2: monster.species2 ?? null,
      species3: monster.species3 ?? null,
      type1: monster.type1 ?? null,
      type2: monster.type2 ?? null,
      type3: monster.type3 ?? null,
      type4: monster.type4 ?? null,
      type5: monster.type5 ?? null,
      attribute: monster.attribute ?? null,
      level,
      health: 100,
      maxHealth: 100,
      isWild: false,
    };
  }

  /**
   * Generate a group of wild monsters
   */
  async generateWildMonsterGroup(location: LocationParameters): Promise<WildMonsterGroup> {
    // Set up roll parameters with area-specific restrictions
    const rollParams: RollParams = {
      legendary: location.monsterParams?.legendary ?? false,
      mythical: location.monsterParams?.mythical ?? false,
      species_max: location.monsterParams?.species_max ?? 3,
      types_max: location.monsterParams?.types_max ?? 5,
      ...location.monsterParams,
    };

    console.log('Rolling monsters with params:', rollParams);
    const monster = await this.monsterRollerService.rollMonster(rollParams);
    console.log('Generated monster:', monster);

    if (!monster) {
      throw new Error('Failed to generate wild monster group');
    }

    // Determine group size (1-5 monsters, influenced by area)
    let groupSize = Math.floor(Math.random() * 5) + 1;

    // Adjust group size based on area difficulty or special parameters
    if (location.groupSizeModifier) {
      groupSize = Math.max(1, Math.min(10, groupSize + location.groupSizeModifier));
    }

    // Generate agro level based on area parameters
    const agro = location.agroRange
      ? Math.floor(Math.random() * (location.agroRange.max - location.agroRange.min + 1)) +
        location.agroRange.min
      : Math.floor(Math.random() * 50) + 10; // Default agro 10-60

    // Get activity based on agro level
    const activity = getActivityByAgro(agro);

    // Generate level
    const level = location.levelRange
      ? Math.floor(Math.random() * (location.levelRange.max - location.levelRange.min + 1)) +
        location.levelRange.min
      : Math.floor(Math.random() * 20) + 5; // Default level 5-25 for wild monsters

    return {
      count: groupSize,
      species1: monster.species1 ?? null,
      species2: monster.species2 ?? null,
      species3: monster.species3 ?? null,
      type1: monster.type1 ?? null,
      type2: monster.type2 ?? null,
      type3: monster.type3 ?? null,
      type4: monster.type4 ?? null,
      type5: monster.type5 ?? null,
      attribute: monster.attribute ?? null,
      activity,
      agro,
      level,
      available: groupSize,
      captured: [],
    };
  }

  /**
   * Generate a fallback monster group with basic parameters
   */
  async generateFallbackMonsterGroup(): Promise<WildMonsterGroup> {
    try {
      // Use very basic parameters that should always work
      const rollParams: RollParams = {
        legendary: false,
        mythical: false,
        includeStages: ['Base Stage', "Doesn't Evolve"],
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
        species_max: 1,
        types_max: 2,
      };

      console.log('Generating fallback monster with basic params:', rollParams);
      const monster = await this.monsterRollerService.rollMonster(rollParams);

      if (!monster) {
        return { ...FALLBACK_MONSTER_GROUP };
      }

      return {
        count: 1,
        species1: monster.species1 ?? null,
        species2: monster.species2 ?? null,
        species3: monster.species3 ?? null,
        type1: monster.type1 ?? null,
        type2: monster.type2 ?? null,
        type3: monster.type3 ?? null,
        type4: monster.type4 ?? null,
        type5: monster.type5 ?? null,
        attribute: monster.attribute ?? null,
        level: 10,
        agro: 25,
        activity: 'is exploring the area',
        available: 1,
        captured: [],
      };
    } catch (error) {
      console.error('Error generating fallback monster group:', error);
      // Return absolute fallback
      return { ...FALLBACK_MONSTER_GROUP };
    }
  }

  /**
   * Calculate battle rewards
   */
  calculateBattleRewards(battleData: BattleEncounterData, outcome: BattleOutcome): BattleRewards {
    const baseRewards: BattleRewards = {
      coins: 0,
      items: [],
    };

    // Calculate base coin reward based on enemy count
    const enemyCount = (battleData.trainers?.length || 0) + (battleData.monsters?.length || 0);
    let coinMultiplier = 1;

    switch (outcome) {
      case 'victory':
        coinMultiplier = 1.5;
        break;
      case 'retreat':
        coinMultiplier = 0.8;
        break;
      case 'draw':
        coinMultiplier = 1.0;
        break;
    }

    baseRewards.coins = Math.floor((enemyCount * 100 + Math.random() * 200) * coinMultiplier);

    // Random chance for item rewards (higher chance on victory)
    const itemChance = outcome === 'victory' ? 0.4 : outcome === 'retreat' ? 0.2 : 0.3;
    if (Math.random() < itemChance) {
      baseRewards.items.push({
        name: 'Battle Trophy',
        description: 'A memento from a hard-fought battle',
      });
    }

    return baseRewards;
  }

  /**
   * Update encounter weights
   */
  setEncounterWeights(weights: Partial<EncounterWeights>): void {
    this.encounterWeights = { ...this.encounterWeights, ...weights };
  }

  /**
   * Get current encounter weights
   */
  getEncounterWeights(): EncounterWeights {
    return { ...this.encounterWeights };
  }
}
