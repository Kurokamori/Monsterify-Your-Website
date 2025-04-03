/**
 * Location Activity Service
 * Handles business logic for location activities
 */

const pool = require('../db');
const MonsterRoller = require('../utils/MonsterRoller');
const RewardSystem = require('../utils/RewardSystem');
const Item = require('../models/Item');

class LocationActivityService {
  /**
   * Get a random prompt for a location
   * @param {string} location - Location ID
   * @param {string} activity - Activity type
   * @returns {Object} - Random prompt
   */
  static async getRandomPrompt(location, activity) {
    // Define prompts for each location
    const prompts = {
      garden: [
        { text: 'Plant new seeds in the garden.', difficulty: 'easy' },
        { text: 'Water all the plants in the garden.', difficulty: 'easy' },
        { text: 'Remove weeds from the garden beds.', difficulty: 'normal' },
        { text: 'Harvest ripe berries from the garden.', difficulty: 'normal' },
        { text: 'Prepare the soil for new plantings.', difficulty: 'normal' },
        { text: 'Prune overgrown plants and shrubs.', difficulty: 'hard' },
        { text: 'Deal with a garden pest infestation.', difficulty: 'hard' }
      ],
      farm: [
        { text: 'Feed the farm animals.', difficulty: 'easy' },
        { text: 'Clean the animal pens.', difficulty: 'easy' },
        { text: 'Harvest crops from the fields.', difficulty: 'normal' },
        { text: 'Repair fences around the farm.', difficulty: 'normal' },
        { text: 'Milk the cows and collect eggs.', difficulty: 'normal' },
        { text: 'Train the farm Pokémon to help with chores.', difficulty: 'hard' },
        { text: 'Prepare for an incoming storm.', difficulty: 'hard' }
      ],
      pirates_dock_fishing: [
        { text: 'Cast your line and catch some common fish for the crew\'s dinner.', difficulty: 'easy' },
        { text: 'Try to catch some of the more elusive fish species in deeper waters.', difficulty: 'normal' },
        { text: 'Brave the rough seas to catch rare and valuable fish species.', difficulty: 'normal' },
        { text: 'Hunt for the legendary sea monster that sailors have been talking about.', difficulty: 'hard' }
      ],
      pirates_dock_swab: [
        { text: 'Swab the main deck and make it shine.', difficulty: 'easy' },
        { text: 'Clean the entire ship, including the captain\'s quarters.', difficulty: 'normal' },
        { text: 'Repair damaged parts of the ship while cleaning.', difficulty: 'normal' },
        { text: 'Completely overhaul the ship\'s cleanliness during a storm.', difficulty: 'hard' }
      ]
    };

    // Get prompts for the location
    const locationPrompts = prompts[location] || [];

    if (locationPrompts.length === 0) {
      // Return a default prompt if none found
      return {
        text: `Perform tasks at the ${location}.`,
        difficulty: 'normal'
      };
    }

    // Return a random prompt
    return locationPrompts[Math.floor(Math.random() * locationPrompts.length)];
  }

