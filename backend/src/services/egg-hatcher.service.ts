import {
  MONSTER_TYPES,
  MONSTER_TABLES,
  EGG_HATCHING,
  ICE_CREAM_TYPE_SLOTS,
  type MonsterTable,
} from '../utils/constants';
import { MonsterRollerService, type RollParams, type RolledMonster, type UserSettings, type TableFilter } from './monster-roller.service';

// ============================================================================
// Types
// ============================================================================

export type HatchParams = {
  trainerId: number;
  eggCount: number;
  useIncubator?: boolean;
  imageUrl?: string | null;
  imageFile?: string | null;
  selectedItems?: Record<string, number>;
  speciesInputs?: SpeciesInputs;
};

export type SpeciesInputs = {
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
};

export type HatchedEgg = {
  eggId: number;
  monsters: RolledMonster[];
  seed: string;
};

export type EggRollParams = RollParams & {
  // Type guarantees from items
  typeGuarantees?: string[];
  attributeOverride?: string | null;
  fusionRequired?: boolean;
  minTypes?: number;
  maxTypes?: number;

  // Ice cream type slots
  guaranteedTypes?: Record<string, string>;
  hasIceCreams?: boolean;

  // Species controls
  speciesControls?: Record<string, string>;
  forceSpecies1?: string;
  forceSpecies2?: string;
  forceSpecies3?: string;

  // User-provided species inputs
  userSpeciesInputs?: SpeciesInputs;
};

export type EggHatcherOptions = {
  seed?: string;
  userSettings?: UserSettings;
  enabledTables?: MonsterTable[];
};

// ============================================================================
// Default Egg Roll Parameters
// ============================================================================

const getDefaultEggRollParams = (): EggRollParams => ({
  // STRICT egg hatching rules - eggs can ONLY hatch base stage, unevolved monsters
  includeStages: ['Base Stage', "Doesn't Evolve"],
  excludeStages: [
    'Stage 1',
    'Stage 2',
    'Stage 3',
    'Middle Stage',
    'Final Stage',
    'Evolves',
    'First Evolution',
    'Second Evolution',
    'Final Evolution',
    'Middle Evolution'
  ],

  // Table-specific rank filtering
  tableFilters: {
    pokemon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
      mythical: false,
    },
    digimon: {
      includeRanks: ['Baby I', 'Baby II'],
      excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion'],
    },
    yokai: {
      includeRanks: ['E', 'D', 'C'],
      excludeRanks: ['S', 'A', 'B'],
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
    },
    nexomon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
    },
    pals: {
      // Pals don't have evolution stages or ranks
    },
    fakemon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
      mythical: false,
    },
    finalfantasy: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
    },
    monsterhunter: {
      // Monster Hunter monsters don't evolve
    },
  },

  // NEVER allow legendary/mythical monsters from eggs
  legendary: false,
  mythical: false,

  // Item effects
  includeTypes: [],
  excludeTypes: [],
  includeSpecies: [],
  excludeSpecies: [],
  includeAttributes: [],
  excludeAttributes: [],

  // Type guarantees and modifications
  typeGuarantees: [],
  attributeOverride: null,
  fusionRequired: false,
  minTypes: 1,
  maxTypes: 3,

  // Ice cream type slots
  guaranteedTypes: {},

  // Species controls
  speciesControls: {},

  // Monster settings
  species_min: 1,
  species_max: 2,
  types_min: 1,
  types_max: 3,
});

// ============================================================================
// Service
// ============================================================================

/**
 * Service for handling egg hatching with item effects.
 * Each egg produces 10 monster options that the user can select from.
 */
export class EggHatcherService {
  private seed: string;
  private userSettings: UserSettings;
  private enabledTables: MonsterTable[];

  constructor(options: EggHatcherOptions = {}) {
    this.seed = options.seed ?? Date.now().toString();
    this.userSettings = options.userSettings ?? {};
    this.enabledTables = options.enabledTables ?? [...MONSTER_TABLES];

    // Apply user settings to enabled tables
    this.applyUserSettings();
  }

  // ==========================================================================
  // User Settings
  // ==========================================================================

  /**
   * Apply user settings to enabled tables
   */
  private applyUserSettings(): void {
    this.enabledTables = this.enabledTables.filter((table) => {
      const userSetting = this.userSettings[table as keyof UserSettings];
      // If setting is undefined or true, include the table
      // If setting is explicitly false, exclude the table
      return userSetting !== false;
    });

    console.log('EggHatcher enabled tables after applying user settings:', this.enabledTables);
  }

  // ==========================================================================
  // Egg Hatching
  // ==========================================================================

