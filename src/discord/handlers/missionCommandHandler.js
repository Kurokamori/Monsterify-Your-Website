const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const MissionSystem = require('../../utils/MissionSystem');
const Trainer = require('../../models/Trainer');

/**
 * Handler for mission-related commands
 */
class MissionCommandHandler {
  /**
   * Handle mission command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleMissionCommand(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'list':
          await this._handleMissionList(interaction);
          break;
        case 'start':
          await this._handleMissionStart(interaction);
          break;
        case 'status':
          await this._handleMissionStatus(interaction);
          break;
        case 'abandon':
          await this._handleMissionAbandon(interaction);
          break;
        case 'history':
          await this._handleMissionHistory(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown mission subcommand.' });
      }
    } catch (error) {
      console.error('Error handling mission command:', error);
      await interaction.editReply({ content: `Error processing mission command: ${error.message}` });
    }
  }

  /**
   * Handle create-mission command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleCreateMissionCommand(interaction) {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return await interaction.editReply({ content: 'You do not have permission to create missions.' });
      }
      
      // Get mission data
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const type = interaction.options.getString('type');
      const difficulty = interaction.options.getString('difficulty');
      
      // Create mission
      const result = await MissionSystem.createMission({
        name,
        description,
        type,
        difficulty,
        requirements: this._getDefaultRequirements(type, difficulty),
        rewards: this._getDefaultRewards(difficulty)
      });
      
      if (!result.success) {
        return await interaction.editReply({ content: result.message });
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('New Mission Created')
        .setDescription(`Mission "${name}" has been created!`)
        .setColor(this._getDifficultyColor(difficulty))
        .addFields(
          { name: 'Description', value: description, inline: false },
          { name: 'Type', value: type, inline: true },
          { name: 'Difficulty', value: difficulty, inline: true },
          { name: 'ID', value: result.mission.id.toString(), inline: true }
        );
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling create-mission command:', error);
      await interaction.editReply({ content: `Error creating mission: ${error.message}` });
    }
  }

  /**
   * Handle mission list
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMissionList(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Get available missions
    const result = await MissionSystem.getAvailableMissions(trainerId);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Check if there's an active mission
    if (result.activeMission) {
      // Create embed for active mission
      const mission = result.activeMission.mission;
      const progressData = result.activeMission.progress_data;
      
      const embed = new EmbedBuilder()
        .setTitle(`${trainer.name}'s Active Mission`)
        .setDescription('You already have an active mission. Complete it first!')
        .setColor(this._getDifficultyColor(mission.difficulty))
        .addFields(
          { name: 'Mission', value: mission.name, inline: true },
          { name: 'Type', value: mission.type, inline: true },
          { name: 'Difficulty', value: mission.difficulty, inline: true }
        );
      
      // Add progress field based on mission type
      switch (mission.type) {
        case MissionSystem.MISSION_TYPES.WRITING:
          embed.addFields({
            name: 'Progress',
            value: `${progressData.current_words}/${progressData.target_words} words`,
            inline: false
          });
          break;
        
        case MissionSystem.MISSION_TYPES.ART:
          embed.addFields({
            name: 'Progress',
            value: `${progressData.current_submissions}/${progressData.target_submissions} submissions`,
            inline: false
          });
          break;
        
        case MissionSystem.MISSION_TYPES.TASK:
          embed.addFields({
            name: 'Progress',
            value: `${progressData.completed_tasks}/${progressData.target_tasks} tasks`,
            inline: false
          });
          break;
        
        case MissionSystem.MISSION_TYPES.HABIT:
          embed.addFields({
            name: 'Progress',
            value: `${progressData.completed_habits}/${progressData.target_habits} habits`,
            inline: false
          });
          break;
        
        case MissionSystem.MISSION_TYPES.GARDEN:
          embed.addFields({
            name: 'Progress',
            value: `${progressData.current_points}/${progressData.target_points} garden points`,
            inline: false
          });
          break;
        
        case MissionSystem.MISSION_TYPES.BOSS:
          embed.addFields({
            name: 'Progress',
            value: `${progressData.current_damage}/${progressData.target_damage} damage`,
            inline: false
          });
          break;
        
        case MissionSystem.MISSION_TYPES.COLLECTION:
          const typesProgress = `${progressData.collected_types.length}/${progressData.target_types.length} types`;
          const speciesProgress = progressData.target_species.length > 0 
            ? `, ${progressData.collected_species.length}/${progressData.target_species.length} species` 
            : '';
          
          embed.addFields({
            name: 'Progress',
            value: typesProgress + speciesProgress,
            inline: false
          });
          break;
      }
      
      // Create abandon button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`mission_abandon_${trainerId}`)
            .setLabel('Abandon Mission')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }
    
    // Create embed for available missions
    const embed = new EmbedBuilder()
      .setTitle(`Available Missions for ${trainer.name}`)
      .setColor('#3498db');
    
    if (result.availableMissions.length === 0) {
      embed.setDescription('No missions available. Check back later!');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    embed.setDescription('Select a mission to start:');
    
    // Group missions by difficulty
    const missionsByDifficulty = {};
    
    for (const mission of result.availableMissions) {
      if (!missionsByDifficulty[mission.difficulty]) {
        missionsByDifficulty[mission.difficulty] = [];
      }
      
      missionsByDifficulty[mission.difficulty].push(mission);
    }
    
    // Add fields for each difficulty
    for (const difficulty in missionsByDifficulty) {
      const missions = missionsByDifficulty[difficulty];
      
      let fieldValue = '';
      for (const mission of missions) {
        fieldValue += `**${mission.name}** (ID: ${mission.id}) - ${mission.type}\n`;
        fieldValue += `${mission.description}\n\n`;
      }
      
      embed.addFields({
        name: `${difficulty.toUpperCase()} Missions`,
        value: fieldValue,
        inline: false
      });
    }
    
    // Create mission select menu
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`mission_select_${trainerId}`)
          .setPlaceholder('Select a mission')
          .addOptions(
            result.availableMissions.map(mission => 
              new StringSelectMenuOptionBuilder()
                .setLabel(`${mission.name} (${mission.difficulty})`)
                .setDescription(`${mission.type} mission`)
                .setValue(mission.id.toString())
            )
          )
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle mission start
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMissionStart(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    const missionId = interaction.options.getString('mission_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Start mission
    const result = await MissionSystem.startMission(trainerId, missionId);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Create embed
    const mission = result.activeMission.mission;
    const progressData = result.activeMission.progress_data;
    
    const embed = new EmbedBuilder()
      .setTitle(`Mission Started: ${mission.name}`)
      .setDescription(mission.description)
      .setColor(this._getDifficultyColor(mission.difficulty))
      .addFields(
        { name: 'Type', value: mission.type, inline: true },
        { name: 'Difficulty', value: mission.difficulty, inline: true }
      );
    
    // Add objective field based on mission type
    switch (mission.type) {
      case MissionSystem.MISSION_TYPES.WRITING:
        embed.addFields({
          name: 'Objective',
          value: `Write ${progressData.target_words} words`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.ART:
        embed.addFields({
          name: 'Objective',
          value: `Submit ${progressData.target_submissions} art pieces`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.TASK:
        embed.addFields({
          name: 'Objective',
          value: `Complete ${progressData.target_tasks} tasks`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.HABIT:
        embed.addFields({
          name: 'Objective',
          value: `Complete ${progressData.target_habits} habits`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.GARDEN:
        embed.addFields({
          name: 'Objective',
          value: `Earn ${progressData.target_points} garden points`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.BOSS:
        embed.addFields({
          name: 'Objective',
          value: `Deal ${progressData.target_damage} damage to bosses`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.COLLECTION:
        let objective = `Collect monsters with the following types: ${progressData.target_types.join(', ')}`;
        
        if (progressData.target_species.length > 0) {
          objective += `\nCollect monsters with the following species: ${progressData.target_species.join(', ')}`;
        }
        
        embed.addFields({
          name: 'Objective',
          value: objective,
          inline: false
        });
        break;
    }
    
    // Create status button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`mission_status_${trainerId}`)
          .setLabel('Check Mission Status')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle mission status
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMissionStatus(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Get active mission
    const activeMission = await MissionSystem.getActiveMission(trainerId);
    
    if (!activeMission) {
      return await interaction.editReply({ 
        content: `${trainer.name} doesn't have an active mission. Use /mission list to start one!` 
      });
    }
    
    // Create embed
    const mission = activeMission.mission;
    const progressData = activeMission.progress_data;
    
    const embed = new EmbedBuilder()
      .setTitle(`${trainer.name}'s Mission: ${mission.name}`)
      .setDescription(mission.description)
      .setColor(this._getDifficultyColor(mission.difficulty))
      .addFields(
        { name: 'Type', value: mission.type, inline: true },
        { name: 'Difficulty', value: mission.difficulty, inline: true }
      );
    
    // Add progress field based on mission type
    switch (mission.type) {
      case MissionSystem.MISSION_TYPES.WRITING:
        const wordProgress = (progressData.current_words / progressData.target_words) * 100;
        
        embed.addFields({
          name: 'Progress',
          value: `${progressData.current_words}/${progressData.target_words} words (${Math.round(wordProgress)}%)`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.ART:
        const artProgress = (progressData.current_submissions / progressData.target_submissions) * 100;
        
        embed.addFields({
          name: 'Progress',
          value: `${progressData.current_submissions}/${progressData.target_submissions} submissions (${Math.round(artProgress)}%)`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.TASK:
        const taskProgress = (progressData.completed_tasks / progressData.target_tasks) * 100;
        
        embed.addFields({
          name: 'Progress',
          value: `${progressData.completed_tasks}/${progressData.target_tasks} tasks (${Math.round(taskProgress)}%)`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.HABIT:
        const habitProgress = (progressData.completed_habits / progressData.target_habits) * 100;
        
        embed.addFields({
          name: 'Progress',
          value: `${progressData.completed_habits}/${progressData.target_habits} habits (${Math.round(habitProgress)}%)`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.GARDEN:
        const gardenProgress = (progressData.current_points / progressData.target_points) * 100;
        
        embed.addFields({
          name: 'Progress',
          value: `${progressData.current_points}/${progressData.target_points} garden points (${Math.round(gardenProgress)}%)`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.BOSS:
        const bossProgress = (progressData.current_damage / progressData.target_damage) * 100;
        
        embed.addFields({
          name: 'Progress',
          value: `${progressData.current_damage}/${progressData.target_damage} damage (${Math.round(bossProgress)}%)`,
          inline: false
        });
        break;
      
      case MissionSystem.MISSION_TYPES.COLLECTION:
        const typeProgress = (progressData.collected_types.length / progressData.target_types.length) * 100;
        
        let progressText = `Types: ${progressData.collected_types.length}/${progressData.target_types.length} (${Math.round(typeProgress)}%)`;
        
        if (progressData.target_species.length > 0) {
          const speciesProgress = (progressData.collected_species.length / progressData.target_species.length) * 100;
          progressText += `\nSpecies: ${progressData.collected_species.length}/${progressData.target_species.length} (${Math.round(speciesProgress)}%)`;
        }
        
        embed.addFields({
          name: 'Progress',
          value: progressText,
          inline: false
        });
        break;
    }
    
    // Add started at field
    const startedAt = new Date(activeMission.started_at);
    embed.addFields({
      name: 'Started',
      value: `<t:${Math.floor(startedAt.getTime() / 1000)}:R>`,
      inline: true
    });
    
    // Create abandon button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`mission_abandon_${trainerId}`)
          .setLabel('Abandon Mission')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle mission abandon
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMissionAbandon(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Abandon mission
    const result = await MissionSystem.abandonMission(trainerId);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('Mission Abandoned')
      .setDescription(`${trainer.name} abandoned their mission.`)
      .setColor('#e74c3c')
      .addFields({
        name: 'New Mission',
        value: 'Use /mission list to start a new mission!',
        inline: false
      });
    
    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Handle mission history
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMissionHistory(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    const limit = interaction.options.getInteger('limit') || 10;
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Get mission history
    const result = await MissionSystem.getMissionHistory(trainerId, limit);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${trainer.name}'s Mission History`)
      .setColor('#3498db');
    
    if (result.history.length === 0) {
      embed.setDescription('No completed missions found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    // Add fields for each completed mission
    for (const mission of result.history) {
      const completedAt = new Date(mission.completed_at);
      
      embed.addFields({
        name: `${mission.mission_name} (${mission.mission_difficulty})`,
        value: `Type: ${mission.mission_type}\nCompleted: <t:${Math.floor(completedAt.getTime() / 1000)}:R>`,
        inline: false
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Get default requirements for a mission type and difficulty
   * @param {string} type - Mission type
   * @param {string} difficulty - Mission difficulty
   * @returns {Object} - Default requirements
   * @private
   */
  static _getDefaultRequirements(type, difficulty) {
    // Difficulty multipliers
    const difficultyMultipliers = {
      easy: 0.5,
      normal: 1,
      hard: 2,
      epic: 3
    };
    
    const multiplier = difficultyMultipliers[difficulty] || 1;
    
    // Default requirements by type
    switch (type) {
      case MissionSystem.MISSION_TYPES.WRITING:
        return {
          word_count: Math.round(1000 * multiplier)
        };
      
      case MissionSystem.MISSION_TYPES.ART:
        return {
          submission_count: Math.max(1, Math.round(3 * multiplier))
        };
      
      case MissionSystem.MISSION_TYPES.TASK:
        return {
          task_count: Math.max(1, Math.round(5 * multiplier))
        };
      
      case MissionSystem.MISSION_TYPES.HABIT:
        return {
          habit_count: Math.max(1, Math.round(7 * multiplier))
        };
      
      case MissionSystem.MISSION_TYPES.GARDEN:
        return {
          garden_points: Math.round(10 * multiplier)
        };
      
      case MissionSystem.MISSION_TYPES.BOSS:
        return {
          damage: Math.round(100 * multiplier)
        };
      
      case MissionSystem.MISSION_TYPES.COLLECTION:
        // Number of types to collect based on difficulty
        const typeCount = Math.max(1, Math.round(3 * multiplier));
        
        // All possible types
        const allTypes = [
          'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting',
          'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
          'Dragon', 'Dark', 'Steel', 'Fairy'
        ];
        
        // Randomly select types
        const selectedTypes = [];
        for (let i = 0; i < typeCount; i++) {
          const randomIndex = Math.floor(Math.random() * allTypes.length);
          selectedTypes.push(allTypes[randomIndex]);
          allTypes.splice(randomIndex, 1);
        }
        
        return {
          types: selectedTypes,
          species: []
        };
      
      default:
        return {};
    }
  }