  /**
   * Generate rewards based on location and productivity
   * @param {string} location - Location ID
   * @param {Object} options - Options for reward generation
   * @returns {Array} - Array of rewards
   */
  static async generateRewards(location, options = {}) {
    console.log('Generating rewards for location:', location, 'with options:', options);

    // Hard-coded reward generation for each location
    const { productivityScore = 100, timeSpent = 60, difficulty = 'normal' } = options;

    // Calculate number of rewards based on productivity and time spent
    let numRewards = 2; // Base number of rewards

    // Adjust number of rewards based on productivity and difficulty
    if (productivityScore >= 110) numRewards += 1;
    if (difficulty === 'hard') numRewards += 1;
    if (timeSpent >= 90) numRewards += 1;

    // Cap at 5 rewards maximum
    numRewards = Math.min(numRewards, 5);

    console.log(`Generating ${numRewards} rewards for ${location}`);

    // Generate rewards array
    const rewards = [];

    // Always add coins reward
    rewards.push(this.generateHardCodedCoinReward(productivityScore));

    // Always add levels reward
    rewards.push(this.generateHardCodedLevelReward(productivityScore));

    // Generate additional rewards based on location
    for (let i = 2; i < numRewards; i++) {
      let reward;

      switch (location) {
        case 'garden':
          // Garden rewards: Berries + Grass/Ground/Normal/Flying/Bug Pokémon
          if (Math.random() < 0.7) {
            // 70% chance for berry item
            reward = await this.generateHardCodedBerryReward();
          } else {
            // 30% chance for garden monster
            reward = await this.generateHardCodedGardenMonsterReward();
          }
          break;

        case 'farm':
          // Farm rewards: Eggs/Items + Similar monsters to garden
          if (Math.random() < 0.7) {
            // 70% chance for egg/farm item
            reward = await this.generateHardCodedFarmItemReward();
          } else {
            // 30% chance for farm monster
            reward = await this.generateHardCodedFarmMonsterReward();
          }
          break;

        case 'pirates_dock_fishing':
          // Fishing rewards: 80% monster, 20% items
          if (Math.random() < 0.8) {
            // 80% chance for water/ice monster
            reward = await this.generateHardCodedWaterMonsterReward();
          } else {
            // 20% chance for item
            reward = await this.generateHardCodedPirateItemReward();
          }
          break;

        case 'pirates_dock_swab':
          // Swabbing rewards: 20% monster, 80% items
          if (Math.random() < 0.2) {
            // 20% chance for water/ice monster
            reward = await this.generateHardCodedWaterMonsterReward();
          } else {
            // 80% chance for item
            reward = await this.generateHardCodedPirateItemReward();
          }
          break;

        default:
          // Default reward: coins
          reward = this.generateHardCodedCoinReward(productivityScore);
      }

      if (reward) {
        rewards.push(reward);
      }
    }

    console.log('Generated rewards:', rewards.length);
    return rewards;
  }

  /**
   * Generate a hard-coded coin reward
   * @param {number} productivityScore - Productivity score
   * @returns {Object} - Coin reward
   */
  static generateHardCodedCoinReward(productivityScore) {
    // Generate a random coin amount between 0-1000 with cascading probability
    // Higher productivity scores increase the chance of higher coin amounts

    // Base amount: 50-200 coins
    let coinAmount = Math.floor(Math.random() * 151) + 50;

    // Add bonus based on productivity
    const productivityBonus = Math.max(0, productivityScore - 100) * 2;
    coinAmount += productivityBonus;

    // Small chance (20%) for additional coins
    if (Math.random() < 0.2) {
      coinAmount += Math.floor(Math.random() * 200);
    }

    // Very small chance (5%) for big bonus
    if (Math.random() < 0.05) {
      coinAmount += Math.floor(Math.random() * 500);
    }

    // Cap at 1000 coins
    coinAmount = Math.min(coinAmount, 1000);

    return {
      id: `coin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'coin',
      reward_type: 'coin',
      amount: coinAmount,
      data: { amount: coinAmount },
      icon: 'fas fa-coins'
    };
  }

  /**
   * Generate a hard-coded level reward
   * @param {number} productivityScore - Productivity score
   * @returns {Object} - Level reward
   */
  static generateHardCodedLevelReward(productivityScore) {
    // Generate a random level amount between 1-10 with cascading probability
    // Higher productivity scores increase the chance of higher level amounts

    // Base amount: 1-3 levels
    let levelAmount = Math.floor(Math.random() * 3) + 1;

    // Add bonus based on productivity (max +2)
    const productivityBonus = Math.min(2, Math.floor((Math.max(0, productivityScore - 100) / 20)));
    levelAmount += productivityBonus;

    // Small chance (15%) for additional levels
    if (Math.random() < 0.15) {
      levelAmount += Math.floor(Math.random() * 2) + 1;
    }

    // Very small chance (3%) for big bonus
    if (Math.random() < 0.03) {
      levelAmount += Math.floor(Math.random() * 3) + 1;
    }

    // Cap at 10 levels
    levelAmount = Math.min(levelAmount, 10);

    return {
      id: `level-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'level',
      reward_type: 'level',
      levels: levelAmount,
      data: { levels: levelAmount },
      icon: 'fas fa-level-up-alt'
    };
  }