  /**
   * Hatch eggs with item effects
   * @param params - Hatching parameters
   * @returns Array of hatched egg results
   */
  async hatchEggs(params: HatchParams): Promise<HatchedEgg[]> {
    const {
      eggCount,
      selectedItems = {},
      speciesInputs = {},
    } = params;

    console.log('Starting egg hatching with params:', params);

    // Process selected items to build roll parameters
    const rollParams = await this.processEggItems(selectedItems, speciesInputs);

    // Apply user settings to roll parameters
    rollParams.userSettings = this.userSettings;
    rollParams.enabledTables = this.enabledTables;

    console.log('Final roll parameters:', rollParams);

    const hatchedEggs: HatchedEgg[] = [];

    // Hatch each egg
    for (let i = 0; i < eggCount; i++) {
      const eggSeed = `${this.seed}-egg-${i}`;
      const eggResults = await this.hatchSingleEgg(eggSeed, rollParams);

      hatchedEggs.push({
        eggId: i + 1,
        monsters: eggResults,
        seed: eggSeed,
      });
    }

    return hatchedEggs;
  }

  /**
   * Hatch a single egg to get 10 monster options
   * @param seed - Seed for this egg
   * @param rollParams - Roll parameters with item effects
   * @returns Array of 10 monsters
   */
  async hatchSingleEgg(seed: string, rollParams: EggRollParams): Promise<RolledMonster[]> {
    const monsters: RolledMonster[] = [];
    const monstersPerEgg = EGG_HATCHING.monstersPerEgg;

    for (let i = 0; i < monstersPerEgg; i++) {
      const monsterSeed = `${seed}-monster-${i}`;
      const roller = new MonsterRollerService({
        seed: monsterSeed,
        enabledTables: rollParams.enabledTables,
        userSettings: rollParams.userSettings,
      });

      try {
        let monster = await roller.rollMonster(rollParams);
        if (monster) {
          // Apply forced species from control items
          monster = await this.applyForcedSpecies(monster, rollParams);

          // Update reference images for forced species overrides
          await this.updateSpeciesImages(monster, monsterSeed, rollParams);

          // Apply ice cream type overrides
          if (rollParams.guaranteedTypes && Object.keys(rollParams.guaranteedTypes).length > 0) {
            for (const [typeSlot, typeValue] of Object.entries(rollParams.guaranteedTypes)) {
              if (typeValue) {
                (monster as Record<string, unknown>)[typeSlot] = typeValue;
              }
            }
          }

          // Apply post-roll item effects
          monster = await this.applyPostRollEffects(monster, rollParams);

          monsters.push(monster);
        }
      } catch (error) {
        console.error(`Error rolling monster ${i} for egg ${seed}:`, error);
      }
    }

    return monsters;
  }

  // ==========================================================================
  // Item Processing
  // ==========================================================================

  /**
   * Process egg items to create roll parameters
   * @param selectedItems - Selected items and their quantities
   * @param speciesInputs - User-provided species inputs for control items
   * @returns Roll parameters
   */
  async processEggItems(
    selectedItems: Record<string, number>,
    speciesInputs: SpeciesInputs = {}
  ): Promise<EggRollParams> {
    const rollParams: EggRollParams = {
      ...getDefaultEggRollParams(),
      userSpeciesInputs: speciesInputs,
    };

    // Process each selected item
    for (const [itemName, quantity] of Object.entries(selectedItems)) {
      if (quantity > 0) {
        this.applyItemEffect(itemName, quantity, rollParams);
      }
    }

    // FINAL SAFETY CHECK: Ensure no item has overridden the evolution restrictions
    rollParams.legendary = false;
    rollParams.mythical = false;

    // Enforce table-specific restrictions
    // Deep clone to make mutable since EGG_HATCHING is defined as const
    rollParams.tableFilters = JSON.parse(JSON.stringify(EGG_HATCHING.tableFilters)) as Record<string, TableFilter>;

    return rollParams;
  }

