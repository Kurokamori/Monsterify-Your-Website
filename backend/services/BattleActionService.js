const BattleInstance = require('../models/BattleInstance');
const BattleParticipant = require('../models/BattleParticipant');
const BattleMonster = require('../models/BattleMonster');
const BattleTurn = require('../models/BattleTurn');
const BattleLog = require('../models/BattleLog');
const Move = require('../models/Move');
const Trainer = require('../models/Trainer');
const DamageCalculator = require('./DamageCalculator');
const BattleManager = require('./BattleManager');
const BattleAI = require('./BattleAI');

/**
 * BattleActionService for handling battle actions
 */
class BattleActionService {
  /**
   * Execute an attack action
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} moveName - Move name
   * @param {string} targetName - Target monster name (optional)
   * @param {string} message - Battle message
   * @param {string} attackerName - Attacking monster name (optional)
   * @returns {Promise<Object>} Attack result
   */
  async executeAttack(battleId, discordUserId, moveName, targetName, message, attackerName = null) {
    try {
      // Get participant
      const participant = await BattleParticipant.getByBattleAndUser(battleId, discordUserId);
      if (!participant) {
        throw new Error('You are not participating in this battle');
      }

      // Get attacker monster
      const attackerMonsters = await BattleMonster.getActiveByParticipant(participant.id);
      if (attackerMonsters.length === 0) {
        throw new Error('No active monster to attack with');
      }

      let attacker;
      if (attackerName && attackerMonsters.length > 1) {
        // Find specific monster by name
        attacker = attackerMonsters.find(m => {
          const monsterData = typeof m.monster_data === 'string' ? JSON.parse(m.monster_data) : m.monster_data;
          return monsterData.name && monsterData.name.toLowerCase() === attackerName.toLowerCase();
        });

        if (!attacker) {
          const availableMonsters = attackerMonsters.map(m => {
            const monsterData = typeof m.monster_data === 'string' ? JSON.parse(m.monster_data) : m.monster_data;
            return monsterData.name || 'Unknown';
          }).join(', ');
          throw new Error(`Monster "${attackerName}" not found among your active monsters. Available: ${availableMonsters}`);
        }
      } else {
        // Use first active monster if no specific attacker specified
        attacker = attackerMonsters[0];
      }

      // Process status effects for the attacking monster before action
      const StatusEffectManager = require('./StatusEffectManager');
      const statusResult = await StatusEffectManager.processStatusEffects(battleId, attacker);

      // Check if monster can act after status effects
      if (!statusResult.canAct) {
        // Monster is prevented from acting by status effects
        const monsterName = attacker.monster_data?.name || 'Monster';
        const preventMessage = statusResult.messages.join('\n');

        // Log the prevention
        await BattleLog.logSystem(battleId, preventMessage);

        // Send message to Discord
        await BattleManager.sendBattleMessageToDiscord(battleId, preventMessage);

        return {
          success: false,
          message: `${monsterName} cannot act due to status conditions!`,
          statusPrevented: true
        };
      }

      // If there were status effect messages, send them
      if (statusResult.messages.length > 0) {
        const statusMessage = statusResult.messages.join('\n');
        await BattleLog.logSystem(battleId, statusMessage);
        await BattleManager.sendBattleMessageToDiscord(battleId, statusMessage);
      }

      // Validate move against battle monster's moveset
      // Try different possible field names for moves
      const monsterMoves = attacker.monster_data?.moves ||
                          attacker.monster_data?.moveset ||
                          [];

      console.log('Move validation debug:', {
        moveName,
        monsterMoves,
        monsterName: attacker.monster_data?.name,
        monsterData: attacker.monster_data
      });

      // Handle both array and string formats
      let movesArray = [];
      if (Array.isArray(monsterMoves)) {
        movesArray = monsterMoves;
      } else if (typeof monsterMoves === 'string') {
        try {
          movesArray = JSON.parse(monsterMoves);
        } catch (e) {
          console.error('Error parsing moves string:', e);
          movesArray = [];
        }
      }

      const hasMove = movesArray.some(move =>
        move.toLowerCase() === moveName.toLowerCase()
      );

      if (!hasMove) {
        console.log('Move validation failed:', {
          moveName,
          movesArray,
          originalMoves: monsterMoves,
          monsterName: attacker.monster_data?.name
        });
        throw new Error(`${attacker.monster_data.name || 'Your monster'} doesn't know the move "${moveName}"`);
      }

      // Get target monster
      const target = await this.getTargetMonster(battleId, participant.team_side, targetName);
      if (!target) {
        throw new Error('Invalid target');
      }

      // Get move data
      const move = await Move.getByName(moveName);
      if (!move) {
        throw new Error(`Move "${moveName}" not found`);
      }

      // Calculate damage
      const damageResult = await DamageCalculator.calculateDamage(
        attacker.monster_data,
        target.monster_data,
        move
      );

      // Apply damage if hit
      let damageDealt = 0;
      let healthInfo = '';
      let statusEffectMessage = '';

      if (damageResult.hits) {
        const damageApplied = await BattleMonster.dealDamage(target.id, damageResult.damage);
        damageDealt = damageApplied.damage_dealt;

        // Get updated target for health display
        const updatedTarget = await BattleMonster.getById(target.id);
        const hpPercent = Math.round((updatedTarget.current_hp / updatedTarget.max_hp) * 100);

        // Create health bar visualization
        const healthBar = this.generateHealthBar(updatedTarget.current_hp, updatedTarget.max_hp);

        healthInfo = `\n💢 **${damageDealt} damage dealt!**\n` +
                    `${target.monster_data.name || 'Target'}: ${updatedTarget.current_hp}/${updatedTarget.max_hp} HP (${hpPercent}%)\n` +
                    `${healthBar}`;

        if (updatedTarget.is_fainted) {
          healthInfo += `\n💀 **${target.monster_data.name || 'Target'} fainted!**`;
        }

        // Check for status effect application
        const statusEffect = DamageCalculator.calculateStatusEffect(
          attacker.monster_data,
          target.monster_data,
          move
        );

        if (statusEffect.applied && statusEffect.effect && statusEffect.effect.type !== 'unknown') {
          const StatusEffectManager = require('./StatusEffectManager');
          const statusResult = await StatusEffectManager.applyStatusEffect(
            battleId,
            updatedTarget,
            statusEffect.effect.type,
            statusEffect.effect.duration
          );

          if (statusResult.success) {
            statusEffectMessage = `\n${statusResult.message}`;
          } else {
            console.warn('Failed to apply status effect:', statusResult.message);
          }
        }

        // Handle special damage move effects
        if (damageResult.isSpecialDamageMove && damageResult.specialMoveConfig) {
          const StatusMoveManager = require('./StatusMoveManager');
          const specialEffectResult = await StatusMoveManager.applySpecialDamageEffects(
            damageResult.specialMoveConfig,
            attacker,
            updatedTarget,
            damageDealt,
            battleId
          );

          if (specialEffectResult.success && specialEffectResult.effectMessage) {
            statusEffectMessage += specialEffectResult.effectMessage;
          }
        }
      }

      // Calculate word count bonus
      const wordCount = message.split(' ').filter(word => word.length > 0).length;
      
      // Create battle turn
      const turn = await BattleTurn.create({
        battle_id: battleId,
        turn_number: await this.getCurrentTurnNumber(battleId),
        participant_id: participant.id,
        monster_id: attacker.id,
        action_type: 'attack',
        action_data: {
          move_name: moveName,
          target_id: target.id,
          target_name: targetName || target.monster_data.name
        },
        result_data: damageResult,
        damage_dealt: damageDealt,
        message_content: message,
        word_count: wordCount
      });

      // Update participant message count
      await BattleParticipant.addMessage(participant.id, wordCount);

      // Get attacker image for display
      const attackerImage = attacker.monster_data.img_link || attacker.monster_data.image_link || '';
      let imageDisplay = '';
      if (attackerImage) {
        imageDisplay = `\n🖼️ ${attackerImage}`;
      }
      
      // Debug: log monster data to see what fields are available
      console.log('Attack monster data debug:', {
        name: attacker.monster_data.name,
        img_link: attacker.monster_data.img_link,
        image_link: attacker.monster_data.image_link,
        keys: Object.keys(attacker.monster_data)
      });

      // Log the action with enhanced information
      const enhancedMessage = `${imageDisplay}\n${damageResult.message}${healthInfo}${statusEffectMessage}`;
      await this.logAndSendBattleAction(battleId, enhancedMessage, {
        participant_id: participant.id,
        turn_number: turn.turn_number
      });

      // Handle switch out requirement (after logging the move)
      if (damageResult.requiresSwitchOut) {
        return await this.handleSwitchOut(battleId, participant, attacker, enhancedMessage);
      }

      // Check if target fainted
      if (damageResult.hits && damageDealt > 0) {
        const updatedTarget = await BattleMonster.getById(target.id);
        console.log('=== CHECKING TARGET FAINT STATUS ===');
        console.log('Updated target:', {
          id: updatedTarget.id,
          current_hp: updatedTarget.current_hp,
          is_fainted: updatedTarget.is_fainted,
          monster_name: updatedTarget.monster_data?.name
        });

        if (updatedTarget.is_fainted || updatedTarget.current_hp <= 0) {
          console.log('=== TARGET FAINTED - CALLING KNOCKOUT HANDLER ===');
          // Handle knockout and award levels
          const BattleManager = require('./BattleManager');
          await BattleManager.handleMonsterKnockout(battleId, updatedTarget);
          console.log('=== KNOCKOUT HANDLER COMPLETED ===');
        } else {
          console.log('=== TARGET STILL ALIVE ===');
        }
      }

      // Check if battle should end
      const battleEndResult = await BattleManager.checkBattleConditions(battleId);
      if (battleEndResult) {
        await BattleManager.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
        return {
          success: true,
          message: `${damageResult.message}\n\n${battleEndResult.message}`,
          battleEnded: true,
          result: battleEndResult.result,
          winner_type: battleEndResult.winner_type
        };
      }

      // Note: Turn advancement and AI processing handled by controller
      // to ensure proper order: advance turn first, then process AI turns

      return {
        success: true,
        message: damageResult.message,
        damageDealt,
        wordCount,
        battleEnded: false
      };

    } catch (error) {
      console.error('Error executing attack:', error);
      throw error;
    }
  }

