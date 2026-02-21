import {
  TaskRepository,
  TaskWithDetails,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQueryOptions,
  HabitRepository,
  HabitWithDetails,
  HabitCreateInput,
  HabitUpdateInput,
  HabitStatus,
  HabitFrequency,
  DailyRoutineRepository,
  DailyRoutineWithItems,
  DailyRoutineCreateInput,
  DailyRoutineUpdateInput,
  RoutineItemCreateInput,
  RoutineItemUpdateInput,
  RoutineItem,
  ReminderRepository,
  ReminderItemType,
  ReminderStatistics,
  TrainerRepository,
  TrainerWithStats,
} from '../repositories';

export type DashboardData = {
  trainers: TrainerWithStats[];
  tasks: {
    pending: TaskWithDetails[];
    due: TaskWithDetails[];
  };
  habits: HabitWithDetails[];
  routines: DailyRoutineWithItems[];
  reminders: ReminderStatistics;
};

export class ScheduleService {
  private taskRepository: TaskRepository;
  private habitRepository: HabitRepository;
  private dailyRoutineRepository: DailyRoutineRepository;
  private reminderRepository: ReminderRepository;
  private trainerRepository: TrainerRepository;

  constructor(
    taskRepository?: TaskRepository,
    habitRepository?: HabitRepository,
    dailyRoutineRepository?: DailyRoutineRepository,
    reminderRepository?: ReminderRepository,
    trainerRepository?: TrainerRepository,
  ) {
    this.taskRepository = taskRepository ?? new TaskRepository();
    this.habitRepository = habitRepository ?? new HabitRepository();
    this.dailyRoutineRepository = dailyRoutineRepository ?? new DailyRoutineRepository();
    this.reminderRepository = reminderRepository ?? new ReminderRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
  }

  // =========================================================================
  // Tasks
  // =========================================================================

  async getTasks(userId: number, filters: TaskQueryOptions = {}): Promise<TaskWithDetails[]> {
    return this.taskRepository.findByUserId(userId, filters);
  }

  async getTaskById(id: number): Promise<TaskWithDetails | null> {
    return this.taskRepository.findById(id);
  }

  async createTask(input: TaskCreateInput): Promise<TaskWithDetails> {
    const task = await this.taskRepository.create(input);
    // Fetch with details
    const taskWithDetails = await this.taskRepository.findById(task.id);
    return taskWithDetails ?? (task as TaskWithDetails);
  }

  async updateTask(id: number, input: TaskUpdateInput): Promise<TaskWithDetails> {
    const updated = await this.taskRepository.update(id, input);
    const taskWithDetails = await this.taskRepository.findById(updated.id);
    return taskWithDetails ?? (updated as TaskWithDetails);
  }

  async completeTask(id: number, userId: number): Promise<TaskWithDetails> {
    const task = await this.taskRepository.findById(id);
    if (!task) { throw new Error('Task not found'); }
    if (task.userId !== userId) { throw new Error('Not authorized'); }

    const completed = await this.taskRepository.complete(id);
    const taskWithDetails = await this.taskRepository.findById(completed.id);
    return taskWithDetails ?? (completed as TaskWithDetails);
  }

