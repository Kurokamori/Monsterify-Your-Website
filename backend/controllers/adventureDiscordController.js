const Adventure = require('../models/Adventure');
const AdventureThread = require('../models/AdventureThread');
const AdventureParticipant = require('../models/AdventureParticipant');
const AdventureEncounter = require('../models/AdventureEncounter');
const EncounterService = require('../services/EncounterService');
const CaptureService = require('../services/CaptureService');
const BattleService = require('../services/BattleService');
const BattleManager = require('../services/BattleManager');
const BattleActionService = require('../services/BattleActionService');
const AdventureRewardService = require('../services/AdventureRewardService');

/**
 * Create Discord thread for adventure
 */
const createAdventureThread = async (req, res) => {
  try {
    const { adventureId, discordThreadId, discordChannelId, threadName } = req.body;

    // Validate required fields
    if (!adventureId || !discordThreadId || !discordChannelId || !threadName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if adventure exists
    const adventure = await Adventure.getById(adventureId);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Create thread record
    const threadData = {
      adventure_id: adventureId,
      discord_thread_id: discordThreadId,
      discord_channel_id: discordChannelId,
      thread_name: threadName
    };

    const thread = await AdventureThread.create(threadData);

    // Update adventure with Discord thread info
    await Adventure.update(adventureId, {
      discord_thread_id: discordThreadId,
      discord_channel_id: discordChannelId
    });

    res.json({
      success: true,
      thread
    });

  } catch (error) {
    console.error('Error creating adventure thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create adventure thread',
      error: error.message
    });
  }
};

/**
 * Get adventure by Discord thread ID
 */
const getAdventureByThreadId = async (req, res) => {
  try {
    const { discordThreadId } = req.params;

    const thread = await AdventureThread.getByDiscordThreadId(discordThreadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Adventure thread not found'
      });
    }

    // Get full adventure data
    const adventure = await Adventure.getById(thread.adventure_id);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Get recent encounters
    const encounters = await AdventureEncounter.getByAdventure(adventure.id, { limit: 10 });

    res.json({
      success: true,
      adventure: {
        ...adventure,
        thread_info: thread,
        encounters
      }
    });

  } catch (error) {
    console.error('Error getting adventure by thread ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get adventure',
      error: error.message
    });
  }
};

/**
 * Track message word count
 */
const trackMessage = async (req, res) => {
  try {
    const { discordThreadId, discordUserId, wordCount, messageCount = 1 } = req.body;

    // Validate required fields
    if (!discordThreadId || !discordUserId || wordCount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Track the message
    const participant = await AdventureParticipant.trackMessage(
      discordThreadId,
      discordUserId,
      wordCount,
      messageCount
    );

    res.json({
      success: true,
      participant
    });

  } catch (error) {
    console.error('Error tracking message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track message',
      error: error.message
    });
  }
};

/**
 * Generate encounter
 */
const generateEncounter = async (req, res) => {
  try {
    const { adventureId, discordUserId } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get adventure
    const adventure = await Adventure.getById(adventureId);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if adventure is active
    if (adventure.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Adventure is not active'
      });
    }

    // Check encounter limit
    const encounterCount = await AdventureEncounter.countByAdventure(adventureId);
    const maxEncounters = adventure.max_encounters || 3;
    
    if (encounterCount >= maxEncounters) {
      return res.status(400).json({
        success: false,
        message: `Maximum encounters (${maxEncounters}) reached`
      });
    }

    // Generate encounter
    const encounterData = await EncounterService.generateRandomEncounter(adventure);

    // Handle auto-battle encounters
    if (encounterData.type === 'auto_battle') {
      // Create battle encounter instead
      const battleEncounter = await AdventureEncounter.create({
        adventure_id: adventureId,
        encounter_type: 'battle',
        encounter_data: encounterData.data.battleData,
        created_by_discord_user_id: discordUserId,
        is_auto_battle: true
      });

      // Update adventure encounter count
      await Adventure.update(adventureId, {
        encounter_count: encounterCount + 1
      });

      return res.json({
        success: true,
        encounter: {
          ...battleEncounter,
          encounter_data: encounterData.data.battleData
        },
        message: 'Aggressive monsters attack! Battle initiated automatically!',
        isAutoBattle: true,
        originalGroups: encounterData.data.originalGroups
      });
    }

    // Save encounter to database
    const encounter = await AdventureEncounter.create({
      adventure_id: adventureId,
      encounter_type: encounterData.type,
      encounter_data: encounterData.data,
      created_by_discord_user_id: discordUserId
    });

    // Update adventure encounter count
    await Adventure.update(adventureId, {
      encounter_count: encounterCount + 1
    });

    res.json({
      success: true,
      encounter: {
        id: encounter.id,
        type: encounterData.type,
        data: encounterData.data
      }
    });

  } catch (error) {
    console.error('Error generating encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate encounter',
      error: error.message
    });
  }
};

