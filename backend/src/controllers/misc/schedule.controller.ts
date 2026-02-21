import { Request, Response } from 'express';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduledTasksService } from '../../services/scheduled-tasks.service';
import { CronService } from '../../services/cron.service';
import {
  TaskPriority,
  TaskDifficulty,
  TaskStatus,
  HabitStatus,
  HabitFrequency,
  PatternType,
} from '../../repositories';

const scheduleService = new ScheduleService();
const scheduledTasksService = new ScheduledTasksService();

// =============================================================================
// Tasks
// =============================================================================

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { status, priority, difficulty, category } = req.query as {
      status?: TaskStatus;
      priority?: TaskPriority;
      difficulty?: TaskDifficulty;
      category?: string;
    };

    const filters: { status?: TaskStatus; priority?: TaskPriority; difficulty?: TaskDifficulty; category?: string } = {};
    if (status) { filters.status = status; }
    if (priority) { filters.priority = priority; }
    if (difficulty) { filters.difficulty = difficulty; }
    if (category) { filters.category = category; }

    const tasks = await scheduleService.getTasks(req.user.id, filters);
    res.json({ success: true, data: tasks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting tasks';
    console.error('Error getting tasks:', error);
    res.status(500).json({ success: false, message: 'Error getting tasks', error: msg });
  }
}

