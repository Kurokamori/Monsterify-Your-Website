const Move = require('../models/Move');

/**
 * DamageCalculator service for calculating battle damage and effects
 */
class DamageCalculator {
  constructor() {
    // Damage calculation constants
    this.LEVEL_FACTOR = 2;
    this.BASE_DAMAGE = 50;
    this.CRITICAL_CHANCE = 0.0625; // 1/16 chance
    this.CRITICAL_MULTIPLIER = 1.5;
    this.STAB_MULTIPLIER = 1.5; // Same Type Attack Bonus
    this.RANDOM_FACTOR_MIN = 0.85;
    this.RANDOM_FACTOR_MAX = 1.0;
  }

  /**
   * Calculate damage for an attack
   * @param {Object} attacker - Attacking monster data
   * @param {Object} defender - Defending monster data
   * @param {Object} move - Move data
   * @param {Object} options - Additional options
   * @returns {Object} Damage calculation result
   */
  async calculateDamage(attacker, defender, move, options = {}) {
    try {
      const {
        isCritical = this.rollCritical(),
        weather = null,
        terrain = null,
        customMultiplier = 1.0,
        battleId = null
      } = options;

      // Get move data if move name is provided
      let moveData = move;
      if (typeof move === 'string') {
        moveData = await Move.getByName(move);
        if (!moveData) {
          throw new Error(`Move ${move} not found`);
        }
      }

      // Check if this is a status move first
      const StatusMoveManager = require('./StatusMoveManager');
      const statusMoveResult = await StatusMoveManager.processStatusMove(moveData, attacker, defender, battleId);

      if (statusMoveResult && !statusMoveResult.proceedWithDamage) {
        // This is a pure status move, return the status move result
        return statusMoveResult;
      }

      // Check if status move returned null (fallback to normal attack)
      if (statusMoveResult === null && StatusMoveManager.isStatusMove(moveData.move_name)) {
        // Status move configuration failed, use as 50 power attack of the move's type
        console.log(`Status move "${moveData.move_name}" fell back to 50 power attack`);
        moveData = {
          ...moveData,
          power: 50,
          move_category: moveData.move_category || 'Physical' // Default to Physical if not specified
        };
      }

      // Not a status move, proceed with damage calculation
      // Calculate weather and terrain modifiers
      const weatherModifier = this.calculateWeatherModifier(moveData, weather);
      const terrainModifier = this.calculateTerrainModifier(moveData, terrain);

      // Check if move hits
      const accuracy = this.calculateAccuracy(attacker, defender, moveData);
      const hits = Math.random() * 100 <= accuracy;

      if (!hits) {
        return {
          damage: 0,
          hits: false,
          isCritical: false,
          effectiveness: 1.0,
          message: `${attacker.name || 'Attacker'}'s ${moveData.move_name} missed!`
        };
      }

      // Calculate base damage using physical/special split
      let damage = this.calculateBaseDamage(attacker, defender, moveData, isCritical);

      // Apply type effectiveness
      const effectiveness = this.calculateTypeEffectiveness(moveData, defender);
      damage *= effectiveness;

      // Apply STAB (Same Type Attack Bonus)
      const stabMultiplier = this.calculateSTAB(attacker, moveData);
      damage *= stabMultiplier;

      // Apply weather, terrain, and custom modifiers
      damage *= weatherModifier;
      damage *= terrainModifier;
      damage *= customMultiplier;

      // Apply random factor
      const randomFactor = this.RANDOM_FACTOR_MIN +
        (Math.random() * (this.RANDOM_FACTOR_MAX - this.RANDOM_FACTOR_MIN));
      damage *= randomFactor;

      // Round damage
      damage = Math.max(1, Math.floor(damage));

      // Generate damage message
      let message = this.generateDamageMessage(attacker, defender, moveData, {
        damage,
        isCritical,
        effectiveness,
        hasStab: stabMultiplier > 1
      });

      // Handle special damage move effects if this was a special damage move
      let specialEffectMessage = '';
      if (statusMoveResult && statusMoveResult.isSpecialDamageMove) {
        message = statusMoveResult.baseMessage + message.substring(message.indexOf('!') + 1);
      }

      return {
        damage,
        hits: true,
        isCritical,
        effectiveness,
        stabMultiplier,
        accuracy,
        message,
        moveData,
        isSpecialDamageMove: statusMoveResult?.isSpecialDamageMove || false,
        specialMoveConfig: statusMoveResult?.moveConfig || null
      };

    } catch (error) {
      console.error('Error calculating damage:', error);
      throw error;
    }
  }

