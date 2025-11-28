const db = require('../config/db');
const { buildLimit } = require('../utils/dbUtils');

class FactionStanding {
  /**
   * Get trainer's standing with all factions
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} Array of faction standings
   */
  static async getTrainerStandings(trainerId) {
    try {
      const query = `
        SELECT fs.*, f.name as faction_name, f.color as faction_color,
               ft.name as current_title_name, ft.description as current_title_description
        FROM faction_standings fs
        JOIN factions f ON fs.faction_id = f.id
        LEFT JOIN faction_titles ft ON fs.current_title_id = ft.id
        WHERE fs.trainer_id = $1
        ORDER BY f.name
      `;
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error('Error getting trainer standings:', error);
      throw error;
    }
  }

  /**
   * Get trainer's standing with a specific faction
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @returns {Promise<Object|null>} Faction standing or null if not found
   */
  static async getTrainerFactionStanding(trainerId, factionId) {
    try {
      const query = `
        SELECT fs.*, f.name as faction_name, f.color as faction_color,
               ft.name as current_title_name, ft.description as current_title_description
        FROM faction_standings fs
        JOIN factions f ON fs.faction_id = f.id
        LEFT JOIN faction_titles ft ON fs.current_title_id = ft.id
        WHERE fs.trainer_id = $1 AND fs.faction_id = $2
      `;
      return await db.asyncGet(query, [trainerId, factionId]);
    } catch (error) {
      console.error('Error getting trainer faction standing:', error);
      throw error;
    }
  }

  /**
   * Initialize standings for a trainer (create 0 standing with all factions)
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<void>}
   */
  static async initializeTrainerStandings(trainerId) {
    try {
      // Get all factions
      const factions = await db.asyncAll('SELECT id FROM factions');
      
      for (const faction of factions) {
        // Check if standing already exists
        const existing = await db.asyncGet(
          'SELECT id FROM faction_standings WHERE trainer_id = $1 AND faction_id = $2',
          [trainerId, faction.id]
        );
        
        if (!existing) {
          await db.asyncRun(
            `INSERT INTO faction_standings (trainer_id, faction_id, standing)
             VALUES ($1, $2, $3)`,
            [trainerId, faction.id, 0]
          );
        }
      }
    } catch (error) {
      console.error('Error initializing trainer standings:', error);
      throw error;
    }
  }

  /**
   * Update trainer's standing with a faction
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @param {number} standingChange - Amount to change standing by
   * @returns {Promise<Object>} Updated standing
   */
  static async updateStanding(trainerId, factionId, standingChange) {
    try {
      // Get current standing or create if doesn't exist
      let currentStanding = await this.getTrainerFactionStanding(trainerId, factionId);
      
      if (!currentStanding) {
        // Create new standing record
        await db.asyncRun(
          `INSERT INTO faction_standings (trainer_id, faction_id, standing)
           VALUES ($1, $2, $3)`,
          [trainerId, factionId, standingChange]
        );
      } else {
        // Update existing standing
        const newStanding = Math.max(-1000, Math.min(1000, currentStanding.standing + standingChange));
        await db.asyncRun(
          `UPDATE faction_standings 
           SET standing = $1, updated_at = CURRENT_TIMESTAMP
           WHERE trainer_id = $2 AND faction_id = $3`,
          [newStanding, trainerId, factionId]
        );
      }

      // Update title based on new standing
      await this.updateTitle(trainerId, factionId);

      // Apply relationship effects to other factions
      await this.applyRelationshipEffects(trainerId, factionId, standingChange);

      return await this.getTrainerFactionStanding(trainerId, factionId);
    } catch (error) {
      console.error('Error updating standing:', error);
      throw error;
    }
  }

