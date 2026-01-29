const db = require('../config/db');
const seedrandom = require('seedrandom');
const { isPostgreSQL } = require('../utils/dbUtils');

/**
 * MonsterRoller class for rolling monsters with various parameters
 */
class MonsterRoller {
  /**
   * Constructor
   * @param {Object} dbOrOptions - Database connection or options object
   * @param {Object} options - Options for the roller (if first param is db)
   */
  constructor(dbOrOptions = {}, options = {}) {
    // Handle the case where the first parameter is a database connection
    if (typeof dbOrOptions.asyncGet === 'function' && typeof dbOrOptions.asyncAll === 'function') {
      // First parameter is a database connection
      this.db = dbOrOptions;
      options = options || {};
    } else {
      // First parameter is options
      this.db = db; // Use the imported db
      options = dbOrOptions || {};
    }

    this.seed = options.seed || Date.now().toString();
    this.rng = seedrandom(this.seed);
    this.enabledTables = options.enabledTables || ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'];
    this.userSettings = options.userSettings || {
      pokemon_enabled: true,
      digimon_enabled: true,
      yokai_enabled: true,
      nexomon_enabled: true,
      pals_enabled: true,
      fakemon_enabled: true,
      finalfantasy_enabled: true,
      monsterhunter_enabled: true
    };

    console.log('MonsterRoller - Received userSettings:', this.userSettings);

    // Define table schemas for each monster type
    this.tableSchemas = {
      pokemon: {
        idField: 'id',
        nameField: 'name',
        typeFields: ['type_primary', 'type_secondary'],
        attributeField: null,
        rarityFields: ['is_legendary', 'is_mythical'],
        evolutionFields: ['evolves_from', 'evolves_to'],
        stageField: 'stage',
        imageField: 'image_url',
        additionalFields: ['ndex', 'breeding_results']
      },
      digimon: {
        idField: 'id',
        nameField: 'name',
        typeFields: ['digimon_type'],
        attributeField: 'attribute',
        rarityFields: ['rank'],
        evolutionFields: ['digivolves_from', 'digivolves_to'],
        stageField: null,
        imageField: 'image_url',
        additionalFields: ['families', 'natural_attributes', 'level_required', 'breeding_results']
      },
      yokai: {
        idField: 'id',
        nameField: 'name',
        typeFields: ['tribe'],
        attributeField: null,
        rarityFields: ['rank'],
        evolutionFields: ['evolves_from', 'evolves_to'],
        stageField: null, // Yokai should only use rank filtering, not stage filtering
        imageField: 'image_url',
        additionalFields: ['breeding_results']
      },
      nexomon: {
        idField: 'nr',
        nameField: 'name',
        typeFields: ['type_primary', 'type_secondary'],
        attributeField: null,
        rarityFields: ['is_legendary'],
        evolutionFields: ['evolves_from', 'evolves_to'],
        stageField: 'stage',
        imageField: 'image_url',
        additionalFields: ['breeding_results']
      },
      pals: {
        idField: 'id',
        nameField: 'name',
        typeFields: [],
        attributeField: null,
        rarityFields: [],
        evolutionFields: [],
        stageField: null,
        imageField: 'image_url',
        additionalFields: []
      },
      fakemon: {
        idField: 'id',
        nameField: 'name',
        typeFields: ['type1', 'type2', 'type3', 'type4', 'type5'],
        attributeField: 'attribute',
        rarityFields: ['is_legendary', 'is_mythical'],
        evolutionFields: ['evolves_from', 'evolves_to'],
        stageField: 'stage',
        imageField: 'image_url',
        additionalFields: ['breeding_results']
      },
      finalfantasy: {
        idField: 'id',
        nameField: 'name',
        typeFields: [],
        attributeField: null,
        rarityFields: [],
        evolutionFields: ['evolves_from', 'evolves_to'],
        stageField: 'stage',
        imageField: 'image_url',
        additionalFields: ['breeding_results']
      },
      monsterhunter: {
        idField: 'id',
        nameField: 'name',
        typeFields: [],
        attributeField: 'element',
        rarityFields: ['rank'],
        evolutionFields: [],
        stageField: null,
        imageField: 'image_url',
        additionalFields: []
      }
    };

    // Apply user settings to enabled tables
    this.applyUserSettings();
  }

  /**
   * Apply user settings to enabled tables
   */
  applyUserSettings() {
    // Filter enabled tables based on user settings
    this.enabledTables = this.enabledTables.filter(table => {
      const settingKey = `${table}_enabled`;
      return this.userSettings[settingKey] === true;
    });

    console.log('Enabled tables after applying user settings:', this.enabledTables);
  }

  /**
   * Roll a random number between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  rollNumber(min, max) {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  /**
   * Roll a random element from an array
   * @param {Array} array - Array to roll from
   * @returns {*} Random element
   */
  rollFromArray(array) {
    if (!array || array.length === 0) return null;
    return array[this.rollNumber(0, array.length - 1)];
  }