/**
 * Attempt monster capture
 */
const attemptCapture = async (req, res) => {
  try {
    const { encounterId, discordUserId, trainerName, pokeballType, pokepuffCount = 0, monsterIndex = 1, isBattleCapture = false } = req.body;

    // Validate required fields
    if (!encounterId || !discordUserId || !trainerName || !pokeballType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get encounter
    const encounter = await AdventureEncounter.getById(encounterId);
    if (!encounter) {
      return res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
    }

    // Check if encounter is wild type or battle with wild monsters
    if (encounter.encounter_type !== 'wild' && !(encounter.encounter_type === 'battle' && isBattleCapture)) {
      return res.status(400).json({
        success: false,
        message: 'Can only capture from wild encounters or battles with wild monsters'
      });
    }

    // Check if encounter is resolved
    if (encounter.is_resolved) {
      return res.status(400).json({
        success: false,
        message: 'This encounter has already been resolved'
      });
    }

    // Use CaptureService to handle the capture attempt
    const captureData = {
      encounterId,
      discordUserId,
      trainerName,
      pokeballType,
      pokepuffCount,
      monsterIndex,
      isBattleCapture
    };

    const captureResult = await CaptureService.attemptCapture(captureData);

    res.json({
      success: true,
      ...captureResult
    });

  } catch (error) {
    console.error('Error attempting capture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to attempt capture',
      error: error.message
    });
  }
};

/**
 * Resolve battle encounter
 */
const resolveBattle = async (req, res) => {
  try {
    const { encounterId, discordUserId } = req.body;

    // Validate required fields
    if (!encounterId || !discordUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get encounter
    const encounter = await AdventureEncounter.getById(encounterId);
    if (!encounter) {
      return res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
    }

    // Check if encounter is battle type
    if (encounter.encounter_type !== 'battle') {
      return res.status(400).json({
        success: false,
        message: 'Can only resolve battle encounters'
      });
    }

    // Check if encounter is already resolved
    if (encounter.is_resolved) {
      return res.status(400).json({
        success: false,
        message: 'This encounter has already been resolved'
      });
    }

    // Use BattleService to resolve the battle
    const battleData = {
      encounterId,
      discordUserId
    };

    const battleResult = await BattleService.resolveBattle(battleData);

    res.json({
      success: true,
      ...battleResult
    });

  } catch (error) {
    console.error('Error resolving battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve battle',
      error: error.message
    });
  }
};

/**
 * End adventure and calculate rewards
 */
