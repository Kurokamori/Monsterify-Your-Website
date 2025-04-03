const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const ScheduleService = require('../services/ScheduleService');

/**
 * Handler for form-related interactions
 */
class FormHandler {
  /**
   * Create a task form
   * @param {string} discordId - Discord user ID
   * @returns {Object} - Modal and form data
   */
  static createTaskForm(discordId) {
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId(`add_task_form_${discordId}`)
      .setTitle('Add New Task');
    
    // Create the text inputs
    const titleInput = new TextInputBuilder()
      .setCustomId('task_title')
      .setLabel('Task Title')
      .setPlaceholder('Enter task title')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    const descriptionInput = new TextInputBuilder()
      .setCustomId('task_description')
      .setLabel('Description')
      .setPlaceholder('Enter task description (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);
    
    const dueDateInput = new TextInputBuilder()
      .setCustomId('task_due_date')
      .setLabel('Due Date (MM/DD/YYYY HH:MM)')
      .setPlaceholder('e.g., 12/31/2023 14:30')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    const priorityInput = new TextInputBuilder()
      .setCustomId('task_priority')
      .setLabel('Priority (low, medium, high)')
      .setPlaceholder('Enter priority level')
      .setValue('medium')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    // Add inputs to the modal
    const titleRow = new ActionRowBuilder().addComponents(titleInput);
    const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const dueDateRow = new ActionRowBuilder().addComponents(dueDateInput);
    const priorityRow = new ActionRowBuilder().addComponents(priorityInput);
    
    modal.addComponents(titleRow, descriptionRow, dueDateRow, priorityRow);
    
    return modal;
  }
  
  /**
   * Create a habit form
   * @param {string} discordId - Discord user ID
   * @returns {Object} - Modal and form data
   */
  static createHabitForm(discordId) {
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId(`add_habit_form_${discordId}`)
      .setTitle('Add New Habit');
    
    // Create the text inputs
    const nameInput = new TextInputBuilder()
      .setCustomId('habit_name')
      .setLabel('Habit Name')
      .setPlaceholder('Enter habit name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    const descriptionInput = new TextInputBuilder()
      .setCustomId('habit_description')
      .setLabel('Description')
      .setPlaceholder('Enter habit description (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);
    
    const frequencyInput = new TextInputBuilder()
      .setCustomId('habit_frequency')
      .setLabel('Frequency (daily, weekly, monthly)')
      .setPlaceholder('Enter frequency')
      .setValue('daily')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    const difficultyInput = new TextInputBuilder()
      .setCustomId('habit_difficulty')
      .setLabel('Difficulty (low, medium, high)')
      .setPlaceholder('Enter difficulty level')
      .setValue('medium')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    // Add inputs to the modal
    const nameRow = new ActionRowBuilder().addComponents(nameInput);
    const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const frequencyRow = new ActionRowBuilder().addComponents(frequencyInput);
    const difficultyRow = new ActionRowBuilder().addComponents(difficultyInput);
    
    modal.addComponents(nameRow, descriptionRow, frequencyRow, difficultyRow);
    
    return modal;
  }
  
  /**
   * Handle task form submission
   * @param {ModalSubmitInteraction} interaction - Modal submit interaction
   * @returns {Promise<void>}
   */
  static async handleTaskFormSubmit(interaction) {
    try {
      // Get form values
      const title = interaction.fields.getTextInputValue('task_title');
      const description = interaction.fields.getTextInputValue('task_description');
      const dueDateStr = interaction.fields.getTextInputValue('task_due_date');
      const priority = interaction.fields.getTextInputValue('task_priority');
      
      // Parse due date
      let dueDate;
      try {
        // Try to parse MM/DD/YYYY HH:MM format
        const [datePart, timePart] = dueDateStr.split(' ');
        const [month, day, year] = datePart.split('/');
        const [hour, minute] = timePart ? timePart.split(':') : ['0', '0'];
        
        dueDate = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        // Check if date is valid
        if (isNaN(dueDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        await interaction.reply({
          content: 'Invalid date format. Please use MM/DD/YYYY HH:MM format (e.g., 12/31/2023 14:30).',
          ephemeral: true
        });
        return;
      }
      
      // Validate priority
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority.toLowerCase())) {
        await interaction.reply({
          content: 'Invalid priority. Please use low, medium, or high.',
          ephemeral: true
        });
        return;
      }
      
      // Add task
      const taskResult = await ScheduleService.addTask({
        title,
        description,
        dueDate,
        priority: priority.toLowerCase(),
        discordId: interaction.user.id,
        reminderEnabled: true // Enable reminders by default
      });
      
      if (!taskResult.success) {
        throw new Error(taskResult.error);
      }
      
      // Reply with success message
      await interaction.reply({
        content: `Task "${title}" added successfully! Due on ${dueDate.toLocaleString()}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error handling task form submit:', error);
      await interaction.reply({
        content: `There was an error adding your task: ${error.message}`,
        ephemeral: true
      });
    }
  }
  
  /**
   * Handle habit form submission
   * @param {ModalSubmitInteraction} interaction - Modal submit interaction
   * @returns {Promise<void>}
   */
  static async handleHabitFormSubmit(interaction) {
    try {
      // Get form values
      const name = interaction.fields.getTextInputValue('habit_name');
      const description = interaction.fields.getTextInputValue('habit_description');
      const frequency = interaction.fields.getTextInputValue('habit_frequency');
      const difficulty = interaction.fields.getTextInputValue('habit_difficulty');
      
      // Validate frequency
      const validFrequencies = ['daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(frequency.toLowerCase())) {
        await interaction.reply({
          content: 'Invalid frequency. Please use daily, weekly, or monthly.',
          ephemeral: true
        });
        return;
      }
      
      // Validate difficulty
      const validDifficulties = ['low', 'medium', 'high'];
      if (!validDifficulties.includes(difficulty.toLowerCase())) {
        await interaction.reply({
          content: 'Invalid difficulty. Please use low, medium, or high.',
          ephemeral: true
        });
        return;
      }
      
      // Add habit
      const habitResult = await ScheduleService.addHabit({
        name,
        description,
        frequency: frequency.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
        discordId: interaction.user.id
      });
      
      if (!habitResult.success) {
        throw new Error(habitResult.error);
      }
      
      // Reply with success message
      await interaction.reply({
        content: `Habit "${name}" added successfully! Frequency: ${frequency}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error handling habit form submit:', error);
      await interaction.reply({
        content: `There was an error adding your habit: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

module.exports = FormHandler;