  /**
   * Use an item in battle
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} itemName - Item name
   * @param {string} targetName - Target monster name (optional)
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Item use result
   */
  async useItem(battleId, discordUserId, itemName, targetName, message) {
    try {
      // Get participant
      const participant = await BattleParticipant.getByBattleAndUser(battleId, discordUserId);
      if (!participant) {
        throw new Error('You are not participating in this battle');
      }

      // Check if trainer has the item
      const trainer = await Trainer.getById(participant.trainer_id);
      if (!trainer) {
        throw new Error('Trainer not found');
      }

      // Validate item in inventory
      const hasItem = await this.validateTrainerItem(trainer.id, itemName);
      if (!hasItem) {
        throw new Error(`You don't have any "${itemName}" in your inventory`);
      }

      // Get target (could be own monster or opponent for pokeballs)
      const target = await this.getItemTarget(battleId, participant, itemName, targetName);
      if (!target) {
        throw new Error('Invalid target for item');
      }

      // Use the item
      const itemResult = await this.applyItemEffect(target, itemName, participant);

      // Calculate word count bonus
      const wordCount = message.split(' ').filter(word => word.length > 0).length;

      // Create battle turn
      const turn = await BattleTurn.create({
        battle_id: battleId,
        turn_number: await this.getCurrentTurnNumber(battleId),
        participant_id: participant.id,
        monster_id: target.id,
        action_type: 'item',
        action_data: {
          item_name: itemName,
          target_id: target.id,
          target_name: targetName || target.monster_data.name
        },
        result_data: itemResult,
        message_content: message,
        word_count: wordCount
      });

      // Update participant message count
      await BattleParticipant.addMessage(participant.id, wordCount);

      // Consume item from inventory
      await Trainer.updateInventoryItem(trainer.id, 'items', itemName, -1);

      // Log the action
      await this.logAndSendBattleAction(battleId, itemResult.message, {
        participant_id: participant.id,
        turn_number: turn.turn_number
      });

      // Process AI turns if needed (after player action)
      await this.processAITurns(battleId);

      return {
        message: itemResult.message,
        wordCount,
        itemResult
      };

    } catch (error) {
      console.error('Error using item:', error);
      throw error;
    }
  }