  /**
   * Apply individual item effect to roll parameters
   * @param itemName - Name of the item
   * @param quantity - Quantity of the item
   * @param rollParams - Roll parameters to modify
   */
  applyItemEffect(itemName: string, quantity: number, rollParams: EggRollParams): void {
    console.log(`Applying effect for ${quantity}x ${itemName}`);

    // Rank Incense - affects pool within restrictions
    if (itemName.includes('Rank Incense')) {
      const rank = itemName.split(' ')[0] ?? '';
      if (['Baby I', 'Baby II', 'S', 'A', 'B', 'E', 'D', 'C'].includes(rank)) {
        rollParams.includeRanks = [rank];
      }
    }

    // Color Incense - attribute filter
    if (itemName.includes('Color Incense')) {
      const attribute = itemName.replace(' Color Incense', '');
      rollParams.includeAttributes = rollParams.includeAttributes ?? [];
      rollParams.includeAttributes.push(attribute);
    }

    // Poffin - type filter
    if (itemName.includes('Poffin')) {
      const type = itemName.replace(' Poffin', '');
      rollParams.includeTypes = rollParams.includeTypes ?? [];
      rollParams.includeTypes.push(type);
    }

    // Exclusion items
    if (itemName === 'Spell Tag') {
      rollParams.excludeTypes = rollParams.excludeTypes ?? [];
      rollParams.excludeTypes.push('yokai');
    }

    if (itemName === 'DigiTofu') {
      rollParams.excludeTypes = rollParams.excludeTypes ?? [];
      rollParams.excludeTypes.push('digimon');
    }

    if (itemName === 'Broken Bell') {
      rollParams.excludeTypes = rollParams.excludeTypes ?? [];
      rollParams.excludeTypes.push('pokemon');
    }

    if (itemName === 'Shattered Core') {
      rollParams.excludeTypes = rollParams.excludeTypes ?? [];
      rollParams.excludeTypes.push('nexomon');
    }

    if (itemName === "Workers Strike Notice") {
      rollParams.excludeTypes = rollParams.excludeTypes ?? [];
      rollParams.excludeTypes.push('pals');
    }

    // Inclusion items
    if (itemName === 'Complex Core') {
      rollParams.includeTypes = rollParams.includeTypes ?? [];
      rollParams.includeTypes.push('nexomon');
    }

    if (itemName === "Worker's Permit") {
      rollParams.includeTypes = rollParams.includeTypes ?? [];
      rollParams.includeTypes.push('pals');
    }

    // Attribute override items
    if (itemName === 'Corruption Code') {
      rollParams.attributeOverride = 'Virus';
    }

    if (itemName === 'Repair Code') {
      rollParams.attributeOverride = 'Vaccine';
    }

    if (itemName === 'Shiny New Code') {
      rollParams.attributeOverride = 'Data';
    }

    // Hot Chocolate - fusion requirement
    if (itemName === 'Hot Chocolate') {
      rollParams.fusionRequired = true;
      rollParams.species_min = 2;
    }

    // Type guarantee items (Nurture Kits)
    if (itemName.includes('Nurture Kit')) {
      const type = itemName.replace(' Nurture Kit', '');
      rollParams.typeGuarantees = rollParams.typeGuarantees ?? [];
      rollParams.typeGuarantees.push(type);
    }

    // Milk items for type counts
    if (itemName === 'Vanilla Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes ?? 1, 2);
    }
    if (itemName === 'Chocolate Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes ?? 1, 3);
    }
    if (itemName === 'Strawberry Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes ?? 1, 4);
    }
    if (itemName === 'MooMoo Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes ?? 1, 5);
      rollParams.maxTypes = 5;
    }

    // Ice cream items: set guaranteed type slots from user input
    const iceCreamTypeSlot = ICE_CREAM_TYPE_SLOTS[itemName];
    if (iceCreamTypeSlot) {
      rollParams.hasIceCreams = true;
      rollParams.guaranteedTypes = rollParams.guaranteedTypes ?? {};
      const userInput = rollParams.userSpeciesInputs?.[iceCreamTypeSlot as keyof SpeciesInputs];
      if (userInput) {
        rollParams.guaranteedTypes[iceCreamTypeSlot] = userInput;
      }
    }

    // Species control items
    if (itemName === 'Input Field' && rollParams.userSpeciesInputs?.species1) {
      rollParams.speciesControls = rollParams.speciesControls ?? {};
      rollParams.speciesControls.species1 = 'input';
      rollParams.forceSpecies1 = rollParams.userSpeciesInputs.species1;
    }

    if (itemName === 'Drop Down') {
      const inputs = rollParams.userSpeciesInputs;
      if (inputs?.species1 && inputs?.species2) {
        rollParams.speciesControls = rollParams.speciesControls ?? {};
        rollParams.speciesControls.species1and2 = 'dropdown';
        rollParams.forceSpecies1 = inputs.species1;
        rollParams.forceSpecies2 = inputs.species2;
        rollParams.species_min = 2;
      }
    }

    if (itemName === 'Radio Buttons') {
      const inputs = rollParams.userSpeciesInputs;
      if (inputs?.species1 && inputs?.species2 && inputs?.species3) {
        rollParams.speciesControls = rollParams.speciesControls ?? {};
        rollParams.speciesControls.species1to3 = 'radio';
        rollParams.forceSpecies1 = inputs.species1;
        rollParams.forceSpecies2 = inputs.species2;
        rollParams.forceSpecies3 = inputs.species3;
        rollParams.species_min = 3;
      }
    }
  }