  async deleteTask(id: number, userId: number): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) { throw new Error('Task not found'); }
    if (task.userId !== userId) { throw new Error('Not authorized'); }

    await this.taskRepository.delete(id);
  }

  // =========================================================================
  // Habits
  // =========================================================================

  async getHabits(userId: number, filters: { status?: HabitStatus; frequency?: HabitFrequency } = {}): Promise<HabitWithDetails[]> {
    return this.habitRepository.findByUserId(userId, filters);
  }

  async getHabitById(id: number): Promise<HabitWithDetails | null> {
    return this.habitRepository.findById(id);
  }

  async createHabit(input: HabitCreateInput): Promise<HabitWithDetails> {
    const habit = await this.habitRepository.create(input);
    const habitWithDetails = await this.habitRepository.findById(habit.id);
    return habitWithDetails ?? (habit as HabitWithDetails);
  }

  async updateHabit(id: number, input: HabitUpdateInput): Promise<HabitWithDetails> {
    const updated = await this.habitRepository.update(id, input);
    const habitWithDetails = await this.habitRepository.findById(updated.id);
    return habitWithDetails ?? (updated as HabitWithDetails);
  }

  async trackHabit(id: number, userId: number): Promise<{ habit: HabitWithDetails; streakChange: number }> {
    const habit = await this.habitRepository.findById(id);
    if (!habit) { throw new Error('Habit not found'); }
    if (habit.userId !== userId) { throw new Error('Not authorized'); }

    const result = await this.habitRepository.track(id);
    const habitWithDetails = await this.habitRepository.findById(result.habit.id);
    return {
      habit: habitWithDetails ?? (result.habit as HabitWithDetails),
      streakChange: result.streakChange,
    };
  }

  async deleteHabit(id: number, userId: number): Promise<void> {
    const habit = await this.habitRepository.findById(id);
    if (!habit) { throw new Error('Habit not found'); }
    if (habit.userId !== userId) { throw new Error('Not authorized'); }

    await this.habitRepository.delete(id);
  }

  // =========================================================================
  // Routines
  // =========================================================================

  async getRoutines(userId: number, filters: { isActive?: boolean; patternType?: string } = {}): Promise<DailyRoutineWithItems[]> {
    return this.dailyRoutineRepository.findByUserId(userId, filters as { isActive?: boolean; patternType?: 'daily' | 'weekdays' | 'weekends' | 'custom' });
  }

  async getRoutineById(id: number): Promise<DailyRoutineWithItems | null> {
    return this.dailyRoutineRepository.findById(id);
  }

  async createRoutine(input: DailyRoutineCreateInput): Promise<DailyRoutineWithItems> {
    const routine = await this.dailyRoutineRepository.create(input);
    const routineWithItems = await this.dailyRoutineRepository.findById(routine.id);
    return routineWithItems ?? { ...routine, items: [] };
  }

  async updateRoutine(id: number, input: DailyRoutineUpdateInput): Promise<DailyRoutineWithItems> {
    const updated = await this.dailyRoutineRepository.update(id, input);
    const routineWithItems = await this.dailyRoutineRepository.findById(updated.id);
    return routineWithItems ?? { ...updated, items: [] };
  }

  async deleteRoutine(id: number, userId: number): Promise<void> {
    const routine = await this.dailyRoutineRepository.findById(id);
    if (!routine) { throw new Error('Routine not found'); }
    if (routine.userId !== userId) { throw new Error('Not authorized'); }

    await this.dailyRoutineRepository.delete(id);
  }

  async addRoutineItem(routineId: number, input: Omit<RoutineItemCreateInput, 'routineId'>): Promise<RoutineItem> {
    return this.dailyRoutineRepository.addItem({ ...input, routineId });
  }

  async updateRoutineItem(itemId: number, input: RoutineItemUpdateInput): Promise<RoutineItem> {
    return this.dailyRoutineRepository.updateItem(itemId, input);
  }

  async deleteRoutineItem(itemId: number): Promise<boolean> {
    return this.dailyRoutineRepository.deleteItem(itemId);
  }

  async completeRoutineItem(itemId: number, userId: number): Promise<{ success: boolean; item: RoutineItem }> {
    return this.dailyRoutineRepository.completeItem(itemId, userId);
  }

  async getTodaysRoutines(userId: number): Promise<DailyRoutineWithItems[]> {
    return this.dailyRoutineRepository.getActiveRoutinesForToday(userId);
  }

  // =========================================================================
  // Dashboard
  // =========================================================================

  async getDashboard(userId: number, discordId?: string | null): Promise<DashboardData> {
    const trainers = discordId
      ? await this.trainerRepository.findByUserId(discordId)
      : [];

    const [pendingTasks, activeHabits, todaysRoutines, dueTasks, reminderStats] = await Promise.all([
      this.taskRepository.findByUserId(userId, { status: 'pending' }),
      this.habitRepository.findByUserId(userId, { status: 'active' }),
      this.dailyRoutineRepository.getActiveRoutinesForToday(userId),
      this.taskRepository.getDueToday(),
      this.reminderRepository.getStatistics(userId),
    ]);

    return {
      trainers,
      tasks: {
        pending: pendingTasks,
        due: dueTasks.filter(task => task.userId === userId),
      },
      habits: activeHabits,
      routines: todaysRoutines,
      reminders: reminderStats,
    };
  }

  // =========================================================================
  // Reminder sync helpers
  // =========================================================================

  async syncTaskReminder(task: TaskWithDetails, userId: number, discordId: string): Promise<void> {
    if (task.reminderEnabled && task.reminderTime) {
      await this.reminderRepository.createOrUpdate({
        userId,
        discordId,
        itemType: 'task',
        itemId: task.id,
        title: task.title,
        reminderTime: task.reminderTime,
        reminderDays: task.reminderDays,
        isActive: task.status !== 'completed' && task.status !== 'cancelled',
      });
    }
  }

  async syncHabitReminder(habit: HabitWithDetails, userId: number, discordId: string): Promise<void> {
    if (habit.reminderEnabled && habit.reminderTime) {
      await this.reminderRepository.createOrUpdate({
        userId,
        discordId,
        itemType: 'habit',
        itemId: habit.id,
        title: habit.title,
        reminderTime: habit.reminderTime,
        reminderDays: habit.reminderDays,
        isActive: habit.status === 'active',
      });
    }
  }

  async syncRoutineItemReminder(item: RoutineItem, routineName: string, userId: number, discordId: string): Promise<void> {
    if (item.reminderEnabled && item.scheduledTime) {
      let reminderTime = item.scheduledTime;
      if (item.reminderOffset !== 0) {
        const timeParts = item.scheduledTime.split(':').map(Number);
        const hours = timeParts[0] ?? 0;
        const minutes = timeParts[1] ?? 0;
        const totalMinutes = hours * 60 + minutes - item.reminderOffset;
        const adjustedHours = Math.floor(totalMinutes / 60) % 24;
        const adjustedMinutes = totalMinutes % 60;
        reminderTime = `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
      }

      await this.reminderRepository.createOrUpdate({
        userId,
        discordId,
        itemType: 'routine_item',
        itemId: item.id,
        title: `${routineName}: ${item.title}`,
        reminderTime,
        isActive: true,
      });
    }
  }

  async deleteItemReminders(itemType: ReminderItemType, itemId: number): Promise<void> {
    await this.reminderRepository.deleteByItem(itemType, itemId);
  }
}
