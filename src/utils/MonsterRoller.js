const Pokemon = require('../models/Pokemon');
const Digimon = require('../models/Digimon');
const Yokai = require('../models/Yokai');

class MonsterRoller {
  /**
   * Constructor for MonsterRoller
   * @param {Object} options - Configuration options
   * @param {Object} options.overrideParams - Parameters to override default behavior
   * @param {Array|string} [options.overrideParams.species] - Specific species to include
   * @param {Array|string} [options.overrideParams.types] - Specific types to include
   * @param {Array|string} [options.overrideParams.attributes] - Specific attributes to include
   * @param {boolean} [options.overrideParams.forceFusion=false] - Force fusion of multiple species
   * @param {boolean} [options.overrideParams.forceNoFusion=false] - Force no fusion
   * @param {number} [options.overrideParams.minSpecies=1] - Minimum number of species
   * @param {number} [options.overrideParams.maxSpecies=3] - Maximum number of species
   * @param {number} [options.overrideParams.minType=1] - Minimum number of types
   * @param {number} [options.overrideParams.maxType=5] - Maximum number of types
   * @param {Object} options.filters - Filters for database queries
   * @param {Object} [options.filters.pokemon] - Pokemon-specific filters
   * @param {Object} [options.filters.digimon] - Digimon-specific filters
   * @param {Object} [options.filters.yokai] - Yokai-specific filters
   * @param {Array|string} [options.filters.includeSpecies] - Species to include
   * @param {Array|string} [options.filters.excludeSpecies] - Species to exclude
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      overrideParams: {
        species: null,
        types: null,
        attributes: null,
        forceFusion: false,
        forceNoFusion: false,
        minSpecies: 1,
        maxSpecies: 3,
        minType: 1,
        maxType: 5
      },
      filters: {
        pokemon: {
          rarity: 'Common',
          stage: ['Base Stage', 'Doesn\'t Evolve']
        },
        digimon: {
          stage: ['Training 1', 'Training 2', 'Rookie']
        },
        yokai: {
          rank: ['E', 'D', 'C', 'B']
        },
        includeSpecies: ['Pokemon', 'Digimon', 'Yokai'],
        excludeSpecies: []
      }
    };

    // Merge provided options with defaults
    if (options.overrideParams) {
      this.options.overrideParams = { ...this.options.overrideParams, ...options.overrideParams };
    }

    if (options.filters) {
      // Merge top-level filters
      if (options.filters.includeSpecies) {
        this.options.filters.includeSpecies = options.filters.includeSpecies;
      }
      if (options.filters.excludeSpecies) {
        this.options.filters.excludeSpecies = options.filters.excludeSpecies;
      }

      // Merge species-specific filters
      if (options.filters.pokemon) {
        this.options.filters.pokemon = { ...this.options.filters.pokemon, ...options.filters.pokemon };
      }
      if (options.filters.digimon) {
        this.options.filters.digimon = { ...this.options.filters.digimon, ...options.filters.digimon };
      }
      if (options.filters.yokai) {
        this.options.filters.yokai = { ...this.options.filters.yokai, ...options.filters.yokai };
      }
    }
  }

  /**
   * Get a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Random integer
   */
  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get a random attribute for the monster
   * @returns {string} - Random attribute (Vaccine, Variable, Virus, Data, Free)
   */
  static getRandomAttribute() {
    const attributes = ['Vaccine', 'Variable', 'Virus', 'Data', 'Free'];
    return attributes[Math.floor(Math.random() * attributes.length)];
  }

  /**
   * Determine the number of species to include
   * @returns {number} - Number of species
   */
  determineSpeciesCount() {
    const { minSpecies, maxSpecies, forceFusion, forceNoFusion } = this.options.overrideParams;

    if (forceNoFusion) {
      return 1;
    }

    if (forceFusion) {
      return MonsterRoller.getRandomInt(Math.max(2, minSpecies), maxSpecies);
    }

    return MonsterRoller.getRandomInt(minSpecies, maxSpecies);
  }

  /**
   * Determine the number of types to include
   * @returns {number} - Number of types
   */
  determineTypeCount() {
    const { minType, maxType } = this.options.overrideParams;
    return MonsterRoller.getRandomInt(minType, maxType);
  }

  /**
   * Get eligible species based on filters
   * @returns {Array} - Array of eligible species names
   */
  getEligibleSpecies() {
    const { includeSpecies, excludeSpecies } = this.options.filters;
    const allSpecies = ['Pokemon', 'Digimon', 'Yokai'];

    let eligible = allSpecies;

    // Apply include filter
    if (includeSpecies && includeSpecies.length > 0) {
      eligible = Array.isArray(includeSpecies) ? includeSpecies : [includeSpecies];
    }

    // Apply exclude filter
    if (excludeSpecies && excludeSpecies.length > 0) {
      const excludeList = Array.isArray(excludeSpecies) ? excludeSpecies : [excludeSpecies];
      eligible = eligible.filter(species => !excludeList.includes(species));
    }

    return eligible;
  }

