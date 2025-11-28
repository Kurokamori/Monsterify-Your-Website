const db = require('../config/db');

class FactionTribute {
  /**
   * Get all tributes for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} Array of tributes
   */
  static async getTrainerTributes(trainerId) {
    try {
      const query = `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               f.name as faction_name, f.color as faction_color
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        WHERE ft.trainer_id = $1
        ORDER BY ft.submitted_at DESC
      `;
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error('Error getting trainer tributes:', error);
      throw error;
    }
  }

  /**
   * Get tributes for a specific faction and trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of tributes
   */
  static async getTrainerFactionTributes(trainerId, factionId) {
    try {
      const query = `
        SELECT ft.*, fti.name as title_name, fti.description as title_description
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        WHERE ft.trainer_id = $1 AND fti.faction_id = $2
        ORDER BY ft.submitted_at DESC
      `;
      return await db.asyncAll(query, [trainerId, factionId]);
    } catch (error) {
      console.error('Error getting trainer faction tributes:', error);
      throw error;
    }
  }

  /**
   * Get tribute by ID
   * @param {number} tributeId - Tribute ID
   * @returns {Promise<Object|null>} Tribute object or null if not found
   */
  static async getById(tributeId) {
    try {
      const query = `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               f.name as faction_name, f.color as faction_color,
               t.name as trainer_name
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        JOIN trainers t ON ft.trainer_id = t.id
        WHERE ft.id = $1
      `;
      return await db.asyncGet(query, [tributeId]);
    } catch (error) {
      console.error('Error getting tribute by ID:', error);
      throw error;
    }
  }

  /**
   * Submit a tribute for a title
   * @param {Object} tributeData - Tribute data
   * @returns {Promise<Object>} Created tribute
   */
  static async submitTribute(tributeData) {
    try {
      const {
        title_id,
        trainer_id,
        submission_id, // ID of existing submission to use
        submission_type,
        submission_url,
        submission_description,
        item_requirement,
        currency_requirement = 0
      } = tributeData;

      // Validate submission type
      if (!['art', 'writing'].includes(submission_type)) {
        throw new Error('Invalid submission type. Must be "art" or "writing".');
      }

      // If using existing submission, validate it and check for reuse
      if (submission_id) {
        // Check if submission exists and belongs to trainer
        const existingSubmission = await db.asyncGet(
          'SELECT * FROM submissions WHERE id = $1 AND trainer_id = $2',
          [submission_id, trainer_id]
        );
        
        if (!existingSubmission) {
          throw new Error('Submission not found or does not belong to this trainer');
        }

        // Check if submission has already been used for faction submission or tribute
        const alreadyUsedForFaction = await db.asyncGet(
          'SELECT id FROM faction_submissions WHERE submission_id = $1',
          [submission_id]
        );
        
        const alreadyUsedForTribute = await db.asyncGet(
          'SELECT id FROM faction_tributes WHERE submission_id = $1',
          [submission_id]
        );

        if (alreadyUsedForFaction || alreadyUsedForTribute) {
          throw new Error('This submission has already been used for faction standing or tribute');
        }
      }

      // Check if trainer has sufficient currency if required
      if (currency_requirement > 0) {
        const trainer = await db.asyncGet('SELECT currency_amount FROM trainers WHERE id = $1', [trainer_id]);
        if (!trainer || trainer.currency_amount < currency_requirement) {
          throw new Error('Insufficient currency for tribute');
        }
      }

      // Check if trainer has required item if specified
      if (item_requirement) {
        const hasItem = await this.checkTrainerHasItem(trainer_id, item_requirement);
        if (!hasItem) {
          throw new Error(`Required item not found: ${item_requirement}`);
        }
      }

      // Create the tribute
      const query = `
        INSERT INTO faction_tributes 
        (title_id, trainer_id, submission_id, submission_type, submission_url, submission_description, 
         item_requirement, currency_requirement, status, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
        RETURNING id
      `;

      const result = await db.asyncRun(query, [
        title_id, trainer_id, submission_id, submission_type, submission_url, submission_description,
        item_requirement, currency_requirement
      ]);

      // Get the inserted ID (PostgreSQL returns it differently)
      let tributeId;
      if (result.rows && result.rows[0]) {
        tributeId = result.rows[0].id;
      } else {
        tributeId = result.lastID;
      }

      // Deduct currency if required
      if (currency_requirement > 0) {
        await db.asyncRun(
          'UPDATE trainers SET currency_amount = currency_amount - $1 WHERE id = $2',
          [currency_requirement, trainer_id]
        );
      }

      // Remove item if required
      if (item_requirement) {
        await this.removeItemFromInventory(trainer_id, item_requirement);
      }

      return await this.getById(tributeId);
    } catch (error) {
      console.error('Error submitting tribute:', error);
      throw error;
    }
  }

