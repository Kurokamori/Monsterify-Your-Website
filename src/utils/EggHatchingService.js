const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const MonsterRoller = require('./MonsterRoller');
const { v4: uuidv4 } = require('uuid');

/**
 * Service for handling egg hatching functionality
 */
class EggHatchingService {
  /**
   * Process egg hatching
   * @param {Object} options - Egg hatching options
   * @param {number} options.trainerId - Trainer ID
   * @param {boolean} options.useIncubator - Whether to use an incubator
   * @param {string} options.submissionUrl - URL to creative submission
   * @param {Array} options.eggs - Array of eggs to hatch with their settings
   * @returns {Promise<Object>} - Result of egg hatching
   */
  static async processEggHatching(options) {
    try {
      const {
        trainerId,
        useIncubator,
        submissionUrl,
        eggs
      } = options;

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return { success: false, message: 'Trainer not found' };
      }

      // Check if trainer has eggs
      const inventory = await Trainer.getInventory(trainerId);
      const availableEggCount = inventory && inventory.inv_eggs && inventory.inv_eggs['Standard Egg']
        ? parseInt(inventory.inv_eggs['Standard Egg'])
        : 0;

      // Validate egg count
      const requestedEggCount = eggs ? eggs.length : 1;
      if (availableEggCount < requestedEggCount) {
        return {
          success: false,
          message: `Not enough eggs. You have ${availableEggCount} but requested ${requestedEggCount}`
        };
      }

      // Check if trainer has incubator if using one
      if (useIncubator) {
        const incubatorCount = inventory && inventory.inv_items && inventory.inv_items['Incubator']
          ? parseInt(inventory.inv_items['Incubator'])
          : 0;

        if (incubatorCount < requestedEggCount) {
          return {
            success: false,
            message: `Not enough incubators. You have ${incubatorCount} but need ${requestedEggCount}`
          };
        }
      }

      // Process each egg and roll monsters
      const allMonsters = [];
      let totalDnaSplicers = 0;

      for (const egg of eggs) {
        const { hatchType, items = [], dnaSplicerAmount = 0 } = egg;

        // Check if trainer has DNA Splicers if using them
        if (dnaSplicerAmount > 0) {
          const dnaSplicerCount = inventory && inventory.inv_items && inventory.inv_items['DNA Splicer']
            ? parseInt(inventory.inv_items['DNA Splicer'])
            : 0;

          if (dnaSplicerCount < dnaSplicerAmount) {
            return {
              success: false,
              message: `Not enough DNA Splicers. You have ${dnaSplicerCount} but requested ${dnaSplicerAmount}`
            };
          }

          totalDnaSplicers += dnaSplicerAmount;
        }

        // Validate and process items for complex hatching
        let rollerOptions = { overrideParams: {}, filters: {} };

        if (hatchType === 'complex' && items && items.length > 0) {
          rollerOptions = this.processItemEffects(items, rollerOptions);
        }

        // Roll monsters for this egg
        const monsters = await this.rollEggMonsters(rollerOptions);
        allMonsters.push({
          eggId: egg.id || `egg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          monsters: monsters
        });
      }

      // Use up eggs
      await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Standard Egg', -requestedEggCount);

      // Use up incubators if applicable
      if (useIncubator) {
        await Trainer.updateInventoryItem(trainerId, 'inv_items', 'Incubator', -requestedEggCount);
      }

      // Calculate max claims based on DNA Splicers
      const maxClaims = requestedEggCount + totalDnaSplicers;

      // Use up DNA Splicers if applicable
      if (totalDnaSplicers > 0) {
        await Trainer.updateInventoryItem(trainerId, 'inv_items', 'DNA Splicer', -totalDnaSplicers);
      }

      // Return success with monsters
      return {
        success: true,
        message: `${requestedEggCount} egg(s) hatched successfully`,
        eggResults: allMonsters,
        maxClaims,
        submissionUrl: submissionUrl || null
      };
    } catch (error) {
      console.error('Error processing egg hatching:', error);
      return { success: false, message: 'Error processing egg hatching' };
    }
  }

  /**
   * Process item effects for monster rolling
   * @param {Object} items - Items to use
   * @param {Object} rollerOptions - Initial roller options
   * @returns {Object} - Updated roller options
   */
  static processItemEffects(items, rollerOptions) {
    const options = { ...rollerOptions };

    // Initialize default filters if not present
    if (!options.filters) options.filters = {};
    if (!options.filters.pokemon) options.filters.pokemon = {};
    if (!options.filters.digimon) options.filters.digimon = {};
    if (!options.filters.yokai) options.filters.yokai = {};
    if (!options.filters.excludeSpecies) options.filters.excludeSpecies = [];
    if (!options.overrideParams) options.overrideParams = {};

    // Set default species filters
    options.filters.pokemon.stage = ['Base Stage', 'Doesn\'t Evolve'];
    options.filters.digimon.stage = ['Training 1', 'Training 2'];
    options.filters.yokai.rank = ['E', 'D', 'C', 'B'];

    // Type Nurture Kit - Sets Primary Type Guarantee
    if (items.includes('[type] Nurture Kit')) {
      const typeMatch = items.find(item => item.includes('Nurture Kit'));
      if (typeMatch) {
        const type = typeMatch.replace(' Nurture Kit', '');
        if (!options.overrideParams.types) options.overrideParams.types = [];
        options.overrideParams.types.push(type);
      }
    }

    // Attribute Codes
    if (items.includes('Corruption Code')) {
      options.overrideParams.attributes = ['Virus'];
    } else if (items.includes('Repair Code')) {
      options.overrideParams.attributes = ['Vaccine'];
    } else if (items.includes('Shiny New Code')) {
      options.overrideParams.attributes = ['Data'];
    }

    // Yokai Rank Incense
    const rankIncense = items.find(item => item.includes('Rank Incense'));
    if (rankIncense) {
      const rank = rankIncense.charAt(0); // Get first character (S, A, B, C, D, E)
      options.filters.yokai.rank = [rank];
    }

    // Yokai Color/Attribute Incense
    const colorIncense = items.find(item => item.includes('Color Incense'));
    if (colorIncense) {
      const attribute = colorIncense.replace(' Color Incense', '');
      options.filters.yokai.attribute = attribute;
    }

    // Species Exclusion/Inclusion
    if (items.includes('Spell Tag')) {
      options.filters.excludeSpecies.push('Yokai');
    }

    if (items.includes('DigiMeat')) {
      if (!options.filters.digimon.stage.includes('Rookie')) {
        options.filters.digimon.stage.push('Rookie');
      }
    }

    if (items.includes('DigiTofu')) {
      options.filters.excludeSpecies.push('Digimon');
    }

    if (items.includes('Broken Bell')) {
      options.filters.excludeSpecies.push('Pokemon');
    }

    // Pokemon Type Poffin
    const poffin = items.find(item => item.includes('Poffin'));
    if (poffin) {
      const type = poffin.replace(' Poffin', '');
      options.filters.pokemon.type = type;
    }

    // Digimon Attribute Tag
    const digiTag = items.find(item => item.includes('tag'));
    if (digiTag) {
      const attribute = digiTag.replace(' tag', '');
      options.filters.digimon.attribute = attribute;
    }

    // Hot Chocolate - Guarantees Fusions
    if (items.includes('Hot Chocolate')) {
      options.overrideParams.forceFusion = true;
      options.overrideParams.minSpecies = 2;
    }

    // Milk - Guarantees Type Count
    if (items.includes('Standard Milk')) {
      options.overrideParams.minType = 2;
    } else if (items.includes('Chocolate Milk')) {
      options.overrideParams.minType = 3;
    } else if (items.includes('Strawberry Milk')) {
      options.overrideParams.minType = 4;
    } else if (items.includes('Moomoo Milk')) {
      options.overrideParams.minType = 5;
    }

    // Ice Cream - Guarantees Specific Types
    const iceCreams = {
      'Vanilla Ice Cream': 0,
      'Strawberry Ice Cream': 1,
      'Chocolate Ice Cream': 2,
      'Mint Ice Cream': 3,
      'Pecan Ice Cream': 4
    };

    const selectedIceCreams = items.filter(item => Object.keys(iceCreams).includes(item));

    if (selectedIceCreams.length > 0) {
      // Check if ice creams are used in the correct order
      const validIceCreamOrder = this.validateIceCreamOrder(selectedIceCreams);

      if (validIceCreamOrder) {
        options.overrideParams.guaranteeTypePositions = selectedIceCreams.map(item => iceCreams[item]);
      }
    }

    // Species Input - Sets Species 1
    const speciesInput = items.find(item => item.startsWith('Input:'));
    if (speciesInput) {
      const species = speciesInput.replace('Input:', '').trim();
      if (!options.overrideParams.species) options.overrideParams.species = [];
      options.overrideParams.species.push(species);
    }

    // Species Dropdown - Sets Species 1 & 2
    const speciesDropdown = items.filter(item => item.startsWith('Dropdown:'));
    if (speciesDropdown.length > 0 && speciesDropdown.length <= 2) {
      if (!options.overrideParams.species) options.overrideParams.species = [];
      speciesDropdown.forEach(item => {
        const species = item.replace('Dropdown:', '').trim();
        options.overrideParams.species.push(species);
      });
    }

    // Species Radio - Sets Species 1, 2 & 3
    const speciesRadio = items.filter(item => item.startsWith('Radio:'));
    if (speciesRadio.length > 0 && speciesRadio.length <= 3) {
      if (!options.overrideParams.species) options.overrideParams.species = [];
      speciesRadio.forEach(item => {
        const species = item.replace('Radio:', '').trim();
        options.overrideParams.species.push(species);
      });
    }

    // DNA Splicer - Allows claiming extra monsters
    if (items.includes('DNA Splicer')) {
      const dnaSplicerCount = items.filter(item => item === 'DNA Splicer').length;
      options.extraClaims = dnaSplicerCount;
    }

    return options;
  }

  /**
   * Validate that ice creams are used in the correct order
   * @param {Array} iceCreams - Array of selected ice cream items
   * @returns {boolean} - Whether the order is valid
   */
  static validateIceCreamOrder(iceCreams) {
    const order = [
      'Vanilla Ice Cream',
      'Strawberry Ice Cream',
      'Chocolate Ice Cream',
      'Mint Ice Cream',
      'Pecan Ice Cream'
    ];

    // Check if each ice cream is preceded by all required previous ice creams
    for (const iceCream of iceCreams) {
      const index = order.indexOf(iceCream);

      // For each ice cream, check if all previous ones in the order are present
      for (let i = 0; i < index; i++) {
        if (!iceCreams.includes(order[i])) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Roll monsters for egg hatching
   * @param {Object} rollerOptions - Options for monster roller
   * @returns {Promise<Array>} - Array of rolled monsters
   */
  static async rollEggMonsters(rollerOptions) {
    try {
      // Create monster roller
      const roller = new MonsterRoller(rollerOptions);

      // Roll 10 monsters
      return await roller.rollMultiple(10);
    } catch (error) {
      console.error('Error rolling egg monsters:', error);
      throw error;
    }
  }

  /**
   * Claim hatched monsters
   * @param {number} trainerId - Trainer ID
   * @param {Array} selectedMonsters - Monsters to claim (with eggId and monsterId)
   * @param {number} maxClaims - Maximum number of monsters that can be claimed
   * @returns {Promise<Object>} - Result of claiming
   */
  static async claimHatchedMonsters(trainerId, selectedMonsters, maxClaims) {
    try {
      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return { success: false, message: 'Trainer not found' };
      }

      // Validate claim count
      if (selectedMonsters.length > maxClaims) {
        return {
          success: false,
          message: `You can only claim ${maxClaims} monster(s). You selected ${selectedMonsters.length}.`
        };
      }

      // Create monsters in database
      const createdMonsters = [];

      for (const selection of selectedMonsters) {
        const { monster } = selection;

        // Create monster
        const monsterData = {
          trainer_id: trainerId,
          name: this.generateDefaultName(monster),
          species1: monster.species1,
          species2: monster.species2 || null,
          species3: monster.species3 || null,
          type1: monster.type1,
          type2: monster.type2 || null,
          type3: monster.type3 || null,
          type4: monster.type4 || null,
          type5: monster.type5 || null,
          attribute: monster.attribute || null,
          level: 1,
          happiness: 50,
          experience: 0,
          is_shiny: false,
          origin: 'egg',
          date_obtained: new Date()
        };

        const createdMonster = await Monster.create(monsterData);
        createdMonsters.push({
          ...createdMonster,
          eggId: selection.eggId
        });
      }

      // Return success with created monsters
      return {
        success: true,
        message: `Successfully claimed ${createdMonsters.length} monster(s)`,
        monsters: createdMonsters
      };
    } catch (error) {
      console.error('Error claiming hatched monsters:', error);
      return { success: false, message: 'Error claiming hatched monsters' };
    }
  }

  /**
   * Generate a default name for a monster
   * @param {Object} monster - Monster data
   * @returns {string} - Generated name
   */
  static generateDefaultName(monster) {
    // Use species1 as the base name
    let name = monster.species1;

    // If it's a fusion, add a suffix
    if (monster.species2 || monster.species3) {
      name += ' Fusion';
    }

    // Add a random suffix for uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    name += `-${randomSuffix}`;

    return name;
  }
}

module.exports = EggHatchingService;
