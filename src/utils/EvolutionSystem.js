const pool = require('../db');
const Monster = require('../models/Monster');
const MonsterInitializer = require('./MonsterInitializer');

/**
 * Service for handling monster evolution and fusion
 */
class EvolutionSystem {
  /**
   * Evolve a monster
   * @param {number} monsterId - Monster ID
   * @param {Object} evolutionData - Evolution data
   * @returns {Promise<Object>} - Result of evolution
   */
  static async evolveMonster(monsterId, evolutionData = {}) {
    try {
      // Get the monster
      const monster = await Monster.getById(monsterId);

      if (!monster) {
        return {
          success: false,
          message: 'Monster not found'
        };
      }

      // Check if monster meets evolution requirements
      const canEvolve = await this.checkEvolutionRequirements(monster, evolutionData);

      if (!canEvolve.success) {
        return canEvolve;
      }

      // Create evolved monster data
      const evolvedMonsterData = await this.createEvolvedMonsterData(monster, evolutionData);

      // Save evolved monster
      const evolvedMonster = await Monster.update(monsterId, evolvedMonsterData);

      // Record evolution in history
      await this.recordEvolution(monster, evolvedMonster, evolutionData);

      return {
        success: true,
        message: `${monster.name} evolved successfully!`,
        originalMonster: monster,
        evolvedMonster
      };
    } catch (error) {
      console.error('Error evolving monster:', error);
      return {
        success: false,
        message: `Error evolving monster: ${error.message}`
      };
    }
  }

  /**
   * Check if a monster meets evolution requirements
   * @param {Object} monster - Monster data
   * @param {Object} evolutionData - Evolution data
   * @returns {Promise<Object>} - Result of check
   */
  static async checkEvolutionRequirements(monster, evolutionData) {
    try {
      // Check level requirement
      const minLevel = evolutionData.minLevel || 20;

      if (monster.level < minLevel) {
        return {
          success: false,
          message: `Monster must be at least level ${minLevel} to evolve`
        };
      }

      // Check evolution item if required
      if (evolutionData.requireItem) {
        const hasItem = await this.checkEvolutionItem(monster.trainer_id, evolutionData.itemName);

        if (!hasItem.success) {
          return hasItem;
        }
      }

      // Check species compatibility
      if (evolutionData.targetSpecies) {
        const speciesCompatible = this.checkSpeciesCompatibility(monster, evolutionData.targetSpecies);

        if (!speciesCompatible) {
          return {
            success: false,
            message: `This monster cannot evolve into ${evolutionData.targetSpecies}`
          };
        }
      }

      return {
        success: true,
        message: 'Monster meets evolution requirements'
      };
    } catch (error) {
      console.error('Error checking evolution requirements:', error);
      return {
        success: false,
        message: `Error checking evolution requirements: ${error.message}`
      };
    }
  }

  /**
   * Check if trainer has evolution item
   * @param {number} trainerId - Trainer ID
   * @param {string} itemName - Item name
   * @returns {Promise<Object>} - Result of check
   */
  static async checkEvolutionItem(trainerId, itemName) {
    try {
      // Get trainer's inventory
      const inventory = await Trainer.getInventory(trainerId);
      if (!inventory) {
        return {
          success: false,
          message: `Could not retrieve inventory for trainer ${trainerId}`
        };
      }

      // Check if the item exists in any of the inventory categories
      const categories = [
        'inv_items', 'inv_balls', 'inv_berries', 'inv_pastries',
        'inv_evolution', 'inv_eggs', 'inv_antiques', 'inv_helditems', 'inv_seals'
      ];

      // Evolution items are most likely in inv_evolution, but check all categories
      let hasItem = false;
      let itemCategory = null;

      for (const category of categories) {
        if (inventory[category] && inventory[category][itemName] && inventory[category][itemName] > 0) {
          hasItem = true;
          itemCategory = category;
          break;
        }
      }

      if (!hasItem) {
        return {
          success: false,
          message: `You don't have a ${itemName}`
        };
      }

      return {
        success: true,
        message: `You have a ${itemName}`,
        item: {
          name: itemName,
          category: itemCategory,
          quantity: inventory[itemCategory][itemName]
        }
      };
    } catch (error) {
      console.error('Error checking evolution item:', error);
      return {
        success: false,
        message: `Error checking evolution item: ${error.message}`
      };
    }
  }

