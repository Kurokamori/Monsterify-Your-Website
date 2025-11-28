const db = require('../config/db.js');
const { isPostgreSQL } = require('../utils/dbUtils');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Adventure model for managing adventure data
 */
class Adventure {
  /**
   * Get all adventures with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of adventures
   */
  static async getAll(options = {}) {
    try {
      const {
        status = null,
        creatorId = null,
        page = 1,
        limit = 10,
        sort = 'newest'
      } = options;

      let query = `
        SELECT a.*, u.username as creator_username
        FROM adventures a
        LEFT JOIN users u ON a.creator_id = u.id
        WHERE 1=1
      `;
      const params = [];

      // Add filters
      if (status && status !== 'all') {
        query += ` AND a.status = $${params.length + 1}`;
        params.push(status);
      }

      if (creatorId) {
        query += ` AND a.creator_id = $${params.length + 1}`;
        params.push(creatorId);
      }

      // Add sorting
      switch (sort) {
        case 'oldest':
          query += ' ORDER BY a.created_at ASC';
          break;
        case 'title':
          query += ' ORDER BY a.title ASC';
          break;
        case 'encounters':
          query += ' ORDER BY a.encounter_count DESC';
          break;
        default: // newest
          query += ' ORDER BY a.created_at DESC';
          break;
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += buildLimitOffset(limit, offset, params);

      const rawAdventures = await db.asyncAll(query, params);
      
      // Transform adventures to include creator object and properly format dates
      const adventures = rawAdventures.map(adventure => ({
        ...adventure,
        creator: {
          name: adventure.creator_username || 'Unknown'
        },
        created_at: adventure.created_at ? new Date(adventure.created_at).toISOString() : new Date().toISOString(),
        updated_at: adventure.updated_at ? new Date(adventure.updated_at).toISOString() : null,
        completed_at: adventure.completed_at ? new Date(adventure.completed_at).toISOString() : null
      }));

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM adventures a
        WHERE 1=1
      `;
      const countParams = [];

      if (status && status !== 'all') {
        countQuery += ` AND a.status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      if (creatorId) {
        countQuery += ` AND a.creator_id = $${countParams.length + 1}`;
        countParams.push(creatorId);
      }

      const countResult = await db.asyncGet(countQuery, countParams);
      const total = countResult ? countResult.total : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        adventures: adventures || [],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };

    } catch (error) {
      console.error('Error getting adventures:', error);
      throw error;
    }
  }

