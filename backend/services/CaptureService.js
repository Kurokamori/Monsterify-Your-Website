const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const MonsterInitializer = require('../utils/MonsterInitializer');
const AdventureEncounter = require('../models/AdventureEncounter');

class CaptureService {
  /**
   * Attempt to capture a monster from a wild encounter
   * @param {Object} captureData - Capture attempt data
   * @returns {Promise<Object>} Capture result
   */
  async attemptCapture(captureData) {
    try {
      const {
        encounterId,
        discordUserId,
        trainerName,
        pokeballType,
        pokepuffCount = 0,
        monsterIndex = 1,
        isBattleCapture = false
      } = captureData;

      // Get encounter data
      const encounter = await AdventureEncounter.getById(encounterId);
      if (!encounter || (encounter.encounter_type !== 'wild' && !(encounter.encounter_type === 'battle' && isBattleCapture))) {
        throw new Error('Invalid encounter for capture');
      }

      // Find trainer by name (case-insensitive)
      const trainer = await this.findTrainerByName(trainerName, discordUserId);
      if (!trainer) {
        throw new Error(`Trainer "${trainerName}" not found or not accessible`);
      }

      // Validate pokeball inventory
      const hasValidPokeball = await this.validatePokeballInventory(trainer.id, pokeballType);
      if (!hasValidPokeball) {
        throw new Error(`Trainer "${trainerName}" doesn't have any ${pokeballType}s`);
      }

      // Validate pokepuff inventory if used
      if (pokepuffCount > 0) {
        const hasValidPokepuffs = await this.validatePokepuffInventory(trainer.id, pokepuffCount);
        if (!hasValidPokepuffs) {
          throw new Error(`Trainer "${trainerName}" doesn't have ${pokepuffCount} Pokepuff(s)`);
        }
      }

      // Select monster to capture from encounter
      const monsterToCapture = await this.selectMonsterFromEncounter(encounter, discordUserId, monsterIndex);
      if (!monsterToCapture) {
        throw new Error('No monsters available for capture in this encounter');
      }

      // Calculate capture chance
      const captureChance = this.calculateCaptureChance(pokeballType, pokepuffCount, monsterToCapture, isBattleCapture);

      // Attempt capture
      const captureSuccess = Math.random() < captureChance;

      // Consume items regardless of success
      await this.consumeItems(trainer.id, pokeballType, pokepuffCount);

      let capturedMonster = null;
      if (captureSuccess) {
        // Initialize and create monster
        capturedMonster = await this.initializeAndCreateMonster(monsterToCapture, trainer.id);
        
        // Update encounter to mark this monster as captured
        await this.markMonsterCaptured(encounter, monsterToCapture, discordUserId);
      }

      return {
        success: captureSuccess,
        monster: capturedMonster,
        trainer: trainer,
        pokeball_used: pokeballType,
        pokepuffs_used: pokepuffCount,
        capture_chance: Math.round(captureChance * 100)
      };

    } catch (error) {
      console.error('Error in capture attempt:', error);
      throw error;
    }
  }

  /**
   * Find trainer by name for a Discord user
   * @param {string} trainerName - Trainer name
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} Trainer or null
   */
  async findTrainerByName(trainerName, discordUserId) {
    try {
      // First, verify the user exists
      const userLink = await this.getLinkedUser(discordUserId);
      if (!userLink) {
        throw new Error('Discord account not linked to website account');
      }

      // Get trainers for this Discord user (trainers.player_user_id stores Discord ID)
      const trainers = await Trainer.getByUserId(discordUserId);

      // Find trainer by name (case-insensitive)
      const trainer = trainers.find(t =>
        t.name.toLowerCase() === trainerName.toLowerCase()
      );

      return trainer || null;

    } catch (error) {
      console.error('Error finding trainer by name:', error);
      throw error;
    }
  }

