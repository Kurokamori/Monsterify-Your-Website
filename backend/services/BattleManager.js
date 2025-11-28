const BattleInstance = require('../models/BattleInstance');
const BattleParticipant = require('../models/BattleParticipant');
const BattleMonster = require('../models/BattleMonster');
const BattleTurn = require('../models/BattleTurn');
const BattleLog = require('../models/BattleLog');
const Move = require('../models/Move');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');

/**
 * BattleManager service for handling battle logic and state management
 */
class BattleManager {
  constructor() {
    this.activeBattles = new Map(); // Cache for active battles
  }

  /**
   * Initialize a new battle from an encounter
   * @param {Object} encounter - Adventure encounter data
   * @param {string} discordUserId - Discord user ID who initiated the battle
   * @returns {Promise<Object>} Created battle instance
   */
  async initializeBattle(encounter, discordUserId) {
    try {
      console.log('BattleManager.initializeBattle called');
      console.log('Encounter:', JSON.stringify(encounter, null, 2));
      console.log('Discord User ID:', discordUserId);

      // Determine battle type based on encounter
      const battleType = this.determineBattleType(encounter);
      console.log('Determined battle type:', battleType);
      
      // Create battle instance
      console.log('Creating battle instance with data:', {
        adventure_id: encounter.adventure_id,
        encounter_id: encounter.id,
        battle_type: battleType,
        created_by_discord_user_id: discordUserId,
        battle_data: {
          encounter_data: encounter.encounter_data,
          initialized_at: new Date().toISOString()
        }
      });

      const battle = await BattleInstance.create({
        adventure_id: encounter.adventure_id,
        encounter_id: encounter.id,
        battle_type: battleType,
        created_by_discord_user_id: discordUserId,
        battle_data: {
          encounter_data: encounter.encounter_data,
          initialized_at: new Date().toISOString()
        }
      });

      console.log('Created battle instance:', battle);

      // Initialize participants based on encounter type
      await this.initializeParticipants(battle, encounter, discordUserId);

      // Log battle start
      await BattleLog.logSystem(battle.id, `🔥 **BATTLE STARTED!** 🔥\nType: ${battleType.toUpperCase()}`);

      // Send battle start message to Discord
      await this.sendBattleMessageToDiscord(battle.id, `🔥 **BATTLE STARTED!** 🔥\nType: ${battleType.toUpperCase()}`);

      // Don't send turn order message yet - will be sent when first player joins
      console.log('Battle initialized - waiting for players to join');

      // Cache the battle
      this.activeBattles.set(battle.id, battle);

      return battle;
    } catch (error) {
      console.error('Error initializing battle:', error);
      throw error;
    }
  }

  /**
   * Determine battle type from encounter data
   * @param {Object} encounter - Encounter data
   * @returns {string} Battle type
   */
  determineBattleType(encounter) {
    console.log('Determining battle type for encounter:', JSON.stringify(encounter, null, 2));

    if (encounter.encounter_type === 'wild') {
      console.log('Battle type: wild (encounter_type is wild)');
      return 'wild';
    } else if (encounter.encounter_type === 'battle') {
      // Check if it's trainer vs trainer or trainer vs wild monsters
      const encounterData = encounter.encounter_data;
      console.log('Encounter data for battle type determination:', JSON.stringify(encounterData, null, 2));

      if (encounterData.trainers && encounterData.trainers.length > 0) {
        console.log('Battle type: trainer (found trainers in encounter data)');
        return 'trainer';
      } else {
        console.log('Battle type: wild (no trainers found in encounter data)');
        return 'wild';
      }
    }
    console.log('Battle type: wild (default fallback)');
    return 'wild'; // Default
  }

  /**
   * Initialize battle participants
   * @param {Object} battle - Battle instance
   * @param {Object} encounter - Encounter data
   * @param {string} discordUserId - Discord user ID
   */
  async initializeParticipants(battle, encounter, discordUserId) {
    try {
      console.log('Initializing participants for battle:', battle.id);
      console.log('Battle type:', battle.battle_type);
      console.log('Encounter data:', encounter.encounter_data);

      // Don't create player participants here - they'll be created when players join with /battle [trainer_name]
      console.log('Skipping initial player participant creation - will be created on join');

      // Add opponent participants based on encounter type
      if (battle.battle_type === 'wild') {
        await this.initializeWildOpponents(battle, encounter.encounter_data);
      } else if (battle.battle_type === 'trainer') {
        await this.initializeTrainerOpponents(battle, encounter.encounter_data);
      }

      // Initialize monsters for all participants
      await this.initializeAllMonsters(battle.id);

      // Verify participants were created
      const allParticipants = await BattleParticipant.getByBattle(battle.id);
      console.log('All participants after initialization:', allParticipants);

    } catch (error) {
      console.error('Error initializing participants:', error);
      throw error;
    }
  }

  /**
   * Initialize wild monster opponents
   * @param {Object} battle - Battle instance
   * @param {Object} encounterData - Encounter data
   */
  async initializeWildOpponents(battle, encounterData) {
    try {
      console.log('Initializing wild opponents with encounter data:', encounterData);

      if (encounterData.groups && encounterData.groups.length > 0) {
        for (let i = 0; i < encounterData.groups.length; i++) {
          const group = encounterData.groups[i];

          // Create a wild participant for each group
          const participant = await BattleParticipant.create({
            battle_id: battle.id,
            participant_type: 'wild',
            trainer_name: `Wild Group ${i + 1}`,
            team_side: 'opponents',
            turn_order: i + 1
          });

          console.log('Created wild participant:', participant);
        }
      } else if (encounterData.monsters && encounterData.monsters.length > 0) {
        // Handle direct monster array (from auto-battles or converted encounters)
        console.log('Found direct monsters array for wild encounter:', encounterData.monsters);

        // Create a single wild participant for all monsters
        const participant = await BattleParticipant.create({
          battle_id: battle.id,
          participant_type: 'wild',
          trainer_name: 'Wild Monsters',
          team_side: 'opponents',
          turn_order: 1
        });

        console.log('Created wild participant for direct monsters:', participant);
      } else {
        console.warn('No groups or monsters found in wild encounter data');
      }
    } catch (error) {
      console.error('Error initializing wild opponents:', error);
      throw error;
    }
  }

  /**
   * Initialize trainer opponents
   * @param {Object} battle - Battle instance
   * @param {Object} encounterData - Encounter data
   */
  async initializeTrainerOpponents(battle, encounterData) {
    try {
      console.log('Initializing trainer opponents with data:', encounterData);

      if (encounterData.trainers) {
        console.log('Creating trainer participants for:', encounterData.trainers);
        for (let i = 0; i < encounterData.trainers.length; i++) {
          const trainer = encounterData.trainers[i];

          const participant = await BattleParticipant.create({
            battle_id: battle.id,
            participant_type: 'npc',
            trainer_name: trainer.name || `Enemy Trainer ${i + 1}`,
            team_side: 'opponents',
            turn_order: i + 1
          });
          console.log('Created trainer participant:', participant);
        }
      }

      // In trainer battles, monsters belong to the trainers, not separate participants
      console.log('Trainer battle - monsters will be assigned to trainer participants');
    } catch (error) {
      console.error('Error initializing trainer opponents:', error);
      throw error;
    }
  }

  /**
   * Initialize monsters for all participants
   * @param {number} battleId - Battle ID
   */
  async initializeAllMonsters(battleId) {
    try {
      const participants = await BattleParticipant.getByBattle(battleId);
      console.log('Initializing monsters for participants:', participants);

      for (const participant of participants) {
        if (participant.participant_type === 'player') {
          // For players, we'll add monsters when they join with specific trainers
          console.log('Skipping player participant:', participant.id);
          continue;
        } else {
          // For wild/NPC participants, generate monsters from encounter data
          console.log('Generating monsters for participant:', participant);
          await this.generateOpponentMonsters(participant);
        }
      }

      // Verify monsters were created
      const BattleMonster = require('../models/BattleMonster');
      const allMonsters = await BattleMonster.getByBattle(battleId);
      console.log('All monsters after initialization:', allMonsters);
    } catch (error) {
      console.error('Error initializing monsters:', error);
      throw error;
    }
  }

