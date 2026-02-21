import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
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
  getDashboard,
  // Scheduled Tasks (Admin)
  runMonthlyTasks,
  addMonthlyItems,
  manualMonthlyDistribution,
  getCronJobStatus,
} from '../../controllers';

const router = Router();

// All schedule routes require authentication
router.use(authenticate);

// ============================================================================
// Dashboard
// ============================================================================

router.get('/dashboard', getDashboard);

// ============================================================================
// Task Routes
// ============================================================================

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', updateTask);
router.post('/tasks/:id/complete', completeTask);
router.delete('/tasks/:id', deleteTask);

// ============================================================================
// Habit Routes
// ============================================================================

router.get('/habits', getHabits);
router.post('/habits', createHabit);
router.get('/habits/:id', getHabitById);
router.put('/habits/:id', updateHabit);
router.post('/habits/:id/track', trackHabit);
router.delete('/habits/:id', deleteHabit);

// ============================================================================
// Routine Routes
// ============================================================================

router.get('/routines', getRoutines);
router.post('/routines', createRoutine);
router.get('/routines/today', getTodaysRoutines);
router.get('/routines/:id', getRoutineById);
router.put('/routines/:id', updateRoutine);
router.delete('/routines/:id', deleteRoutine);
router.post('/routines/:id/items', addRoutineItem);
router.put('/routines/items/:itemId', updateRoutineItem);
router.delete('/routines/items/:itemId', deleteRoutineItem);
router.post('/routines/items/:itemId/complete', completeRoutineItem);

// ============================================================================
// Scheduled Tasks (Admin)
// ============================================================================

router.post('/admin/monthly', requireAdmin, runMonthlyTasks);
router.post('/admin/monthly/items', requireAdmin, addMonthlyItems);
router.post('/admin/manual/monthly-distribution', requireAdmin, manualMonthlyDistribution);
router.get('/admin/status', requireAdmin, getCronJobStatus);

export default router;