const endAdventure = async (req, res) => {
  try {
    const { adventureId, discordUserId } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Use AdventureRewardService to end the adventure
    const completionData = {
      adventureId,
      discordUserId
    };

    const completionResult = await AdventureRewardService.endAdventure(completionData);

    res.json({
      success: true,
      ...completionResult
    });

  } catch (error) {
    console.error('Error ending adventure:', error);
    let errorMessage = 'Failed to end adventure';

    if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Get unclaimed adventure rewards for a Discord user
 */
const getUnclaimedRewards = async (req, res) => {
  try {
    const { discordUserId } = req.params;

    const unclaimedRewards = await AdventureRewardService.getUnclaimedRewards(discordUserId);

    res.json({
      success: true,
      rewards: unclaimedRewards
    });

  } catch (error) {
    console.error('Error getting unclaimed rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unclaimed rewards',
      error: error.message
    });
  }
};

/**
 * Initiate or join a battle
 */
const initiateBattle = async (req, res) => {
  try {
    const { adventureId, discordUserId, trainerName } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !trainerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get adventure
    const adventure = await Adventure.getById(adventureId);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if adventure is active
    if (adventure.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Adventure is not active'
      });
    }

    // Import battle manager
    const BattleManager = require('../services/BattleManager');
    const BattleInstance = require('../models/BattleInstance');
    const Trainer = require('../models/Trainer');

    // Check for existing active battle
    let activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (activeBattle) {
      console.log('=== JOINING EXISTING BATTLE ===');
      console.log('Active battle found:', JSON.stringify(activeBattle, null, 2));

      // Try to join existing battle
      const trainer = await Trainer.getByNameAndUser(trainerName, discordUserId);
      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: `Trainer "${trainerName}" not found`
        });
      }

      const participant = await BattleManager.addPlayerToBattle(
        activeBattle.id,
        discordUserId,
        trainer.id
      );

      console.log('Joined existing battle with participant:', participant);

      return res.json({
        success: true,
        message: `${trainerName} joined the battle!`,
        battle: activeBattle,
        participant
      });
    }

    // Check for battle encounter to start new battle
    const AdventureEncounter = require('../models/AdventureEncounter');
    const battleEncounter = await AdventureEncounter.getByAdventure(adventureId, {
      encounterType: 'battle',
      isResolved: false,
      limit: 1
    });

    if (battleEncounter.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No battle encounters available. Use `/encounter` to generate one first.'
      });
    }

    // Initialize new battle
    console.log('=== BATTLE INITIALIZATION START ===');
    console.log('Battle encounter data:', JSON.stringify(battleEncounter[0], null, 2));
    console.log('Discord user ID:', discordUserId);

    let newBattle;
    try {
      newBattle = await BattleManager.initializeBattle(
        battleEncounter[0],
        discordUserId
      );
      console.log('=== BATTLE INITIALIZATION COMPLETE ===');
      console.log('Created battle:', JSON.stringify(newBattle, null, 2));
    } catch (battleError) {
      console.error('=== BATTLE INITIALIZATION FAILED ===');
      console.error('Error:', battleError);
      throw battleError;
    }

    // Add player to battle
    const trainer = await Trainer.getByNameAndUser(trainerName, discordUserId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer "${trainerName}" not found`
      });
    }

    const participant = await BattleManager.addPlayerToBattle(
      newBattle.id,
      discordUserId,
      trainer.id
    );

    res.json({
      success: true,
      message: `Battle initiated! ${trainerName} enters the fray!`,
      battle: newBattle,
      participant
    });

  } catch (error) {
    console.error('Error initiating battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate battle',
      error: error.message
    });
  }
};

/**
 * Execute an attack in battle
 */
const executeAttack = async (req, res) => {
  try {
    const { adventureId, discordUserId, moveName, targetName = null, message = '', attackerName = null } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !moveName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Services already imported at top of file

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.'
      });
    }

    // Check if it's the player's turn
    const isPlayerTurn = await BattleManager.isParticipantTurn(activeBattle.id, discordUserId);
    if (!isPlayerTurn) {
      return res.status(400).json({
        success: false,
        message: 'It\'s not your turn!'
      });
    }

    // Execute the attack
    const attackResult = await BattleActionService.executeAttack(
      activeBattle.id,
      discordUserId,
      moveName,
      targetName,
      message,
      attackerName
    );

    // After player attack, advance turn and process AI turns
    if (attackResult.success && !attackResult.battleEnded) {
      try {
        console.log('=== ADVANCING TURN AFTER PLAYER ATTACK ===');
        // Advance turn to next participant
        await BattleManager.advanceTurn(activeBattle.id);
        console.log('=== TURN ADVANCED, NOW PROCESSING AI TURNS ===');

        // Process AI turns after advancing turn
        await BattleActionService.processAITurns(activeBattle.id);
        console.log('=== AI TURNS PROCESSING COMPLETE ===');
      } catch (turnError) {
        console.error('Error advancing turn or processing AI:', turnError);
        // Don't fail the attack if turn advancement fails
      }
    } else {
      console.log('=== NOT PROCESSING AI TURNS ===');
      console.log('Attack result:', { success: attackResult.success, battleEnded: attackResult.battleEnded });
    }

    res.json({
      success: true,
      message: attackResult.message,
      result: attackResult
    });

  } catch (error) {
    console.error('Error executing attack:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute attack',
      error: error.message
    });
  }
};

/**
 * Use an item in battle
 */
const useItemInBattle = async (req, res) => {
  try {
    const { adventureId, discordUserId, itemName, targetIndex = 1, message = '' } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Import required services
    const BattleManager = require('../services/BattleManager');
    const BattleActionService = require('../services/BattleActionService');

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.'
      });
    }

    // Check if it's the player's turn
    const isPlayerTurn = await BattleManager.isParticipantTurn(activeBattle.id, discordUserId);
    if (!isPlayerTurn) {
      return res.status(400).json({
        success: false,
        message: 'It\'s not your turn!'
      });
    }

    // Use the item
    const itemResult = await BattleActionService.useItem(
      activeBattle.id,
      discordUserId,
      itemName,
      targetIndex,
      message
    );

    res.json({
      success: true,
      message: itemResult.message,
      result: itemResult
    });

  } catch (error) {
    console.error('Error using item in battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use item',
      error: error.message
    });
  }
};

/**
 * Get battle status
 */
const getBattleStatus = async (req, res) => {
  try {
    const { adventureId } = req.params;

    // Validate required fields
    if (!adventureId) {
      return res.status(400).json({
        success: false,
        message: 'Adventure ID is required'
      });
    }

    // Import required services
    const BattleManager = require('../services/BattleManager');

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    console.log('Getting active battle for adventure:', adventureId);
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);
    console.log('Active battle found:', activeBattle);

    if (!activeBattle) {
      console.log('No active battle found for adventure:', adventureId);
      return res.json({
        success: true,
        message: 'No active battle found.',
        hasBattle: false
      });
    }

    // Get battle state
    const battleState = await BattleManager.getBattleState(activeBattle.id);

    // Format battle status message
    let statusMessage = `🔥 **BATTLE IN PROGRESS** 🔥\n\n`;
    statusMessage += `**Turn ${battleState.currentTurn}**\n`;

    if (battleState.currentParticipant) {
      statusMessage += `Current Turn: **${battleState.currentParticipant.trainer_name}**\n\n`;
    }

    statusMessage += `**Participants:**\n`;
    for (const participant of battleState.participants) {
      const activeMonsters = battleState.monsters.filter(m =>
        m.participant_id === participant.id && !m.is_fainted
      );
      statusMessage += `• ${participant.trainer_name} (${activeMonsters.length} monsters)\n`;
    }

    statusMessage += `\n**Active Monsters:**\n`;
    const activeMonsters = battleState.monsters.filter(m => m.is_active && !m.is_fainted);

    // Separate player and enemy monsters
    const playerMonsters = activeMonsters.filter(m => {
      const participant = battleState.participants.find(p => p.id === m.participant_id);
      return participant && participant.participant_type === 'player';
    });

    const enemyMonsters = activeMonsters.filter(m => {
      const participant = battleState.participants.find(p => p.id === m.participant_id);
      return participant && (participant.participant_type === 'npc' || participant.participant_type === 'wild');
    });

    // Show player monsters first
    if (playerMonsters.length > 0) {
      statusMessage += `**Your Team:**\n`;
      for (const monster of playerMonsters) {
        const hpPercent = Math.round((monster.current_hp / monster.max_hp) * 100);
        const healthBar = generateHealthBar(monster.current_hp, monster.max_hp);

        statusMessage += `• **${monster.monster_data.name || 'Unknown'}** (Level ${monster.monster_data.level || 1})\n`;
        statusMessage += `  ${monster.current_hp}/${monster.max_hp} HP (${hpPercent}%) ${healthBar}\n\n`;
      }
    }

    // Show enemy monsters with target indexes
    if (enemyMonsters.length > 0) {
      statusMessage += `**Enemy Team:**\n`;
      enemyMonsters.forEach((monster, index) => {
        const hpPercent = Math.round((monster.current_hp / monster.max_hp) * 100);
        const healthBar = generateHealthBar(monster.current_hp, monster.max_hp);
        const wildIndicator = monster.monster_data.isWild ? ' 🌿' : '';

        statusMessage += `**${index + 1}.** **${monster.monster_data.name || 'Unknown'}** (Level ${monster.monster_data.level || 1})${wildIndicator}\n`;
        statusMessage += `  ${monster.current_hp}/${monster.max_hp} HP (${hpPercent}%) ${healthBar}\n\n`;
      });

      if (enemyMonsters.some(m => m.monster_data.isWild)) {
        statusMessage += `🌿 = Wild monsters (can be captured)\n\n`;
      }
    }

    res.json({
      success: true,
      message: statusMessage,
      hasBattle: true,
      battleState
    });

  } catch (error) {
    console.error('Error getting battle status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get battle status',
      error: error.message
    });
  }
};

/**
 * Generate health bar for battle status
 * @param {number} currentHp - Current HP
 * @param {number} maxHp - Maximum HP
 * @returns {string} Health bar string
 */
const generateHealthBar = (currentHp, maxHp) => {
  const barLength = 10;
  const filledBars = Math.floor((currentHp / maxHp) * barLength);
  const emptyBars = barLength - filledBars;

  let healthColor = '🟢'; // Green
  const hpPercent = (currentHp / maxHp) * 100;
  if (hpPercent < 25) {
    healthColor = '🔴'; // Red
  } else if (hpPercent < 50) {
    healthColor = '🟡'; // Yellow
  }

  return `[${healthColor.repeat(filledBars)}⬜${emptyBars > 0 ? '⬜'.repeat(emptyBars) : ''}]`;
};

/**
 * Initiate a PvP battle
 */
const initiatePvPBattle = async (req, res) => {
  try {
    console.log('initiatePvPBattle - Received request body:', req.body);

    // Handle both old and new parameter names for backward compatibility
    const { adventureId, discordUserId, trainerName, opponentTrainers, opponentIds } = req.body;
    const opponents = opponentTrainers || opponentIds; // Use new name first, fall back to old

    console.log('initiatePvPBattle - Extracted values:', {
      adventureId,
      discordUserId,
      trainerName,
      opponentTrainers,
      opponentIds,
      opponents,
      opponentsType: typeof opponents,
      isArray: Array.isArray(opponents)
    });

    // Validate required fields
    if (!adventureId || !discordUserId || !trainerName || !Array.isArray(opponents)) {
      console.log('initiatePvPBattle - Validation failed:', {
        hasAdventureId: !!adventureId,
        hasDiscordUserId: !!discordUserId,
        hasTrainerName: !!trainerName,
        hasOpponents: !!opponents,
        isOpponentsArray: Array.isArray(opponents)
      });

      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Import required services
    const BattleManager = require('../services/BattleManager');
    const BattleInstance = require('../models/BattleInstance');
    const Trainer = require('../models/Trainer');

    // Check for existing active battle
    let activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active battle in this adventure.'
      });
    }

    // Validate that opponent trainers exist
    const validOpponents = [];
    for (const opponentTrainerName of opponents) {
      const opponentTrainer = await Trainer.getByName(opponentTrainerName);
      if (opponentTrainer) {
        validOpponents.push({
          trainer_name: opponentTrainerName,
          trainer_id: opponentTrainer.id,
          discord_user_id: opponentTrainer.player_user_id
        });
      }
    }

    if (validOpponents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the specified opponent trainers were found.'
      });
    }

    // Create PvP battle instance
    const pvpBattle = await BattleInstance.create({
      adventure_id: adventureId,
      encounter_id: null,
      battle_type: 'pvp',
      created_by_discord_user_id: discordUserId,
      battle_data: {
        pvp: true,
        challenger: discordUserId,
        challenger_trainer: trainerName,
        opponent_trainers: opponents,
        valid_opponents: validOpponents,
        initialized_at: new Date().toISOString()
      }
    });

    // Add challenger to battle
    const challengerTrainer = await Trainer.getByNameAndUser(trainerName, discordUserId);
    if (!challengerTrainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer "${trainerName}" not found`
      });
    }

    await BattleManager.addPlayerToBattle(pvpBattle.id, discordUserId, challengerTrainer.id);

    // Log battle creation
    const BattleLog = require('../models/BattleLog');
    const opponentList = opponents.join(', ');
    await BattleLog.logSystem(pvpBattle.id,
      `🔥 **PvP BATTLE INITIATED!** 🔥\n**${trainerName}** challenges: **${opponentList}**\n\nOpponents can join with \`/battle [trainer_name]\``
    );

    res.json({
      success: true,
      message: `PvP battle initiated! ${trainerName} challenges ${opponentList}. Waiting for opponents to join...`,
      battle: pvpBattle,
      validOpponents: validOpponents.length,
      totalChallenged: opponents.length
    });

  } catch (error) {
    console.error('Error initiating PvP battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate PvP battle',
      error: error.message
    });
  }
};