  /**
   * Calculate base damage using the damage formula
   * @param {Object} attacker - Attacking monster
   * @param {Object} defender - Defending monster
   * @param {Object} move - Move data
   * @param {boolean} isCritical - Whether it's a critical hit
   * @returns {number} Base damage
   */
  calculateBaseDamage(attacker, defender, move, isCritical) {
    const level = attacker.level || 1;
    let power = move.power || 40;

    // Handle status moves (power 0 or null)
    if (!power || power === 0) {
      power = 0; // Status moves do no damage
      return 0;
    }
    
    // Determine if move is physical, special, or status using MoveType column
    const moveType = move.MoveType || move.move_type || move.move_category || 'Unknown';

    let attack, defense;

    if (moveType.toLowerCase() === 'physical') {
      // Physical move: use Attack vs Defense
      attack = this.getEffectiveStat(attacker, 'attack');
      defense = this.getEffectiveStat(defender, 'defense');
    } else if (moveType.toLowerCase() === 'special') {
      // Special move: use Special Attack vs Special Defense
      attack = this.getEffectiveStat(attacker, 'special_attack');
      defense = this.getEffectiveStat(defender, 'special_defense');
    } else {
      // Status move or unknown: randomly choose physical or special
      const usePhysical = Math.random() < 0.5;
      if (usePhysical) {
        attack = this.getEffectiveStat(attacker, 'attack');
        defense = this.getEffectiveStat(defender, 'defense');
      } else {
        attack = this.getEffectiveStat(attacker, 'special_attack');
        defense = this.getEffectiveStat(defender, 'special_defense');
      }
    }

    // Use actual Pokémon damage formula
    // Damage = ((((2 * Level / 5 + 2) * Attack * Power / Defense) / 50) + 2) * Modifiers
    const levelFactor = (2 * level / 5) + 2;
    const baseDamage = ((((levelFactor * attack * power) / defense) / 50) + 2);

    // Apply critical hit modifier after base calculation
    const criticalMultiplier = isCritical ? this.CRITICAL_MULTIPLIER : 1;

    return Math.floor(baseDamage * criticalMultiplier);
  }

  /**
   * Get effective stat value including stat modifications
   * @param {Object} monster - Monster data
   * @param {string} statName - Name of the stat
   * @returns {number} Effective stat value
   */
  getEffectiveStat(monster, statName) {
    // Map stat names to possible field names in monster data
    const statMapping = {
      'attack': ['attack', 'atk_total', 'atk'],
      'defense': ['defense', 'def_total', 'def'],
      'special_attack': ['sp_attack', 'spa_total', 'spa', 'special_attack'],
      'special_defense': ['sp_defense', 'spd_total', 'spd', 'special_defense'],
      'speed': ['speed', 'spe_total', 'spe'],
      'hp': ['hp', 'hp_total']
    };

    // Get base stat value
    let baseStat = 50; // Default value
    const possibleFields = statMapping[statName] || [statName];

    for (const field of possibleFields) {
      if (monster[field] !== undefined && monster[field] !== null) {
        baseStat = monster[field];
        break;
      }
    }

    // Apply stat modifications if they exist
    const statModifications = monster.stat_modifications || {};
    const modification = statModifications[statName] || 0;

    // Calculate stat multiplier based on modification stages
    // Pokemon stat stages: +1 = 1.5x, +2 = 2.0x, +3 = 2.5x, +4 = 3.0x, +5 = 3.5x, +6 = 4.0x
    // -1 = 0.67x, -2 = 0.5x, -3 = 0.4x, -4 = 0.33x, -5 = 0.29x, -6 = 0.25x
    let multiplier = 1.0;
    if (modification > 0) {
      multiplier = (2 + modification) / 2;
    } else if (modification < 0) {
      multiplier = 2 / (2 + Math.abs(modification));
    }

    return Math.max(1, Math.floor(baseStat * multiplier));
  }