  /**
   * Get linked user from Discord user ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getLinkedUser(discordUserId) {
    try {
      const db = require('../config/db');

      const query = `
        SELECT id, username, display_name, discord_id
        FROM users
        WHERE discord_id = $1
      `;

      const user = await db.asyncGet(query, [discordUserId]);

      if (user) {
        return {
          user_id: user.id,
          username: user.username,
          display_name: user.display_name,
          discord_user_id: user.discord_id
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting linked user:', error);
      return null;
    }
  }

  /**
   * Validate pokeball inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} pokeballType - Pokeball type
   * @returns {Promise<boolean>} Has valid pokeball
   */
  async validatePokeballInventory(trainerId, pokeballType) {
    try {
      const inventory = await Trainer.getInventory(trainerId);
      if (!inventory || !inventory.balls) {
        return false;
      }

      const balls = typeof inventory.balls === 'string' ? 
        JSON.parse(inventory.balls) : inventory.balls;

      return (balls[pokeballType] || 0) > 0;

    } catch (error) {
      console.error('Error validating pokeball inventory:', error);
      return false;
    }
  }

  /**
   * Validate pokepuff inventory
   * @param {number} trainerId - Trainer ID
   * @param {number} pokepuffCount - Number of pokepuffs needed
   * @returns {Promise<boolean>} Has valid pokepuffs
   */
  async validatePokepuffInventory(trainerId, pokepuffCount) {
    try {
      const inventory = await Trainer.getInventory(trainerId);
      if (!inventory || !inventory.items) {
        return false;
      }

      const items = typeof inventory.items === 'string' ? 
        JSON.parse(inventory.items) : inventory.items;

      return (items['Pokepuff'] || 0) >= pokepuffCount;

    } catch (error) {
      console.error('Error validating pokepuff inventory:', error);
      return false;
    }
  }

  /**
   * Select monster to capture from encounter
   * @param {Object} encounter - Encounter data
   * @param {string} discordUserId - Discord user ID
   * @param {number} monsterIndex - 1-based index of monster to capture
   * @returns {Promise<Object|null>} Monster to capture or null
   */
  async selectMonsterFromEncounter(encounter, discordUserId, monsterIndex = 1) {
    try {
      const encounterData = encounter.encounter_data;

      // Build a flat list of all available monsters with their display order
      const availableMonsters = [];

      for (const group of encounterData.groups) {
        if (group.available > 0) {
          // Check how many this user has already captured from this group
          const userCaptures = group.captured?.filter(c => c.discord_user_id === discordUserId) || [];
          const remainingForUser = group.count - userCaptures.length;

          // Add each remaining monster to the available list
          for (let i = 0; i < remainingForUser; i++) {
            availableMonsters.push({
              species1: group.species1,
              species2: group.species2,
              species3: group.species3,
              type1: group.type1,
              type2: group.type2,
              type3: group.type3,
              type4: group.type4,
              type5: group.type5,
              attribute: group.attribute,
              level: Math.floor(Math.random() * 10) + 5, // Random level 5-15
              groupIndex: encounterData.groups.indexOf(group),
              displayIndex: availableMonsters.length + 1 // 1-based display index
            });
          }
        }
      }

      // If no monsters available
      if (availableMonsters.length === 0) {
        return null;
      }

      // If requested index is out of range, default to first available
      const targetIndex = Math.max(1, Math.min(monsterIndex, availableMonsters.length));

      // Return the monster at the requested index (convert to 0-based)
      return availableMonsters[targetIndex - 1];

    } catch (error) {
      console.error('Error selecting monster from encounter:', error);
      return null;
    }
  }