/**
 * Release a monster to the battlefield
 */
const releaseMonster = async (req, res) => {
  try {
    // Handle both monsterName and monsterIndex for backward compatibility
    const { adventureId, discordUserId, monsterName, monsterIndex, message = '' } = req.body;
    const monster = monsterName || monsterIndex;

    console.log('releaseMonster - Received request body:', req.body);
    console.log('releaseMonster - Using monster identifier:', monster);

    // Validate required fields
    if (!adventureId || !discordUserId || !monster) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Import required services
    const BattleManager = require('../services/BattleManager');
    const BattleActionService = require('../services/BattleActionService');

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.'
      });
    }

    // Check if it's the player's turn (allow releases during setup phase)
    const isPlayerTurn = await BattleManager.isParticipantTurn(activeBattle.id, discordUserId, 'release');
    if (!isPlayerTurn) {
      return res.status(400).json({
        success: false,
        message: 'It\'s not your turn!'
      });
    }

    // Release the monster
    const releaseResult = await BattleActionService.releaseMonster(
      activeBattle.id,
      discordUserId,
      monster,
      message
    );

    res.json({
      success: true,
      message: releaseResult.message,
      result: releaseResult
    });

  } catch (error) {
    console.error('Error releasing monster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release monster',
      error: error.message
    });
  }
};