  /**
   * Review a tribute (approve or reject)
   * @param {number} tributeId - Tribute ID
   * @param {string} status - 'approved' or 'rejected'
   * @param {number} reviewerId - Reviewer user ID
   * @returns {Promise<Object>} Updated tribute
   */
  static async reviewTribute(tributeId, status, reviewerId) {
    try {
      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status. Must be "approved" or "rejected".');
      }

      const tribute = await this.getById(tributeId);
      if (!tribute) {
        throw new Error('Tribute not found');
      }

      if (tribute.status !== 'pending') {
        throw new Error('Tribute has already been reviewed');
      }

      // Update tribute status
      await db.asyncRun(
        `UPDATE faction_tributes 
         SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
         WHERE id = $3`,
        [status, reviewerId, tributeId]
      );

      // If approved, award the title and standing
      if (status === 'approved') {
        await this.awardTitle(tribute);
      }

      return await this.getById(tributeId);
    } catch (error) {
      console.error('Error reviewing tribute:', error);
      throw error;
    }
  }

  /**
   * Award title to trainer after successful tribute
   * @param {Object} tribute - Tribute object
   * @returns {Promise<void>}
   */
  static async awardTitle(tribute) {
    try {
      // Get title details
      const title = await db.asyncGet('SELECT * FROM faction_titles WHERE id = $1', [tribute.title_id]);
      if (!title) {
        throw new Error('Title not found');
      }

      // Update trainer's standing to meet title requirement if needed
      const FactionStanding = require('./FactionStanding');
      const currentStanding = await FactionStanding.getTrainerFactionStanding(tribute.trainer_id, title.faction_id);
      
      if (!currentStanding || currentStanding.standing < title.standing_requirement) {
        const standingIncrease = title.standing_requirement - (currentStanding ? currentStanding.standing : 0);
        await FactionStanding.updateStanding(tribute.trainer_id, title.faction_id, standingIncrease);
      }

      // Update the trainer's current title
      await db.asyncRun(
        `UPDATE faction_standings 
         SET current_title_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE trainer_id = $2 AND faction_id = $3`,
        [tribute.title_id, tribute.trainer_id, title.faction_id]
      );

      // Award tribute reward item
      await this.awardTributeReward(tribute.trainer_id, title.faction_id, title.standing_requirement);
    } catch (error) {
      console.error('Error awarding title:', error);
      throw error;
    }
  }

  /**
   * Award tribute reward item to trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @param {number} standingRequirement - Standing requirement level
   * @returns {Promise<void>}
   */
  static async awardTributeReward(trainerId, factionId, standingRequirement) {
    try {
      // Define reward items by faction and standing level
      const tributeRewards = {
        // Cat Pirates
        1: {
          200: 'Pirate Badge',
          400: 'Navigator\'s Sextant',
          600: 'First Mate\'s Spyglass',
          800: 'Captain\'s Medallion'
        },
        // Digital Dawn
        2: {
          200: 'Digital Interface',
          400: 'Advanced Scanner',
          600: 'Neural Headset',
          800: 'Quantum Stabilizer'
        },
        // Pokemon Ranchers
        3: {
          200: 'Ranch Certificate',
          400: 'Breeding License',
          600: 'Caretaker\'s Badge',
          800: 'Master Rancher\'s Crown'
        },
        // Professor Koa's Lab
        4: {
          200: 'Research Badge',
          400: 'Lab Assistant Pass',
          600: 'Field Researcher Kit',
          800: 'Professor\'s Endorsement'
        },
        // Project Obsidian
        5: {
          200: 'Shadow Insignia',
          400: 'Operative\'s Badge',
          600: 'Agent\'s Seal',
          800: 'Master\'s Sigil'
        },
        // The Spirit Keepers
        6: {
          200: 'Spirit Badge',
          400: 'Guardian\'s Amulet',
          600: 'Keeper\'s Staff',
          800: 'Spiritual Crown'
        },
        // The Tribes
        7: {
          200: 'Tribal Badge',
          400: 'Cultural Medallion',
          600: 'Elder\'s Token',
          800: 'Ancestral Crown'
        },
        // The Twilight Order
        8: {
          200: 'Twilight Badge',
          400: 'Shadow Amulet',
          600: 'Night\'s Seal',
          800: 'Order\'s Regalia'
        }
      };

      const factionRewards = tributeRewards[factionId];
      if (!factionRewards) return;

      const rewardItem = factionRewards[standingRequirement];
      if (!rewardItem) return;

      // Add item to trainer's inventory
      await this.addItemToInventory(trainerId, rewardItem, 1);
    } catch (error) {
      console.error('Error awarding tribute reward:', error);
      throw error;
    }
  }

  /**
   * Add item to trainer's inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} itemName - Item name
   * @param {number} quantity - Quantity to add
   * @returns {Promise<void>}
   */
  static async addItemToInventory(trainerId, itemName, quantity = 1) {
    try {
      // Get trainer's inventory
      let inventory = await db.asyncGet('SELECT * FROM trainer_inventory WHERE trainer_id = $1', [trainerId]);
      
      if (!inventory) {
        // Create inventory if it doesn't exist
        await db.asyncRun(
          'INSERT INTO trainer_inventory (trainer_id, items) VALUES ($1, $2)',
          [trainerId, JSON.stringify({})]
        );
        inventory = { items: '{}' };
      }

      // Add to keyitems category (assuming tribute rewards are key items)
      let keyItems = {};
      if (inventory.keyitems) {
        try {
          keyItems = JSON.parse(inventory.keyitems);
        } catch (e) {
          keyItems = {};
        }
      }

      keyItems[itemName] = (keyItems[itemName] || 0) + quantity;

      // Update inventory
      await db.asyncRun(
        'UPDATE trainer_inventory SET keyitems = $1, updated_at = CURRENT_TIMESTAMP WHERE trainer_id = $2',
        [JSON.stringify(keyItems), trainerId]
      );
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  /**
   * Check if trainer has a specific item
   * @param {number} trainerId - Trainer ID
   * @param {string} itemName - Item name
   * @returns {Promise<boolean>} Whether trainer has the item
   */
  static async checkTrainerHasItem(trainerId, itemName) {
    try {
      const inventory = await db.asyncGet('SELECT * FROM trainer_inventory WHERE trainer_id = $1', [trainerId]);
      if (!inventory) return false;

      // Check all inventory categories
      const categories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];
      
      for (const category of categories) {
        if (inventory[category]) {
          try {
            const categoryItems = JSON.parse(inventory[category]);
            if (categoryItems[itemName] && categoryItems[itemName] > 0) {
              return true;
            }
          } catch (e) {
            // Continue checking other categories
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking trainer item:', error);
      return false;
    }
  }

  /**
   * Remove item from trainer's inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} itemName - Item name
   * @returns {Promise<void>}
   */
  static async removeItemFromInventory(trainerId, itemName) {
    try {
      const inventory = await db.asyncGet('SELECT * FROM trainer_inventory WHERE trainer_id = $1', [trainerId]);
      if (!inventory) return;

      const categories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];
      
      for (const category of categories) {
        if (inventory[category]) {
          try {
            const categoryItems = JSON.parse(inventory[category]);
            if (categoryItems[itemName] && categoryItems[itemName] > 0) {
              categoryItems[itemName] -= 1;
              if (categoryItems[itemName] <= 0) {
                delete categoryItems[itemName];
              }

              await db.asyncRun(
                `UPDATE trainer_inventory 
                 SET ${category} = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE trainer_id = $2`,
                [JSON.stringify(categoryItems), trainerId]
              );
              return;
            }
          } catch (e) {
            // Continue checking other categories
          }
        }
      }
    } catch (error) {
      console.error('Error removing item from inventory:', error);
      throw error;
    }
  }

  /**
   * Get all pending tributes (for admin review)
   * @returns {Promise<Array>} Array of pending tributes
   */
  static async getPendingTributes() {
    try {
      const query = `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               f.name as faction_name, f.color as faction_color,
               t.name as trainer_name
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        JOIN trainers t ON ft.trainer_id = t.id
        WHERE ft.status = 'pending'
        ORDER BY ft.submitted_at ASC
      `;
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting pending tributes:', error);
      throw error;
    }
  }
}

module.exports = FactionTribute;
