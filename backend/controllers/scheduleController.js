const Task = require('../models/Task');
const Habit = require('../models/Habit');
const DailyRoutine = require('../models/DailyRoutine');
const Reminder = require('../models/Reminder');
const Trainer = require('../models/Trainer');

/**
 * Schedule controller for managing tasks, habits, and routines
 */

// ============================================================================
// TASKS
// ============================================================================

/**
 * @desc    Get all tasks for the authenticated user
 * @route   GET /api/schedule/tasks
 * @access  Private
 */
const getTasks = async (req, res) => {
  try {
    const { status, priority, difficulty, category } = req.query;
    const filters = { status, priority, difficulty, category };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const tasks = await Task.getByUserId(req.user.id, filters);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting tasks',
      error: error.message
    });
  }
};

/**
 * @desc    Get task by ID
 * @route   GET /api/schedule/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.getById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting task',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/schedule/tasks
 * @access  Private
 */
const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user_id: req.user.id
    };

    const task = await Task.create(taskData);

    // Create reminder if enabled
    if (task.reminder_enabled && task.reminder_time && req.user.discord_id) {
      await Reminder.syncFromItem(task, 'task', req.user.id, req.user.discord_id);
    }

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/schedule/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.getById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    const updatedTask = await Task.update(req.params.id, req.body);

    // Sync reminder
    if (req.user.discord_id) {
      await Reminder.syncFromItem(updatedTask, 'task', req.user.id, req.user.discord_id);
    }

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

/**
 * @desc    Complete a task
 * @route   POST /api/schedule/tasks/:id/complete
 * @access  Private
 */
