const db = require('../config/db');
const MonsterRoller = require('../models/MonsterRoller');
const Monster = require('../models/Monster');

// Available types for random type selection
const AVAILABLE_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

// Available attributes for random attribute selection
const AVAILABLE_ATTRIBUTES = ['Vaccine', 'Variable', 'Virus', 'Data', 'Free'];

// Table name mapping for database queries
const TABLE_NAMES = {
  pokemon: 'pokemon_monsters',
  digimon: 'digimon_monsters',
  yokai: 'yokai_monsters',
  nexomon: 'nexomon_monsters',
  pals: 'pals_monsters',
  fakemon: 'fakemon',
  finalfantasy: 'finalfantasy_monsters',
  monsterhunter: 'monsterhunter_monsters'
};

class ImmediateRewardService {
  /**
   * Calculate and immediately apply rewards for approved submission
   * @param {Object} prompt - Prompt object
   * @param {Object} submission - Submission object
   * @param {number} qualityScore - Quality score (1-10)
   * @param {boolean} bonusApplied - Whether bonus was applied
   * @returns {Object} Applied rewards with details
   */
  static async calculateAndApplyRewards(prompt, submission, qualityScore = 5, bonusApplied = false) {
    try {
      const rewards = typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;
      const appliedRewards = {
        levels: 0,
        coins: 0,
        items: [],
        monsters: [],
        static_monsters: [],
        semi_random_monsters: [],
        trainer_id: submission.trainer_id
      };

      // Start transaction
      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Base rewards
        if (rewards.levels) {
          appliedRewards.levels += rewards.levels;
        }

        if (rewards.coins) {
          appliedRewards.coins += rewards.coins;
        }

        if (rewards.items) {
          appliedRewards.items = [...rewards.items];
        }

        // Special items are now just regular items

        // Quality-based bonuses
        if (qualityScore >= 8 && rewards.bonus_conditions) {
          const bonus = rewards.bonus_conditions;
          if (qualityScore >= bonus.quality_threshold) {
            if (bonus.bonus_levels) {
              appliedRewards.levels += bonus.bonus_levels;
            }
            if (bonus.bonus_coins) {
              appliedRewards.coins += bonus.bonus_coins;
            }
            if (bonus.bonus_items) {
              appliedRewards.items.push(...bonus.bonus_items);
            }
          }
        }

        // Bonus rewards removed - simplified system

        // Apply levels to trainer
        if (appliedRewards.levels > 0) {
          await db.asyncRun(
            'UPDATE trainers SET level = level + $1 WHERE id = $2',
            [appliedRewards.levels, submission.trainer_id]
          );
        }

        // Apply coins to trainer
        if (appliedRewards.coins > 0) {
          await db.asyncRun(
            'UPDATE trainers SET coins = coins + $1 WHERE id = $2',
            [appliedRewards.coins, submission.trainer_id]
          );
        }

        // Apply items to trainer inventory
        for (const item of appliedRewards.items) {
          await this.addItemToTrainerInventory(submission.trainer_id, item);
        }

        // Special items are now handled as regular items

        // Handle monster rolls - roll immediately and add to trainer
        if (rewards.monster_roll && rewards.monster_roll.enabled) {
          const rolledMonster = await this.rollAndAddMonster(
            submission.trainer_id,
            rewards.monster_roll.parameters || {}
          );
          if (rolledMonster) {
            appliedRewards.monsters.push(rolledMonster);
          }
        }

        // Handle static monsters - create immediately with predefined species/level
        if (rewards.static_monsters && rewards.static_monsters.length > 0) {
          for (const staticMonster of rewards.static_monsters) {
            const createdMonster = await this.createStaticMonster(submission.trainer_id, staticMonster);
            if (createdMonster) {
              appliedRewards.static_monsters.push(createdMonster);
              appliedRewards.monsters.push(createdMonster);
            }
          }
        }

        // Handle semi-random monsters - create immediately with randomized attributes
        if (rewards.semi_random_monsters && rewards.semi_random_monsters.length > 0) {
          for (const semiRandomMonster of rewards.semi_random_monsters) {
            const createdMonster = await this.createSemiRandomMonster(submission.trainer_id, semiRandomMonster);
            if (createdMonster) {
              appliedRewards.semi_random_monsters.push(createdMonster);
              appliedRewards.monsters.push(createdMonster);
            }
          }
        }

        // Commit transaction
        await db.asyncRun('COMMIT');

        return appliedRewards;
      } catch (error) {
        // Rollback on error
        await db.asyncRun('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error calculating and applying rewards:', error);
      throw error;
    }
  }

