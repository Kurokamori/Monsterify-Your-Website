const TrainerService = require('../../services/TrainerService');
const MonsterService = require('../../services/MonsterService');
const DiscordService = require('../../utils/DiscordService');
const pool = require('../../db');

/**
 * Service for Discord bot-specific operations
 */
class DiscordBotService {
  /**
   * Get town location information
   * @param {string} locationId - Location ID (e.g., 'town_center', 'apothecary_visit')
   * @returns {Promise<Object>} - Location information
   */
  static async getTownLocationInfo(locationId) {
    try {
      // Map location ID to database location name
      const locationMap = {
        'town_center': 'town_center',
        'apothecary_visit': 'apothecary',
        'bakery_visit': 'bakery',
        'witchs_hut_visit': 'witchs_hut',
        'megamart_visit': 'megamart',
        'antique_visit': 'antique',
        'game_corner_visit': 'game_corner',
        'adoption_visit': 'adoption',
        'trade_visit': 'trade',
        'garden_visit': 'garden',
        'farm_visit': 'farm',
        'nursery_visit': 'nursery',
        'pirates_dock_visit': 'pirates_dock'
      };

      const locationName = locationMap[locationId] || 'town_center';

      // Get location information from database
      const result = await pool.query(`
        SELECT
          name,
          description,
          image_url
        FROM
          locations
        WHERE
          id = $1
      `, [locationName]);

      // If location not found, return default
      if (result.rows.length === 0) {
        return {
          name: locationName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: 'Visit this location to explore and interact with various features!',
          imageUrl: 'https://i.imgur.com/DP1nFn2.png'
        };
      }

      return {
        name: result.rows[0].name,
        description: result.rows[0].description,
        imageUrl: result.rows[0].image_url || 'https://i.imgur.com/DP1nFn2.png'
      };
    } catch (error) {
      console.error('Error getting town location info:', error);

      // Return default if error
      return {
        name: locationId.replace('_visit', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Visit this location to explore and interact with various features!',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      };
    }
  }

  /**
   * Get market location information
   * @param {string} locationId - Location ID (e.g., 'markets_square', 'apothecary_shop')
   * @returns {Promise<Object>} - Location information
   */
  static async getMarketLocationInfo(locationId) {
    try {
      // Map location ID to database shop name
      const shopMap = {
        'markets_square': 'market_square',
        'apothecary_shop': 'apothecary',
        'bakery_shop': 'bakery',
        'witchs_hut_shop': 'witchs_hut',
        'megamart_shop': 'megamart',
        'antique_shop': 'antique_shop',
        'nursery_shop': 'nursery',
        'pirates_dock_shop': 'pirates_dock'
      };

      const shopName = shopMap[locationId] || 'market_square';

      // Get shop information from database
      const result = await pool.query(`
        SELECT
          name,
          description,
          image_url
        FROM
          shop_config
        WHERE
          shop_id = $1
      `, [shopName]);

      // If shop not found, return default
      if (result.rows.length === 0) {
        return {
          name: shopName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: 'Shop for various items and goods!',
          imageUrl: 'https://i.imgur.com/DP1nFn2.png'
        };
      }

      return {
        name: result.rows[0].name,
        description: result.rows[0].description,
        imageUrl: result.rows[0].image_url || 'https://i.imgur.com/DP1nFn2.png'
      };
    } catch (error) {
      console.error('Error getting market location info:', error);

      // Return default if error
      return {
        name: locationId.replace('_shop', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Shop for various items and goods!',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      };
    }
  }

  /**
   * Get shop items for a location
   * @param {string} shopId - Shop ID (e.g., 'apothecary', 'bakery')
   * @returns {Promise<Array>} - Array of shop items
   */
  static async getShopItems(shopId) {
    try {
      // Get shop items from database using the daily_shop_items table
      const today = new Date().toISOString().split('T')[0];

      const result = await pool.query(`
        SELECT
          i.id,
          i.name,
          i.description,
          dsi.price,
          i.category,
          i.icon as image_url
        FROM
          daily_shop_items dsi
        JOIN
          items i ON dsi.item_id = i.id
        WHERE
          dsi.shop_id = $1
          AND dsi.date = $2
        ORDER BY
          dsi.price ASC
      `, [shopId, today]);

      return result.rows;
    } catch (error) {
      console.error('Error getting shop items:', error);
      return [];
    }
  }

  /**
   * Get submission information
   * @param {string} submissionType - Submission type (e.g., 'art', 'writing')
   * @returns {Promise<Object>} - Submission information
   */
  static async getSubmissionInfo(submissionType) {
    // Define submission types and their details
    const submissionTypes = {
      'art': {
        name: 'Art Submission',
        description: 'Submit your artwork to earn rewards! You can earn levels and coins based on the type of art you submit.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png',
        fields: [
          { name: 'Sketch', value: '1 level, 50 coins' },
          { name: 'Sketch Set', value: '3 levels, 150 coins' },
          { name: 'Line Art', value: '3 levels, 150 coins' },
          { name: 'Rendered', value: '5 levels, 250 coins' },
          { name: 'Polished', value: '7 levels, 350 coins' }
        ]
      },
      'writing': {
        name: 'Writing Submission',
        description: 'Submit your writing to earn rewards! You can earn 1 level per 50 words and 1 coin per word.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png',
        fields: [
          { name: 'Word Count', value: '1 level per 50 words' },
          { name: 'Coins', value: '1 coin per word' }
        ]
      },
      'prompt': {
        name: 'Prompt Submission',
        description: 'Submit a prompt for others to use in their submissions!',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png',
        fields: []
      },
      'reference': {
        name: 'Reference Submission',
        description: 'Submit a reference for your trainer or monster! You can earn 6 levels and 200 coins per reference.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png',
        fields: [
          { name: 'Reward', value: '6 levels, 200 coins per reference' }
        ]
      }
    };

    return submissionTypes[submissionType] || {
      name: 'Submission',
      description: 'Submit your work to earn rewards!',
      imageUrl: 'https://i.imgur.com/DP1nFn2.png',
      fields: []
    };
  }

  /**
   * Get schedule information
   * @param {string} scheduleAction - Schedule action (e.g., 'view_schedule', 'add_task')
   * @returns {Promise<Object>} - Schedule information
   */
  static async getScheduleInfo(scheduleAction) {
    // Define schedule actions and their details
    const scheduleActions = {
      'view_schedule': {
        name: 'View Schedule',
        description: 'View your current schedule and upcoming tasks.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'add_task': {
        name: 'Add Task',
        description: 'Add a new task to your schedule.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'add_habit': {
        name: 'Add Habit',
        description: 'Add a new habit to track.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'create_schedule': {
        name: 'Create Schedule',
        description: 'Create a new schedule template.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'edit_tasks': {
        name: 'Edit Tasks',
        description: 'Edit your existing tasks.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'view_tasks': {
        name: 'View Tasks',
        description: 'View all your tasks.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'edit_habits': {
        name: 'Edit Habits',
        description: 'Edit your existing habits.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      },
      'view_habits': {
        name: 'View Habits',
        description: 'View all your habits.',
        imageUrl: 'https://i.imgur.com/DP1nFn2.png'
      }
    };

    return scheduleActions[scheduleAction] || {
      name: 'Schedule',
      description: 'Manage your schedule, tasks, and habits.',
      imageUrl: 'https://i.imgur.com/DP1nFn2.png'
    };
  }

  /**
   * Get user information from Discord ID
   * @param {string} discordId - Discord user ID
   * @returns {Promise<Object>} - User information
   */
  static async getUserByDiscordId(discordId) {
    try {
      const result = await pool.query(`
        SELECT
          id,
          username,
          email,
          discord_id
        FROM
          users
        WHERE
          discord_id = $1
      `, [discordId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error getting user by Discord ID:', error);
      return null;
    }
  }

  /**
   * Link Discord ID to user account
   * @param {string} discordId - Discord user ID
   * @param {string} username - Username
   * @returns {Promise<Object>} - User information
   */
  static async linkDiscordAccount(discordId, username) {
    try {
      // Check if user exists
      const userResult = await pool.query(`
        SELECT
          id,
          username,
          email,
          discord_id
        FROM
          users
        WHERE
          username = $1
      `, [username]);

      // If user exists, update Discord ID
      if (userResult.rows.length > 0) {
        const updateResult = await pool.query(`
          UPDATE
            users
          SET
            discord_id = $1
          WHERE
            id = $2
          RETURNING
            id,
            username,
            email,
            discord_id
        `, [discordId, userResult.rows[0].id]);

        return updateResult.rows[0];
      }

      return null;
    } catch (error) {
      console.error('Error linking Discord account:', error);
      return null;
    }
  }
}

module.exports = DiscordBotService;
