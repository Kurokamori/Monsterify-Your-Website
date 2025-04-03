const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dateUtils = require('./dateUtils');

/**
 * Utility functions for generating schedule-related embeds and UI components
 */

/**
 * Generate a today's schedule embed
 * @param {Object} data - Schedule data
 * @param {Array} data.tasks - Tasks
 * @param {Array} data.habits - Habits
 * @param {Array} data.trainers - Trainers
 * @returns {Object} - Embed and components
 */
function generateTodayView(data) {
  const { tasks, habits, trainers } = data;
  
  // Use the first trainer for now
  const trainer = trainers[0];
  
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Filter tasks for today
  const todaysTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate >= today && taskDate < tomorrow;
  });
  
  // Create the today's schedule embed
  const embed = new EmbedBuilder()
    .setTitle(`${trainer.name}'s Schedule for Today`)
    .setDescription(`Here's your schedule for ${dateUtils.formatDate(today)}`)
    .setColor('#9b59b6')
    .setTimestamp();
  
  // Add today's tasks
  if (todaysTasks.length > 0) {
    const tasksField = todaysTasks.map(task => {
      const dueTime = new Date(task.due_date);
      const timeString = dateUtils.formatTime(dueTime);
      const status = task.completed ? '✅' : '⏳';
      // Add reward information for incomplete tasks
      const rewardText = !task.completed ? ` (Rewards: ${task.coin_reward} coins, ${task.level_reward} levels)` : '';
      return `${status} **${timeString}** - ${task.title}${rewardText}`;
    }).join('\n');
    
    embed.addFields({ name: `Today's Tasks (${todaysTasks.length})`, value: tasksField, inline: false });
  } else {
    embed.addFields({ name: `Today's Tasks`, value: 'No tasks scheduled for today.', inline: false });
  }
  
  // Get due habits
  const dueHabits = habits.filter(habit => {
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
    
    embed.addFields({ name: `Due Habits (${dueHabits.length})`, value: habitsField, inline: false });
  } else if (habits.length > 0) {
    embed.addFields({ name: `Habits`, value: 'All habits completed for today!', inline: false });
  } else {
    embed.addFields({ name: `Habits`, value: 'No habits created yet.', inline: false });
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
  
  return {
    embed,
    components: [viewButtons, actionButtons]
  };
}

/**
 * Generate a weekly schedule embed
 * @param {Object} data - Schedule data
 * @param {Array} data.tasks - Tasks
 * @param {Array} data.habits - Habits
 * @param {Array} data.trainers - Trainers
 * @returns {Object} - Embed and components
 */
function generateWeekView(data) {
  const { tasks, habits, trainers } = data;
  
  // Use the first trainer for now
  const trainer = trainers[0];
  
  // Get start and end of week
  const today = new Date();
  const startOfWeek = dateUtils.getStartOfWeek(today);
  const endOfWeek = dateUtils.getEndOfWeek(today);
  
  // Filter tasks for this week
  const weekTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate >= startOfWeek && taskDate <= endOfWeek;
  });
  
  // Create the week's schedule embed
  const embed = new EmbedBuilder()
    .setTitle(`${trainer.name}'s Schedule for This Week`)
    .setDescription(`Here's your schedule for the week of ${dateUtils.formatDate(startOfWeek)} to ${dateUtils.formatDate(endOfWeek)}`)
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
        const timeString = dateUtils.formatTime(dueTime);
        const status = task.completed ? '✅' : '⏳';
        return `${status} **${timeString}** - ${task.title}`;
      }).join('\n');
      
      embed.addFields({ name: `${day} (${dayTasks.length})`, value: tasksField, inline: false });
    }
  });
  
  // If no tasks for the week
  if (weekTasks.length === 0) {
    embed.addFields({ name: 'This Week', value: 'No tasks scheduled for this week.', inline: false });
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
  
  return {
    embed,
    components: [viewButtons, actionButtons]
  };
}

/**
 * Generate a habits view embed
 * @param {Object} data - Schedule data
 * @param {Array} data.habits - Habits
 * @param {Array} data.trainers - Trainers
 * @returns {Object} - Embed and components
 */
