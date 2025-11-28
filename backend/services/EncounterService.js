const MonsterRoller = require('../models/MonsterRoller');
const monsterActivities = require('../config/monsterActivities');
const Item = require('../models/Item');

class EncounterService {
  constructor() {
    this.encounterTypes = ['battle', 'wild', 'item'];
    this.encounterWeights = {
      battle: 30,
      wild: 50,
      item: 20
    };
  }

  /**
   * Generate a random encounter for an adventure
   * @param {Object} adventure - Adventure data
   * @param {Object} location - Location parameters (optional)
   * @returns {Promise<Object>} Generated encounter
   */
  async generateRandomEncounter(adventure, location = null) {
    try {
      // Get area-specific parameters if available
      const areaParams = await this.getAreaParameters(adventure);

      // Provide defaults for custom adventures
      const defaultParams = {
        levelRange: { min: 5, max: 25 },
        agroRange: { min: 10, max: 60 },
        monsterParams: {
          allowLegendary: false,
          allowMythical: false,
          maxSpecies: 3,
          maxTypes: 5
        }
      };

      const effectiveLocation = { ...defaultParams, ...location, ...areaParams };

      // Check for special encounters first
      const specialEncounter = await this.checkSpecialEncounters(adventure, effectiveLocation);
      if (specialEncounter) {
        return specialEncounter;
      }

      // Determine encounter type based on weights
      const encounterType = this.rollEncounterType();

      let encounterData;
      switch (encounterType) {
        case 'battle':
          encounterData = await this.generateBattleEncounter(adventure, effectiveLocation);
          break;
        case 'wild':
          encounterData = await this.generateWildEncounter(adventure, effectiveLocation);
          // Check if wild encounter was converted to auto-battle
          if (encounterData.type === 'auto_battle') {
            return encounterData; // Return the auto-battle directly without wrapping
          }
          break;
        case 'item':
          encounterData = await this.generateItemEncounter(adventure, effectiveLocation);
          break;
        default:
          throw new Error(`Unknown encounter type: ${encounterType}`);
      }

      return {
        type: encounterType,
        data: encounterData
      };

    } catch (error) {
      console.error('Error generating random encounter:', error);
      throw error;
    }
  }

  /**
   * Roll encounter type based on weights
   * @returns {string} Encounter type
   */
  rollEncounterType() {
    const totalWeight = Object.values(this.encounterWeights).reduce((sum, weight) => sum + weight, 0);
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [type, weight] of Object.entries(this.encounterWeights)) {
      currentWeight += weight;
      if (roll <= currentWeight) {
        return type;
      }
    }