  /**
   * Calculate capture chance
   * @param {string} pokeballType - Pokeball type
   * @param {number} pokepuffCount - Number of pokepuffs used
   * @param {Object} monster - Monster data
   * @param {boolean} isBattleCapture - Whether this is a capture during battle
   * @returns {number} Capture chance (0-1)
   */
  calculateCaptureChance(pokeballType, pokepuffCount, monster, isBattleCapture = false) {
    // Base capture rates for different pokeball types
    const pokeballRates = {
      'Poke Ball': 0.5,
      'Great Ball': 0.65,
      'Ultra Ball': 0.8,
      'Master Ball': 1.0,
      'Premier Ball': 0.5,
      'Luxury Ball': 0.5,
      'Timer Ball': 0.6,
      'Repeat Ball': 0.7,
      'Net Ball': 0.6,
      'Dive Ball': 0.6
    };

    let baseRate = pokeballRates[pokeballType] || 0.5;
    
    // Pokepuff bonus (25% per pokepuff)
    const pokepuffBonus = pokepuffCount * 0.25;
    
    // Level penalty (higher level = harder to catch)
    const levelPenalty = Math.max(0, (monster.level - 10) * 0.02);

    // Battle capture bonus (monsters with reduced health are easier to catch)
    let battleBonus = 0;
    if (isBattleCapture) {
      // Simulate health-based capture rate like Pokemon
      // Assume monsters in battle have reduced health (30-70% remaining)
      const healthPercentage = Math.random() * 0.4 + 0.3; // 30-70% health
      battleBonus = (1 - healthPercentage) * 0.5; // Up to 35% bonus at low health

      console.log(`Battle capture: health ${(healthPercentage * 100).toFixed(1)}%, bonus ${(battleBonus * 100).toFixed(1)}%`);
    }

    // Calculate final chance
    const finalChance = Math.min(0.95, Math.max(0.05, baseRate + pokepuffBonus - levelPenalty + battleBonus));

    return finalChance;
  }

  /**
   * Consume items from trainer inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} pokeballType - Pokeball type
   * @param {number} pokepuffCount - Number of pokepuffs
   * @returns {Promise<void>}
   */
  async consumeItems(trainerId, pokeballType, pokepuffCount) {
    try {
      // Consume pokeball (subtract 1)
      await Trainer.updateInventoryItem(trainerId, 'balls', pokeballType, -1);

      // Consume pokepuffs if any were used
      if (pokepuffCount > 0) {
        await Trainer.updateInventoryItem(trainerId, 'items', 'Pokepuff', -pokepuffCount);
      }

    } catch (error) {
      console.error('Error consuming items:', error);
      throw error;
    }
  }

  /**
   * Initialize and create captured monster
   * @param {Object} monsterData - Monster data
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} Created monster
   */
  async initializeAndCreateMonster(monsterData, trainerId) {
    try {
      // Prepare monster data for initialization
      const monsterToCreate = {
        trainer_id: trainerId,
        name: monsterData.species1 || 'Unknown',
        species1: monsterData.species1,
        species2: monsterData.species2,
        species3: monsterData.species3,
        type1: monsterData.type1,
        type2: monsterData.type2,
        type3: monsterData.type3,
        type4: monsterData.type4,
        type5: monsterData.type5,
        attribute: monsterData.attribute,
        level: monsterData.level,
        where_met: 'Adventure Capture'
      };

      // Use MonsterInitializer to fully initialize the monster
      const initializedData = await MonsterInitializer.initializeMonster(monsterToCreate);

      // Create the monster in the database
      const createdMonster = await Monster.create(initializedData);

      return createdMonster;

    } catch (error) {
      console.error('Error initializing and creating monster:', error);
      throw error;
    }
  }

  /**
   * Mark monster as captured in encounter
   * @param {Object} encounter - Encounter data
   * @param {Object} monster - Monster data
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<void>}
   */
  async markMonsterCaptured(encounter, monster, discordUserId) {
    try {
      const encounterData = encounter.encounter_data;
      const groupIndex = monster.groupIndex;
      
      if (encounterData.groups[groupIndex]) {
        // Add capture record
        if (!encounterData.groups[groupIndex].captured) {
          encounterData.groups[groupIndex].captured = [];
        }
        
        encounterData.groups[groupIndex].captured.push({
          discord_user_id: discordUserId,
          captured_at: new Date().toISOString()
        });

        // Decrease available count
        encounterData.groups[groupIndex].available = Math.max(0, 
          encounterData.groups[groupIndex].available - 1
        );

        // Update encounter
        await AdventureEncounter.update(encounter.id, {
          encounter_data: encounterData
        });
      }

    } catch (error) {
      console.error('Error marking monster as captured:', error);
      throw error;
    }
  }
}

module.exports = new CaptureService();
