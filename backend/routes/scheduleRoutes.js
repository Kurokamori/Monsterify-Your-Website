const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/scheduleController');

// All routes require authentication
router.use(protect);

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

/**
 * @route   GET /api/schedule/dashboard
 * @desc    Get schedule dashboard data
 * @access  Private
 */
router.get('/dashboard', getDashboard);

// ============================================================================
// TASK ROUTES
// ============================================================================

/**
 * @route   GET /api/schedule/tasks
 * @desc    Get all tasks for the authenticated user
 * @access  Private
 */
router.get('/tasks', getTasks);

/**
 * @route   POST /api/schedule/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/tasks', createTask);

/**
 * @route   GET /api/schedule/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/tasks/:id', getTaskById);

/**
 * @route   PUT /api/schedule/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put('/tasks/:id', updateTask);

/**
 * @route   POST /api/schedule/tasks/:id/complete
 * @desc    Complete a task
 * @access  Private
 */
router.post('/tasks/:id/complete', completeTask);

/**
 * @route   DELETE /api/schedule/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/tasks/:id', deleteTask);

// ============================================================================
// HABIT ROUTES
// ============================================================================

/**
 * @route   GET /api/schedule/habits
 * @desc    Get all habits for the authenticated user
 * @access  Private
 */
router.get('/habits', getHabits);

/**
 * @route   POST /api/schedule/habits
 * @desc    Create a new habit
 * @access  Private
 */
router.post('/habits', createHabit);

/**
 * @route   GET /api/schedule/habits/:id
 * @desc    Get habit by ID
 * @access  Private
 */
router.get('/habits/:id', getHabitById);

/**
 * @route   PUT /api/schedule/habits/:id
 * @desc    Update a habit
 * @access  Private
 */
router.put('/habits/:id', updateHabit);

/**
 * @route   POST /api/schedule/habits/:id/track
 * @desc    Track a habit completion
 * @access  Private
 */
router.post('/habits/:id/track', trackHabit);

/**
 * @route   DELETE /api/schedule/habits/:id
 * @desc    Delete a habit
 * @access  Private
 */
router.delete('/habits/:id', deleteHabit);

// ============================================================================
// ROUTINE ROUTES
// ============================================================================

/**
 * @route   GET /api/schedule/routines
 * @desc    Get all routines for the authenticated user
 * @access  Private
 */
router.get('/routines', getRoutines);

/**
 * @route   POST /api/schedule/routines
 * @desc    Create a new routine
 * @access  Private
 */
router.post('/routines', createRoutine);

/**
 * @route   GET /api/schedule/routines/today
 * @desc    Get today's active routines
 * @access  Private
 */
router.get('/routines/today', getTodaysRoutines);

/**
 * @route   GET /api/schedule/routines/:id
 * @desc    Get routine by ID
 * @access  Private
 */
router.get('/routines/:id', getRoutineById);

/**
 * @route   PUT /api/schedule/routines/:id
 * @desc    Update a routine
 * @access  Private
 */
router.put('/routines/:id', updateRoutine);

/**
 * @route   DELETE /api/schedule/routines/:id
 * @desc    Delete a routine
 * @access  Private
 */
router.delete('/routines/:id', deleteRoutine);

/**
 * @route   POST /api/schedule/routines/:id/items
 * @desc    Add item to routine
 * @access  Private
 */
router.post('/routines/:id/items', addRoutineItem);

/**
 * @route   PUT /api/schedule/routines/items/:itemId
 * @desc    Update routine item
 * @access  Private
 */
router.put('/routines/items/:itemId', updateRoutineItem);

/**
 * @route   DELETE /api/schedule/routines/items/:itemId
 * @desc    Delete routine item
 * @access  Private
 */
router.delete('/routines/items/:itemId', deleteRoutineItem);

/**
 * @route   POST /api/schedule/routines/items/:itemId/complete
 * @desc    Complete routine item
 * @access  Private
 */
router.post('/routines/items/:itemId/complete', completeRoutineItem);

module.exports = router;
