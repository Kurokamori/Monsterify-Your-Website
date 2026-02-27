import { db } from '../database';
import seedrandom from 'seedrandom';
import {
  MONSTER_TYPES,
  DIGIMON_ATTRIBUTES,
  MONSTER_TABLES,
  getTableName,
  getTableSchema,
  type MonsterTable,
  type TableSchema,
} from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

export type UserSettings = {
  pokemon?: boolean;
  digimon?: boolean;
  yokai?: boolean;
  nexomon?: boolean;
  pals?: boolean;
  fakemon?: boolean;
  finalfantasy?: boolean;
  monsterhunter?: boolean;
  dragonquest?: boolean;
};

export type TableFilter = {
  legendary?: boolean;
  mythical?: boolean;
  includeRanks?: string[];
  excludeRanks?: string[];
  includeStages?: string[];
  excludeStages?: string[];
};

export type RollParams = {
  tables?: MonsterTable[];
  // Species slots
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  includeSpecies1?: string[];
  excludeSpecies1?: string[];
  includeSpecies2?: string[];
  excludeSpecies2?: string[];
  includeSpecies3?: string[];
  excludeSpecies3?: string[];
  // Type slots
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  includeType1?: string[];
  excludeType1?: string[];
  includeType2?: string[];
  excludeType2?: string[];
  includeType3?: string[];
  excludeType3?: string[];
  includeType4?: string[];
  excludeType4?: string[];
  includeType5?: string[];
  excludeType5?: string[];
  // Other parameters
  attribute?: string | null;
  rarity?: string | null;
  legendary?: boolean;
  mythical?: boolean;
  onlyLegendary?: boolean;
  onlyMythical?: boolean;
  // Stage parameters
  stage?: string | null;
  includeStages?: string[];
  excludeStages?: string[];
  // Rank parameters
  rank?: string | null;
  includeRanks?: string[];
  excludeRanks?: string[];
  // Backward compatibility
  name?: string | null;
  includeName?: string[];
  excludeName?: string[];
  includeSpecies?: string[];
  excludeSpecies?: string[];
  includeTypes?: string[];
  excludeTypes?: string[];
  speciesTypesOptions?: string[];
  includeAttributes?: string[];
  excludeAttributes?: string[];
  includeRarities?: string[];
  excludeRarities?: string[];
  customSelector?: ((monster: RolledMonster) => boolean) | null;
  // Quantity settings
  species_min?: number | null;
  species_max?: number | null;
  types_min?: number | null;
  types_max?: number | null;
  // Table-specific filters
  tableFilters?: Record<string, TableFilter>;
  // User settings
  userSettings?: UserSettings;
  enabledTables?: MonsterTable[];
  // Override attribute (from antiques)
  override_attribute?: string | null;
  // Result attribute options (limits which attributes can be assigned)
  resultAttributeOptions?: string[];
  // Evolution fields
  evolvesFrom?: string | null;
  evolvesTo?: string | null;
  breedingResults?: string | null;
  // Table-specific fields
  families?: string | null;
  levelRequired?: number | null;
  ndex?: number | null;
  family?: string | null;
  subfamily?: string | null;
};

export type RolledMonster = {
  id: number;
  name: string;
  type_primary?: string | null;
  type_secondary?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  rank?: string | null;
  stage?: string | null;
  image_url?: string | null;
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  species1_image?: string | null;
  species2_image?: string | null;
  species3_image?: string | null;
  monster_type?: MonsterTable;
  is_legendary?: boolean;
  is_mythical?: boolean;
  evolves_from?: string | null;
  evolves_to?: string | null;
  breeding_results?: string | null;
  families?: string | null;
  digimon_type?: string | null;
  natural_attributes?: string | null;
  level_required?: number | null;
  tribe?: string | null;
  ndex?: number | null;
  family?: string | null;
  subfamily?: string | null;
  [key: string]: unknown;
};

export type MonsterRollerOptions = {
  seed?: string;
  enabledTables?: MonsterTable[];
  userSettings?: UserSettings;
};

// ============================================================================
// Default Roll Parameters
// ============================================================================