  /**
   * Roll a monster with the given parameters
   * @param {Object} params - Parameters for rolling
   * @returns {Promise<Object>} Rolled monster
   */
  async rollMonster(params = {}) {
    try {
      // Default parameters
      const defaultParams = {
        tables: this.enabledTables,
        // Species slots
        species1: null,
        species2: null,
        species3: null,
        includeSpecies1: [],
        excludeSpecies1: [],
        includeSpecies2: [],
        excludeSpecies2: [],
        includeSpecies3: [],
        excludeSpecies3: [],
        // Type slots
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
        // Other parameters
        attribute: null,
        rarity: null,
        legendary: false, // Default to not legendary
        mythical: false,  // Default to not mythical
        onlyLegendary: false, // Only roll legendary monsters
        onlyMythical: false,  // Only roll mythical monsters
        // Stage parameters
        includeStages: [], // No default stage filtering
        // Digimon rank parameters
        includeRanks: [], // No default rank filtering
        // For backward compatibility
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
        // Quantity settings
        species_min: null,
        species_max: null, // Default to max 2 species
        types_min: null,
        types_max: null  // Default to max 3 types
      };

      // Merge default parameters with provided parameters
      let rollParams = { ...defaultParams, ...params };

      // Ensure we never include tables disabled by user settings
      rollParams.tables = rollParams.tables.filter(table => this.enabledTables.includes(table));

      // Handle onlyLegendary and onlyMythical modes with proper table filtering
      if (rollParams.onlyLegendary || rollParams.onlyMythical) {
        rollParams = this.handleOnlyRarityModes(rollParams);
      }

      // If no tables are enabled after filtering, return null
      if (rollParams.tables.length === 0) {
        console.log('No tables enabled for rolling');
        return null;
      }

      // Build query based on parameters
      const { query, params: queryParams } = this.buildQuery(rollParams);

      // Debug logging
      console.log('Generated query:', query);
      console.log('Query parameters count:', queryParams.length);
      console.log('Query parameters:', queryParams);

      // Count placeholders in query
      const placeholderCount = (query.match(/\$\d+/g) || []).length;
      console.log('Placeholder count in query:', placeholderCount);

      // Execute query
      const monsters = await db.asyncAll(query, queryParams);

      // If no monsters found, return null
      if (!monsters || monsters.length === 0) {
        console.log('No monsters found with the given parameters');
        return null;
      }

      // Roll a random monster from the results
      const baseMonster = this.rollFromArray(monsters);

      // Process the monster to add random species, types, and attributes
      return this.processMonster(baseMonster, rollParams);
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  }

  /**
   * Process a monster to add random species, types, and attributes
   * @param {Object} monster - Base monster
   * @param {Object} params - Parameters for rolling
   * @returns {Object} Processed monster
   */
  async processMonster(monster, params) {
    try {
      // Clone the monster to avoid modifying the original
      const processedMonster = { ...monster };
      
      console.log('Base monster before processing:', monster);
      console.log('Base monster image_url:', monster.image_url);

      // Get all available species (using the same filters as the main query)
      const allSpecies = await this.getFilteredNames(params);

      // Determine how many species slots to fill (between min and max)
      const speciesCount = this.rollNumber(params.species_min, params.species_max);

      // Fill species slots and capture reference image links
      processedMonster.species1 = processedMonster.name; // First species is always the monster's name
      
      // For species1, use the base monster's image_url directly (it's the same monster)
      processedMonster.species1_image = processedMonster.image_url;
      console.log(`Set species1_image directly from base monster: ${processedMonster.image_url}`);
      
      // No need to look up the same monster again - we already have its image_url
      // The getMonsterByName lookup was causing 404 errors because it's trying to find
      // the monster by name again, but we already have all its data

      if (speciesCount > 1 && allSpecies.length > 0) {
        // Roll for species2
        const availableSpecies = allSpecies.filter(s => s !== processedMonster.species1);
        if (availableSpecies.length > 0) {
          const species2 = this.rollFromArray(availableSpecies);
          processedMonster.species2 = species2;

          // Try to get the image link for species2
          try {
            const species2Monster = await this.getMonsterByName(species2);
            if (species2Monster) {
              processedMonster.species2_image = species2Monster.image_url;
            }
          } catch (error) {
            console.error(`Error getting image for species2 (${species2}):`, error);
          }
        }
      }

      if (speciesCount > 2 && allSpecies.length > 0) {
        // Roll for species3
        const availableSpecies = allSpecies.filter(s =>
          s !== processedMonster.species1 && s !== processedMonster.species2
        );
        if (availableSpecies.length > 0) {
          const species3 = this.rollFromArray(availableSpecies);
          processedMonster.species3 = species3;

          // Try to get the image link for species3
          try {
            const species3Monster = await this.getMonsterByName(species3);
            if (species3Monster) {
              processedMonster.species3_image = species3Monster.image_url;
            }
          } catch (error) {
            console.error(`Error getting image for species3 (${species3}):`, error);
          }
        }
      }

      // Determine how many type slots to fill (between min and max)
      const typeCount = this.rollNumber(params.types_min, params.types_max);
      const speciesTypesOptions = params.speciesTypesOptions;


      if (speciesTypesOptions.length > 0) {
        let pokemonTypes = speciesTypesOptions;
        
        console.log('Using species types options:', pokemonTypes);

      processedMonster.type1 = this.rollFromArray(pokemonTypes);

      // Use only Pokemon types for all monster types

      // Fill additional type slots with Pokemon types
      for (let i = 2; i <= typeCount; i++) {
        const typeField = `type${i}`;
        const usedTypes = [];
        for (let j = 1; j < i; j++) {
          usedTypes.push(processedMonster[`type${j}`]);
        }

        const availableTypes = pokemonTypes.filter(t => !usedTypes.includes(t));
        if (availableTypes.length > 0) {
          processedMonster[typeField] = this.rollFromArray(availableTypes);
        }
      }
      }
      else {
         // Pokemon types (standard 18 types)
         let pokemonTypes = [
           'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
           'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
           'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
        ];
        // Fill type slots with completely random types (not related to the species)
      processedMonster.type1 = this.rollFromArray(pokemonTypes);

      // Use only Pokemon types for all monster types

      // Fill additional type slots with Pokemon types
      for (let i = 2; i <= typeCount; i++) {
        const typeField = `type${i}`;
        const usedTypes = [];
        for (let j = 1; j < i; j++) {
          usedTypes.push(processedMonster[`type${j}`]);
        }

        const availableTypes = pokemonTypes.filter(t => !usedTypes.includes(t));
        if (availableTypes.length > 0) {
          processedMonster[typeField] = this.rollFromArray(availableTypes);
        }
      }
      }

      

      // Set attribute if not already set
      if (!processedMonster.attribute) {
        // Digimon attributes - only use these specific values
        const digimonAttributes = ['Data', 'Virus', 'Vaccine', 'Variable', 'Free'];
        processedMonster.attribute = this.rollFromArray(digimonAttributes);
      }

      console.log('Final processed monster:', processedMonster);
      console.log('Final processed monster image_url:', processedMonster.image_url);
      console.log('Final processed monster species1_image:', processedMonster.species1_image);

      return processedMonster;
    } catch (error) {
      console.error('Error processing monster:', error);
      throw error;
    }
  }

  /**
   * Roll multiple monsters with the same parameters
   * @param {Object} params - Parameters for rolling
   * @param {number} count - Number of monsters to roll
   * @returns {Promise<Array>} Array of rolled monsters
   */
  async rollMany(params = {}, count = 1) {
    try {
      const results = [];

      for (let i = 0; i < count; i++) {
        // Generate a new seed for each roll based on the original seed
        const rollSeed = `${this.seed}-${i}`;
        const roller = new MonsterRoller({
          seed: rollSeed,
          enabledTables: this.enabledTables,
          userSettings: this.userSettings
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

  /**
   * Build SQL query based on parameters
   * @param {Object} params - Parameters for rolling
   * @returns {Object} Query and parameters
   */
  buildQuery(params) {
    // Start building the query
    let query = '';
    const globalParams = []; // All parameters across all tables

    // Build queries for each table
    const tableQueries = params.tables.map((table, tableIndex) => {
      const schema = this.tableSchemas[table];
      const queryParams = []; // Parameters for this specific table query
      let paramOffset = globalParams.length; // Track parameter offset for PostgreSQL

      // Define the fields to select based on the table
      let selectFields = '';

      if (table === 'pokemon') {
        selectFields = `
          id, name,
          type_primary, type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          is_legendary, is_mythical, ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          'pokemon' as monster_type
        `;
      } else if (table === 'digimon') {
        selectFields = `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          digivolves_from as evolves_from, digivolves_to as evolves_to, breeding_results, '' as stage,
          ${isPostgreSQL ? 'false' : '0'} as is_legendary, ${isPostgreSQL ? 'false' : '0'} as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          attribute, rank, families,
          digimon_type, natural_attributes, level_required,
          '' as tribe,
          'digimon' as monster_type
        `;
      } else if (table === 'yokai') {
        selectFields = `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          ${isPostgreSQL ? 'false' : '0'} as is_legendary, ${isPostgreSQL ? 'false' : '0'} as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          tribe,
          'yokai' as monster_type
        `;
      } else if (table === 'nexomon') {
        selectFields = `
          nr as id, name,
          type_primary, type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          is_legendary, ${isPostgreSQL ? 'false' : '0'} as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          'nexomon' as monster_type
        `;
      } else if (table === 'pals') {
        selectFields = `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          '' as evolves_from, '' as evolves_to, '' as breeding_results, '' as stage,
          ${isPostgreSQL ? 'false' : '0'} as is_legendary, ${isPostgreSQL ? 'false' : '0'} as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          'pals' as monster_type
        `;
      } else if (table === 'fakemon') {
        selectFields = `
          id, name,
          type1, type2, type3, type4, type5,
          evolves_from, evolves_to, breeding_results, stage,
          is_legendary, is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          attribute, '' as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          'fakemon' as monster_type
        `;
      } else if (table === 'finalfantasy') {
        selectFields = `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          evolves_from, evolves_to, breeding_results, stage,
          ${isPostgreSQL ? 'false' : '0'} as is_legendary, ${isPostgreSQL ? 'false' : '0'} as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          '' as attribute, ${isPostgreSQL ? 'NULL::text' : 'NULL'} as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          'finalfantasy' as monster_type
        `;
      } else if (table === 'monsterhunter') {
        selectFields = `
          id, name,
          '' as type_primary, '' as type_secondary, '' as type3, '' as type4, '' as type5,
          '' as evolves_from, '' as evolves_to, '' as breeding_results, '' as stage,
          ${isPostgreSQL ? 'false' : '0'} as is_legendary, ${isPostgreSQL ? 'false' : '0'} as is_mythical, 0 as ndex, image_url,
          '' as species2, '' as species3,
          element as attribute, ${isPostgreSQL ? 'rank::text' : 'CAST(rank AS TEXT)'} as rank, '' as families,
          '' as digimon_type, '' as natural_attributes, 0 as level_required,
          '' as tribe,
          'monsterhunter' as monster_type
        `;
      }

      let tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
      let tableQuery = `SELECT ${selectFields} FROM ${tableName} WHERE 1=1`;

      // Helper function to add parameter with proper placeholder
      const addParam = (value) => {
        queryParams.push(value);
        if (isPostgreSQL) {
          return `$${globalParams.length + queryParams.length}`;
        } else {
          return '?';
        }
      };

      // Helper function to add multiple parameters with proper placeholders
      const addParams = (values) => {
        const placeholders = [];
        values.forEach(value => {
          queryParams.push(value);
          if (isPostgreSQL) {
            placeholders.push(`$${globalParams.length + queryParams.length}`);
          } else {
            placeholders.push('?');
          }
        });
        return placeholders.join(',');
      };

      // Add conditions for name/species
      if (params.name) {
        tableQuery += ` AND ${schema.nameField} = ${addParam(params.name)}`;
      } else if (params.includeName && params.includeName.length > 0) {
        const placeholders = addParams(params.includeName);
        tableQuery += ` AND ${schema.nameField} IN (${placeholders})`;
      }

      if (params.excludeName && params.excludeName.length > 0) {
        const placeholders = addParams(params.excludeName);
        tableQuery += ` AND ${schema.nameField} NOT IN (${placeholders})`;
      }

      // Add conditions for specific species slots
      if (params.species1) {
        tableQuery += ` AND ${schema.nameField} = ${addParam(params.species1)}`;
      } else if (params.includeSpecies1 && params.includeSpecies1.length > 0) {
        const placeholders = addParams(params.includeSpecies1);
        tableQuery += ` AND ${schema.nameField} IN (${placeholders})`;
      }

      if (params.excludeSpecies1 && params.excludeSpecies1.length > 0) {
        const placeholders = addParams(params.excludeSpecies1);
        tableQuery += ` AND ${schema.nameField} NOT IN (${placeholders})`;
      }

      // For backward compatibility
      if (params.includeSpecies && params.includeSpecies.length > 0) {
        const placeholders = addParams(params.includeSpecies);
        tableQuery += ` AND ${schema.nameField} IN (${placeholders})`;
      }

      if (params.excludeSpecies && params.excludeSpecies.length > 0) {
        const placeholders = addParams(params.excludeSpecies);
        tableQuery += ` AND ${schema.nameField} NOT IN (${placeholders})`;
      }

      // Add conditions for types based on the table schema
      if (schema.typeFields && schema.typeFields.length > 0) {
        // Handle specific type values for each type slot
        schema.typeFields.forEach((typeField, index) => {
          const typeParam = `type${index + 1}`;

          if (params[typeParam]) {
            tableQuery += ` AND ${typeField} = ${addParam(params[typeParam])}`;
          }

          // Handle include types for specific type slots
          const includeTypeParam = `includeType${index + 1}`;
          if (params[includeTypeParam] && params[includeTypeParam].length > 0) {
            const placeholders = addParams(params[includeTypeParam]);
            tableQuery += ` AND ${typeField} IN (${placeholders})`;
          }

          // Handle exclude types for specific type slots
          const excludeTypeParam = `excludeType${index + 1}`;
          if (params[excludeTypeParam] && params[excludeTypeParam].length > 0) {
            const placeholders = addParams(params[excludeTypeParam]);
            tableQuery += ` AND (${typeField} IS NULL OR ${typeField} NOT IN (${placeholders}))`;
          }
        });

        // For backward compatibility - handle include types for all type slots
        if (params.includeTypes && params.includeTypes.length > 0) {
          tableQuery += ` AND (`;
          const typeConditions = [];

          schema.typeFields.forEach(typeField => {
            const placeholders = addParams(params.includeTypes);
            typeConditions.push(`${typeField} IN (${placeholders})`);
          });

          tableQuery += typeConditions.join(' OR ');
          tableQuery += ')';
        }

        // For backward compatibility - handle exclude types for all type slots
        if (params.excludeTypes && params.excludeTypes.length > 0) {
          schema.typeFields.forEach(typeField => {
            const placeholders = addParams(params.excludeTypes);
            tableQuery += ` AND (${typeField} IS NULL OR ${typeField} NOT IN (${placeholders}))`;
          });
        }
      }

      // Add conditions for attribute
      if (schema.attributeField) {
        if (params.attribute) {
          tableQuery += ` AND ${schema.attributeField} = ${addParam(params.attribute)}`;
        } else if (params.includeAttributes && params.includeAttributes.length > 0) {
          const placeholders = addParams(params.includeAttributes);
          tableQuery += ` AND ${schema.attributeField} IN (${placeholders})`;
        }

        if (params.excludeAttributes && params.excludeAttributes.length > 0) {
          const placeholders = addParams(params.excludeAttributes);
          tableQuery += ` AND (${schema.attributeField} IS NULL OR ${schema.attributeField} NOT IN (${placeholders}))`;
        }
      }

      // Check for table-specific filters first
      const tableFilter = params.tableFilters && params.tableFilters[table];
      
      // Add conditions for rarity fields
      if (schema.rarityFields && schema.rarityFields.length > 0) {
        // Handle specific rarity values
        schema.rarityFields.forEach(rarityField => {
          // Check table-specific filters first, then fall back to global filters
          if (rarityField === 'is_legendary') {
            let legendaryValue = params.legendary;
            if (tableFilter && tableFilter.legendary !== undefined) {
              legendaryValue = tableFilter.legendary;
            }
            if (legendaryValue !== undefined && legendaryValue !== '') {
              const boolValue = legendaryValue === 'true' || legendaryValue === true;
              tableQuery += ` AND ${rarityField} = ${addParam(isPostgreSQL ? boolValue : (boolValue ? 1 : 0))}`;
            }
          } else if (rarityField === 'is_mythical') {
            let mythicalValue = params.mythical;
            if (tableFilter && tableFilter.mythical !== undefined) {
              mythicalValue = tableFilter.mythical;
            }
            if (mythicalValue !== undefined && mythicalValue !== '') {
              const boolValue = mythicalValue === 'true' || mythicalValue === true;
              tableQuery += ` AND ${rarityField} = ${addParam(isPostgreSQL ? boolValue : (boolValue ? 1 : 0))}`;
            }
          } else if (rarityField === 'rank' && params.rank) {
            tableQuery += ` AND ${rarityField} = ${addParam(params.rank)}`;
          }
        });

        // Handle include ranks - check table-specific filters first
        let includeRanks = params.includeRanks;
        if (tableFilter && tableFilter.includeRanks) {
          includeRanks = tableFilter.includeRanks;
        }
        
        if (includeRanks && includeRanks.length > 0) {
          const rankFields = schema.rarityFields.filter(field => field === 'rank');
          if (rankFields.length > 0) {
            // Only add rank filtering if this table actually uses ranks
            const placeholders = addParams(includeRanks);
            tableQuery += ` AND rank IN (${placeholders})`;
          }
        }

        // Handle exclude ranks - check table-specific filters first
        let excludeRanks = params.excludeRanks;
        if (tableFilter && tableFilter.excludeRanks) {
          excludeRanks = tableFilter.excludeRanks;
        }
        
        if (excludeRanks && excludeRanks.length > 0) {
          const rankFields = schema.rarityFields.filter(field => field === 'rank');
          if (rankFields.length > 0) {
            // Only add rank filtering if this table actually uses ranks
            const placeholders = addParams(excludeRanks);
            tableQuery += ` AND (rank IS NULL OR rank NOT IN (${placeholders}))`;
          }
        }
      }

      // Add conditions for stage - check table-specific filters first
      if (schema.stageField) {
        if (params.stage) {
          tableQuery += ` AND ${schema.stageField} = ${addParam(params.stage)}`;
        } else {
          // Check table-specific stage filters first
          let includeStages = params.includeStages;
          if (tableFilter && tableFilter.includeStages) {
            includeStages = tableFilter.includeStages;
          }
          
          if (includeStages && includeStages.length > 0) {
            const placeholders = addParams(includeStages);
            tableQuery += ` AND ${schema.stageField} IN (${placeholders})`;
          }
        }

        // Handle exclude stages - check table-specific filters first
        let excludeStages = params.excludeStages;
        if (tableFilter && tableFilter.excludeStages) {
          excludeStages = tableFilter.excludeStages;
        }
        
        if (excludeStages && excludeStages.length > 0) {
          const placeholders = addParams(excludeStages);
          tableQuery += ` AND (${schema.stageField} IS NULL OR ${schema.stageField} NOT IN (${placeholders}))`;
        }
      }

      // Add conditions for evolution fields
      if (schema.evolutionFields && schema.evolutionFields.length > 0) {
        const [evolvesFromField, evolvesToField] = schema.evolutionFields;

        if (params.evolvesFrom) {
          const likeOperator = isPostgreSQL ? 'ILIKE' : 'LIKE';
          tableQuery += ` AND ${evolvesFromField} ${likeOperator} ${addParam(`%${params.evolvesFrom}%`)}`;
        }

        if (params.evolvesTo) {
          const likeOperator = isPostgreSQL ? 'ILIKE' : 'LIKE';
          tableQuery += ` AND ${evolvesToField} ${likeOperator} ${addParam(`%${params.evolvesTo}%`)}`;
        }
      }

      // Add custom conditions based on table-specific fields
      if (table === 'digimon' && params.families) {
        const likeOperator = isPostgreSQL ? 'ILIKE' : 'LIKE';
        tableQuery += ` AND families ${likeOperator} ${addParam(`%${params.families}%`)}`;
      }

      if (table === 'digimon' && params.levelRequired) {
        tableQuery += ` AND level_required = ${addParam(parseInt(params.levelRequired))}`;
      }

      if (table === 'pokemon' && params.ndex) {
        tableQuery += ` AND ndex = ${addParam(parseInt(params.ndex))}`;
      }

      if (params.breedingResults) {
        const breedingField = table === 'digimon' ? 'breeding_results' : 'breeding_results';
        const likeOperator = isPostgreSQL ? 'ILIKE' : 'LIKE';
        tableQuery += ` AND ${breedingField} ${likeOperator} ${addParam(`%${params.breedingResults}%`)}`;
      }

      // Add table parameters to global parameters array
      globalParams.push(...queryParams);

      // Return both the query and its parameters
      return { query: tableQuery, params: queryParams };
    });

    // Extract queries
    const queries = tableQueries.map(result => result.query);

    // Combine all table queries with UNION
    query = queries.join(' UNION ');

    return { query, params: globalParams };
  }

  /**
   * Get all names from enabled tables
   * @returns {Promise<Array>} Array of names
   */
  async getAllNames() {
    try {
      const nameQueries = this.enabledTables.map(table => {
        const schema = this.tableSchemas[table];
        const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
        return `SELECT DISTINCT ${schema.nameField} as name FROM ${tableName} WHERE ${schema.nameField} IS NOT NULL`;
      });

      const query = nameQueries.join(' UNION ');
      const names = await db.asyncAll(query);

      return names.map(n => n.name).filter(n => n);
    } catch (error) {
      console.error('Error getting all names:', error);
      throw error;
    }
  }

  /**
   * Get filtered names using the same filters as the main query
   * @param {Object} params - Parameters with filtering rules
   * @returns {Promise<Array>} Array of filtered names
   */
  async getFilteredNames(params) {
    try {
      // Build the same query structure as buildQuery but only select names
      const globalParams = [];

      const tableQueries = params.tables.map((table, tableIndex) => {
        const schema = this.tableSchemas[table];
        const queryParams = [];

        // Check for table-specific filters first
        const tableFilter = params.tableFilters && params.tableFilters[table];

        // Helper function to add parameter with proper placeholder
        const addParam = (value) => {
          queryParams.push(value);
          if (isPostgreSQL) {
            return `$${globalParams.length + queryParams.length}`;
          } else {
            return '?';
          }
        };

        // Helper function to add multiple parameters with proper placeholders
        const addParams = (values) => {
          const placeholders = [];
          values.forEach(value => {
            queryParams.push(value);
            if (isPostgreSQL) {
              placeholders.push(`$${globalParams.length + queryParams.length}`);
            } else {
              placeholders.push('?');
            }
          });
          return placeholders.join(',');
        };

        const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
        let tableQuery = `SELECT DISTINCT ${schema.nameField} as name FROM ${tableName} WHERE ${schema.nameField} IS NOT NULL`;

        // Apply the same filtering logic as buildQuery

        // Add conditions for rarity fields
        if (schema.rarityFields && schema.rarityFields.length > 0) {
          schema.rarityFields.forEach(rarityField => {
            if (rarityField === 'is_legendary') {
              let legendaryValue = params.legendary;
              if (tableFilter && tableFilter.legendary !== undefined) {
                legendaryValue = tableFilter.legendary;
              }
              if (legendaryValue !== undefined && legendaryValue !== '') {
                const boolValue = legendaryValue === 'true' || legendaryValue === true;
                tableQuery += ` AND ${rarityField} = ${addParam(isPostgreSQL ? boolValue : (boolValue ? 1 : 0))}`;
              }
            } else if (rarityField === 'is_mythical') {
              let mythicalValue = params.mythical;
              if (tableFilter && tableFilter.mythical !== undefined) {
                mythicalValue = tableFilter.mythical;
              }
              if (mythicalValue !== undefined && mythicalValue !== '') {
                const boolValue = mythicalValue === 'true' || mythicalValue === true;
                tableQuery += ` AND ${rarityField} = ${addParam(isPostgreSQL ? boolValue : (boolValue ? 1 : 0))}`;
              }
            }
          });

          // Handle include ranks - check table-specific filters first
          let includeRanks = params.includeRanks;
          if (tableFilter && tableFilter.includeRanks) {
            includeRanks = tableFilter.includeRanks;
          }
          
          if (includeRanks && includeRanks.length > 0) {
            const rankFields = schema.rarityFields.filter(field => field === 'rank');
            if (rankFields.length > 0) {
              const placeholders = addParams(includeRanks);
              tableQuery += ` AND rank IN (${placeholders})`;
            }
          }

          // Handle exclude ranks - check table-specific filters first
          let excludeRanks = params.excludeRanks;
          if (tableFilter && tableFilter.excludeRanks) {
            excludeRanks = tableFilter.excludeRanks;
          }
          
          if (excludeRanks && excludeRanks.length > 0) {
            const rankFields = schema.rarityFields.filter(field => field === 'rank');
            if (rankFields.length > 0) {
              const placeholders = addParams(excludeRanks);
              tableQuery += ` AND (rank IS NULL OR rank NOT IN (${placeholders}))`;
            }
          }
        }

        // Add conditions for stage - check table-specific filters first
        if (schema.stageField) {
          if (params.stage) {
            tableQuery += ` AND ${schema.stageField} = ${addParam(params.stage)}`;
          } else {
            // Check table-specific stage filters first
            let includeStages = params.includeStages;
            if (tableFilter && tableFilter.includeStages) {
              includeStages = tableFilter.includeStages;
            }
            
            if (includeStages && includeStages.length > 0) {
              const placeholders = addParams(includeStages);
              tableQuery += ` AND ${schema.stageField} IN (${placeholders})`;
            }
          }

          // Handle exclude stages - check table-specific filters first
          let excludeStages = params.excludeStages;
          if (tableFilter && tableFilter.excludeStages) {
            excludeStages = tableFilter.excludeStages;
          }
          
          if (excludeStages && excludeStages.length > 0) {
            const placeholders = addParams(excludeStages);
            tableQuery += ` AND (${schema.stageField} IS NULL OR ${schema.stageField} NOT IN (${placeholders}))`;
          }
        }

        // Add table parameters to global parameters array
        globalParams.push(...queryParams);

        return { query: tableQuery, params: queryParams };
      });

      // Extract queries
      const queries = tableQueries.map(result => result.query);

      // Combine all table queries with UNION
      const query = queries.join(' UNION ');

      const names = await db.asyncAll(query, globalParams);
      return names.map(n => n.name).filter(n => n);
    } catch (error) {
      console.error('Error getting filtered names:', error);
      throw error;
    }
  }

  /**
   * Get all types from enabled tables
   * @returns {Promise<Array>} Array of types
   */
  async getAllTypes() {
    try {
      const typeQueries = [];

      // Build queries for each table based on its schema
      this.enabledTables.forEach(table => {
        const schema = this.tableSchemas[table];

        if (schema.typeFields && schema.typeFields.length > 0) {
          const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
          schema.typeFields.forEach(typeField => {
            typeQueries.push(`SELECT DISTINCT ${typeField} as type FROM ${tableName} WHERE ${typeField} IS NOT NULL`);
          });
        }
      });

      if (typeQueries.length === 0) {
        return [];
      }

      const query = typeQueries.join(' UNION ');
      const types = await db.asyncAll(query);

      return types.map(t => t.type).filter(t => t);
    } catch (error) {
      console.error('Error getting all types:', error);
      throw error;
    }
  }

  /**
   * Get all attributes from enabled tables
   * @returns {Promise<Array>} Array of attributes
   */
  async getAllAttributes() {
    try {
      const attributeQueries = [];

      // Build queries for each table based on its schema
      this.enabledTables.forEach(table => {
        const schema = this.tableSchemas[table];

        if (schema.attributeField) {
          const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
          attributeQueries.push(`SELECT DISTINCT ${schema.attributeField} as attribute FROM ${tableName} WHERE ${schema.attributeField} IS NOT NULL`);
        }
      });

      if (attributeQueries.length === 0) {
        return [];
      }

      const query = attributeQueries.join(' UNION ');
      const attributes = await db.asyncAll(query);

      return attributes.map(a => a.attribute).filter(a => a);
    } catch (error) {
      console.error('Error getting all attributes:', error);
      throw error;
    }
  }

  /**
   * Get all ranks from enabled tables
   * @returns {Promise<Array>} Array of ranks
   */
  async getAllRanks() {
    try {
      const rankQueries = [];

      // Build queries for each table based on its schema
      this.enabledTables.forEach(table => {
        const schema = this.tableSchemas[table];

        if (schema.rarityFields && schema.rarityFields.includes('rank')) {
          const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
          rankQueries.push(`SELECT DISTINCT rank FROM ${tableName} WHERE rank IS NOT NULL`);
        }
      });

      if (rankQueries.length === 0) {
        return [];
      }

      const query = rankQueries.join(' UNION ');
      const ranks = await db.asyncAll(query);

      return ranks.map(r => r.rank).filter(r => r);
    } catch (error) {
      console.error('Error getting all ranks:', error);
      throw error;
    }
  }

  /**
   * Get all stages from enabled tables
   * @returns {Promise<Array>} Array of stages
   */
  async getAllStages() {
    try {
      const stageQueries = [];

      // Build queries for each table based on its schema
      this.enabledTables.forEach(table => {
        const schema = this.tableSchemas[table];

        if (schema.stageField) {
          const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
          stageQueries.push(`SELECT DISTINCT ${schema.stageField} as stage FROM ${tableName} WHERE ${schema.stageField} IS NOT NULL`);
        }
      });

      if (stageQueries.length === 0) {
        return [];
      }

      const query = stageQueries.join(' UNION ');
      const stages = await db.asyncAll(query);

      return stages.map(s => s.stage).filter(s => s);
    } catch (error) {
      console.error('Error getting all stages:', error);
      throw error;
    }
  }

  /**
   * Get all families from Digimon
   * @returns {Promise<Array>} Array of families
   */
  async getAllFamilies() {
    try {
      if (!this.enabledTables.includes('digimon')) {
        return [];
      }

      // This is a bit more complex as families is a TEXT field that can contain multiple values
      const query = `
        SELECT families FROM digimon_monsters
        WHERE families IS NOT NULL AND families != ''
      `;

      const results = await db.asyncAll(query);

      // Extract unique families from the results
      const familiesSet = new Set();

      results.forEach(result => {
        const families = result.families.split(',').map(f => f.trim());
        families.forEach(family => {
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
   * @param {string} name - Monster name
   * @returns {Promise<Object|null>} Monster object or null if not found
   */
  async getMonsterByName(name) {
    try {
      // Check each enabled table for the monster
      for (const table of this.enabledTables) {
        const schema = this.tableSchemas[table];
        let query, params;
        
        const tableName = table === 'fakemon' ? 'fakemon' : `${table}_monsters`;
        if (isPostgreSQL) {
          query = `SELECT * FROM ${tableName} WHERE ${schema.nameField} = $1`;
          params = [name];
        } else {
          query = `SELECT * FROM ${tableName} WHERE ${schema.nameField} = ?`;
          params = [name];
        }
        
        const monster = await db.asyncGet(query, params);

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

  /**
   * Handle onlyLegendary and onlyMythical modes with proper table mapping and fallback
   * @param {Object} rollParams - Roll parameters
   * @returns {Object} Modified roll parameters
   */
  handleOnlyRarityModes(rollParams) {
    const modifiedParams = { ...rollParams };
    
    if (rollParams.onlyLegendary) {
      console.log('OnlyLegendary mode: Filtering to Pokemon and Nexomon legendaries');
      
      // Only Legendary = Pokemon and Nexomon legendaries only
      const legendaryTables = ['pokemon', 'nexomon'];
      const availableLegendaryTables = modifiedParams.tables.filter(table => 
        legendaryTables.includes(table)
      );
      
      if (availableLegendaryTables.length > 0) {
        modifiedParams.tables = availableLegendaryTables;
        modifiedParams.legendary = true; // Force legendary = true
        console.log(`OnlyLegendary: Using tables ${availableLegendaryTables.join(', ')}`);
      } else {
        console.log('OnlyLegendary: No suitable tables available, falling back to default roll');
        // Fallback to default roll - keep original tables but don't force legendary
      }
    }
    
    if (rollParams.onlyMythical) {
      console.log('OnlyMythical mode: Filtering to Pokemon mythicals, Nexomon mythicals, and Yokai S-rank');
      
      // Only Mythical = Pokemon mythicals + Nexomon mythicals + Yokai S-rank
      const mythicalCapableTables = ['pokemon', 'nexomon', 'yokai'];
      const availableMythicalTables = modifiedParams.tables.filter(table => 
        mythicalCapableTables.includes(table)
      );
      
      if (availableMythicalTables.length > 0) {
        modifiedParams.tables = availableMythicalTables;
        
        // Set table-specific filters
        modifiedParams.tableFilters = modifiedParams.tableFilters || {};
        
        if (availableMythicalTables.includes('pokemon')) {
          modifiedParams.tableFilters.pokemon = { mythical: true };
        }
        
        if (availableMythicalTables.includes('nexomon')) {
          modifiedParams.tableFilters.nexomon = { mythical: true };
        }
        
        if (availableMythicalTables.includes('yokai')) {
          // For Yokai, use rank = 'S' instead of mythical
          modifiedParams.tableFilters.yokai = { includeRanks: ['S'] };
        }
        
        console.log(`OnlyMythical: Using tables ${availableMythicalTables.join(', ')} with specific filters`);
      } else {
        console.log('OnlyMythical: No suitable tables available, falling back to default roll');
        // Fallback to default roll - keep original tables but don't force mythical
      }
    }
    
    return modifiedParams;
  }
}

module.exports = MonsterRoller;