/**
 * Withdraw a monster from the battlefield
 */
const withdrawMonster = async (req, res) => {
  try {
    const { adventureId, discordUserId, monsterName, message = '' } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Import required services
    const BattleManager = require('../services/BattleManager');
    const BattleActionService = require('../services/BattleActionService');

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.'
      });
    }

    // Check if it's the player's turn (allow withdraws during setup phase)
    const isPlayerTurn = await BattleManager.isParticipantTurn(activeBattle.id, discordUserId, 'switch');
    if (!isPlayerTurn) {
      return res.status(400).json({
        success: false,
        message: 'It\'s not your turn!'
      });
    }

    // Withdraw the monster
    const withdrawResult = await BattleActionService.withdrawMonster(
      activeBattle.id,
      discordUserId,
      monsterName,
      message
    );

    res.json({
      success: true,
      message: withdrawResult.message,
      result: withdrawResult
    });

  } catch (error) {
    console.error('Error withdrawing monster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw monster',
      error: error.message
    });
  }
};

/**
 * Set battle weather
 */
const setBattleWeather = async (req, res) => {
  try {
    const { adventureId, discordUserId, weather } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !weather) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'No active battle found.'
      });
    }

    // Update battle data with weather
    const battleData = activeBattle.battle_data || {};
    battleData.weather = weather;
    battleData.weather_set_at = new Date().toISOString();
    battleData.weather_set_by = discordUserId;

    await BattleInstance.update(activeBattle.id, { battle_data: battleData });

    // Log weather change
    const BattleLog = require('../models/BattleLog');
    const weatherEmojis = {
      clear: '☀️',
      rain: '🌧️',
      sunny: '🌞',
      sandstorm: '🌪️',
      hail: '🧊',
      snow: '❄️',
      fog: '🌫️'
    };

    await BattleLog.logSystem(activeBattle.id,
      `${weatherEmojis[weather] || '🌤️'} **Weather changed to ${weather.toUpperCase()}!**`
    );

    res.json({
      success: true,
      message: `Weather set to ${weather}! This may affect certain moves and abilities.`
    });

  } catch (error) {
    console.error('Error setting battle weather:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set weather',
      error: error.message
    });
  }
};