  /**
   * Check if monster species is compatible with target species
   * @param {Object} monster - Monster data
   * @param {string} targetSpecies - Target species
   * @returns {boolean} - True if compatible, false otherwise
   */
  static checkSpeciesCompatibility(monster, targetSpecies) {
    // Get monster species
    const monsterSpecies = [monster.species1, monster.species2, monster.species3].filter(Boolean);

    // Check if monster has compatible species
    // This is a simplified check - in a real system, you'd have a database of evolution chains
    return monsterSpecies.some(species => {
      // For Pokemon, check evolution chains
      if (species === 'Pokemon') {
        // This would be a lookup in an evolution chain database
        return true;
      }

      // For Digimon, check stage progression
      if (species === 'Digimon') {
        // This would be a lookup in a Digimon stage database
        return true;
      }

      // For Yokai, check rank progression
      if (species === 'Yokai') {
        // This would be a lookup in a Yokai rank database
        return true;
      }

      return false;
    });
  }

  /**
   * Create evolved monster data
   * @param {Object} monster - Original monster data
   * @param {Object} evolutionData - Evolution data
   * @returns {Promise<Object>} - Evolved monster data
   */
  static async createEvolvedMonsterData(monster, evolutionData) {
    // Start with a copy of the original monster
    const evolvedMonster = { ...monster };

    // Update species if provided
    if (evolutionData.targetSpecies) {
      // For simplicity, we're just replacing the first species
      // In a real system, you'd have more complex logic
      evolvedMonster.species1 = evolutionData.targetSpecies;
    }

    // Update types if provided
    if (evolutionData.targetTypes && evolutionData.targetTypes.length > 0) {
      evolvedMonster.type1 = evolutionData.targetTypes[0] || evolvedMonster.type1;
      evolvedMonster.type2 = evolutionData.targetTypes[1] || evolvedMonster.type2;
      evolvedMonster.type3 = evolutionData.targetTypes[2] || evolvedMonster.type3;
    }

    // Update attribute if provided
    if (evolutionData.targetAttribute) {
      evolvedMonster.attribute = evolutionData.targetAttribute;
    }

    // Update stats
    const statBoost = evolutionData.statBoost || 1.2; // 20% stat boost by default

    evolvedMonster.hp_total = Math.floor(evolvedMonster.hp_total * statBoost);
    evolvedMonster.atk_total = Math.floor(evolvedMonster.atk_total * statBoost);
    evolvedMonster.def_total = Math.floor(evolvedMonster.def_total * statBoost);
    evolvedMonster.spa_total = Math.floor(evolvedMonster.spa_total * statBoost);
    evolvedMonster.spd_total = Math.floor(evolvedMonster.spd_total * statBoost);
    evolvedMonster.spe_total = Math.floor(evolvedMonster.spe_total * statBoost);

    // Update moves if needed
    if (evolutionData.updateMoves) {
      // Parse current moveset
      let currentMoves = [];
      try {
        if (evolvedMonster.moveset) {
          currentMoves = JSON.parse(evolvedMonster.moveset);
        }
      } catch (error) {
        console.error(`Error parsing moveset for monster ${evolvedMonster.mon_id}:`, error);
      }

      // Update moveset based on new species/types
      const updatedMoves = await MonsterInitializer.updateMoveset(
        currentMoves,
        evolvedMonster.level,
        {
          species: [evolvedMonster.species1, evolvedMonster.species2, evolvedMonster.species3].filter(Boolean),
          types: [evolvedMonster.type1, evolvedMonster.type2, evolvedMonster.type3].filter(Boolean)
        }
      );

      evolvedMonster.moveset = JSON.stringify(updatedMoves);
    }

    // Update evolution flag
    evolvedMonster.evolved = true;

    return evolvedMonster;
  }

