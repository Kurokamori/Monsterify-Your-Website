const Prompt = require('../models/Prompt');
const PromptCompletion = require('../models/PromptCompletion');
const Trainer = require('../models/Trainer');
const MonsterRoller = require('./MonsterRoller');
const RewardSystem = require('./RewardSystem');
const Item = require('../models/Item');

class PromptSubmissionService {
  /**
   * Submit a prompt completion and apply rewards
   * @param {Object} data - Submission data
   * @param {number} data.promptId - ID of the prompt
   * @param {number} data.trainerId - ID of the trainer
   * @param {string} data.submissionUrl - URL to the artwork submission
   * @param {string} submitterId - Discord ID of the submitter
   * @returns {Promise<Object>} - Submission result
   */
  static async submitPrompt(data, submitterId) {
    try {
      const { promptId, trainerId, submissionUrl } = data;
      console.log(`Processing prompt submission: promptId=${promptId}, trainerId=${trainerId}`);

      // Validate inputs
      if (!promptId || !trainerId || !submissionUrl) {
        throw new Error('Missing required parameters');
      }

      // Get the prompt
      const prompt = await Prompt.getById(promptId);
      if (!prompt) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }
      console.log('Found prompt:', JSON.stringify(prompt));

      // Get the trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }
      console.log('Found trainer:', JSON.stringify(trainer));

      // Check if trainer meets level requirement
      if (trainer.level < prompt.min_trainer_level) {
        throw new Error(`Trainer level ${trainer.level} does not meet the minimum requirement of ${prompt.min_trainer_level}`);
      }

      // Check if this is a monthly prompt and if it's the current month
      if (prompt.category === 'monthly') {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
        if (prompt.month !== currentMonth) {
          throw new Error(`This prompt is only available in ${prompt.month}`);
        }
      }

      // Check if trainer has already completed this prompt (if not repeatable)
      if (!prompt.repeatable) {
        const hasCompleted = await PromptCompletion.hasCompleted(trainerId, promptId);
        if (hasCompleted) {
          throw new Error('This prompt has already been completed and is not repeatable');
        }
      }

      // Calculate rewards
      console.log('Calculating rewards for prompt...');
      const calculatedRewards = await this.calculateRewards(prompt);
      console.log('Calculated rewards:', JSON.stringify(calculatedRewards));

      // Create the completion record
      const completion = await PromptCompletion.create({
        prompt_id: promptId,
        trainer_id: trainerId,
        submission_url: submissionUrl,
        rewards_claimed: true
      });
      console.log('Created completion record:', JSON.stringify(completion));

      // Apply rewards
      console.log('Applying rewards to trainer...');
      const appliedRewards = await this.applyRewards(trainer, calculatedRewards);
      console.log('Applied rewards:', JSON.stringify(appliedRewards));

      // Return both the completion record and the applied rewards
      return {
        completion,
        calculation: appliedRewards // Return the actual applied rewards, not just the calculation
      };
    } catch (error) {
      console.error('Error submitting prompt:', error);
      throw error;
    }
  }

  /**
   * Calculate rewards for a prompt
   * @param {Object} prompt - The prompt object
   * @returns {Promise<Object>} - Calculation results
   */
  static async calculateRewards(prompt) {
    try {
      const rewards = {
        coins: prompt.reward_coins || 0,
        levels: prompt.reward_levels || 0,
        items: [],
        randomItems: {},
        monster: null
      };

      // Process specific items
      if (prompt.reward_items) {
        // Parse JSON string if needed
        if (typeof prompt.reward_items === 'string') {
          try {
            rewards.items = JSON.parse(prompt.reward_items);
          } catch (e) {
            console.error('Error parsing reward_items JSON:', e);
            rewards.items = [];
          }
        } else {
          rewards.items = Array.isArray(prompt.reward_items) ? prompt.reward_items : [];
        }
      }

      // Process random items
      if (prompt.reward_random_items) {
        // Parse JSON string if needed
        if (typeof prompt.reward_random_items === 'string') {
          try {
            rewards.randomItems = JSON.parse(prompt.reward_random_items);
          } catch (e) {
            console.error('Error parsing reward_random_items JSON:', e);
            rewards.randomItems = {};
          }
        } else {
          rewards.randomItems = prompt.reward_random_items;
        }
      }

      // Process monster reward
      if (prompt.reward_monster_params) {
        // Parse JSON string if needed
        if (typeof prompt.reward_monster_params === 'string') {
          try {
            rewards.monster = {
              params: JSON.parse(prompt.reward_monster_params)
            };
          } catch (e) {
            console.error('Error parsing reward_monster_params JSON:', e);
            rewards.monster = null;
          }
        } else {
          rewards.monster = {
            params: prompt.reward_monster_params
          };
        }
      }

      return rewards;
    } catch (error) {
      console.error('Error calculating prompt rewards:', error);
      throw error;
    }
  }

  /**
   * Apply rewards to a trainer
   * @param {Object} trainer - The trainer object
   * @param {Object} rewards - The rewards to apply
   * @returns {Promise<Object>} - Applied rewards
   */
  static async applyRewards(trainer, rewards) {
    try {
      const appliedRewards = {
        coins: 0,
        levels: 0,
        items: [],
        monster: null
      };

      // Apply coins
      if (rewards.coins > 0) {
        await Trainer.addCoins(trainer.id, rewards.coins);
        appliedRewards.coins = rewards.coins;
      }

      // Apply levels
      if (rewards.levels > 0) {
        await Trainer.addLevels(trainer.id, rewards.levels);
        appliedRewards.levels = rewards.levels;
      }

      // Apply specific items
      if (rewards.items && rewards.items.length > 0) {
        console.log('Processing specific items:', rewards.items);
        for (let item of rewards.items) {
          // Handle string format: "Item Name;category;quantity"
          if (typeof item === 'string') {
            const parts = item.split(';');
            if (parts.length >= 1) {
              const itemName = parts[0].trim();
              const itemCategory = parts.length >= 2 ? parts[1].trim().toLowerCase() : null;
              const itemQuantity = parts.length >= 3 ? parseInt(parts[2].trim()) || 1 : 1;

              item = {
                name: itemName,
                category: itemCategory,
                quantity: itemQuantity
              };
            } else {
              console.error('Invalid item string format:', item);
              continue;
            }
          }

          if (!item.name) {
            console.error('Item missing name:', item);
            continue;
          }

          const quantity = item.quantity || 1;
          console.log(`Adding item ${item.name} (quantity: ${quantity}) to trainer ${trainer.id}`);

          try {
            // Get the appropriate inventory category for this item
            let category;

            // If the item has a specified category, use it
            if (item.category) {
              // Convert category name to inventory field
              const categoryName = item.category.toLowerCase();
              switch(categoryName) {
                case 'balls':
                case 'pokeballs':
                case 'poke balls':
                  category = 'inv_balls';
                  break;
                case 'berries':
                case 'berry':
                  category = 'inv_berries';
                  break;
                case 'pastries':
                case 'pastry':
                case 'food':
                  category = 'inv_pastries';
                  break;
                case 'evolution':
                case 'evolution items':
                  category = 'inv_evolution';
                  break;
                case 'eggs':
                case 'egg':
                  category = 'inv_eggs';
                  break;
                case 'antiques':
                case 'antique':
                case 'relics':
                  category = 'inv_antiques';
                  break;
                case 'held items':
                case 'held':
                case 'helditems':
                  category = 'inv_helditems';
                  break;
                case 'seals':
                case 'seal':
                  category = 'inv_seals';
                  break;
                default:
                  category = 'inv_items';
              }
              console.log(`Using specified category for ${item.name}: ${category}`);
            } else {
              // Otherwise, determine the category from the item name
              category = await this.getCategoryInventoryField(item.name);
              console.log(`Determined category for ${item.name}: ${category}`);
            }

            await Trainer.updateInventoryItem(
              trainer.id,
              category,
              item.name,
              quantity
            );
            appliedRewards.items.push({
              name: item.name,
              quantity: quantity,
              category: category.replace('inv_', '') // Store the category without the 'inv_' prefix for reference
            });
          } catch (itemError) {
            console.error(`Error adding item ${item.name} to inventory:`, itemError);
          }
        }
      }

      // Apply random items
      if (rewards.randomItems && Object.keys(rewards.randomItems).length > 0) {
        console.log('Processing random items from categories:', rewards.randomItems);

        for (const [category, quantity] of Object.entries(rewards.randomItems)) {
          console.log(`Getting ${quantity} random items from category ${category}`);

          // Get random items from the category
          const randomItems = await this.getRandomItemsFromCategory(category, quantity);
          console.log(`Retrieved random items from ${category}:`, randomItems);

          for (const item of randomItems) {
            if (!item.name) {
              console.error('Random item missing name:', item);
              continue;
            }

            console.log(`Adding random item ${item.name} to trainer ${trainer.id}`);

            try {
              // Get the appropriate inventory category for this item
              const inventoryCategory = await this.getCategoryInventoryField(item.name);
              console.log(`Determined category for random item ${item.name}: ${inventoryCategory}`);

              await Trainer.updateInventoryItem(
                trainer.id,
                inventoryCategory,
                item.name,
                1
              );
              appliedRewards.items.push({
                name: item.name,
                quantity: 1,
                category: category, // Original category from random selection
                inventoryCategory: inventoryCategory.replace('inv_', '') // Actual inventory category used
              });
            } catch (itemError) {
              console.error(`Error adding random item ${item.name} to inventory:`, itemError);
            }
          }
        }
      }

      console.log('All applied items:', appliedRewards.items);

      // Apply monster reward
      if (rewards.monster) {
        try {
          const monsterParams = rewards.monster.params || {};
          console.log('Rolling monster with params:', JSON.stringify(monsterParams));

          // Ensure the params are properly structured for MonsterRoller
          const processedParams = this.processMonsterParams(monsterParams);
          console.log('Processed monster params:', JSON.stringify(processedParams));

          try {
            const rolledMonster = await MonsterRoller.rollOne(processedParams);
            console.log('Monster roller returned:', rolledMonster);

            if (rolledMonster) {
              console.log('Successfully rolled monster:', JSON.stringify(rolledMonster));
              // Create the monster for the trainer
              const newMonster = await this.createMonsterForTrainer(trainer.id, rolledMonster);
              appliedRewards.monster = newMonster;
            } else {
              console.error('Failed to roll monster, result was null or undefined');
              // Create a fallback monster
              const fallbackMonster = await this.createMonsterForTrainer(trainer.id, {
                species1: 'Pikachu',
                type1: 'Electric',
                speciesData: [{
                  species: 'Pokemon',
                  data: { Rarity: 'Common' }
                }]
              });
              appliedRewards.monster = fallbackMonster;
              console.log('Created fallback monster:', JSON.stringify(fallbackMonster));
            }
          } catch (rollerError) {
            console.error('Error in MonsterRoller.rollOne:', rollerError);
            // Create a fallback monster
            const fallbackMonster = await this.createMonsterForTrainer(trainer.id, {
              species1: 'Eevee',
              type1: 'Normal',
              speciesData: [{
                species: 'Pokemon',
                data: { Rarity: 'Common' }
              }]
            });
            appliedRewards.monster = fallbackMonster;
            console.log('Created fallback monster after error:', JSON.stringify(fallbackMonster));
          }
        } catch (error) {
          console.error('Error in monster reward processing:', error);
          // Create a fallback monster as a last resort
          try {
            const fallbackMonster = await this.createMonsterForTrainer(trainer.id, {
              species1: 'Bulbasaur',
              type1: 'Grass',
              type2: 'Poison',
              speciesData: [{
                species: 'Pokemon',
                data: { Rarity: 'Common' }
              }]
            });
            appliedRewards.monster = fallbackMonster;
            console.log('Created emergency fallback monster:', JSON.stringify(fallbackMonster));
          } catch (finalError) {
            console.error('Failed to create even a fallback monster:', finalError);
          }
        }
      }

      return appliedRewards;
    } catch (error) {
      console.error('Error applying prompt rewards:', error);
      throw error;
    }
  }

  /**
   * Get the inventory field name for a given item category
   * @param {string} itemName - The item name
   * @returns {Promise<string>} - Inventory field name
   */
  static async getCategoryInventoryField(itemName) {
    try {
      console.log(`Getting inventory field for item: ${itemName}`);

      // First, try to get the item from the database to get its actual category
      const Item = require('../models/Item');
      const itemData = await Item.getById(itemName);

      if (itemData && itemData.category) {
        console.log(`Found item ${itemName} in database with category: ${itemData.category}`);

        // Map database category to inventory category
        const category = itemData.category.toLowerCase();

        // Map database category to inventory category
        switch(category) {
          case 'balls':
          case 'pokeballs':
          case 'poke balls':
            return 'inv_balls';
          case 'berries':
          case 'berry':
            return 'inv_berries';
          case 'pastries':
          case 'pastry':
          case 'food':
            return 'inv_pastries';
          case 'evolution':
          case 'evolution items':
            return 'inv_evolution';
          case 'eggs':
          case 'egg':
            return 'inv_eggs';
          case 'antiques':
          case 'antique':
          case 'relics':
            return 'inv_antiques';
          case 'held items':
          case 'held':
          case 'helditems':
            return 'inv_helditems';
          case 'seals':
          case 'seal':
            return 'inv_seals';
          case 'black_market':
            return 'inv_items'; // Black market items go to general inventory
          default:
            return 'inv_items';
        }
      }

      // Fallback to name-based categorization if database lookup failed
      console.log(`Item ${itemName} not found in database or missing category, using name-based fallback`);
      const itemNameLower = itemName.toLowerCase();

      if (itemNameLower.includes('ball')) {
        return 'inv_balls';
      } else if (itemNameLower.includes('berry')) {
        return 'inv_berries';
      } else if (itemNameLower.includes('pastry') ||
                 itemNameLower.includes('cake') ||
                 itemNameLower.includes('cookie') ||
                 itemNameLower.includes('bread') ||
                 itemNameLower.includes('pie')) {
        return 'inv_pastries';
      } else if (itemNameLower.includes('stone') ||
                 itemNameLower.includes('evolution')) {
        return 'inv_evolution';
      } else if (itemNameLower.includes('egg')) {
        return 'inv_eggs';
      } else if (itemNameLower.includes('antique') ||
                 itemNameLower.includes('relic')) {
        return 'inv_antiques';
      } else if (itemNameLower.includes('held') ||
                 itemNameLower.includes('charm') ||
                 itemNameLower.includes('band') ||
                 itemNameLower.includes('scarf')) {
        return 'inv_helditems';
      } else if (itemNameLower.includes('seal')) {
        return 'inv_seals';
      }

      // Default to general items
      return 'inv_items';
    } catch (error) {
      console.error(`Error determining inventory field for item ${itemName}:`, error);
      return 'inv_items'; // Default to general items on error
    }
  }

  /**
   * Get random items from a category
   * @param {string} category - The item category
   * @param {number} quantity - The number of items to get
   * @returns {Promise<Array>} - Array of random items
   */
  static async getRandomItemsFromCategory(category, quantity) {
    try {
      console.log(`Getting ${quantity} random items from category: ${category}`);

      // Normalize the category name for database query
      // Database might store categories in lowercase or different format
      const normalizedCategory = category.toUpperCase().trim();

      // Query the database for items in this category
      const items = await Item.getByCategory(normalizedCategory);

      if (!items || items.length === 0) {
        console.log(`No items found in category: ${normalizedCategory}, using fallback items`);
        // Fallback to hardcoded items if none found in database
        const fallbackItems = {
          'BERRIES': [
            { name: 'Oran Berry', rarity: '1', category: 'BERRIES' },
            { name: 'Sitrus Berry', rarity: '2', category: 'BERRIES' },
            { name: 'Lum Berry', rarity: '3', category: 'BERRIES' },
            { name: 'Cheri Berry', rarity: '1', category: 'BERRIES' }
          ],
          'BALLS': [
            { name: 'Poké Ball', rarity: '1', category: 'BALLS' },
            { name: 'Great Ball', rarity: '2', category: 'BALLS' },
            { name: 'Ultra Ball', rarity: '3', category: 'BALLS' },
            { name: 'Master Ball', rarity: '4', category: 'BALLS' }
          ],
          'ITEMS': [
            { name: 'Potion', rarity: '1', category: 'ITEMS' },
            { name: 'Super Potion', rarity: '2', category: 'ITEMS' },
            { name: 'Hyper Potion', rarity: '3', category: 'ITEMS' },
            { name: 'Max Potion', rarity: '3', category: 'ITEMS' },
            { name: 'Revive', rarity: '2', category: 'ITEMS' },
            { name: 'Max Revive', rarity: '3', category: 'ITEMS' },
            { name: 'Rare Candy', rarity: '3', category: 'ITEMS' }
          ],
          'EVOLUTION': [
            { name: 'Fire Stone', rarity: '3', category: 'EVOLUTION' },
            { name: 'Water Stone', rarity: '3', category: 'EVOLUTION' },
            { name: 'Thunder Stone', rarity: '3', category: 'EVOLUTION' },
            { name: 'Leaf Stone', rarity: '3', category: 'EVOLUTION' }
          ],
          'PASTRIES': [
            { name: 'Sweet Roll', rarity: '1', category: 'PASTRIES' },
            { name: 'Chocolate Cake', rarity: '2', category: 'PASTRIES' },
            { name: 'Berry Tart', rarity: '3', category: 'PASTRIES' }
          ],
          'ANTIQUE': [
            { name: 'Ancient Coin', rarity: '3', category: 'ANTIQUE' },
            { name: 'Vintage Toy', rarity: '2', category: 'ANTIQUE' },
            { name: 'Fossil Fragment', rarity: '3', category: 'ANTIQUE' }
          ],
          'HELDITEMS': [
            { name: 'Choice Band', rarity: '3', category: 'HELDITEMS' },
            { name: 'Focus Sash', rarity: '3', category: 'HELDITEMS' },
            { name: 'Leftovers', rarity: '2', category: 'HELDITEMS' },
            { name: 'Life Orb', rarity: '3', category: 'HELDITEMS' },
            { name: 'Assault Vest', rarity: '3', category: 'HELDITEMS' },
            { name: 'Eviolite', rarity: '3', category: 'HELDITEMS' },
            { name: 'Rocky Helmet', rarity: '2', category: 'HELDITEMS' },
            { name: 'Expert Belt', rarity: '2', category: 'HELDITEMS' }
          ]
        };

        // Try to find the category in our fallback items
        // First try exact match, then try case-insensitive match
        let categoryItems = fallbackItems[normalizedCategory] || [];

        if (categoryItems.length === 0) {
          // Try to find a case-insensitive match
          const categoryKey = Object.keys(fallbackItems).find(
            key => key.toUpperCase() === normalizedCategory
          );

          if (categoryKey) {
            categoryItems = fallbackItems[categoryKey];
          }
        }

        if (categoryItems.length === 0) {
          console.log(`No fallback items found for category: ${normalizedCategory}, using ITEMS category`);
          categoryItems = fallbackItems['ITEMS'] || [];
        }

        // Shuffle the items
        const shuffled = [...categoryItems].sort(() => 0.5 - Math.random());

        // Take the first 'quantity' items
        const selectedItems = shuffled.slice(0, quantity);
        console.log(`Selected ${selectedItems.length} fallback items:`, selectedItems.map(item => item.name));

        return selectedItems;
      }

      console.log(`Found ${items.length} items in category ${normalizedCategory}`);

      // Ensure all items have a name property
      const validItems = items.filter(item => item && item.name);

      if (validItems.length === 0) {
        console.error(`No valid items found in category ${normalizedCategory}`);
        return [];
      }

      // Shuffle the items
      const shuffled = [...validItems].sort(() => 0.5 - Math.random());

      // Take the first 'quantity' items
      const selectedItems = shuffled.slice(0, quantity);
      console.log(`Selected ${selectedItems.length} items:`, selectedItems.map(item => item.name));

      // Ensure each item has a category property
      return selectedItems.map(item => ({
        ...item,
        category: item.category || normalizedCategory
      }));
    } catch (error) {
      console.error(`Error getting random items from category ${category}:`, error);
      return [];
    }
  }

  /**
   * Process monster parameters to ensure they're properly structured for MonsterRoller
   * @param {Object} params - The monster parameters
   * @returns {Object} - Processed parameters
   */
  static processMonsterParams(params) {
    try {
      // Create a properly structured object for MonsterRoller
      const processedParams = {
        overrideParams: {},
        filters: {
          pokemon: {},
          digimon: {},
          yokai: {}
        }
      };

      // Process overrideParams
      if (params.overrideParams) {
        processedParams.overrideParams = params.overrideParams;
      }

      // Process filters
      if (params.filters) {
        // Copy pokemon filters
        if (params.filters.pokemon) {
          processedParams.filters.pokemon = params.filters.pokemon;
        }

        // Copy digimon filters
        if (params.filters.digimon) {
          processedParams.filters.digimon = params.filters.digimon;
        }

        // Copy yokai filters
        if (params.filters.yokai) {
          processedParams.filters.yokai = params.filters.yokai;
        }

        // Copy includeSpecies and excludeSpecies
        if (params.filters.includeSpecies) {
          processedParams.filters.includeSpecies = params.filters.includeSpecies;
        }

        if (params.filters.excludeSpecies) {
          processedParams.filters.excludeSpecies = params.filters.excludeSpecies;
        }
      }

      return processedParams;
    } catch (error) {
      console.error('Error processing monster parameters:', error);
      // Return default parameters
      return {
        overrideParams: {},
        filters: {
          pokemon: { rarity: 'Common' },
          digimon: {},
          yokai: {}
        }
      };
    }
  }

  /**
   * Create a monster for a trainer
   * @param {number} trainerId - The trainer ID
   * @param {Object} monsterData - The monster data
   * @returns {Promise<Object>} - Created monster
   */
  static async createMonsterForTrainer(trainerId, monsterData) {
    try {
      console.log('Creating monster for trainer with data:', JSON.stringify(monsterData));

      // This is a simplified implementation - in a real implementation, you would
      // use the Monster model to create a new monster for the trainer

      // Check if we have valid monster data
      if (!monsterData || !monsterData.species1) {
        console.error('Invalid monster data:', monsterData);
        // Return a default monster as fallback
        return {
          trainer_id: trainerId,
          name: 'Pikachu',
          species: 'Pikachu',
          type1: 'Electric',
          type2: null,
          level: 1,
          experience: 0,
          rarity: 'Common',
          obtained_method: 'prompt_reward_fallback',
          obtained_date: new Date()
        };
      }

      // Extract relevant data from the rolled monster
      const { species1, type1, type2, speciesData } = monsterData;

      // Determine rarity from speciesData if available
      let rarity = 'Common';
      if (speciesData && speciesData.length > 0) {
        const firstSpecies = speciesData[0];
        if (firstSpecies.data) {
          if (firstSpecies.species === 'Pokemon' && firstSpecies.data.Rarity) {
            rarity = firstSpecies.data.Rarity;
          } else if (firstSpecies.species === 'Digimon' && firstSpecies.data.Stage) {
            // Map Digimon stages to rarity
            const stageToRarity = {
              'Training 1': 'Common',
              'Training 2': 'Common',
              'Rookie': 'Uncommon',
              'Champion': 'Rare',
              'Ultimate': 'Very Rare',
              'Mega': 'Legendary'
            };
            rarity = stageToRarity[firstSpecies.data.Stage] || 'Common';
          } else if (firstSpecies.species === 'Yokai' && firstSpecies.data.Rank) {
            // Map Yokai ranks to rarity
            const rankToRarity = {
              'E': 'Common',
              'D': 'Common',
              'C': 'Uncommon',
              'B': 'Rare',
              'A': 'Very Rare',
              'S': 'Legendary'
            };
            rarity = rankToRarity[firstSpecies.data.Rank] || 'Common';
          }
        }
      }

      // Create a new monster
      const newMonster = {
        trainer_id: trainerId,
        name: species1,
        species: species1,
        type1: type1,
        type2: type2 || null,
        level: 1,
        experience: 0,
        rarity: rarity,
        obtained_method: 'prompt_reward',
        obtained_date: new Date()
      };

      console.log('Created new monster:', JSON.stringify(newMonster));

      // In a real implementation, you would save this to the database
      // For now, we'll just return the monster data
      return newMonster;
    } catch (error) {
      console.error('Error creating monster for trainer:', error);
      throw error;
    }
  }
}

module.exports = PromptSubmissionService;