/**
 * Set battle terrain
 */
const setBattleTerrain = async (req, res) => {
  try {
    const { adventureId, discordUserId, terrain } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !terrain) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(400).json({
        success: false,
        message: 'No active battle found.'
      });
    }

    // Update battle data with terrain
    const battleData = activeBattle.battle_data || {};
    battleData.terrain = terrain;
    battleData.terrain_set_at = new Date().toISOString();
    battleData.terrain_set_by = discordUserId;

    await BattleInstance.update(activeBattle.id, { battle_data: battleData });

    // Log terrain change
    const BattleLog = require('../models/BattleLog');
    const terrainEmojis = {
      normal: '🌱',
      electric: '⚡',
      grassy: '🌿',
      misty: '🌸',
      psychic: '🔮'
    };

    await BattleLog.logSystem(activeBattle.id,
      `${terrainEmojis[terrain] || '🌍'} **Terrain changed to ${terrain.toUpperCase()}!**`
    );

    res.json({
      success: true,
      message: `Terrain set to ${terrain}! This may provide various battle effects.`
    });

  } catch (error) {
    console.error('Error setting battle terrain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set terrain',
      error: error.message
    });
  }
};

/**
 * Force win the current battle
 */
const forceWinBattle = async (req, res) => {
  try {
    const { adventureId, discordUserId, message = '' } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(404).json({
        success: false,
        message: 'No active battle found in this adventure'
      });
    }

    // Force win the battle
    const BattleManager = require('../services/BattleManager');
    const result = await BattleManager.forceEndBattle(activeBattle.id, 'players', message);

    res.json({
      success: true,
      message: result.message || 'Battle force won!',
      result
    });

  } catch (error) {
    console.error('Error force winning battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force win battle',
      error: error.message
    });
  }
};

