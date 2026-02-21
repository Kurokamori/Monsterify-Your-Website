// Re-export service types for convenience
export type {
  Mission,
  MissionMonster,
  MissionRequirements,
  MissionRewardConfig,
  UserMission,
  EligibleMonster,
} from '../../../services/missionService';

// ── Difficulty helpers ─────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; icon: string }> = {
  easy: { label: 'Easy', color: 'var(--success-color)', icon: 'fas fa-leaf' },
  medium: { label: 'Medium', color: 'var(--warning-color)', icon: 'fas fa-fire' },
  hard: { label: 'Hard', color: 'var(--error-color)', icon: 'fas fa-skull' },
  extreme: { label: 'Extreme', color: 'var(--legendary-color, #9C27B0)', icon: 'fas fa-bolt' },
};

export const getDifficultyConfig = (difficulty: string) =>
  DIFFICULTY_CONFIG[difficulty as Difficulty] ?? { label: difficulty, color: 'var(--text-color-muted)', icon: 'fas fa-question' };

// ── Parse helpers ──────────────────────────────────────────────────────────

export const parseJson = <T>(value: unknown): T | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return null; }
  }
  return null;
};

export const getProgressPercentage = (current: number, required: number): number =>
  required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
