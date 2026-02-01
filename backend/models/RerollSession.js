const db = require('../config/db');
const crypto = require('crypto');

/**
 * RerollSession model for managing admin-created roll sessions
 * that can be claimed by specific players
 */
class RerollSession {
  /**
   * Generate a secure random token
   * @returns {string} 64-character hex token
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new reroll session
   * @param {Object} data Session data
   * @returns {Promise<Object>} Created session with token
   */
  static async create(data) {
    try {
      const token = this.generateToken();
      const query = `
        INSERT INTO reroll_sessions (
          token, roll_type, target_user_id, monster_params, item_params,
          gift_levels, rolled_monsters, rolled_items, monster_claim_limit,
          item_claim_limit, created_by, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        token,
        data.rollType,
        data.targetUserId,
        data.monsterParams ? JSON.stringify(data.monsterParams) : null,
        data.itemParams ? JSON.stringify(data.itemParams) : null,
        data.giftLevels || 0,
        data.rolledMonsters ? JSON.stringify(data.rolledMonsters) : '[]',
        data.rolledItems ? JSON.stringify(data.rolledItems) : '[]',
        data.monsterClaimLimit !== undefined ? data.monsterClaimLimit : null,
        data.itemClaimLimit !== undefined ? data.itemClaimLimit : null,
        data.createdBy,
        'active',
        data.notes || null
      ];

      const result = await db.asyncGet(query, values);
      return this.parseSession(result);
    } catch (error) {
      console.error('Error creating reroll session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID (admin view)
   * @param {number} id Session ID
   * @returns {Promise<Object|null>} Session or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT rs.*,
               u1.username AS created_by_username,
               u2.username AS target_username,
               u2.display_name AS target_display_name
        FROM reroll_sessions rs
        LEFT JOIN users u1 ON rs.created_by = u1.id
        LEFT JOIN users u2 ON rs.target_user_id = u2.id
        WHERE rs.id = $1
      `;
      const session = await db.asyncGet(query, [id]);
      return session ? this.parseSession(session) : null;
    } catch (error) {
      console.error(`Error getting reroll session with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get session by token (player view)
   * @param {string} token Session token
   * @returns {Promise<Object|null>} Session or null
   */
  static async getByToken(token) {
    try {
      const query = `
        SELECT rs.*,
               u1.username AS created_by_username,
               u2.username AS target_username,
               u2.display_name AS target_display_name
        FROM reroll_sessions rs
        LEFT JOIN users u1 ON rs.created_by = u1.id
        LEFT JOIN users u2 ON rs.target_user_id = u2.id
        WHERE rs.token = $1
      `;
      const session = await db.asyncGet(query, [token]);
      return session ? this.parseSession(session) : null;
    } catch (error) {
      console.error('Error getting reroll session by token:', error);
      throw error;
    }
  }

  /**
   * Get all sessions with optional filters
   * @param {Object} options Filter options
   * @returns {Promise<Array>} Array of sessions
   */
  static async getAll(options = {}) {
    try {
      const { status, createdBy, page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT rs.*,
               u1.username AS created_by_username,
               u2.username AS target_username,
               u2.display_name AS target_display_name,
               (SELECT COUNT(*) FROM reroll_claims WHERE session_id = rs.id) AS claim_count
        FROM reroll_sessions rs
        LEFT JOIN users u1 ON rs.created_by = u1.id
        LEFT JOIN users u2 ON rs.target_user_id = u2.id
        WHERE 1=1
      `;

      const values = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND rs.status = $${paramIndex++}`;
        values.push(status);
      }

      if (createdBy) {
        query += ` AND rs.created_by = $${paramIndex++}`;
        values.push(createdBy);
      }

      query += ` ORDER BY rs.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);

      const sessions = await db.asyncAll(query, values);

      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) AS total FROM reroll_sessions WHERE 1=1`;
      const countValues = [];
      let countParamIndex = 1;

      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`;
        countValues.push(status);
      }

      if (createdBy) {
        countQuery += ` AND created_by = $${countParamIndex++}`;
        countValues.push(createdBy);
      }

      const countResult = await db.asyncGet(countQuery, countValues);