export async function getTaskById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const task = await scheduleService.getTaskById(parseInt(req.params.id as string));

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    if (task.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to view this task' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting task';
    console.error('Error getting task:', error);
    res.status(500).json({ success: false, message: 'Error getting task', error: msg });
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const taskData = { ...req.body, userId: req.user.id };
    const task = await scheduleService.createTask(taskData);

    // Sync reminder if enabled
    if (task.reminderEnabled && task.reminderTime && req.user.discord_id) {
      await scheduleService.syncTaskReminder(task, req.user.id, req.user.discord_id);
    }

    res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error creating task';
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Error creating task', error: msg });
  }
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const task = await scheduleService.getTaskById(id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    if (task.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to update this task' });
      return;
    }

    const updatedTask = await scheduleService.updateTask(id, req.body);

    // Sync reminder
    if (req.user.discord_id) {
      await scheduleService.syncTaskReminder(updatedTask, req.user.id, req.user.discord_id);
    }

    res.json({ success: true, data: updatedTask, message: 'Task updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating task';
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Error updating task', error: msg });
  }
}

export async function completeTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await scheduleService.completeTask(parseInt(req.params.id as string), req.user.id);
    res.json({ success: true, data: result, message: 'Task completed successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error completing task';
    console.error('Error completing task:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    await scheduleService.deleteTask(id, req.user.id);
    await scheduleService.deleteItemReminders('task', id);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting task';
    console.error('Error deleting task:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

// =============================================================================
// Habits
// =============================================================================

export async function getHabits(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { status, frequency } = req.query as {
      status?: HabitStatus;
      frequency?: HabitFrequency;
    };

    const filters: { status?: HabitStatus; frequency?: HabitFrequency } = {};
    if (status) { filters.status = status; }
    if (frequency) { filters.frequency = frequency; }

    const habits = await scheduleService.getHabits(req.user.id, filters);
    res.json({ success: true, data: habits });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting habits';
    console.error('Error getting habits:', error);
    res.status(500).json({ success: false, message: 'Error getting habits', error: msg });
  }
}

export async function getHabitById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const habit = await scheduleService.getHabitById(parseInt(req.params.id as string));

    if (!habit) {
      res.status(404).json({ success: false, message: 'Habit not found' });
      return;
    }

    if (habit.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to view this habit' });
      return;
    }

    res.json({ success: true, data: habit });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting habit';
    console.error('Error getting habit:', error);
    res.status(500).json({ success: false, message: 'Error getting habit', error: msg });
  }
}

export async function createHabit(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const habitData = { ...req.body, userId: req.user.id };
    const habit = await scheduleService.createHabit(habitData);

    // Sync reminder if enabled
    if (habit.reminderEnabled && habit.reminderTime && req.user.discord_id) {
      await scheduleService.syncHabitReminder(habit, req.user.id, req.user.discord_id);
    }

    res.status(201).json({ success: true, data: habit, message: 'Habit created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error creating habit';
    console.error('Error creating habit:', error);
    res.status(500).json({ success: false, message: 'Error creating habit', error: msg });
  }
}

export async function updateHabit(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const habit = await scheduleService.getHabitById(id);

    if (!habit) {
      res.status(404).json({ success: false, message: 'Habit not found' });
      return;
    }

    if (habit.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to update this habit' });
      return;
    }

    const updatedHabit = await scheduleService.updateHabit(id, req.body);

    // Sync reminder
    if (req.user.discord_id) {
      await scheduleService.syncHabitReminder(updatedHabit, req.user.id, req.user.discord_id);
    }

    res.json({ success: true, data: updatedHabit, message: 'Habit updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating habit';
    console.error('Error updating habit:', error);
    res.status(500).json({ success: false, message: 'Error updating habit', error: msg });
  }
}

export async function trackHabit(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await scheduleService.trackHabit(parseInt(req.params.id as string), req.user.id);
    res.json({ success: true, data: result, message: 'Habit tracked successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error tracking habit';
    console.error('Error tracking habit:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteHabit(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    await scheduleService.deleteHabit(id, req.user.id);
    await scheduleService.deleteItemReminders('habit', id);

    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting habit';
    console.error('Error deleting habit:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

// =============================================================================
// Routines
// =============================================================================

export async function getRoutines(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { is_active, pattern_type } = req.query as {
      is_active?: string;
      pattern_type?: PatternType;
    };

    const filters: { isActive?: boolean; patternType?: string } = {};
    if (is_active !== undefined) { filters.isActive = is_active === '1' || is_active === 'true'; }
    if (pattern_type) { filters.patternType = pattern_type; }

    const routines = await scheduleService.getRoutines(req.user.id, filters);
    res.json({ success: true, data: routines });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting routines';
    console.error('Error getting routines:', error);
    res.status(500).json({ success: false, message: 'Error getting routines', error: msg });
  }
}

export async function getRoutineById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const routine = await scheduleService.getRoutineById(parseInt(req.params.id as string));

    if (!routine) {
      res.status(404).json({ success: false, message: 'Routine not found' });
      return;
    }

    if (routine.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to view this routine' });
      return;
    }

    res.json({ success: true, data: routine });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting routine';
    console.error('Error getting routine:', error);
    res.status(500).json({ success: false, message: 'Error getting routine', error: msg });
  }
}

export async function createRoutine(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const routineData = { ...req.body, userId: req.user.id };
    const routine = await scheduleService.createRoutine(routineData);

    res.status(201).json({ success: true, data: routine, message: 'Routine created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error creating routine';
    console.error('Error creating routine:', error);
    res.status(500).json({ success: false, message: 'Error creating routine', error: msg });
  }
}

export async function updateRoutine(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const routine = await scheduleService.getRoutineById(id);

    if (!routine) {
      res.status(404).json({ success: false, message: 'Routine not found' });
      return;
    }

    if (routine.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to update this routine' });
      return;
    }

    const updatedRoutine = await scheduleService.updateRoutine(id, req.body);
    res.json({ success: true, data: updatedRoutine, message: 'Routine updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating routine';
    console.error('Error updating routine:', error);
    res.status(500).json({ success: false, message: 'Error updating routine', error: msg });
  }
}

export async function deleteRoutine(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await scheduleService.deleteRoutine(parseInt(req.params.id as string), req.user.id);
    res.json({ success: true, message: 'Routine deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting routine';
    console.error('Error deleting routine:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function addRoutineItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const routineId = parseInt(req.params.id as string);
    const routine = await scheduleService.getRoutineById(routineId);

    if (!routine) {
      res.status(404).json({ success: false, message: 'Routine not found' });
      return;
    }

    if (routine.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to modify this routine' });
      return;
    }

    const item = await scheduleService.addRoutineItem(routineId, req.body);

    // Sync reminder if enabled
    if (item.reminderEnabled && req.user.discord_id) {
      await scheduleService.syncRoutineItemReminder(item, routine.name, req.user.id, req.user.discord_id);
    }

    res.status(201).json({ success: true, data: item, message: 'Routine item added successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adding routine item';
    console.error('Error adding routine item:', error);
    res.status(500).json({ success: false, message: 'Error adding routine item', error: msg });
  }
}

export async function updateRoutineItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const itemId = parseInt(req.params.itemId as string);
    const item = await scheduleService.updateRoutineItem(itemId, req.body);

    // Sync reminder
    if (req.user.discord_id) {
      await scheduleService.syncRoutineItemReminder(item, '', req.user.id, req.user.discord_id);
    }

    res.json({ success: true, data: item, message: 'Routine item updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating routine item';
    console.error('Error updating routine item:', error);
    res.status(500).json({ success: false, message: 'Error updating routine item', error: msg });
  }
}

export async function deleteRoutineItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const itemId = parseInt(req.params.itemId as string);
    await scheduleService.deleteRoutineItem(itemId);
    await scheduleService.deleteItemReminders('routine_item', itemId);

    res.json({ success: true, message: 'Routine item deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting routine item';
    console.error('Error deleting routine item:', error);
    res.status(500).json({ success: false, message: 'Error deleting routine item', error: msg });
  }
}

export async function completeRoutineItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await scheduleService.completeRoutineItem(parseInt(req.params.itemId as string), req.user.id);
    res.json({ success: true, data: result, message: 'Routine item completed successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error completing routine item';
    console.error('Error completing routine item:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTodaysRoutines(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const routines = await scheduleService.getTodaysRoutines(req.user.id);
    res.json({ success: true, data: routines });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error getting today's routines";
    console.error("Error getting today's routines:", error);
    res.status(500).json({ success: false, message: "Error getting today's routines", error: msg });
  }
}

// =============================================================================
// Dashboard
// =============================================================================

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const data = await scheduleService.getDashboard(req.user.id, req.user.discord_id);
    res.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting dashboard data';
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ success: false, message: 'Error getting dashboard data', error: msg });
  }
}

// =============================================================================
// Scheduled Tasks (Admin - combined from old scheduledTasksController)
// =============================================================================

export async function runMonthlyTasks(req: Request, res: Response): Promise<void> {
  try {
    const force = req.body.force === true;

    if (!scheduledTasksService.isFirstDayOfMonth() && !force) {
      res.status(400).json({
        success: false,
        message: 'This endpoint can only be called on the first day of the month, or with force=true',
      });
      return;
    }

    const result = await scheduledTasksService.runMonthlyTasks();
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error running monthly tasks';
    console.error('Error running monthly tasks:', error);
    res.status(500).json({ success: false, message: 'Error running monthly tasks', error: msg });
  }
}

export async function addMonthlyItems(req: Request, res: Response): Promise<void> {
  try {
    const force = req.body.force === true;

    if (!scheduledTasksService.isFirstDayOfMonth() && !force) {
      res.status(400).json({
        success: false,
        message: 'This endpoint can only be called on the first day of the month, or with force=true',
      });
      return;
    }

    const result = await scheduledTasksService.addMonthlyItems();
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adding monthly items';
    console.error('Error adding monthly items:', error);
    res.status(500).json({ success: false, message: 'Error adding monthly items', error: msg });
  }
}

export async function manualMonthlyDistribution(_req: Request, res: Response): Promise<void> {
  try {
    const cronService = new CronService();
    const result = await cronService.triggerMonthlyDistribution();
    res.json({
      success: true,
      message: 'Manual monthly distribution completed',
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error in manual monthly distribution';
    console.error('Error in manual monthly distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error in manual monthly distribution',
      error: msg,
    });
  }
}

export async function getCronJobStatus(_req: Request, res: Response): Promise<void> {
  try {
    const cronService = new CronService();
    const status = cronService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting cron job status';
    console.error('Error getting cron job status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting cron job status',
      error: msg,
    });
  }
}