  /**
   * Get default rewards for a mission difficulty
   * @param {string} difficulty - Mission difficulty
   * @returns {Array} - Default rewards
   * @private
   */
  static _getDefaultRewards(difficulty) {
    // Base rewards by difficulty
    const baseRewards = {
      easy: {
        coins: 100,
        levels: 1,
        items: 1
      },
      normal: {
        coins: 250,
        levels: 2,
        items: 1
      },
      hard: {
        coins: 500,
        levels: 5,
        items: 2
      },
      epic: {
        coins: 1000,
        levels: 10,
        items: 3
      }
    };
    
    const rewards = baseRewards[difficulty] || baseRewards.normal;
    
    // Create reward array
    const rewardArray = [
      {
        id: `mission_coin_${Date.now()}`,
        type: 'coin',
        reward_type: 'coin',
        rarity: difficulty,
        reward_data: {
          amount: rewards.coins,
          title: 'Mission Completion Coins'
        }
      },
      {
        id: `mission_level_${Date.now()}`,
        type: 'level',
        reward_type: 'level',
        rarity: difficulty,
        reward_data: {
          amount: rewards.levels,
          title: 'Mission Completion Levels'
        }
      }
    ];
    
    // Add item rewards for harder difficulties
    if (difficulty === 'hard' || difficulty === 'epic') {
      rewardArray.push({
        id: `mission_monster_${Date.now()}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: difficulty,
        reward_data: {
          species: ['Pokemon', 'Digimon'],
          minLevel: difficulty === 'epic' ? 10 : 5,
          maxLevel: difficulty === 'epic' ? 20 : 15
        }
      });
    }
    
    return rewardArray;
  }

  /**
   * Get color for mission difficulty
   * @param {string} difficulty - Mission difficulty
   * @returns {string} - Color hex code
   * @private
   */
  static _getDifficultyColor(difficulty) {
    const colors = {
      easy: '#2ecc71',    // Green
      normal: '#3498db',  // Blue
      hard: '#e67e22',    // Orange
      epic: '#9b59b6'     // Purple
    };
    
    return colors[difficulty] || '#3498db';
  }
}

module.exports = MissionCommandHandler;