  /**
   * Record evolution in history
   * @param {Object} originalMonster - Original monster data
   * @param {Object} evolvedMonster - Evolved monster data
   * @param {Object} evolutionData - Evolution data
   * @returns {Promise<void>}
   */
  static async recordEvolution(originalMonster, evolvedMonster, evolutionData) {
    try {
      // Instead of using a separate table, we'll store evolution history in the monster's additional_info
      // Get the monster
      const monster = await Monster.getById(evolvedMonster.mon_id);
      if (!monster) {
        console.error(`Monster with ID ${evolvedMonster.mon_id} not found`);
        return;
      }

      // Parse additional_info or initialize as empty object
      let additionalInfo = {};
      try {
        if (monster.additional_info) {
          additionalInfo = typeof monster.additional_info === 'string'
            ? JSON.parse(monster.additional_info)
            : monster.additional_info;
        }
      } catch (e) {
        console.error('Error parsing additional_info:', e);
      }

      // Add evolution history
      if (!additionalInfo.evolution_history) {
        additionalInfo.evolution_history = [];
      }

      additionalInfo.evolution_history.push({
        timestamp: new Date().toISOString(),
        original_species: [originalMonster.species1, originalMonster.species2, originalMonster.species3].filter(Boolean),
        evolved_species: [evolvedMonster.species1, evolvedMonster.species2, evolvedMonster.species3].filter(Boolean),
        original_types: [originalMonster.type1, originalMonster.type2, originalMonster.type3].filter(Boolean),
        evolved_types: [evolvedMonster.type1, evolvedMonster.type2, evolvedMonster.type3].filter(Boolean),
        level: originalMonster.level,
        item_used: evolutionData.itemName || null
      });

      // Update the monster's additional_info
      const updateQuery = `
        UPDATE mons
        SET additional_info = $1
        WHERE mon_id = $2
      `;

      await pool.query(updateQuery, [JSON.stringify(additionalInfo), evolvedMonster.mon_id]);

      // If an item was used, remove it from the trainer's inventory
      if (evolutionData.itemName && evolutionData.requireItem) {
        // First, check which category the item is in
        const itemCheck = await this.checkEvolutionItem(originalMonster.trainer_id, evolutionData.itemName);

        if (itemCheck.success && itemCheck.item.category) {
          // Remove one of the item from the trainer's inventory
          await Trainer.updateInventoryItem(
            originalMonster.trainer_id,
            itemCheck.item.category,
            evolutionData.itemName,
            -1 // Remove 1 item
          );
        }
      }
    } catch (error) {
      console.error('Error recording evolution:', error);
      // Don't throw, just log the error
    }
  }

  /**
   * Fuse two monsters
   * @param {number} monsterIdA - First monster ID
   * @param {number} monsterIdB - Second monster ID
   * @param {Object} fusionData - Fusion data
   * @returns {Promise<Object>} - Result of fusion
   */
  static async fuseMonsters(monsterIdA, monsterIdB, fusionData = {}) {
    try {
      // Get the monsters
      const monsterA = await Monster.getById(monsterIdA);
      const monsterB = await Monster.getById(monsterIdB);

      if (!monsterA || !monsterB) {
        return {
          success: false,
          message: 'One or both monsters not found'
        };
      }

      // Check if monsters can be fused
      const canFuse = await this.checkFusionRequirements(monsterA, monsterB, fusionData);

      if (!canFuse.success) {
        return canFuse;
      }

      // Create fused monster data
      const fusedMonsterData = await this.createFusedMonsterData(monsterA, monsterB, fusionData);

      // Save fused monster (update monster A)
      const fusedMonster = await Monster.update(monsterIdA, fusedMonsterData);

      // Delete monster B
      await Monster.delete(monsterIdB);

      // Record fusion in history
      await this.recordFusion(monsterA, monsterB, fusedMonster, fusionData);

      return {
        success: true,
        message: `${monsterA.name} and ${monsterB.name} were successfully fused into ${fusedMonster.name}!`,
        fusedMonster
      };
    } catch (error) {
      console.error('Error fusing monsters:', error);
      return {
        success: false,
        message: `Error fusing monsters: ${error.message}`
      };
    }
  }

