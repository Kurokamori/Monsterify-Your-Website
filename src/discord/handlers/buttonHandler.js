const EmbedBuilder = require('../utils/embedBuilder');
const { EmbedBuilder: DiscordEmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const DiscordBotService = require('../services/DiscordBotService');
const SubmissionService = require('../services/SubmissionService');
const ScheduleService = require('../services/ScheduleService');
const TrainerService = require('../../services/TrainerService');
const UserTrainerSelect = require('../components/UserTrainerSelect');
const TrainerMonsterSelect = require('../components/TrainerMonsterSelect');
const FormHandler = require('./formHandler');
const SubmissionFormHandler = require('./submissionFormHandler');
const SubmissionSelectHandler = require('./submissionSelectHandler');
const MonsterCommandHandler = require('./monsterCommandHandler');
const LocationCommandHandler = require('./locationCommandHandler');
const BossCommandHandler = require('./bossCommandHandler');
const MissionCommandHandler = require('./missionCommandHandler');
const MarketCommandHandler = require('./marketCommandHandler');
const Monster = require('../../models/Monster');
const Trainer = require('../../models/Trainer');
const LocationService = require('../../utils/LocationService');
const BossSystem = require('../../utils/BossSystem');
const MissionSystem = require('../../utils/MissionSystem');
const ShopSystem = require('../../models/ShopSystem');
const ShopConfig = require('../../models/shops/ShopConfig');
const ShopItemsManager = require('../../models/shops/ShopItemsManager');

/**
 * Handler for button interactions
 */
class ButtonHandler {
  /**
   * Handle button interactions
   * @param {ButtonInteraction} interaction - Discord button interaction
   */
  static async handleButtonInteraction(interaction) {
    try {
      // Get the button ID
      const buttonId = interaction.customId;

      // Handle form-related buttons without deferring
      if (buttonId === 'add_task') {
        const modal = FormHandler.createTaskForm(interaction.user.id);
        await interaction.showModal(modal);
        return;
      } else if (buttonId === 'add_habit') {
        const modal = FormHandler.createHabitForm(interaction.user.id);
        await interaction.showModal(modal);
        return;
      }

      // Handle submission form buttons without deferring
      if (buttonId.startsWith('art_submission_') ||
          buttonId.startsWith('writing_submission_') ||
          buttonId.startsWith('reference_submission_') ||
          buttonId.startsWith('prompt_submission_')) {
        // These are modal buttons, handle them without deferring
        switch (buttonId) {
          // Art submission type buttons
          case 'art_submission_manual':
            const manualArtModal = SubmissionFormHandler.createArtSubmissionForm(interaction.user.id, 'manual');
            await interaction.showModal(manualArtModal);
            return;
          case 'art_submission_external':
            const externalArtModal = SubmissionFormHandler.createArtSubmissionForm(interaction.user.id, 'external');
            await interaction.showModal(externalArtModal);
            return;
          case 'art_submission_simple':
            const simpleArtModal = SubmissionFormHandler.createArtSubmissionForm(interaction.user.id, 'simple');
            await interaction.showModal(simpleArtModal);
            return;

          // Writing submission type buttons
          case 'writing_submission_game':
            const gameWritingModal = SubmissionFormHandler.createWritingSubmissionForm(interaction.user.id, 'game');
            await interaction.showModal(gameWritingModal);
            return;
          case 'writing_submission_external':
            const externalWritingModal = SubmissionFormHandler.createWritingSubmissionForm(interaction.user.id, 'external');
            await interaction.showModal(externalWritingModal);
            return;

          // Reference submission type buttons
          case 'reference_submission_trainer':
            const trainerRefModal = SubmissionFormHandler.createReferenceSubmissionForm(interaction.user.id, 'trainer');
            await interaction.showModal(trainerRefModal);
            return;
          case 'reference_submission_monster':
            const monsterRefModal = SubmissionFormHandler.createReferenceSubmissionForm(interaction.user.id, 'monster');
            await interaction.showModal(monsterRefModal);
            return;

          // Prompt submission type buttons
          case 'prompt_submission_general':
            await this._handlePromptTypeSelection(interaction, 'general');
            return;
          case 'prompt_submission_progression':
            await this._handlePromptTypeSelection(interaction, 'progression');
            return;
          case 'prompt_submission_legendary':
            await this._handlePromptTypeSelection(interaction, 'legendary');
            return;
          case 'prompt_submission_monthly':
            await this._handlePromptTypeSelection(interaction, 'monthly');
            return;
          case 'prompt_submission_event':
            await this._handlePromptTypeSelection(interaction, 'event');
            return;
        }
      }

      // Defer the update to prevent timeout
      // Only defer if the interaction hasn't been replied to yet
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate().catch(() => {});
      }

      // Handle different button actions
      switch (buttonId) {
        // Main menu buttons
        case 'visit_town':
          await this._handleVisitTown(interaction);
          break;
        case 'visit_market':
          await this._handleVisitMarket(interaction);
          break;
        case 'process_submission':
          await this._handleProcessSubmission(interaction);
          break;
        case 'view_schedule':
        case 'view_schedule_today':
          await this._handleViewSchedule(interaction);
          break;

        // Schedule view buttons
        case 'view_schedule_week':
          await this._handleViewWeek(interaction);
          break;
        case 'view_schedule_tasks':
        case 'view_tasks':
          await this._handleViewTasks(interaction);
          break;
        // Submission menu buttons
        case 'art_submission':
          await this._handleArtSubmission(interaction);
          break;
        case 'writing_submission':
          await this._handleWritingSubmission(interaction);
          break;
        case 'reference_submission':
          await this._handleReferenceSubmission(interaction);
          break;
        case 'prompt_submission':
          await this._handlePromptSubmission(interaction);
          break;
        case 'back_to_submission':
          await this._handleProcessSubmission(interaction);
          break;

        // Monster-related buttons
        case buttonId.startsWith('claim_monster_') && buttonId:
          await this._handleClaimMonster(interaction, buttonId);
          break;
        case buttonId.startsWith('monster_list_next_') && buttonId:
          await this._handleMonsterListPagination(interaction, buttonId);
          break;
        case buttonId.startsWith('monster_list_prev_') && buttonId:
          await this._handleMonsterListPagination(interaction, buttonId);
          break;

        // Location-related buttons
        case buttonId.startsWith('garden_start_') && buttonId:
          await this._handleGardenStart(interaction, buttonId);
          break;
        case buttonId.startsWith('garden_complete_') && buttonId:
          await this._handleGardenComplete(interaction, buttonId);
          break;
        case buttonId.startsWith('garden_harvest_') && buttonId:
          await this._handleGardenHarvest(interaction, buttonId);
          break;
        case buttonId.startsWith('farm_start_') && buttonId:
          await this._handleFarmStart(interaction, buttonId);
          break;
        case buttonId.startsWith('farm_complete_') && buttonId:
          await this._handleFarmComplete(interaction, buttonId);
          break;
        case buttonId.startsWith('pirates_start_') && buttonId:
          await this._handlePiratesStart(interaction, buttonId);
          break;
        case buttonId.startsWith('pirates_complete_') && buttonId:
          await this._handlePiratesComplete(interaction, buttonId);
          break;
        case buttonId.startsWith('game_corner_start_') && buttonId:
          await this._handleGameCornerStart(interaction, buttonId);
          break;
        case buttonId.startsWith('game_corner_complete_') && buttonId:
          await this._handleGameCornerComplete(interaction, buttonId);
          break;

        // Boss-related buttons
        case buttonId.startsWith('boss_attack_') && buttonId:
          await this._handleBossAttack(interaction, buttonId);
          break;
        case buttonId.startsWith('boss_contribution_') && buttonId:
          await this._handleBossContribution(interaction, buttonId);
          break;
        case buttonId.startsWith('boss_leaderboard_') && buttonId:
          await this._handleBossLeaderboard(interaction, buttonId);
          break;
        case buttonId.startsWith('boss_claim_rewards_') && buttonId:
          await this._handleBossClaimRewards(interaction, buttonId);
          break;

        // Mission-related buttons
        case buttonId.startsWith('mission_select_') && buttonId:
          await this._handleMissionSelect(interaction, buttonId);
          break;
        case buttonId.startsWith('mission_start_') && buttonId:
          await this._handleMissionStart(interaction, buttonId);
          break;
        case buttonId.startsWith('mission_status_') && buttonId:
          await this._handleMissionStatus(interaction, buttonId);
          break;
        case buttonId.startsWith('mission_abandon_') && buttonId:
          await this._handleMissionAbandon(interaction, buttonId);
          break;

        // Market-related buttons
        case buttonId.startsWith('market_purchase_') && buttonId:
          await MarketCommandHandler.handlePurchaseButton(interaction, buttonId);
          break;
        case buttonId.startsWith('market_return_') && buttonId:
          await MarketCommandHandler.handleReturnButton(interaction, buttonId);
          break;

        // Submission gift and submit buttons
        case 'writing_gift':
          // Toggle gift status
          global.tempSubmissionData = global.tempSubmissionData || {};
          const writingData = global.tempSubmissionData[interaction.user.id];
          if (writingData) {
            writingData.isGift = !writingData.isGift;
            await interaction.update({
              content: `Gift status: ${writingData.isGift ? 'Enabled' : 'Disabled'}`
            });
          } else {
            await interaction.reply({
              content: 'Your submission data was not found. Please try again.',
              ephemeral: true
            });
          }
          break;

        case 'art_gift':
          // Toggle gift status
          global.tempSubmissionData = global.tempSubmissionData || {};
          const artData = global.tempSubmissionData[interaction.user.id];
          if (artData) {
            artData.isGift = !artData.isGift;
            await interaction.update({
              content: `Gift status: ${artData.isGift ? 'Enabled' : 'Disabled'}`
            });
          } else {
            await interaction.reply({
              content: 'Your submission data was not found. Please try again.',
              ephemeral: true
            });
          }
          break;

        case 'writing_submit':
        case 'art_submit':
        case 'reference_submit':
        case 'prompt_submit':
          // These buttons are handled by the select menu handler after trainer selection
          await interaction.deferUpdate();
          await interaction.followUp({
            content: 'Please select a trainer from the dropdown menu to complete your submission.',
            ephemeral: true
          });
          break;

        // Prompt pagination and confirmation buttons
        case 'prompt_prev':
        case 'prompt_next':
          await this._handlePromptPagination(interaction);
          break;

        case 'prompt_cancel':
          // Clean up temporary data
          const userId = interaction.customId.split('_').pop();
          if (global.tempSubmissionData && global.tempSubmissionData[userId]) {
            delete global.tempSubmissionData[userId];
          }

          await interaction.update({
            content: 'Prompt submission cancelled.',
            components: []
          });
          break;

        case 'view_schedule_habits':
        case 'view_habits':
          await this._handleViewHabits(interaction);
          break;

        // Task and habit action buttons
        case 'edit_tasks':
          await this._handleEditTasks(interaction);
          break;
        case 'edit_habits':
          await this._handleEditHabits(interaction);
          break;

        // Back buttons
        case 'back_to_main':
          await this._handleBackToMain(interaction);
          break;
        case 'back_to_town':
          await this._handleBackToTown(interaction);
          break;
        case 'back_to_market':
          await this._handleBackToMarket(interaction);
          break;
        case 'back_to_submission':
          await this._handleBackToSubmission(interaction);
          break;
        case 'back_to_schedule':
          await this._handleBackToSchedule(interaction);
          break;

        // Town Square buttons
        case 'town_center':
        case 'apothecary_visit':
        case 'bakery_visit':
        case 'witchs_hut_visit':
        case 'megamart_visit':
        case 'antique_visit':
        case 'game_corner_visit':
        case 'adoption_visit':
        case 'trade_visit':
        case 'garden_visit':
        case 'farm_visit':
        case 'nursery_visit':
        case 'pirates_dock_visit':
          await this._handleTownLocation(interaction, buttonId);
          break;

        // Market buttons
        case 'markets_square':
        case 'apothecary_shop':
        case 'bakery_shop':
        case 'witchs_hut_shop':
        case 'megamart_shop':
        case 'antique_shop':
        case 'nursery_shop':
        case 'pirates_dock_shop':
          await this._handleMarketLocation(interaction, buttonId);
          break;

        // Submission buttons
        case 'art_submission':
        case 'writing_submission':
        case 'prompt_submission':
        case 'reference_submission':
          await this._handleSubmissionType(interaction, buttonId);
          break;

        // Schedule buttons
        case 'add_task':
        case 'add_habit':
        case 'create_schedule':
        case 'edit_tasks':
        case 'view_tasks':
        case 'edit_habits':
        case 'view_habits':
          await this._handleScheduleAction(interaction, buttonId);
          break;

        default:
          await interaction.reply({
            content: 'This button is not yet implemented.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('Error handling button interaction:', error);

      // Reply with error message
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Visit Town button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleVisitTown(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createTownMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Visit Town button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Visit Market button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleVisitMarket(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createMarketMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Visit Market button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Process Submission button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleProcessSubmission(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createSubmissionMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Process Submission button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Art Submission button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleArtSubmission(interaction) {
    try {
      // Create art submission options menu
      const embed = new DiscordEmbedBuilder()
        .setTitle('Art Submission')
        .setDescription('Select the type of art submission you want to make:')
        .setColor('#f97316')
        .setFooter({ text: 'Monsterify Bot • Art Submission' })
        .setTimestamp();

      // Create buttons for different art submission types
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('art_submission_manual')
            .setLabel('Manual Level Entry')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('art_submission_external')
            .setLabel('External Artwork')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('art_submission_simple')
            .setLabel('Simple Art Calculator')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('back_to_submission')
            .setLabel('Back to Submissions')
            .setStyle(ButtonStyle.Danger)
        );

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: [row1, row2]
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: [row1, row2]
        });
      }
    } catch (error) {
      console.error('Error handling Art Submission button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Writing Submission button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleWritingSubmission(interaction) {
    try {
      // Create writing submission options menu
      const embed = new DiscordEmbedBuilder()
        .setTitle('Writing Submission')
        .setDescription('Select the type of writing submission you want to make:')
        .setColor('#f97316')
        .setFooter({ text: 'Monsterify Bot • Writing Submission' })
        .setTimestamp();

      // Create buttons for different writing submission types
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('writing_submission_game')
            .setLabel('Game Writing')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('writing_submission_external')
            .setLabel('External Writing')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('back_to_submission')
            .setLabel('Back to Submissions')
            .setStyle(ButtonStyle.Danger)
        );

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: [row]
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: [row]
        });
      }
    } catch (error) {
      console.error('Error handling Writing Submission button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Reference Submission button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleReferenceSubmission(interaction) {
    try {
      // Create reference submission options menu
      const embed = new DiscordEmbedBuilder()
        .setTitle('Reference Submission')
        .setDescription('Select the type of reference submission you want to make:')
        .setColor('#f97316')
        .setFooter({ text: 'Monsterify Bot • Reference Submission' })
        .setTimestamp();

      // Create buttons for different reference submission types
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('reference_submission_trainer')
            .setLabel('Trainer Main Reference')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('reference_submission_monster')
            .setLabel('Monster Main Reference')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('back_to_submission')
            .setLabel('Back to Submissions')
            .setStyle(ButtonStyle.Danger)
        );

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: [row]
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: [row]
        });
      }
    } catch (error) {
      console.error('Error handling Reference Submission button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Prompt Submission button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handlePromptSubmission(interaction) {
    try {
      // Create prompt submission options menu
      const embed = new DiscordEmbedBuilder()
        .setTitle('Prompt Submission')
        .setDescription('Select the type of prompt submission you want to make:')
        .setColor('#f97316')
        .setFooter({ text: 'Monsterify Bot • Prompt Submission' })
        .setTimestamp();

      // Create buttons for different prompt submission types
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prompt_submission_general')
            .setLabel('General Prompts')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('prompt_submission_progression')
            .setLabel('Trainer Progression')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('prompt_submission_monthly')
            .setLabel('Monthly Prompts')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prompt_submission_legendary')
            .setLabel('Legendary Prompts')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('prompt_submission_event')
            .setLabel('Event Prompts')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('back_to_submission')
            .setLabel('Back to Submissions')
            .setStyle(ButtonStyle.Danger)
        );

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: [row1, row2]
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: [row1, row2]
        });
      }
    } catch (error) {
      console.error('Error handling Prompt Submission button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle View Schedule button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleViewSchedule(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createScheduleMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling View Schedule button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Back to Main Menu button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleBackToMain(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createMainMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Back to Main button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Back to Town button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleBackToTown(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createTownMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Back to Town button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Back to Market button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleBackToMarket(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createMarketMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Back to Market button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Back to Submission button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleBackToSubmission(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createSubmissionMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Back to Submission button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Back to Schedule button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleBackToSchedule(interaction) {
    try {
      const { embed, components } = EmbedBuilder.createScheduleMenu();

      // Check if the interaction can be updated
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [embed],
          components: components
        });
      } else {
        await interaction.update({
          embeds: [embed],
          components: components
        });
      }
    } catch (error) {
      console.error('Error handling Back to Schedule button:', error);
      try {
        await interaction.followUp({
          content: 'An error occurred while processing this button. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Town location buttons
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} buttonId - Button ID
   * @private
   */
  static async _handleTownLocation(interaction, buttonId) {
    try {
      // Get location information
      const locationInfo = await DiscordBotService.getTownLocationInfo(buttonId);

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle(locationInfo.name)
        .setDescription(locationInfo.description)
        .setImage(locationInfo.imageUrl)
        .setColor('#3498db')
        .setTimestamp();

      // Create action row with back button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('back_to_town')
            .setLabel('Back to Town Square')
            .setStyle(ButtonStyle.Secondary)
        );

      // Send embed with button
      await interaction.followUp({
        embeds: [embed],
        components: [row],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling town location:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading ${buttonId.replace('_visit', '').replace('_', ' ')}. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Market location buttons
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} buttonId - Button ID
   * @private
   */
  static async _handleMarketLocation(interaction, buttonId) {
    try {
      // Extract shop ID from button ID
      const shopId = buttonId.replace('_shop', '');
      console.log(`Handling market location for shop: ${shopId}`);

      // Get shop configuration
      const shopConfig = await ShopConfig.getById(shopId);
      console.log(`Shop config:`, shopConfig);

      if (!shopConfig) {
        return await interaction.reply({
          content: `Shop ${shopId} not found. Please try again later.`,
          ephemeral: true
        });
      }

      // Get shop items
      const shopItems = await ShopItemsManager.getShopItems(shopId);
      console.log(`Found ${shopItems ? shopItems.length : 0} items for shop ${shopId}`);

      // Create location info from shop config
      const locationInfo = {
        name: shopConfig.name,
        description: shopConfig.description || `Shop for various items and goods!`,
        imageUrl: shopConfig.image_url || 'https://i.imgur.com/DP1nFn2.png'
      };

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle(locationInfo.name)
        .setDescription(locationInfo.description)
        .setImage(locationInfo.imageUrl)
        .setColor('#2ecc71')
        .setTimestamp();

      // Add shop items to embed if available
      if (shopItems.length > 0) {
        // Group items by category
        const itemsByCategory = {};
        shopItems.forEach(item => {
          if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
          }
          itemsByCategory[item.category].push(item);
        });

        // Add fields for each category
        Object.keys(itemsByCategory).forEach(category => {
          const items = itemsByCategory[category];
          const itemList = items.map(item => `${item.name} - ${item.price} coins`).join('\n');
          embed.addFields({ name: category, value: itemList });
        });
      } else {
        embed.addFields({ name: 'Items', value: 'No items available at this time.' });
      }

      // Get user's trainers
      const discordId = interaction.user.id;
      const trainers = await Trainer.getByDiscordId(discordId);

      if (!trainers || trainers.length === 0) {
        // Create action row with back button only if no trainers
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('back_to_market')
              .setLabel('Back to Market')
              .setStyle(ButtonStyle.Secondary)
          );

        // Send embed with button
        await interaction.followUp({
          embeds: [embed],
          components: [row],
          content: 'You don\'t have any trainers. Please create a trainer first!',
          ephemeral: true
        });
        return;
      }

      // Create trainer selection dropdown
      const trainerRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`market_trainer_select_${shopId}`)
            .setPlaceholder('Select a trainer')
            .addOptions(
              trainers.map(trainer =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(`${trainer.name} (${trainer.coins} coins)`)
                  .setDescription(`Level ${trainer.level}`)
                  .setValue(trainer.id.toString())
              )
            )
        );

      // Create item selection dropdown (initially disabled)
      const itemRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`market_item_select_${shopId}`)
            .setPlaceholder('Select an item to purchase')
            .setDisabled(true)
            .addOptions(
              shopItems.map(item => {
                const emoji = this._getItemEmoji(item.item_type || item.category);
                return new StringSelectMenuOptionBuilder()
                  .setLabel(`${item.item_name || item.name} (${item.price} coins)`)
                  .setDescription(item.item_description || item.description || 'No description available')
                  .setValue((item.id || item.item_id).toString())
                  .setEmoji(emoji);
              })
            )
        );

      // Create back button
      const backRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('back_to_market')
            .setLabel('Back to Market')
            .setStyle(ButtonStyle.Secondary)
        );

      // Send embed with dropdowns and button
      await interaction.followUp({
        embeds: [embed],
        components: [trainerRow, itemRow, backRow],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling market location:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading ${buttonId.replace('_shop', '').replace('_', ' ')}. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Get emoji for item category
   * @param {string} category - Item category
   * @returns {string} - Emoji
   * @private
   */
  static _getItemEmoji(category) {
    if (!category) return '🎁';

    const categoryEmojis = {
      'BERRIES': '🍓',
      'PASTRIES': '🍰',
      'ITEMS': '🧪',
      'EVOLUTION': '✨',
      'ANTIQUE': '🏺',
      'BALLS': '⚾',
      'HELD_ITEMS': '🧤'
    };

    return categoryEmojis[category.toUpperCase()] || '🎁';
  }

  /**
   * Handle Submission type buttons
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} buttonId - Button ID
   * @private
   */
  static async _handleSubmissionType(interaction, buttonId) {
    try {
      // Get submission type
      const submissionType = buttonId.replace('_submission', '');

      // Get submission information
      const submissionInfo = await DiscordBotService.getSubmissionInfo(submissionType);

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle(submissionInfo.name)
        .setDescription(submissionInfo.description)
        .setImage(submissionInfo.imageUrl)
        .setColor('#e74c3c')
        .setTimestamp();

      // Add fields if available
      if (submissionInfo.fields && submissionInfo.fields.length > 0) {
        submissionInfo.fields.forEach(field => {
          embed.addFields({ name: field.name, value: field.value });
        });
      }

      // Create action row with back button and submit button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('back_to_submission')
            .setLabel('Back to Submissions')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`submit_${submissionType}`)
            .setLabel(`Submit ${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)}`)
            .setStyle(ButtonStyle.Success)
        );

      // Send embed with buttons
      await interaction.followUp({
        embeds: [embed],
        components: [row],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling submission type:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading ${buttonId.replace('_submission', '').replace('_', ' ')} submission. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Schedule action buttons
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} buttonId - Button ID
   * @private
   */
  static async _handleScheduleAction(interaction, buttonId) {
    try {
      // Get schedule action
      const scheduleAction = buttonId;

      // Get schedule information
      const scheduleInfo = await DiscordBotService.getScheduleInfo(scheduleAction);

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle(scheduleInfo.name)
        .setDescription(scheduleInfo.description)
        .setImage(scheduleInfo.imageUrl)
        .setColor('#9b59b6')
        .setTimestamp();

      // Handle different schedule actions
      switch (scheduleAction) {
        case 'view_schedule':
          await this._handleViewSchedule(interaction, embed);
          break;
        case 'add_task':
          await this._handleAddTask(interaction, embed);
          break;
        case 'add_habit':
          await this._handleAddHabit(interaction, embed);
          break;
        case 'create_schedule':
          await this._handleCreateSchedule(interaction, embed);
          break;
        case 'edit_tasks':
          await this._handleEditTasks(interaction, embed);
          break;
        case 'view_tasks':
          await this._handleViewTasks(interaction, embed);
          break;
        case 'edit_habits':
          await this._handleEditHabits(interaction, embed);
          break;
        case 'view_habits':
          await this._handleViewHabits(interaction, embed);
          break;
        default:
          // Create action row with back button
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('back_to_schedule')
                .setLabel('Back to Schedule')
                .setStyle(ButtonStyle.Secondary)
            );

          // Send embed with button
          await interaction.followUp({
            embeds: [embed],
            components: [row],
            ephemeral: false
          });
      }
    } catch (error) {
      console.error('Error handling schedule action:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading ${buttonId.replace('_', ' ')}. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle View Schedule action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleViewSchedule(interaction, embed) {
    try {
      // Get user's schedule
      const scheduleData = await ScheduleService.getUserSchedule(interaction.user.id);

      if (!scheduleData.success) {
        throw new Error(scheduleData.error);
      }

      // If no trainers, prompt to create one
      if (!scheduleData.trainers || scheduleData.trainers.length === 0) {
        const noTrainerEmbed = new DiscordEmbedBuilder()
          .setTitle('No Trainers Found')
          .setDescription('You need to create a trainer profile first before you can use the schedule features.')
          .setColor('#9b59b6')
          .setTimestamp();

        await interaction.followUp({
          embeds: [noTrainerEmbed],
          ephemeral: true
        });
        return;
      }

      // Use the first trainer for now (we can add trainer selection later)
      const trainer = scheduleData.trainers[0];

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter tasks for today
      const todaysTasks = scheduleData.tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate >= today && taskDate < tomorrow;
      });

      // Create the today's schedule embed
      const scheduleEmbed = new DiscordEmbedBuilder()
        .setTitle(`${trainer.name}'s Schedule for Today`)
        .setDescription(`Here's your schedule for ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
        .setColor('#9b59b6')
        .setTimestamp();

      // Add today's tasks
      if (todaysTasks.length > 0) {
        const tasksField = todaysTasks.map(task => {
          const dueTime = new Date(task.due_date);
          const timeString = dueTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const status = task.completed ? '✅' : '⏳';
          // Add reward information for incomplete tasks
          const rewardText = !task.completed ? ` (Rewards: ${task.coin_reward} coins, ${task.level_reward} levels)` : '';
          return `${status} **${timeString}** - ${task.title}${rewardText}`;
        }).join('\n');

        scheduleEmbed.addFields({ name: `Today's Tasks (${todaysTasks.length})`, value: tasksField, inline: false });
      } else {
        scheduleEmbed.addFields({ name: `Today's Tasks`, value: 'No tasks scheduled for today.', inline: false });
      }

      // Get due habits
      const dueHabits = scheduleData.habits.filter(habit => {
        if (!habit.last_completed) return true;

        const lastCompleted = new Date(habit.last_completed);
        return lastCompleted.getDate() !== today.getDate() ||
               lastCompleted.getMonth() !== today.getMonth() ||
               lastCompleted.getFullYear() !== today.getFullYear();
      });

      // Add due habits
      if (dueHabits.length > 0) {
        const habitsField = dueHabits.map(habit => {
          const streakText = habit.streak > 0 ? ` (Streak: ${habit.streak})` : '';
          // Add reward information
          const rewardText = ` (Rewards: ${habit.coin_reward} coins, ${habit.level_reward} levels)`;
          return `⏳ **${habit.title}**${streakText}${rewardText}`;
        }).join('\n');

        scheduleEmbed.addFields({ name: `Due Habits (${dueHabits.length})`, value: habitsField, inline: false });
      } else if (scheduleData.habits.length > 0) {
        scheduleEmbed.addFields({ name: `Habits`, value: 'All habits completed for today!', inline: false });
      } else {
        scheduleEmbed.addFields({ name: `Habits`, value: 'No habits created yet.', inline: false });
      }

      // Create navigation buttons
      const viewButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('view_schedule_today')
            .setLabel('Today')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('view_schedule_week')
            .setLabel('This Week')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('view_schedule_habits')
            .setLabel('Habits')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('back_to_schedule')
            .setLabel('Back to Menu')
            .setStyle(ButtonStyle.Danger)
        );

      // Create action buttons
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_task')
            .setLabel('Add Task')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('add_habit')
            .setLabel('Add Habit')
            .setStyle(ButtonStyle.Success)
        );

      // Send embed with buttons
      await interaction.followUp({
        embeds: [scheduleEmbed],
        components: [viewButtons, actionButtons],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling view schedule:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading your schedule. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Add Task action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleAddTask(interaction, embed) {
    // Create a new embed instead of modifying the passed one
    const taskEmbed = new DiscordEmbedBuilder()
      .setTitle('Add Task')
      .setDescription('Use the command below to add a new task to your schedule.')
      .setColor('#9b59b6')
      .addFields({ name: 'Instructions', value: 'To add a task, use the `/add-task` command with the following parameters:\n- title: Task title\n- description: Task description (optional)\n- due_date: Due date (optional)\n- priority: Priority (low, medium, high) (optional)' })
      .setTimestamp();

    // Create action row with back button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back_to_schedule')
          .setLabel('Back to Schedule')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send embed with instructions
    await interaction.followUp({
      embeds: [taskEmbed],
      components: [row],
      ephemeral: false
    });
  }

  /**
   * Handle Add Habit action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleAddHabit(interaction, embed) {
    // Create a new embed instead of modifying the passed one
    const habitEmbed = new DiscordEmbedBuilder()
      .setTitle('Add Habit')
      .setDescription('Use the command below to add a new habit to track.')
      .setColor('#9b59b6')
      .addFields({ name: 'Instructions', value: 'To add a habit, use the `/add-habit` command with the following parameters:\n- name: Habit name\n- description: Habit description (optional)\n- frequency: Frequency (daily, weekly, monthly)' })
      .setTimestamp();

    // Create action row with back button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back_to_schedule')
          .setLabel('Back to Schedule')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send embed with instructions
    await interaction.followUp({
      embeds: [habitEmbed],
      components: [row],
      ephemeral: false
    });
  }

  /**
   * Handle Create Schedule action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleCreateSchedule(interaction, embed) {
    // Create a new embed instead of modifying the passed one
    const scheduleEmbed = new DiscordEmbedBuilder()
      .setTitle('Create Schedule')
      .setDescription('Use the command below to create a new schedule.')
      .setColor('#9b59b6')
      .addFields({ name: 'Instructions', value: 'To create a schedule, use the `/create-schedule` command with the following parameters:\n- name: Schedule name\n- description: Schedule description (optional)' })
      .setTimestamp();

    // Create action row with back button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back_to_schedule')
          .setLabel('Back to Schedule')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send embed with instructions
    await interaction.followUp({
      embeds: [scheduleEmbed],
      components: [row],
      ephemeral: false
    });
  }

  /**
   * Handle Edit Tasks action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleEditTasks(interaction, embed) {
    // Create a new embed instead of modifying the passed one
    const editTaskEmbed = new DiscordEmbedBuilder()
      .setTitle('Edit Tasks')
      .setDescription('Use the command below to edit an existing task.')
      .setColor('#9b59b6')
      .addFields({ name: 'Instructions', value: 'To edit a task, use the `/edit-task` command with the following parameters:\n- task_id: Task ID\n- title: New task title (optional)\n- description: New task description (optional)\n- due_date: New due date (optional)\n- priority: New priority (low, medium, high) (optional)\n- status: New status (pending, in_progress, completed) (optional)' })
      .setTimestamp();

    // Create action row with back button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back_to_schedule')
          .setLabel('Back to Schedule')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send embed with instructions
    await interaction.followUp({
      embeds: [editTaskEmbed],
      components: [row],
      ephemeral: false
    });
  }

  /**
   * Handle View Tasks action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleViewTasks(interaction, embed) {
    try {
      // Get user's tasks with all tasks (including completed)
      const tasksData = await ScheduleService.getUserTasks(interaction.user.id, { includeCompleted: true });

      if (!tasksData.success) {
        throw new Error(tasksData.error);
      }

      // If no trainers, prompt to create one
      if (!tasksData.trainers || tasksData.trainers.length === 0) {
        const noTrainerEmbed = new DiscordEmbedBuilder()
          .setTitle('No Trainers Found')
          .setDescription('You need to create a trainer profile first before you can use the schedule features.')
          .setColor('#9b59b6')
          .setTimestamp();

        await interaction.followUp({
          embeds: [noTrainerEmbed],
          ephemeral: true
        });
        return;
      }

      // Use the first trainer for now
      const trainer = tasksData.trainers[0];

      // Create the tasks embed
      const tasksEmbed = new DiscordEmbedBuilder()
        .setTitle(`${trainer.name}'s Tasks`)
        .setDescription(`You have ${tasksData.tasks.length} tasks in total.`)
        .setColor('#9b59b6')
        .setTimestamp();

      // Group tasks by status
      const pendingTasks = tasksData.tasks.filter(task => !task.completed && (!task.due_date || new Date(task.due_date) >= new Date()));
      const overdueTasks = tasksData.tasks.filter(task => !task.completed && task.due_date && new Date(task.due_date) < new Date());
      const completedTasks = tasksData.tasks.filter(task => task.completed);

      // Add pending tasks
      if (pendingTasks.length > 0) {
        const pendingField = pendingTasks.map(task => {
          const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No due date';
          const rewardText = ` (Rewards: ${task.coin_reward} coins, ${task.level_reward} levels)`;
          return `⏳ **${task.title}** - Due: ${dueDate}${rewardText}`;
        }).join('\n');

        tasksEmbed.addFields({ name: `Pending Tasks (${pendingTasks.length})`, value: pendingField, inline: false });
      }

      // Add overdue tasks
      if (overdueTasks.length > 0) {
        const overdueField = overdueTasks.map(task => {
          const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No due date';
          const rewardText = ` (Rewards: ${task.coin_reward} coins, ${task.level_reward} levels)`;
          return `⚠️ **${task.title}** - Due: ${dueDate}${rewardText}`;
        }).join('\n');

        tasksEmbed.addFields({ name: `Overdue Tasks (${overdueTasks.length})`, value: overdueField, inline: false });
      }

      // Add completed tasks (limit to 5)
      if (completedTasks.length > 0) {
        const completedField = completedTasks.slice(0, 5).map(task => {
          const completedAt = task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
          return `✅ **${task.title}** - Completed: ${completedAt}`;
        }).join('\n');

        tasksEmbed.addFields({
          name: `Completed Tasks (${completedTasks.length})`,
          value: completedField + (completedTasks.length > 5 ? '\n*...and more*' : ''),
          inline: false
        });
      }

      // If no tasks at all
      if (tasksData.tasks.length === 0) {
        tasksEmbed.addFields({ name: 'No Tasks', value: 'You have not created any tasks yet.', inline: false });
      }

      // Create navigation buttons
      const viewButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('view_schedule_today')
            .setLabel('Today')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('view_schedule_week')
            .setLabel('This Week')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('view_schedule_habits')
            .setLabel('Habits')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('back_to_schedule')
            .setLabel('Back to Menu')
            .setStyle(ButtonStyle.Danger)
        );

      // Create action buttons
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_task')
            .setLabel('Add Task')
            .setStyle(ButtonStyle.Success)
        );

      // Send embed with buttons
      await interaction.followUp({
        embeds: [tasksEmbed],
        components: [viewButtons, actionButtons],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling view tasks:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading your tasks. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle Edit Habits action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleEditHabits(interaction, embed) {
    // Create a new embed instead of modifying the passed one
    const editHabitEmbed = new DiscordEmbedBuilder()
      .setTitle('Edit Habits')
      .setDescription('Use the command below to edit an existing habit.')
      .setColor('#9b59b6')
      .addFields({ name: 'Instructions', value: 'To edit a habit, use the `/edit-habit` command with the following parameters:\n- habit_id: Habit ID\n- name: New habit name (optional)\n- description: New habit description (optional)\n- frequency: New frequency (daily, weekly, monthly) (optional)' })
      .setTimestamp();

    // Create action row with back button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back_to_schedule')
          .setLabel('Back to Schedule')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send embed with instructions
    await interaction.followUp({
      embeds: [editHabitEmbed],
      components: [row],
      ephemeral: false
    });
  }

  /**
   * Handle View Week action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handleViewWeek(interaction) {
    try {
      // Get user's schedule
      const scheduleData = await ScheduleService.getUserSchedule(interaction.user.id);

      if (!scheduleData.success) {
        throw new Error(scheduleData.error);
      }

      // If no trainers, prompt to create one
      if (!scheduleData.trainers || scheduleData.trainers.length === 0) {
        const noTrainerEmbed = new DiscordEmbedBuilder()
          .setTitle('No Trainers Found')
          .setDescription('You need to create a trainer profile first before you can use the schedule features.')
          .setColor('#9b59b6')
          .setTimestamp();

        await interaction.followUp({
          embeds: [noTrainerEmbed],
          ephemeral: true
        });
        return;
      }

      // Use the first trainer for now
      const trainer = scheduleData.trainers[0];

      // Get start and end of week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      // Filter tasks for this week
      const weekTasks = scheduleData.tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      });

      // Create the week's schedule embed
      const weekEmbed = new DiscordEmbedBuilder()
        .setTitle(`${trainer.name}'s Schedule for This Week`)
        .setDescription(`Here's your schedule for the week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
        .setColor('#9b59b6')
        .setTimestamp();

      // Group tasks by day of week
      const tasksByDay = {};
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      daysOfWeek.forEach(day => {
        tasksByDay[day] = [];
      });

      weekTasks.forEach(task => {
        const taskDate = new Date(task.due_date);
        const dayOfWeek = daysOfWeek[taskDate.getDay()];
        tasksByDay[dayOfWeek].push(task);
      });

      // Add tasks for each day
      daysOfWeek.forEach(day => {
        const dayTasks = tasksByDay[day];

        if (dayTasks.length > 0) {
          const tasksField = dayTasks.map(task => {
            const dueTime = new Date(task.due_date);
            const timeString = dueTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const status = task.completed ? '✅' : '⏳';
            return `${status} **${timeString}** - ${task.title}`;
          }).join('\n');

          weekEmbed.addFields({ name: `${day} (${dayTasks.length})`, value: tasksField, inline: false });
        }
      });

      // If no tasks for the week
      if (weekTasks.length === 0) {
        weekEmbed.addFields({ name: 'This Week', value: 'No tasks scheduled for this week.', inline: false });
      }

      // Create navigation buttons
      const viewButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('view_schedule_today')
            .setLabel('Today')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('view_schedule_week')
            .setLabel('This Week')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('view_schedule_habits')
            .setLabel('Habits')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('back_to_schedule')
            .setLabel('Back to Menu')
            .setStyle(ButtonStyle.Danger)
        );

      // Create action buttons
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_task')
            .setLabel('Add Task')
            .setStyle(ButtonStyle.Success)
        );

      // Send embed with buttons
      await interaction.followUp({
        embeds: [weekEmbed],
        components: [viewButtons, actionButtons],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling view week:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading your weekly schedule. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }

  /**
   * Handle View Habits action
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {EmbedBuilder} embed - Embed to modify
   * @private
   */
  static async _handleViewHabits(interaction, embed) {
    try {
      // Get user's habits
      const habitsData = await ScheduleService.getUserHabits(interaction.user.id);

      if (!habitsData.success) {
        throw new Error(habitsData.error);
      }

      // If no trainers, prompt to create one
      if (!habitsData.trainers || habitsData.trainers.length === 0) {
        const noTrainerEmbed = new DiscordEmbedBuilder()
          .setTitle('No Trainers Found')
          .setDescription('You need to create a trainer profile first before you can use the schedule features.')
          .setColor('#9b59b6')
          .setTimestamp();

        await interaction.followUp({
          embeds: [noTrainerEmbed],
          ephemeral: true
        });
        return;
      }

      // Use the first trainer for now
      const trainer = habitsData.trainers[0];

      // Create the habits embed
      const habitsEmbed = new DiscordEmbedBuilder()
        .setTitle(`${trainer.name}'s Habits`)
        .setDescription(`You have ${habitsData.habits.length} habits in total.`)
        .setColor('#9b59b6')
        .setTimestamp();

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Group habits by frequency and completion status
      const habitsByFrequency = {
        daily: { completed: [], due: [] },
        weekly: { completed: [], due: [] },
        monthly: { completed: [], due: [] }
      };

      habitsData.habits.forEach(habit => {
        const frequency = habit.frequency || 'daily';
        if (!habitsByFrequency[frequency]) {
          habitsByFrequency[frequency] = { completed: [], due: [] };
        }

        // Check if habit is completed today
        let isCompletedToday = false;
        if (habit.last_completed) {
          const lastCompleted = new Date(habit.last_completed);
          lastCompleted.setHours(0, 0, 0, 0);

          // For daily habits, check if completed today
          if (frequency === 'daily') {
            isCompletedToday = lastCompleted.getTime() === today.getTime();
          }
          // For weekly habits, check if completed in the current week
          else if (frequency === 'weekly') {
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
            isCompletedToday = lastCompleted >= weekStart;
          }
          // For monthly habits, check if completed in the current month
          else if (frequency === 'monthly') {
            isCompletedToday = lastCompleted.getMonth() === today.getMonth() &&
                              lastCompleted.getFullYear() === today.getFullYear();
          }
        }

        if (isCompletedToday) {
          habitsByFrequency[frequency].completed.push(habit);
        } else {
          habitsByFrequency[frequency].due.push(habit);
        }
      });

      // Add fields for each frequency
      Object.keys(habitsByFrequency).forEach(frequency => {
        const { due, completed } = habitsByFrequency[frequency];
        const frequencyTitle = frequency.charAt(0).toUpperCase() + frequency.slice(1);

        // Add due habits
        if (due.length > 0) {
          const dueField = due.map(habit => {
            const streakText = habit.streak > 0 ? ` (Streak: ${habit.streak})` : '';
            const rewardText = ` (Rewards: ${habit.coin_reward} coins, ${habit.level_reward} levels)`;
            return `⏳ **${habit.title}**${streakText}${rewardText}`;
          }).join('\n');

          habitsEmbed.addFields({
            name: `${frequencyTitle} Habits - Due (${due.length})`,
            value: dueField,
            inline: false
          });
        }

        // Add completed habits
        if (completed.length > 0) {
          const completedField = completed.map(habit => {
            const streakText = habit.streak > 0 ? ` (Streak: ${habit.streak})` : '';
            return `✅ **${habit.title}**${streakText}`;
          }).join('\n');

          habitsEmbed.addFields({
            name: `${frequencyTitle} Habits - Completed (${completed.length})`,
            value: completedField,
            inline: false
          });
        }
      });

      // If no habits at all
      if (habitsData.habits.length === 0) {
        habitsEmbed.addFields({ name: 'No Habits', value: 'You have not created any habits yet.', inline: false });
      }

      // Create navigation buttons
      const viewButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('view_schedule_today')
            .setLabel('Today')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('view_schedule_week')
            .setLabel('This Week')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('view_schedule_tasks')
            .setLabel('Tasks')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('back_to_schedule')
            .setLabel('Back to Menu')
            .setStyle(ButtonStyle.Danger)
        );

      // Create action buttons
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_habit')
            .setLabel('Add Habit')
            .setStyle(ButtonStyle.Success)
        );

      // Send embed with buttons
      await interaction.followUp({
        embeds: [habitsEmbed],
        components: [viewButtons, actionButtons],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling view habits:', error);
      try {
        await interaction.followUp({
          content: `There was an error loading your habits. Please try again later.`,
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('Error sending follow-up message:', followUpError);
      }
    }
  }
  /**
   * Handle prompt type selection
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} promptType - Type of prompt (general, progression, legendary, event)
   * @private
   */
  static async _handlePromptTypeSelection(interaction, promptType) {
    try {
      // Get user's trainers
      const trainers = await TrainerService.getTrainersByDiscordId(interaction.user.id);

      if (!trainers || trainers.length === 0) {
        await interaction.reply({
          content: 'You don\'t have any trainers. Please create a trainer first.',
          ephemeral: true
        });
        return;
      }

      // Create trainer selection menu
      const trainerSelect = new StringSelectMenuBuilder()
        .setCustomId(`prompt_trainer_select_${promptType}_${interaction.user.id}`)
        .setPlaceholder('Select a trainer for this prompt')
        .addOptions(
          trainers.map(trainer =>
            new StringSelectMenuOptionBuilder()
              .setLabel(trainer.name)
              .setValue(trainer.id.toString())
          )
        );

      // Store submission data in temporary storage
      global.tempSubmissionData = global.tempSubmissionData || {};
      global.tempSubmissionData[interaction.user.id] = {
        type: 'prompt',
        promptType
      };

      // Send trainer selection message
      await interaction.reply({
        content: `Please select a trainer for this ${SubmissionSelectHandler._formatPromptType(promptType)} prompt submission:`,
        components: [
          new ActionRowBuilder().addComponents(trainerSelect)
        ],
        ephemeral: true
      });
    } catch (error) {
      console.error('Error handling prompt type selection:', error);
      await interaction.reply({
        content: 'An error occurred while processing your selection. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle prompt pagination
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @private
   */
  static async _handlePromptPagination(interaction) {
    try {
      // Defer the update to prevent timeout
      await interaction.deferUpdate().catch(() => {});

      // Parse the custom ID to get the prompt type, trainer ID, current page, and user ID
      const customId = interaction.customId;
      const parts = customId.split('_');
      const direction = parts[1]; // 'prev' or 'next'
      const promptType = parts[2];
      const trainerId = parts[3];
      const currentPage = parseInt(parts[4]);
      const userId = parts[5];

      // Calculate the new page
      const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;

      // Fetch prompts for this type
      const prompts = await SubmissionSelectHandler._fetchPromptsByType(promptType);

      if (!prompts || prompts.length === 0) {
        await interaction.followUp({
          content: `No ${SubmissionSelectHandler._formatPromptType(promptType)} prompts found in the database. Please check the database connection and ensure the prompt_templates table is properly populated.`,
          ephemeral: true
        });
        return;
      }

      // Calculate pagination
      const maxPromptsPerPage = 25;
      const totalPages = Math.ceil(prompts.length / maxPromptsPerPage);

      // Get prompts for the new page
      const startIndex = (newPage - 1) * maxPromptsPerPage;
      const endIndex = Math.min(startIndex + maxPromptsPerPage, prompts.length);
      const promptsForPage = prompts.slice(startIndex, endIndex);

      // Create prompt selection menu
      const promptSelect = new StringSelectMenuBuilder()
        .setCustomId(`prompt_select_${promptType}_${trainerId}_${newPage}_${userId}`)
        .setPlaceholder(`Select a ${SubmissionSelectHandler._formatPromptType(promptType)} prompt`)
        .addOptions(
          promptsForPage.map(prompt =>
            new StringSelectMenuOptionBuilder()
              .setLabel(prompt.title.substring(0, 100)) // Discord limits label to 100 chars
              .setDescription(prompt.description.substring(0, 100)) // Discord limits description to 100 chars
              .setValue(prompt.id.toString())
          )
        );

      // Create pagination buttons
      const paginationRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`prompt_prev_${promptType}_${trainerId}_${newPage}_${userId}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPage === 1),
          new ButtonBuilder()
            .setCustomId(`prompt_next_${promptType}_${trainerId}_${newPage}_${userId}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPage === totalPages)
        );

      // Update the message with the new page
      await interaction.editReply({
        content: `Please select a prompt for your ${SubmissionSelectHandler._formatPromptType(promptType)} submission (Page ${newPage}/${totalPages}):`,
        components: [
          new ActionRowBuilder().addComponents(promptSelect),
          paginationRow
        ]
      });
    } catch (error) {
      console.error('Error handling prompt pagination:', error);
      await interaction.followUp({
        content: 'An error occurred while paginating prompts.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle claim monster button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} buttonId - Button ID
   * @private
   */
  static async _handleClaimMonster(interaction, buttonId) {
    try {
      // Extract roll ID and trainer ID from button ID
      // Format: claim_monster_ROLLID_TRAINERID
      const parts = buttonId.split('_');
      const rollId = parts[2];
      const trainerId = parts[3];

      // Get the rolled monster from the client
      if (!interaction.client.rolledMonsters || !interaction.client.rolledMonsters.has(rollId)) {
        return await interaction.followUp({
          content: 'This monster is no longer available to claim.',
          ephemeral: true
        });
      }

      // Get the monster data
      const { monsterData } = interaction.client.rolledMonsters.get(rollId);

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.followUp({
          content: 'Trainer not found.',
          ephemeral: true
        });
      }

      // Create a default name based on species
      const displayData = MonsterService.getDisplayData(monsterData);
      const defaultName = displayData.species[0] || 'Monster';

      // Create a modal for naming the monster
      const modal = new ModalBuilder()
        .setCustomId(`name_monster_${rollId}_${trainerId}`)
        .setTitle('Name Your Monster');

      // Add name input field
      const nameInput = new TextInputBuilder()
        .setCustomId('monster_name')
        .setLabel('Monster Name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(`Enter a name for your ${defaultName}`)
        .setValue(defaultName)
        .setRequired(true);

      // Add row to modal
      const row = new ActionRowBuilder().addComponents(nameInput);
      modal.addComponents(row);

      // Show the modal
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error handling claim monster button:', error);
      await interaction.followUp({
        content: 'An error occurred while claiming the monster.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle monster list pagination
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} buttonId - Button ID
   * @private
   */
  static async _handleMonsterListPagination(interaction, buttonId) {
    try {
      // Extract trainer ID and page from button ID
      // Format: monster_list_next_TRAINERID_PAGE or monster_list_prev_TRAINERID_PAGE
      const parts = buttonId.split('_');
      const direction = parts[2]; // 'next' or 'prev'
      const trainerId = parts[3];
      const currentPage = parseInt(parts[4]);

      // Calculate new page
      const newPage = direction === 'next' ? currentPage + 10 : Math.max(0, currentPage - 10);

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.followUp({
          content: 'Trainer not found.',
          ephemeral: true
        });
      }

      // Get monsters for trainer
      const monsters = await Monster.getByTrainerId(trainerId);

      if (!monsters || monsters.length === 0) {
        return await interaction.followUp({
          content: `${trainer.name} doesn't have any monsters.`,
          ephemeral: true
        });
      }

      // Create embed
      const embed = new DiscordEmbedBuilder()
        .setTitle(`${trainer.name}'s Monsters`)
        .setDescription(`Total monsters: ${monsters.length}`)
        .setColor('#3498db');

      // Add fields for monsters on this page
      const displayMonsters = monsters.slice(newPage, newPage + 10);

      displayMonsters.forEach(monster => {
        const species = [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/');
        const types = [monster.type1, monster.type2, monster.type3].filter(Boolean).join(', ');

        embed.addFields({
          name: `${monster.name} (Lv. ${monster.level})`,
          value: `ID: ${monster.mon_id}\nSpecies: ${species}\nTypes: ${types}\nAttribute: ${monster.attribute || 'None'}`
        });
      });

      // Create pagination buttons
      const row = new ActionRowBuilder();

      // Add previous button if not on first page
      if (newPage > 0) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`monster_list_prev_${trainerId}_${newPage}`)
            .setLabel('Previous Page')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      // Add next button if there are more monsters
      if (newPage + 10 < monsters.length) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`monster_list_next_${trainerId}_${newPage}`)
            .setLabel('Next Page')
            .setStyle(ButtonStyle.Primary)
        );
      }

      // Update the message
      await interaction.editReply({
        embeds: [embed],
        components: row.components.length > 0 ? [row] : []
      });
    } catch (error) {
      console.error('Error handling prompt pagination:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your request. Please try again later.',
        ephemeral: true
      });
    }
  }
}

module.exports = ButtonHandler;
