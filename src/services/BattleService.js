const Battle = require('../models/Battle');
const BattleOpponent = require('../models/BattleOpponent');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const TypeEffectiveness = require('../utils/TypeEffectiveness');

/**
 * Service for handling battle mechanics
 */
class BattleService {
  /**
   * Start a new battle
   * @param {number} trainerId - Trainer ID
   * @param {number} opponentId - Opponent ID
   * @returns {Promise<Object>} - Result of the battle creation
   */
  static async startBattle(trainerId, opponentId) {
    try {
      // Check if trainer exists
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          success: false,
          message: 'Trainer not found'
        };
      }

      // Check if opponent exists
      const opponent = await BattleOpponent.getById(opponentId);
      if (!opponent) {
        return {
          success: false,
          message: 'Opponent not found'
        };
      }

      // Get trainer's battle box monsters
      const trainerMonsters = await Trainer.getBattleBoxMonsters(trainerId);
      if (!trainerMonsters || trainerMonsters.length === 0) {
        return {
          success: false,
          message: 'Trainer has no monsters in battle box'
        };
      }

      // Get opponent's monsters
      const opponentMonsters = await BattleOpponent.getMonsters(opponentId);
      if (!opponentMonsters || opponentMonsters.length === 0) {
        return {
          success: false,
          message: 'Opponent has no monsters'
        };
      }

      // Create the battle
      const battle = await Battle.create(trainerId, opponentId);
      if (!battle) {
        return {
          success: false,
          message: 'Failed to create battle'
        };
      }