  /**
   * Generate monsters for opponent participants
   * @param {Object} participant - Participant data
   */
  async generateOpponentMonsters(participant) {
    try {
      // Get battle data to determine what monsters to generate
      const battle = await BattleInstance.getById(participant.battle_id);
      const encounterData = battle.battle_data.encounter_data;

      console.log('Generating monsters for participant:', participant);
      console.log('Encounter data:', encounterData);

      if (participant.participant_type === 'wild') {
        // Handle wild monsters from auto-battles or wild encounters
        console.log('Generating wild monsters for participant:', participant.id);

        if (encounterData.monsters && encounterData.monsters.length > 0) {
          // Auto-battle wild monsters (already converted format)
          console.log('Using direct monsters array:', encounterData.monsters);
          for (let i = 0; i < encounterData.monsters.length; i++) {
            const monsterData = encounterData.monsters[i];
            console.log('Creating battle monster from direct data:', monsterData);
            await this.createBattleMonster(participant, monsterData, i);
          }
        } else if (encounterData.groups && encounterData.groups.length > 0) {
          // Regular wild encounter groups
          console.log('Converting groups to monsters:', encounterData.groups);
          const groups = encounterData.groups || [];

          // Find the group that corresponds to this participant
          const participantIndex = participant.turn_order - 1;
          if (participantIndex < groups.length) {
            const group = groups[participantIndex];

            // Convert group data to monster data
            const monsterData = {
              name: `Wild ${[group.species1, group.species2, group.species3].filter(Boolean).join('/')}`,
              species1: group.species1,
              species2: group.species2,
              species3: group.species3,
              type1: group.type1,
              type2: group.type2,
              type3: group.type3,
              type4: group.type4,
              type5: group.type5,
              attribute: group.attribute,
              level: group.level || 10,
              isWild: true
            };

            console.log('Creating battle monster from group data:', monsterData);
            await this.createBattleMonster(participant, monsterData, 0);
          } else {
            console.warn(`No group found for participant ${participant.id} at index ${participantIndex}`);
          }
        } else {
          console.warn('No monsters or groups found for wild participant');
        }
      } else if (participant.participant_type === 'npc') {
        // Handle trainer battle monsters
        if (encounterData.monsters && encounterData.monsters.length > 0) {
          console.log('Found monsters for NPC participant:', encounterData.monsters);
          // Battle encounter has monsters array at top level
          const monstersPerTrainer = Math.ceil(encounterData.monsters.length / (encounterData.trainers?.length || 1));
          const startIndex = (participant.turn_order - 1) * monstersPerTrainer;
          const endIndex = Math.min(startIndex + monstersPerTrainer, encounterData.monsters.length);

          console.log(`Assigning monsters ${startIndex} to ${endIndex - 1} to participant ${participant.id}`);

          for (let i = startIndex; i < endIndex; i++) {
            const monsterData = encounterData.monsters[i];
            console.log('Creating battle monster from data:', monsterData);
            await this.createBattleMonster(participant, monsterData, i - startIndex);
          }
        } else {
          // Fallback: generate monsters for trainer
          console.warn('No monsters found for trainer, generating fallback monsters');
          await this.generateFallbackTrainerMonsters(participant);
        }
      }
    } catch (error) {
      console.error('Error generating opponent monsters:', error);
      throw error;
    }
  }

  /**
   * Generate fallback monsters for a trainer participant
   * @param {Object} participant - Participant data
   */
  async generateFallbackTrainerMonsters(participant) {
    try {
      const MonsterRoller = require('../models/MonsterRoller');
      const monsterRoller = new MonsterRoller();

      // Generate 2-3 monsters for the trainer
      const monsterCount = Math.floor(Math.random() * 2) + 2; // 2-3 monsters

      for (let i = 0; i < monsterCount; i++) {
        const rollParams = {
          count: 1,
          allowLegendary: false,
          allowMythical: false,
          maxSpecies: 1,
          maxTypes: 2
        };

        const monsters = await monsterRoller.rollMany(rollParams);
        if (monsters && monsters.length > 0) {
          const monster = monsters[0];
          const monsterData = {
            name: `${participant.trainer_name}'s ${monster.species1}`,
            species1: monster.species1,
            species2: monster.species2,
            species3: monster.species3,
            type1: monster.type1,
            type2: monster.type2,
            type3: monster.type3,
            type4: monster.type4,
            type5: monster.type5,
            attribute: monster.attribute,
            level: Math.floor(Math.random() * 20) + 10, // Level 10-30
            isWild: false
          };

          await this.createBattleMonster(participant, monsterData, i);
        }
      }
    } catch (error) {
      console.error('Error generating fallback trainer monsters:', error);
      // Create a hardcoded fallback monster
      const fallbackMonster = {
        name: `${participant.trainer_name}'s Pikachu`,
        species1: 'Pikachu',
        type1: 'Electric',
        level: 15,
        isWild: false
      };
      await this.createBattleMonster(participant, fallbackMonster, 0);
    }
  }

  /**
   * Create a battle monster from monster data
   * @param {Object} participant - Participant data
   * @param {Object} monsterData - Monster data
   * @param {number} position - Position index
   */
  async createBattleMonster(participant, monsterData, position) {
    try {
      // Calculate HP based on level and stats
      const maxHp = this.calculateMonsterHP(monsterData);

      console.log('Creating battle monster with data:', {
        battle_id: participant.battle_id,
        participant_id: participant.id,
        monster_data: monsterData,
        position: position,
        maxHp: maxHp
      });

      const battleMonster = await BattleMonster.create({
        battle_id: participant.battle_id,
        participant_id: participant.id,
        monster_id: null, // No actual monster ID for generated monsters
        monster_data: monsterData,
        current_hp: maxHp,
        max_hp: maxHp,
        position_index: position,
        is_active: position === 0 // First monster is active
      });

      console.log('Successfully created battle monster:', battleMonster);
      return battleMonster;
    } catch (error) {
      console.error('Error creating battle monster:', error);
      throw error;
    }
  }