  /**
   * Check if two monsters can be fused
   * @param {Object} monsterA - First monster data
   * @param {Object} monsterB - Second monster data
   * @param {Object} fusionData - Fusion data
   * @returns {Promise<Object>} - Result of check
   */
  static async checkFusionRequirements(monsterA, monsterB, fusionData) {
    try {
      // Check if monsters belong to the same trainer
      if (monsterA.trainer_id !== monsterB.trainer_id) {
        return {
          success: false,
          message: 'Monsters must belong to the same trainer'
        };
      }

      // Check if monsters are the same
      if (monsterA.mon_id === monsterB.mon_id) {
        return {
          success: false,
          message: 'Cannot fuse a monster with itself'
        };
      }

      // Check level requirements
      const minLevel = fusionData.minLevel || 30;

      if (monsterA.level < minLevel || monsterB.level < minLevel) {
        return {
          success: false,
          message: `Both monsters must be at least level ${minLevel} to fuse`
        };
      }

      // Check fusion item if required
      if (fusionData.requireItem) {
        const hasItem = await this.checkEvolutionItem(monsterA.trainer_id, fusionData.itemName);

        if (!hasItem.success) {
          return hasItem;
        }
      }

      // Check species compatibility
      const speciesCompatible = this.checkFusionCompatibility(monsterA, monsterB);

      if (!speciesCompatible) {
        return {
          success: false,
          message: 'These monsters are not compatible for fusion'
        };
      }

      return {
        success: true,
        message: 'Monsters can be fused'
      };
    } catch (error) {
      console.error('Error checking fusion requirements:', error);
      return {
        success: false,
        message: `Error checking fusion requirements: ${error.message}`
      };
    }
  }

  /**
   * Check if two monsters are compatible for fusion
   * @param {Object} monsterA - First monster data
   * @param {Object} monsterB - Second monster data
   * @returns {boolean} - True if compatible, false otherwise
   */
  static checkFusionCompatibility(monsterA, monsterB) {
    // Get monster species
    const speciesA = [monsterA.species1, monsterA.species2, monsterA.species3].filter(Boolean);
    const speciesB = [monsterB.species1, monsterB.species2, monsterB.species3].filter(Boolean);

    // Check if monsters share at least one species
    const sharedSpecies = speciesA.filter(species => speciesB.includes(species));

    return sharedSpecies.length > 0;
  }

  /**
   * Create fused monster data
   * @param {Object} monsterA - First monster data
   * @param {Object} monsterB - Second monster data
   * @param {Object} fusionData - Fusion data
   * @returns {Promise<Object>} - Fused monster data
   */
  static async createFusedMonsterData(monsterA, monsterB, fusionData) {
    // Start with a copy of monster A
    const fusedMonster = { ...monsterA };

    // Set name (if provided, otherwise use monster A's name)
    fusedMonster.name = fusionData.name || monsterA.name;

    // Combine species (up to 3)
    const speciesA = [monsterA.species1, monsterA.species2, monsterA.species3].filter(Boolean);
    const speciesB = [monsterB.species1, monsterB.species2, monsterB.species3].filter(Boolean);

    // Get unique species
    const uniqueSpecies = [...new Set([...speciesA, ...speciesB])];

    // Limit to 3 species
    fusedMonster.species1 = uniqueSpecies[0] || null;
    fusedMonster.species2 = uniqueSpecies[1] || null;
    fusedMonster.species3 = uniqueSpecies[2] || null;

    // Combine types (up to 5)
    const typesA = [monsterA.type1, monsterA.type2, monsterA.type3, monsterA.type4, monsterA.type5].filter(Boolean);
    const typesB = [monsterB.type1, monsterB.type2, monsterB.type3, monsterB.type4, monsterB.type5].filter(Boolean);

    // Get unique types
    const uniqueTypes = [...new Set([...typesA, ...typesB])];

    // Limit to 5 types
    fusedMonster.type1 = uniqueTypes[0] || null;
    fusedMonster.type2 = uniqueTypes[1] || null;
    fusedMonster.type3 = uniqueTypes[2] || null;
    fusedMonster.type4 = uniqueTypes[3] || null;
    fusedMonster.type5 = uniqueTypes[4] || null;

    // Set attribute (prefer monster A's attribute, but use B's if A doesn't have one)
    fusedMonster.attribute = monsterA.attribute || monsterB.attribute || null;

    // Calculate new level (average of both monsters + bonus)
    const levelBonus = fusionData.levelBonus || 5;
    fusedMonster.level = Math.min(100, Math.floor((monsterA.level + monsterB.level) / 2) + levelBonus);

    // Calculate new stats (average of both monsters + bonus)
    const statBonus = fusionData.statBonus || 1.1; // 10% stat bonus by default

    fusedMonster.hp_total = Math.floor(((monsterA.hp_total + monsterB.hp_total) / 2) * statBonus);
    fusedMonster.atk_total = Math.floor(((monsterA.atk_total + monsterB.atk_total) / 2) * statBonus);
    fusedMonster.def_total = Math.floor(((monsterA.def_total + monsterB.def_total) / 2) * statBonus);
    fusedMonster.spa_total = Math.floor(((monsterA.spa_total + monsterB.spa_total) / 2) * statBonus);
    fusedMonster.spd_total = Math.floor(((monsterA.spd_total + monsterB.spd_total) / 2) * statBonus);
    fusedMonster.spe_total = Math.floor(((monsterA.spe_total + monsterB.spe_total) / 2) * statBonus);

    // Combine moves
    let movesA = [];
    let movesB = [];

    try {
      if (monsterA.moveset) {
        movesA = JSON.parse(monsterA.moveset);
      }

      if (monsterB.moveset) {
        movesB = JSON.parse(monsterB.moveset);
      }
    } catch (error) {
      console.error('Error parsing movesets:', error);
    }

    // Combine moves (up to 4)
    const combinedMoves = [...movesA, ...movesB].slice(0, 4);
    fusedMonster.moveset = JSON.stringify(combinedMoves);

    // Update fusion flag
    fusedMonster.fused = true;

    return fusedMonster;
  }