  /**
   * Update trainer's title based on current standing
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @returns {Promise<void>}
   */
  static async updateTitle(trainerId, factionId) {
    try {
      const standing = await this.getTrainerFactionStanding(trainerId, factionId);
      if (!standing) return;

      // Get all available titles for this faction, ordered by standing requirement
      const query = `
        SELECT * FROM faction_titles 
        WHERE faction_id = $1 AND standing_requirement <= $2
        ORDER BY standing_requirement DESC`;
      
      const availableTitles = await db.asyncAll(query, [factionId, standing.standing]);
      
      // Check for tribute requirements at caps (200, 400, 600, 800)
      const tributeCaps = [200, 400, 600, 800];
      let highestEligibleTitle = null;
      
      for (const title of availableTitles) {
        const isCapTitle = tributeCaps.includes(title.standing_requirement);
        
        if (isCapTitle) {
          // Check if trainer has submitted a tribute for this title
          const tributeQuery = `
            SELECT * FROM faction_tributes 
            WHERE trainer_id = $1 AND title_id = $2 AND status = 'approved'`;
          const tribute = await db.asyncGet(tributeQuery, [trainerId, title.id]);
          
          if (tribute) {
            // Tribute approved, can have this title
            highestEligibleTitle = title;
            break;
          }
          // No approved tribute, cannot progress beyond this point
        } else {
          // Non-cap title, can be awarded automatically
          highestEligibleTitle = title;
          break;
        }
      }
      
      if (highestEligibleTitle && (!standing.current_title_id || standing.current_title_id !== highestEligibleTitle.id)) {
        await db.asyncRun(
          `UPDATE faction_standings 
           SET current_title_id = $1, updated_at = CURRENT_TIMESTAMP
           WHERE trainer_id = $2 AND faction_id = $3`,
          [highestEligibleTitle.id, trainerId, factionId]
        );
      }
    } catch (error) {
      console.error('Error updating title:', error);
      throw error;
    }
  }

  /**
   * Apply relationship effects to other factions when standing changes
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction that had standing changed
   * @param {number} standingChange - Amount of standing change
   * @returns {Promise<void>}
   */
  static async applyRelationshipEffects(trainerId, factionId, standingChange) {
    try {
      // Get all relationships for this faction
      const relationships = await db.asyncAll(
        `SELECT related_faction_id, standing_modifier 
         FROM faction_relationships 
         WHERE faction_id = $1`,
        [factionId]
      );

      for (const relationship of relationships) {
        const effectAmount = Math.round(standingChange * relationship.standing_modifier);
        
        if (effectAmount !== 0) {
          // Get current standing for the related faction
          let relatedStanding = await this.getTrainerFactionStanding(trainerId, relationship.related_faction_id);
          
          if (!relatedStanding) {
            // Create new standing record
            const newStanding = Math.max(-1000, Math.min(1000, effectAmount));
            await db.asyncRun(
              `INSERT INTO faction_standings (trainer_id, faction_id, standing)
               VALUES ($1, $2, $3)`,
              [trainerId, relationship.related_faction_id, newStanding]
            );
          } else {
            // Update existing standing
            const newStanding = Math.max(-1000, Math.min(1000, relatedStanding.standing + effectAmount));
            await db.asyncRun(
              `UPDATE faction_standings 
               SET standing = $1, updated_at = CURRENT_TIMESTAMP
               WHERE trainer_id = $2 AND faction_id = $3`,
              [newStanding, trainerId, relationship.related_faction_id]
            );
          }

          // Update title for the affected faction
          await this.updateTitle(trainerId, relationship.related_faction_id);
        }
      }
    } catch (error) {
      console.error('Error applying relationship effects:', error);
      throw error;
    }
  }

  /**
   * Get available titles for a trainer with a faction
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of available titles
   */
  static async getAvailableTitles(trainerId, factionId) {
    try {
      const standing = await this.getTrainerFactionStanding(trainerId, factionId);
      if (!standing) return [];

      const query = `
        SELECT ft.*, 
               CASE WHEN ft.standing_requirement <= $1 THEN 1 ELSE 0 END as is_available,
               CASE WHEN ft.id = $2 THEN 1 ELSE 0 END as is_current
        FROM faction_titles ft
        WHERE ft.faction_id = $3
        ORDER BY ft.standing_requirement ASC
      `;
      
      const titles = await db.asyncAll(query, [standing.standing, standing.current_title_id, factionId]);
      
      // Check tribute requirements for cap titles
      const tributeCaps = [200, 400, 600, 800];
      
      for (const title of titles) {
        title.requires_tribute = tributeCaps.includes(title.standing_requirement);
        
        if (title.requires_tribute) {
          // Check if tribute has been submitted/approved
          const tributeQuery = `
            SELECT status FROM faction_tributes 
            WHERE trainer_id = $1 AND title_id = $2 
            ORDER BY submitted_at DESC LIMIT 1`;
          const tribute = await db.asyncGet(tributeQuery, [trainerId, title.id]);
          
          title.tribute_status = tribute ? tribute.status : null;
          title.can_advance = tribute && tribute.status === 'approved';
        } else {
          title.can_advance = title.is_available;
        }
      }
      
      return titles;
    } catch (error) {
      console.error('Error getting available titles:', error);
      throw error;
    }
  }