function generateHabitsView(data) {
  const { habits, trainers } = data;
  
  // Use the first trainer for now
  const trainer = trainers[0];
  
  // Create the habits embed
  const embed = new EmbedBuilder()
    .setTitle(`${trainer.name}'s Habits`)
    .setDescription(`You have ${habits.length} habits in total.`)
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
  
  habits.forEach(habit => {
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
        const weekStart = dateUtils.getStartOfWeek(today);
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
      
      embed.addFields({ 
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
      
      embed.addFields({ 
        name: `${frequencyTitle} Habits - Completed (${completed.length})`, 
        value: completedField, 
        inline: false 
      });
    }
  });
  
  // If no habits at all
  if (habits.length === 0) {
    embed.addFields({ name: 'No Habits', value: 'You have not created any habits yet.', inline: false });
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
        .setStyle(ButtonStyle.Primary),
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
  
  return {
    embed,
    components: [viewButtons, actionButtons]
  };
}

/**
 * Generate a tasks view embed
 * @param {Object} data - Schedule data
 * @param {Array} data.tasks - Tasks
 * @param {Array} data.trainers - Trainers
 * @returns {Object} - Embed and components
 */
function generateTasksView(data) {
  const { tasks, trainers } = data;
  
  // Use the first trainer for now
  const trainer = trainers[0];
  
  // Create the tasks embed
  const embed = new EmbedBuilder()
    .setTitle(`${trainer.name}'s Tasks`)
    .setDescription(`You have ${tasks.length} tasks in total.`)
    .setColor('#9b59b6')
    .setTimestamp();
  
  // Group tasks by status
  const pendingTasks = tasks.filter(task => !task.completed && (!task.due_date || new Date(task.due_date) >= new Date()));
  const overdueTasks = tasks.filter(task => !task.completed && task.due_date && new Date(task.due_date) < new Date());
  const completedTasks = tasks.filter(task => task.completed);
  
  // Add pending tasks
  if (pendingTasks.length > 0) {
    const pendingField = pendingTasks.map(task => {
      const dueDate = task.due_date ? dateUtils.formatDate(new Date(task.due_date), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No due date';
      const rewardText = ` (Rewards: ${task.coin_reward} coins, ${task.level_reward} levels)`;
      return `⏳ **${task.title}** - Due: ${dueDate}${rewardText}`;
    }).join('\n');
    
    embed.addFields({ name: `Pending Tasks (${pendingTasks.length})`, value: pendingField, inline: false });
  }
  
  // Add overdue tasks
  if (overdueTasks.length > 0) {
    const overdueField = overdueTasks.map(task => {
      const dueDate = task.due_date ? dateUtils.formatDate(new Date(task.due_date), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No due date';
      const rewardText = ` (Rewards: ${task.coin_reward} coins, ${task.level_reward} levels)`;
      return `⚠️ **${task.title}** - Due: ${dueDate}${rewardText}`;
    }).join('\n');
    
    embed.addFields({ name: `Overdue Tasks (${overdueTasks.length})`, value: overdueField, inline: false });
  }
  
  // Add completed tasks (limit to 5)
  if (completedTasks.length > 0) {
    const completedField = completedTasks.slice(0, 5).map(task => {
      const completedAt = task.completed_at ? dateUtils.formatDate(new Date(task.completed_at), { month: 'short', day: 'numeric' }) : 'Unknown';
      return `✅ **${task.title}** - Completed: ${completedAt}`;
    }).join('\n');
    
    embed.addFields({ 
      name: `Completed Tasks (${completedTasks.length})`, 
      value: completedField + (completedTasks.length > 5 ? '\n*...and more*' : ''), 
      inline: false 
    });
  }
  
  // If no tasks at all
  if (tasks.length === 0) {
    embed.addFields({ name: 'No Tasks', value: 'You have not created any tasks yet.', inline: false });
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
  
  return {
    embed,
    components: [viewButtons, actionButtons]
  };
}

module.exports = {
  generateTodayView,
  generateWeekView,
  generateHabitsView,
  generateTasksView
};
