const db = require('../config/db');

/**
 * AntiqueAuction model
 */
class AntiqueAuction {
  /**
   * Get all antique auctions
   * @returns {Promise<Array>} Array of antique auctions
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM antique_auctions ORDER BY item_name ASC';
      const auctions = await db.asyncAll(query);
      return auctions;
    } catch (error) {
      console.error('Error getting antique auctions:', error);
      throw error;
    }
  }

  /**
   * Get antique auctions by item name
   * @param {string} itemName - Item name
   * @returns {Promise<Array>} Array of antique auctions for the item
   */
  static async getByItemName(itemName) {
    try {
      const query = 'SELECT * FROM antique_auctions WHERE item_name = $1';
      const auctions = await db.asyncAll(query, [itemName]);
      return auctions;
    } catch (error) {
      console.error(`Error getting antique auctions for item ${itemName}:`, error);
      throw error;
    }
  }

  /**
   * Get antique auction by ID
   * @param {number} id - Auction ID
   * @returns {Promise<Object|null>} Antique auction or null if not found
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM antique_auctions WHERE id = $1';
      const auction = await db.asyncGet(query, [id]);
      return auction;
    } catch (error) {
      console.error(`Error getting antique auction with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new antique auction
   * @param {Object} auction - Antique auction data
   * @returns {Promise<Object>} Created antique auction
   */
  static async create(auction) {
    try {
      const query = `
        INSERT INTO antique_auctions (
          item_name, species1, species2, species3, 
          type1, type2, type3, type4, type5, attribute
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        auction.item_name,
        auction.species1,
        auction.species2 || null,
        auction.species3 || null,
        auction.type1,
        auction.type2 || null,
        auction.type3 || null,
        auction.type4 || null,
        auction.type5 || null,
        auction.attribute || null
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...auction };
    } catch (error) {
      console.error('Error creating antique auction:', error);
      throw error;
    }
  }

  /**
   * Update an antique auction
   * @param {number} id - Antique auction ID
   * @param {Object} auction - Antique auction data
   * @returns {Promise<Object>} Updated antique auction
   */
  static async update(id, auction) {
    try {
      const query = `
        UPDATE antique_auctions SET
          item_name = $1, species1 = $2, species2 = $3, species3 = $4,
          type1 = $5, type2 = $6, type3 = $7, type4 = $8, type5 = $9, attribute = $10
        WHERE id = $11
      `;

      const params = [
        auction.item_name,
        auction.species1,
        auction.species2 || null,
        auction.species3 || null,
        auction.type1,
        auction.type2 || null,
        auction.type3 || null,
        auction.type4 || null,
        auction.type5 || null,
        auction.attribute || null,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...auction };
    } catch (error) {
      console.error(`Error updating antique auction with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an antique auction
   * @param {number} id - Antique auction ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM antique_auctions WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting antique auction with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Record an auction claim
   * @param {number} auctionId - Auction ID
   * @param {number} trainerId - Trainer ID
   * @param {number} monsterId - Monster ID
   * @returns {Promise<Object>} Created claim record
   */
  static async recordAuctionClaim(auctionId, trainerId, monsterId) {
    try {
      // Table existence check removed for PostgreSQL compatibility
      // Assuming table exists through proper migrations

      // Record the claim
      const query = `
        INSERT INTO antique_auction_claims (auction_id, trainer_id, monster_id)
        VALUES ($1, $2, $3)
      `;

      const result = await db.asyncRun(query, [auctionId, trainerId, monsterId]);
      return {
        id: result.lastID,
        auction_id: auctionId,
        trainer_id: trainerId,
        monster_id: monsterId,
        claimed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error recording auction claim for auction ${auctionId}, trainer ${trainerId}, monster ${monsterId}:`, error);
      throw error;
    }
  }
}

module.exports = AntiqueAuction;