  /**
   * Get tribute requirements for next title
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @returns {Promise<Object|null>} Tribute requirement info
   */
  static async getTributeRequirement(trainerId, factionId) {
    try {
      const standing = await this.getTrainerFactionStanding(trainerId, factionId);
      if (!standing) return null;

      const titles = await this.getAvailableTitles(trainerId, factionId);
      
      // Find the next title that requires a tribute and meets standing requirement
      const nextTributeTitle = titles.find(title => 
        title.requires_tribute && 
        title.standing_requirement <= standing.standing &&
        !title.can_advance &&
        !title.is_current
      );
      
      if (!nextTributeTitle) return null;

      // Get tribute requirements based on faction and title
      const requirements = await this.getTributeRequirements(factionId, nextTributeTitle.id);
      
      return {
        title: nextTributeTitle,
        requirements,
        current_standing: standing.standing
      };
    } catch (error) {
      console.error('Error getting tribute requirement:', error);
      throw error;
    }
  }

  /**
   * Get tribute requirements for a specific faction and title
   * @param {number} factionId - Faction ID
   * @param {number} titleId - Title ID
   * @returns {Promise<Object>} Tribute requirements
   */
  static async getTributeRequirements(factionId, titleId) {
    try {
      // Default tribute requirements by faction and standing requirement
      const faction = await db.asyncGet('SELECT name FROM factions WHERE id = $1', [factionId]);
      const title = await db.asyncGet('SELECT * FROM faction_titles WHERE id = $1', [titleId]);
      
      if (!faction || !title) return null;

      // Define tribute requirements by faction and standing level
      const tributeRequirements = {
        // Cat Pirates
        1: {
          200: { item: 'Treasure Map', currency: 500, prompt: 'Show your crew embarking on a treasure hunting expedition, facing the perils of the sea in search of legendary pirate gold.' },
          400: { item: 'Pirate Cutlass', currency: 1000, prompt: 'Depict an epic naval battle between your crew and rival pirates, with cannons blazing and swords clashing on the high seas.' },
          600: { item: 'Captain\'s Compass', currency: 1500, prompt: 'Illustrate your crew discovering a mysterious island with ancient ruins, uncovering secrets that could change the fate of all pirates.' },
          800: { item: 'Kraken\'s Tooth', currency: 2000, prompt: 'Create an epic tale of your crew facing the legendary Kraken itself, showing the ultimate test of pirate courage and skill.' }
        },
        // Digital Dawn
        2: {
          200: { item: 'Data Crystal', currency: 500, prompt: 'Showcase your trainer conducting groundbreaking research into digital monster technology, pushing the boundaries of what\'s possible.' },
          400: { item: 'Quantum Processor', currency: 1000, prompt: 'Demonstrate the development of revolutionary digital monster systems that could transform how we interact with these creatures.' },
          600: { item: 'Neural Interface', currency: 1500, prompt: 'Explore the deep connection between trainer and digital monster, showing the fusion of consciousness and technology.' },
          800: { item: 'Singularity Core', currency: 2000, prompt: 'Envision the ultimate evolution of digital monsters, where the line between reality and virtual worlds completely disappears.' }
        },
        // Pokemon Ranchers
        3: {
          200: { item: 'Ranch Deed', currency: 500, prompt: 'Show your trainer managing a thriving Pokemon ranch, caring for various species and creating a harmony between wild and domestic life.' },
          400: { item: 'Master Ball', currency: 1000, prompt: 'Depict your involvement in an advanced breeding program, showing the careful nurturing of rare Pokemon bloodlines.' },
          600: { item: 'Life Orb', currency: 1500, prompt: 'Illustrate your dedication to rehabilitating injured or abandoned Pokemon, showing the healing power of compassionate care.' },
          800: { item: 'Sacred Seeds', currency: 2000, prompt: 'Create a vision of the perfect Pokemon ecosystem, where all species coexist in perfect balance under your stewardship.' }
        },
        // Professor Koa's Lab
        4: {
          200: { item: 'Research Notes', currency: 500, prompt: 'Document a significant scientific breakthrough in monster research, showing your contribution to expanding our understanding.' },
          400: { item: 'Lab Equipment', currency: 1000, prompt: 'Demonstrate your role in conducting crucial experiments that advance the field of monster biology and behavior.' },
          600: { item: 'Specimen Vial', currency: 1500, prompt: 'Show your fieldwork collecting rare data and specimens that contribute to groundbreaking discoveries.' },
          800: { item: 'Professor\'s Seal', currency: 2000, prompt: 'Present your ultimate research achievement - a discovery that revolutionizes our understanding of monster-trainer bonds.' }
        },
        // Project Obsidian
        5: {
          200: { item: 'Shadow Cloak', currency: 500, prompt: 'Undertake a covert mission in the shadows, showing your dedication to the mysterious goals of Project Obsidian.' },
          400: { item: 'Encrypted Data', currency: 1000, prompt: 'Execute a complex intelligence operation, gathering crucial information while maintaining absolute secrecy.' },
          600: { item: 'Obsidian Fragment', currency: 1500, prompt: 'Complete a high-stakes stealth mission that tests your loyalty and skill in the art of shadow operations.' },
          800: { item: 'Master\'s Brand', currency: 2000, prompt: 'Achieve the ultimate shadow mission - one that could change the balance of power among all factions.' }
        },
        // The Spirit Keepers
        6: {
          200: { item: 'Spirit Charm', currency: 500, prompt: 'Establish communication with spirit monsters, showing your growing understanding of the ethereal realm.' },
          400: { item: 'Sacred Incense', currency: 1000, prompt: 'Participate in an ancient ritual ceremony, demonstrating your respect for spiritual traditions and mysteries.' },
          600: { item: 'Guardian Stone', currency: 1500, prompt: 'Take on the sacred duty of protecting ancient sites, showing your commitment to preserving spiritual heritage.' },
          800: { item: 'Soul Crystal', currency: 2000, prompt: 'Achieve perfect harmony with the spirit world, becoming a bridge between the physical and ethereal realms.' }
        },
        // The Tribes
        7: {
          200: { item: 'Tribal Token', currency: 500, prompt: 'Complete a quest for tribal communities, showing your respect for traditional ways and cultural heritage.' },
          400: { item: 'Cultural Artifact', currency: 1000, prompt: 'Participate in sacred cultural exchanges, bridging the gap between modern and traditional ways of life.' },
          600: { item: 'Elder\'s Staff', currency: 1500, prompt: 'Lead resource gathering efforts that sustain tribal communities while respecting the natural balance.' },
          800: { item: 'Ancestral Blessing', currency: 2000, prompt: 'Earn the ultimate honor from the tribes - becoming a recognized bridge between worlds and protector of ancient wisdom.' }
        },
        // The Twilight Order
        8: {
          200: { item: 'Twilight Shard', currency: 500, prompt: 'Embrace the power of twilight magic, showing your initiation into the mysteries of shadow and light.' },
          400: { item: 'Dark Grimoire', currency: 1000, prompt: 'Investigate mysterious phenomena that blur the line between light and darkness, revealing hidden truths.' },
          600: { item: 'Night\'s Embrace', currency: 1500, prompt: 'Master the art of night missions, using darkness as your ally in achieving the Order\'s mysterious goals.' },
          800: { item: 'Order\'s Crown', currency: 2000, prompt: 'Achieve mastery over the twilight realm, becoming one with the eternal balance between light and shadow.' }
        }
      };

      const factionRequirements = tributeRequirements[factionId];
      if (!factionRequirements) return null;

      const requirement = factionRequirements[title.standing_requirement];
      if (!requirement) return null;

      return {
        faction_name: faction.name,
        title_name: title.name,
        standing_requirement: title.standing_requirement,
        item_requirement: requirement.item,
        currency_requirement: requirement.currency,
        prompt: requirement.prompt
      };
    } catch (error) {
      console.error('Error getting tribute requirements:', error);
      throw error;
    }
  }
}

module.exports = FactionStanding;