  /**
   * Calculate type effectiveness
   * @param {Object} move - Move data
   * @param {Object} defender - Defending monster
   * @returns {number} Effectiveness multiplier
   */
  calculateTypeEffectiveness(move, defender) {
    const moveType = move.move_type || move.type;
    const defenderTypes = this.getMonsterTypes(defender);

    return Move.calculateTypeEffectiveness(moveType, defenderTypes);
  }

  /**
   * Calculate STAB (Same Type Attack Bonus)
   * @param {Object} attacker - Attacking monster
   * @param {Object} move - Move data
   * @returns {number} STAB multiplier
   */
  calculateSTAB(attacker, move) {
    const moveType = move.move_type || move.type;
    const attackerTypes = this.getMonsterTypes(attacker);
    
    // Check if move type matches any of the attacker's types
    if (attackerTypes.includes(moveType)) {
      return this.STAB_MULTIPLIER;
    }
    
    return 1.0;
  }

  /**
   * Get monster types as array
   * @param {Object} monster - Monster data
   * @returns {Array<string>} Array of types
   */
  getMonsterTypes(monster) {
    const types = [];
    
    // Handle different type field formats
    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);
    
    // Handle monster_data nested structure
    if (monster.monster_data) {
      const data = monster.monster_data;
      if (data.type1) types.push(data.type1);
      if (data.type2) types.push(data.type2);
      if (data.type3) types.push(data.type3);
      if (data.type4) types.push(data.type4);
      if (data.type5) types.push(data.type5);
    }
    