  /**
   * Roll and add monster to trainer immediately
   * @param {number} trainerId - Trainer ID
   * @param {Object} rollParams - Roll parameters
   * @returns {Object} Generated monster
   */
  static async rollAndAddMonster(trainerId, rollParams = {}) {
    try {
      const monsterRoller = new MonsterRoller();
      
      // Set default parameters if not provided
      const defaultParams = {
        legendary_allowed: false,
        mythical_allowed: false,
        max_stage: 2,
        baby_allowed: true,
        ...rollParams
      };

      // Roll the monster
      const rolledMonster = await monsterRoller.rollMonster({
        trainerId,
        ...defaultParams
      });

      console.log(`Rolled monster ${rolledMonster.id} for trainer ${trainerId} from prompt reward`);
      return rolledMonster;
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  }

  /**
   * Reroll a monster using Forget-Me-Not berry
   * @param {number} trainerId - Trainer ID
   * @param {number} monsterId - Monster ID to reroll
   * @param {Object} originalParams - Original roll parameters
   * @returns {Object} New monster and old monster info
   */
  static async rerollMonsterWithForgetMeNot(trainerId, monsterId, originalParams = {}) {
    try {
      // Check if trainer has Forget-Me-Not berry
      const trainer = await db.asyncGet('SELECT berries FROM trainers WHERE id = $1', [trainerId]);
      if (!trainer) {
        throw new Error('Trainer not found');
      }

      const berries = trainer.berries ? JSON.parse(trainer.berries) : {};
      const forgetMeNotCount = parseInt(berries['Forget Me Not'] || 0);

      if (forgetMeNotCount < 1) {
        throw new Error('No Forget-Me-Not berries available');
      }

      // Get the old monster info
      const oldMonster = await db.asyncGet('SELECT * FROM monsters WHERE id = $1 AND trainer_id = $2', [monsterId, trainerId]);
      if (!oldMonster) {
        throw new Error('Monster not found or not owned by trainer');
      }

      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Consume the Forget-Me-Not berry
        const newForgetMeNotCount = forgetMeNotCount - 1;
        await db.asyncRun(`
          UPDATE trainers SET berries = jsonb_set(
            COALESCE(berries, '{}'),
            '{Forget Me Not}',
            $2::text::jsonb
          ) WHERE id = $1
        `, [trainerId, newForgetMeNotCount.toString()]);

        // Delete the old monster
        await db.asyncRun('DELETE FROM monsters WHERE id = $1', [monsterId]);

        // Roll a new monster with the same parameters
        const newMonster = await this.rollAndAddMonster(trainerId, originalParams);

        await db.asyncRun('COMMIT');

        return {
          success: true,
          oldMonster: {
            id: oldMonster.id,
            species_name: oldMonster.species_name,
            nickname: oldMonster.nickname
          },
          newMonster,
          berries_remaining: newForgetMeNotCount
        };
      } catch (error) {
        await db.asyncRun('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error rerolling monster:', error);
      throw error;
    }
  }

  /**
   * Add item to trainer inventory
   * @param {number} trainerId - Trainer ID
   * @param {Object} item - Item object
   */
  static async addItemToTrainerInventory(trainerId, item) {
    try {
      let itemId = item.item_id;
      
      // If item_name is provided instead of item_id, look up the ID
      if (!itemId && item.item_name) {
        const itemRecord = await db.asyncGet('SELECT id FROM items WHERE name = $1', [item.item_name]);
        if (itemRecord) {
          itemId = itemRecord.id;
        } else {
          console.warn(`Item not found: ${item.item_name}`);
          return;
        }
      }

      if (!itemId) {
        console.warn('No valid item ID found for item:', item);
        return;
      }

      const quantity = item.quantity || 1;
      const chance = item.chance || 100;

      // Check if item should be given based on chance
      if (Math.random() * 100 > chance) {
        console.log(`Item ${itemId} not given due to chance (${chance}%)`);
        return;
      }

      // Add to trainer inventory
      await db.asyncRun(`
        INSERT INTO trainer_inventory (trainer_id, item_id, quantity) 
        VALUES ($1, $2, $3)
        ON CONFLICT (trainer_id, item_id) 
        DO UPDATE SET quantity = trainer_inventory.quantity + $3
      `, [trainerId, itemId, quantity]);

      console.log(`Added ${quantity}x item ${itemId} to trainer ${trainerId}`);
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  /**
   * Add special item to trainer (berries, etc.)
   * @param {number} trainerId - Trainer ID
   * @param {Object} specialItem - Special item object
   */
  static async addSpecialItemToTrainer(trainerId, specialItem) {
    try {
      if (specialItem.type === 'berry') {
        // Handle special berries (Forget Me Not, Edenwiess, etc.)
        await db.asyncRun(`
          UPDATE trainers SET berries = jsonb_set(
            COALESCE(berries, '{}'),
            '{${specialItem.name}}',
            (COALESCE(berries->>'${specialItem.name}', '0')::int + $2)::text::jsonb
          ) WHERE id = $1
        `, [trainerId, specialItem.quantity || 1]);

        console.log(`Added ${specialItem.quantity || 1}x ${specialItem.name} berry to trainer ${trainerId}`);
      } else if (specialItem.type === 'keyitem') {
        // Handle key items
        await db.asyncRun(`
          UPDATE trainers SET keyitems = jsonb_set(
            COALESCE(keyitems, '{}'),
            '{${specialItem.name}}',
            (COALESCE(keyitems->>'${specialItem.name}', '0')::int + $2)::text::jsonb
          ) WHERE id = $1
        `, [trainerId, specialItem.quantity || 1]);

        console.log(`Added ${specialItem.quantity || 1}x ${specialItem.name} keyitem to trainer ${trainerId}`);
      }
    } catch (error) {
      console.error('Error adding special item:', error);
      throw error;
    }
  }

  /**
   * Get formatted reward summary for display
   * @param {Object} rewards - Applied rewards object
   * @returns {Object} Formatted reward summary
   */
  static formatRewardSummary(rewards) {
    const summary = {
      levels: rewards.levels,
      coins: rewards.coins,
      items: [],
      monsters: rewards.monsters || [],
      static_monsters: rewards.static_monsters || [],
      semi_random_monsters: rewards.semi_random_monsters || [],
      special_items: rewards.special_items || []
    };

    // Format items for display
    for (const item of rewards.items || []) {
      summary.items.push({
        name: item.item_name || `Item ${item.item_id}`,
        quantity: item.quantity || 1
      });
    }

    return summary;
  }

  /**
   * Create a static monster for the trainer (predefined species and level)
   * @param {number} trainerId - Trainer ID
   * @param {Object} monsterConfig - Static monster configuration
   * @returns {Object} Created monster
   */
  static async createStaticMonster(trainerId, monsterConfig) {
    try {
      const { table, species_id, species_name, level, image_url } = monsterConfig;

      if (!species_name && !species_id) {
        console.warn('Static monster missing species information:', monsterConfig);
        return null;
      }

      // Get the species data from the appropriate table
      const tableName = TABLE_NAMES[table];
      if (!tableName) {
        console.warn('Invalid table for static monster:', table);
        return null;
      }

      let speciesData;
      if (species_id) {
        speciesData = await db.asyncGet(
          `SELECT * FROM ${tableName} WHERE id = $1`,
          [species_id]
        );
      } else if (species_name) {
        speciesData = await db.asyncGet(
          `SELECT * FROM ${tableName} WHERE name = $1`,
          [species_name]
        );
      }

      if (!speciesData) {
        console.warn(`Species not found in ${tableName}:`, species_id || species_name);
        return null;
      }

      // Extract type information from species data
      const types = this.extractTypesFromSpecies(speciesData, table);
      const attribute = speciesData.attribute || null;

      // Build monster data
      const monsterData = {
        trainer_id: trainerId,
        name: speciesData.name,
        species1: speciesData.name,
        type1: types[0] || 'Normal',
        type2: types[1] || null,
        type3: types[2] || null,
        type4: types[3] || null,
        type5: types[4] || null,
        attribute: attribute,
        level: level || 1,
        img_link: image_url || speciesData.image_url || null,
        date_met: new Date().toISOString().split('T')[0],
        where_met: 'Prompt Reward'
      };

      // Create the monster
      const createdMonster = await Monster.create(monsterData);
      console.log(`Created static monster ${speciesData.name} (level ${level}) for trainer ${trainerId}`);

      return createdMonster;
    } catch (error) {
      console.error('Error creating static monster:', error);
      throw error;
    }
  }

  /**
   * Create a semi-random monster for the trainer (predefined species, randomized attributes)
   * @param {number} trainerId - Trainer ID
   * @param {Object} monsterConfig - Semi-random monster configuration
   * @returns {Object} Created monster
   */
  static async createSemiRandomMonster(trainerId, monsterConfig) {
    try {
      const {
        table,
        species_id,
        species_name,
        image_url,
        allow_fusion,
        type_mode,
        fixed_types,
        types_min,
        types_max,
        attribute_mode,
        fixed_attribute,
        level_mode,
        fixed_level,
        level_min,
        level_max
      } = monsterConfig;

      if (!species_name && !species_id) {
        console.warn('Semi-random monster missing species information:', monsterConfig);
        return null;
      }

      // Get the primary species data
      const tableName = TABLE_NAMES[table];
      if (!tableName) {
        console.warn('Invalid table for semi-random monster:', table);
        return null;
      }

      let speciesData;
      if (species_id) {
        speciesData = await db.asyncGet(
          `SELECT * FROM ${tableName} WHERE id = $1`,
          [species_id]
        );
      } else if (species_name) {
        speciesData = await db.asyncGet(
          `SELECT * FROM ${tableName} WHERE name = $1`,
          [species_name]
        );
      }

      if (!speciesData) {
        console.warn(`Species not found in ${tableName}:`, species_id || species_name);
        return null;
      }

      // Determine species (with optional fusion)
      let species1 = speciesData.name;
      let species2 = null;
      let fusionImageUrl = image_url || speciesData.image_url;

      if (allow_fusion) {
        // Get a random species for fusion from any enabled table
        const fusionSpecies = await this.getRandomFusionSpecies(table);
        if (fusionSpecies) {
          species2 = fusionSpecies.name;
        }
      }

      // Determine types
      let types = [];
      if (type_mode === 'fixed' && fixed_types && fixed_types.length > 0) {
        types = [...fixed_types];
      } else {
        // Random types
        const minTypes = types_min || 1;
        const maxTypes = types_max || 2;
        const numTypes = Math.floor(Math.random() * (maxTypes - minTypes + 1)) + minTypes;

        // Shuffle and pick random types
        const shuffledTypes = [...AVAILABLE_TYPES].sort(() => Math.random() - 0.5);
        types = shuffledTypes.slice(0, numTypes);
      }

      // Determine attribute
      let attribute = null;
      if (attribute_mode === 'fixed' && fixed_attribute) {
        attribute = fixed_attribute;
      } else {
        // Random attribute
        attribute = AVAILABLE_ATTRIBUTES[Math.floor(Math.random() * AVAILABLE_ATTRIBUTES.length)];
      }

      // Determine level
      let level = 1;
      if (level_mode === 'fixed') {
        level = fixed_level || 1;
      } else {
        // Random level in range
        const minLevel = level_min || 1;
        const maxLevel = level_max || 10;
        level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
      }

      // Build monster data
      const monsterData = {
        trainer_id: trainerId,
        name: species2 ? `${species1}/${species2}` : species1,
        species1: species1,
        species2: species2,
        type1: types[0] || 'Normal',
        type2: types[1] || null,
        type3: types[2] || null,
        type4: types[3] || null,
        type5: types[4] || null,
        attribute: attribute,
        level: level,
        img_link: fusionImageUrl,
        date_met: new Date().toISOString().split('T')[0],
        where_met: 'Prompt Reward'
      };

      // Create the monster
      const createdMonster = await Monster.create(monsterData);
      console.log(`Created semi-random monster ${monsterData.name} (level ${level}) for trainer ${trainerId}`);

      return createdMonster;
    } catch (error) {
      console.error('Error creating semi-random monster:', error);
      throw error;
    }
  }

  /**
   * Extract types from species data based on the table type
   * @param {Object} speciesData - Species data from database
   * @param {string} table - Table key (pokemon, digimon, etc.)
   * @returns {Array} Array of types
   */
  static extractTypesFromSpecies(speciesData, table) {
    const types = [];

    switch (table) {
      case 'pokemon':
      case 'nexomon':
        if (speciesData.type_primary) types.push(speciesData.type_primary);
        if (speciesData.type_secondary) types.push(speciesData.type_secondary);
        break;
      case 'digimon':
        if (speciesData.digimon_type) types.push(speciesData.digimon_type);
        break;
      case 'yokai':
        if (speciesData.tribe) types.push(speciesData.tribe);
        break;
      case 'fakemon':
        if (speciesData.type1) types.push(speciesData.type1);
        if (speciesData.type2) types.push(speciesData.type2);
        if (speciesData.type3) types.push(speciesData.type3);
        if (speciesData.type4) types.push(speciesData.type4);
        if (speciesData.type5) types.push(speciesData.type5);
        break;
      case 'finalfantasy':
      case 'monsterhunter':
      case 'pals':
        // These may not have standard type fields
        if (speciesData.element) types.push(speciesData.element);
        break;
      default:
        // Try common field names
        if (speciesData.type) types.push(speciesData.type);
        if (speciesData.type1) types.push(speciesData.type1);
        if (speciesData.type_primary) types.push(speciesData.type_primary);
    }

    return types.filter(t => t); // Remove nulls
  }

  /**
   * Get a random species for fusion from any table
   * @param {string} primaryTable - The primary table to prefer
   * @returns {Object|null} Random species data
   */
  static async getRandomFusionSpecies(primaryTable) {
    try {
      // Pick a random table (could be the same or different)
      const tables = Object.keys(TABLE_NAMES);
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const tableName = TABLE_NAMES[randomTable];

      // Get a random species from that table
      const result = await db.asyncGet(`
        SELECT name, image_url FROM ${tableName}
        ORDER BY RANDOM()
        LIMIT 1
      `);

      return result;
    } catch (error) {
      console.error('Error getting random fusion species:', error);
      return null;
    }
  }
}

module.exports = ImmediateRewardService;
