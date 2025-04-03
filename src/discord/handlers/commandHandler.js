const EmbedBuilder = require('../utils/embedBuilder');
const { EmbedBuilder: DiscordEmbedBuilder } = require('discord.js');
const DiscordBotService = require('../services/DiscordBotService');
const SubmissionService = require('../services/SubmissionService');
const ScheduleService = require('../services/ScheduleService');
const MonsterCommandHandler = require('./monsterCommandHandler');
const LocationCommandHandler = require('./locationCommandHandler');
const BossCommandHandler = require('./bossCommandHandler');
const MissionCommandHandler = require('./missionCommandHandler');
const EvolutionCommandHandler = require('./evolutionCommandHandler');
const MarketCommandHandler = require('./marketCommandHandler');

/**
 * Handler for commands (both slash commands and standard message commands)
 */
class CommandHandler {
  /**
   * Handle slash command interactions
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleCommandInteraction(interaction) {
    // Defer the reply to prevent timeout
    await interaction.deferReply();
    try {
      // Get the command name
      const commandName = interaction.commandName;

      // Handle different commands
      switch (commandName) {
        case 'menu':
          await this._handleMenuCommand(interaction);
          break;
        case 'town':
          await this._handleTownCommand(interaction);
          break;
        case 'market':
          await this._handleMarketCommand(interaction);
          break;
        case 'submission':
          await this._handleSubmissionCommand(interaction);
          break;
        case 'schedule':
          await this._handleScheduleCommand(interaction);
          break;
        case 'add-task':
          await this._handleAddTaskCommand(interaction);
          break;
        case 'add-habit':
          await this._handleAddHabitCommand(interaction);
          break;
        case 'create-schedule':
          await this._handleCreateScheduleCommand(interaction);
          break;
        case 'edit-task':
          await this._handleEditTaskCommand(interaction);
          break;
        case 'monster':
          await this._handleMonsterCommand(interaction);
          break;
        case 'roll-monster':
          await MonsterCommandHandler.handleRollMonsterCommand(interaction);
          break;
        case 'garden':
          await LocationCommandHandler.handleGardenCommand(interaction);
          break;
        case 'farm':
          await LocationCommandHandler.handleFarmCommand(interaction);
          break;
        case 'pirates':
          await LocationCommandHandler.handlePiratesCommand(interaction);
          break;
        case 'game-corner':
          await LocationCommandHandler.handleGameCornerCommand(interaction);
          break;
        case 'boss':
          await BossCommandHandler.handleBossCommand(interaction);
          break;
        case 'create-boss':
          await BossCommandHandler.handleCreateBossCommand(interaction);
          break;
        case 'mission':
          await MissionCommandHandler.handleMissionCommand(interaction);
          break;
        case 'create-mission':
          await MissionCommandHandler.handleCreateMissionCommand(interaction);
          break;
        case 'evolve':
          await EvolutionCommandHandler.handleEvolveCommand(interaction);
          break;
        case 'fuse':
          await EvolutionCommandHandler.handleFuseCommand(interaction);
          break;
        case 'shop':
          await MarketCommandHandler.handleMarketCommand(interaction);
          break;
        case 'market':
          // Handle the old market command from slashCommands.js
          await interaction.editReply({ content: 'Please use the /shop command instead.' });
          break;
        case 'restock-shops':
          await MarketCommandHandler.handleRestockShopsCommand(interaction);
          break;
        case 'edit-habit':
          await this._handleEditHabitCommand(interaction);
          break;
        case 'submit-art':
          await this._handleSubmitArtCommand(interaction);
          break;
        case 'submit-writing':
          await this._handleSubmitWritingCommand(interaction);
          break;
        case 'submit-prompt':
          await this._handleSubmitPromptCommand(interaction);
          break;
        case 'submit-reference':
          await this._handleSubmitReferenceCommand(interaction);
          break;
        case 'link-account':
          await this._handleLinkAccountCommand(interaction);
          break;
        default:
          await interaction.editReply({
            content: 'Unknown command.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('Error handling command interaction:', error);

      // Reply with error message if interaction hasn't been replied to yet
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while processing this command. Please try again later.',
          ephemeral: true
        });
      }
    }
  }

  /**
   * Handle menu command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMenuCommand(interaction) {
    const { embed, components } = EmbedBuilder.createMainMenu();

    await interaction.editReply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle town command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleTownCommand(interaction) {
    const { embed, components } = EmbedBuilder.createTownMenu();

    await interaction.editReply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle market command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMarketCommand(interaction) {
    const { embed, components } = EmbedBuilder.createMarketMenu();

    await interaction.editReply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle submission command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleSubmissionCommand(interaction) {
    const { embed, components } = EmbedBuilder.createSubmissionMenu();

    await interaction.editReply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle schedule command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleScheduleCommand(interaction) {
    const { embed, components } = EmbedBuilder.createScheduleMenu();

    await interaction.editReply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle standard message commands
   * @param {Message} message - Discord message
   * @param {string} commandName - Command name
   * @param {Array<string>} args - Command arguments
   */
  static async handleStandardCommand(message, commandName, args) {
    try {
      // Handle different commands
      switch (commandName) {
        case 'menu':
          await this._handleStandardMenuCommand(message);
          break;
        case 'town':
          await this._handleStandardTownCommand(message);
          break;
        case 'market':
          await this._handleStandardMarketCommand(message);
          break;
        case 'submission':
          await this._handleStandardSubmissionCommand(message);
          break;
        case 'schedule':
          await this._handleStandardScheduleCommand(message);
          break;
        default:
          await message.reply('Unknown command.');
      }
    } catch (error) {
      console.error('Error handling standard command:', error);
      await message.reply('An error occurred while processing this command. Please try again later.');
    }
  }

