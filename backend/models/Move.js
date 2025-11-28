const db = require('../config/db');

/**
 * Move model for managing move data and validation
 */
class Move {
  /**
   * Get all moves
   * @returns {Promise<Array>} Array of moves
   */
  static async getAll() {
    try {
      const query = `
        SELECT
          "MoveName" as move_name,
          "Type" as move_type,
          "Attribute" as attribute,
          "Power" as power,
          "Accuracy" as accuracy,
          "PP" as pp,
          "Priority" as priority,
          "Effect" as description,
          "EffectChance" as effect_chance,
          "Target" as target,
          "MoveType" as move_category,
          "LearnLevel" as learn_level
        FROM moves
        ORDER BY "MoveName"
      `;
      
      const moves = await db.asyncAll(query);
      return moves;
    } catch (error) {
      console.error('Error getting all moves:', error);
      throw error;
    }
  }

  /**
   * Get move by name
   * @param {string} moveName - Move name
   * @returns {Promise<Object|null>} Move data or null
   */
  static async getByName(moveName) {
    try {
      const query = `
        SELECT
          "MoveName" as move_name,
          "Type" as move_type,
          "Attribute" as attribute,
          "Power" as power,
          "Accuracy" as accuracy,
          "PP" as pp,
          "Priority" as priority,
          "Effect" as description,
          "EffectChance" as effect_chance,
          "Target" as target,
          "MoveType" as move_category,
          "LearnLevel" as learn_level
        FROM moves
        WHERE LOWER("MoveName") = LOWER($1)
      `;
      
      const move = await db.asyncGet(query, [moveName]);
      return move || null;
    } catch (error) {
      console.error(`Error getting move ${moveName}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple moves by names
   * @param {Array<string>} moveNames - Array of move names
   * @returns {Promise<Array>} Array of move data
   */
  static async getByNames(moveNames) {
    try {
      if (!Array.isArray(moveNames) || moveNames.length === 0) {
        return [];
      }

      const placeholders = moveNames.map((_, index) => `$${index + 1}`).join(',');
      const query = `
        SELECT
          "MoveName" as move_name,
          "Type" as move_type,
          "Attribute" as attribute,
          "Power" as power,
          "Accuracy" as accuracy,
          "PP" as pp,
          "Priority" as priority,
          "Effect" as description,
          "EffectChance" as effect_chance,
          "Target" as target,
          "MoveType" as move_category,
          "LearnLevel" as learn_level
        FROM moves
        WHERE "MoveName" IN (${placeholders})
        ORDER BY "MoveName"
      `;
      
      const moves = await db.asyncAll(query, moveNames);
      return moves;
    } catch (error) {
      console.error('Error getting moves by names:', error);
      throw error;
    }
  }

  /**
   * Get moves by type
   * @param {string} moveType - Move type
   * @returns {Promise<Array>} Array of moves
   */
  static async getByType(moveType) {
    try {
      const query = `
        SELECT
          "MoveName" as move_name,
          "Type" as move_type,
          "Attribute" as attribute,
          "Power" as power,
          "Accuracy" as accuracy,
          "PP" as pp,
          "Priority" as priority,
          "Effect" as description,
          "EffectChance" as effect_chance,
          "Target" as target,
          "MoveType" as move_category,
          "LearnLevel" as learn_level
        FROM moves
        WHERE "Type" = $1
        ORDER BY "MoveName"
      `;
      
      const moves = await db.asyncAll(query, [moveType]);
      return moves;
    } catch (error) {
      console.error(`Error getting moves by type ${moveType}:`, error);
      throw error;
    }
  }

  /**
   * Get moves by attribute
   * @param {string} attribute - Move attribute
   * @returns {Promise<Array>} Array of moves
   */
  static async getByAttribute(attribute) {
    try {
      const query = `
        SELECT
          "MoveName" as move_name,
          "Type" as move_type,
          "Attribute" as attribute,
          "Power" as power,
          "Accuracy" as accuracy,
          "PP" as pp,
          "Priority" as priority,
          "Effect" as description,
          "EffectChance" as effect_chance,
          "Target" as target,
          "MoveType" as move_category,
          "LearnLevel" as learn_level
        FROM moves
        WHERE "Attribute" = $1
        ORDER BY "MoveName"
      `;
      
      const moves = await db.asyncAll(query, [attribute]);
      return moves;
    } catch (error) {
      console.error(`Error getting moves by attribute ${attribute}:`, error);
      throw error;
    }
  }

  /**
   * Validate if a monster can use a specific move
   * @param {number} monsterId - Monster ID
   * @param {string} moveName - Move name
   * @returns {Promise<boolean>} Whether the monster can use the move
   */
  static async validateMonsterMove(monsterId, moveName) {
    try {
      const Monster = require('./Monster');
      const monster = await Monster.getById(monsterId);
      
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Parse monster's moveset
      let moveset = [];
      try {
        if (monster.moveset) {
          moveset = JSON.parse(monster.moveset);
        }
      } catch (e) {
        console.error(`Error parsing moveset for monster ${monsterId}:`, e);
        return false;
      }

      // Check if move is in monster's moveset
      return Array.isArray(moveset) && moveset.includes(moveName);
    } catch (error) {
      console.error(`Error validating move ${moveName} for monster ${monsterId}:`, error);
      return false;
    }
  }

  /**
   * Get valid moves for a monster
   * @param {number} monsterId - Monster ID
   * @returns {Promise<Array>} Array of valid moves for the monster
   */
  static async getMonsterMoves(monsterId) {
    try {
      const Monster = require('./Monster');
      const monster = await Monster.getById(monsterId);
      
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Parse monster's moveset
      let moveset = [];
      try {
        if (monster.moveset) {
          moveset = JSON.parse(monster.moveset);
        }
      } catch (e) {
        console.error(`Error parsing moveset for monster ${monsterId}:`, e);
        return [];
      }

      if (!Array.isArray(moveset) || moveset.length === 0) {
        return [];
      }

      // Get move details
      return await this.getByNames(moveset);
    } catch (error) {
      console.error(`Error getting moves for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate move effectiveness based on types
   * @param {string} moveType - Move type
   * @param {Array<string>} targetTypes - Target monster types
   * @returns {number} Effectiveness multiplier
   */
  static calculateTypeEffectiveness(moveType, targetTypes) {
    // Type effectiveness chart (simplified)
    const typeChart = {
      'Normal': { 'Rock': 0.5, 'Ghost': 0, 'Steel': 0.5 },
      'Fire': { 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 2, 'Bug': 2, 'Rock': 0.5, 'Dragon': 0.5, 'Steel': 2 },
      'Water': { 'Fire': 2, 'Water': 0.5, 'Grass': 0.5, 'Ground': 2, 'Rock': 2, 'Dragon': 0.5 },
      'Electric': { 'Water': 2, 'Electric': 0.5, 'Grass': 0.5, 'Ground': 0, 'Flying': 2, 'Dragon': 0.5 },
      'Grass': { 'Fire': 0.5, 'Water': 2, 'Grass': 0.5, 'Poison': 0.5, 'Ground': 2, 'Flying': 0.5, 'Bug': 0.5, 'Rock': 2, 'Dragon': 0.5, 'Steel': 0.5 },
      'Ice': { 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 0.5, 'Ground': 2, 'Flying': 2, 'Dragon': 2, 'Steel': 0.5 },
      'Fighting': { 'Normal': 2, 'Ice': 2, 'Poison': 0.5, 'Flying': 0.5, 'Psychic': 0.5, 'Bug': 0.5, 'Rock': 2, 'Ghost': 0, 'Dark': 2, 'Steel': 2, 'Fairy': 0.5 },
      'Poison': { 'Grass': 2, 'Poison': 0.5, 'Ground': 0.5, 'Rock': 0.5, 'Ghost': 0.5, 'Steel': 0, 'Fairy': 2 },
      'Ground': { 'Fire': 2, 'Electric': 2, 'Grass': 0.5, 'Poison': 2, 'Flying': 0, 'Bug': 0.5, 'Rock': 2, 'Steel': 2 },
      'Flying': { 'Electric': 0.5, 'Grass': 2, 'Ice': 0.5, 'Fighting': 2, 'Bug': 2, 'Rock': 0.5, 'Steel': 0.5 },
      'Psychic': { 'Fighting': 2, 'Poison': 2, 'Psychic': 0.5, 'Dark': 0, 'Steel': 0.5 },
      'Bug': { 'Fire': 0.5, 'Grass': 2, 'Fighting': 0.5, 'Poison': 0.5, 'Flying': 0.5, 'Psychic': 2, 'Ghost': 0.5, 'Dark': 2, 'Steel': 0.5, 'Fairy': 0.5 },
      'Rock': { 'Fire': 2, 'Ice': 2, 'Fighting': 0.5, 'Ground': 0.5, 'Flying': 2, 'Bug': 2, 'Steel': 0.5 },
      'Ghost': { 'Normal': 0, 'Psychic': 2, 'Ghost': 2, 'Dark': 0.5 },
      'Dragon': { 'Dragon': 2, 'Steel': 0.5, 'Fairy': 0 },
      'Dark': { 'Fighting': 0.5, 'Psychic': 2, 'Ghost': 2, 'Dark': 0.5, 'Fairy': 0.5 },
      'Steel': { 'Fire': 0.5, 'Water': 0.5, 'Electric': 0.5, 'Ice': 2, 'Rock': 2, 'Steel': 0.5, 'Fairy': 2 },
      'Fairy': { 'Fire': 0.5, 'Fighting': 2, 'Poison': 0.5, 'Dragon': 2, 'Dark': 2, 'Steel': 0.5 }
    };

    let effectiveness = 1.0;
    
    if (typeChart[moveType]) {
      for (const targetType of targetTypes) {
        if (targetType && typeChart[moveType][targetType] !== undefined) {
          effectiveness *= typeChart[moveType][targetType];
        }
      }
    }

    return effectiveness;
  }
}

module.exports = Move;