      return {
        sessions: sessions.map(s => this.parseSession(s)),
        total: countResult?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      };
    } catch (error) {
      console.error('Error getting all reroll sessions:', error);
      throw error;
    }
  }

  /**
   * Update session
   * @param {number} id Session ID
   * @param {Object} data Update data
   * @returns {Promise<Object>} Updated session
   */
  static async update(id, data) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (data.rolledMonsters !== undefined) {
        updates.push(`rolled_monsters = $${paramIndex++}`);
        values.push(JSON.stringify(data.rolledMonsters));
      }

      if (data.rolledItems !== undefined) {
        updates.push(`rolled_items = $${paramIndex++}`);
        values.push(JSON.stringify(data.rolledItems));
      }

      if (data.monsterClaimLimit !== undefined) {
        updates.push(`monster_claim_limit = $${paramIndex++}`);
        values.push(data.monsterClaimLimit);
      }

      if (data.itemClaimLimit !== undefined) {
        updates.push(`item_claim_limit = $${paramIndex++}`);
        values.push(data.itemClaimLimit);
      }

      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }

      if (data.notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(data.notes);
      }

      if (updates.length === 0) {
        return this.getById(id);
      }

      values.push(id);
      const query = `
        UPDATE reroll_sessions
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.asyncGet(query, values);
      return this.parseSession(result);
    } catch (error) {
      console.error(`Error updating reroll session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete session and all associated claims
   * @param {number} id Session ID
   * @returns {Promise<boolean>} Success
   */
  static async delete(id) {
    try {
      // Claims are deleted via CASCADE
      const query = `DELETE FROM reroll_sessions WHERE id = $1`;
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting reroll session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a specific result in the session
   * @param {number} id Session ID
   * @param {string} type 'monster' or 'item'
   * @param {number} index Index in array
   * @param {Object} newData New data for the result
   * @returns {Promise<Object>} Updated session
   */
  static async updateResult(id, type, index, newData) {
    try {
      const session = await this.getById(id);
      if (!session) throw new Error('Session not found');

      const field = type === 'monster' ? 'rolledMonsters' : 'rolledItems';
      const results = session[field] || [];

      if (index < 0 || index >= results.length) {
        throw new Error('Invalid result index');
      }

      results[index] = { ...results[index], ...newData };

      return this.update(id, { [field]: results });
    } catch (error) {
      console.error(`Error updating result in session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a specific result from the session
   * @param {number} id Session ID
   * @param {string} type 'monster' or 'item'
   * @param {number} index Index in array
   * @returns {Promise<Object>} Updated session
   */
  static async deleteResult(id, type, index) {
    try {
      const session = await this.getById(id);
      if (!session) throw new Error('Session not found');

      const field = type === 'monster' ? 'rolledMonsters' : 'rolledItems';
      const results = session[field] || [];

      if (index < 0 || index >= results.length) {
        throw new Error('Invalid result index');
      }

      results.splice(index, 1);

      return this.update(id, { [field]: results });
    } catch (error) {
      console.error(`Error deleting result from session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get claimed indices for a session
   * @param {number} sessionId Session ID
   * @param {string} claimType 'monster' or 'item'
   * @returns {Promise<Array<number>>} Array of claimed indices
   */
  static async getClaimedIndices(sessionId, claimType) {
    try {
      const query = `
        SELECT result_index FROM reroll_claims
        WHERE session_id = $1 AND claim_type = $2
      `;
      const claims = await db.asyncAll(query, [sessionId, claimType]);
      return claims.map(c => c.result_index);
    } catch (error) {
      console.error(`Error getting claimed indices for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if all allowed claims have been made
   * @param {number} sessionId Session ID
   * @returns {Promise<boolean>} True if fully claimed
   */
  static async isFullyClaimed(sessionId) {
    try {
      const session = await this.getById(sessionId);
      if (!session) return false;

      const monsterClaims = await this.getClaimedIndices(sessionId, 'monster');
      const itemClaims = await this.getClaimedIndices(sessionId, 'item');

      const monsterLimit = session.monsterClaimLimit ?? session.rolledMonsters.length;
      const itemLimit = session.itemClaimLimit ?? session.rolledItems.length;

      return monsterClaims.length >= monsterLimit && itemClaims.length >= itemLimit;
    } catch (error) {
      console.error(`Error checking if session ${sessionId} is fully claimed:`, error);
      throw error;
    }
  }

  /**
   * Safely parse JSON - handles both strings and already-parsed objects (PostgreSQL JSONB)
   * @param {*} value Value to parse
   * @param {*} defaultValue Default if null/undefined
   * @returns {*} Parsed value
   */
  static safeJsonParse(value, defaultValue = null) {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object') return value; // Already parsed (JSONB)
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Parse session from database row
   * @param {Object} row Database row
   * @returns {Object} Parsed session
   */
  static parseSession(row) {
    if (!row) return null;

    return {
      id: row.id,
      token: row.token,
      rollType: row.roll_type,
      targetUserId: row.target_user_id,
      targetUsername: row.target_username,
      targetDisplayName: row.target_display_name,
      monsterParams: this.safeJsonParse(row.monster_params, null),
      itemParams: this.safeJsonParse(row.item_params, null),
      giftLevels: row.gift_levels,
      rolledMonsters: this.safeJsonParse(row.rolled_monsters, []),
      rolledItems: this.safeJsonParse(row.rolled_items, []),
      monsterClaimLimit: row.monster_claim_limit,
      itemClaimLimit: row.item_claim_limit,
      createdBy: row.created_by,
      createdByUsername: row.created_by_username,
      createdAt: row.created_at,
      status: row.status,
      notes: row.notes,
      claimCount: row.claim_count || 0
    };
  }

  /**
   * Initialize the reroll_sessions table
   * @returns {Promise<void>}
   */
  static async initTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS reroll_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token VARCHAR(64) NOT NULL UNIQUE,
          roll_type VARCHAR(20) NOT NULL,
          target_user_id INTEGER NOT NULL,
          monster_params TEXT,
          item_params TEXT,
          gift_levels INTEGER DEFAULT 0,
          rolled_monsters TEXT DEFAULT '[]',
          rolled_items TEXT DEFAULT '[]',
          monster_claim_limit INTEGER,
          item_claim_limit INTEGER,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'active',
          notes TEXT,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (target_user_id) REFERENCES users(id)
        )
      `;
      await db.asyncRun(query);
      console.log('reroll_sessions table initialized');
    } catch (error) {
      console.error('Error initializing reroll_sessions table:', error);
      throw error;
    }
  }
}

module.exports = RerollSession;
