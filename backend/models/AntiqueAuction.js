const db = require('../config/db');

/**
 * AntiqueAuction model
 *
 * Table columns:
 * - id: Primary key
 * - name: Name of the special monster
 * - antique: Which antique this monster is accessible through
 * - image: URL of the monster image
 * - species1-3: Monster species (1-3)
 * - type1-5: Monster types (1-5)
 * - attribute: Monster attribute
 * - description: Optional flavor text
 * - family: Optional family grouping for evolution lines
 * - creator: Name of the artist who created this monster
 */
class AntiqueAuction {
  /**
   * Get all antique auctions
   * @returns {Promise<Array>} Array of antique auctions
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM antique_auctions ORDER BY antique ASC, name ASC';
      const auctions = await db.asyncAll(query);
      return auctions;
    } catch (error) {
      console.error('Error getting antique auctions:', error);
      throw error;
    }
  }

  /**
   * Get all antique auctions for the catalogue with filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Catalogue data with auctions and metadata
   */
  static async getCatalogue(filters = {}) {
    try {
      const { antique, species, type, creator, search, page = 1, limit = 20 } = filters;

      let query = 'SELECT * FROM antique_auctions WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Filter by antique (antique)
      if (antique) {
        query += ` AND antique = $${paramIndex}`;
        params.push(antique);
        paramIndex++;
      }

      // Filter by species (search across all 3 species columns)
      if (species) {
        query += ` AND (LOWER(species1) LIKE $${paramIndex} OR LOWER(species2) LIKE $${paramIndex} OR LOWER(species3) LIKE $${paramIndex})`;
        params.push(`%${species.toLowerCase()}%`);
        paramIndex++;
      }

      // Filter by type (search across all 5 type columns)
      if (type) {
        query += ` AND (LOWER(type1) = $${paramIndex} OR LOWER(type2) = $${paramIndex} OR LOWER(type3) = $${paramIndex} OR LOWER(type4) = $${paramIndex} OR LOWER(type5) = $${paramIndex})`;
        params.push(type.toLowerCase());
        paramIndex++;
      }

      // Filter by creator
      if (creator) {
        query += ` AND LOWER(creator) LIKE $${paramIndex}`;
        params.push(`%${creator.toLowerCase()}%`);
        paramIndex++;
      }

      // General search (name, species, creator)
      if (search) {
        query += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(species1) LIKE $${paramIndex} OR LOWER(species2) LIKE $${paramIndex} OR LOWER(species3) LIKE $${paramIndex} OR LOWER(creator) LIKE $${paramIndex})`;
        params.push(`%${search.toLowerCase()}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = await db.asyncGet(countQuery, params);
      const total = countResult?.total || 0;

      // Add ordering and pagination
      query += ' ORDER BY antique ASC, name ASC';
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const auctions = await db.asyncAll(query, params);

      return {
        auctions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting catalogue:', error);
      throw error;
    }
  }

  /**
   * Get all unique antiques (antiques) with their holiday category
   * @returns {Promise<Array>} Array of unique antiques with categories
   */
  static async getUniqueAntiques() {
    try {
      const query = 'SELECT DISTINCT antique FROM antique_auctions ORDER BY antique ASC';
      const antiques = await db.asyncAll(query);
      return antiques.map(a => a.antique);
    } catch (error) {
      console.error('Error getting unique antiques:', error);
      throw error;
    }
  }

  /**
   * Get all unique creators
   * @returns {Promise<Array>} Array of unique creator names
   */
  static async getUniqueCreators() {
    try {
      const query = 'SELECT DISTINCT creator FROM antique_auctions WHERE creator IS NOT NULL AND creator != \'\' ORDER BY creator ASC';
      const creators = await db.asyncAll(query);
      return creators.map(c => c.creator);
    } catch (error) {
      console.error('Error getting unique creators:', error);
      throw error;
    }
  }

  /**
   * Get all unique types used across all type columns
   * @returns {Promise<Array>} Array of unique types
   */
  static async getUniqueTypes() {
    try {
      const query = `
        SELECT DISTINCT type_val FROM (
          SELECT type1 as type_val FROM antique_auctions WHERE type1 IS NOT NULL AND type1 != ''
          UNION
          SELECT type2 FROM antique_auctions WHERE type2 IS NOT NULL AND type2 != ''
          UNION
          SELECT type3 FROM antique_auctions WHERE type3 IS NOT NULL AND type3 != ''
          UNION
          SELECT type4 FROM antique_auctions WHERE type4 IS NOT NULL AND type4 != ''
          UNION
          SELECT type5 FROM antique_auctions WHERE type5 IS NOT NULL AND type5 != ''
        ) types ORDER BY type_val ASC
      `;
      const types = await db.asyncAll(query);
      return types.map(t => t.type_val);
    } catch (error) {
      console.error('Error getting unique types:', error);
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
      const query = 'SELECT * FROM antique_auctions WHERE antique = $1';
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
          name, antique, image, species1, species2, species3,
          type1, type2, type3, type4, type5, attribute,
          description, family, creator
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      const params = [
        auction.name || auction.species1,
        auction.antique,
        auction.image || null,
        auction.species1,
        auction.species2 || null,
        auction.species3 || null,
        auction.type1,
        auction.type2 || null,
        auction.type3 || null,
        auction.type4 || null,
        auction.type5 || null,
        auction.attribute || null,
        auction.description || null,
        auction.family || null,
        auction.creator || null
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
          name = $1, antique = $2, image = $3, species1 = $4, species2 = $5, species3 = $6,
          type1 = $7, type2 = $8, type3 = $9, type4 = $10, type5 = $11, attribute = $12,
          description = $13, family = $14, creator = $15
        WHERE id = $16
      `;

      const params = [
        auction.name || auction.species1,
        auction.antique,
        auction.image || null,
        auction.species1,
        auction.species2 || null,
        auction.species3 || null,
        auction.type1,
        auction.type2 || null,
        auction.type3 || null,
        auction.type4 || null,
        auction.type5 || null,
        auction.attribute || null,
        auction.description || null,
        auction.family || null,
        auction.creator || null,
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
