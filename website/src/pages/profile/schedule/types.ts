import type { GameTask } from '../../../services/gameTaskService';

export type TaskTab = 'daily' | 'weekly';

const REWARD_ICONS: Record<string, string> = {
  coin: 'fas fa-coins',
  exp: 'fas fa-star',
  item: 'fas fa-box',
};

export const getRewardIcon = (type: string): string => {
  return REWARD_ICONS[type] || 'fas fa-gift';
};

export const calculateProgress = (tasks: Pick<GameTask, 'completed'>[]): number => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
};