      return {
        success: true,
        message: 'Battle started successfully',
        battle,
        trainer,
        opponent,
        trainerMonsters,
        opponentMonsters
      };
    } catch (error) {
      console.error('Error starting battle:', error);
      return {
        success: false,
        message: `Error starting battle: ${error.message}`
      };
    }
  }

  /**
   * Calculate damage for an attack
   * @param {Object} attacker - Attacking monster
   * @param {Object} defender - Defending monster
   * @param {number} typingSpeed - Typing speed (words per minute)
   * @param {number} typingAccuracy - Typing accuracy (percentage)
   * @returns {Promise<Object>} - Damage calculation result
   */
  static async calculateDamage(attacker, defender, typingSpeed, typingAccuracy) {
    try {
      console.log('Calculating damage with attacker:', attacker, 'defender:', defender);

      // Ensure monsters have default stats if they're missing
      const attackerLevel = attacker.level || 1;
      const attackerAtk = attacker.atk_total || 10;
      const defenderDef = defender.def_total || 10;

      // Base damage formula
      // Higher level and attack stat increases damage
      // Higher defense stat reduces damage
      const baseDamage = (attackerLevel * 0.4) + (attackerAtk * 0.6);
      const defenseModifier = 100 / (100 + defenderDef * 0.8);

      // Typing speed modifier (higher WPM = more damage)
      const speedModifier = Math.min(2.0, Math.max(0.5, typingSpeed / 50));

      // Typing accuracy modifier (higher accuracy = more damage)
      const accuracyModifier = Math.min(1.5, Math.max(0.5, typingAccuracy / 100));

      // Type effectiveness modifier
      const typeMultiplier = await TypeEffectiveness.calculateDamageMultiplier(attacker, defender);

      // Calculate final damage
      let damage = baseDamage * defenseModifier * speedModifier * accuracyModifier * typeMultiplier;

      // Add some randomness (±10%)
      const randomFactor = 0.9 + (Math.random() * 0.2);
      damage *= randomFactor;

      // Round to nearest integer
      damage = Math.max(1, Math.round(damage));

      // Get effectiveness description
      const effectivenessDescription = TypeEffectiveness.getEffectivenessDescription(typeMultiplier);

      return {
        damage,
        typeMultiplier,
        effectivenessDescription,
        isCritical: randomFactor > 1.05 // Critical hit if random factor is high
      };
    } catch (error) {
      console.error('Error calculating damage:', error);
      // Return a default damage value on error
      return {
        damage: 5,
        typeMultiplier: 1.0,
        effectivenessDescription: '',
        isCritical: false
      };
    }
  }

  /**
   * Process a battle turn
   * @param {Object} battleState - Current battle state
   * @param {Object} turnData - Turn data (typing speed, accuracy, etc.)
   * @returns {Promise<Object>} - Updated battle state
   */
  static async processTurn(battleState, turnData) {
    try {
      const {
        battle,
        trainerMonsters,
        opponentMonsters,
        activeTrainerMonsterIndex,
        activeOpponentMonsterIndex,
        trainerMonsterHealth,
        opponentMonsterHealth
      } = battleState;

      // Get active monsters
      const activeTrainerMonster = trainerMonsters[activeTrainerMonsterIndex];
      const activeOpponentMonster = opponentMonsters[activeOpponentMonsterIndex];

      // Initialize health arrays if they don't exist
      const updatedTrainerHealth = trainerMonsterHealth ||
        trainerMonsters.map(monster => monster.hp_total);

      const updatedOpponentHealth = opponentMonsterHealth ||
        opponentMonsters.map(monster => monster.hp_total);

      // Process player attack if they are typing
      let playerDamageResult = null;
      let opponentDamageResult = null;
      let battleResult = null;

      if (turnData.isPlayerAttacking) {
        // Calculate player damage
        playerDamageResult = await this.calculateDamage(
          activeTrainerMonster,
          activeOpponentMonster,
          turnData.wpm,
          turnData.accuracy
        );

        // Apply damage to opponent
        updatedOpponentHealth[activeOpponentMonsterIndex] -= playerDamageResult.damage;

        // Check if opponent monster is defeated
        if (updatedOpponentHealth[activeOpponentMonsterIndex] <= 0) {
          // Set health to 0 (no negative health)
          updatedOpponentHealth[activeOpponentMonsterIndex] = 0;

          // Find next available opponent monster
          let nextOpponentIndex = activeOpponentMonsterIndex;
          let allOpponentDefeated = true;

          for (let i = 0; i < opponentMonsters.length; i++) {
            if (updatedOpponentHealth[i] > 0) {
              nextOpponentIndex = i;
              allOpponentDefeated = false;
              break;
            }
          }

          // Check if all opponent monsters are defeated
          if (allOpponentDefeated) {
            // Player wins the battle
            battleResult = {
              isOver: true,
              winner: 'player',
              message: 'You defeated all opponent monsters!'
            };

            // Update battle status
            await Battle.updateStatus(battle.battle_id, 'won', {
              wpm: turnData.wpm,
              accuracy: turnData.accuracy
            });

            // Create rewards
            const rewards = this.generateRewards(battle, activeOpponentMonster);
            await Battle.createRewards(battle.battle_id, battle.trainer_id, rewards);
          } else {
            // Switch to next opponent monster
            battleResult = {
              isOver: false,
              opponentSwitch: true,
              newOpponentIndex: nextOpponentIndex,
              message: `${activeOpponentMonster.name} fainted! Opponent sends out ${opponentMonsters[nextOpponentIndex].name}!`
            };
          }
        }
      } else {
        // Player is defending (not typing), opponent attacks
        opponentDamageResult = await this.calculateDamage(
          activeOpponentMonster,
          activeTrainerMonster,
          30 + (activeOpponentMonster.level / 2), // Base opponent WPM scaled by level
          85 // Base opponent accuracy
        );

        // Apply damage to player
        updatedTrainerHealth[activeTrainerMonsterIndex] -= opponentDamageResult.damage;

        // Check if player monster is defeated
        if (updatedTrainerHealth[activeTrainerMonsterIndex] <= 0) {
          // Set health to 0 (no negative health)
          updatedTrainerHealth[activeTrainerMonsterIndex] = 0;

          // Find next available player monster
          let nextTrainerIndex = activeTrainerMonsterIndex;
          let allTrainerDefeated = true;

          for (let i = 0; i < trainerMonsters.length; i++) {
            if (updatedTrainerHealth[i] > 0) {
              nextTrainerIndex = i;
              allTrainerDefeated = false;
              break;
            }
          }

          // Check if all player monsters are defeated
          if (allTrainerDefeated) {
            // Opponent wins the battle
            battleResult = {
              isOver: true,
              winner: 'opponent',
              message: 'All your monsters have been defeated!'
            };

            // Update battle status
            await Battle.updateStatus(battle.battle_id, 'lost', {
              wpm: turnData.wpm,
              accuracy: turnData.accuracy
            });
          } else {
            // Switch to next player monster
            battleResult = {
              isOver: false,
              playerSwitch: true,
              newPlayerIndex: nextTrainerIndex,
              message: `${activeTrainerMonster.name} fainted! You send out ${trainerMonsters[nextTrainerIndex].name}!`
            };
          }
        }
      }

      // Return updated battle state
      return {
        battle,
        trainerMonsters,
        opponentMonsters,
        activeTrainerMonsterIndex: battleResult?.playerSwitch ? battleResult.newPlayerIndex : activeTrainerMonsterIndex,
        activeOpponentMonsterIndex: battleResult?.opponentSwitch ? battleResult.newOpponentIndex : activeOpponentMonsterIndex,
        trainerMonsterHealth: updatedTrainerHealth,
        opponentMonsterHealth: updatedOpponentHealth,
        playerDamageResult,
        opponentDamageResult,
        battleResult
      };
    } catch (error) {
      console.error('Error processing battle turn:', error);
      return {
        ...battleState,
        error: `Error processing turn: ${error.message}`
      };
    }
  }

  /**
   * Generate rewards for winning a battle
   * @param {Object} battle - Battle data
   * @param {Object} opponent - Opponent data
   * @returns {Object} - Generated rewards
   */
  static generateRewards(battle, opponent) {
    // Base rewards by difficulty
    const difficultyRewards = {
      easy: {
        coins: 100,
        levels: 1,
        itemChance: 0.3,
        monsterChance: 0.1
      },
      normal: {
        coins: 250,
        levels: 2,
        itemChance: 0.5,
        monsterChance: 0.2
      },
      hard: {
        coins: 500,
        levels: 3,
        itemChance: 0.7,
        monsterChance: 0.4
      },
      elite: {
        coins: 1000,
        levels: 5,
        itemChance: 1.0,
        monsterChance: 0.7
      }
    };

    // Get opponent difficulty or default to normal
    const difficulty = opponent?.difficulty || 'normal';
    const rewards = difficultyRewards[difficulty] || difficultyRewards.normal;

    // Initialize reward object
    const battleRewards = {
      coins: rewards.coins,
      levels: rewards.levels,
      items: { items: [] },
      monsters: { monsters: [] }
    };

    // Add random item based on chance
    if (Math.random() < rewards.itemChance) {
      battleRewards.items.items.push(this.generateRandomItem(difficulty));
    }

    // Add random monster based on chance
    if (Math.random() < rewards.monsterChance) {
      battleRewards.monsters.monsters.push(this.generateRandomMonster(difficulty));
    }

    return battleRewards;
  }

  /**
   * Generate a random item reward
   * @param {string} difficulty - Battle difficulty
   * @returns {Object} - Generated item
   */
  static generateRandomItem(difficulty) {
    // Item pools by difficulty
    const itemPools = {
      easy: [
        { name: 'Potion', category: 'ITEMS', quantity: 1 },
        { name: 'Berry Juice', category: 'BERRIES', quantity: 3 },
        { name: 'Pecha Berry', category: 'BERRIES', quantity: 2 }
      ],
      normal: [
        { name: 'Super Potion', category: 'ITEMS', quantity: 1 },
        { name: 'Sitrus Berry', category: 'BERRIES', quantity: 2 },
        { name: 'Bottle Cap', category: 'ITEMS', quantity: 1 }
      ],
      hard: [
        { name: 'Hyper Potion', category: 'ITEMS', quantity: 1 },
        { name: 'Lum Berry', category: 'BERRIES', quantity: 2 },
        { name: 'Ability Capsule', category: 'ITEMS', quantity: 1 }
      ],
      elite: [
        { name: 'Full Restore', category: 'ITEMS', quantity: 1 },
        { name: 'Gold Bottle Cap', category: 'ITEMS', quantity: 1 },
        { name: 'Ability Patch', category: 'ITEMS', quantity: 1 }
      ]
    };

    // Get item pool for difficulty or default to normal
    const pool = itemPools[difficulty] || itemPools.normal;

    // Return random item from pool
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Generate a random monster reward
   * @param {string} difficulty - Battle difficulty
   * @returns {Object} - Generated monster
   */
  static generateRandomMonster(difficulty) {
    // Base monster level by difficulty
    const levels = {
      easy: 5,
      normal: 10,
      hard: 20,
      elite: 30
    };

    // Get level for difficulty or default to normal
    const level = levels[difficulty] || levels.normal;

    // Return monster template
    return {
      name: 'Battle Reward Monster',
      level: level,
      is_special: difficulty === 'elite',
      is_static: false // Will be rolled when claimed
    };
  }

  /**
   * Abandon a battle
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} - Result of the abandon operation
   */
  static async abandonBattle(battleId) {
    try {
      // Update battle status
      const battle = await Battle.updateStatus(battleId, 'abandoned');

      if (!battle) {
        return {
          success: false,
          message: 'Battle not found'
        };
      }

      return {
        success: true,
        message: 'Battle abandoned successfully',
        battle
      };
    } catch (error) {
      console.error(`Error abandoning battle ${battleId}:`, error);
      return {
        success: false,
        message: `Error abandoning battle: ${error.message}`
      };
    }
  }
}

module.exports = BattleService;
