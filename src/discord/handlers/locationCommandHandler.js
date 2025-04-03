const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const LocationService = require('../../utils/LocationService');
const Trainer = require('../../models/Trainer');

/**
 * Handler for location-related commands
 */
class LocationCommandHandler {
  /**
   * Handle garden command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleGardenCommand(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'start':
          await this._handleStartGardenActivity(interaction);
          break;
        case 'complete':
          await this._handleCompleteGardenActivity(interaction);
          break;
        case 'harvest':
          await this._handleHarvestGarden(interaction);
          break;
        case 'status':
          await this._handleGardenStatus(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown garden subcommand.' });
      }
    } catch (error) {
      console.error('Error handling garden command:', error);
      await interaction.editReply({ content: `Error processing garden command: ${error.message}` });
    }
  }

  /**
   * Handle farm command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleFarmCommand(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'start':
          await this._handleStartFarmActivity(interaction);
          break;
        case 'complete':
          await this._handleCompleteFarmActivity(interaction);
          break;
        case 'status':
          await this._handleFarmStatus(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown farm subcommand.' });
      }
    } catch (error) {
      console.error('Error handling farm command:', error);
      await interaction.editReply({ content: `Error processing farm command: ${error.message}` });
    }
  }

  /**
   * Handle pirates command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handlePiratesCommand(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'start':
          await this._handleStartPiratesActivity(interaction);
          break;
        case 'complete':
          await this._handleCompletePiratesActivity(interaction);
          break;
        case 'status':
          await this._handlePiratesStatus(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown pirates subcommand.' });
      }
    } catch (error) {
      console.error('Error handling pirates command:', error);
      await interaction.editReply({ content: `Error processing pirates command: ${error.message}` });
    }
  }

  /**
   * Handle game-corner command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleGameCornerCommand(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'start':
          await this._handleStartGameCornerActivity(interaction);
          break;
        case 'complete':
          await this._handleCompleteGameCornerActivity(interaction);
          break;
        case 'status':
          await this._handleGameCornerStatus(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown game-corner subcommand.' });
      }
    } catch (error) {
      console.error('Error handling game-corner command:', error);
      await interaction.editReply({ content: `Error processing game-corner command: ${error.message}` });
    }
  }

  /**
   * Handle start garden activity
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleStartGardenActivity(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Start garden activity
    const result = await LocationService.startActivity(
      LocationService.LOCATIONS.GARDEN,
      trainerId,
      interaction.user.id
    );
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Calculate end time
    const endTime = new Date(result.activity.end_time);
    const endTimeString = `<t:${Math.floor(endTime.getTime() / 1000)}:R>`;
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('Garden Activity Started')
      .setDescription(`${trainer.name} started tending to their garden!`)
      .setColor(LocationService.LOCATION_COLORS[LocationService.LOCATIONS.GARDEN])
      .addFields(
        { name: 'Activity ID', value: result.activity.id.toString(), inline: true },
        { name: 'Ready', value: endTimeString, inline: true }
      )
      .setFooter({ text: 'Use /garden complete to collect your rewards when ready' });
    
    // Create reminder button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`garden_complete_${result.activity.id}`)
          .setLabel('Complete Garden Activity')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle complete garden activity
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleCompleteGardenActivity(interaction) {
    const activityId = interaction.options.getString('activity_id');
    
    // Get activity
    const query = `
      SELECT * FROM location_activities
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [activityId]);
    
    if (result.rows.length === 0) {
      return await interaction.editReply({ content: 'Activity not found.' });
    }
    
    const activity = result.rows[0];
    
    // Get trainer
    const trainer = await Trainer.getById(activity.trainer_id);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Complete activity
    const completionResult = await LocationService.completeActivity(activityId, activity.trainer_id);
    
    if (!completionResult.success) {
      return await interaction.editReply({ content: completionResult.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('Garden Activity Completed')
      .setDescription(`${trainer.name} completed their garden activity!`)
      .setColor(LocationService.LOCATION_COLORS[LocationService.LOCATIONS.GARDEN])
      .addFields(
        { name: 'Productivity Score', value: `${Math.round(completionResult.productivityScore)}%`, inline: true },
        { name: 'Time Spent', value: `${completionResult.timeSpent} minutes`, inline: true }
      );
    
    // Add reward fields
    if (completionResult.rewards) {
      for (const reward of completionResult.rewards) {
        if (reward.type === 'coin') {
          embed.addFields({ name: 'Coins Earned', value: reward.reward_data.amount.toString(), inline: true });
        } else if (reward.type === 'level') {
          embed.addFields({ name: 'Levels Earned', value: reward.reward_data.amount.toString(), inline: true });
        } else if (reward.type === 'item') {
          embed.addFields({ 
            name: 'Item Earned', 
            value: `${reward.reward_data.name} (${reward.reward_data.quantity}x)`, 
            inline: true 
          });
        }
      }
    }
    
    // Add garden points field
    const gardenStats = await LocationService.getGardenStats(activity.trainer_id);
    embed.addFields({ 
      name: 'Garden Points', 
      value: `${gardenStats.potential_harvest} points ready to harvest`, 
      inline: false 
    });
    
    // Create harvest button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`garden_harvest_${activity.trainer_id}`)
          .setLabel('Harvest Garden')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(gardenStats.potential_harvest <= 0)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle harvest garden
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleHarvestGarden(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Harvest garden
    const harvestResult = await LocationService.harvestGarden(trainerId);
    
    if (!harvestResult.success) {
      return await interaction.editReply({ content: harvestResult.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('Garden Harvested')
      .setDescription(`${trainer.name} harvested their garden!`)
      .setColor(LocationService.LOCATION_COLORS[LocationService.LOCATIONS.GARDEN])
      .addFields(
        { name: 'Points Harvested', value: harvestResult.updatedGardenPoints.points.toString(), inline: true },
        { name: 'Total Garden Points', value: harvestResult.updatedGardenPoints.points.toString(), inline: true }
      );
    
    // Add reward fields
    if (harvestResult.rewards) {
      for (const reward of harvestResult.rewards) {
        if (reward.type === 'monster') {
          embed.addFields({ 
            name: 'Monster Reward', 
            value: 'You earned a special garden monster!', 
            inline: false 
          });
        } else if (reward.type === 'item') {
          embed.addFields({ 
            name: 'Item Earned', 
            value: `${reward.reward_data.name} (${reward.reward_data.quantity}x)`, 
            inline: true 
          });
        }
      }
    }
    
    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Handle garden status
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleGardenStatus(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Get garden stats
    const gardenStats = await LocationService.getGardenStats(trainerId);
    
    // Get active garden activity
    const activeActivity = await LocationService.getActiveActivity(
      trainerId,
      LocationService.LOCATIONS.GARDEN
    );
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${trainer.name}'s Garden`)
      .setColor(LocationService.LOCATION_COLORS[LocationService.LOCATIONS.GARDEN])
      .addFields(
        { name: 'Garden Points', value: gardenStats.points.toString(), inline: true },
        { name: 'Ready to Harvest', value: gardenStats.potential_harvest.toString(), inline: true }
      );
    
    if (gardenStats.last_harvest) {
      const lastHarvestTime = new Date(gardenStats.last_harvest);
      embed.addFields({ 
        name: 'Last Harvest', 
        value: `<t:${Math.floor(lastHarvestTime.getTime() / 1000)}:R>`, 
        inline: true 
      });
    }
    
    if (activeActivity) {
      const endTime = new Date(activeActivity.end_time);
      const endTimeString = `<t:${Math.floor(endTime.getTime() / 1000)}:R>`;
      
      embed.addFields(
        { name: 'Active Activity', value: 'Yes', inline: true },
        { name: 'Activity ID', value: activeActivity.id.toString(), inline: true },
        { name: 'Ready', value: endTimeString, inline: true }
      );
      
      // Create complete button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`garden_complete_${activeActivity.id}`)
            .setLabel('Complete Garden Activity')
            .setStyle(ButtonStyle.Success)
        );
      
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      embed.addFields({ name: 'Active Activity', value: 'No', inline: true });
      
      // Create start button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`garden_start_${trainerId}`)
            .setLabel('Start Garden Activity')
            .setStyle(ButtonStyle.Primary)
        );
      
      // Create harvest button if there are points to harvest
      if (gardenStats.potential_harvest > 0) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`garden_harvest_${trainerId}`)
            .setLabel('Harvest Garden')
            .setStyle(ButtonStyle.Success)
        );
      }
      
      await interaction.editReply({ embeds: [embed], components: [row] });
    }
  }

  // Similar methods for Farm, Pirates Dock, and Game Corner would be implemented here
  // For brevity, I'm not including them all, but they would follow the same pattern
}

module.exports = LocationCommandHandler;