/**
 * Force lose the current battle
 */
const forceLoseBattle = async (req, res) => {
  try {
    const { adventureId, discordUserId, message = '' } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(404).json({
        success: false,
        message: 'No active battle found in this adventure'
      });
    }

    // Force lose the battle
    const BattleManager = require('../services/BattleManager');
    const result = await BattleManager.forceEndBattle(activeBattle.id, 'opponents', message);

    res.json({
      success: true,
      message: result.message || 'Battle force lost!',
      result
    });

  } catch (error) {
    console.error('Error force losing battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force lose battle',
      error: error.message
    });
  }
};

/**
 * Set win condition for battle
 */
const setWinCondition = async (req, res) => {
  try {
    const { adventureId, discordUserId, count } = req.body;

    // Validate required fields
    if (!adventureId || !discordUserId || !count) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(404).json({
        success: false,
        message: 'No active battle found in this adventure'
      });
    }

    // Update battle data with win condition
    const updatedBattleData = {
      ...activeBattle.battle_data,
      win_condition: {
        knockout_count: count,
        set_by: discordUserId,
        set_at: new Date().toISOString()
      }
    };

    await BattleInstance.update(activeBattle.id, {
      battle_data: updatedBattleData
    });

    // Log the change
    const BattleLog = require('../models/BattleLog');
    await BattleLog.logSystem(activeBattle.id,
      `⚙️ **Win condition set**: ${count} monsters must be knocked out to win the battle`
    );

    res.json({
      success: true,
      message: `Win condition set to ${count} knockouts`,
      winCondition: count
    });

  } catch (error) {
    console.error('Error setting win condition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set win condition',
      error: error.message
    });
  }
};

/**
 * Forfeit battle
 */
const forfeitBattle = async (req, res) => {
  try {
    const { adventureId, discordUserId } = req.body;

    if (!adventureId || !discordUserId) {
      return res.status(400).json({
        success: false,
        message: 'Adventure ID and Discord user ID are required'
      });
    }

    // Get active battle
    const BattleInstance = require('../models/BattleInstance');
    const activeBattle = await BattleInstance.getActiveByAdventure(adventureId);

    if (!activeBattle) {
      return res.status(404).json({
        success: false,
        message: 'No active battle found'
      });
    }

    // Check if user is in the battle
    const BattleParticipant = require('../models/BattleParticipant');
    const participant = await BattleParticipant.getByBattleAndUser(activeBattle.id, discordUserId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'You are not participating in this battle'
      });
    }

    // End battle with forfeit
    const BattleManager = require('../services/BattleManager');
    const forfeitResult = {
      result: 'forfeit',
      message: `🏳️ **BATTLE FORFEITED** 🏳️\n\n**${participant.trainer_name || 'Player'}** has forfeited the battle!`,
      winner_type: participant.team_side === 'players' ? 'opponents' : 'players'
    };

    await BattleManager.endBattle(activeBattle.id, forfeitResult.winner_type, forfeitResult.message);

    res.json({
      success: true,
      message: 'Battle forfeited successfully',
      result: forfeitResult
    });

  } catch (error) {
    console.error('Error forfeiting battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forfeit battle'
    });
  }
};

module.exports = {
  createAdventureThread,
  getAdventureByThreadId,
  trackMessage,
  generateEncounter,
  attemptCapture,
  resolveBattle,
  endAdventure,
  getUnclaimedRewards,
  initiateBattle,
  executeAttack,
  useItemInBattle,
  getBattleStatus,
  initiatePvPBattle,
  releaseMonster,
  withdrawMonster,
  setBattleWeather,
  setBattleTerrain,
  forceWinBattle,
  forceLoseBattle,
  setWinCondition,
  forfeitBattle
};