    return 'wild'; // Fallback
  }

  /**
   * Generate a battle encounter
   * @param {Object} adventure - Adventure data
   * @param {Object} location - Location parameters
   * @returns {Promise<Object>} Battle encounter data
   */
  async generateBattleEncounter(adventure, location) {
    try {
      const battleData = {
        trainers: [],
        monsters: []
      };

      // Determine if this is a trainer battle or wild monster battle
      const isTrainerBattle = Math.random() < 0.6; // 60% chance for trainer battle

      if (isTrainerBattle) {
        // Generate enemy trainers
        const trainerCount = Math.floor(Math.random() * 2) + 1; // 1-2 trainers
        for (let i = 0; i < trainerCount; i++) {
          const trainer = this.generateEnemyTrainer(location);
          battleData.trainers.push(trainer);
        }
      }

      // Generate enemy monsters (2-4 monsters)
      const monsterCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < monsterCount; i++) {
        const monster = await this.generateEnemyMonster(location);
        battleData.monsters.push(monster);
      }

      return battleData;

    } catch (error) {
      console.error('Error generating battle encounter:', error);
      throw error;
    }
  }

  /**
   * Generate a wild encounter
   * @param {Object} adventure - Adventure data
   * @param {Object} location - Location parameters
   * @returns {Promise<Object>} Wild encounter data
   */
  async generateWildEncounter(adventure, location) {
    try {
      const encounterData = {
        groups: []
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
      const highAgroMonsters = encounterData.groups.filter(group => group.agro >= 75);

      if (highAgroMonsters.length > 0) {
        // Convert to automatic battle encounter
        return {
          type: 'auto_battle',
          data: {
            battleData: {
              trainers: [],
              monsters: highAgroMonsters.map((group, index) => {
                const species = [group.species1, group.species2, group.species3].filter(Boolean).join('/');
                const types = [group.type1, group.type2, group.type3, group.type4, group.type5].filter(Boolean).join(', ');
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
                  health: 100, // Full health initially
                  maxHealth: 100,
                  isWild: true,
                  originalGroup: group,
                  targetIndex: index + 1
                };
              })
            },
            originalGroups: encounterData.groups
          }
        };
      }

      return encounterData;

    } catch (error) {
      console.error('Error generating wild encounter:', error);
      throw error;
    }
  }

  /**
   * Generate an item encounter
   * @param {Object} adventure - Adventure data
   * @param {Object} location - Location parameters
   * @returns {Promise<Object>} Item encounter data
   */
  async generateItemEncounter(adventure, location) {
    try {
      // Roll for a random item
      const items = await Item.getAll();
      const randomItem = items[Math.floor(Math.random() * items.length)];

      return {
        item: randomItem
      };

    } catch (error) {
      console.error('Error generating item encounter:', error);
      throw error;
    }
  }

  /**
   * Generate an enemy trainer
   * @param {Object} location - Location parameters
   * @returns {Object} Enemy trainer data
   */
  generateEnemyTrainer(location) {
    const trainerNames = [
      'Rival Trainer', 'Wild Researcher', 'Rogue Explorer', 'Mysterious Wanderer',
      'Seasoned Adventurer', 'Lost Traveler', 'Treasure Hunter', 'Monster Tamer'
    ];

    const name = trainerNames[Math.floor(Math.random() * trainerNames.length)];
    const level = Math.floor(Math.random() * 20) + 10; // Level 10-30

    return {
      name,
      level,
      type: 'enemy'
    };
  }

  /**
   * Get area-specific parameters for an adventure
   * @param {Object} adventure - Adventure data
   * @returns {Promise<Object>} Area parameters
   */
  async getAreaParameters(adventure) {
    try {
      if (!adventure.area_config) {
        return {};
      }

      let areaConfig = adventure.area_config;
      if (typeof areaConfig === 'string') {
        areaConfig = JSON.parse(areaConfig);
      }

      return {
        monsterParams: this.convertAreaConfigToMonsterParams(areaConfig.monsterRollerParameters),
        levelRange: areaConfig.levelRange,
        agroRange: areaConfig.agroRange,
        battleParameters: areaConfig.battleParameters,
        specialEncounters: areaConfig.specialEncounters || []
      };

    } catch (error) {
      console.error('Error getting area parameters:', error);
      return {};
    }
  }

  /**
   * Convert area configuration to monster roller parameters
   * @param {Object} areaParams - Area monster roller parameters
   * @returns {Object} Monster roller parameters
   */
  convertAreaConfigToMonsterParams(areaParams) {
    if (!areaParams) return {};

    const params = {};

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
      params.minSpecies = areaParams.species_min;
    }
    if (areaParams.species_max !== undefined) {
      params.maxSpecies = areaParams.species_max;
    }

    // Handle type limits
    if (areaParams.types_min !== undefined) {
      params.minTypes = areaParams.types_min;
    }
    if (areaParams.types_max !== undefined) {
      params.maxTypes = areaParams.types_max;
    }

    // Handle legendary/mythical settings
    if (areaParams.enableLegendaries !== undefined) {
      params.allowLegendary = areaParams.enableLegendaries;
    }
    if (areaParams.enableMythicals !== undefined) {
      params.allowMythical = areaParams.enableMythicals;
    }

    return params;
  }

  /**
   * Check for special encounters based on area configuration
   * @param {Object} adventure - Adventure data
   * @param {Object} location - Location parameters
   * @returns {Promise<Object|null>} Special encounter or null
   */
  async checkSpecialEncounters(adventure, location) {
    try {
      const specialEncounters = location.specialEncounters || [];

      for (const encounter of specialEncounters) {
        if (Math.random() < encounter.chance) {
          return {
            type: 'special',
            data: {
              encounterType: encounter.type,
              description: encounter.description,
              ...encounter
            }
          };
        }
      }

      return null;

    } catch (error) {
      console.error('Error checking special encounters:', error);
      return null;
    }
  }

  /**
   * Generate an enemy monster
   * @param {Object} location - Location parameters
   * @returns {Promise<Object>} Enemy monster data
   */
  async generateEnemyMonster(location) {
    try {
      const monsterRoller = new MonsterRoller();

      // Set up roll parameters based on location
      const rollParams = {
        count: 1,
        allowLegendary: false,
        allowMythical: false,
        maxSpecies: 2,
        maxTypes: 3,
        ...location?.monsterParams
      };

      const monsters = await monsterRoller.rollMany(rollParams);
      const monster = monsters[0];

      // Set level based on location or random
      monster.level = location?.levelRange ?
        Math.floor(Math.random() * (location.levelRange.max - location.levelRange.min + 1)) + location.levelRange.min :
        Math.floor(Math.random() * 20) + 10; // Default level 10-30

      // Add a name for battle targeting
      const species = [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/');
      monster.name = `Enemy ${species}`;

      return monster;

    } catch (error) {
      console.error('Error generating enemy monster:', error);
      throw error;
    }
  }

  /**
   * Generate a group of wild monsters
   * @param {Object} location - Location parameters
   * @returns {Promise<Object>} Wild monster group data
   */
  async generateWildMonsterGroup(location) {
    try {
      const monsterRoller = new MonsterRoller();

      // Set up roll parameters with area-specific restrictions
      const rollParams = {
        count: 1,
        allowLegendary: location?.monsterParams?.allowLegendary || false,
        allowMythical: location?.monsterParams?.allowMythical || false,
        maxSpecies: location?.monsterParams?.maxSpecies || 3,
        maxTypes: location?.monsterParams?.maxTypes || 5,
        ...location?.monsterParams
      };

      console.log('Rolling monsters with params:', rollParams);
      const monsters = await monsterRoller.rollMany(rollParams);

      if (!monsters || monsters.length === 0) {
        console.error('No monsters returned from roller');
        throw new Error('Failed to generate monsters');
      }

      const monster = monsters[0];
      console.log('Generated monster:', monster);

      // Determine group size (1-5 monsters, influenced by area)
      let groupSize = Math.floor(Math.random() * 5) + 1;

      // Adjust group size based on area difficulty or special parameters
      if (location?.monsterParams?.groupSizeModifier) {
        groupSize = Math.max(1, Math.min(10, groupSize + location.monsterParams.groupSizeModifier));
      }

      // Generate agro level based on area parameters
      const agro = location?.agroRange ?
        Math.floor(Math.random() * (location.agroRange.max - location.agroRange.min + 1)) + location.agroRange.min :
        Math.floor(Math.random() * 50) + 10; // Default agro 10-60

      // Get activity based on agro level
      const activity = this.getMonsterActivityByAgro(agro);

      // Generate level
      const level = location?.levelRange ?
        Math.floor(Math.random() * (location.levelRange.max - location.levelRange.min + 1)) + location.levelRange.min :
        Math.floor(Math.random() * 20) + 5; // Default level 5-25 for wild monsters

      return {
        count: groupSize,
        species1: monster.species1,
        species2: monster.species2,
        species3: monster.species3,
        type1: monster.type1,
        type2: monster.type2,
        type3: monster.type3,
        type4: monster.type4,
        type5: monster.type5,
        attribute: monster.attribute,
        activity: activity,
        agro: agro,
        level: level,
        available: groupSize, // Track how many are still available for capture
        captured: [] // Track which users captured which monsters
      };

    } catch (error) {
      console.error('Error generating wild monster group:', error);
      throw error;
    }
  }

  /**
   * Generate a fallback monster group with basic parameters
   * @returns {Promise<Object>} Fallback monster group
   */
  async generateFallbackMonsterGroup() {
    try {
      const monsterRoller = new MonsterRoller();

      // Use very basic parameters that should always work
      const rollParams = {
        count: 1,
        allowLegendary: false,
        includeStages: ['Base Stage', "Doesn't Evolve"], // Only basic stages
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
        allowMythical: false,
        maxSpecies: 1,
        maxTypes: 2
      };

      console.log('Generating fallback monster with basic params:', rollParams);
      const monsters = await monsterRoller.rollMany(rollParams);

      if (!monsters || monsters.length === 0) {
        // If even the basic roll fails, create a hardcoded fallback
        console.warn('Monster roller failed completely, using hardcoded fallback');
        return {
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
          captured: []
        };
      }

      const monster = monsters[0];

      return {
        count: 1,
        species1: monster.species1,
        species2: monster.species2,
        species3: monster.species3,
        type1: monster.type1,
        type2: monster.type2,
        type3: monster.type3,
        type4: monster.type4,
        type5: monster.type5,
        attribute: monster.attribute,
        level: 10, // Safe default level
        agro: 25, // Safe default agro
        activity: 'is exploring the area',
        available: 1,
        captured: []
      };

    } catch (error) {
      console.error('Error generating fallback monster group:', error);
      // Return absolute fallback
      return {
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
        captured: []
      };
    }
  }

  /**
   * Get monster activity based on agro level
   * @param {number} agro - Monster agro level
   * @returns {string} Activity description
   */
  getMonsterActivityByAgro(agro) {
    let activityList;

    if (agro >= 75) {
      // High agro - attack activities
      activityList = monsterActivities.attack;
    } else if (agro >= 50) {
      // Medium agro - semi-aggressive activities
      activityList = monsterActivities.semiAggressive;
    } else {
      // Low agro - peaceful activities
      activityList = monsterActivities.peaceful;
    }

    return activityList[Math.floor(Math.random() * activityList.length)];
  }

  /**
   * Get activity text for a monster based on its species/types
   * @param {Object} monster - Monster data
   * @returns {Promise<string>} Activity text
   */
  async getMonsterActivity(monster) {
    try {
      // Default activities based on types or general behaviors
    const activities = [
        'lazing about in the sun',
        'playing together peacefully',
        'foraging for food',
        'resting in the shade',
        'exploring the area curiously',
        'seems ready to fight',
        'appears aggressive and territorial',
        'looks friendly and approachable',
        'is hiding behind rocks',
        'is splashing in nearby water',
        'is flying overhead in circles',
        'is digging in the ground',
        'seems lost and confused',
        'is grooming itself carefully',
        'appears to be sleeping',
        'is munching contentedly on a berry',
        'is stretching with a big yawn',
        'is swinging on a vine',
        'is scrawling pictures in the dirt',
        'is gnawing on a rock',
        'is staring into the abyss with haunted eyes',
        'is pawing at a flower',
        'is dancing to unheard music',
        'is warbling an off-tune song',
        'is struggling to weave a flower crown',
        'is trying to scratch a particularly aggravating itch',
        'is stomping around huffily',
        'is arguing with a nearby monster at top volume',
        'is chasing its tail (or whatever it thinks is its tail)',
        'is trying to knock a nest out of a nearby tree',
        'is gearing up to fistfight the next thing it sees',
        'is drinking from a nearby stream',
        'is cradling a broken pokeball',
        'is trying to swim - and failing',
        'is hissing at a piece of litter',
        'is clinging to another monster\'s back and chittering',
        'is poking a book like it\'s a grenade',
        'is starting a cult'
      ];
      // You could implement more sophisticated activity selection based on species/types here
      // For now, just return a random activity
      return activities[Math.floor(Math.random() * activities.length)];

    } catch (error) {
      console.error('Error getting monster activity:', error);
      return 'wandering around';
    }
  }

  /**
   * Calculate battle rewards
   * @param {Object} battleData - Battle encounter data
   * @param {string} outcome - Battle outcome ('victory', 'retreat', 'draw')
   * @returns {Object} Reward data
   */
  calculateBattleRewards(battleData, outcome) {
    const baseRewards = {
      coins: 0,
      items: []
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
      // For now, just add a placeholder item - this would be replaced with actual item rolling
      baseRewards.items.push({
        name: 'Battle Trophy',
        description: 'A memento from a hard-fought battle'
      });
    }

    return baseRewards;
  }
}

module.exports = new EncounterService();