  /**
   * Record fusion in history
   * @param {Object} monsterA - First monster data
   * @param {Object} monsterB - Second monster data
   * @param {Object} fusedMonster - Fused monster data
   * @param {Object} fusionData - Fusion data
   * @returns {Promise<void>}
   */
  static async recordFusion(monsterA, monsterB, fusedMonster, fusionData) {
    try {
      // Instead of using a separate table, we'll store fusion history in the monster's additional_info
      // Get the monster
      const monster = await Monster.getById(fusedMonster.mon_id);
      if (!monster) {
        console.error(`Monster with ID ${fusedMonster.mon_id} not found`);
        return;
      }

      // Parse additional_info or initialize as empty object
      let additionalInfo = {};
      try {
        if (monster.additional_info) {
          additionalInfo = typeof monster.additional_info === 'string'
            ? JSON.parse(monster.additional_info)
            : monster.additional_info;
        }
      } catch (e) {
        console.error('Error parsing additional_info:', e);
      }

      // Add fusion history
      if (!additionalInfo.fusion_history) {
        additionalInfo.fusion_history = [];
      }

      additionalInfo.fusion_history.push({
        timestamp: new Date().toISOString(),
        monster_a_id: monsterA.mon_id,
        monster_b_id: monsterB.mon_id,
        monster_a_species: [monsterA.species1, monsterA.species2, monsterA.species3].filter(Boolean),
        monster_b_species: [monsterB.species1, monsterB.species2, monsterB.species3].filter(Boolean),
        result_species: [fusedMonster.species1, fusedMonster.species2, fusedMonster.species3].filter(Boolean),
        monster_a_level: monsterA.level,
        monster_b_level: monsterB.level,
        result_level: fusedMonster.level,
        item_used: fusionData.itemName || null
      });

      // Update the monster's additional_info
      const updateQuery = `
        UPDATE mons
        SET additional_info = $1
        WHERE mon_id = $2
      `;

      await pool.query(updateQuery, [JSON.stringify(additionalInfo), fusedMonster.mon_id]);

      // If an item was used, remove it from the trainer's inventory
      if (fusionData.itemName && fusionData.requireItem) {
        // First, check which category the item is in
        const itemCheck = await this.checkEvolutionItem(monsterA.trainer_id, fusionData.itemName);

        if (itemCheck.success && itemCheck.item.category) {
          // Remove one of the item from the trainer's inventory
          await Trainer.updateInventoryItem(
            monsterA.trainer_id,
            itemCheck.item.category,
            fusionData.itemName,
            -1 // Remove 1 item
          );
        }
      }
    } catch (error) {
      console.error('Error recording fusion:', error);
      // Don't throw, just log the error
    }
  }
}

module.exports = EvolutionSystem;
