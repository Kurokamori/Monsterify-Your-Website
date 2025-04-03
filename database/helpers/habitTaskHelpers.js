const { Habit, Task, HabitCompletion, Reminder, Trainer, Mon } = require('../models');
const { Op } = require('sequelize');
const { addCurrency, addLevel } = require('./trainerHelpers');
const { addLevel: addMonLevel, addFriendship } = require('./monHelpers');

/**
 * Get all habits for a trainer
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of habit objects
 */
async function getTrainerHabits(trainerId) {
  try {
    return await Habit.findAll({
      where: { trainer_id: trainerId }
    });
  } catch (error) {
    console.error('Error getting trainer habits:', error);
    throw error;
  }
}

/**
 * Create a new habit
 * @param {Object} habitData - Habit data
 * @returns {Promise<Object>} - Created habit object
 */
async function createHabit(habitData) {
  try {
    return await Habit.create(habitData);
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}

/**
 * Complete a habit
 * @param {number} habitId - Habit ID
 * @returns {Promise<Object>} - Habit completion object
 */
async function completeHabit(habitId) {
  try {
    const habit = await Habit.findByPk(habitId);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Update streak
    const lastCompleted = habit.last_completed ? new Date(habit.last_completed) : null;
    const now = new Date();

    // Check if this is a new day completion (for daily habits)
    let streakIncreased = false;
    if (!lastCompleted ||
        (habit.frequency === 'daily' &&
         lastCompleted.getDate() !== now.getDate())) {
      streakIncreased = true;
      await Habit.update({
        streak: habit.streak + 1,
        longest_streak: Math.max(habit.longest_streak, habit.streak + 1),
        last_completed: now
      }, {
        where: { habit_id: habitId }
      });
    } else {
      await Habit.update({
        last_completed: now
      }, {
        where: { habit_id: habitId }
      });
    }

    // Create completion record
    const completion = await HabitCompletion.create({
      habit_id: habitId,
      levels_gained: habit.level_reward,
      coins_gained: habit.coin_reward,
      awarded_to_mon_id: habit.bound_to_mon_id,
      awarded_to_trainer_id: habit.bound_to_trainer ? habit.trainer_id : null
    });

    // Award rewards if streak increased
    if (streakIncreased) {
      // Award to mon if bound to mon
      if (habit.bound_to_mon_id) {
        // Award levels to the mon
        await addMonLevel(habit.bound_to_mon_id, habit.level_reward);
        await addFriendship(habit.bound_to_mon_id, 5); // Add some friendship too

        // Always award coins to the trainer, even when levels go to a mon
        await addCurrency(habit.trainer_id, habit.coin_reward);
      }

      // Award to trainer if bound to trainer
      if (habit.bound_to_trainer) {
        // Award both coins and levels to the trainer
        await addCurrency(habit.trainer_id, habit.coin_reward);
        await addLevel(habit.trainer_id, habit.level_reward);
      }
    }

    return completion;
  } catch (error) {
    console.error('Error completing habit:', error);
    throw error;
  }
}

/**
 * Get all tasks for a trainer
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of task objects
 */
async function getTrainerTasks(trainerId) {
  try {
    return await Task.findAll({
      where: { trainer_id: trainerId }
    });
  } catch (error) {
    console.error('Error getting trainer tasks:', error);
    throw error;
  }
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} - Created task object
 */
async function createTask(taskData) {
  try {
    const task = await Task.create(taskData);

    // Create reminder if enabled
    if (task.reminder_enabled && task.reminder_time) {
      await Reminder.create({
        task_id: task.task_id,
        trainer_id: task.trainer_id,
        scheduled_time: task.reminder_time
      });
    }

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Complete a task
 * @param {number} taskId - Task ID
 * @returns {Promise<Object>} - Updated task object
 */
async function completeTask(taskId) {
  try {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.completed) {
      throw new Error('Task already completed');
    }

    const now = new Date();

    await Task.update({
      completed: true,
      completed_at: now
    }, {
      where: { task_id: taskId }
    });

    // Award rewards
    if (task.bound_to_mon_id) {
      // Award levels to the mon
      await addMonLevel(task.bound_to_mon_id, task.level_reward);
      await addFriendship(task.bound_to_mon_id, 10); // Add some friendship too

      // Always award coins to the trainer, even when levels go to a mon
      await addCurrency(task.trainer_id, task.coin_reward);
    }

    if (task.bound_to_trainer) {
      // Award both coins and levels to the trainer
      await addCurrency(task.trainer_id, task.coin_reward);
      await addLevel(task.trainer_id, task.level_reward);
    }

    return await Task.findByPk(taskId);
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

/**
 * Get due reminders
 * @returns {Promise<Array>} - Array of due reminder objects
 */
async function getDueReminders() {
  try {
    const now = new Date();

    return await Reminder.findAll({
      where: {
        scheduled_time: { [Op.lte]: now },
        sent: false
      },
      include: [Task]
    });
  } catch (error) {
    console.error('Error getting due reminders:', error);
    throw error;
  }
}

/**
 * Mark reminder as sent
 * @param {number} reminderId - Reminder ID
 * @param {string} response - Response status
 * @returns {Promise<Object>} - Updated reminder object
 */
async function markReminderSent(reminderId, response = 'sent') {
  try {
    await Reminder.update({
      sent: true,
      response: response
    }, {
      where: { reminder_id: reminderId }
    });

    return await Reminder.findByPk(reminderId);
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    throw error;
  }
}

/**
 * Get all habits in the system
 * @returns {Promise<Array>} - Array of all habit objects
 */
async function getAllHabits() {
  try {
    return await Habit.findAll();
  } catch (error) {
    console.error('Error getting all habits:', error);
    throw error;
  }
}

/**
 * Get a habit by ID
 * @param {number} habitId - Habit ID
 * @returns {Promise<Object>} - Habit object
 */
async function getHabitById(habitId) {
  try {
    return await Habit.findByPk(habitId);
  } catch (error) {
    console.error('Error getting habit by ID:', error);
    throw error;
  }
}

/**
 * Update a habit
 * @param {number} habitId - Habit ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated habit object
 */
async function updateHabit(habitId, updateData) {
  try {
    await Habit.update(updateData, {
      where: { habit_id: habitId }
    });
    return await Habit.findByPk(habitId);
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
}

/**
 * Delete a habit
 * @param {number} habitId - Habit ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteHabit(habitId) {
  try {
    return await Habit.destroy({
      where: { habit_id: habitId }
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

/**
 * Skip a habit for today
 * @param {number} habitId - Habit ID
 * @returns {Promise<Object>} - Updated habit object
 */
async function skipHabit(habitId) {
  try {
    const habit = await Habit.findByPk(habitId);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Update the last completed time to now, but don't increase streak or give rewards
    await Habit.update({
      last_completed: new Date()
    }, {
      where: { habit_id: habitId }
    });

    return await Habit.findByPk(habitId);
  } catch (error) {
    console.error('Error skipping habit:', error);
    throw error;
  }
}

/**
 * Get a task by ID
 * @param {number} taskId - Task ID
 * @returns {Promise<Object>} - Task object
 */
async function getTaskById(taskId) {
  try {
    return await Task.findByPk(taskId);
  } catch (error) {
    console.error('Error getting task by ID:', error);
    throw error;
  }
}

/**
 * Update a task
 * @param {number} taskId - Task ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated task object
 */
async function updateTask(taskId, updateData) {
  try {
    await Task.update(updateData, {
      where: { task_id: taskId }
    });
    return await Task.findByPk(taskId);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * Update a task's reminder
 * @param {number} taskId - Task ID
 * @param {Date} reminderTime - New reminder time
 * @returns {Promise<Object>} - Updated task object
 */
async function updateTaskReminder(taskId, reminderTime) {
  try {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Update the task
    await Task.update({
      reminder_time: reminderTime
    }, {
      where: { task_id: taskId }
    });

    // Delete any existing reminders
    await Reminder.destroy({
      where: { task_id: taskId }
    });

    // Create a new reminder
    await Reminder.create({
      task_id: taskId,
      trainer_id: task.trainer_id,
      scheduled_time: reminderTime
    });

    return await Task.findByPk(taskId);
  } catch (error) {
    console.error('Error updating task reminder:', error);
    throw error;
  }
}

/**
 * Delete a task
 * @param {number} taskId - Task ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteTask(taskId) {
  try {
    // Delete associated reminders first
    await Reminder.destroy({
      where: { task_id: taskId }
    });

    // Then delete the task
    return await Task.destroy({
      where: { task_id: taskId }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Assign rewards to a trainer or mon after task/habit completion
 * @param {number} trainerId - Trainer ID
 * @param {string} targetName - Name of the target (trainer or mon)
 * @param {number} coins - Coins to award
 * @param {number} levels - Levels to award
 * @returns {Promise<Object>} - Result object with target info
 */
async function assignRewards(trainerId, targetName, coins, levels) {
  try {
    // If no target name, reward goes to the trainer
    if (!targetName || targetName.trim() === '') {
      await addCurrency(trainerId, coins);
      await addLevel(trainerId, levels);

      const trainer = await Trainer.findByPk(trainerId);
      return {
        type: 'trainer',
        name: trainer.name,
        coins,
        levels
      };
    }

    // Otherwise, try to find a mon with that name
    const mons = await Mon.findAll({
      where: {
        trainer_id: trainerId,
        name: targetName
      }
    });

    if (mons.length === 0) {
      throw new Error(`No Monster found with name ${targetName}`);
    }

    const mon = mons[0];

    // Award levels to the mon
    await addMonLevel(mon.mon_id, levels);
    await addFriendship(mon.mon_id, 5 * levels); // Add friendship based on levels

    // Always award coins to the trainer, even when levels go to a mon
    await addCurrency(trainerId, coins);

    return {
      type: 'mon',
      name: mon.name,
      species: mon.species1,
      levels,
      friendship: 5 * levels,
      trainerCoins: coins // Include the coins awarded to the trainer
    };
  } catch (error) {
    console.error('Error assigning rewards:', error);
    throw error;
  }
}

module.exports = {
  getTrainerHabits,
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  skipHabit,
  completeHabit,
  getTrainerTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskReminder,
  deleteTask,
  completeTask,
  getDueReminders,
  markReminderSent,
  assignRewards
};
