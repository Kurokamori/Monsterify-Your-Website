const Move = require('../models/Move');
const DamageCalculator = require('./DamageCalculator');

/**
 * BattleAI service for AI decision making in battles
 */
class BattleAI {
  constructor() {
    // AI difficulty settings
    this.difficulties = {
      easy: {
        randomChance: 0.4,
        healThreshold: 0.2,
        switchThreshold: 0.1,
        typeAdvantageWeight: 0.3
      },
      medium: {
        randomChance: 0.2,
        healThreshold: 0.3,
        switchThreshold: 0.2,
        typeAdvantageWeight: 0.6
      },
      hard: {
        randomChance: 0.1,
        healThreshold: 0.4,
        switchThreshold: 0.3,
        typeAdvantageWeight: 0.9
      }
    };
  }

  /**
   * Select AI action for a participant
   * @param {Object} participant - AI participant
   * @param {Object} battleState - Current battle state
   * @param {string} difficulty - AI difficulty level
   * @returns {Promise<Object>} Selected action
   */
  async selectAction(participant, battleState, difficulty = 'medium') {
    try {
      const difficultySettings = this.difficulties[difficulty] || this.difficulties.medium;
      
      // Get AI's active monster
      const aiMonster = this.getActiveMonster(participant, battleState.monsters);
      if (!aiMonster) {
        return { action_type: 'wait', action_data: {} };
      }

      // Get opponent monsters
      const opponentMonsters = this.getOpponentMonsters(participant, battleState.monsters);
      const targetMonster = this.selectTarget(aiMonster, opponentMonsters, difficultySettings);

      // Decide action type based on situation
      const actionType = await this.decideActionType(aiMonster, targetMonster, difficultySettings);

      switch (actionType) {
        case 'attack':
          return await this.selectAttack(aiMonster, targetMonster, difficultySettings);
        case 'item':
          return await this.selectItem(aiMonster, difficultySettings);
        case 'switch':
          return await this.selectSwitch(participant, battleState.monsters, difficultySettings);
        default:
          return { action_type: 'wait', action_data: {} };
      }

    } catch (error) {
      console.error('Error selecting AI action:', error);
      // Fallback to random attack
      return await this.selectRandomAttack(participant, battleState);
    }
  }

  /**
   * Get active monster for participant
   * @param {Object} participant - Participant data
   * @param {Array} monsters - All battle monsters
   * @returns {Object|null} Active monster
   */
  getActiveMonster(participant, monsters) {
    return monsters.find(m => 
      m.participant_id === participant.id && 
      m.is_active && 
      !m.is_fainted
    );
  }

  /**
   * Get opponent monsters
   * @param {Object} participant - AI participant
   * @param {Array} monsters - All battle monsters
   * @returns {Array} Opponent monsters
   */
  getOpponentMonsters(participant, monsters) {
    const opponentSide = participant.team_side === 'players' ? 'opponents' : 'players';
    return monsters.filter(m => 
      m.team_side === opponentSide && 
      m.is_active && 
      !m.is_fainted
    );
  }

  /**
   * Select target monster
   * @param {Object} aiMonster - AI's monster
   * @param {Array} opponentMonsters - Opponent monsters
   * @param {Object} settings - Difficulty settings
   * @returns {Object|null} Target monster
   */
  selectTarget(aiMonster, opponentMonsters, settings) {
    if (opponentMonsters.length === 0) {
      return null;
    }

    // Random selection chance
    if (Math.random() < settings.randomChance) {
      return opponentMonsters[Math.floor(Math.random() * opponentMonsters.length)];
    }

    // Strategic target selection
    let bestTarget = opponentMonsters[0];
    let bestScore = 0;

    for (const opponent of opponentMonsters) {
      let score = 0;

      // Prefer low HP targets
      const hpRatio = opponent.current_hp / opponent.max_hp;
      score += (1 - hpRatio) * 50;

      // Consider type advantages
      const aiTypes = DamageCalculator.getMonsterTypes(aiMonster);
      const opponentTypes = DamageCalculator.getMonsterTypes(opponent);
      
      // Simple type advantage calculation
      for (const aiType of aiTypes) {
        const effectiveness = Move.calculateTypeEffectiveness(aiType, opponentTypes);
        score += (effectiveness - 1) * 30;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = opponent;
      }
    }

    return bestTarget;
  }