const completeTask = async (req, res) => {
  try {
    const result = await Task.complete(req.params.id, req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'Task completed successfully'
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/schedule/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    await Task.delete(req.params.id, req.user.id);

    // Delete associated reminders
    await Reminder.deleteByItem('task', req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// HABITS
// ============================================================================

/**
 * @desc    Get all habits for the authenticated user
 * @route   GET /api/schedule/habits
 * @access  Private
 */
const getHabits = async (req, res) => {
  try {
    const { status, frequency } = req.query;
    const filters = { status, frequency };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const habits = await Habit.getByUserId(req.user.id, filters);

    res.json({
      success: true,
      data: habits
    });
  } catch (error) {
    console.error('Error getting habits:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting habits',
      error: error.message
    });
  }
};

/**
 * @desc    Get habit by ID
 * @route   GET /api/schedule/habits/:id
 * @access  Private
 */
const getHabitById = async (req, res) => {
  try {
    const habit = await Habit.getById(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    if (habit.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this habit'
      });
    }

    res.json({
      success: true,
      data: habit
    });
  } catch (error) {
    console.error('Error getting habit:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting habit',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new habit
 * @route   POST /api/schedule/habits
 * @access  Private
 */
const createHabit = async (req, res) => {
  try {
    const habitData = {
      ...req.body,
      user_id: req.user.id
    };

    const habit = await Habit.create(habitData);

    // Create reminder if enabled
    if (habit.reminder_enabled && habit.reminder_time && req.user.discord_id) {
      await Reminder.syncFromItem(habit, 'habit', req.user.id, req.user.discord_id);
    }

    res.status(201).json({
      success: true,
      data: habit,
      message: 'Habit created successfully'
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating habit',
      error: error.message
    });
  }
};

/**
 * @desc    Update a habit
 * @route   PUT /api/schedule/habits/:id
 * @access  Private
 */
const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.getById(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    if (habit.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this habit'
      });
    }

    const updatedHabit = await Habit.update(req.params.id, req.body);

    // Sync reminder
    if (req.user.discord_id) {
      await Reminder.syncFromItem(updatedHabit, 'habit', req.user.id, req.user.discord_id);
    }

    res.json({
      success: true,
      data: updatedHabit,
      message: 'Habit updated successfully'
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating habit',
      error: error.message
    });
  }
};

/**
 * @desc    Track a habit
 * @route   POST /api/schedule/habits/:id/track
 * @access  Private
 */
const trackHabit = async (req, res) => {
  try {
    const result = await Habit.track(req.params.id, req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'Habit tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking habit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete a habit
 * @route   DELETE /api/schedule/habits/:id
 * @access  Private
 */
const deleteHabit = async (req, res) => {
  try {
    await Habit.delete(req.params.id, req.user.id);

    // Delete associated reminders
    await Reminder.deleteByItem('habit', req.params.id);

    res.json({
      success: true,
      message: 'Habit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// DAILY ROUTINES
// ============================================================================

/**
 * @desc    Get all routines for the authenticated user
 * @route   GET /api/schedule/routines
 * @access  Private
 */
const getRoutines = async (req, res) => {
  try {
    const { is_active, pattern_type } = req.query;
    const filters = {};

    if (is_active !== undefined) filters.is_active = parseInt(is_active);
    if (pattern_type) filters.pattern_type = pattern_type;

    const routines = await DailyRoutine.getByUserId(req.user.id, filters);

    res.json({
      success: true,
      data: routines
    });
  } catch (error) {
    console.error('Error getting routines:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting routines',
      error: error.message
    });
  }
};

/**
 * @desc    Get routine by ID
 * @route   GET /api/schedule/routines/:id
 * @access  Private
 */
const getRoutineById = async (req, res) => {
  try {
    const routine = await DailyRoutine.getById(req.params.id);

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    if (routine.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this routine'
      });
    }

    res.json({
      success: true,
      data: routine
    });
  } catch (error) {
    console.error('Error getting routine:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting routine',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new routine
 * @route   POST /api/schedule/routines
 * @access  Private
 */
const createRoutine = async (req, res) => {
  try {
    const routineData = {
      ...req.body,
      user_id: req.user.id
    };

    const routine = await DailyRoutine.create(routineData);

    res.status(201).json({
      success: true,
      data: routine,
      message: 'Routine created successfully'
    });
  } catch (error) {
    console.error('Error creating routine:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating routine',
      error: error.message
    });
  }
};

/**
 * @desc    Update a routine
 * @route   PUT /api/schedule/routines/:id
 * @access  Private
 */
const updateRoutine = async (req, res) => {
  try {
    const routine = await DailyRoutine.getById(req.params.id);

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    if (routine.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this routine'
      });
    }

    const updatedRoutine = await DailyRoutine.update(req.params.id, req.body);

    res.json({
      success: true,
      data: updatedRoutine,
      message: 'Routine updated successfully'
    });
  } catch (error) {
    console.error('Error updating routine:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating routine',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a routine
 * @route   DELETE /api/schedule/routines/:id
 * @access  Private
 */
const deleteRoutine = async (req, res) => {
  try {
    await DailyRoutine.delete(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Routine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting routine:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add item to routine
 * @route   POST /api/schedule/routines/:id/items
 * @access  Private
 */
const addRoutineItem = async (req, res) => {
  try {
    const routine = await DailyRoutine.getById(req.params.id);

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    if (routine.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this routine'
      });
    }

    const item = await DailyRoutine.addItem(req.params.id, req.body);

    // Create reminder if enabled
    if (item.reminder_enabled && req.user.discord_id) {
      await Reminder.syncFromItem(item, 'routine_item', req.user.id, req.user.discord_id);
    }

    res.status(201).json({
      success: true,
      data: item,
      message: 'Routine item added successfully'
    });
  } catch (error) {
    console.error('Error adding routine item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding routine item',
      error: error.message
    });
  }
};

/**
 * @desc    Update routine item
 * @route   PUT /api/schedule/routines/items/:itemId
 * @access  Private
 */
const updateRoutineItem = async (req, res) => {
  try {
    const item = await DailyRoutine.updateItem(req.params.itemId, req.body);

    // Sync reminder
    if (req.user.discord_id) {
      await Reminder.syncFromItem(item, 'routine_item', req.user.id, req.user.discord_id);
    }

    res.json({
      success: true,
      data: item,
      message: 'Routine item updated successfully'
    });
  } catch (error) {
    console.error('Error updating routine item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating routine item',
      error: error.message
    });
  }
};

/**
 * @desc    Delete routine item
 * @route   DELETE /api/schedule/routines/items/:itemId
 * @access  Private
 */
const deleteRoutineItem = async (req, res) => {
  try {
    await DailyRoutine.deleteItem(req.params.itemId);

    // Delete associated reminders
    await Reminder.deleteByItem('routine_item', req.params.itemId);

    res.json({
      success: true,
      message: 'Routine item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting routine item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting routine item',
      error: error.message
    });
  }
};

/**
 * @desc    Complete routine item
 * @route   POST /api/schedule/routines/items/:itemId/complete
 * @access  Private
 */
const completeRoutineItem = async (req, res) => {
  try {
    const result = await DailyRoutine.completeItem(req.params.itemId, req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'Routine item completed successfully'
    });
  } catch (error) {
    console.error('Error completing routine item:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get today's active routines
 * @route   GET /api/schedule/routines/today
 * @access  Private
 */
const getTodaysRoutines = async (req, res) => {
  try {
    const routines = await DailyRoutine.getActiveRoutinesForToday(req.user.id);

    res.json({
      success: true,
      data: routines
    });
  } catch (error) {
    console.error('Error getting today\'s routines:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting today\'s routines',
      error: error.message
    });
  }
};

// ============================================================================
// DASHBOARD & OVERVIEW
// ============================================================================

/**
 * @desc    Get schedule dashboard data
 * @route   GET /api/schedule/dashboard
 * @access  Private
 */
const getDashboard = async (req, res) => {
  try {
    // Get user's trainers for reward assignment
    const trainers = await Trainer.getByUserId(req.user.id);

    // Get pending tasks
    const pendingTasks = await Task.getByUserId(req.user.id, { status: 'pending' });

    // Get active habits
    const activeHabits = await Habit.getByUserId(req.user.id, { status: 'active' });

    // Get today's routines
    const todaysRoutines = await DailyRoutine.getActiveRoutinesForToday(req.user.id);

    // Get due tasks
    const dueTasks = await Task.getDueToday();

    // Get reminder statistics
    const reminderStats = await Reminder.getStatistics(req.user.id);

    res.json({
      success: true,
      data: {
        trainers,
        tasks: {
          pending: pendingTasks,
          due: dueTasks.filter(task => task.user_id === req.user.id)
        },
        habits: activeHabits,
        routines: todaysRoutines,
        reminders: reminderStats
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting dashboard data',
      error: error.message
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Tasks
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,

  // Habits
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  trackHabit,
  deleteHabit,

  // Routines
  getRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  addRoutineItem,
  updateRoutineItem,
  deleteRoutineItem,
  completeRoutineItem,
  getTodaysRoutines,

  // Dashboard
  getDashboard
};