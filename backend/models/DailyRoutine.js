const db = require('../config/db');

/**
 * DailyRoutine model for managing user daily routines
 */
class DailyRoutine {
  /**
   * Get all routines for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of routines
   */
  static async getByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT dr.*
        FROM daily_routines dr
        WHERE dr.user_id = $1
      `;
      const params = [userId];

      // Apply filters
      if (filters.is_active !== undefined) {
        query += ' AND dr.is_active = $1';
        params.push(filters.is_active);
      }

      if (filters.pattern_type) {
        query += ' AND dr.pattern_type = $1';
        params.push(filters.pattern_type);
      }

      query += ' ORDER BY dr.created_at DESC';

      const routines = await db.asyncAll(query, params);

      // Parse JSON fields and get items for each routine
      const routinesWithItems = await Promise.all(
        routines.map(async routine => {
          const items = await this.getRoutineItems(routine.id);
          return {
            ...routine,
            pattern_days: JSON.parse(routine.pattern_days || '[]'),
            items
          };
        })
      );

      return routinesWithItems;
    } catch (error) {
      console.error('Error getting routines by user ID:', error);
      throw error;
    }
  }

  /**
   * Get routine by ID
   * @param {number} id - Routine ID
   * @returns {Promise<Object|null>} Routine object or null
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM daily_routines WHERE id = $1';
      const routine = await db.asyncGet(query, [id]);

      if (!routine) return null;

      // Get routine items
      const items = await this.getRoutineItems(id);

      // Parse JSON fields
      return {
        ...routine,
        pattern_days: JSON.parse(routine.pattern_days || '[]'),
        items
      };
    } catch (error) {
      console.error('Error getting routine by ID:', error);
      throw error;
    }
  }

  /**
   * Get routine items
   * @param {number} routineId - Routine ID
   * @returns {Promise<Array>} Array of routine items
   */
  static async getRoutineItems(routineId) {
    try {
      const query = `
        SELECT ri.*, tr.name as trainer_name
        FROM routine_items ri
        LEFT JOIN trainers tr ON ri.reward_trainer_id = tr.id
        WHERE ri.routine_id = $1
        ORDER BY ri.order_index ASC
      `;

      return await db.asyncAll(query, [routineId]);
    } catch (error) {
      console.error('Error getting routine items:', error);
      throw error;
    }
  }

  /**
   * Create a new routine
   * @param {Object} routineData - Routine data
   * @returns {Promise<Object>} Created routine
   */
  static async create(routineData) {
    try {
      const {
        user_id,
        name,
        description,
        pattern_type = 'daily',
        pattern_days = [],
        is_active = 1
      } = routineData;

      const query = `
        INSERT INTO daily_routines (
          user_id, name, description, pattern_type, pattern_days, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const params = [
        user_id,
        name,
        description,
        pattern_type,
        JSON.stringify(pattern_days),
        is_active
      ];

      const result = await db.asyncRun(query, params);
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating routine:', error);
      throw error;
    }
  }

  /**
   * Update a routine
   * @param {number} id - Routine ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated routine
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key === 'pattern_days') {
          fields.push(`${key} = $1`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = $1`);
          params.push(updateData[key]);
        }
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE daily_routines SET ${fields.join(', ')} WHERE id = $1`;
      await db.asyncRun(query, params);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  }

  /**
   * Delete a routine
   * @param {number} id - Routine ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      const routine = await this.getById(id);
      if (!routine) {
        throw new Error('Routine not found');
      }

      if (routine.user_id !== userId) {
        throw new Error('Not authorized to delete this routine');
      }

      const query = 'DELETE FROM daily_routines WHERE id = $1';
      await db.asyncRun(query, [id]);

      return true;
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  }

  /**
   * Add item to routine
   * @param {number} routineId - Routine ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Created item
   */
  static async addItem(routineId, itemData) {
    try {
      const {
        title,
        description,
        scheduled_time,
        order_index = 0,
        reward_levels = 0,
        reward_coins = 0,
        reward_trainer_id,
        reminder_enabled = 0,
        reminder_offset = 0
      } = itemData;

      const query = `
        INSERT INTO routine_items (
          routine_id, title, description, scheduled_time, order_index,
          reward_levels, reward_coins, reward_trainer_id, reminder_enabled,
          reminder_offset
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        routineId,
        title,
        description,
        scheduled_time,
        order_index,
        reward_levels,
        reward_coins,
        reward_trainer_id,
        reminder_enabled,
        reminder_offset
      ];

      const result = await db.asyncRun(query, params);

      // Get the created item
      const itemQuery = `
        SELECT ri.*, tr.name as trainer_name
        FROM routine_items ri
        LEFT JOIN trainers tr ON ri.reward_trainer_id = tr.id
        WHERE ri.id = $1
      `;

      return await db.asyncGet(itemQuery, [result.lastID]);
    } catch (error) {
      console.error('Error adding routine item:', error);
      throw error;
    }
  }

  /**
   * Update routine item
   * @param {number} itemId - Item ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated item
   */
  static async updateItem(itemId, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = $1`);
        params.push(updateData[key]);
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(itemId);

      const query = `UPDATE routine_items SET ${fields.join(', ')} WHERE id = $1`;
      await db.asyncRun(query, params);

      // Get the updated item
      const itemQuery = `
        SELECT ri.*, tr.name as trainer_name
        FROM routine_items ri
        LEFT JOIN trainers tr ON ri.reward_trainer_id = tr.id
        WHERE ri.id = $1
      `;

      return await db.asyncGet(itemQuery, [itemId]);
    } catch (error) {
      console.error('Error updating routine item:', error);
      throw error;
    }
  }

  /**
   * Delete routine item
   * @param {number} itemId - Item ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteItem(itemId) {
    try {
      const query = 'DELETE FROM routine_items WHERE id = $1';
      await db.asyncRun(query, [itemId]);
      return true;
    } catch (error) {
      console.error('Error deleting routine item:', error);
      throw error;
    }
  }

  /**
   * Complete routine item
   * @param {number} itemId - Item ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Completion result
   */
  static async completeItem(itemId, userId) {
    try {
      // Get item details
      const itemQuery = `
        SELECT ri.*, dr.user_id
        FROM routine_items ri
        JOIN daily_routines dr ON ri.routine_id = dr.id
        WHERE ri.id = $1
      `;

      const item = await db.asyncGet(itemQuery, [itemId]);
      if (!item) {
        throw new Error('Routine item not found');
      }

      if (item.user_id !== userId) {
        throw new Error('Not authorized to complete this routine item');
      }

      const today = new Date().toISOString().split('T')[0];

      // Check if already completed today
      const completionQuery = `
        SELECT id FROM routine_completions
        WHERE routine_item_id = $1 AND user_id = $2 AND completion_date = $3
      `;

      const existingCompletion = await db.asyncGet(completionQuery, [itemId, userId, today]);
      if (existingCompletion) {
        throw new Error('Routine item already completed today');
      }

      // Record completion
      const insertQuery = `
        INSERT INTO routine_completions (routine_item_id, user_id, completion_date)
        VALUES ($1, $2, $3)
      `;

      await db.asyncRun(insertQuery, [itemId, userId, today]);

      // Award rewards if trainer is specified
      let rewardResult = null;
      if (item.reward_trainer_id && (item.reward_levels > 0 || item.reward_coins > 0)) {
        const Trainer = require('./Trainer');
        rewardResult = await Trainer.addLevelsAndCoins(
          item.reward_trainer_id,
          item.reward_levels,
          item.reward_coins
        );
      }

      return {
        success: true,
        item,
        rewards: rewardResult
      };
    } catch (error) {
      console.error('Error completing routine item:', error);
      throw error;
    }
  }

  /**
   * Get active routines for today
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of active routines
   */
  static async getActiveRoutinesForToday(userId) {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[dayOfWeek];

      const query = `
        SELECT dr.*
        FROM daily_routines dr
        WHERE dr.user_id = $1 AND dr.is_active = 1
        AND (
          dr.pattern_type = 'daily' OR
          (dr.pattern_type = 'weekdays' AND $2 BETWEEN 1 AND 5) OR
          (dr.pattern_type = 'weekends' AND $3 IN (0, 6)) OR
          (dr.pattern_type = 'custom' AND dr.pattern_days LIKE $4)
        )
      `;

      const params = [userId, dayOfWeek, dayOfWeek, `%"${todayName}"%`];
      const routines = await db.asyncAll(query, params);

      // Get items and completion status for each routine
      const routinesWithItems = await Promise.all(
        routines.map(async routine => {
          const items = await this.getRoutineItemsWithCompletionStatus(routine.id, userId);
          return {
            ...routine,
            pattern_days: JSON.parse(routine.pattern_days || '[]'),
            items
          };
        })
      );

      return routinesWithItems;
    } catch (error) {
      console.error('Error getting active routines for today:', error);
      throw error;
    }
  }

  /**
   * Get routine items with completion status
   * @param {number} routineId - Routine ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of routine items with completion status
   */
  static async getRoutineItemsWithCompletionStatus(routineId, userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const query = `
        SELECT ri.*, tr.name as trainer_name,
               CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END as completed_today
        FROM routine_items ri
        LEFT JOIN trainers tr ON ri.reward_trainer_id = tr.id
        LEFT JOIN routine_completions rc ON ri.id = rc.routine_item_id
                                         AND rc.user_id = $1
                                         AND rc.completion_date = $2
        WHERE ri.routine_id = $3
        ORDER BY ri.order_index ASC
      `;

      return await db.asyncAll(query, [userId, today, routineId]);
    } catch (error) {
      console.error('Error getting routine items with completion status:', error);
      throw error;
    }
  }
}

module.exports = DailyRoutine;