  /**
   * Generate a berry reward for the garden from the database
   * @returns {Object} - Berry item reward
   */
  static async generateHardCodedBerryReward() {
    try {
      // Get berries from the database
      const berries = await Item.getByCategory('BERRIES');

      // If no berries found, return a default berry
      if (!berries || berries.length === 0) {
        console.error('No berries found in database, using default berry');
        return {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'item',
          reward_type: 'item',
          name: 'Oran Berry',
          category: 'BERRIES',
          quantity: 1,
          data: { name: 'Oran Berry', category: 'BERRIES', quantity: 1 },
          icon: 'fas fa-apple-alt'
        };
      }

      // Select a random berry from the database
      const berry = berries[Math.floor(Math.random() * berries.length)];

      // Generate a random quantity (1-3)
      const quantity = Math.floor(Math.random() * 3) + 1;

      console.log('Selected berry from database:', berry.name);

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'item',
        reward_type: 'item',
        name: berry.name,
        category: 'BERRIES',
        quantity: quantity,
        data: {
          name: berry.name,
          category: 'BERRIES',
          quantity: quantity,
          description: berry.effect || 'A tasty berry.',
          icon: berry.icon || 'fas fa-apple-alt'
        },
        icon: 'fas fa-apple-alt'
      };
    } catch (error) {
      console.error('Error generating berry reward:', error);
      // Fallback to a default berry
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'item',
        reward_type: 'item',
        name: 'Oran Berry',
        category: 'BERRIES',
        quantity: 1,
        data: { name: 'Oran Berry', category: 'BERRIES', quantity: 1 },
        icon: 'fas fa-apple-alt'
      };
    }
  }

  /**
   * Generate a farm item reward from the database
   * @returns {Object} - Farm item reward
   */
  static async generateHardCodedFarmItemReward() {
    try {
      // Get eggs items from the database
      const eggItems = await Item.getByCategory('EGGS');

      // If no egg items found, try getting general items
      if (!eggItems || eggItems.length === 0) {
        console.warn('No EGGS category items found in database, trying ITEMS category');
        const generalItems = await Item.getByCategory('ITEMS');

        // If still no items found, return a default item
        if (!generalItems || generalItems.length === 0) {
          console.error('No items found in database, using default item');
          return {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'item',
            reward_type: 'item',
            name: 'Fresh Egg',
            category: 'EGGS',
            quantity: 1,
            data: { name: 'Fresh Egg', category: 'EGGS', quantity: 1 },
            icon: 'fas fa-egg'
          };
        }

        // Filter general items to get farm-related items
        const farmItems = generalItems.filter(item =>
          item.name.includes('Egg') ||
          item.name.includes('Protein') ||
          item.name.includes('Iron') ||
          item.name.includes('Calcium') ||
          item.name.includes('Zinc') ||
          item.name.includes('Carbos') ||
          item.name.includes('HP Up') ||
          item.name.includes('Milk') ||
          item.name.includes('Herb') ||
          item.name.includes('Root') ||
          item.name.includes('Seed')
        );

        // If no farm-related items found, use any general item
        const itemsToUse = farmItems.length > 0 ? farmItems : generalItems;

        // Select a random item
        const item = itemsToUse[Math.floor(Math.random() * itemsToUse.length)];

        // Generate a random quantity (1-2)
        const quantity = Math.floor(Math.random() * 2) + 1;

        console.log('Selected farm item from ITEMS category:', item.name);

        return {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'item',
          reward_type: 'item',
          name: item.name,
          category: item.category || 'ITEMS',
          quantity: quantity,
          data: {
            name: item.name,
            category: item.category || 'ITEMS',
            quantity: quantity,
            description: item.effect || 'A useful farm item.',
            icon: item.icon || 'fas fa-egg'
          },
          icon: 'fas fa-egg'
        };
      }

      // Select a random egg item from the database
      const item = eggItems[Math.floor(Math.random() * eggItems.length)];

      // Generate a random quantity (1-2)
      const quantity = Math.floor(Math.random() * 2) + 1;

      console.log('Selected egg item from database:', item.name);

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'item',
        reward_type: 'item',
        name: item.name,
        category: 'EGGS',
        quantity: quantity,
        data: {
          name: item.name,
          category: 'EGGS',
          quantity: quantity,
          description: item.effect || 'A farm item.',
          icon: item.icon || 'fas fa-egg'
        },
        icon: 'fas fa-egg'
      };
    } catch (error) {
      console.error('Error generating farm item reward:', error);
      // Fallback to a default item
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'item',
        reward_type: 'item',
        name: 'Fresh Egg',
        category: 'EGGS',
        quantity: 1,
        data: { name: 'Fresh Egg', category: 'EGGS', quantity: 1 },
        icon: 'fas fa-egg'
      };
    }
  }

  /**
   * Generate a pirate item reward from the database
   * @returns {Object} - Pirate item reward
   */
  static async generateHardCodedPirateItemReward() {
    try {
      // Get all items from the database
      const allItems = await pool.query(`
        SELECT * FROM items
        WHERE UPPER(category) != 'SPECIAL' AND UPPER(category) != 'KEY ITEMS'
        ORDER BY RANDOM()
        LIMIT 50
      `);

      // If no items found, return a default item
      if (!allItems || !allItems.rows || allItems.rows.length === 0) {
        console.error('No items found in database, using default item');
        return {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'item',
          reward_type: 'item',
          name: 'Potion',
          category: 'ITEMS',
          quantity: 1,
          data: { name: 'Potion', category: 'ITEMS', quantity: 1 },
          icon: 'fas fa-box'
        };
      }

      // Select a random item from the database
      const item = allItems.rows[Math.floor(Math.random() * allItems.rows.length)];

      // Generate a random quantity (1-2)
      const quantity = Math.floor(Math.random() * 2) + 1;

      console.log('Selected pirate item from database:', item.name, 'Category:', item.category);

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'item',
        reward_type: 'item',
        name: item.name,
        category: item.category || 'ITEMS',
        quantity: quantity,
        data: {
          name: item.name,
          category: item.category || 'ITEMS',
          quantity: quantity,
          description: item.effect || 'A useful item.',
          icon: item.icon || 'fas fa-box'
        },
        icon: 'fas fa-box'
      };
    } catch (error) {
      console.error('Error generating pirate item reward:', error);

      // Try using Item model as fallback
      try {
        // Get items from various categories
        const categories = ['ITEMS', 'HELDITEMS', 'EVOLUTION', 'BALLS'];
        const categoryIndex = Math.floor(Math.random() * categories.length);
        const category = categories[categoryIndex];

        const items = await Item.getByCategory(category);

        if (items && items.length > 0) {
          // Select a random item
          const item = items[Math.floor(Math.random() * items.length)];

          // Generate a random quantity (1-2)
          const quantity = Math.floor(Math.random() * 2) + 1;

          console.log('Selected pirate item from fallback:', item.name);

          return {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'item',
            reward_type: 'item',
            name: item.name,
            category: item.category || category,
            quantity: quantity,
            data: {
              name: item.name,
              category: item.category || category,
              quantity: quantity,
              description: item.effect || 'A useful item.',
              icon: item.icon || 'fas fa-box'
            },
            icon: 'fas fa-box'
          };
        }
      } catch (fallbackError) {
        console.error('Error in fallback item generation:', fallbackError);
      }

      // Final fallback to a default item
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'item',
        reward_type: 'item',
        name: 'Potion',
        category: 'ITEMS',
        quantity: 1,
        data: { name: 'Potion', category: 'ITEMS', quantity: 1 },
        icon: 'fas fa-box'
      };
    }
  }

  /**
   * Generate a hard-coded garden monster reward
   * @returns {Object} - Garden monster reward
   */
  static async generateHardCodedGardenMonsterReward() {
    try {
      // Create a MonsterRoller instance with garden-specific parameters
      const roller = new MonsterRoller({
        overrideParams: {
          minSpecies: 1,
          maxSpecies: 2,
          minType: 1,
          maxType: 3
        },
        filters: {
          pokemon: {
            types: ['Grass', 'Ground', 'Normal', 'Flying', 'Bug'],
            evolutionStage: 'base',
            rarity: 'Common'
          },
          digimon: {
            stage: ['Training 1'],
            attribute: ['Vaccine', 'Data']
          },
          yokai: {
            rank: ['E', 'D'],
            attribute: ['Earth', 'Wind']
          },
          includeSpecies: ['Pokemon', 'Digimon', 'Yokai']
        }
      });

      // Roll a monster
      const monsterData = await roller.rollMonster();
      console.log('Generated garden monster:', JSON.stringify(monsterData, null, 2));

      // Add level (5-15)
      monsterData.level = Math.floor(Math.random() * 11) + 5;

      // Format the monster as a reward
      return {
        id: `monster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: 'common',
        data: monsterData,
        reward_data: monsterData,
        icon: 'fas fa-leaf'
      };
    } catch (error) {
      console.error('Error generating garden monster reward:', error);
      return this.generateHardCodedCoinReward(100); // Fallback to coins
    }
  }

  /**
   * Generate a hard-coded farm monster reward
   * @returns {Object} - Farm monster reward
   */
  static async generateHardCodedFarmMonsterReward() {
    try {
      // Create a MonsterRoller instance with farm-specific parameters
      const roller = new MonsterRoller({
        overrideParams: {
          minSpecies: 1,
          maxSpecies: 2,
          minType: 1,
          maxType: 3
        },
        filters: {
          pokemon: {
            types: ['Normal', 'Ground', 'Fighting', 'Fire'],
            evolutionStage: 'base',
            rarity: 'Common'
          },
          digimon: {
            stage: ['Training 1', 'Rookie'],
            attribute: ['Vaccine', 'Data']
          },
          yokai: {
            rank: ['E', 'D'],
            attribute: ['Earth', 'Fire']
          },
          includeSpecies: ['Pokemon', 'Digimon', 'Yokai']
        }
      });

      // Roll a monster
      const monsterData = await roller.rollMonster();
      console.log('Generated farm monster:', JSON.stringify(monsterData, null, 2));

      // Add level (8-18)
      monsterData.level = Math.floor(Math.random() * 11) + 8;

      // Format the monster as a reward
      return {
        id: `monster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: 'uncommon',
        data: monsterData,
        reward_data: monsterData,
        icon: 'fas fa-horse'
      };
    } catch (error) {
      console.error('Error generating farm monster reward:', error);
      return this.generateHardCodedCoinReward(100); // Fallback to coins
    }
  }

  /**
   * Generate a hard-coded water monster reward
   * @returns {Object} - Water monster reward
   */
  static async generateHardCodedWaterMonsterReward() {
    try {
      // Create a MonsterRoller instance with water-specific parameters
      const roller = new MonsterRoller({
        overrideParams: {
          minSpecies: 1,
          maxSpecies: 3,
          minType: 1,
          maxType: 3
        },
        filters: {
          pokemon: {
            types: ['Water', 'Ice'],
            rarity: 'Uncommon'
          },
          digimon: {
            stage: ['Rookie', 'Champion'],
            attribute: ['Data', 'Vaccine', 'Virus']
          },
          yokai: {
            rank: ['D', 'C', 'B'],
            attribute: ['Water', 'Ice']
          },
          includeSpecies: ['Pokemon', 'Digimon', 'Yokai']
        }
      });

      // Roll a monster
      const monsterData = await roller.rollMonster();
      console.log('Generated water monster:', JSON.stringify(monsterData, null, 2));

      // Add level (10-25)
      monsterData.level = Math.floor(Math.random() * 16) + 10;

      // Format the monster as a reward
      return {
        id: `monster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: 'rare',
        data: monsterData,
        reward_data: monsterData,
        icon: 'fas fa-water'
      };
    } catch (error) {
      console.error('Error generating water monster reward:', error);
      return this.generateHardCodedCoinReward(100); // Fallback to coins
    }
  }

  /**
   * Generate a coin reward
   * @param {string} location - Location ID
   * @param {number} productivityScore - Productivity score
   * @param {string} difficulty - Difficulty level
   * @returns {Object} - Coin reward
   */
  static async generateCoinReward(location, productivityScore, difficulty) {
    // Base coin amount
    let baseAmount = 100;

    // Adjust based on difficulty
    if (difficulty === 'easy') baseAmount = 75;
    if (difficulty === 'hard') baseAmount = 150;

    // Adjust based on productivity
    const productivityMultiplier = productivityScore / 100;

    // Calculate final amount
    const amount = Math.round(baseAmount * productivityMultiplier);

    return {
      id: `coin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'coin',
      reward_type: 'coin',
      rarity: this.getRarityFromAmount(amount),
      data: {
        amount,
        title: `${amount} Coins`
      },
      reward_data: {
        amount,
        title: `${amount} Coins`
      },
      icon: 'fas fa-coins'
    };
  }

  /**
   * Generate an item reward
   * @param {string} location - Location ID
   * @param {number} productivityScore - Productivity score
   * @param {string} difficulty - Difficulty level
   * @returns {Object} - Item reward
   */
  static async generateItemReward(location, productivityScore, difficulty) {
    // Get item category based on location
    const category = this.getItemCategoryForLocation(location);

    // Get rarity based on difficulty and productivity
    const rarity = this.getRarityFromDifficulty(difficulty, productivityScore);

    try {
      // Get random item from the category and rarity
      const query = `
        SELECT * FROM items
        WHERE category = $1 AND rarity = $2
        ORDER BY RANDOM() LIMIT 1
      `;

      const result = await pool.query(query, [category, rarity]);

      if (result.rows.length === 0) {
        // Fallback to any item in the category
        const fallbackQuery = `
          SELECT * FROM items
          WHERE category = $1
          ORDER BY RANDOM() LIMIT 1
        `;

        const fallbackResult = await pool.query(fallbackQuery, [category]);

        if (fallbackResult.rows.length === 0) {
          // Return a default item if no items found
          return this.getDefaultItem(location);
        }

        const item = fallbackResult.rows[0];
        return this.formatItemReward(item);
      }

      const item = result.rows[0];
      return this.formatItemReward(item);
    } catch (error) {
      console.error('Error generating item reward:', error);
      return this.getDefaultItem(location);
    }
  }

  /**
   * Format an item as a reward
   * @param {Object} item - Item object from database
   * @returns {Object} - Formatted item reward
   */
  static formatItemReward(item) {
    // Determine quantity based on rarity
    let quantity = 1;
    if (item.rarity === 'common') quantity = Math.floor(Math.random() * 3) + 1;

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'item',
      reward_type: 'item',
      rarity: item.rarity,
      data: {
        name: item.name,
        description: item.effect || 'A useful item.',
        quantity,
        icon: item.icon || '<i class="fas fa-box"></i>',
        category: item.category
      },
      reward_data: {
        name: item.name,
        description: item.effect || 'A useful item.',
        quantity,
        icon: item.icon || '<i class="fas fa-box"></i>',
        category: item.category
      },
      icon: 'fas fa-box'
    };
  }

  /**
   * Get a default item for a location
   * @param {string} location - Location ID
   * @returns {Object} - Default item reward
   */
  static getDefaultItem(location) {
    let name, description;

    switch (location) {
      case 'garden':
        name = 'Oran Berry';
        description = 'A berry that restores a small amount of HP.';
        break;
      case 'farm':
        name = 'Fresh Milk';
        description = 'Fresh milk from the farm. Restores HP.';
        break;
      case 'pirates_dock_fishing':
        name = 'Fresh Fish';
        description = 'A freshly caught fish. Can be used in cooking.';
        break;
      case 'pirates_dock_swab':
        name = 'Cleaning Supplies';
        description = 'High-quality cleaning supplies for your home.';
        break;
      default:
        name = 'Mystery Item';
        description = 'A mysterious item with unknown properties.';
    }

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'item',
      reward_type: 'item',
      rarity: 'common',
      data: {
        name,
        description,
        quantity: 1,
        icon: '<i class="fas fa-box"></i>',
        category: 'ITEMS'
      },
      reward_data: {
        name,
        description,
        quantity: 1,
        icon: '<i class="fas fa-box"></i>',
        category: 'ITEMS'
      },
      icon: 'fas fa-box'
    };
  }

  /**
   * Generate a monster reward
   * @param {string} location - Location ID
   * @param {number} productivityScore - Productivity score
   * @param {string} difficulty - Difficulty level
   * @returns {Object} - Monster reward
   */
  static async generateMonsterReward(location, productivityScore, difficulty) {
    // Get monster parameters based on location
    const monsterParams = this.getMonsterParamsForLocation(location, difficulty);

    try {
      // Use MonsterRoller to generate a monster
      console.log('Generating monster with params:', JSON.stringify(monsterParams, null, 2));

      // Create a MonsterRoller instance with the parameters
      const roller = new MonsterRoller({
        overrideParams: {
          minSpecies: monsterParams.minSpecies || 1,
          maxSpecies: monsterParams.maxSpecies || 2,
          minType: monsterParams.minType || 1,
          maxType: monsterParams.maxType || 3,
          types: monsterParams.types || null
        },
        filters: {
          pokemon: monsterParams.filters?.pokemon || { rarity: monsterParams.rarity || 'Common' },
          digimon: monsterParams.filters?.digimon || { stage: ['Rookie'] },
          yokai: monsterParams.filters?.yokai || { rank: ['E', 'D'] },
          includeSpecies: monsterParams.includeSpecies || ['Pokemon', 'Digimon', 'Yokai']
        }
      });

      // Roll a monster
      const monsterData = await roller.rollMonster();
      console.log('Generated monster data:', JSON.stringify(monsterData, null, 2));

      // Calculate level based on difficulty and productivity
      let level = monsterParams.minLevel || 5;
      if (difficulty === 'normal') {
        level = Math.floor(Math.random() * (monsterParams.maxLevel - monsterParams.minLevel + 1)) + monsterParams.minLevel;
      } else if (difficulty === 'hard') {
        level = Math.floor(Math.random() * (monsterParams.maxLevel - monsterParams.minLevel + 1)) + monsterParams.minLevel;
        // Bonus level for high productivity
        if (productivityScore >= 110) {
          level += Math.floor((productivityScore - 100) / 10);
        }
      }

      // Ensure level doesn't exceed max
      level = Math.min(level, monsterParams.maxLevel || 30);

      // Add level to monster data
      monsterData.level = level;

      // Format the monster as a reward
      return {
        id: `monster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: monsterParams.rarity || 'common',
        data: monsterData,
        reward_data: monsterData,
        icon: 'fas fa-dragon'
      };
    } catch (error) {
      console.error('Error generating monster reward:', error);
      return this.getDefaultMonster(location);
    }
  }

  /**
   * Get a default monster for a location
   * @param {string} location - Location ID
   * @returns {Object} - Default monster reward
   */
  static getDefaultMonster(location) {
    let species, types;

    switch (location) {
      case 'garden':
        species = ['Bulbasaur'];
        types = ['Grass', 'Poison'];
        break;
      case 'farm':
        species = ['Miltank'];
        types = ['Normal'];
        break;
      case 'pirates_dock_fishing':
        species = ['Magikarp'];
        types = ['Water'];
        break;
      case 'pirates_dock_swab':
        species = ['Squirtle'];
        types = ['Water'];
        break;
      default:
        species = ['Eevee'];
        types = ['Normal'];
    }

    return {
      id: `monster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'monster',
      reward_type: 'monster',
      rarity: 'common',
      data: {
        species,
        types,
        level: Math.floor(Math.random() * 10) + 5
      },
      reward_data: {
        species,
        types,
        level: Math.floor(Math.random() * 10) + 5
      },
      icon: 'fas fa-dragon'
    };
  }

  /**
   * Get monster parameters for a location
   * @param {string} location - Location ID
   * @param {string} difficulty - Difficulty level
   * @returns {Object} - Monster parameters
   */
  static getMonsterParamsForLocation(location, difficulty) {
    // Base parameters
    const params = {
      minLevel: 5,
      maxLevel: 15,
      rarity: 'common',
      minSpecies: 1,
      maxSpecies: 3,
      minType: 1,
      maxType: 3,
      includeSpecies: ['Pokemon', 'Digimon', 'Yokai']
    };

    // Adjust based on difficulty
    if (difficulty === 'normal') {
      params.minLevel = 10;
      params.maxLevel = 20;
      params.rarity = 'uncommon';
    } else if (difficulty === 'hard') {
      params.minLevel = 15;
      params.maxLevel = 30;
      params.rarity = 'rare';
    }

    // Location-specific adjustments
    switch (location) {
      case 'garden':
        params.types = ['Grass', 'Bug', 'Normal', 'Flying', 'Ground'];
        params.maxSpecies = 2; // Max 2 species for garden monsters
        params.filters = {
          pokemon: {
            rarity: params.rarity,
            types: ['Grass', 'Bug', 'Normal', 'Flying', 'Ground']
          },
          digimon: {
            stage: difficulty === 'hard' ? ['Rookie', 'Champion'] : ['Rookie'],
            attribute: ['Vaccine', 'Data']
          },
          yokai: {
            rank: difficulty === 'hard' ? ['D', 'C'] : ['E', 'D']
          }
        };
        break;
      case 'farm':
        params.types = ['Normal', 'Ground', 'Fighting', 'Fire'];
        params.filters = {
          pokemon: {
            rarity: params.rarity,
            types: ['Normal', 'Ground', 'Fighting', 'Fire']
          },
          digimon: {
            stage: difficulty === 'hard' ? ['Rookie', 'Champion'] : ['Rookie'],
            attribute: ['Vaccine', 'Data']
          },
          yokai: {
            rank: difficulty === 'hard' ? ['C', 'B'] : ['D', 'C']
          }
        };
        break;
      case 'pirates_dock_fishing':
        params.types = ['Water', 'Ice', 'Dragon'];
        params.filters = {
          pokemon: {
            rarity: params.rarity,
            types: ['Water', 'Ice', 'Dragon']
          },
          digimon: {
            stage: difficulty === 'hard' ? ['Champion', 'Ultimate'] : ['Rookie', 'Champion'],
            attribute: ['Data', 'Vaccine']
          },
          yokai: {
            rank: difficulty === 'hard' ? ['B', 'A'] : ['C', 'B']
          }
        };
        break;
      case 'pirates_dock_swab':
        params.types = ['Water', 'Steel', 'Fighting', 'Dark'];
        params.filters = {
          pokemon: {
            rarity: params.rarity,
            types: ['Water', 'Steel', 'Fighting', 'Dark']
          },
          digimon: {
            stage: difficulty === 'hard' ? ['Champion', 'Ultimate'] : ['Rookie', 'Champion'],
            attribute: ['Virus', 'Data']
          },
          yokai: {
            rank: difficulty === 'hard' ? ['B', 'A'] : ['C', 'B']
          }
        };
        break;
    }

    return params;
  }

  /**
   * Get types for a location
   * @param {string} location - Location ID
   * @returns {Array} - Array of types
   */
  static getTypesForLocation(location) {
    switch (location) {
      case 'garden':
        return ['Grass', 'Bug', 'Normal', 'Flying', 'Ground'];
      case 'farm':
        return ['Normal', 'Ground', 'Fighting', 'Fire'];
      case 'pirates_dock_fishing':
        return ['Water', 'Ice', 'Dragon'];
      case 'pirates_dock_swab':
        return ['Water', 'Steel', 'Fighting', 'Dark'];
      default:
        return ['Normal'];
    }
  }

  /**
   * Get item category for a location
   * @param {string} location - Location ID
   * @returns {string} - Item category
   */
  static getItemCategoryForLocation(location) {
    switch (location) {
      case 'garden':
        return 'BERRIES';
      case 'farm':
        return 'PASTRIES';
      case 'pirates_dock_fishing':
        return 'ITEMS';
      case 'pirates_dock_swab':
        return 'ANTIQUE';
      default:
        return 'ITEMS';
    }
  }

  /**
   * Get rarity from difficulty and productivity
   * @param {string} difficulty - Difficulty level
   * @param {number} productivityScore - Productivity score
   * @returns {string} - Rarity level
   */
  static getRarityFromDifficulty(difficulty, productivityScore) {
    // Base rarity based on difficulty
    let rarity = 'common';
    if (difficulty === 'normal') rarity = 'uncommon';
    if (difficulty === 'hard') rarity = 'rare';

    // Adjust based on productivity
    if (productivityScore >= 110 && rarity === 'common') rarity = 'uncommon';
    if (productivityScore >= 120 && rarity === 'uncommon') rarity = 'rare';

    return rarity;
  }

  /**
   * Get rarity from coin amount
   * @param {number} amount - Coin amount
   * @returns {string} - Rarity level
   */
  static getRarityFromAmount(amount) {
    if (amount >= 200) return 'rare';
    if (amount >= 100) return 'uncommon';
    return 'common';
  }

  /**
   * Process a reward claim
   * @param {Object} reward - Reward object
   * @returns {Object} - Result of the claim
   */
  static async processRewardClaim(reward) {
    try {
      // Process the reward based on type
      const rewardType = reward.type || reward.reward_type;

      switch (rewardType) {
        case 'coin':
          return {
            success: true,
            message: `You claimed ${reward.data?.amount || reward.reward_data?.amount || 100} coins!`,
            amount: reward.data?.amount || reward.reward_data?.amount || 100
          };
        case 'item':
          return {
            success: true,
            message: `You claimed ${reward.data?.quantity || reward.reward_data?.quantity || 1} ${reward.data?.name || reward.reward_data?.name || 'item'}!`,
            item: {
              name: reward.data?.name || reward.reward_data?.name || 'Unknown Item',
              quantity: reward.data?.quantity || reward.reward_data?.quantity || 1
            }
          };
        case 'monster':
          return {
            success: true,
            message: `You claimed a new monster: ${Array.isArray(reward.data?.species) ? reward.data.species.join('/') : (reward.data?.species || 'Unknown')} (Level ${reward.data?.level || 1})!`,
            monster: reward.data || reward.reward_data
          };
        default:
          return {
            success: false,
            message: `Unsupported reward type: ${rewardType}`
          };
      }
    } catch (error) {
      console.error('Error processing reward claim:', error);
      return {
        success: false,
        message: 'Error processing reward: ' + error.message
      };
    }
  }
}

module.exports = LocationActivityService;
