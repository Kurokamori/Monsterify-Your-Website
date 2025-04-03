const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ScheduleService = require('../services/ScheduleService');
const dateUtils = require('./dateUtils');

/**
 * Reminder system for tasks and habits
 */
class ReminderSystem {
  /**
   * Initialize the reminder system
   * @param {Client} client - Discord client
   */
  constructor(client) {
    this.client = client;
    this.checkInterval = 60000; // Check every minute
    this.isRunning = false;
  }

  /**
   * Start the reminder system
   */
  start() {
    if (this.isRunning) return;
    
    console.log('Starting reminder system...');
    this.isRunning = true;
    
    // Start checking for reminders
    this.checkReminders();
    
    // Set up interval for checking reminders
    this.intervalId = setInterval(() => this.checkReminders(), this.checkInterval);
  }

  /**
   * Stop the reminder system
   */
  stop() {
    if (!this.isRunning) return;
    
    console.log('Stopping reminder system...');
    this.isRunning = false;
    
    // Clear the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for due reminders
   */
  async checkReminders() {
    try {
      // Get due reminders
      const remindersData = await ScheduleService.getDueReminders();
      
      if (!remindersData.success) {
        console.error('Error getting due reminders:', remindersData.error);
        return;
      }
      
      const { reminders } = remindersData;
      
      // Process each reminder
      for (const reminder of reminders) {
        await this.sendReminder(reminder);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  /**
   * Send a reminder to a user
   * @param {Object} reminder - Reminder data
   */
  async sendReminder(reminder) {
    try {
      // Get the user
      const user = await this.client.users.fetch(reminder.discord_id);
      
      if (!user) {
        console.error(`User not found for reminder: ${reminder.id}`);
        await ScheduleService.markReminderSent(reminder.id, 'user_not_found');
        return;
      }
      
      // Create the reminder embed
      const embed = new EmbedBuilder()
        .setTitle('Task Reminder')
        .setDescription(`You have a task due soon: **${reminder.title}**`)
        .setColor('#ff9900')
        .setTimestamp();
      
      // Add due date
      if (reminder.due_date) {
        const dueDate = new Date(reminder.due_date);
        embed.addFields({ 
          name: 'Due Date', 
          value: `${dateUtils.formatDate(dueDate)} at ${dateUtils.formatTime(dueDate)}`, 
          inline: true 
        });
      }
      
      // Add description if available
      if (reminder.description) {
        embed.addFields({ name: 'Description', value: reminder.description, inline: false });
      }
      
      // Add rewards
      embed.addFields({ 
        name: 'Rewards', 
        value: `${reminder.coin_reward} coins, ${reminder.level_reward} levels`, 
        inline: true 
      });
      
      // Create action buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`complete_task_${reminder.id}`)
            .setLabel('Complete Task')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`snooze_task_${reminder.id}`)
            .setLabel('Snooze (15 min)')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`view_schedule`)
            .setLabel('View Schedule')
            .setStyle(ButtonStyle.Primary)
        );
      
      // Send the reminder
      await user.send({ embeds: [embed], components: [row] });
      
      // Mark the reminder as sent
      await ScheduleService.markReminderSent(reminder.id, 'sent');
    } catch (error) {
      console.error(`Error sending reminder ${reminder.id}:`, error);
      await ScheduleService.markReminderSent(reminder.id, 'error');
    }
  }
}

module.exports = ReminderSystem;
