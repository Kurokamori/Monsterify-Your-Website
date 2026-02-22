// Schedule Component Types

export interface Trainer {
  id: number;
  name: string;
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'extra difficult';
export type TaskStatus = 'pending' | 'completed';
export type RepeatType = '' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  category: string;
  tags: string[];
  steps: string[];
  current_step: number;
  repeat_type: RepeatType;
  repeat_interval: number;
  repeat_days: string[];
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: number | null;
  trainer_name?: string;
  reminder_enabled: number;
  reminder_time: string;
  reminder_days: string[];
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  category: string;
  tags: string[];
  steps: string[];
  repeat_type: RepeatType;
  repeat_interval: number;
  repeat_days: string[];
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: string;
  reminder_enabled: number;
  reminder_time: string;
  reminder_days: string[];
}

// Habit Types
export type HabitFrequency = 'daily' | 'weekly';
export type HabitStatus = 'active' | 'paused';
export type StreakStatus = 'active' | 'at_risk' | 'broken';

export interface Habit {
  id: number;
  user_id: number;
  title: string;
  description: string;
  frequency: HabitFrequency;
  streak: number;
  best_streak: number;
  status: HabitStatus;
  streak_status: StreakStatus;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: number | null;
  trainer_name?: string;
  reminder_enabled: number;
  reminder_time: string;
  reminder_days: string[];
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitFormData {
  title: string;
  description: string;
  frequency: HabitFrequency;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: string;
  reminder_enabled: number;
  reminder_time: string;
  reminder_days: string[];
}

// Routine Types
export type PatternType = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface RoutineItem {
  id?: number;
  routine_id?: number;
  title: string;
  description: string;
  scheduled_time: string;
  order_index: number;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: number | string;
  trainer_name?: string;
  reminder_enabled: number;
  reminder_offset: number;
  completed_today?: boolean;
}

export interface Routine {
  id: number;
  user_id: number;
  name: string;
  description: string;
  pattern_type: PatternType;
  pattern_days: string[];
  is_active: number;
  items: RoutineItem[];
  created_at: string;
  updated_at: string;
}

export interface RoutineFormData {
  name: string;
  description: string;
  pattern_type: PatternType;
  pattern_days: string[];
  is_active: number;
  items: RoutineItem[];
}

export interface NewRoutineItem {
  title: string;
  description: string;
  scheduled_time: string;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: string;
  reminder_enabled: number;
  reminder_offset: number;
}

// Dashboard Types
export interface DashboardData {
  trainers: Trainer[];
  tasks: {
    pending: Task[];
    due: Task[];
  };
  habits: Habit[];
  routines: Routine[];
  reminders: {
    total: number;
    active: number;
    by_type: {
      task?: number;
      habit?: number;
      routine_item?: number;
    };
  };
}

// Common
export const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export type WeekDay = typeof WEEK_DAYS[number];

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
export const DIFFICULTIES: TaskDifficulty[] = ['easy', 'medium', 'hard', 'extra difficult'];
export const REPEAT_TYPES: RepeatType[] = ['', 'daily', 'weekly', 'monthly', 'yearly'];
export const FREQUENCIES: HabitFrequency[] = ['daily', 'weekly'];

export const PATTERN_TYPES: { value: PatternType; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { value: 'weekends', label: 'Weekends', description: 'Saturday and Sunday' },
  { value: 'custom', label: 'Custom Days', description: 'Select specific days' }
];

// Utility function
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