  /**
   * Get target monster for attack
   * @param {number} battleId - Battle ID
   * @param {string} attackerTeam - Attacker team side
   * @param {string} targetName - Target monster name (optional)
   * @returns {Promise<Object|null>} Target monster
   */
  async getTargetMonster(battleId, attackerTeam, targetName) {
    try {
      const opponentTeam = attackerTeam === 'players' ? 'opponents' : 'players';
      const opponentMonsters = await BattleMonster.getByBattle(battleId, {
        teamSide: opponentTeam,
        isActive: true
      });

      const validTargets = opponentMonsters.filter(m => !m.is_fainted);

      if (validTargets.length === 0) {
        return null;
      }

      // If target name is specified, find by name or index
      if (targetName) {
        // Check if targetName is a number (index-based targeting)
        const targetIndex = parseInt(targetName);
        if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= validTargets.length) {
          return validTargets[targetIndex - 1]; // Convert to 0-based index
        }

        // Check for name-based targeting
        const namedTarget = validTargets.find(m =>
          m.monster_data.name &&
          m.monster_data.name.toLowerCase() === targetName.toLowerCase()
        );
        if (namedTarget) {
          return namedTarget;
        }

        // Check for partial name matches (for wild monsters like "Wild Pikachu #1")
        const partialTarget = validTargets.find(m =>
          m.monster_data.name &&
          m.monster_data.name.toLowerCase().includes(targetName.toLowerCase())
        );
        if (partialTarget) {
          return partialTarget;
        }

        // If named target not found, throw error for better user feedback
        throw new Error(`Target "${targetName}" not found. Use a number (1-${validTargets.length}) or monster name.`);
      }

      // Default to first available target
      return validTargets[0];
    } catch (error) {
      console.error('Error getting target monster:', error);
      return null;
    }
  }

  /**
   * Get target for item use
   * @param {number} battleId - Battle ID
   * @param {Object} participant - Participant data
   * @param {string} itemName - Item name
   * @param {string} targetName - Target monster name (optional)
   * @returns {Promise<Object|null>} Target monster
   */
  async getItemTarget(battleId, participant, itemName, targetName) {
    try {
      // For healing items, target own monsters
      if (this.isHealingItem(itemName)) {
        const ownMonsters = await BattleMonster.getByBattle(battleId, {
          participantId: participant.id
        });
        const validTargets = ownMonsters.filter(m => !m.is_fainted);

        if (validTargets.length === 0) {
          return null;
        }

        // If target name is specified, find by name or index
        if (targetName) {
          // Check if targetName is a number (index-based targeting)
          const targetIndex = parseInt(targetName);
          if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= validTargets.length) {
            return validTargets[targetIndex - 1]; // Convert to 0-based index
          }

          // Check for name-based targeting
          const namedTarget = validTargets.find(m =>
            m.monster_data.name &&
            m.monster_data.name.toLowerCase() === targetName.toLowerCase()
          );
          if (namedTarget) {
            return namedTarget;
          }

          // Check for partial name matches
          const partialTarget = validTargets.find(m =>
            m.monster_data.name &&
            m.monster_data.name.toLowerCase().includes(targetName.toLowerCase())
          );
          if (partialTarget) {
            return partialTarget;
          }
        }

        // Default to first active monster
        return validTargets.find(m => m.is_active) || validTargets[0];
      }

      // For pokeballs, target opponent monsters
      if (this.isPokeball(itemName)) {
        return this.getTargetMonster(battleId, participant.team_side, targetName);
      }

      return null;
    } catch (error) {
      console.error('Error getting item target:', error);
      return null;
    }
  }

  /**
   * Apply item effect
   * @param {Object} target - Target monster
   * @param {string} itemName - Item name
   * @param {Object} participant - Participant data
   * @returns {Promise<Object>} Item effect result
   */
  async applyItemEffect(target, itemName, participant) {
    try {
      if (this.isHealingItem(itemName)) {
        return this.applyHealingItem(target, itemName);
      } else if (this.isPokeball(itemName)) {
        return this.attemptCapture(target, itemName, participant);
      }

      throw new Error(`Unknown item type: ${itemName}`);
    } catch (error) {
      console.error('Error applying item effect:', error);
      throw error;
    }
  }

  /**
   * Apply healing item effect
   * @param {Object} target - Target monster
   * @param {string} itemName - Item name
   * @returns {Promise<Object>} Healing result
   */
  async applyHealingItem(target, itemName) {
    try {
      const healingItems = {
        'Potion': { heal_amount: 20 },
        'Super Potion': { heal_amount: 50 },
        'Hyper Potion': { heal_amount: 200 },
        'Max Potion': { heal_percentage: 100 },
        'Full Restore': { heal_percentage: 100, removes_status: true }
      };

      const itemData = healingItems[itemName];
      if (!itemData) {
        throw new Error(`Unknown healing item: ${itemName}`);
      }

      const healResult = DamageCalculator.calculateHealing(null, target.monster_data, itemData);
      await BattleMonster.heal(target.id, healResult.healAmount);

      return {
        message: `${participant.trainer_name} used ${itemName}! ${healResult.message}`,
        healAmount: healResult.healAmount
      };
    } catch (error) {
      console.error('Error applying healing item:', error);
      throw error;
    }
  }

  /**
   * Check if item is a healing item
   * @param {string} itemName - Item name
   * @returns {boolean} Is healing item
   */
  isHealingItem(itemName) {
    const healingItems = ['Potion', 'Super Potion', 'Hyper Potion', 'Max Potion', 'Full Restore'];
    return healingItems.includes(itemName);
  }

  /**
   * Check if item is a pokeball
   * @param {string} itemName - Item name
   * @returns {boolean} Is pokeball
   */
  isPokeball(itemName) {
    return itemName.toLowerCase().includes('ball');
  }

  /**
   * Validate trainer has item
   * @param {number} trainerId - Trainer ID
   * @param {string} itemName - Item name
   * @returns {Promise<boolean>} Has item
   */
  async validateTrainerItem(trainerId, itemName) {
    try {
      const TrainerInventory = require('../models/TrainerInventory');
      const item = await TrainerInventory.getItemByTrainerAndName(trainerId, itemName);
      return item && item.quantity > 0;
    } catch (error) {
      console.error('Error validating trainer item:', error);
      return false;
    }
  }

  /**
   * Get current turn number
   * @param {number} battleId - Battle ID
   * @returns {Promise<number>} Current turn number
   */
  async getCurrentTurnNumber(battleId) {
    try {
      const battle = await BattleInstance.getById(battleId);
      return battle ? battle.current_turn : 1;
    } catch (error) {
      console.error('Error getting current turn number:', error);
      return 1;
    }
  }

  /**
   * Process AI turns
   * @param {number} battleId - Battle ID
   */
  async processAITurns(battleId) {
    try {
      console.log('=== PROCESSING AI TURNS ===');
      const battleState = await BattleManager.getBattleState(battleId);

      console.log('Battle state:', {
        isActive: battleState.isActive,
        currentParticipant: battleState.currentParticipant ? {
          id: battleState.currentParticipant.id,
          name: battleState.currentParticipant.trainer_name,
          type: battleState.currentParticipant.participant_type
        } : null
      });

      // Process AI turns until it's a player's turn or battle ends
      let iterations = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (battleState.isActive && battleState.currentParticipant && iterations < maxIterations) {
        iterations++;
        const currentParticipant = battleState.currentParticipant;

        console.log(`=== AI TURN ITERATION ${iterations} ===`);
        console.log('Current participant:', {
          id: currentParticipant.id,
          name: currentParticipant.trainer_name,
          type: currentParticipant.participant_type
        });

        // If current participant is a player, stop
        if (currentParticipant.participant_type === 'player') {
          console.log('Current participant is player, stopping AI processing');
          break;
        }

        console.log('Processing AI turn...');
        // Process AI turn
        const aiAction = await BattleAI.processAITurn(currentParticipant, battleState);
        console.log('AI action:', aiAction);

        // Execute AI action based on type
        if (aiAction.action_type === 'attack') {
          console.log('Executing AI attack...');
          await this.executeAIAttack(battleId, currentParticipant, aiAction);
        } else if (aiAction.action_type === 'item') {
          console.log('Executing AI item use...');
          await this.executeAIItem(battleId, currentParticipant, aiAction);
        } else {
          console.log('AI action type not handled:', aiAction.action_type);
        }

        // Check if battle ended
        const battleEndResult = await BattleManager.checkBattleConditions(battleId);
        if (battleEndResult) {
          console.log('Battle ended, stopping AI processing');
          await BattleManager.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
          break;
        }

        // Move to next turn
        console.log('Advancing to next turn...');
        await BattleManager.advanceTurn(battleId);

        // Refresh battle state
        const newBattleState = await BattleManager.getBattleState(battleId);
        if (!newBattleState.isActive) {
          console.log('Battle no longer active, stopping AI processing');
          break;
        }

        // Update battle state for next iteration
        Object.assign(battleState, newBattleState);

        console.log('Updated battle state for next iteration');
      }

      if (iterations >= maxIterations) {
        console.warn('AI turn processing stopped due to max iterations reached');
      }

      console.log('=== AI TURNS PROCESSING COMPLETE ===');
    } catch (error) {
      console.error('Error processing AI turns:', error);
    }
  }

  /**
   * Execute AI attack
   * @param {number} battleId - Battle ID
   * @param {Object} participant - AI participant
   * @param {Object} aiAction - AI action
   */
  async executeAIAttack(battleId, participant, aiAction) {
    try {
      // Similar to executeAttack but for AI
      const { move_name, target_id } = aiAction.action_data;
      
      // Get AI monster
      const aiMonster = await BattleMonster.getActiveByParticipant(participant.id);
      if (aiMonster.length === 0) return;
      
      const attacker = aiMonster[0];
      const target = await BattleMonster.getById(target_id);
      if (!target) return;

      // Get move data
      const move = await Move.getByName(move_name);
      if (!move) return;

      // Calculate and apply damage (pass battleId for status move processing)
      const damageResult = await DamageCalculator.calculateDamage(
        attacker.monster_data,
        target.monster_data,
        move,
        { battleId }
      );

      let damageDealt = 0;
      if (damageResult.hits) {
        const damageApplied = await BattleMonster.dealDamage(target.id, damageResult.damage);
        damageDealt = damageApplied.damage_dealt;
      }

      // Create turn record
      await BattleTurn.create({
        battle_id: battleId,
        turn_number: await this.getCurrentTurnNumber(battleId),
        participant_id: participant.id,
        monster_id: attacker.id,
        action_type: 'attack',
        action_data: aiAction.action_data,
        result_data: damageResult,
        damage_dealt: damageDealt,
        message_content: aiAction.ai_message || '',
        word_count: aiAction.word_count || 0
      });

      // Log the action
      await this.logAndSendBattleAction(battleId, `${aiAction.ai_message}\n${damageResult.message}`, {
        participant_id: participant.id
      });

      // Check if target fainted after AI attack
      if (damageResult.hits && damageDealt > 0) {
        const updatedTarget = await BattleMonster.getById(target.id);
        console.log('=== CHECKING AI ATTACK TARGET FAINT STATUS ===');
        console.log('Updated target:', {
          id: updatedTarget.id,
          current_hp: updatedTarget.current_hp,
          is_fainted: updatedTarget.is_fainted,
          monster_name: updatedTarget.monster_data?.name
        });

        if (updatedTarget.is_fainted || updatedTarget.current_hp <= 0) {
          console.log('=== AI ATTACK CAUSED KNOCKOUT ===');
          // Handle knockout and award levels
          const BattleManager = require('./BattleManager');
          await BattleManager.handleMonsterKnockout(battleId, updatedTarget);
          console.log('=== AI KNOCKOUT HANDLER COMPLETED ===');

          // Check if battle should end
          const battleEndResult = await BattleManager.checkBattleConditions(battleId);
          if (battleEndResult) {
            await BattleManager.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
            return { battleEnded: true, result: battleEndResult };
          }
        } else {
          console.log('=== AI ATTACK TARGET STILL ALIVE ===');
        }
      }

    } catch (error) {
      console.error('Error executing AI attack:', error);
    }
  }

  /**
   * Execute AI item use
   * @param {number} battleId - Battle ID
   * @param {Object} participant - AI participant
   * @param {Object} aiAction - AI action
   */
  async executeAIItem(battleId, participant, aiAction) {
    try {
      // AI item usage (simplified)
      const { item_name, target_id } = aiAction.action_data;
      const target = await BattleMonster.getById(target_id);

      if (target && this.isHealingItem(item_name)) {
        const healResult = await this.applyHealingItem(target, item_name);

        await BattleTurn.create({
          battle_id: battleId,
          turn_number: await this.getCurrentTurnNumber(battleId),
          participant_id: participant.id,
          monster_id: target.id,
          action_type: 'item',
          action_data: aiAction.action_data,
          result_data: healResult,
          message_content: aiAction.ai_message || '',
          word_count: aiAction.word_count || 0
        });

        await this.logAndSendBattleAction(battleId, `${aiAction.ai_message}\n${healResult.message}`, {
          participant_id: participant.id
        });
      }
    } catch (error) {
      console.error('Error executing AI item:', error);
    }
  }

  /**
   * Release a monster to the battlefield
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} monsterName - Monster name
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Release result
   */
  async releaseMonster(battleId, discordUserId, monsterName, message) {
    try {
      // Get participant
      const participant = await BattleParticipant.getByBattleAndUser(battleId, discordUserId);
      if (!participant) {
        throw new Error('You are not participating in this battle');
      }

      // Check if battle is waiting for a switch out
      const BattleInstance = require('../models/BattleInstance');
      const battle = await BattleInstance.getById(battleId);
      const waitingForSwitch = battle.battle_data?.waiting_for_switch;
      let isSwitchCompletion = false;

      if (waitingForSwitch && waitingForSwitch.participant_id === participant.id) {
        // Clear the switch state first
        await this.completeSwitchOut(battleId, participant, monsterName, message, waitingForSwitch);
        // Continue with normal release logic, but mark it as a switch completion
        isSwitchCompletion = true;
        console.log('Continuing with normal release logic for switch completion');
      }

      // Find the monster by name in trainer's collection
      const Monster = require('../models/Monster');
      const monsters = await Monster.getByTrainerId(participant.trainer_id);
      const targetMonster = monsters.find(m =>
        m.name && m.name.toLowerCase() === monsterName.toLowerCase()
      );

      if (!targetMonster) {
        throw new Error(`Monster "${monsterName}" not found in your collection`);
      }

      // Check if monster is already in battle
      const alreadyInBattle = await BattleMonster.getByBattleAndMonster(battleId, targetMonster.id);
      if (alreadyInBattle) {
        if (alreadyInBattle.is_active) {
          throw new Error(`${monsterName} is already active in battle`);
        } else if (alreadyInBattle.is_fainted || alreadyInBattle.current_hp <= 0) {
          throw new Error(`${monsterName} is fainted and cannot be released`);
        } else {
          // Reactivate the monster
          await BattleMonster.setActive(alreadyInBattle.id);

          // Calculate word count bonus
          const wordCount = message.split(' ').filter(word => word.length > 0).length;

          // Create battle turn
          await BattleTurn.create({
            battle_id: battleId,
            turn_number: await this.getCurrentTurnNumber(battleId),
            participant_id: participant.id,
            monster_id: alreadyInBattle.id,
            action_type: 'switch',
            action_data: { monster_name: monsterName, action: 'release' },
            message_content: message,
            word_count: wordCount
          });

          // Update participant message count
          await BattleParticipant.addMessage(participant.id, wordCount);

          // Get monster image for display
          const monsterImage = targetMonster.img_link || targetMonster.image_link || '';
          let imageDisplay = '';
          if (monsterImage) {
            imageDisplay = `\n🖼️ ${monsterImage}`;
          }
          
          // Debug: log monster data
          console.log('Release monster (reactivate) debug:', {
            name: targetMonster.name,
            img_link: targetMonster.img_link,
            image_link: targetMonster.image_link,
            keys: Object.keys(targetMonster)
          });

          // Get monster health info
          const healthBar = this.generateHealthBar(alreadyInBattle.current_hp, alreadyInBattle.max_hp);
          const healthInfo = `\n❤️ **${monsterName}**: ${alreadyInBattle.current_hp}/${alreadyInBattle.max_hp} HP (${Math.round((alreadyInBattle.current_hp / alreadyInBattle.max_hp) * 100)}%)\n${healthBar}`;

          // Log the action
          await this.logAndSendBattleAction(battleId, `${imageDisplay}\n🔄 **${participant.trainer_name}** sent out **${monsterName}**!${healthInfo}`, {
            participant_id: participant.id
          });

          // If this is a switch completion, advance the turn
          if (isSwitchCompletion) {
            const BattleManager = require('./BattleManager');
            await BattleManager.advanceTurn(battleId);
            await BattleManager.processCurrentTurn(battleId);
            console.log('Turn advanced after switch completion');
          }

          return {
            message: `${monsterName} is back in the battle!`,
            wordCount,
            switchCompleted: isSwitchCompletion
          };
        }
      }

      // Add new monster to battle using BattleManager
      const BattleManager = require('./BattleManager');
      const battleMonster = await BattleManager.addMonsterToBattle(battleId, participant.id, targetMonster);

      // Calculate word count bonus
      const wordCount = message.split(' ').filter(word => word.length > 0).length;

      // Create battle turn
      await BattleTurn.create({
        battle_id: battleId,
        turn_number: await this.getCurrentTurnNumber(battleId),
        participant_id: participant.id,
        monster_id: battleMonster.id,
        action_type: 'switch',
        action_data: { monster_name: monsterName, action: 'release' },
        message_content: message,
        word_count: wordCount
      });

      // Update participant message count
      await BattleParticipant.addMessage(participant.id, wordCount);

      // Get monster image for display
      const monsterImage = targetMonster.img_link || targetMonster.image_link || '';
      let imageDisplay = '';
      if (monsterImage) {
        imageDisplay = `\n🖼️ ${monsterImage}`;
      }
      
      // Debug: log monster data
      console.log('Release monster (new) debug:', {
        name: targetMonster.name,
        img_link: targetMonster.img_link,
        image_link: targetMonster.image_link,
        keys: Object.keys(targetMonster)
      });

      // Get monster health info
      const healthBar = this.generateHealthBar(battleMonster.current_hp, battleMonster.max_hp);
      const healthInfo = `\n❤️ **${monsterName}**: ${battleMonster.current_hp}/${battleMonster.max_hp} HP (100%)\n${healthBar}`;

      // Log the action
      await this.logAndSendBattleAction(battleId, `${imageDisplay}\n🔄 **${participant.trainer_name}** sent out **${monsterName}**!${healthInfo}`, {
        participant_id: participant.id
      });

      // If this is a switch completion, advance the turn
      if (isSwitchCompletion) {
        const BattleManager = require('./BattleManager');
        await BattleManager.advanceTurn(battleId);
        await BattleManager.processCurrentTurn(battleId);
        console.log('Turn advanced after switch completion');
      }

      return {
        message: `${monsterName} enters the battle!`,
        wordCount,
        switchCompleted: isSwitchCompletion
      };

    } catch (error) {
      console.error('Error releasing monster:', error);
      throw error;
    }
  }

  /**
   * Withdraw a monster from the battlefield
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} monsterName - Monster name
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Withdraw result
   */
  async withdrawMonster(battleId, discordUserId, monsterName, message) {
    try {
      // Get participant
      const participant = await BattleParticipant.getByBattleAndUser(battleId, discordUserId);
      if (!participant) {
        throw new Error('You are not participating in this battle');
      }

      // Find the monster in battle
      const battleMonsters = await BattleMonster.getByBattle(battleId, {
        participantId: participant.id
      });

      const targetBattleMonster = battleMonsters.find(bm =>
        bm.monster_data.name &&
        bm.monster_data.name.toLowerCase() === monsterName.toLowerCase() &&
        bm.is_active
      );

      if (!targetBattleMonster) {
        throw new Error(`${monsterName} is not currently active in battle`);
      }

      // Check if this is the last active monster
      const activeMonsters = battleMonsters.filter(bm => bm.is_active && !bm.is_fainted);
      if (activeMonsters.length <= 1) {
        throw new Error('You cannot withdraw your last active monster');
      }

      // Withdraw the monster
      await BattleMonster.setInactive(targetBattleMonster.id);

      // Calculate word count bonus
      const wordCount = message.split(' ').filter(word => word.length > 0).length;

      // Create battle turn
      await BattleTurn.create({
        battle_id: battleId,
        turn_number: await this.getCurrentTurnNumber(battleId),
        participant_id: participant.id,
        monster_id: targetBattleMonster.id,
        action_type: 'switch',
        action_data: { monster_name: monsterName, action: 'withdraw' },
        message_content: message,
        word_count: wordCount
      });

      // Update participant message count
      await BattleParticipant.addMessage(participant.id, wordCount);

      // Log the action
      await this.logAndSendBattleAction(battleId, `↩️ **${participant.trainer_name}** withdrew **${monsterName}**!`, {
        participant_id: participant.id
      });

      return {
        message: `${monsterName} has been withdrawn from battle!`,
        wordCount
      };

    } catch (error) {
      console.error('Error withdrawing monster:', error);
      throw error;
    }
  }

  /**
   * Log battle action and send to Discord
   * @param {number} battleId - Battle ID
   * @param {string} message - Message to log and send
   * @param {Object} options - Additional options for logging
   */
  async logAndSendBattleAction(battleId, message, options = {}) {
    try {
      // Log to database
      await BattleLog.logAction(battleId, message, options);

      // Send to Discord thread
      const BattleManager = require('./BattleManager');
      await BattleManager.sendBattleMessageToDiscord(battleId, message);

    } catch (error) {
      console.error('Error logging and sending battle action:', error);
      // Don't throw error - battle should continue even if logging fails
    }
  }

  /**
   * Generate a visual health bar
   * @param {number} currentHp - Current HP
   * @param {number} maxHp - Maximum HP
   * @returns {string} Health bar string
   */
  generateHealthBar(currentHp, maxHp) {
    const barLength = 20;
    const hpPercent = currentHp / maxHp;
    const filledBars = Math.floor(hpPercent * barLength);
    const emptyBars = barLength - filledBars;

    let healthColor = '🟢'; // Green
    if (hpPercent < 0.25) {
      healthColor = '🔴'; // Red
    } else if (hpPercent < 0.5) {
      healthColor = '🟡'; // Yellow
    }

    const bar = healthColor.repeat(filledBars) + '⬜'.repeat(emptyBars);
    return `[${bar}]`;
  }

  /**
   * Handle switch out requirement after using moves like Parting Shot
   * @param {number} battleId - Battle ID
   * @param {Object} participant - Participant data
   * @param {Object} currentMonster - Current monster that needs to switch out
   * @param {string} moveMessage - Message from the move execution
   * @returns {Promise<Object>} Switch out result
   */
  async handleSwitchOut(battleId, participant, currentMonster, moveMessage) {
    try {
      console.log('=== HANDLING SWITCH OUT ===');
      console.log('Participant:', participant.trainer_name);
      console.log('Current monster:', currentMonster.monster_data?.name);

      // Withdraw the current monster from battle (deactivate and remove from battle)
      await BattleMonster.update(currentMonster.id, { is_active: false });

      // Create switch prompt message - player can use any monster from their collection
      const switchPromptMessage = `${moveMessage}\n\n🔄 **${participant.trainer_name}** must choose a monster to switch in!\n\n**Use:** \`/release [monster name]\` to send in a monster from your collection.`;

      // Log the switch prompt
      await this.logAndSendBattleAction(battleId, switchPromptMessage, {
        participant_id: participant.id,
        action_type: 'switch_out_prompt'
      });

      // Set battle state to waiting for switch
      const BattleInstance = require('../models/BattleInstance');
      const battle = await BattleInstance.getById(battleId);
      await BattleInstance.update(battleId, {
        battle_data: {
          ...battle.battle_data || {},
          waiting_for_switch: {
            participant_id: participant.id,
            discord_user_id: participant.discord_user_id,
            switched_out_monster_id: currentMonster.id
          }
        }
      });

      console.log('Switch out completed, waiting for player to release new monster');

      return {
        success: true,
        message: 'Switch out initiated',
        requiresPlayerAction: true,
        waitingForSwitch: true
      };

    } catch (error) {
      console.error('Error handling switch out:', error);
      throw error;
    }
  }

  /**
   * Complete switch out by activating the selected monster
   * @param {number} battleId - Battle ID
   * @param {Object} participant - Participant data
   * @param {string} monsterIdentifier - Monster name or number
   * @param {string} message - Battle message
   * @param {Object} waitingForSwitch - Switch out data
   * @returns {Promise<Object>} Switch completion result
   */
  async completeSwitchOut(battleId, participant, monsterIdentifier, message, waitingForSwitch) {
    try {
      console.log('=== COMPLETING SWITCH OUT ===');
      console.log('Monster identifier:', monsterIdentifier);
      console.log('Waiting for switch data:', waitingForSwitch);

      // The regular releaseMonster logic will handle finding the monster from trainer's collection
      // and creating a new BattleMonster record. We just need to clear the waiting state
      // and advance the turn after the monster is released.

      // Clear the waiting for switch state
      const BattleInstance = require('../models/BattleInstance');
      const battle = await BattleInstance.getById(battleId);
      const updatedBattleData = { ...battle.battle_data };
      delete updatedBattleData.waiting_for_switch;

      await BattleInstance.update(battleId, {
        battle_data: updatedBattleData
      });

      console.log('Switch out state cleared, normal release process will continue');

      // Return a marker that indicates this was a switch completion
      // The regular releaseMonster logic will handle the rest
      return {
        isSwitchCompletion: true,
        shouldAdvanceTurn: true
      };

    } catch (error) {
      console.error('Error completing switch out:', error);
      throw error;
    }
  }
}

module.exports = new BattleActionService();
