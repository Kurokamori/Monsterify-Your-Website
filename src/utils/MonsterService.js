const MonsterRoller = require('./MonsterRoller');
const Monster = require('../models/Monster');

class MonsterService {
  static DEFAULT_OPTIONS = {
    overrideParams: {
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

  /**
   * Roll a single monster with optional overrides
   * @param {Object} options - Override options
   * @returns {Promise<Object>} Monster data
   */
  static async rollOne(options = {}) {
    const mergedOptions = this.mergeOptions(options);
    const roller = new MonsterRoller(mergedOptions);
    return roller.rollMonster();
  }

  /**
   * Roll multiple monsters with optional overrides
   * @param {number} count - Number of monsters to roll
   * @param {Object} options - Override options
   * @returns {Promise<Array>} Array of monster data
   */
  static async rollMultiple(count, options = {}) {
    const mergedOptions = this.mergeOptions(options);
    const roller = new MonsterRoller(mergedOptions);
    return roller.rollMultiple(count);
  }

  /**
   * Create a monster for a trainer from monster data
   * @param {Object} monsterData - Monster data
   * @param {number} trainerId - Trainer ID
   * @param {string} monsterName - Monster name
   * @returns {Promise<Object>} Created monster
   */
  static async claimMonster(monsterData, trainerId, monsterName) {
    const monster = await Monster.create({
      trainer_id: trainerId,
      name: monsterName,
      level: 1,
      species1: monsterData.species1,
      species2: monsterData.species2 || null,
      species3: monsterData.species3 || null,
      type1: monsterData.type1,
      type2: monsterData.type2 || null,
      type3: monsterData.type3 || null,
      type4: monsterData.type4 || null,
      type5: monsterData.type5 || null,
      attribute: monsterData.attribute,
      box_number: 1
    });

    return monster;
  }

  /**
   * Get display data for a rolled monster
   * @param {Object} monster - Monster data
   * @returns {Object} Formatted display data
   */
  static getDisplayData(monster) {
    const speciesNames = monster.speciesData.map(s => {
      if (s.species === 'Pokemon') return s.data.SpeciesName;
      if (s.species === 'Digimon') return s.data.name;
      if (s.species === 'Yokai') return s.data.Name;
      return s.species;
    }).filter(Boolean);

    return {
      title: speciesNames.join(' / '),
      species: speciesNames,
      types: [
        monster.type1,
        monster.type2,
        monster.type3,
        monster.type4,
        monster.type5
      ].filter(Boolean),
      attribute: monster.attribute,
      rawData: monster
    };
  }

  /**
   * Merge provided options with defaults
   * @private
   */
  static mergeOptions(options) {
    const mergedOptions = {
      overrideParams: { ...this.DEFAULT_OPTIONS.overrideParams },
      filters: { ...this.DEFAULT_OPTIONS.filters }
    };

    if (options.overrideParams) {
      mergedOptions.overrideParams = {
        ...mergedOptions.overrideParams,
        ...options.overrideParams
      };
    }

    if (options.filters) {
      // Merge species-specific filters
      ['pokemon', 'digimon', 'yokai'].forEach(species => {
        if (options.filters[species]) {
          mergedOptions.filters[species] = {
            ...mergedOptions.filters[species],
            ...options.filters[species]
          };
        }
      });

      // Merge include/exclude species
      if (options.filters.includeSpecies) {
        mergedOptions.filters.includeSpecies = options.filters.includeSpecies;
      }
      if (options.filters.excludeSpecies) {
        mergedOptions.filters.excludeSpecies = options.filters.excludeSpecies;
      }
    }

    return mergedOptions;
  }
}

module.exports = MonsterService;