const { createSuccessEmbed, createInfoEmbed, createErrorEmbed } = require('../config/embeds');
const adventureService = require('../services/adventureService');

const adventureCommands = {
  /**
   * Generate a random encounter
   */
  encounter: async (interaction) => {
    try {
      await interaction.deferReply();

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check if adventure is active
      if (adventure.status !== 'active') {
        const embed = createErrorEmbed('This adventure is no longer active!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check encounter limit
      if (adventure.encounter_count >= (adventure.max_encounters || 3)) {
        const embed = createErrorEmbed(`Maximum encounters (${adventure.max_encounters || 3}) reached for this adventure!`);
        return await interaction.editReply({ embeds: [embed] });
      }

      // Generate encounter
      const encounter = await adventureService.generateEncounter(adventure.id, interaction.user.id);

      // Format and send encounter message
      const encounterMessage = adventureService.formatEncounterMessage(encounter, adventure);
      const embed = createInfoEmbed('Random Encounter', encounterMessage);

      await interaction.editReply({ embeds: [embed] });

      // Send helpful instructions based on encounter type
      const instructionMessage = adventureService.getEncounterInstructions(encounter);
      if (instructionMessage) {
        await interaction.followUp({ content: instructionMessage, ephemeral: false });
      }

    } catch (error) {
      console.error('Error in encounter command:', error);
      // Prefer backend-provided error message when available
      let errorMessage = 'Failed to generate encounter. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Attempt to capture a monster
   */
  capture: async (interaction) => {
    try {
      await interaction.deferReply();

      const monsterIndex = interaction.options.getInteger('index') || 1; // Default to first monster
      const trainerName = interaction.options.getString('trainer');
      const pokeballType = interaction.options.getString('pokeball');
      const pokepuffCount = interaction.options.getInteger('pokepuffs') || 0;

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check if adventure is active
      if (adventure.status !== 'active') {
        const embed = createErrorEmbed('This adventure is no longer active!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Find the most recent wild encounter or battle with wild monsters
      let targetEncounter = adventure.encounters?.find(enc =>
        enc.encounter_type === 'wild' && !enc.is_resolved
      );

      let isBattleCapture = false;
      if (!targetEncounter) {
        // Check for active battle with wild monsters
        targetEncounter = adventure.encounters?.find(enc =>
          enc.encounter_type === 'battle' && !enc.is_resolved
        );
        isBattleCapture = true;
      }

      if (!targetEncounter) {
        const embed = createErrorEmbed('No active wild encounters or battles to capture from! Use `/encounter` first.');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Attempt capture
      const captureResult = await adventureService.attemptCapture(
        targetEncounter.id,
        interaction.user.id,
        trainerName,
        pokeballType,
        pokepuffCount,
        monsterIndex,
        isBattleCapture
      );

      // Format result message
      let resultMessage;
      if (captureResult.success) {
        const monster = captureResult.monster;
        const species = [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/');
        resultMessage = `🎉 **SUCCESS!** 🎉\n\n` +
                       `${interaction.user.username} successfully captured monster #${monsterIndex} (${species}) for trainer ${trainerName}!\n` +
                       `Used: ${pokeballType}${pokepuffCount > 0 ? ` + ${pokepuffCount} Pokepuff(s)` : ''}\n\n` +
                       `The monster has been added to ${trainerName}'s collection!`;
      } else {
        resultMessage = `💔 **Capture Failed!** 💔\n\n` +
                       `Monster #${monsterIndex} broke free from the ${pokeballType}!\n` +
                       `${pokepuffCount > 0 ? `The ${pokepuffCount} Pokepuff(s) made it friendlier, but it wasn't enough.` : 'Try using Pokepuffs to increase your chances!'}\n\n` +
                       `Better luck next time!`;
      }

      const embed = captureResult.success ? 
        createSuccessEmbed(resultMessage) : 
        createErrorEmbed(resultMessage);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in capture command:', error);
      let errorMessage = 'Failed to attempt capture. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      const embed = createErrorEmbed(errorMessage);
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Resolve a battle encounter
   */
  result: async (interaction) => {
    try {
      await interaction.deferReply();

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check if adventure is active
      if (adventure.status !== 'active') {
        const embed = createErrorEmbed('This adventure is no longer active!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Find the most recent battle encounter
      const battleEncounter = adventure.encounters?.find(enc => 
        enc.encounter_type === 'battle' && !enc.is_resolved
      );

      if (!battleEncounter) {
        const embed = createErrorEmbed('No active battle encounters to resolve! Use `/encounter` first.');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Resolve battle
      const battleResult = await adventureService.resolveBattle(
        battleEncounter.id,
        interaction.user.id
      );

      // Format result message
      let resultMessage = `⚔️ **BATTLE RESOLVED!** ⚔️\n\n`;
      
      switch (battleResult.outcome) {
        case 'victory':
          resultMessage += `🏆 **VICTORY!** 🏆\n\n` +
                          `The enemies have been defeated!\n\n` +
                          `**Rewards for all participants:**\n`;
          break;
        case 'retreat':
          resultMessage += `🏃 **ENEMIES RETREATED!** 🏃\n\n` +
                          `The enemies decided to flee from battle!\n\n` +
                          `**Rewards for all participants:**\n`;
          break;
        case 'draw':
          resultMessage += `🤝 **DRAW!** 🤝\n\n` +
                          `The battle ended in a stalemate!\n\n` +
                          `**Rewards for all participants:**\n`;
          break;
      }

      // Add rewards to message
      if (battleResult.rewards.coins > 0) {
        resultMessage += `💰 ${battleResult.rewards.coins} Coins\n`;
      }
      if (battleResult.rewards.items && battleResult.rewards.items.length > 0) {
        resultMessage += `🎁 Items: ${battleResult.rewards.items.map(item => item.name).join(', ')}\n`;
      }

      resultMessage += `\nRewards have been added to all participants' adventure logs!`;

      const embed = createSuccessEmbed(resultMessage);
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in result command:', error);
      let errorMessage = 'Failed to resolve battle. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      const embed = createErrorEmbed(errorMessage);
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Initiate or join a battle
   */
  battle: async (interaction) => {
    try {
      console.log('=== BATTLE COMMAND CALLED ===');
      console.log('User:', interaction.user.id);
      console.log('Channel:', interaction.channel.id);

      await interaction.deferReply();

      const trainerName = interaction.options.getString('trainer');
      const opponent1 = interaction.options.getString('opponent1');
      const opponent2 = interaction.options.getString('opponent2');
      const opponent3 = interaction.options.getString('opponent3');

      console.log('Battle command options:', {
        trainerName,
        opponent1,
        opponent2,
        opponent3
      });

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check if adventure is active
      if (adventure.status !== 'active') {
        const embed = createErrorEmbed('This adventure is no longer active!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Collect opponent trainer names for PvP battle
      const opponentTrainers = [opponent1, opponent2, opponent3].filter(name => name !== null && name.trim() !== '');

      // Check for PvP battle
      if (opponentTrainers.length > 0) {
        console.log('Initiating PvP battle with:', {
          adventureId: adventure.id,
          discordUserId: interaction.user.id,
          trainerName,
          opponentTrainers
        });

        const battleResult = await adventureService.initiatePvPBattle(
          adventure.id,
          interaction.user.id,
          trainerName,
          opponentTrainers
        );

        if (battleResult.success) {
          const embed = createSuccessEmbed('PvP Battle Initiated!', battleResult.message);
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = createErrorEmbed(battleResult.message);
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        // Regular battle against encounter
        console.log('Initiating regular battle with:', {
          adventureId: adventure.id,
          discordUserId: interaction.user.id,
          trainerName
        });

        const battleResult = await adventureService.initiateBattle(
          adventure.id,
          interaction.user.id,
          trainerName
        );

        console.log('Battle result:', battleResult);

        if (battleResult.success) {
          const embed = createSuccessEmbed('Battle Initiated!', battleResult.message);
          await interaction.editReply({ embeds: [embed] });

          // Send battle instructions
          const battleInstructions = `⚔️ **Battle Instructions:**\n` +
                                    `• Use \`/attack [move_name] [target] [attacker]\` to attack enemies\n` +
                                    `  - Target enemies by their **number** (e.g., \`/attack tackle 1\` to attack enemy #1)\n` +
                                    `  - Specify attacker if you have multiple monsters (e.g., \`/attack tackle 1 Pikachu\`)\n` +
                                    `• Use \`/release [monster_name]\` to send out your monsters\n` +
                                    `• Use \`/withdraw [monster_name]\` to recall your monsters\n` +
                                    `• Use \`/battle-status\` to check the current battle state\n` +
                                    `• Use \`/capture [trainer] [pokeball]\` to catch weakened wild monsters 🌿\n` +
                                    `• Use \`/result\` when ready to resolve the battle`;

          await interaction.followUp({ content: battleInstructions, ephemeral: false });
        } else {
          const embed = createErrorEmbed(battleResult.message);
          await interaction.editReply({ embeds: [embed] });
        }
      }

    } catch (error) {
      console.error('Error in battle command:', error);
      let errorMessage = 'Failed to initiate battle. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Use an attack in battle
   */
  attack: async (interaction) => {
    try {
      await interaction.deferReply();

      const moveName = interaction.options.getString('move');
      const targetName = interaction.options.getString('target') || null;
      const message = interaction.options.getString('message') || '';
      const attackerName = interaction.options.getString('attacker') || null;

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Execute attack
      const attackResult = await adventureService.executeAttack(
        adventure.id,
        interaction.user.id,
        moveName,
        targetName,
        message,
        attackerName
      );

      if (attackResult.success) {
        const embed = createInfoEmbed('Attack Executed!', attackResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(attackResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in attack command:', error);

      // Try to extract meaningful error message
      let errorMessage = 'Failed to execute attack. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Use an item in battle
   */
  useItem: async (interaction) => {
    try {
      await interaction.deferReply();

      const itemName = interaction.options.getString('item');
      const targetName = interaction.options.getString('target') || null;
      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Use item
      const itemResult = await adventureService.useItem(
        adventure.id,
        interaction.user.id,
        itemName,
        targetName,
        message
      );

      if (itemResult.success) {
        const embed = createSuccessEmbed('Item Used!', itemResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(itemResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in use-item command:', error);
      let errorMessage = 'Failed to use item. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * View current battle status
   */
  battleStatus: async (interaction) => {
    try {
      await interaction.deferReply();

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get battle status
      const statusResult = await adventureService.getBattleStatus(adventure.id);

      if (statusResult.success) {
        const embed = createInfoEmbed('Battle Status', statusResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(statusResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in battle-status command:', error);
      let errorMessage = 'Failed to get battle status. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Release a monster to the battlefield
   */
  release: async (interaction) => {
    try {
      await interaction.deferReply();

      const monsterName = interaction.options.getString('monster');
      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Release monster
      const releaseResult = await adventureService.releaseMonster(
        adventure.id,
        interaction.user.id,
        monsterName,
        message
      );

      if (releaseResult.success) {
        const embed = createSuccessEmbed('Monster Released!', releaseResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(releaseResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in release command:', error);

      // Try to extract meaningful error message
      let errorMessage = 'Failed to release monster. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Withdraw a monster from the battlefield
   */
  withdraw: async (interaction) => {
    try {
      await interaction.deferReply();

      const monsterName = interaction.options.getString('monster');
      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Withdraw monster
      const withdrawResult = await adventureService.withdrawMonster(
        adventure.id,
        interaction.user.id,
        monsterName,
        message
      );

      if (withdrawResult.success) {
        const embed = createSuccessEmbed('Monster Withdrawn!', withdrawResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(withdrawResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in withdraw command:', error);

      // Try to extract meaningful error message
      let errorMessage = 'Failed to withdraw monster. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Set weather for the current battle
   */
  setWeather: async (interaction) => {
    try {
      await interaction.deferReply();

      const weather = interaction.options.getString('weather');

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Set weather
      const weatherResult = await adventureService.setBattleWeather(
        adventure.id,
        interaction.user.id,
        weather
      );

      if (weatherResult.success) {
        const embed = createSuccessEmbed('Weather Changed!', weatherResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(weatherResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in set-weather command:', error);
      let errorMessage = 'Failed to set weather. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Set terrain for the current battle
   */
  setTerrain: async (interaction) => {
    try {
      await interaction.deferReply();

      const terrain = interaction.options.getString('terrain');

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Set terrain
      const terrainResult = await adventureService.setBattleTerrain(
        adventure.id,
        interaction.user.id,
        terrain
      );

      if (terrainResult.success) {
        const embed = createSuccessEmbed('Terrain Changed!', terrainResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(terrainResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in set-terrain command:', error);
      let errorMessage = 'Failed to set terrain. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Attempt to flee from battle
   */
  flee: async (interaction) => {
    try {
      await interaction.deferReply();

      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Attempt to flee
      const fleeResult = await adventureService.fleeBattle(
        adventure.id,
        interaction.user.id,
        message
      );

      if (fleeResult.success) {
        const embed = createInfoEmbed('Flee Attempt!', fleeResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(fleeResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in flee command:', error);
      let errorMessage = 'Failed to flee from battle. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Forfeit the current battle
   */
  forfeit: async (interaction) => {
    try {
      await interaction.deferReply();

      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Forfeit battle
      const forfeitResult = await adventureService.forfeitBattle(
        adventure.id,
        interaction.user.id,
        message
      );

      if (forfeitResult.success) {
        const embed = createInfoEmbed('Battle Forfeited!', forfeitResult.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(forfeitResult.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in forfeit command:', error);
      let errorMessage = 'Failed to forfeit battle. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Force win the current battle
   */
  forcewin: async (interaction) => {
    try {
      await interaction.deferReply();

      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Force win battle
      const result = await adventureService.forceWinBattle(
        adventure.id,
        interaction.user.id,
        message
      );

      if (result.success) {
        const embed = createSuccessEmbed('Battle Force Won!', result.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(result.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in forcewin command:', error);
      let errorMessage = 'Failed to force win battle. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Force lose the current battle
   */
  forcelose: async (interaction) => {
    try {
      await interaction.deferReply();

      const message = interaction.options.getString('message') || '';

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Force lose battle
      const result = await adventureService.forceLoseBattle(
        adventure.id,
        interaction.user.id,
        message
      );

      if (result.success) {
        const embed = createInfoEmbed('Battle Force Lost!', result.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(result.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in forcelose command:', error);
      let errorMessage = 'Failed to force lose battle. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * Set win condition for battle
   */
  winCondition: async (interaction) => {
    try {
      await interaction.deferReply();

      const count = interaction.options.getInteger('count');

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Set win condition
      const result = await adventureService.setWinCondition(
        adventure.id,
        interaction.user.id,
        count
      );

      if (result.success) {
        const embed = createSuccessEmbed('Win Condition Set!', result.message);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed(result.message);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in win-condition command:', error);
      let errorMessage = 'Failed to set win condition. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      const embed = createErrorEmbed(errorMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  /**
   * End the adventure and calculate rewards
   */
  end: async (interaction) => {
    try {
      await interaction.deferReply();

      // Check if this is an adventure thread
      if (!interaction.channel.isThread()) {
        const embed = createErrorEmbed('This command can only be used in adventure threads!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get adventure data
      const adventure = await adventureService.getAdventureByThreadId(interaction.channel.id);
      if (!adventure) {
        const embed = createErrorEmbed('This thread is not associated with an adventure!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check if adventure is active
      if (adventure.status !== 'active') {
        const embed = createErrorEmbed('This adventure is already completed!');
        return await interaction.editReply({ embeds: [embed] });
      }

      // End adventure and calculate rewards
      const completionData = await adventureService.endAdventure(adventure.id, interaction.user.id);

      // Format completion message
      let completionMessage = `🏁 **ADVENTURE COMPLETED!** 🏁\n\n` +
                             `"${adventure.title}" has come to an end!\n\n` +
                             `**Final Statistics:**\n` +
                             `👥 Participants: ${completionData.participants.length}\n` +
                             `⚔️ Encounters: ${adventure.encounter_count}\n` +
                             `📝 Total Words: ${completionData.totalStats?.totalWords || 0}\n\n` +
                             `**Participant Rewards:**\n`;

      completionData.participants.forEach(participant => {
        completionMessage += `\n**${participant.username || 'Unknown User'}:**\n` +
                           `📝 ${participant.word_count} words\n` +
                           `⭐ ${participant.levels_earned} levels\n` +
                           `💰 ${participant.coins_earned} coins\n`;
        
        if (participant.items_earned.length > 0) {
          completionMessage += `🎁 ${participant.items_earned.length} item(s)\n`;
        }
      });

      // Always use the production URL for adventure rewards link
      const adventureRewardsUrl = 'https://duskanddawn.net/adventure-rewards';

      completionMessage += `\n🎁 **Claim your rewards:** [Adventure Rewards](${adventureRewardsUrl})\n\n` +
                          `Thank you for participating! 🌟`;

      const embed = createSuccessEmbed(completionMessage);
      await interaction.editReply({ embeds: [embed] });

      // Archive the thread after a delay
      setTimeout(async () => {
        try {
          await interaction.channel.setArchived(true, 'Adventure completed');
        } catch (error) {
          console.error('Error archiving adventure thread:', error);
        }
      }, 30000); // 30 seconds delay

    } catch (error) {
      console.error('Error in end command:', error);
      let errorMessage = 'Failed to end adventure. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      const embed = createErrorEmbed(errorMessage);
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }
};

module.exports = adventureCommands;