  /**
   * Decide what type of action to take
   * @param {Object} aiMonster - AI's monster
   * @param {Object} targetMonster - Target monster
   * @param {Object} settings - Difficulty settings
   * @returns {Promise<string>} Action type
   */
  async decideActionType(aiMonster, targetMonster, settings) {
    // Check if monster needs healing
    const hpRatio = aiMonster.current_hp / aiMonster.max_hp;
    
    if (hpRatio < settings.healThreshold && Math.random() < 0.7) {
      return 'item'; // Try to heal
    }

    // Check if should switch (low HP and no healing available)
    if (hpRatio < settings.switchThreshold && Math.random() < 0.5) {
      return 'switch';
    }

    // Default to attack
    return 'attack';
  }

  /**
   * Select attack move
   * @param {Object} aiMonster - AI's monster
   * @param {Object} targetMonster - Target monster
   * @param {Object} settings - Difficulty settings
   * @returns {Promise<Object>} Attack action
   */
  async selectAttack(aiMonster, targetMonster, settings) {
    try {
      // Get monster's moves
      const moves = await this.getMonsterMoves(aiMonster);
      
      if (moves.length === 0) {
        // No moves available, use struggle
        return {
          action_type: 'attack',
          action_data: {
            move_name: 'Struggle',
            target_id: targetMonster.id
          }
        };
      }

      // Random move selection chance
      if (Math.random() < settings.randomChance) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        return {
          action_type: 'attack',
          action_data: {
            move_name: randomMove.move_name,
            target_id: targetMonster.id
          }
        };
      }

      // Strategic move selection
      let bestMove = moves[0];
      let bestScore = 0;

      for (const move of moves) {
        let score = move.power || 40;

        // Consider type effectiveness
        const targetTypes = DamageCalculator.getMonsterTypes(targetMonster);
        const effectiveness = Move.calculateTypeEffectiveness(move.move_type, targetTypes);
        score *= effectiveness * settings.typeAdvantageWeight;

        // Consider STAB
        const aiTypes = DamageCalculator.getMonsterTypes(aiMonster);
        if (aiTypes.includes(move.move_type)) {
          score *= 1.5;
        }

        // Consider accuracy
        score *= (move.accuracy || 100) / 100;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return {
        action_type: 'attack',
        action_data: {
          move_name: bestMove.move_name,
          target_id: targetMonster.id
        }
      };

    } catch (error) {
      console.error('Error selecting attack:', error);
      return {
        action_type: 'attack',
        action_data: {
          move_name: 'Tackle',
          target_id: targetMonster.id
        }
      };
    }
  }

  /**
   * Get monster's available moves
   * @param {Object} monster - Monster data
   * @returns {Promise<Array>} Array of moves
   */
  async getMonsterMoves(monster) {
    try {
      // Get moves from monster data
      let moveset = [];
      
      if (monster.monster_data && monster.monster_data.moveset) {
        try {
          moveset = JSON.parse(monster.monster_data.moveset);
        } catch (e) {
          console.error('Error parsing moveset:', e);
        }
      }

      if (!Array.isArray(moveset) || moveset.length === 0) {
        // Generate basic moves based on monster type/level
        moveset = await this.generateBasicMoves(monster);
      }

      // Get move details
      if (moveset.length > 0) {
        return await Move.getByNames(moveset);
      }

      return [];
    } catch (error) {
      console.error('Error getting monster moves:', error);
      return [];
    }
  }

  /**
   * Generate basic moves for a monster
   * @param {Object} monster - Monster data
   * @returns {Promise<Array>} Array of move names
   */
  async generateBasicMoves(monster) {
    try {
      const basicMoves = ['Tackle', 'Scratch', 'Pound'];
      const monsterTypes = DamageCalculator.getMonsterTypes(monster);
      
      // Add type-specific moves
      for (const type of monsterTypes) {
        const typeMoves = await Move.getByType(type);
        if (typeMoves.length > 0) {
          // Add a random move of this type
          const randomTypeMove = typeMoves[Math.floor(Math.random() * typeMoves.length)];
          basicMoves.push(randomTypeMove.move_name);
        }
      }

      return basicMoves.slice(0, 4); // Limit to 4 moves
    } catch (error) {
      console.error('Error generating basic moves:', error);
      return ['Tackle'];
    }
  }

  /**
   * Select item to use
   * @param {Object} aiMonster - AI's monster
   * @param {Object} settings - Difficulty settings
   * @returns {Promise<Object>} Item action
   */
  async selectItem(aiMonster, settings) {
    try {
      // Simple healing item selection
      const healingItems = [
        { name: 'Potion', heal_amount: 20 },
        { name: 'Super Potion', heal_amount: 50 },
        { name: 'Hyper Potion', heal_amount: 200 }
      ];

      const hpMissing = aiMonster.max_hp - aiMonster.current_hp;
      
      // Select appropriate healing item
      let selectedItem = healingItems[0];
      for (const item of healingItems) {
        if (item.heal_amount <= hpMissing * 1.2) {
          selectedItem = item;
        }
      }

      return {
        action_type: 'item',
        action_data: {
          item_name: selectedItem.name,
          target_id: aiMonster.id
        }
      };

    } catch (error) {
      console.error('Error selecting item:', error);
      return { action_type: 'wait', action_data: {} };
    }
  }