const DEFAULT_ROLL_PARAMS: RollParams = {
  tables: [...MONSTER_TABLES],
  species1: null,
  species2: null,
  species3: null,
  includeSpecies1: [],
  excludeSpecies1: [],
  includeSpecies2: [],
  excludeSpecies2: [],
  includeSpecies3: [],
  excludeSpecies3: [],
  type1: null,
  type2: null,
  type3: null,
  type4: null,
  type5: null,
  includeType1: [],
  excludeType1: [],
  includeType2: [],
  excludeType2: [],
  includeType3: [],
  excludeType3: [],
  includeType4: [],
  excludeType4: [],
  includeType5: [],
  excludeType5: [],
  attribute: null,
  rarity: null,
  legendary: false,
  mythical: false,
  onlyLegendary: false,
  onlyMythical: false,
  includeStages: [],
  includeRanks: [],
  includeSpecies: [],
  excludeSpecies: [],
  includeTypes: [],
  excludeTypes: [],
  speciesTypesOptions: [],
  includeAttributes: [],
  excludeAttributes: [],
  includeRarities: [],
  excludeRarities: [],
  customSelector: null,
  species_min: null,
  species_max: null,
  types_min: null,
  types_max: null,
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for rolling monsters with various parameters.
 * Supports multiple monster tables (Pokemon, Digimon, Yokai, etc.)
 * with customizable filtering options.
 */
export class MonsterRollerService {
  private seed: string;
  private rng: seedrandom.PRNG;
  private enabledTables: MonsterTable[];
  private userSettings: UserSettings;

  constructor(options: MonsterRollerOptions = {}) {
    this.seed = options.seed ?? Date.now().toString();
    this.rng = seedrandom(this.seed);
    this.enabledTables = options.enabledTables ?? [...MONSTER_TABLES];
    this.userSettings = options.userSettings ?? {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
      dragonquest: true,
    };

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
    // Filter enabled tables based on user settings.
    // Include by default; only exclude if explicitly set to false.
    this.enabledTables = this.enabledTables.filter((table) => {
      const userSetting = this.userSettings[table as keyof UserSettings];
      return userSetting !== false;
    });

    console.log('Enabled tables after applying user settings:', this.enabledTables);
  }

  // ==========================================================================
  // Random Number Generation
  // ==========================================================================

  /**
   * Roll a random number between min and max (inclusive)
   */
  private rollNumber(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  /**
   * Roll a random element from an array
   */
  private rollFromArray<T>(array: T[]): T | null {
    if (!array || array.length === 0) {
      return null;
    }
    return array[this.rollNumber(0, array.length - 1)] ?? null;
  }

  /**
   * Shuffle an array in-place using the seeded RNG (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const temp = shuffled[i];
      const itemJ = shuffled[j];
      if (temp !== undefined && itemJ !== undefined) {
        shuffled[i] = itemJ;
        shuffled[j] = temp;
      }
    }
    return shuffled;
  }

  // ==========================================================================
  // Monster Rolling
  // ==========================================================================

  /**
   * Roll a monster with the given parameters
   */
  async rollMonster(params: RollParams = {}): Promise<RolledMonster | null> {
    try {
      // Merge default parameters with provided parameters
      let rollParams: RollParams = { ...DEFAULT_ROLL_PARAMS, ...params };
      rollParams.tables = rollParams.tables ?? this.enabledTables;

      // Ensure we never include tables disabled by user settings
      rollParams.tables = rollParams.tables.filter((table) =>
        this.enabledTables.includes(table)
      );

      // Handle onlyLegendary and onlyMythical modes
      if (rollParams.onlyLegendary || rollParams.onlyMythical) {
        rollParams = this.handleOnlyRarityModes(rollParams);
      }

      // If no tables are enabled after filtering, return null
      if (!rollParams.tables || rollParams.tables.length === 0) {
        console.log('No tables enabled for rolling');
        return null;
      }

      // If specific species names are provided, look them up directly
      // instead of running complex filtered queries across all tables
      const speciesPool = rollParams.includeSpecies1?.length
        ? rollParams.includeSpecies1
        : rollParams.includeSpecies?.length
          ? rollParams.includeSpecies
          : rollParams.species1
            ? [rollParams.species1]
            : null;

      let baseMonster: RolledMonster | null = null;

      if (speciesPool) {
        // Species are explicitly provided — use them directly without DB lookup
        const chosenName = this.rollFromArray(speciesPool);
        if (chosenName) {
          // Try to find image/metadata from DB, but don't require it
          const dbMonster = await this.getMonsterByName(chosenName);
          baseMonster = dbMonster ?? {
            id: 0,
            name: chosenName,
            image_url: null,
          };
          console.log(`Direct species assignment: ${chosenName}${dbMonster ? ' (found in DB)' : ' (name only)'}`);
        }
      } else {
        // Equal chance across tables, except fakemon gets reduced weight
        // since it has far fewer entries and would otherwise be overrepresented.
        const TABLE_WEIGHTS: Partial<Record<MonsterTable, number>> = {
          fakemon: 0.25,
        };

        const weightedTables: { table: MonsterTable; weight: number }[] =
          rollParams.tables.map((table) => ({
            table,
            weight: TABLE_WEIGHTS[table] ?? 1,
          }));

        const totalWeight = weightedTables.reduce((sum, t) => sum + t.weight, 0);
        const shuffled = this.shuffleArray(weightedTables);

        // Pick a table using weighted random selection
        const roll = this.rng() * totalWeight;
        let cumulative = 0;
        const orderedTables: MonsterTable[] = [];

        for (const wt of shuffled) {
          cumulative += wt.weight;
          if (roll < cumulative) {
            orderedTables.push(wt.table);
            break;
          }
        }

        // Add remaining tables as fallbacks in case the chosen one has no results
        for (const wt of shuffled) {
          if (!orderedTables.includes(wt.table)) {
            orderedTables.push(wt.table);
          }
        }

        for (const table of orderedTables) {
          const { query, params: queryParams } = this.buildQuery({
            ...rollParams,
            tables: [table],
          });

          const result = await db.query<RolledMonster>(query, queryParams);

          if (result.rows.length > 0) {
            baseMonster = this.rollFromArray(result.rows);
            if (baseMonster) {
              console.log(`Rolled from table: ${table} (${result.rows.length} candidates)`);
              break;
            }
          }
        }
      }

      if (!baseMonster) {
        console.log('No monsters found with the given parameters');
        return null;
      }

      // Process the monster to add random species, types, and attributes
      return this.processMonster(baseMonster, rollParams);
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  }

  /**
   * Roll multiple monsters with the same parameters
   */
  async rollMany(params: RollParams = {}, count = 1): Promise<RolledMonster[]> {
    try {
      const results: RolledMonster[] = [];

      for (let i = 0; i < count; i++) {
        // Generate a new seed for each roll based on the original seed
        const rollSeed = `${this.seed}-${i}`;
        const roller = new MonsterRollerService({
          seed: rollSeed,
          enabledTables: this.enabledTables,
          userSettings: this.userSettings,
        });

        const monster = await roller.rollMonster(params);
        if (monster) {
          results.push(monster);
        }
      }

      return results;
    } catch (error) {
      console.error('Error rolling multiple monsters:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Monster Processing
  // ==========================================================================

  /**
   * Process a monster to add random species, types, and attributes
   */
  private async processMonster(
    monster: RolledMonster,
    params: RollParams
  ): Promise<RolledMonster> {
    try {
      // Clone the monster to avoid modifying the original
      const processedMonster = { ...monster };

      console.log('Base monster before processing:', monster);

      // Get all available species (using the same filters as the main query)
      const allSpecies = await this.getFilteredNames(params);

      // Determine how many species slots to fill (between min and max)
      const speciesMin = params.species_min ?? 1;
      const speciesMax = params.species_max ?? 2;
      const speciesCount = this.rollNumber(speciesMin, speciesMax);

      // Fill species slots and capture reference image links
      processedMonster.species1 = processedMonster.name;
      processedMonster.species1_image = processedMonster.image_url;

      if (speciesCount > 1 && allSpecies.length > 0) {
        // Roll for species2
        const availableSpecies = allSpecies.filter((s) => s !== processedMonster.species1);
        if (availableSpecies.length > 0) {
          const species2 = this.rollFromArray(availableSpecies);
          processedMonster.species2 = species2;

          // Try to get the image link for species2
          if (species2) {
            const species2Monster = await this.getMonsterByName(species2);
            if (species2Monster) {
              processedMonster.species2_image = species2Monster.image_url;
            }
          }
        }
      }

      if (speciesCount > 2 && allSpecies.length > 0) {
        // Roll for species3
        const availableSpecies = allSpecies.filter(
          (s) => s !== processedMonster.species1 && s !== processedMonster.species2
        );
        if (availableSpecies.length > 0) {
          const species3 = this.rollFromArray(availableSpecies);
          processedMonster.species3 = species3;

          // Try to get the image link for species3
          if (species3) {
            const species3Monster = await this.getMonsterByName(species3);
            if (species3Monster) {
              processedMonster.species3_image = species3Monster.image_url;
            }
          }
        }
      }

      // Determine how many type slots to fill (between min and max)
      const typesMin = params.types_min ?? 1;
      const typesMax = params.types_max ?? 3;
      const typeCount = this.rollNumber(typesMin, typesMax);
      const speciesTypesOptions = params.speciesTypesOptions ?? [];

      // Use species types options if provided, otherwise use standard monster types
      const pokemonTypes: string[] =
        speciesTypesOptions.length > 0 ? speciesTypesOptions : [...MONSTER_TYPES];

      // Fill type1
      processedMonster.type1 = this.rollFromArray(pokemonTypes);

      // Fill additional type slots with unique types
      for (let i = 2; i <= typeCount; i++) {
        const typeField = `type${i}` as keyof RolledMonster;
        const usedTypes: string[] = [];
        for (let j = 1; j < i; j++) {
          const prevTypeField = `type${j}` as keyof RolledMonster;
          const prevType = processedMonster[prevTypeField];
          if (prevType && typeof prevType === 'string') {
            usedTypes.push(prevType);
          }
        }

        const availableTypes = pokemonTypes.filter((t) => !usedTypes.includes(t));
        if (availableTypes.length > 0) {
          (processedMonster as Record<string, unknown>)[typeField] =
            this.rollFromArray(availableTypes);
        }
      }

      // Handle attribute assignment
      if (params.override_attribute) {
        processedMonster.attribute = params.override_attribute;
      } else {
        const attributePool: string[] =
          params.resultAttributeOptions && params.resultAttributeOptions.length > 0
            ? params.resultAttributeOptions
            : [...DIGIMON_ATTRIBUTES];

        const attr = processedMonster.attribute;
        if (!attr || !attributePool.includes(attr)) {
          processedMonster.attribute = this.rollFromArray(attributePool);
        }
      }

      console.log('Final processed monster:', processedMonster);

      return processedMonster;
    } catch (error) {
      console.error('Error processing monster:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Query Building
  // ==========================================================================

  /**
   * Build SQL query based on parameters
   */
  private buildQuery(params: RollParams): { query: string; params: unknown[] } {
    const globalParams: unknown[] = [];
    const tables = params.tables ?? this.enabledTables;

    // Build queries for each table
    const tableQueries = tables.map((table) => {
      const queryParams: unknown[] = [];

      // Build select fields for this table
      const selectFields = this.buildSelectFields(table);
      const tableName = getTableName(table);
      let tableQuery = `SELECT ${selectFields} FROM ${tableName} WHERE 1=1`;

      // Helper function to add parameter
      const addParam = (value: unknown): string => {
        queryParams.push(value);
        return `$${globalParams.length + queryParams.length}`;
      };

      // Helper function to add multiple parameters
      const addParams = (values: unknown[]): string => {
        const placeholders: string[] = [];
        values.forEach((value) => {
          queryParams.push(value);
          placeholders.push(`$${globalParams.length + queryParams.length}`);
        });
        return placeholders.join(',');
      };

      const schema = getTableSchema(table);
      const tableFilter = params.tableFilters?.[table];

      // Add conditions based on schema and params
      tableQuery += this.buildConditions(table, schema, params, tableFilter, addParam, addParams);

      // Add table parameters to global parameters
      globalParams.push(...queryParams);

      return tableQuery;
    });

    // Combine all table queries with UNION
    const query = tableQueries.join(' UNION ');

    return { query, params: globalParams };
  }

  /**
   * Build select fields for a table
   */
  private buildSelectFields(table: MonsterTable): string {
    switch (table) {
      case 'pokemon':
        return `
          id, name,
          type_primary, type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          is_legendary, is_mythical, ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'pokemon' as monster_type
        `;
      case 'digimon':
        return `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          digivolves_from as evolves_from, digivolves_to as evolves_to, breeding_results, '' as stage,
          false as is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          attribute, rank, families,
          digimon_type, natural_attributes, level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'digimon' as monster_type
        `;
      case 'yokai':
        return `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          false as is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          tribe,
          '' as family, '' as subfamily,
          'yokai' as monster_type
        `;
      case 'nexomon':
        return `
          nr as id, name,
          type_primary, type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'nexomon' as monster_type
        `;
      case 'pals':
        return `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          '' as evolves_from, '' as evolves_to, '' as breeding_results, '' as stage,
          false as is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'pals' as monster_type
        `;
      case 'fakemon':
        return `
          id, name,
          type1, type2, type3, type4, type5,
          evolves_from, evolves_to, breeding_results, stage,
          is_legendary, is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'fakemon' as monster_type
        `;
      case 'finalfantasy':
        return `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          false as is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, NULL::text as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'finalfantasy' as monster_type
        `;
      case 'monsterhunter':
        return `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          '' as evolves_from, '' as evolves_to, '' as breeding_results, '' as stage,
          false as is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          element as attribute, rank::text as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          '' as family, '' as subfamily,
          'monsterhunter' as monster_type
        `;
      case 'dragonquest':
        return `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          '' as evolves_from, '' as evolves_to, '' as breeding_results, '' as stage,
          false as is_legendary, false as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          family, subfamily,
          'dragonquest' as monster_type
        `;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  /**
   * Build query conditions
   */
  private buildConditions(
    table: MonsterTable,
    schema: TableSchema,
    params: RollParams,
    tableFilter: TableFilter | undefined,
    addParam: (value: unknown) => string,
    addParams: (values: unknown[]) => string
  ): string {
    let conditions = '';

    // Add conditions for name/species
    if (params.name) {
      conditions += ` AND ${schema.nameField} = ${addParam(params.name)}`;
    } else if (params.includeName && params.includeName.length > 0) {
      conditions += ` AND ${schema.nameField} IN (${addParams(params.includeName)})`;
    }

    if (params.excludeName && params.excludeName.length > 0) {
      conditions += ` AND ${schema.nameField} NOT IN (${addParams(params.excludeName)})`;
    }

    // Add conditions for specific species slots
    if (params.species1) {
      conditions += ` AND ${schema.nameField} = ${addParam(params.species1)}`;
    } else if (params.includeSpecies1 && params.includeSpecies1.length > 0) {
      conditions += ` AND ${schema.nameField} IN (${addParams(params.includeSpecies1)})`;
    }

    if (params.excludeSpecies1 && params.excludeSpecies1.length > 0) {
      conditions += ` AND ${schema.nameField} NOT IN (${addParams(params.excludeSpecies1)})`;
    }

    // Backward compatibility
    if (params.includeSpecies && params.includeSpecies.length > 0) {
      conditions += ` AND ${schema.nameField} IN (${addParams(params.includeSpecies)})`;
    }

    if (params.excludeSpecies && params.excludeSpecies.length > 0) {
      conditions += ` AND ${schema.nameField} NOT IN (${addParams(params.excludeSpecies)})`;
    }

    // Type conditions
    conditions += this.buildTypeConditions(schema, params, addParam, addParams);

    // Attribute conditions
    conditions += this.buildAttributeConditions(schema, params, addParam, addParams);

    // Rarity conditions
    conditions += this.buildRarityConditions(table, schema, params, tableFilter, addParam, addParams);

    // Stage conditions
    conditions += this.buildStageConditions(schema, params, tableFilter, addParam, addParams);

    // Evolution conditions
    conditions += this.buildEvolutionConditions(schema, params, addParam);

    // Table-specific conditions
    conditions += this.buildTableSpecificConditions(table, params, addParam);

    return conditions;
  }

  /**
   * Build type-related conditions
   */
  private buildTypeConditions(
    schema: TableSchema,
    params: RollParams,
    addParam: (value: unknown) => string,
    addParams: (values: unknown[]) => string
  ): string {
    let conditions = '';

    if (schema.typeFields && schema.typeFields.length > 0) {
      // Handle specific type values for each type slot
      schema.typeFields.forEach((typeField, index) => {
        const typeParam = `type${index + 1}` as keyof RollParams;
        const typeValue = params[typeParam];

        if (typeValue && typeof typeValue === 'string') {
          conditions += ` AND ${typeField} = ${addParam(typeValue)}`;
        }

        // Handle include types for specific type slots
        const includeTypeParam = `includeType${index + 1}` as keyof RollParams;
        const includeTypes = params[includeTypeParam] as string[] | undefined;
        if (includeTypes && includeTypes.length > 0) {
          conditions += ` AND ${typeField} IN (${addParams(includeTypes)})`;
        }

        // Handle exclude types for specific type slots
        const excludeTypeParam = `excludeType${index + 1}` as keyof RollParams;
        const excludeTypes = params[excludeTypeParam] as string[] | undefined;
        if (excludeTypes && excludeTypes.length > 0) {
          conditions += ` AND (${typeField} IS NULL OR ${typeField} NOT IN (${addParams(excludeTypes)}))`;
        }
      });

      // Backward compatibility - include types for all type slots
      if (params.includeTypes && params.includeTypes.length > 0) {
        const includeTypes = params.includeTypes;
        conditions += ` AND (`;
        const typeConditions: string[] = [];
        schema.typeFields.forEach((typeField) => {
          typeConditions.push(`${typeField} IN (${addParams(includeTypes)})`);
        });
        conditions += typeConditions.join(' OR ');
        conditions += ')';
      }

      // Backward compatibility - exclude types for all type slots
      if (params.excludeTypes && params.excludeTypes.length > 0) {
        const excludeTypes = params.excludeTypes;
        schema.typeFields.forEach((typeField) => {
          conditions += ` AND (${typeField} IS NULL OR ${typeField} NOT IN (${addParams(excludeTypes)}))`;
        });
      }
    }

    return conditions;
  }

  /**
   * Build attribute-related conditions
   */
  private buildAttributeConditions(
    schema: TableSchema,
    params: RollParams,
    addParam: (value: unknown) => string,
    addParams: (values: unknown[]) => string
  ): string {
    let conditions = '';

    if (schema.attributeField) {
      if (params.attribute) {
        conditions += ` AND ${schema.attributeField} = ${addParam(params.attribute)}`;
      } else if (params.includeAttributes && params.includeAttributes.length > 0) {
        conditions += ` AND ${schema.attributeField} IN (${addParams(params.includeAttributes)})`;
      }

      if (params.excludeAttributes && params.excludeAttributes.length > 0) {
        conditions += ` AND (${schema.attributeField} IS NULL OR ${schema.attributeField} NOT IN (${addParams(params.excludeAttributes)}))`;
      }
    }

    return conditions;
  }

  /**
   * Build rarity-related conditions
   */
  private buildRarityConditions(
    table: MonsterTable,
    schema: TableSchema,
    params: RollParams,
    tableFilter: TableFilter | undefined,
    addParam: (value: unknown) => string,
    addParams: (values: unknown[]) => string
  ): string {
    let conditions = '';

    if (schema.rarityFields && schema.rarityFields.length > 0) {
      schema.rarityFields.forEach((rarityField) => {
        if (rarityField === 'is_legendary') {
          let legendaryValue = params.legendary;
          if (tableFilter?.legendary !== undefined) {
            legendaryValue = tableFilter.legendary;
          }
          if (legendaryValue !== undefined && legendaryValue !== null) {
            conditions += ` AND ${rarityField} = ${addParam(legendaryValue)}`;
          }
        } else if (rarityField === 'is_mythical') {
          let mythicalValue = params.mythical;
          if (tableFilter?.mythical !== undefined) {
            mythicalValue = tableFilter.mythical;
          }
          if (mythicalValue !== undefined && mythicalValue !== null) {
            conditions += ` AND ${rarityField} = ${addParam(mythicalValue)}`;
          }
        } else if (rarityField === 'rank' && params.rank) {
          conditions += ` AND ${rarityField} = ${addParam(params.rank)}`;
        }
      });

      // Handle include ranks
      let includeRanks = params.includeRanks;
      if (tableFilter?.includeRanks) {
        includeRanks = tableFilter.includeRanks;
      }

      if (includeRanks && includeRanks.length > 0) {
        const rankFields = schema.rarityFields.filter((field) => field === 'rank');
        if (rankFields.length > 0) {
          // Monster Hunter uses integer ranks, so skip string rank filters for it
          const allNumeric = includeRanks.every(
            (r) => !isNaN(parseInt(r)) && String(parseInt(r)) === String(r)
          );

          if (table !== 'monsterhunter' || allNumeric) {
            conditions += ` AND rank IN (${addParams(includeRanks)})`;
          }
        }
      }

      // Handle exclude ranks
      let excludeRanks = params.excludeRanks;
      if (tableFilter?.excludeRanks) {
        excludeRanks = tableFilter.excludeRanks;
      }

      if (excludeRanks && excludeRanks.length > 0) {
        const rankFields = schema.rarityFields.filter((field) => field === 'rank');
        if (rankFields.length > 0) {
          const allNumeric = excludeRanks.every(
            (r) => !isNaN(parseInt(r)) && String(parseInt(r)) === String(r)
          );

          if (table !== 'monsterhunter' || allNumeric) {
            conditions += ` AND (rank IS NULL OR rank NOT IN (${addParams(excludeRanks)}))`;
          }
        }
      }
    }

    return conditions;
  }

  /**
   * Build stage-related conditions
   */
  private buildStageConditions(
    schema: TableSchema,
    params: RollParams,
    tableFilter: TableFilter | undefined,
    addParam: (value: unknown) => string,
    addParams: (values: unknown[]) => string
  ): string {
    let conditions = '';

    if (schema.stageField) {
      if (params.stage) {
        conditions += ` AND ${schema.stageField} = ${addParam(params.stage)}`;
      } else {
        let includeStages = params.includeStages;
        if (tableFilter?.includeStages) {
          includeStages = tableFilter.includeStages;
        }

        if (includeStages && includeStages.length > 0) {
          conditions += ` AND ${schema.stageField} IN (${addParams(includeStages)})`;
        }
      }

      let excludeStages = params.excludeStages;
      if (tableFilter?.excludeStages) {
        excludeStages = tableFilter.excludeStages;
      }

      if (excludeStages && excludeStages.length > 0) {
        conditions += ` AND (${schema.stageField} IS NULL OR ${schema.stageField} NOT IN (${addParams(excludeStages)}))`;
      }
    }

    return conditions;
  }

  /**
   * Build evolution-related conditions
   */
  private buildEvolutionConditions(
    schema: TableSchema,
    params: RollParams,
    addParam: (value: unknown) => string
  ): string {
    let conditions = '';

    if (schema.evolutionFields && schema.evolutionFields.length > 0) {
      const [evolvesFromField, evolvesToField] = schema.evolutionFields;

      if (params.evolvesFrom) {
        conditions += ` AND ${evolvesFromField} ILIKE ${addParam(`%${params.evolvesFrom}%`)}`;
      }

      if (params.evolvesTo) {
        conditions += ` AND ${evolvesToField} ILIKE ${addParam(`%${params.evolvesTo}%`)}`;
      }
    }

    return conditions;
  }

  /**
   * Build table-specific conditions
   */
  private buildTableSpecificConditions(
    table: MonsterTable,
    params: RollParams,
    addParam: (value: unknown) => string
  ): string {
    let conditions = '';

    if (table === 'digimon' && params.families) {
      conditions += ` AND families ILIKE ${addParam(`%${params.families}%`)}`;
    }

    if (table === 'digimon' && params.levelRequired) {
      conditions += ` AND level_required = ${addParam(parseInt(String(params.levelRequired)))}`;
    }

    if (table === 'pokemon' && params.ndex) {
      conditions += ` AND ndex = ${addParam(parseInt(String(params.ndex)))}`;
    }

    if (table === 'dragonquest' && params.family) {
      conditions += ` AND family ILIKE ${addParam(`%${params.family}%`)}`;
    }

    if (table === 'dragonquest' && params.subfamily) {
      conditions += ` AND subfamily ILIKE ${addParam(`%${params.subfamily}%`)}`;
    }

    if (params.breedingResults) {
      conditions += ` AND breeding_results ILIKE ${addParam(`%${params.breedingResults}%`)}`;
    }

    return conditions;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Handle onlyLegendary and onlyMythical modes
   */
  private handleOnlyRarityModes(rollParams: RollParams): RollParams {
    const modifiedParams = { ...rollParams };

    if (rollParams.onlyLegendary) {
      console.log('OnlyLegendary mode: Filtering to Pokemon and Nexomon legendaries');

      const legendaryTables: MonsterTable[] = ['pokemon', 'nexomon'];
      const availableLegendaryTables = (modifiedParams.tables ?? []).filter((table) =>
        legendaryTables.includes(table)
      );

      if (availableLegendaryTables.length > 0) {
        modifiedParams.tables = availableLegendaryTables;
        modifiedParams.legendary = true;
        console.log(`OnlyLegendary: Using tables ${availableLegendaryTables.join(', ')}`);
      } else {
        console.log('OnlyLegendary: No suitable tables available, falling back to default roll');
      }
    }

    if (rollParams.onlyMythical) {
      console.log(
        'OnlyMythical mode: Filtering to Pokemon mythicals, Nexomon mythicals, and Yokai S-rank'
      );

      const mythicalCapableTables: MonsterTable[] = ['pokemon', 'nexomon', 'yokai'];
      const availableMythicalTables = (modifiedParams.tables ?? []).filter((table) =>
        mythicalCapableTables.includes(table)
      );

      if (availableMythicalTables.length > 0) {
        modifiedParams.tables = availableMythicalTables;
        modifiedParams.tableFilters = modifiedParams.tableFilters ?? {};

        if (availableMythicalTables.includes('pokemon')) {
          modifiedParams.tableFilters.pokemon = { mythical: true };
        }

        if (availableMythicalTables.includes('nexomon')) {
          modifiedParams.tableFilters.nexomon = { mythical: true };
        }

        if (availableMythicalTables.includes('yokai')) {
          modifiedParams.tableFilters.yokai = { includeRanks: ['S'] };
        }

        console.log(
          `OnlyMythical: Using tables ${availableMythicalTables.join(', ')} with specific filters`
        );
      } else {
        console.log('OnlyMythical: No suitable tables available, falling back to default roll');
      }
    }

    return modifiedParams;
  }

  /**
   * Get filtered names using the same filters as the main query.
   * Limits per-table contribution so no single table dominates the species pool.
   */
  async getFilteredNames(params: RollParams): Promise<string[]> {
    try {
      const globalParams: unknown[] = [];
      const tables = params.tables ?? this.enabledTables;

      // Cap each table's contribution to balance the species pool
      const perTableLimit = Math.max(100, Math.ceil(1000 / tables.length));

      const tableQueries = tables.map((table) => {
        const schema = getTableSchema(table);
        const queryParams: unknown[] = [];
        const tableFilter = params.tableFilters?.[table];

        const addParam = (value: unknown): string => {
          queryParams.push(value);
          return `$${globalParams.length + queryParams.length}`;
        };

        const addParams = (values: unknown[]): string => {
          const placeholders: string[] = [];
          values.forEach((value) => {
            queryParams.push(value);
            placeholders.push(`$${globalParams.length + queryParams.length}`);
          });
          return placeholders.join(',');
        };

        const tableName = getTableName(table);
        let tableQuery = `SELECT DISTINCT ${schema.nameField} as name FROM ${tableName} WHERE ${schema.nameField} IS NOT NULL`;

        // Apply rarity conditions
        tableQuery += this.buildRarityConditions(
          table,
          schema,
          params,
          tableFilter,
          addParam,
          addParams
        );

        // Apply stage conditions
        tableQuery += this.buildStageConditions(schema, params, tableFilter, addParam, addParams);

        // Limit per-table contribution
        tableQuery += ` ORDER BY ${schema.nameField} LIMIT ${perTableLimit}`;

        globalParams.push(...queryParams);

        // Wrap in parens so LIMIT applies per-table, not to the whole UNION
        return `(${tableQuery})`;
      });

      const query = tableQueries.join(' UNION ');
      const result = await db.query<{ name: string }>(query, globalParams);

      return result.rows.map((n) => n.name).filter((n) => n);
    } catch (error) {
      console.error('Error getting filtered names:', error);
      throw error;
    }
  }

  /**
   * Get all names from enabled tables
   */
  async getAllNames(): Promise<string[]> {
    try {
      const nameQueries = this.enabledTables.map((table) => {
        const schema = getTableSchema(table);
        const tableName = getTableName(table);
        return `SELECT DISTINCT ${schema.nameField} as name FROM ${tableName} WHERE ${schema.nameField} IS NOT NULL`;
      });

      const query = nameQueries.join(' UNION ');
      const result = await db.query<{ name: string }>(query);

      return result.rows.map((n) => n.name).filter((n) => n);
    } catch (error) {
      console.error('Error getting all names:', error);
      throw error;
    }
  }

  /**
   * Get all types from enabled tables
   */
  async getAllTypes(): Promise<string[]> {
    try {
      const typeQueries: string[] = [];

      this.enabledTables.forEach((table) => {
        const schema = getTableSchema(table);

        if (schema.typeFields && schema.typeFields.length > 0) {
          const tableName = getTableName(table);
          schema.typeFields.forEach((typeField) => {
            typeQueries.push(
              `SELECT DISTINCT ${typeField} as type FROM ${tableName} WHERE ${typeField} IS NOT NULL`
            );
          });
        }
      });

      if (typeQueries.length === 0) {
        return [];
      }

      const query = typeQueries.join(' UNION ');
      const result = await db.query<{ type: string }>(query);

      return result.rows.map((t) => t.type).filter((t) => t);
    } catch (error) {
      console.error('Error getting all types:', error);
      throw error;
    }
  }

  /**
   * Get all attributes from enabled tables
   */
  async getAllAttributes(): Promise<string[]> {
    try {
      const attributeQueries: string[] = [];

      this.enabledTables.forEach((table) => {
        const schema = getTableSchema(table);

        if (schema.attributeField) {
          const tableName = getTableName(table);
          attributeQueries.push(
            `SELECT DISTINCT ${schema.attributeField} as attribute FROM ${tableName} WHERE ${schema.attributeField} IS NOT NULL`
          );
        }
      });

      if (attributeQueries.length === 0) {
        return [];
      }

      const query = attributeQueries.join(' UNION ');
      const result = await db.query<{ attribute: string }>(query);

      return result.rows.map((a) => a.attribute).filter((a) => a);
    } catch (error) {
      console.error('Error getting all attributes:', error);
      throw error;
    }
  }

  /**
   * Get all ranks from enabled tables
   */
  async getAllRanks(): Promise<string[]> {
    try {
      const rankQueries: string[] = [];

      this.enabledTables.forEach((table) => {
        const schema = getTableSchema(table);

        if (schema.rarityFields?.includes('rank')) {
          const tableName = getTableName(table);
          rankQueries.push(`SELECT DISTINCT rank FROM ${tableName} WHERE rank IS NOT NULL`);
        }
      });

      if (rankQueries.length === 0) {
        return [];
      }

      const query = rankQueries.join(' UNION ');
      const result = await db.query<{ rank: string }>(query);

      return result.rows.map((r) => r.rank).filter((r) => r);
    } catch (error) {
      console.error('Error getting all ranks:', error);
      throw error;
    }
  }

  /**
   * Get all stages from enabled tables
   */
  async getAllStages(): Promise<string[]> {
    try {
      const stageQueries: string[] = [];

      this.enabledTables.forEach((table) => {
        const schema = getTableSchema(table);

        if (schema.stageField) {
          const tableName = getTableName(table);
          stageQueries.push(
            `SELECT DISTINCT ${schema.stageField} as stage FROM ${tableName} WHERE ${schema.stageField} IS NOT NULL`
          );
        }
      });

      if (stageQueries.length === 0) {
        return [];
      }

      const query = stageQueries.join(' UNION ');
      const result = await db.query<{ stage: string }>(query);

      return result.rows.map((s) => s.stage).filter((s) => s);
    } catch (error) {
      console.error('Error getting all stages:', error);
      throw error;
    }
  }

  /**
   * Get all Digimon families
   */
  async getAllFamilies(): Promise<string[]> {
    try {
      if (!this.enabledTables.includes('digimon')) {
        return [];
      }

      const query = `
        SELECT families FROM digimon_monsters
        WHERE families IS NOT NULL AND families != ''
      `;

      const result = await db.query<{ families: string }>(query);
      const familiesSet = new Set<string>();

      result.rows.forEach((row) => {
        const families = row.families.split(',').map((f) => f.trim());
        families.forEach((family) => {
          if (family) {
            familiesSet.add(family);
          }
        });
      });

      return Array.from(familiesSet).sort();
    } catch (error) {
      console.error('Error getting all Digimon families:', error);
      throw error;
    }
  }

  /**
   * Get a monster by name from any of the enabled tables
   */
  async getMonsterByName(name: string): Promise<RolledMonster | null> {
    try {
      for (const table of this.enabledTables) {
        const schema = getTableSchema(table);
        const tableName = getTableName(table);

        const query = `SELECT * FROM ${tableName} WHERE ${schema.nameField} = $1`;
        const result = await db.query<RolledMonster>(query, [name]);

        const monster = result.rows[0];
        if (monster) {
          return { ...monster, monster_type: table };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting monster by name (${name}):`, error);
      return null;
    }
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