  /**
   * Get adventure by ID
   * @param {number} id - Adventure ID
   * @returns {Promise<Object|null>} Adventure object or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT a.*, u.username as creator_username
        FROM adventures a
        LEFT JOIN users u ON a.creator_id = u.id
        WHERE a.id = $1
      `;

      const rawAdventure = await db.asyncGet(query, [id]);
      
      if (!rawAdventure) {
        return null;
      }
      
      // Transform adventure to include creator object and properly format dates
      return {
        ...rawAdventure,
        creator: {
          name: rawAdventure.creator_username || 'Unknown'
        },
        created_at: rawAdventure.created_at ? new Date(rawAdventure.created_at).toISOString() : new Date().toISOString(),
        updated_at: rawAdventure.updated_at ? new Date(rawAdventure.updated_at).toISOString() : null,
        completed_at: rawAdventure.completed_at ? new Date(rawAdventure.completed_at).toISOString() : null
      };

    } catch (error) {
      console.error('Error getting adventure by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new adventure
   * @param {Object} adventureData - Adventure data
   * @returns {Promise<Object>} Created adventure
   */
  static async create(adventureData) {
    try {
      const {
        creator_id,
        title,
        description,
        status = 'active',
        landmass_id,
        landmass_name,
        region_id,
        region_name,
        area_id,
        area_name,
        area_config
      } = adventureData;

      const currentTime = new Date().toISOString();
      
      const params = [
        creator_id,
        title,
        description,
        status,
        landmass_id || null,
        landmass_name || null,
        region_id || null,
        region_name || null,
        area_id || null,
        area_name || null,
        area_config ? JSON.stringify(area_config) : '{}',
        currentTime,
        currentTime
      ];

      let query, result, adventureId;

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        query = `
          INSERT INTO adventures (
            creator_id, title, description, status,
            landmass_id, landmass_name, region_id, region_name,
            area_id, area_name, area_config, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `;

        result = await db.asyncRun(query, params);
        adventureId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        query = `
          INSERT INTO adventures (
            creator_id, title, description, status,
            landmass_id, landmass_name, region_id, region_name,
            area_id, area_name, area_config, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;

        result = await db.asyncRun(query, params);
        adventureId = result.lastID;
      }

      if (adventureId) {
        return this.getById(adventureId);
      }

      throw new Error('Failed to create adventure');

    } catch (error) {
      console.error('Error creating adventure:', error);
      throw error;
    }
  }

  /**
   * Update adventure
   * @param {number} id - Adventure ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated adventure or null
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'title', 'description', 'status', 'encounter_count', 'completed_at',
        'discord_thread_id', 'discord_channel_id', 'max_encounters',
        'landmass_id', 'landmass_name', 'region_id', 'region_name',
        'area_id', 'area_name', 'area_config'
      ];
      const updates = [];
      const params = [];

      // Build update query dynamically
      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${index + 1}`);
          params.push(updateData[key]);
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Always update the updated_at timestamp
      updates.push(`updated_at = $${params.length + 1}`);
      params.push(new Date().toISOString());
      
      params.push(id);

      const query = `
        UPDATE adventures
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);

    } catch (error) {
      console.error('Error updating adventure:', error);
      throw error;
    }
  }

  /**
   * Delete adventure
   * @param {number} id - Adventure ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM adventures WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      
      return result && result.changes > 0;

    } catch (error) {
      console.error('Error deleting adventure:', error);
      throw error;
    }
  }

  /**
   * Get adventures by creator ID
   * @param {number} creatorId - Creator user ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Adventures with pagination
   */
  static async getByCreatorId(creatorId, options = {}) {
    return this.getAll({ ...options, creatorId });
  }

  /**
   * Get area configuration for an adventure
   * @param {number} id - Adventure ID
   * @returns {Promise<Object|null>} Area configuration or null
   */
  static async getAreaConfiguration(id) {
    try {
      const adventure = await this.getById(id);
      if (!adventure || !adventure.area_config) {
        return null;
      }

      // Parse area_config if it's a string
      let areaConfig = adventure.area_config;
      if (typeof areaConfig === 'string') {
        areaConfig = JSON.parse(areaConfig);
      }

      return {
        landmass_id: adventure.landmass_id,
        landmass_name: adventure.landmass_name,
        region_id: adventure.region_id,
        region_name: adventure.region_name,
        area_id: adventure.area_id,
        area_name: adventure.area_name,
        config: areaConfig
      };

    } catch (error) {
      console.error('Error getting area configuration:', error);
      return null;
    }
  }

  /**
   * Increment encounter count
   * @param {number} id - Adventure ID
   * @returns {Promise<Object|null>} Updated adventure
   */
  static async incrementEncounterCount(id) {
    try {
      const query = `
        UPDATE adventures 
        SET encounter_count = encounter_count + 1
        WHERE id = $1
      `;

      await db.asyncRun(query, [id]);
      return this.getById(id);

    } catch (error) {
      console.error('Error incrementing encounter count:', error);
      throw error;
    }
  }

  /**
   * Complete adventure
   * @param {number} id - Adventure ID
   * @returns {Promise<Object|null>} Updated adventure
   */
  static async complete(id) {
    try {
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      return this.update(id, updateData);

    } catch (error) {
      console.error('Error completing adventure:', error);
      throw error;
    }
  }
}

module.exports = Adventure;
