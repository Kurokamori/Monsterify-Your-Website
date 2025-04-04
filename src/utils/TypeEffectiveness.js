const pool = require('../db');

/**
 * Utility class for type effectiveness calculations
 */
class TypeEffectiveness {
  /**
   * Get the effectiveness multiplier for an attack
   * @param {string} attackingType - Type of the attack
   * @param {Array<string>} defendingTypes - Types of the defending monster
   * @returns {Promise<number>} - Effectiveness multiplier
   */
  static async getTypeEffectiveness(attackingType, defendingTypes) {
    try {
      // Filter out null or undefined types
      const validDefendingTypes = defendingTypes.filter(type => type);
      
      if (validDefendingTypes.length === 0) {
        return 1.0; // Default effectiveness if no defending types
      }
      
      // Get effectiveness for each defending type
      const query = 'SELECT defending_type, effectiveness FROM type_effectiveness WHERE attacking_type = $1 AND defending_type = ANY($2)';
      const result = await pool.query(query, [attackingType, validDefendingTypes]);
      
      if (result.rows.length === 0) {
        return 1.0; // Default effectiveness if no matches found
      }
      
      // Calculate combined effectiveness (multiply all effectiveness values)
      let combinedEffectiveness = 1.0;
      
      for (const row of result.rows) {
        combinedEffectiveness *= parseFloat(row.effectiveness);
      }
      
      return combinedEffectiveness;
    } catch (error) {
      console.error(`Error getting type effectiveness for ${attackingType} against ${defendingTypes}:`, error);
      return 1.0; // Default to normal effectiveness on error
    }
  }

  /**
   * Get the effectiveness multiplier for an attribute attack
   * @param {string} attackingAttribute - Attribute of the attack
   * @param {string} defendingAttribute - Attribute of the defending monster
   * @returns {Promise<number>} - Effectiveness multiplier
   */
  static async getAttributeEffectiveness(attackingAttribute, defendingAttribute) {
    try {
      if (!attackingAttribute || !defendingAttribute) {
        return 1.0; // Default effectiveness if either attribute is missing
      }
      
      const query = 'SELECT effectiveness FROM attribute_effectiveness WHERE attacking_attribute = $1 AND defending_attribute = $2';
      const result = await pool.query(query, [attackingAttribute, defendingAttribute]);
      
      if (result.rows.length === 0) {
        return 1.0; // Default effectiveness if no match found
      }
      
      return parseFloat(result.rows[0].effectiveness);
    } catch (error) {
      console.error(`Error getting attribute effectiveness for ${attackingAttribute} against ${defendingAttribute}:`, error);
      return 1.0; // Default to normal effectiveness on error
    }
  }

  /**
   * Calculate damage multiplier based on types and attributes
   * @param {Object} attacker - Attacking monster
   * @param {Object} defender - Defending monster
   * @returns {Promise<number>} - Damage multiplier
   */
  static async calculateDamageMultiplier(attacker, defender) {
    try {
      // Get attacker's types
      const attackerTypes = [
        attacker.type1,
        attacker.type2,
        attacker.type3,
        attacker.type4,
        attacker.type5
      ].filter(type => type);
      
      // Get defender's types
      const defenderTypes = [
        defender.type1,
        defender.type2,
        defender.type3,
        defender.type4,
        defender.type5
      ].filter(type => type);
      
      // Calculate type effectiveness for each attacking type
      let typeMultiplier = 1.0;
      
      for (const attackType of attackerTypes) {
        const effectiveness = await this.getTypeEffectiveness(attackType, defenderTypes);
        typeMultiplier = Math.max(typeMultiplier, effectiveness);
      }
      
      // Calculate attribute effectiveness
      const attributeMultiplier = await this.getAttributeEffectiveness(
        attacker.attribute,
        defender.attribute
      );
      
      // Combine multipliers
      return typeMultiplier * attributeMultiplier;
    } catch (error) {
      console.error('Error calculating damage multiplier:', error);
      return 1.0; // Default to normal damage on error
    }
  }

  /**
   * Get effectiveness description
   * @param {number} multiplier - Effectiveness multiplier
   * @returns {string} - Description of effectiveness
   */
  static getEffectivenessDescription(multiplier) {
    if (multiplier === 0) {
      return "It has no effect...";
    } else if (multiplier < 0.5) {
      return "It's extremely ineffective!";
    } else if (multiplier < 1) {
      return "It's not very effective...";
    } else if (multiplier > 2) {
      return "It's super duper effective!";
    } else if (multiplier > 1) {
      return "It's super effective!";
    } else {
      return ""; // Normal effectiveness, no special message
    }
  }
}

module.exports = TypeEffectiveness;