  /**
   * Handle standard menu command
   * @param {Message} message - Discord message
   * @private
   */
  static async _handleStandardMenuCommand(message) {
    const { embed, components } = EmbedBuilder.createMainMenu();

    await message.reply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle standard town command
   * @param {Message} message - Discord message
   * @private
   */
  static async _handleStandardTownCommand(message) {
    const { embed, components } = EmbedBuilder.createTownMenu();

    await message.reply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle standard market command
   * @param {Message} message - Discord message
   * @private
   */
  static async _handleStandardMarketCommand(message) {
    const { embed, components } = EmbedBuilder.createMarketMenu();

    await message.reply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle standard submission command
   * @param {Message} message - Discord message
   * @private
   */
  static async _handleStandardSubmissionCommand(message) {
    const { embed, components } = EmbedBuilder.createSubmissionMenu();

    await message.reply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle standard schedule command
   * @param {Message} message - Discord message
   * @private
   */
  static async _handleStandardScheduleCommand(message) {
    const { embed, components } = EmbedBuilder.createScheduleMenu();

    await message.reply({
      embeds: [embed],
      components: components
    });
  }

  /**
   * Handle add-task command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleAddTaskCommand(interaction) {
    try {
      // Get command options
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description') || '';
      const dueDateStr = interaction.options.getString('due_date');
      const priority = interaction.options.getString('priority') || 'medium';

      // Parse due date if provided
      let dueDate = null;
      if (dueDateStr) {
        dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
          throw new Error('Invalid due date format. Please use YYYY-MM-DD.');
        }
      }

      // Add task
      const result = await ScheduleService.addTask({
        title,
        description,
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority,
        discordId: interaction.user.id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Task Added')
        .setDescription(`Task "${title}" has been added successfully.`)
        .setColor('#9b59b6')
        .addFields(
          { name: 'Title', value: title },
          { name: 'Description', value: description || 'No description' },
          { name: 'Due Date', value: dueDate ? dueDate.toLocaleDateString() : 'No due date' },
          { name: 'Priority', value: priority.charAt(0).toUpperCase() + priority.slice(1) }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling add-task command:', error);
      await interaction.editReply({
        content: `Error adding task: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle add-habit command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleAddHabitCommand(interaction) {
    try {
      // Get command options
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description') || '';
      const frequency = interaction.options.getString('frequency');

      // Add habit
      const result = await ScheduleService.addHabit({
        name,
        description,
        frequency,
        discordId: interaction.user.id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Habit Added')
        .setDescription(`Habit "${name}" has been added successfully.`)
        .setColor('#9b59b6')
        .addFields(
          { name: 'Name', value: name },
          { name: 'Description', value: description || 'No description' },
          { name: 'Frequency', value: frequency.charAt(0).toUpperCase() + frequency.slice(1) }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling add-habit command:', error);
      await interaction.editReply({
        content: `Error adding habit: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle create-schedule command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleCreateScheduleCommand(interaction) {
    try {
      // Get command options
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description') || '';

      // Create schedule
      const result = await ScheduleService.createSchedule({
        name,
        description,
        discordId: interaction.user.id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Schedule Created')
        .setDescription(`Schedule "${name}" has been created successfully.`)
        .setColor('#9b59b6')
        .addFields(
          { name: 'Name', value: name },
          { name: 'Description', value: description || 'No description' }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling create-schedule command:', error);
      await interaction.editReply({
        content: `Error creating schedule: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle edit-task command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleEditTaskCommand(interaction) {
    // This is a placeholder for now
    await interaction.editReply({
      content: 'The edit-task command is not yet implemented.',
      ephemeral: true
    });
  }

  /**
   * Handle edit-habit command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleEditHabitCommand(interaction) {
    // This is a placeholder for now
    await interaction.editReply({
      content: 'The edit-habit command is not yet implemented.',
      ephemeral: true
    });
  }

  /**
   * Handle submit-art command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleSubmitArtCommand(interaction) {
    try {
      // Get command options
      const url = interaction.options.getString('url');
      const type = interaction.options.getString('type');
      const trainerId = interaction.options.getString('trainer_id');

      // Submit art
      const result = await SubmissionService.processArtSubmission({
        type,
        url,
        trainerId,
        discordId: interaction.user.id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Art Submission Processed')
        .setDescription('Your art submission has been processed successfully.')
        .setColor('#e74c3c')
        .addFields(
          { name: 'Type', value: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
          { name: 'URL', value: url },
          { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling submit-art command:', error);
      await interaction.editReply({
        content: `Error processing art submission: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle submit-writing command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleSubmitWritingCommand(interaction) {
    try {
      // Get command options
      const url = interaction.options.getString('url');
      const wordCount = interaction.options.getInteger('word_count');
      const trainerId = interaction.options.getString('trainer_id');

      // Submit writing
      const result = await SubmissionService.processWritingSubmission({
        wordCount,
        url,
        trainerId,
        discordId: interaction.user.id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Writing Submission Processed')
        .setDescription('Your writing submission has been processed successfully.')
        .setColor('#e74c3c')
        .addFields(
          { name: 'Word Count', value: wordCount.toString() },
          { name: 'URL', value: url },
          { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling submit-writing command:', error);
      await interaction.editReply({
        content: `Error processing writing submission: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle submit-prompt command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleSubmitPromptCommand(interaction) {
    try {
      // Get command options
      const prompt = interaction.options.getString('prompt');
      const category = interaction.options.getString('category');

      // Submit prompt
      const result = await SubmissionService.processPromptSubmission({
        prompt,
        category,
        discordId: interaction.user.id
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Prompt Submission Processed')
        .setDescription('Your prompt submission has been processed successfully.')
        .setColor('#e74c3c')
        .addFields(
          { name: 'Prompt', value: prompt },
          { name: 'Category', value: category.charAt(0).toUpperCase() + category.slice(1) }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling submit-prompt command:', error);
      await interaction.editReply({
        content: `Error processing prompt submission: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle submit-reference command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleSubmitReferenceCommand(interaction) {
    try {
      // Get command options
      const url = interaction.options.getString('url');
      const type = interaction.options.getString('type');
      const id = interaction.options.getString('id');

      // Prepare submission data
      const submissionData = {
        url,
        discordId: interaction.user.id
      };

      // Set trainer or monster ID based on type
      if (type === 'trainer') {
        submissionData.trainerId = id;
      } else {
        submissionData.monsterId = id;
      }

      // Submit reference
      const result = await SubmissionService.processReferenceSubmission(submissionData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Reference Submission Processed')
        .setDescription('Your reference submission has been processed successfully.')
        .setColor('#e74c3c')
        .addFields(
          { name: 'Type', value: type.charAt(0).toUpperCase() + type.slice(1) },
          { name: 'URL', value: url },
          { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` }
        )
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling submit-reference command:', error);
      await interaction.editReply({
        content: `Error processing reference submission: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle link-account command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleLinkAccountCommand(interaction) {
    try {
      // Get command options
      const username = interaction.options.getString('username');

      // Link account
      const user = await DiscordBotService.linkDiscordAccount(interaction.user.id, username);

      if (!user) {
        throw new Error(`User with username "${username}" not found.`);
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle('Account Linked')
        .setDescription(`Your Discord account has been linked to website account "${username}" successfully.`)
        .setColor('#3498db')
        .setTimestamp();

      // Send embed
      await interaction.editReply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      console.error('Error handling link-account command:', error);
      await interaction.editReply({
        content: `Error linking account: ${error.message}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle monster command
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleMonsterCommand(interaction) {
    try {
      // Get the subcommand
      const subcommand = interaction.options.getSubcommand();

      // Handle different subcommands
      switch (subcommand) {
        case 'view':
          await MonsterCommandHandler.handleViewCommand(interaction);
          break;
        case 'roll':
          await MonsterCommandHandler.handleRollCommand(interaction);
          break;
        case 'claim':
          await MonsterCommandHandler.handleClaimCommand(interaction);
          break;
        case 'level':
          await MonsterCommandHandler.handleLevelCommand(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown monster subcommand.' });
      }
    } catch (error) {
      console.error('Error handling monster command:', error);
      await interaction.editReply({
        content: `Error processing monster command: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

module.exports = CommandHandler;