  /**
   * Get random unique types
   * @param {number} count - Number of types to get
   * @returns {Array} - Array of unique types
   */
  getRandomUniqueTypes(count) {
    const pokemonTypes = [
      'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
      'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
      'Steel', 'Fairy'
    ];

    // Shuffle the types
    const shuffledTypes = [...pokemonTypes].sort(() => 0.5 - Math.random());

    // Take the requested number of types
    return shuffledTypes.slice(0, Math.min(count, pokemonTypes.length));
  }

  /**
   * Roll a random monster
   * @returns {Promise<Object>} - Rolled monster data
   */
  async rollMonster() {
    try {
      // Determine species count and type count
      const speciesCount = this.determineSpeciesCount();
      const typeCount = this.determineTypeCount();

      // Get eligible species
      const eligibleSpecies = this.getEligibleSpecies();
      if (eligibleSpecies.length === 0) {
        throw new Error('No eligible species after applying filters');
      }

      // Determine which species to include
      let selectedSpecies = [];
      if (this.options.overrideParams.species) {
        // Use override species if provided
        const overrideSpecies = Array.isArray(this.options.overrideParams.species)
          ? this.options.overrideParams.species
          : [this.options.overrideParams.species];

        // Take up to speciesCount species from the override list
        selectedSpecies = overrideSpecies.slice(0, speciesCount);
      } else {
        // For random selection, we need to allow duplicates of the same species type
        // (e.g., multiple Pokemon, multiple Digimon, etc.)
        const speciesPool = [];

        // Add each eligible species to the pool multiple times to allow for duplicates
        for (let i = 0; i < speciesCount; i++) {
          speciesPool.push(...eligibleSpecies);
        }

        // Shuffle the pool and select the required number of species
        const shuffledPool = [...speciesPool].sort(() => 0.5 - Math.random());
        selectedSpecies = shuffledPool.slice(0, speciesCount);
      }

      // Fetch random monsters for each selected species
      const speciesData = [];
      for (const species of selectedSpecies) {
        let monsterData;

        switch (species) {
          case 'Pokemon':
            monsterData = await Pokemon.getRandom(this.options.filters.pokemon, 1);
            break;
          case 'Digimon':
            monsterData = await Digimon.getRandom(this.options.filters.digimon, 1);
            break;
          case 'Yokai':
            monsterData = await Yokai.getRandom(this.options.filters.yokai, 1);
            break;
          default:
            throw new Error(`Unknown species: ${species}`);
        }

        if (monsterData && monsterData.length > 0) {
          speciesData.push({
            species,
            data: monsterData[0]
          });
        }
      }

      if (speciesData.length === 0) {
        throw new Error('No monsters found matching the criteria');
      }

      // Determine types - completely separate from the monster species
      let types = [];

      // Use override types if provided
      if (this.options.overrideParams.types) {
        const overrideTypes = Array.isArray(this.options.overrideParams.types)
          ? this.options.overrideParams.types
          : [this.options.overrideParams.types];

        // Take up to typeCount types from the override list, ensuring no duplicates
        const uniqueOverrideTypes = [...new Set(overrideTypes)];
        types = uniqueOverrideTypes.slice(0, typeCount);

        // If we need more types (because of duplicates being removed), add random ones
        if (types.length < typeCount) {
          const additionalTypes = this.getRandomUniqueTypes(typeCount - types.length);
          // Filter out any types that are already in our list
          const filteredAdditionalTypes = additionalTypes.filter(type => !types.includes(type));
          types.push(...filteredAdditionalTypes);
        }
      } else {
        // Get completely random types
        types = this.getRandomUniqueTypes(typeCount);
      }

      // Determine attribute
      let attribute;
      if (this.options.overrideParams.attributes) {
        const overrideAttributes = Array.isArray(this.options.overrideParams.attributes)
          ? this.options.overrideParams.attributes
          : [this.options.overrideParams.attributes];

        // Take the first attribute from the override list
        attribute = overrideAttributes[0];
      } else {
        attribute = MonsterRoller.getRandomAttribute();
      }

      // Construct the monster data
      const monsterData = {
        species1: speciesData[0]?.species,
        species2: speciesData[1]?.species || null,
        species3: speciesData[2]?.species || null,
        type1: types[0] || null,
        type2: types[1] || null,
        type3: types[2] || null,
        type4: types[3] || null,
        type5: types[4] || null,
        attribute,
        speciesData
      };

      return monsterData;
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  }

  /**
   * Roll multiple monsters
   * @param {number} count - Number of monsters to roll
   * @returns {Promise<Array>} - Array of rolled monster data
   */
  async rollMultiple(count) {
    try {
      const monsters = [];

      for (let i = 0; i < count; i++) {
        const monster = await this.rollMonster();
        monsters.push(monster);
      }

      return monsters;
    } catch (error) {
      console.error('Error rolling multiple monsters:', error);
      throw error;
    }
  }

  /**
   * Factory method to roll a single monster
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Rolled monster data
   */
  static async rollOne(options = {}) {
    const roller = new MonsterRoller(options);
    return roller.rollMonster();
  }

  /**
   * Factory method to roll multiple monsters
   * @param {number} count - Number of monsters to roll
   * @param {Object} options - Configuration options
   * @returns {Promise<Array>} - Array of rolled monster data
   */
  static async rollTen(options = {}) {
    const roller = new MonsterRoller(options);
    return roller.rollMultiple(10);
  }
}

module.exports = MonsterRoller;