  /**
   * Select monster to switch to
   * @param {Object} participant - AI participant
   * @param {Array} monsters - All battle monsters
   * @param {Object} settings - Difficulty settings
   * @returns {Promise<Object>} Switch action
   */
  async selectSwitch(participant, monsters, settings) {
    try {
      // Get available monsters to switch to
      const availableMonsters = monsters.filter(m => 
        m.participant_id === participant.id && 
        !m.is_active && 
        !m.is_fainted
      );

      if (availableMonsters.length === 0) {
        return { action_type: 'wait', action_data: {} };
      }

      // Select monster with highest HP
      let bestMonster = availableMonsters[0];
      let bestHpRatio = bestMonster.current_hp / bestMonster.max_hp;

      for (const monster of availableMonsters) {
        const hpRatio = monster.current_hp / monster.max_hp;
        if (hpRatio > bestHpRatio) {
          bestHpRatio = hpRatio;
          bestMonster = monster;
        }
      }

      return {
        action_type: 'switch',
        action_data: {
          monster_id: bestMonster.id
        }
      };

    } catch (error) {
      console.error('Error selecting switch:', error);
      return { action_type: 'wait', action_data: {} };
    }
  }

  /**
   * Fallback random attack selection
   * @param {Object} participant - AI participant
   * @param {Object} battleState - Battle state
   * @returns {Promise<Object>} Random attack action
   */
  async selectRandomAttack(participant, battleState) {
    try {
      const aiMonster = this.getActiveMonster(participant, battleState.monsters);
      const opponentMonsters = this.getOpponentMonsters(participant, battleState.monsters);
      
      if (!aiMonster || opponentMonsters.length === 0) {
        return { action_type: 'wait', action_data: {} };
      }

      const target = opponentMonsters[Math.floor(Math.random() * opponentMonsters.length)];
      const basicMoves = ['Tackle', 'Scratch', 'Pound'];
      const move = basicMoves[Math.floor(Math.random() * basicMoves.length)];

      return {
        action_type: 'attack',
        action_data: {
          move_name: move,
          target_id: target.id
        }
      };

    } catch (error) {
      console.error('Error selecting random attack:', error);
      return { action_type: 'wait', action_data: {} };
    }
  }

  /**
   * Process AI turn automatically
   * @param {Object} participant - AI participant
   * @param {Object} battleState - Battle state
   * @param {string} difficulty - AI difficulty
   * @returns {Promise<Object>} AI action result
   */
  async processAITurn(participant, battleState, difficulty = 'medium') {
    try {
      // Add a small delay to make AI feel more natural
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const action = await this.selectAction(participant, battleState, difficulty);
      
      // Add AI flavor text
      const aiMessage = this.generateAIMessage(participant, action);
      
      return {
        ...action,
        ai_message: aiMessage,
        word_count: aiMessage.split(' ').length
      };

    } catch (error) {
      console.error('Error processing AI turn:', error);
      return {
        action_type: 'wait',
        action_data: {},
        ai_message: `${participant.trainer_name} hesitates...`,
        word_count: 3
      };
    }
  }

  /**
   * Generate AI flavor message
   * @param {Object} participant - AI participant
   * @param {Object} action - Selected action
   * @returns {string} AI message
   */
  generateAIMessage(participant, action) {
    const trainerName = participant.trainer_name || 'AI Trainer';
    
    const messages = {
      attack: [
        `${trainerName} commands their monster to attack!`,
        `${trainerName} calls out an offensive move!`,
        `${trainerName} goes on the offensive!`,
        `${trainerName} strikes with determination!`
      ],
      item: [
        `${trainerName} reaches for an item!`,
        `${trainerName} uses a helpful item!`,
        `${trainerName} provides support with an item!`
      ],
      switch: [
        `${trainerName} recalls their monster!`,
        `${trainerName} makes a tactical switch!`,
        `${trainerName} changes their strategy!`
      ],
      wait: [
        `${trainerName} waits and watches...`,
        `${trainerName} takes a moment to think...`,
        `${trainerName} observes the battlefield...`
      ]
    };

    const actionMessages = messages[action.action_type] || messages.wait;
    return actionMessages[Math.floor(Math.random() * actionMessages.length)];
  }
}

module.exports = new BattleAI();