    // Filter out empty/null types
    return types.filter(type => type && type.trim() !== '');
  }

  /**
   * Calculate move accuracy
   * @param {Object} attacker - Attacking monster
   * @param {Object} defender - Defending monster
   * @param {Object} move - Move data
   * @returns {number} Accuracy percentage
   */
  calculateAccuracy(attacker, defender, move) {
    let accuracy = move.accuracy || 100;
    
    // Apply accuracy modifiers based on stats or status effects
    // This can be expanded with more complex accuracy calculations
    
    return Math.min(100, Math.max(0, accuracy));
  }

  /**
   * Roll for critical hit
   * @param {Object} attacker - Attacking monster (optional, for future crit rate modifiers)
   * @returns {boolean} Whether it's a critical hit
   */
  rollCritical(attacker = null) {
    // Base critical hit chance
    let critChance = this.CRITICAL_CHANCE;
    
    // Future: Add modifiers based on attacker's stats, items, abilities
    
    return Math.random() < critChance;
  }

  /**
   * Generate damage message
   * @param {Object} attacker - Attacking monster
   * @param {Object} defender - Defending monster
   * @param {Object} move - Move data
   * @param {Object} result - Damage result
   * @returns {string} Damage message
   */
  generateDamageMessage(attacker, defender, move, result) {
    const attackerName = attacker.name || 'Attacker';
    const defenderName = defender.name || 'Defender';
    const moveName = move.move_name;
    const { damage, isCritical, effectiveness } = result;

    let message = `${attackerName} used **${moveName}**!`;

    if (isCritical) {
      message += '\n💥 **Critical hit!**';
    }

    if (effectiveness > 1) {
      message += '\n✨ **It\'s super effective!**';
    } else if (effectiveness < 1 && effectiveness > 0) {
      message += '\n🛡️ **It\'s not very effective...**';
    } else if (effectiveness === 0) {
      message += '\n❌ **It had no effect!**';
    }

    message += `\n💔 **${defenderName}** took **${damage}** damage!`;

    return message;
  }

  /**
   * Calculate healing amount
   * @param {Object} healer - Monster doing the healing
   * @param {Object} target - Target monster
   * @param {Object} item - Healing item or move
   * @returns {Object} Healing result
   */
  calculateHealing(healer, target, item) {
    try {
      let healAmount = 0;
      
      if (item.heal_amount) {
        // Fixed heal amount
        healAmount = item.heal_amount;
      } else if (item.heal_percentage) {
        // Percentage-based healing
        healAmount = Math.floor(target.max_hp * (item.heal_percentage / 100));
      } else {
        // Default healing
        healAmount = Math.floor(target.max_hp * 0.2); // 20% heal
      }

      // Ensure we don't overheal
      const actualHeal = Math.min(healAmount, target.max_hp - target.current_hp);

      return {
        healAmount: actualHeal,
        newHp: target.current_hp + actualHeal,
        message: `${target.name || 'Target'} recovered ${actualHeal} HP!`
      };

    } catch (error) {
      console.error('Error calculating healing:', error);
      throw error;
    }
  }

  /**
   * Calculate status effect application
   * @param {Object} attacker - Attacking monster
   * @param {Object} defender - Defending monster
   * @param {Object} move - Move data
   * @returns {Object} Status effect result
   */
  calculateStatusEffect(attacker, defender, move) {
    try {
      // Check if this is a status move handled by StatusMoveManager
      const StatusMoveManager = require('./StatusMoveManager');
      if (StatusMoveManager.isStatusMove(move.move_name)) {
        // Status moves handle their own effects, don't apply additional status effects
        return { applied: false };
      }

      // Check for explicit move-based status effects first
      const explicitEffect = this.checkExplicitStatusEffect(move);
      if (explicitEffect.applied) {
        return explicitEffect;
      }

      // Check for type-based status effects
      const StatusEffectManager = require('./StatusEffectManager');
      const typeBasedEffect = StatusEffectManager.checkTypeBasedStatusEffect(move, attacker, defender);

      if (typeBasedEffect) {
        return {
          applied: true,
          effect: {
            type: typeBasedEffect.type,
            duration: StatusEffectManager.statusEffects[typeBasedEffect.type]?.duration || 3
          },
          message: `${defender.name || 'Defender'} was affected by ${typeBasedEffect.type}!`
        };
      }

      return { applied: false };

    } catch (error) {
      console.error('Error calculating status effect:', error);
      return { applied: false };
    }
  }

  /**
   * Check for explicit status effects from move data
   * @param {Object} move - Move data
   * @returns {Object} Status effect result
   */
  checkExplicitStatusEffect(move) {
    try {
      const effectChance = move.effect_chance || 0;

      if (effectChance === 0) {
        return { applied: false };
      }

      const roll = Math.random() * 100;
      const applied = roll <= effectChance;

      if (!applied) {
        return { applied: false };
      }

      // Parse effect from move description
      const effect = this.parseStatusEffect(move.description || move.effect);

      // Don't apply unknown effects
      if (effect.type === 'unknown') {
        return { applied: false };
      }

      return {
        applied: true,
        effect,
        message: `Target was affected by ${effect.type}!`
      };

    } catch (error) {
      console.error('Error checking explicit status effect:', error);
      return { applied: false };
    }
  }

  /**
   * Parse status effect from move description
   * @param {string} description - Move description
   * @returns {Object} Status effect data
   */
  parseStatusEffect(description) {
    // Simple status effect parsing - can be expanded
    if (!description) {
      return { type: 'unknown', duration: 1 };
    }

    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('burn')) {
      return { type: 'burn', duration: 3 };
    } else if (lowerDesc.includes('poison')) {
      return { type: 'poison', duration: 3 };
    } else if (lowerDesc.includes('paralyze') || lowerDesc.includes('paralysis')) {
      return { type: 'paralysis', duration: 3 };
    } else if (lowerDesc.includes('sleep')) {
      return { type: 'sleep', duration: 2 };
    } else if (lowerDesc.includes('freeze')) {
      return { type: 'freeze', duration: 2 };
    } else if (lowerDesc.includes('confus')) {
      return { type: 'confusion', duration: 3 };
    } else if (lowerDesc.includes('flinch')) {
      return { type: 'flinch', duration: 1 };
    }

    // Log unknown descriptions for debugging
    console.log(`Unknown status effect description: "${description}"`);
    return { type: 'unknown', duration: 1 };
  }

  /**
   * Apply status effect damage
   * @param {Object} monster - Monster with status effect
   * @param {Object} statusEffect - Status effect data
   * @returns {Object} Status damage result
   */
  calculateStatusDamage(monster, statusEffect) {
    try {
      let damage = 0;
      let message = '';

      switch (statusEffect.type) {
        case 'burn':
          damage = Math.floor(monster.max_hp / 16); // 1/16 of max HP
          message = `${monster.name || 'Monster'} is hurt by its burn!`;
          break;
        case 'poison':
          damage = Math.floor(monster.max_hp / 8); // 1/8 of max HP
          message = `${monster.name || 'Monster'} is hurt by poison!`;
          break;
        default:
          damage = 0;
      }

      damage = Math.max(1, damage); // Minimum 1 damage

      return {
        damage,
        message,
        shouldRemove: statusEffect.duration <= 1
      };

    } catch (error) {
      console.error('Error calculating status damage:', error);
      return { damage: 0, message: '', shouldRemove: false };
    }
  }

  /**
   * Calculate weather modifier for damage
   * @param {Object} move - Move data
   * @param {string} weather - Current weather
   * @returns {number} Weather modifier
   */
  calculateWeatherModifier(move, weather) {
    if (!weather || weather === 'clear') {
      return 1.0;
    }

    const moveType = move.move_type || move.type;

    switch (weather) {
      case 'rain':
        if (moveType === 'Water') return 1.5;
        if (moveType === 'Fire') return 0.5;
        break;
      case 'sunny':
        if (moveType === 'Fire') return 1.5;
        if (moveType === 'Water') return 0.5;
        break;
      case 'sandstorm':
        // Sandstorm damages non-Rock/Ground/Steel types
        // But doesn't directly modify move damage
        break;
      case 'hail':
        // Hail damages non-Ice types
        // But doesn't directly modify move damage
        break;
      case 'snow':
        if (moveType === 'Ice') return 1.2;
        break;
      case 'fog':
        // Fog reduces accuracy but doesn't affect damage
        break;
    }

    return 1.0;
  }

  /**
   * Calculate terrain modifier for damage
   * @param {Object} move - Move data
   * @param {string} terrain - Current terrain
   * @returns {number} Terrain modifier
   */
  calculateTerrainModifier(move, terrain) {
    if (!terrain || terrain === 'normal') {
      return 1.0;
    }

    const moveType = move.move_type || move.type;

    switch (terrain) {
      case 'electric':
        if (moveType === 'Electric') return 1.3;
        break;
      case 'grassy':
        if (moveType === 'Grass') return 1.3;
        break;
      case 'misty':
        if (moveType === 'Fairy') return 1.3;
        break;
      case 'psychic':
        if (moveType === 'Psychic') return 1.3;
        break;
    }

    return 1.0;
  }

  /**
   * Calculate weather accuracy modifier
   * @param {Object} move - Move data
   * @param {string} weather - Current weather
   * @returns {number} Accuracy modifier
   */
  calculateWeatherAccuracyModifier(move, weather) {
    if (!weather || weather === 'clear') {
      return 1.0;
    }

    switch (weather) {
      case 'sandstorm':
        return 0.8; // Reduced accuracy in sandstorm
      case 'hail':
        return 0.9; // Slightly reduced accuracy in hail
      case 'fog':
        return 0.6; // Significantly reduced accuracy in fog
    }

    return 1.0;
  }

  /**
   * Get weather status damage
   * @param {Object} monster - Monster data
   * @param {string} weather - Current weather
   * @returns {Object} Weather damage result
   */
  calculateWeatherDamage(monster, weather) {
    try {
      let damage = 0;
      let message = '';

      const monsterTypes = this.getMonsterTypes(monster);

      switch (weather) {
        case 'sandstorm':
          // Damages non-Rock/Ground/Steel types
          if (!monsterTypes.includes('Rock') &&
              !monsterTypes.includes('Ground') &&
              !monsterTypes.includes('Steel')) {
            damage = Math.floor(monster.max_hp / 16);
            message = `${monster.name || 'Monster'} is buffeted by the sandstorm!`;
          }
          break;
        case 'hail':
          // Damages non-Ice types
          if (!monsterTypes.includes('Ice')) {
            damage = Math.floor(monster.max_hp / 16);
            message = `${monster.name || 'Monster'} is pelted by hail!`;
          }
          break;
      }

      return {
        damage: Math.max(0, damage),
        message
      };

    } catch (error) {
      console.error('Error calculating weather damage:', error);
      return { damage: 0, message: '' };
    }
  }
}

module.exports = new DamageCalculator();
