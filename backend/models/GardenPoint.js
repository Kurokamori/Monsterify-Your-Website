const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get user settings for monster roller
 * @param {Object} user - User object
 * @returns {Object} User settings
 */
const getUserSettings = (user) => {
  // Default settings if user has no settings
  const defaultSettings = {
    pokemon_enabled: true,
    digimon_enabled: true,
    yokai_enabled: true,
    nexomon_enabled: true,
    pals_enabled: true,
    fakemon_enabled: true,
    species_min: 1,
    species_max: 2, // Default to max 2 species
    types_min: 1,
    types_max: 3    // Default to max 3 types
  };

  // If user has monster_roller_settings, parse them
  if (user && user.monster_roller_settings) {
    try {
      // Check if settings is already an object
      let settings;
      if (typeof user.monster_roller_settings === 'object') {
        settings = user.monster_roller_settings;
      } else {
        settings = JSON.parse(user.monster_roller_settings);
      }
      
      console.log('GardenPoint - Parsed settings from database:', settings);
      
      // Convert database format {pokemon: true} to expected format {pokemon_enabled: true}
      const convertedSettings = {};
      
      // Map database format to expected format
      if (settings.pokemon !== undefined) convertedSettings.pokemon_enabled = settings.pokemon;
      if (settings.digimon !== undefined) convertedSettings.digimon_enabled = settings.digimon;
      if (settings.yokai !== undefined) convertedSettings.yokai_enabled = settings.yokai;
      if (settings.pals !== undefined) convertedSettings.pals_enabled = settings.pals;
      if (settings.nexomon !== undefined) convertedSettings.nexomon_enabled = settings.nexomon;
      if (settings.fakemon !== undefined) convertedSettings.fakemon_enabled = settings.fakemon;
      
      console.log('GardenPoint - After conversion mapping:', convertedSettings);
      
      // Also support if they're already in the expected format
      if (settings.pokemon_enabled !== undefined) convertedSettings.pokemon_enabled = settings.pokemon_enabled;
      if (settings.digimon_enabled !== undefined) convertedSettings.digimon_enabled = settings.digimon_enabled;
      if (settings.yokai_enabled !== undefined) convertedSettings.yokai_enabled = settings.yokai_enabled;
      if (settings.pals_enabled !== undefined) convertedSettings.pals_enabled = settings.pals_enabled;
      if (settings.nexomon_enabled !== undefined) convertedSettings.nexomon_enabled = settings.nexomon_enabled;
      if (settings.fakemon_enabled !== undefined) convertedSettings.fakemon_enabled = settings.fakemon_enabled;
      
      // Copy other settings (species_min, species_max, types_min, types_max)
      if (settings.species_min !== undefined) convertedSettings.species_min = settings.species_min;
      if (settings.species_max !== undefined) convertedSettings.species_max = settings.species_max;
      if (settings.types_min !== undefined) convertedSettings.types_min = settings.types_min;
      if (settings.types_max !== undefined) convertedSettings.types_max = settings.types_max;
      
      const result = { ...defaultSettings, ...convertedSettings };
      console.log('GardenPoint - Final userSettings:', result);
      return result;
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * Garden Point model
 */
class GardenPoint {
  /**
   * Get garden points for a user
   * @param {number} userId User ID
   * @returns {Promise<Object>} Garden points
   */
  static async getByUserId(userId) {
    try {
      const query = 'SELECT * FROM garden_points WHERE user_id = $1';
      const gardenPoints = await db.asyncGet(query, [userId]);

      return gardenPoints;
    } catch (error) {
      console.error(`Error getting garden points for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update garden points for a user
   * @param {number} userId User ID
   * @param {number} points Points to add
   * @returns {Promise<Object>} Updated garden points
   */
  static async addPoints(userId, points) {
    try {
      // Check if user has garden points
      const gardenPoints = await this.getByUserId(userId);

      if (gardenPoints) {
        // Update existing garden points
        const newPoints = gardenPoints.points + points;
        const query = `
          UPDATE garden_points
          SET points = $1
          WHERE user_id = $2
        `;
        await db.asyncRun(query, [newPoints, userId]);

        return { ...gardenPoints, points: newPoints };
      } else {
        // Create new garden points
        const query = `
          INSERT INTO garden_points (user_id, points)
          VALUES ($1, $2)
        `;
        await db.asyncRun(query, [userId, points]);

        return { user_id: userId, points };
      }
    } catch (error) {
      console.error(`Error adding garden points for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Harvest garden points for a user
   * @param {number} userId User ID
   * @returns {Promise<Object>} Harvest result with session ID and rewards
   */
  static async harvest(userId) {
    try {
      // Get garden points
      const gardenPoints = await this.getByUserId(userId);

      if (!gardenPoints || gardenPoints.points <= 0) {
        return { success: false, message: 'No garden points to harvest' };
      }

      // Calculate rewards based on points
      console.log('Harvesting garden points:', gardenPoints.points);
      const rewards = await this.calculateHarvestRewards(gardenPoints.points, userId);

      // Generate a session ID for the rewards
      const sessionId = uuidv4();

      // Create a session object similar to activity sessions
      const session = {
        id: sessionId,
        user_id: userId,
        location: 'garden',
        activity: 'harvest',
        status: 'completed',
        points: gardenPoints.points,
        rewards: rewards,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      // Update last harvested time but don't reset points yet
      // Points will be reset when rewards are claimed
      const query = `
        UPDATE garden_points
        SET last_harvested = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `;
      await db.asyncRun(query, [userId]);

      return {
        success: true,
        message: 'Garden harvested successfully',
        session_id: sessionId,
        session: session,
        rewards: rewards
      };
    } catch (error) {
      console.error(`Error harvesting garden for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Reset garden points after claiming rewards
   * @param {number} userId User ID
   * @returns {Promise<boolean>} Success status
   */
  static async resetPointsAfterClaim(userId) {
    try {
      const query = `
        UPDATE garden_points
        SET points = 0
        WHERE user_id = $1
      `;
      await db.asyncRun(query, [userId]);
      return true;
    } catch (error) {
      console.error(`Error resetting garden points for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate harvest rewards based on points
   * @param {number} points Garden points
   * @returns {Array} Array of reward objects
   */
  static async calculateHarvestRewards(points, userId) {
    const rewards = [];

    const query = 'SELECT name FROM items WHERE category = \'berries\' AND rarity = $1';

    const commonBerries = await db.asyncAll(query, ['common']);
    console.log(commonBerries);
    console.log(commonBerries[0].name);
    const uncommonBerries = await db.asyncAll(query, ['uncommon']);
    const rareBerries = await db.asyncAll(query, ['rare']);

    // Always guarantee at least 1 berry if there's at least 1 garden point
    if (points > 0) {
      const guaranteedBerry = commonBerries[Math.floor(Math.random() * commonBerries.length)];
      rewards.push({
        id: `berry-${uuidv4()}`,
        type: 'item',
        reward_type: 'item',
        rarity: 'common',
        reward_data: {
          name: guaranteedBerry.name,
          category: 'berries',
          title: guaranteedBerry.name,
          description: `A ${guaranteedBerry.name} from your garden.`
        },
        assigned_to: null,
        claimed: false
      });
    }

    // For each garden point, 40% chance of rolling a berry
    for (let i = 0; i < points; i++) {
      if (Math.random() < 0.4) {
        // Determine berry rarity
        let berry;
        let rarity;

        const rarityRoll = Math.random();
        if (rarityRoll < 0.7) {
          // 70% chance for common berry
          berry = commonBerries[Math.floor(Math.random() * commonBerries.length)];
          rarity = 'common';
        } else if (rarityRoll < 0.9) {
          // 20% chance for uncommon berry
          berry = uncommonBerries[Math.floor(Math.random() * uncommonBerries.length)];
          rarity = 'uncommon';
        } else {
          // 10% chance for rare berry
          berry = rareBerries[Math.floor(Math.random() * rareBerries.length)];
          rarity = 'rare';
        }

        // 20% chance of rolling 2 berries instead of 1
        // 10% chance of rolling 3 berries instead of 1
        let quantity = 1;
        const quantityRoll = Math.random();
        if (quantityRoll < 0.2) {
          quantity = 2;
        } else if (quantityRoll < 0.3) {
          quantity = 3;
        }

        rewards.push({
          id: `berry-${uuidv4()}`,
          type: 'item',
          reward_type: 'item',
          rarity: rarity,
          reward_data: {
            name: berry.name,
            category: 'berries',
            title: `${quantity} ${berry.name}${quantity > 1 ? 's' : ''}`,
            description: `${quantity} ${berry.name}${quantity > 1 ? 's' : ''} from your garden.`,
            quantity: quantity
          },
          assigned_to: null,
          claimed: false
        });
      }
    }

    // 20% chance of rolling a garden monster for each garden point
    for (let i = 0; i < points; i++) {
      if (Math.random() < 0.2) {
        try {
          // Pre-roll the monster
          console.log('Pre-rolling garden monster...');

          // Create monster roller with proper constructor (same as nursery)
          const MonsterRoller = require('./MonsterRoller');
          
          // Get user's actual monster roller settings
          const User = require('./User');
          const user = await User.findById(userId);
          const userSettings = getUserSettings(user);

          const monsterRoller = new MonsterRoller({
            seed: `garden-${Date.now()}-${i}`,
            userSettings: userSettings
          });

          // Set up parameters for garden monsters (using same strict rules as nursery)
          const rollerParams = {
            // STRICT garden monster rules - same as nursery base stage only
            includeStages: ['Base Stage', 'Doesn\'t Evolve'],
            excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage', 'Evolves', 'First Evolution', 'Second Evolution', 'Final Evolution'],
            
            // Table-specific rank filtering - same as nursery
            tableFilters: {
              pokemon: {
                includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
                legendary: false,
                mythical: false
              },
              digimon: {
                includeRanks: ['Baby I', 'Baby II'],
                excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion']
              },
              yokai: {
                includeRanks: ['E', 'D', 'C'],
                excludeRanks: ['S', 'A', 'B'],
                includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage']
              },
              nexomon: {
                includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
                legendary: false
              },
              pals: {
                // Pals don't have evolution stages or ranks, no restrictions needed
              }
            },
            
            legendary: false,  // NEVER allow legendary monsters from garden
            mythical: false,   // NEVER allow mythical monsters from garden
            
            // Garden-appropriate type preferences (but not restrictions)
            // Garden types will be applied after rolling any base species
            
            // Species and type limits (same as nursery defaults)
            species_min: 1,
            species_max: 2,
            types_min: 1,
            types_max: 3,
            
            level: Math.floor(Math.random() * 10) + 5, // Level 5-15
            context: 'garden_reward'
          };

          // Roll the monster (without assigning to a trainer yet)
          const rolledMonster = await monsterRoller.rollMonster(rollerParams);

          if (rolledMonster && rolledMonster.id) {
            console.log(`Successfully pre-rolled garden monster: ${rolledMonster.id} (${rolledMonster.name || 'Unnamed'})`);

            // Apply garden types to the rolled monster
            const gardenTypes = ['grass', 'bug', 'ground', 'normal', 'water', 'rock'];
            const numTypes = Math.floor(Math.random() * 3) + 1; // 1-3 types
            const selectedTypes = [];
            
            // Select random garden types
            for (let t = 0; t < numTypes; t++) {
              const availableTypes = gardenTypes.filter(type => !selectedTypes.includes(type));
              if (availableTypes.length > 0) {
                const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                selectedTypes.push(randomType);
              }
            }
            
            // Override the monster's types with garden types
            rolledMonster.type1 = selectedTypes[0] || 'normal';
            rolledMonster.type2 = selectedTypes[1] || null;
            rolledMonster.type3 = selectedTypes[2] || null;
            rolledMonster.type4 = null; // Garden monsters only get max 3 types
            rolledMonster.type5 = null;
            
            console.log(`Applied garden types to ${rolledMonster.name}: ${selectedTypes.join(', ')}`);

            // Add the rolled monster to the rewards
            rewards.push({
              id: `monster-${uuidv4()}`,
              type: 'monster',
              reward_type: 'monster',
              rarity: 'rare',
              reward_data: {
                title: 'Garden Monster',
                description: 'A monster from your garden.',
                params: {
                  // Standard roll parameters
                  includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                  legendary: false,
                  mythical: false,
                  includeRanks: ['Baby I', 'Baby II', 'Child'],
                  species_min: 1,
                  species_max: 2,
                  types_min: 1,
                  types_max: 3,
                  allowed_types: ['grass', 'bug', 'ground', 'normal']
                },
                // Add the pre-rolled monster information
                monster_id: rolledMonster.id,
                monster_name: rolledMonster.name || 'Garden Monster',
                monster_species: rolledMonster.species1 || 'Unknown',
                monster_image: rolledMonster.img_link || null,
                species1: rolledMonster.species1,
                species2: rolledMonster.species2,
                species3: rolledMonster.species3,
                type1: rolledMonster.type1,
                type2: rolledMonster.type2,
                type3: rolledMonster.type3,
                attribute: rolledMonster.attribute,
                level: rolledMonster.level
              },
              assigned_to: null,
              claimed: false
            });
          } else {
            // Fallback if monster rolling fails
            console.error('Failed to pre-roll garden monster, falling back to standard reward');
            fallbackMonsterReward();
          }
        } catch (error) {
          console.error('Error pre-rolling garden monster:', error);
          // Fallback to standard reward if there's an error
          fallbackMonsterReward();
        }
      }
    }

    // Fallback function for monster rewards
    function fallbackMonsterReward() {
      rewards.push({
        id: `monster-${uuidv4()}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: 'rare',
        reward_data: {
          title: 'Garden Monster',
          description: 'A monster from your garden.',
          params: {
            // STRICT garden monster rules - same as nursery base stage only
            includeStages: ['Base Stage', 'Doesn\'t Evolve'],
            excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage', 'Evolves', 'First Evolution', 'Second Evolution', 'Final Evolution'],
            
            // Table-specific rank filtering - same as nursery
            tableFilters: {
              pokemon: {
                includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
                legendary: false,
                mythical: false
              },
              digimon: {
                includeRanks: ['Baby I', 'Baby II'],
                excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion']
              },
              yokai: {
                includeRanks: ['E', 'D', 'C'],
                excludeRanks: ['S', 'A', 'B'],
                includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage']
              },
              nexomon: {
                includeStages: ['Base Stage', 'Doesn\'t Evolve'],
                excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
                legendary: false
              },
              pals: {
                // Pals don't have evolution stages or ranks, no restrictions needed
              }
            },
            
            legendary: false,  // NEVER allow legendary monsters from garden
            mythical: false,   // NEVER allow mythical monsters from garden
            
            // Garden-appropriate type preferences (but not restrictions)
            // Garden types will be applied after rolling any base species
            
            // Species and type limits (same as nursery defaults)
            species_min: 1,
            species_max: 2,
            types_min: 1,
            types_max: 3
          }
        },
        assigned_to: null,
        claimed: false
      });
    }

    return rewards;
  }
}

module.exports = GardenPoint;
