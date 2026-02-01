const db = require('../config/db');

/**
 * RerollClaim model for tracking player claims from reroll sessions
 */
class RerollClaim {
  /**
   * Create a new claim
   * @param {Object} data Claim data
   * @returns {Promise<Object>} Created claim
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO reroll_claims (
          session_id, user_id, trainer_id, claim_type, result_index,
          claimed_data, monster_name, item_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        data.sessionId,
        data.userId,
        data.trainerId,
        data.claimType,
        data.resultIndex,
        data.claimedData ? JSON.stringify(data.claimedData) : null,
        data.monsterName || null,
        data.itemQuantity || 1
      ];

      const result = await db.asyncGet(query, values);
      return this.parseClaim(result);
    } catch (error) {
      console.error('Error creating reroll claim:', error);
      throw error;
    }
  }

  /**
   * Get claims by session ID
   * @param {number} sessionId Session ID
   * @returns {Promise<Array>} Array of claims
   */
  static async getBySession(sessionId) {
    try {
      const query = `
        SELECT rc.*,
               u.username AS user_username,
               u.display_name AS user_display_name,
               t.name AS trainer_name
        FROM reroll_claims rc
        LEFT JOIN users u ON rc.user_id = u.id
        LEFT JOIN trainers t ON rc.trainer_id = t.id
        WHERE rc.session_id = $1
        ORDER BY rc.claimed_at
      `;
      const claims = await db.asyncAll(query, [sessionId]);
      return claims.map(c => this.parseClaim(c));
    } catch (error) {
      console.error(`Error getting claims for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get claims by session and user
   * @param {number} sessionId Session ID
   * @param {number} userId User ID
   * @returns {Promise<Array>} Array of claims
   */
  static async getBySessionAndUser(sessionId, userId) {
    try {
      const query = `
        SELECT rc.*,
               t.name AS trainer_name
        FROM reroll_claims rc
        LEFT JOIN trainers t ON rc.trainer_id = t.id
        WHERE rc.session_id = $1 AND rc.user_id = $2
        ORDER BY rc.claimed_at
      `;
      const claims = await db.asyncAll(query, [sessionId, userId]);
      return claims.map(c => this.parseClaim(c));
    } catch (error) {
      console.error(`Error getting claims for session ${sessionId} user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Count claims by type for a session
   * @param {number} sessionId Session ID
   * @param {string} claimType 'monster' or 'item'
   * @returns {Promise<number>} Claim count
   */
  static async countByType(sessionId, claimType) {
    try {
      const query = `
        SELECT COUNT(*) AS count FROM reroll_claims
        WHERE session_id = $1 AND claim_type = $2
      `;
      const result = await db.asyncGet(query, [sessionId, claimType]);
      return result?.count || 0;
    } catch (error) {
      console.error(`Error counting claims for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a specific index is already claimed
   * @param {number} sessionId Session ID
   * @param {string} claimType 'monster' or 'item'
   * @param {number} index Result index
   * @returns {Promise<boolean>} True if claimed
   */
  static async isIndexClaimed(sessionId, claimType, index) {
    try {
      const query = `
        SELECT id FROM reroll_claims
        WHERE session_id = $1 AND claim_type = $2 AND result_index = $3
      `;
      const result = await db.asyncGet(query, [sessionId, claimType, index]);
      return !!result;
    } catch (error) {
      console.error(`Error checking if index is claimed:`, error);
      throw error;
    }
  }

  /**
   * Get user's claim count for a session by type
   * @param {number} sessionId Session ID
   * @param {number} userId User ID
   * @param {string} claimType 'monster' or 'item'
   * @returns {Promise<number>} Claim count
   */
  static async getUserClaimCount(sessionId, userId, claimType) {
    try {
      const query = `
        SELECT COUNT(*) AS count FROM reroll_claims
        WHERE session_id = $1 AND user_id = $2 AND claim_type = $3
      `;
      const result = await db.asyncGet(query, [sessionId, userId, claimType]);
      return result?.count || 0;
    } catch (error) {
      console.error(`Error getting user claim count:`, error);
      throw error;
    }
  }

  /**
   * Check if user can claim more of a specific type
   * @param {number} sessionId Session ID
   * @param {number} userId User ID
   * @param {string} claimType 'monster' or 'item'
   * @param {number|null} limit Claim limit (null = unlimited)
   * @returns {Promise<boolean>} True if user can claim
   */
  static async canUserClaim(sessionId, userId, claimType, limit) {
    try {
      if (limit === null) return true;

      const currentCount = await this.getUserClaimCount(sessionId, userId, claimType);
      return currentCount < limit;
    } catch (error) {
      console.error(`Error checking if user can claim:`, error);
      throw error;
    }
  }

  /**
   * Get remaining claims for user
   * @param {number} sessionId Session ID
   * @param {number} userId User ID
   * @param {number|null} monsterLimit Monster claim limit
   * @param {number|null} itemLimit Item claim limit
   * @returns {Promise<Object>} Remaining claims
   */
  static async getRemainingClaims(sessionId, userId, monsterLimit, itemLimit) {
    try {
      const monsterClaims = await this.getUserClaimCount(sessionId, userId, 'monster');
      const itemClaims = await this.getUserClaimCount(sessionId, userId, 'item');

      return {
        monstersRemaining: monsterLimit === null ? 'unlimited' : Math.max(0, monsterLimit - monsterClaims),
        itemsRemaining: itemLimit === null ? 'unlimited' : Math.max(0, itemLimit - itemClaims),
        monstersClaimed: monsterClaims,
        itemsClaimed: itemClaims
      };
    } catch (error) {
      console.error(`Error getting remaining claims:`, error);
      throw error;
    }
  }

  /**
   * Delete claim by ID
   * @param {number} id Claim ID
   * @returns {Promise<boolean>} Success
   */
  static async delete(id) {
    try {
      const query = `DELETE FROM reroll_claims WHERE id = $1`;
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting claim ${id}:`, error);
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
   * Parse claim from database row
   * @param {Object} row Database row
   * @returns {Object} Parsed claim
   */
  static parseClaim(row) {
    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      userUsername: row.user_username,
      userDisplayName: row.user_display_name,
      trainerId: row.trainer_id,
      trainerName: row.trainer_name,
      claimType: row.claim_type,
      resultIndex: row.result_index,
      claimedData: this.safeJsonParse(row.claimed_data, null),
      monsterName: row.monster_name,
      itemQuantity: row.item_quantity,
      claimedAt: row.claimed_at
    };
  }

  /**
   * Initialize the reroll_claims table
   * @returns {Promise<void>}
   */
  static async initTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS reroll_claims (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          trainer_id INTEGER NOT NULL,
          claim_type VARCHAR(20) NOT NULL,
          result_index INTEGER NOT NULL,
          claimed_data TEXT,
          monster_name VARCHAR(255),
          item_quantity INTEGER DEFAULT 1,
          claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES reroll_sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (trainer_id) REFERENCES trainers(id)
        )
      `;
      await db.asyncRun(query);

      // Create index for faster lookups
      await db.asyncRun(`
        CREATE INDEX IF NOT EXISTS idx_reroll_claims_session
        ON reroll_claims(session_id, claim_type, result_index)
      `);

      console.log('reroll_claims table initialized');
    } catch (error) {
      console.error('Error initializing reroll_claims table:', error);
      throw error;
    }
  }
}

module.exports = RerollClaim;