  /**
   * Advance to the next turn
   * @param {number} battleId - Battle ID
   */
  async advanceTurn(battleId) {
    try {
      const battle = await BattleInstance.getById(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      // Get all participants ordered by turn_order
      const participants = await BattleParticipant.getByBattle(battleId);
      if (participants.length === 0) {
        throw new Error('No participants found for battle');
      }

      // Sort participants by turn_order to ensure proper turn sequence
      participants.sort((a, b) => a.turn_order - b.turn_order);

      // Calculate next participant index (cycle through participants)
      const currentIndex = battle.current_participant_index || 0;
      const nextIndex = (currentIndex + 1) % participants.length;

      // Increment turn
      const newTurn = battle.current_turn + 1;

      await BattleInstance.update(battleId, {
        current_turn: newTurn,
        current_participant_index: nextIndex,
        turn_started_at: new Date().toISOString()
      });

      console.log(`Advanced to turn ${newTurn} for battle ${battleId}, participant index: ${currentIndex} -> ${nextIndex}`);
      console.log(`Current participant: ${participants[nextIndex]?.trainer_name || participants[nextIndex]?.participant_type || 'Unknown'}`);
      console.log('All participants:', participants.map(p => ({
        id: p.id,
        name: p.trainer_name,
        type: p.participant_type,
        team_side: p.team_side,
        turn_order: p.turn_order
      })));
    } catch (error) {
      console.error('Error advancing turn:', error);
      throw error;
    }
  }

  /**
   * Process the current turn (execute AI actions if it's an AI participant's turn)
   * @param {number} battleId - Battle ID
   */
  async processCurrentTurn(battleId) {
    try {
      console.log('=== PROCESSING CURRENT TURN ===');
      const battleState = await this.getBattleState(battleId);
      const currentParticipant = battleState.currentParticipant;

      if (!currentParticipant) {
        console.log('No current participant found');
        return;
      }

      console.log('Current participant:', {
        id: currentParticipant.id,
        name: currentParticipant.trainer_name,
        type: currentParticipant.participant_type,
        team_side: currentParticipant.team_side
      });

      // Process status effects for all active monsters of the current participant
      await this.processParticipantStatusEffects(battleId, currentParticipant);

      // Send turn notification message
      await this.sendTurnNotification(battleId, currentParticipant);

      // If it's an AI participant's turn, execute their action
      if (currentParticipant.participant_type === 'npc' || currentParticipant.participant_type === 'wild') {
        console.log(`=== EXECUTING AI TURN ===`);
        console.log(`AI participant: ${currentParticipant.trainer_name || currentParticipant.participant_type}`);

        // Get active monsters for this participant
        const activeMonsters = battleState.monsters.filter(m =>
          m.participant_id === currentParticipant.id && m.is_active && !m.is_fainted
        );

        // Check if there are any valid targets (opponent monsters that aren't fainted)
        const opponentMonsters = battleState.monsters.filter(m => {
          const participant = battleState.participants.find(p => p.id === m.participant_id);
          return participant &&
                 participant.team_side !== currentParticipant.team_side &&
                 m.is_active &&
                 !m.is_fainted;
        });

        if (activeMonsters.length > 0 && opponentMonsters.length > 0) {
          // Check if any active monster can act (not prevented by status effects)
          const StatusEffectManager = require('./StatusEffectManager');
          let canActMonsters = [];

          for (const monster of activeMonsters) {
            const statusResult = await StatusEffectManager.processStatusEffects(battleId, monster);
            if (statusResult.canAct) {
              canActMonsters.push(monster);
            }
          }

          if (canActMonsters.length > 0) {
            // Pick a random active monster that can act
            const randomMonster = canActMonsters[Math.floor(Math.random() * canActMonsters.length)];
            const attackResult = await this.executeEnemyAttack(battleId, randomMonster, battleState);

            // If battle ended, stop processing
            if (attackResult && attackResult.battleEnded) {
              return;
            }
          } else {
            // All monsters are prevented from acting by status effects
            const participantName = currentParticipant.trainer_name || currentParticipant.participant_type;
            const skipMessage = `😵‍💫 **${participantName}**'s monsters cannot act due to status conditions!`;
            await this.sendBattleMessageToDiscord(battleId, skipMessage);
            console.log(`AI ${participantName} skipping turn - all monsters prevented by status effects`);
          }
        } else if (activeMonsters.length > 0 && opponentMonsters.length === 0) {
          // AI has monsters but no valid targets - skip turn
          const participantName = currentParticipant.trainer_name || currentParticipant.participant_type;
          const skipMessage = `⏭️ **${participantName}** has no valid targets and skips their turn.`;
          await this.sendBattleMessageToDiscord(battleId, skipMessage);
          console.log(`AI ${participantName} skipping turn - no valid targets`);
        } else {
          // AI has no active monsters - skip turn
          const participantName = currentParticipant.trainer_name || currentParticipant.participant_type;
          const skipMessage = `😵 **${participantName}** has no active monsters and skips their turn.`;
          await this.sendBattleMessageToDiscord(battleId, skipMessage);
          console.log(`AI ${participantName} skipping turn - no active monsters`);
        }

        // After AI action (or skip), advance to next turn
        console.log('=== ADVANCING TURN AFTER AI ACTION ===');
        await this.advanceTurn(battleId);

        // Recursively process next turn (will send notification and handle AI if needed)
        console.log('=== RECURSIVELY PROCESSING NEXT TURN ===');
        await this.processCurrentTurn(battleId);
      } else {
        // If it's a player's turn, just send notification and wait for player action
        console.log(`=== PLAYER TURN - WAITING FOR ACTION ===`);
        console.log(`Player: ${currentParticipant.trainer_name || currentParticipant.discord_user_id}`);
      }

    } catch (error) {
      console.error('Error processing current turn:', error);
      throw error;
    }
  }

  /**
   * Process status effects for all active monsters of a participant
   * @param {number} battleId - Battle ID
   * @param {Object} participant - Participant data
   */
  async processParticipantStatusEffects(battleId, participant) {
    try {
      console.log('=== PROCESSING STATUS EFFECTS ===');
      console.log('Participant:', participant.trainer_name || participant.participant_type);

      // Get all active monsters for this participant
      const activeMonsters = await BattleMonster.getByBattle(battleId, {
        participantId: participant.id
      });

      const aliveActiveMonsters = activeMonsters.filter(m => m.is_active && !m.is_fainted && m.current_hp > 0);

      if (aliveActiveMonsters.length === 0) {
        console.log('No alive active monsters to process status effects for');
        return;
      }

      const StatusEffectManager = require('./StatusEffectManager');
      let totalDamage = 0;
      let allMessages = [];

      for (const monster of aliveActiveMonsters) {
        const statusResult = await StatusEffectManager.processStatusEffects(battleId, monster);

        if (statusResult.messages.length > 0) {
          allMessages.push(...statusResult.messages);
        }

        totalDamage += statusResult.damageDealt;

        // Check if monster fainted from status damage
        if (statusResult.damageDealt > 0) {
          const updatedMonster = await BattleMonster.getById(monster.id);
          if (updatedMonster.is_fainted || updatedMonster.current_hp <= 0) {
            console.log('Monster fainted from status effect damage');
            await this.handleMonsterKnockout(battleId, updatedMonster);
          }
        }
      }

      // Send all status effect messages at once if any
      if (allMessages.length > 0) {
        const combinedMessage = allMessages.join('\n');
        await this.sendBattleMessageToDiscord(battleId, combinedMessage);
        console.log('Status effect messages sent:', combinedMessage);
      }

      console.log(`Status effects processed. Total damage: ${totalDamage}`);

    } catch (error) {
      console.error('Error processing participant status effects:', error);
      // Don't throw error - battle should continue even if status processing fails
    }
  }

  /**
   * Send turn notification message
   * @param {number} battleId - Battle ID
   * @param {Object} currentParticipant - Current participant
   */
  async sendTurnNotification(battleId, currentParticipant) {
    try {
      console.log('Sending turn notification for participant:', currentParticipant);

      let participantName = '';
      let turnMessage = '';

      if (currentParticipant.participant_type === 'player') {
        participantName = currentParticipant.trainer_name || `Player ${currentParticipant.discord_user_id}`;
        turnMessage = `🎯 **It's now ${participantName}'s turn!**`;
      } else if (currentParticipant.participant_type === 'npc') {
        participantName = currentParticipant.trainer_name || 'Enemy Trainer';
        turnMessage = `⚔️ **${participantName}'s turn!**`;
      } else if (currentParticipant.participant_type === 'wild') {
        participantName = 'Wild Monsters';
        turnMessage = `🐾 **${participantName}' turn!**`;
      }

      console.log('Turn message to send:', turnMessage);

      if (turnMessage) {
        await this.sendBattleMessageToDiscord(battleId, turnMessage);
        console.log('Turn notification sent successfully');
      } else {
        console.log('No turn message generated');
      }

    } catch (error) {
      console.error('Error sending turn notification:', error);
      // Don't throw error - battle should continue even if message fails
    }
  }



  /**
   * Execute an enemy monster attack
   * @param {number} battleId - Battle ID
   * @param {Object} enemyMonster - Enemy monster data
   * @param {Object} battleState - Current battle state
   */
  async executeEnemyAttack(battleId, enemyMonster, battleState) {
    try {
      const BattleLog = require('../models/BattleLog');

      // Get player monsters as potential targets
      const playerMonsters = battleState.monsters.filter(m => {
        const participant = battleState.participants.find(p => p.id === m.participant_id);
        return participant && participant.participant_type === 'player' && m.is_active && !m.is_fainted;
      });

      if (playerMonsters.length === 0) {
        console.log('No player monsters to attack');
        return;
      }

      // Pick a random target
      const target = playerMonsters[Math.floor(Math.random() * playerMonsters.length)];

      // Parse monster data
      const monsterData = typeof enemyMonster.monster_data === 'string' ?
        JSON.parse(enemyMonster.monster_data) : enemyMonster.monster_data;
      const targetData = typeof target.monster_data === 'string' ?
        JSON.parse(target.monster_data) : target.monster_data;

      // Use a basic attack move for AI
      const basicMove = {
        move_name: 'Tackle',
        power: 40,
        accuracy: 100,
        move_type: 'Normal',
        MoveType: 'Physical'
      };

      // Calculate damage using the proper damage system
      const DamageCalculator = require('./DamageCalculator');
      const damageResult = await DamageCalculator.calculateDamage(
        monsterData,
        targetData,
        basicMove,
        { battleId }
      );

      let fullMessage = '';
      let damageDealt = 0;

      if (damageResult.isStatusMove) {
        // Handle status move result
        fullMessage = `🤖 ${damageResult.message}`;
      } else if (damageResult.hits) {
        // Apply damage
        const BattleMonster = require('../models/BattleMonster');
        const damageApplied = await BattleMonster.dealDamage(target.id, damageResult.damage);
        damageDealt = damageApplied.damage_dealt;

        // Get updated target
        const updatedTarget = await BattleMonster.getById(target.id);

        fullMessage = `🤖 ${damageResult.message}`;
        fullMessage += `\n💔 **${targetData.name || 'Player Monster'}** takes ${damageDealt} damage! (${updatedTarget.current_hp}/${updatedTarget.max_hp} HP)`;

        if (updatedTarget.is_fainted) {
          fullMessage += `\n💀 **${targetData.name || 'Player Monster'}** fainted!`;
        }

        // Handle special damage move effects for AI
        if (damageResult.isSpecialDamageMove && damageResult.specialMoveConfig) {
          const StatusMoveManager = require('./StatusMoveManager');
          const specialEffectResult = await StatusMoveManager.applySpecialDamageEffects(
            damageResult.specialMoveConfig,
            { ...monsterData, id: enemyMonster.id },
            { ...targetData, id: updatedTarget.id },
            damageDealt,
            battleId
          );

          if (specialEffectResult.success && specialEffectResult.effectMessage) {
            fullMessage += specialEffectResult.effectMessage;
          }
        }
      } else {
        // Attack missed
        fullMessage = `🤖 ${damageResult.message}`;
      }

      // Log to database
      await BattleLog.logSystem(battleId, fullMessage);

      // Send to Discord thread
      await this.sendBattleMessageToDiscord(battleId, fullMessage);

      // Handle knockout if target fainted
      if (damageDealt > 0) {
        const updatedTarget = await BattleMonster.getById(target.id);
        if (updatedTarget.is_fainted || updatedTarget.current_hp <= 0) {
          console.log('=== ENEMY ATTACK CAUSED KNOCKOUT ===');
          console.log('Target monster:', {
            id: target.id,
            name: targetData.name,
            current_hp: updatedTarget.current_hp
          });

          // Handle knockout and award levels
          await this.handleMonsterKnockout(battleId, updatedTarget);
          console.log('=== ENEMY KNOCKOUT HANDLER COMPLETED ===');

          // Check if battle should end after enemy attack
          const battleEndResult = await this.checkBattleConditions(battleId);
          if (battleEndResult) {
            await this.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
            return { battleEnded: true, result: battleEndResult };
          }
        }
      }

      console.log(`Enemy attack: ${monsterData.name} -> ${targetData.name} for ${damageDealt} damage`);

    } catch (error) {
      console.error('Error executing enemy attack:', error);
    }
  }

  /**
   * Send turn order message to Discord
   * @param {number} battleId - Battle ID
   */
  async sendTurnOrderMessage(battleId) {
    try {
      // Get all participants ordered by turn_order
      const participants = await BattleParticipant.getByBattle(battleId);
      participants.sort((a, b) => a.turn_order - b.turn_order);

      if (participants.length === 0) {
        return;
      }

      let turnOrderMessage = `📋 **BATTLE TURN ORDER** 📋\n\n`;

      participants.forEach((participant, index) => {
        const turnNumber = index + 1;
        let participantName = '';

        if (participant.participant_type === 'player') {
          participantName = participant.trainer_name || `Player ${participant.discord_user_id}`;
        } else if (participant.participant_type === 'npc') {
          participantName = participant.trainer_name || 'Enemy Trainer';
        } else if (participant.participant_type === 'wild') {
          participantName = 'Wild Monsters';
        }

        turnOrderMessage += `${turnNumber}. ${participantName}\n`;
      });

      const firstParticipant = participants[0];
      let firstParticipantName = 'First participant';
      if (firstParticipant) {
        if (firstParticipant.participant_type === 'player') {
          firstParticipantName = firstParticipant.trainer_name || `Player ${firstParticipant.discord_user_id}`;
        } else if (firstParticipant.participant_type === 'npc') {
          firstParticipantName = firstParticipant.trainer_name || 'Enemy Trainer';
        } else if (firstParticipant.participant_type === 'wild') {
          firstParticipantName = 'Wild Monsters';
        }
      }

      turnOrderMessage += `\n🎯 **${firstParticipantName}** goes first!`;

      // Send to Discord
      await this.sendBattleMessageToDiscord(battleId, turnOrderMessage);

    } catch (error) {
      console.error('Error sending turn order message:', error);
      // Don't throw error - battle should continue even if message fails
    }
  }

  /**
   * Send battle message to Discord thread
   * @param {number} battleId - Battle ID
   * @param {string} message - Message to send
   */
  async sendBattleMessageToDiscord(battleId, message) {
    try {
      console.log(`=== SENDING BATTLE MESSAGE TO DISCORD ===`);
      console.log(`Battle ID: ${battleId}`);
      console.log(`Message: ${message}`);

      // Get battle and adventure info
      const battle = await BattleInstance.getById(battleId);
      if (!battle) {
        console.error('Battle not found for Discord message:', battleId);
        return;
      }
      console.log(`Battle found: ${battle.id}, Adventure ID: ${battle.adventure_id}`);

      const Adventure = require('../models/Adventure');
      const adventure = await Adventure.getById(battle.adventure_id);
      if (!adventure || !adventure.discord_thread_id) {
        console.error('Adventure or Discord thread not found for battle:', battleId);
        console.error('Adventure:', adventure);
        return;
      }
      console.log(`Adventure found: ${adventure.id}, Discord Thread ID: ${adventure.discord_thread_id}`);

      // Send message to Discord thread
      const DiscordIntegrationService = require('./DiscordIntegrationService');

      console.log('Calling DiscordIntegrationService.sendMessageToThread...');
      const result = await DiscordIntegrationService.sendMessageToThread(adventure.discord_thread_id, message);
      console.log('Discord service result:', result);

      if (!result.success) {
        console.error('Failed to send battle message to Discord:', result.message);
      } else {
        console.log('✅ Battle message sent to Discord successfully');
      }

    } catch (error) {
      console.error('Error sending battle message to Discord:', error);
      console.error('Error stack:', error.stack);
      // Don't throw error - battle should continue even if Discord message fails
    }
  }

  /**
   * Check battle win/loss conditions
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object|null>} Battle result or null if battle continues
   */
  async checkBattleConditions(battleId) {
    try {
      const battleState = await this.getBattleState(battleId);

      // Get all monsters grouped by team
      const playerMonsters = battleState.monsters.filter(m => {
        const participant = battleState.participants.find(p => p.id === m.participant_id);
        return participant && participant.team_side === 'players';
      });

      const enemyMonsters = battleState.monsters.filter(m => {
        const participant = battleState.participants.find(p => p.id === m.participant_id);
        return participant && participant.team_side === 'opponents';
      });

      // Count fainted monsters
      const faintedPlayerMonsters = playerMonsters.filter(m => m.is_fainted || m.current_hp <= 0).length;
      const faintedEnemyMonsters = enemyMonsters.filter(m => m.is_fainted || m.current_hp <= 0).length;

      // Count active (alive) monsters
      const activePlayerMonsters = playerMonsters.filter(m => !m.is_fainted && m.current_hp > 0).length;
      const activeEnemyMonsters = enemyMonsters.filter(m => !m.is_fainted && m.current_hp > 0).length;

      console.log('Battle condition check:', {
        playerMonsters: playerMonsters.length,
        faintedPlayerMonsters,
        activePlayerMonsters,
        enemyMonsters: enemyMonsters.length,
        faintedEnemyMonsters,
        activeEnemyMonsters
      });

      // Check if all enemy monsters are defeated (no active monsters left)
      if (activeEnemyMonsters === 0 && enemyMonsters.length > 0) {
        console.log('=== BATTLE WIN CONDITION MET - ALL ENEMIES DEFEATED ===');
        return {
          result: 'victory',
          message: '🏆 **VICTORY!** 🏆\n\nAll enemy monsters have been defeated!',
          winner_type: 'players'
        };
      }

      // Check if all player monsters are defeated (no active monsters left)
      if (activePlayerMonsters === 0 && playerMonsters.length > 0) {
        console.log('=== BATTLE LOSS CONDITION MET - ALL PLAYERS DEFEATED ===');
        return {
          result: 'loss',
          message: '💀 **DEFEAT!** 💀\n\nAll your monsters have fainted. The battle is lost!',
          winner_type: 'opponents'
        };
      }

      // Check loss conditions (6 player monsters fainted)
      if (faintedPlayerMonsters >= 6) {
        console.log('=== BATTLE LOSS CONDITION MET - 6 KNOCKOUTS ===');
        return {
          result: 'loss',
          message: '💀 **DEFEAT!** 💀\n\nSix of your monsters have fainted. The battle is lost!',
          winner_type: 'opponents'
        };
      }

      // Check win conditions (6 enemy monsters fainted)
      if (faintedEnemyMonsters >= 6) {
        console.log('=== BATTLE WIN CONDITION MET - 6 KNOCKOUTS ===');
        return {
          result: 'victory',
          message: '🏆 **VICTORY!** 🏆\n\nSix enemy monsters have been defeated!',
          winner_type: 'players'
        };
      }

      // Battle continues
      return null;

    } catch (error) {
      console.error('Error checking battle conditions:', error);
      return null;
    }
  }



  /**
   * Calculate monster HP based on stats
   * @param {Object} monsterData - Monster data
   * @returns {number} Calculated HP
   */
  calculateMonsterHP(monsterData) {
    const level = monsterData.level || 1;
    const baseHp = monsterData.hp_total || 50;
    
    // Simple HP calculation - can be made more complex
    return Math.max(1, Math.floor(baseHp + (level * 2)));
  }

  /**
   * Add a player to an existing battle
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} Battle participant
   */
  async addPlayerToBattle(battleId, discordUserId, trainerId) {
    try {
      // Check if player is already in battle
      const existingParticipant = await BattleParticipant.getByBattleAndUser(battleId, discordUserId);
      if (existingParticipant) {
        // Update existing participant with trainer details
        console.log('Updating existing participant with trainer details');
        console.log('Existing participant:', JSON.stringify(existingParticipant, null, 2));

        const Trainer = require('../models/Trainer');
        const trainer = await Trainer.getById(trainerId);
        console.log('Trainer to add:', JSON.stringify(trainer, null, 2));

        // Only update fields that are missing or different
        const updateData = {};
        if (!existingParticipant.trainer_id || existingParticipant.trainer_id !== trainerId) {
          updateData.trainer_id = trainerId;
        }
        if (!existingParticipant.trainer_name || existingParticipant.trainer_name !== trainer.name) {
          updateData.trainer_name = trainer.name;
        }

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        if (Object.keys(updateData).length > 0) {
          console.log('Updating participant with:', updateData);
          await BattleParticipant.update(existingParticipant.id, updateData);
          console.log('Participant updated successfully');
        } else {
          console.log('No updates needed - participant already has trainer details');
        }

        // Return updated participant
        const updatedParticipant = await BattleParticipant.getById(existingParticipant.id);
        console.log('Final participant:', JSON.stringify(updatedParticipant, null, 2));
        return updatedParticipant;
      }

      // Get trainer data
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        throw new Error('Trainer not found');
      }

      // Get battle data to check if this is a PvP battle
      const battle = await BattleInstance.getById(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      let teamSide = 'players';
      let nextTurnOrder = 0;

      // Handle PvP battle logic
      if (battle.battle_type === 'pvp' && battle.battle_data.pvp) {
        const battleData = battle.battle_data;
        const participants = await BattleParticipant.getByBattle(battleId);

        // Check if this trainer is an invited opponent
        const isInvitedOpponent = battleData.opponent_trainers &&
          battleData.opponent_trainers.includes(trainer.name);

        // Check if this is the challenger
        const isChallenger = battleData.challenger === discordUserId;

        if (isChallenger) {
          // Challenger goes on players team
          teamSide = 'players';
          nextTurnOrder = 0;
        } else if (isInvitedOpponent) {
          // Invited opponents go on opponents team
          teamSide = 'opponents';
          const opponentParticipants = participants.filter(p => p.team_side === 'opponents');
          nextTurnOrder = opponentParticipants.length;
        } else {
          throw new Error(`Trainer "${trainer.name}" was not invited to this PvP battle`);
        }
      } else {
        // Regular battle - all players on same team
        const playerParticipants = await BattleParticipant.getByBattle(battleId, { teamSide: 'players' });
        nextTurnOrder = playerParticipants.length;
      }

      // Create participant
      const participant = await BattleParticipant.create({
        battle_id: battleId,
        participant_type: 'player',
        discord_user_id: discordUserId,
        trainer_id: trainerId,
        trainer_name: trainer.name,
        team_side: teamSide,
        turn_order: nextTurnOrder
      });

      // Don't automatically add monsters - they'll be added when released
      // await this.addTrainerMonstersToBattle(participant, trainerId);

      // Log player joining
      const joinMessage = battle.battle_type === 'pvp' ?
        `⚔️ **${trainer.name}** enters the PvP battle on the ${teamSide} side!` :
        `🎯 **${trainer.name}** joined the battle!`;

      await BattleLog.logSystem(battleId, joinMessage);

      // Send join message to Discord
      await this.sendBattleMessageToDiscord(battleId, joinMessage);

      // Send updated turn order message
      await this.sendTurnOrderMessage(battleId);

      // Check if this is the first player to join and start turn processing
      const allParticipants = await BattleParticipant.getByBattle(battleId);
      const playerParticipants = allParticipants.filter(p => p.participant_type === 'player');

      if (playerParticipants.length === 1) {
        // This is the first player - start the battle turn processing
        console.log('First player joined - starting battle turn processing');
        await this.processCurrentTurn(battleId);
      }

      return participant;
    } catch (error) {
      console.error('Error adding player to battle:', error);
      throw error;
    }
  }

  /**
   * Add trainer's monsters to battle
   * @param {Object} participant - Participant data
   * @param {number} trainerId - Trainer ID
   */
  async addTrainerMonstersToBattle(participant, trainerId) {
    try {
      // This method is no longer used - monsters are added on-demand when released
      console.log('addTrainerMonstersToBattle called but skipped - monsters added on release');
      return true;
    } catch (error) {
      console.error('Error adding trainer monsters to battle:', error);
      throw error;
    }
  }

  /**
   * Add a single monster to battle when released
   * @param {number} battleId - Battle ID
   * @param {number} participantId - Participant ID
   * @param {Object} monster - Monster data
   * @returns {Promise<Object>} Battle monster
   */
  async addMonsterToBattle(battleId, participantId, monster) {
    try {
      // Check if monster is already in battle
      const existingBattleMonster = await BattleMonster.getByBattleAndMonster(battleId, monster.id);
      if (existingBattleMonster) {
        return existingBattleMonster;
      }

      // Get current position index (number of monsters already in battle for this participant)
      const participantMonsters = await BattleMonster.getByBattle(battleId, { participantId });
      const positionIndex = participantMonsters.length;

      // Create battle monster entry
      const battleMonster = await BattleMonster.create({
        battle_id: battleId,
        participant_id: participantId,
        monster_id: monster.id,
        position_index: positionIndex,
        current_hp: monster.hp_total || monster.hp || 100,
        max_hp: monster.hp_total || monster.hp || 100,
        is_active: true, // Released monsters are active
        monster_data: monster
      });

      console.log(`Added monster ${monster.name || 'Unnamed'} to battle`);
      return battleMonster;
    } catch (error) {
      console.error('Error adding monster to battle:', error);
      throw error;
    }
  }

  /**
   * Get current battle state
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Battle state
   */
  async getBattleState(battleId) {
    try {
      // Check cache first
      if (this.activeBattles.has(battleId)) {
        const cachedBattle = this.activeBattles.get(battleId);
        if (cachedBattle.status === 'active') {
          return await this.refreshBattleState(battleId);
        }
      }

      return await this.refreshBattleState(battleId);
    } catch (error) {
      console.error('Error getting battle state:', error);
      throw error;
    }
  }

  /**
   * Refresh battle state from database
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Battle state
   */
  async refreshBattleState(battleId) {
    try {
      const battle = await BattleInstance.getById(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      const participants = await BattleParticipant.getByBattle(battleId);
      const monsters = await BattleMonster.getByBattle(battleId);
      const recentLogs = await BattleLog.getRecent(battleId, 10);

      // Sort participants by turn_order to ensure proper turn sequence
      participants.sort((a, b) => a.turn_order - b.turn_order);

      const battleState = {
        battle,
        participants,
        monsters,
        recentLogs,
        currentTurn: battle.current_turn,
        currentParticipant: participants[battle.current_participant_index] || null,
        isActive: battle.status === 'active'
      };

      // Update cache
      this.activeBattles.set(battleId, battleState);

      return battleState;
    } catch (error) {
      console.error('Error refreshing battle state:', error);
      throw error;
    }
  }

  /**
   * Check if it's a participant's turn
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} actionType - Type of action (optional, for context)
   * @returns {Promise<boolean>} Whether it's the participant's turn
   */
  async isParticipantTurn(battleId, discordUserId, actionType = null) {
    try {
      const battleState = await this.getBattleState(battleId);

      if (!battleState.isActive) {
        return false;
      }

      const participant = await BattleParticipant.getByBattleAndUser(battleId, discordUserId);
      if (!participant) {
        return false;
      }

      // Check if battle is in setup phase (no turns taken yet)
      const isSetupPhase = await this.isBattleInSetupPhase(battleId);

      // During setup phase, allow certain actions for all participants
      if (isSetupPhase && (actionType === 'release' || actionType === 'switch')) {
        return true;
      }

      // For monster release action, also allow if participant has no active monsters
      if (actionType === 'release') {
        const activeMonsters = await BattleMonster.getActiveByParticipant(participant.id);
        if (activeMonsters.length === 0) {
          return true; // Allow release if no active monsters
        }

        // Check if battle is waiting for this participant to switch
        const battle = await BattleInstance.getById(battleId);
        const waitingForSwitch = battle.battle_data?.waiting_for_switch;
        if (waitingForSwitch && waitingForSwitch.participant_id === participant.id) {
          return true; // Allow release when waiting for switch
        }
      }

      // During active battle, check turn order
      return battleState.currentParticipant &&
             battleState.currentParticipant.id === participant.id;
    } catch (error) {
      console.error('Error checking participant turn:', error);
      return false;
    }
  }

  /**
   * Check if battle is in setup phase (before turns start)
   * @param {number} battleId - Battle ID
   * @returns {Promise<boolean>} Whether battle is in setup phase
   */
  async isBattleInSetupPhase(battleId) {
    try {
      // Check if any turns have been taken
      const turns = await BattleTurn.getByBattle(battleId);
      const actionTurns = turns.filter(turn =>
        turn.action_type === 'attack' ||
        turn.action_type === 'item'
      );

      // If no attack or item turns have been taken, we're still in setup
      return actionTurns.length === 0;
    } catch (error) {
      console.error('Error checking battle setup phase:', error);
      return false;
    }
  }

  /**
   * Process next turn
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Updated battle state
   */
  async processNextTurn(battleId) {
    try {
      const participants = await BattleParticipant.getActiveByBattle(battleId);
      
      if (participants.length === 0) {
        throw new Error('No active participants in battle');
      }

      const battle = await BattleInstance.getById(battleId);
      const currentIndex = battle.current_participant_index;
      const nextIndex = (currentIndex + 1) % participants.length;

      // Update battle to next turn
      await BattleInstance.startNextTurn(battleId, nextIndex);

      // Log turn change
      const nextParticipant = participants[nextIndex];
      await BattleLog.logSystem(battleId, `🔄 Turn ${battle.current_turn + 1}: **${nextParticipant.trainer_name}**'s turn!`);

      return await this.getBattleState(battleId);
    } catch (error) {
      console.error('Error processing next turn:', error);
      throw error;
    }
  }

  /**
   * Check if battle should end
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object|null>} End result or null if battle continues
   */
  async checkBattleEnd(battleId) {
    try {
      const monsters = await BattleMonster.getByBattle(battleId);
      const participants = await BattleParticipant.getByBattle(battleId);
      const battle = await BattleInstance.getById(battleId);
      
      // Check knockout-based win condition first
      const knockoutWinner = await this.checkKnockoutWinCondition(battleId, participants, battle);
      if (knockoutWinner) {
        return knockoutWinner;
      }
      
      // Fallback to all monsters fainted check
      const playerMonsters = monsters.filter(m => m.team_side === 'players');
      const opponentMonsters = monsters.filter(m => m.team_side === 'opponents');

      const playersAllFainted = playerMonsters.every(m => m.is_fainted);
      const opponentsAllFainted = opponentMonsters.every(m => m.is_fainted);

      if (playersAllFainted && opponentsAllFainted) {
        return { winner: 'draw', reason: 'All monsters fainted' };
      } else if (playersAllFainted) {
        // For PvP battles, get actual winner names
        if (battle.battle_type === 'pvp') {
          const winningParticipants = participants.filter(p => p.team_side === 'opponents');
          const winnerNames = winningParticipants.map(p => p.trainer_name).join(', ');
          return { 
            winner: 'opponents', 
            reason: 'All player monsters fainted',
            winnerNames: winnerNames
          };
        }
        return { winner: 'opponents', reason: 'All player monsters fainted' };
      } else if (opponentsAllFainted) {
        // For PvP battles, get actual winner names
        if (battle.battle_type === 'pvp') {
          const winningParticipants = participants.filter(p => p.team_side === 'players');
          const winnerNames = winningParticipants.map(p => p.trainer_name).join(', ');
          return { 
            winner: 'players', 
            reason: 'All opponent monsters fainted',
            winnerNames: winnerNames
          };
        }
        return { winner: 'players', reason: 'All opponent monsters fainted' };
      }

      return null; // Battle continues
    } catch (error) {
      console.error('Error checking battle end:', error);
      throw error;
    }
  }

  /**
   * Check knockout-based win condition
   * @param {number} battleId - Battle ID
   * @param {Array} participants - Battle participants
   * @param {Object} battle - Battle instance
   * @returns {Promise<Object|null>} Win result or null
   */
  async checkKnockoutWinCondition(battleId, participants, battle) {
    try {
      // Calculate required knockouts for each team
      const teamRequiredKnockouts = {};
      
      for (const participant of participants) {
        if (participant.participant_type === 'player') {
          const teamSide = participant.team_side;
          if (!teamRequiredKnockouts[teamSide]) {
            teamRequiredKnockouts[teamSide] = 0;
          }

          // Get trainer's total monster count
          const Monster = require('../models/Monster');
          const trainerMonsters = await Monster.getByTrainerId(participant.trainer_id);
          const trainerMonsterCount = trainerMonsters.length;
          
          // Required knockouts = min(6, trainer's total monsters)
          const requiredKnockouts = Math.min(6, trainerMonsterCount);
          teamRequiredKnockouts[teamSide] = Math.max(teamRequiredKnockouts[teamSide], requiredKnockouts);
        }
      }

      // Count current knockouts for each team
      const teamKnockouts = {};
      for (const participant of participants) {
        const teamSide = participant.team_side;
        if (!teamKnockouts[teamSide]) {
          teamKnockouts[teamSide] = 0;
        }

        // Count knocked out monsters for this participant
        const participantMonsters = await BattleMonster.getByBattle(battleId, {
          participantId: participant.id
        });

        const knockedOut = participantMonsters.filter(m => m.current_hp <= 0 || m.is_fainted).length;
        teamKnockouts[teamSide] += knockedOut;
      }

      // Check if any team has reached their knockout limit
      for (const [teamSide, knockouts] of Object.entries(teamKnockouts)) {
        const requiredKnockouts = teamRequiredKnockouts[teamSide] || 6;
        
        if (knockouts >= requiredKnockouts) {
          // This team loses, opposite team wins
          const winnerTeam = teamSide === 'players' ? 'opponents' : 'players';
          
          let reasonObj = {
            reason: `Knockout limit reached: ${knockouts}/${requiredKnockouts} monsters defeated`,
            knockouts: knockouts,
            limit: requiredKnockouts
          };

          // For PvP battles, add winner names
          if (battle.battle_type === 'pvp') {
            const winningParticipants = participants.filter(p => p.team_side === winnerTeam);
            const winnerNames = winningParticipants.map(p => p.trainer_name).join(', ');
            reasonObj.winnerNames = winnerNames;
          }

          return {
            winner: winnerTeam,
            ...reasonObj
          };
        }
      }

      return null; // Battle continues
    } catch (error) {
      console.error('Error checking knockout win condition:', error);
      return null;
    }
  }

  /**
   * End battle
   * @param {number} battleId - Battle ID
   * @param {string} winnerType - Winner type
   * @param {string} reason - End reason
   * @returns {Promise<Object>} Battle result
   */
  async endBattle(battleId, winnerType, reason) {
    try {
      // Complete the battle
      await BattleInstance.complete(battleId, winnerType);

      // Determine display winner name
      let displayWinner = winnerType.toUpperCase();
      let winnerNames = null;
      
      // If reason is an object (from checkBattleEnd), extract winner names
      if (typeof reason === 'object' && reason.winnerNames) {
        winnerNames = reason.winnerNames;
        displayWinner = reason.winnerNames;
        reason = reason.reason;
      }

      // Log battle end
      await BattleLog.logSystem(battleId, `🏁 **BATTLE ENDED!** 🏁\nWinner: ${displayWinner}\nReason: ${reason}`);

      // Remove from cache
      this.activeBattles.delete(battleId);

      // Calculate and distribute rewards
      const rewards = await this.calculateBattleRewards(battleId, winnerType);

      return {
        battleId,
        winner: winnerType,
        winnerNames,
        displayWinner,
        reason,
        rewards
      };
    } catch (error) {
      console.error('Error ending battle:', error);
      throw error;
    }
  }

  /**
   * Calculate battle rewards
   * @param {number} battleId - Battle ID
   * @param {string} winnerType - Winner type
   * @returns {Promise<Object>} Calculated rewards
   */
  async calculateBattleRewards(battleId, winnerType) {
    try {
      const participants = await BattleParticipant.getByBattle(battleId);
      const battleStats = await BattleTurn.getBattleStatistics(battleId);

      const rewards = {
        participants: [],
        totalExperience: 0,
        totalCoins: 0
      };

      for (const participant of participants) {
        if (participant.participant_type === 'player') {
          const participantRewards = await this.calculateParticipantRewards(
            participant, 
            winnerType, 
            battleStats
          );
          rewards.participants.push(participantRewards);
          rewards.totalExperience += participantRewards.experience;
          rewards.totalCoins += participantRewards.coins;
        }
      }

      return rewards;
    } catch (error) {
      console.error('Error calculating battle rewards:', error);
      throw error;
    }
  }

  /**
   * Force end a battle with a specific winner
   * @param {number} battleId - Battle ID
   * @param {string} winnerType - Winner type ('players' or 'opponents')
   * @param {string} message - Optional message
   * @returns {Promise<Object>} Battle end result
   */
  async forceEndBattle(battleId, winnerType, message = '') {
    try {
      // Get battle instance
      const battle = await BattleInstance.getById(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      // End the battle
      const endResult = await this.endBattle(battleId, winnerType, {
        forced: true,
        message: message || `Battle was force ended with ${winnerType} as winners`
      });

      // Log the force end
      await BattleLog.logSystem(battleId,
        `🔨 **BATTLE FORCE ENDED** - ${winnerType.toUpperCase()} WIN!\n${message}`
      );

      return {
        success: true,
        message: `Battle force ended - ${winnerType} win!`,
        winner: winnerType,
        ...endResult
      };

    } catch (error) {
      console.error('Error force ending battle:', error);
      throw error;
    }
  }

  /**
   * Handle monster knockout and award levels to opposing monsters
   * @param {number} battleId - Battle ID
   * @param {Object} knockedOutMonster - Knocked out monster data
   * @returns {Promise<Object>} Knockout result
   */
  async handleMonsterKnockout(battleId, knockedOutMonster) {
    try {
      console.log('=== HANDLE MONSTER KNOCKOUT START ===');
      console.log('Knocked out monster:', {
        id: knockedOutMonster.id,
        name: knockedOutMonster.monster_data?.name,
        current_hp: knockedOutMonster.current_hp,
        is_fainted: knockedOutMonster.is_fainted,
        participant_id: knockedOutMonster.participant_id
      });

      // Get battle participants
      const participants = await BattleParticipant.getByBattle(battleId);

      // Get the knocked out monster's participant
      const knockedOutParticipant = participants.find(p => p.id === knockedOutMonster.participant_id);
      if (!knockedOutParticipant) {
        console.error('Knocked out monster participant not found!');
        console.error('Available participants:', participants.map(p => ({ id: p.id, name: p.trainer_name })));
        throw new Error('Knocked out monster participant not found');
      }

      console.log('Knocked out participant:', {
        id: knockedOutParticipant.id,
        name: knockedOutParticipant.trainer_name,
        team_side: knockedOutParticipant.team_side,
        participant_type: knockedOutParticipant.participant_type
      });

      // Parse monster data if it's a string
      let monsterData = knockedOutMonster.monster_data;
      if (typeof monsterData === 'string') {
        try {
          monsterData = JSON.parse(monsterData);
        } catch (e) {
          console.error('Error parsing monster data:', e);
          monsterData = {};
        }
      }

      // Calculate levels to award (1 + 1 for every 10 levels)
      const monsterLevel = monsterData?.level || 1;
      const levelsToAward = 1 + Math.floor(monsterLevel / 10);

      console.log('Monster level and awards:', {
        monsterLevel,
        levelsToAward,
        monsterData
      });

      // Find opposing participants (different team side)
      const opposingParticipants = participants.filter(p =>
        p.team_side !== knockedOutParticipant.team_side &&
        p.participant_type === 'player' // Only award to player monsters, not NPCs
      );

      const levelAwards = [];

      // Award levels to all opposing monsters
      for (const participant of opposingParticipants) {
        const participantMonsters = await BattleMonster.getByBattle(battleId, {
          participantId: participant.id
        });

        for (const battleMonster of participantMonsters) {
          if (battleMonster.current_hp > 0) { // Only award to alive monsters
            // Award levels to the actual monster
            const Monster = require('../models/Monster');
            const updatedMonster = await Monster.addLevels(battleMonster.monster_id, levelsToAward);

            // Get the monster's previous level for comparison
            const previousLevel = (battleMonster.monster_data?.level || 1);
            const newLevel = updatedMonster.level;

            levelAwards.push({
              monster_id: battleMonster.monster_id,
              monster_name: battleMonster.monster_data?.name || 'Unknown',
              levels_awarded: levelsToAward,
              previous_level: previousLevel,
              new_level: newLevel,
              participant_name: participant.trainer_name
            });
          }
        }
      }

      // Log the knockout and level awards with enhanced formatting
      const monsterName = monsterData?.name || 'Monster';
      const trainerName = knockedOutParticipant.trainer_name;

      let knockoutMessage = `💀 **${monsterName}** (Level ${monsterLevel}) was knocked out!\n`;
      knockoutMessage += `   Trainer: **${trainerName}**`;

      // Show monster image if available
      if (monsterData?.img_link) {
        knockoutMessage += `\n   ${monsterData.img_link}`;
      }

      console.log('Generated knockout message:', knockoutMessage);

      let levelMessage = '';
      if (levelAwards.length > 0) {
        levelMessage = `\n\n🎉 **LEVEL UP REWARDS!** 🎉`;
        for (const award of levelAwards) {
          levelMessage += `\n⭐ **${award.monster_name}** leveled up!`;
          levelMessage += `\n   ${award.previous_level} → ${award.new_level} (+${award.levels_awarded} levels)`;
          levelMessage += `\n   Trainer: ${award.participant_name}`;
        }
      }

      await BattleLog.logSystem(battleId, knockoutMessage + levelMessage);

      // Send knockout message to Discord
      console.log('=== SENDING KNOCKOUT MESSAGE ===');
      console.log('Knockout message:', knockoutMessage + levelMessage);
      await this.sendBattleMessageToDiscord(battleId, knockoutMessage + levelMessage);
      console.log('=== KNOCKOUT MESSAGE SENT ===');

      // Handle NPC monster switching if the knocked out monster belongs to an NPC
      if (knockedOutParticipant.participant_type === 'npc' || knockedOutParticipant.participant_type === 'wild') {
        console.log('=== HANDLING NPC MONSTER SWITCHING ===');
        await this.handleNPCMonsterSwitch(battleId, knockedOutParticipant);
      }

      // Check win condition
      await this.checkWinCondition(battleId);

      return {
        knockedOut: knockedOutMonster,
        levelAwards,
        levelsAwarded: levelsToAward
      };

    } catch (error) {
      console.error('Error handling monster knockout:', error);
      throw error;
    }
  }

  /**
   * Handle NPC monster switching when their current monster is knocked out
   * @param {number} battleId - Battle ID
   * @param {Object} npcParticipant - NPC participant data
   * @returns {Promise<void>}
   */
  async handleNPCMonsterSwitch(battleId, npcParticipant) {
    try {
      console.log('=== HANDLING NPC MONSTER SWITCH ===');
      console.log('NPC Participant:', {
        id: npcParticipant.id,
        name: npcParticipant.trainer_name,
        type: npcParticipant.participant_type
      });

      // Get all monsters for this NPC participant
      const npcMonsters = await BattleMonster.getByBattle(battleId, {
        participantId: npcParticipant.id
      });

      console.log('NPC monsters:', npcMonsters.map(m => ({
        id: m.id,
        name: m.monster_data?.name,
        current_hp: m.current_hp,
        is_fainted: m.is_fainted,
        is_active: m.is_active
      })));

      // Find available monsters (not fainted and not currently active)
      const availableMonsters = npcMonsters.filter(m =>
        !m.is_fainted &&
        m.current_hp > 0 &&
        !m.is_active
      );

      console.log('Available monsters for switch:', availableMonsters.length);

      if (availableMonsters.length > 0) {
        // Select the first available monster (could be made more strategic later)
        const nextMonster = availableMonsters[0];

        // Deactivate all current active monsters for this participant
        for (const monster of npcMonsters) {
          if (monster.is_active) {
            await BattleMonster.update(monster.id, { is_active: false });
          }
        }

        // Activate the next monster
        await BattleMonster.update(nextMonster.id, { is_active: true });

        // Parse monster data for display
        let monsterData = nextMonster.monster_data;
        if (typeof monsterData === 'string') {
          try {
            monsterData = JSON.parse(monsterData);
          } catch (e) {
            console.error('Error parsing monster data:', e);
            monsterData = {};
          }
        }

        const monsterName = monsterData?.name || 'Unknown Monster';
        const trainerName = npcParticipant.trainer_name || 'Enemy Trainer';

        const switchMessage = `🔄 **${trainerName}** sends out **${monsterName}**!`;

        // Log the switch
        await BattleLog.logSystem(battleId, switchMessage);

        // Send switch message to Discord
        await this.sendBattleMessageToDiscord(battleId, switchMessage);

        console.log(`NPC ${trainerName} switched to ${monsterName}`);
      } else {
        console.log(`NPC ${npcParticipant.trainer_name} has no more available monsters`);

        // Send message that NPC is out of monsters
        const outMessage = `😵 **${npcParticipant.trainer_name}** has no more monsters left!`;
        await BattleLog.logSystem(battleId, outMessage);
        await this.sendBattleMessageToDiscord(battleId, outMessage);
      }

    } catch (error) {
      console.error('Error handling NPC monster switch:', error);
      // Don't throw error - battle should continue even if switch fails
    }
  }

  /**
   * Check if win condition is met
   * @param {number} battleId - Battle ID
   * @returns {Promise<boolean>} Whether battle should end
   */
  async checkWinCondition(battleId) {
    try {
      // Get battle data
      const battle = await BattleInstance.getById(battleId);
      if (!battle) return false;

      // Get win condition (default 6)
      const winCondition = battle.battle_data?.win_condition?.knockout_count || 6;

      // Count knockouts for each team
      const participants = await BattleParticipant.getByBattle(battleId);
      const teamKnockouts = {};

      for (const participant of participants) {
        const teamSide = participant.team_side;
        if (!teamKnockouts[teamSide]) {
          teamKnockouts[teamSide] = 0;
        }

        // Count knocked out monsters for this participant
        const participantMonsters = await BattleMonster.getByBattle(battleId, {
          participantId: participant.id
        });

        const knockedOut = participantMonsters.filter(m => m.current_hp <= 0).length;
        teamKnockouts[teamSide] += knockedOut;
      }

      // Check if any team has reached the knockout limit
      for (const [teamSide, knockouts] of Object.entries(teamKnockouts)) {
        if (knockouts >= winCondition) {
          // This team loses, opposite team wins
          const winnerTeam = teamSide === 'players' ? 'opponents' : 'players';

          let reasonObj = {
            reason: `Knockout limit reached: ${knockouts}/${winCondition}`,
            knockouts: knockouts,
            limit: winCondition
          };

          // For PvP battles, add winner names
          if (battle.battle_type === 'pvp') {
            const winningParticipants = participants.filter(p => p.team_side === winnerTeam);
            const winnerNames = winningParticipants.map(p => p.trainer_name).join(', ');
            reasonObj.winnerNames = winnerNames;
          }

          await this.endBattle(battleId, winnerTeam, reasonObj);

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking win condition:', error);
      return false;
    }
  }

  /**
   * Calculate rewards for a participant
   * @param {Object} participant - Participant data
   * @param {string} winnerType - Winner type
   * @param {Object} battleStats - Battle statistics
   * @returns {Promise<Object>} Participant rewards
   */
  async calculateParticipantRewards(participant, winnerType, battleStats) {
    try {
      const isWinner = (participant.team_side === winnerType);
      const baseExperience = 100;
      const baseCoins = 50;

      // Calculate experience based on participation and outcome
      let experience = baseExperience;
      if (isWinner) {
        experience *= 1.5; // Winner bonus
      }

      // Word count bonus (up to 50% bonus)
      const wordBonus = Math.min(0.5, (participant.word_count || 0) / 1000);
      experience = Math.floor(experience * (1 + wordBonus));

      // Calculate coins
      let coins = baseCoins;
      if (isWinner) {
        coins *= 1.2; // Winner bonus
      }
      coins = Math.floor(coins * (1 + wordBonus));

      return {
        participant_id: participant.id,
        discord_user_id: participant.discord_user_id,
        trainer_id: participant.trainer_id,
        trainer_name: participant.trainer_name,
        experience,
        coins,
        word_count: participant.word_count || 0,
        message_count: participant.message_count || 0,
        is_winner: isWinner
      };
    } catch (error) {
      console.error('Error calculating participant rewards:', error);
      throw error;
    }
  }
}

module.exports = new BattleManager();
