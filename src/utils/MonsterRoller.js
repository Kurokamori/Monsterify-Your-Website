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
      } else if (this.options.overrideParams.guaranteedSpecies) {
        // Handle guaranteed species at a specific position
        const guaranteedSpecies = this.options.overrideParams.guaranteedSpecies;
        const position = this.options.overrideParams.guaranteedSpeciesPosition || 0;

        // Generate random species for the other positions
        const speciesPool = [];
        for (let i = 0; i < speciesCount; i++) {
          speciesPool.push(...eligibleSpecies);
        }

        // Shuffle the pool and select the required number of species
        const shuffledPool = [...speciesPool].sort(() => 0.5 - Math.random());
        selectedSpecies = shuffledPool.slice(0, speciesCount);

        // Insert the guaranteed species at the specified position
        if (position < selectedSpecies.length) {
          selectedSpecies[position] = guaranteedSpecies;
          console.log(`Using guaranteed species ${guaranteedSpecies} at position ${position}`);
        }
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

        // Get monster data based on species
        try {
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
              // For custom species inputs, just use the species name
              monsterData = [{ name: species }];
          }
        } catch (error) {
          console.error(`Error getting data for species ${species}:`, error);
          // Fallback to using the species name directly
          monsterData = [{ name: species }];
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

      // Use override types if provided (ice cream items)
      if (this.options.overrideParams.types) {
        console.log('Using override types:', this.options.overrideParams.types);
        const overrideTypes = Array.isArray(this.options.overrideParams.types)
          ? this.options.overrideParams.types
          : [this.options.overrideParams.types];

        // Initialize types array with the correct length
        types = new Array(typeCount).fill(null);

        // Apply override types to their specific positions
        overrideTypes.forEach((type, index) => {
          if (type && index < typeCount) {
            types[index] = type;
            console.log(`Setting type ${index + 1} to ${type}`);
          }
        });

        // Fill in any remaining null types with random ones
        for (let i = 0; i < types.length; i++) {
          if (!types[i]) {
            // Get a random type that's not already in the list
            const usedTypes = types.filter(Boolean);

            // Get all available types
            const pokemonTypes = [
              'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
              'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
              'Steel', 'Fairy'
            ];

            // Filter out types that are already used
            const availableTypes = pokemonTypes.filter(type => !usedTypes.includes(type));

            // Pick a random type from the available ones
            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

            types[i] = randomType;
            console.log(`Setting random type ${i + 1} to ${randomType}`);
          }
        }
      } else {
        // Get completely random types
        types = this.getRandomUniqueTypes(typeCount);
      }

      // Apply guaranteed types from nurture kits if specified
      if (this.options.overrideParams.guaranteedTypes && this.options.overrideParams.guaranteedTypes.length > 0) {
        const guaranteedTypes = this.options.overrideParams.guaranteedTypes;

        // Check if we can apply the guaranteed types
        // If all types are already set by ice creams, we can't apply nurture kits
        const iceCreamTypes = this.options.overrideParams.types || [];
        const nonIceCreamTypeIndices = [];

        for (let i = 0; i < types.length; i++) {
          // If this type wasn't set by an ice cream, we can replace it
          if (!iceCreamTypes[i]) {
            nonIceCreamTypeIndices.push(i);
          }
        }

        // If we have non-ice cream types, ensure at least one guaranteed type is included
        if (nonIceCreamTypeIndices.length > 0) {
          // Pick a random guaranteed type
          const randomGuaranteedType = guaranteedTypes[Math.floor(Math.random() * guaranteedTypes.length)];

          // Pick a random non-ice cream type index to replace
          const randomIndex = nonIceCreamTypeIndices[Math.floor(Math.random() * nonIceCreamTypeIndices.length)];

          // Replace the type
          types[randomIndex] = randomGuaranteedType;
        }
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
        // Use the actual species name instead of the origin
        species1: this.getSpeciesName(speciesData[0]),
        species2: speciesData.length > 1 ? this.getSpeciesName(speciesData[1]) : null,
        species3: speciesData.length > 2 ? this.getSpeciesName(speciesData[2]) : null,
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

      // Check if we need to apply post-processing filters
      const needsPostProcessing = this.options.postProcessFilters &&
                                 (this.options.postProcessFilters.pokemonTypes ||
                                  Object.keys(this.options.postProcessFilters).length > 0);

      // If we need post-processing, we might need to roll more monsters than requested
      // to ensure we have enough that pass the filters
      const maxAttempts = needsPostProcessing ? count * 3 : count;

      let attempts = 0;
      while (monsters.length < count && attempts < maxAttempts) {
        const monster = await this.rollMonster();

        // Apply post-processing filters if needed
        if (needsPostProcessing) {
          // Check Pokemon type filters
          if (this.options.postProcessFilters.pokemonTypes && monster.species1) {
            // Only apply Pokemon type filters to Pokemon
            const isPokemon = monster.speciesData &&
                            monster.speciesData[0] &&
                            monster.speciesData[0].SpeciesName === 'Pokemon';

            if (isPokemon) {
              const requiredTypes = this.options.postProcessFilters.pokemonTypes;
              const monsterTypes = [];

              // Get the monster's types
              if (monster.type1) monsterTypes.push(monster.type1);
              if (monster.type2) monsterTypes.push(monster.type2);
              if (monster.type3) monsterTypes.push(monster.type3);
              if (monster.type4) monsterTypes.push(monster.type4);
              if (monster.type5) monsterTypes.push(monster.type5);

              // Check if the monster has at least one of the required types
              const hasRequiredType = requiredTypes.some(type =>
                monsterTypes.includes(type)
              );

              if (!hasRequiredType) {
                // Skip this monster if it doesn't have any of the required types
                console.log(`Skipping Pokemon ${monster.species1} because it doesn't have any of the required types: ${requiredTypes.join(', ')}`);
                attempts++;
                continue;
              }
            }
          }
        }

        // If we get here, the monster passed all filters
        monsters.push(monster);
        attempts++;
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

  /**
   * Helper method to get the actual species name from species data
   * @param {Object} speciesData - Species data object
   * @returns {string} - Actual species name
   */
  getSpeciesName(speciesData) {
    if (!speciesData) return null;

    const { species, data } = speciesData;

    switch (species) {
      case 'Pokemon':
        return data.SpeciesName || species;
      case 'Digimon':
        return data.name || species;
      case 'Yokai':
        return data.Name || species;
      default:
        return species;
    }
  }
}

module.exports = MonsterRoller;