  // ==========================================================================
  // Post-Roll Effects
  // ==========================================================================

  /**
   * Apply post-roll effects to a monster
   * @param monster - The rolled monster
   * @param rollParams - Roll parameters with item effects
   * @returns Modified monster
   */
  async applyPostRollEffects(
    monster: RolledMonster,
    rollParams: EggRollParams
  ): Promise<RolledMonster> {
    const modifiedMonster = { ...monster };

    // Apply attribute override
    if (rollParams.attributeOverride) {
      modifiedMonster.attribute = rollParams.attributeOverride;
    }

    // Apply type guarantees (Nurture Kits)
    if (rollParams.typeGuarantees && rollParams.typeGuarantees.length > 0) {
      const guaranteedType =
        rollParams.typeGuarantees[Math.floor(Math.random() * rollParams.typeGuarantees.length)];

      const hasGuaranteedType = [
        modifiedMonster.type1,
        modifiedMonster.type2,
        modifiedMonster.type3,
        modifiedMonster.type4,
        modifiedMonster.type5,
      ].includes(guaranteedType);

      if (!hasGuaranteedType && modifiedMonster.type1) {
        modifiedMonster.type1 = guaranteedType;
      }
    }

    // Apply minimum type requirements
    const minTypes = rollParams.minTypes ?? 1;
    if (minTypes > 1) {
      const pokemonTypes = [...MONSTER_TYPES];

      const currentTypes = [
        modifiedMonster.type1,
        modifiedMonster.type2,
        modifiedMonster.type3,
        modifiedMonster.type4,
        modifiedMonster.type5,
      ].filter(Boolean) as string[];

      while (currentTypes.length < minTypes) {
        const availableTypes = pokemonTypes.filter((t) => !currentTypes.includes(t));
        if (availableTypes.length > 0) {
          const newType = availableTypes[Math.floor(Math.random() * availableTypes.length)] ?? 'Normal';
          const typeSlot = `type${currentTypes.length + 1}` as keyof RolledMonster;
          (modifiedMonster as Record<string, unknown>)[typeSlot] = newType;
          currentTypes.push(newType);
        } else {
          break;
        }
      }
    }

    return modifiedMonster;
  }

  /**
   * Apply forced species from control items
   * @param monster - The rolled monster
   * @param rollParams - Roll parameters with forced species
   * @returns Modified monster with forced species
   */
  async applyForcedSpecies(
    monster: RolledMonster,
    rollParams: EggRollParams
  ): Promise<RolledMonster> {
    const modifiedMonster = { ...monster };

    if (rollParams.forceSpecies1) {
      modifiedMonster.species1 = rollParams.forceSpecies1;
      console.log(`Forced species1 to: ${rollParams.forceSpecies1}`);
    }

    if (rollParams.forceSpecies2) {
      modifiedMonster.species2 = rollParams.forceSpecies2;
      console.log(`Forced species2 to: ${rollParams.forceSpecies2}`);
    }

    if (rollParams.forceSpecies3) {
      modifiedMonster.species3 = rollParams.forceSpecies3;
      console.log(`Forced species3 to: ${rollParams.forceSpecies3}`);
    }

    return modifiedMonster;
  }

  /**
   * Update species images for a monster
   * @param monster - The monster to update
   * @param seed - Seed for the roller
   * @param rollParams - Roll parameters
   */
  private async updateSpeciesImages(
    monster: RolledMonster,
    seed: string,
    rollParams: EggRollParams
  ): Promise<void> {
    const roller = new MonsterRollerService({
      seed,
      enabledTables: rollParams.enabledTables,
      userSettings: rollParams.userSettings,
    });

    const updateImage = async (slot: 'species1' | 'species2' | 'species3'): Promise<void> => {
      const speciesName = monster[slot];
      if (speciesName) {
        try {
          const speciesMonster = await roller.getMonsterByName(speciesName);
          if (speciesMonster) {
            (monster as Record<string, unknown>)[`${slot}_image`] = speciesMonster.image_url;
          }
        } catch (error) {
          console.error(`Error getting image for ${slot} (${speciesName}):`, error);
        }
      }
    };

    await updateImage('species1');
    await updateImage('species2');
    await updateImage('species3');
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /**
   * Get the current seed
   */
  getSeed(): string {
    return this.seed;
  }

  /**
   * Get the enabled tables
   */
  getEnabledTables(): MonsterTable[] {
    return [...this.enabledTables];
  }

  /**
   * Get the user settings
   */
  getUserSettings(): UserSettings {
    return { ...this.userSettings };
  }
}
