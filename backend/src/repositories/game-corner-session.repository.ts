import { db } from '../database';

// =============================================================================
// Types
// =============================================================================

export type GameCornerSessionRow = {
  id: number;
  user_id: string;
  session_length: number;
  break_length: number;
  long_break_length: number;
  session_count: number;
  completed_sessions: number;
  total_focus_minutes: number;
  current_session: number;
  is_break: boolean;
  timer_active: boolean;
  time_remaining: number;
  timer_end_time: string | null; // bigint comes as string from pg
  total_timer_duration: number;
  created_at: Date;
  updated_at: Date;
};

export type GameCornerSession = {
  id: number;
  userId: string;
  sessionLength: number;
  breakLength: number;
  longBreakLength: number;
  sessionCount: number;
  completedSessions: number;
  totalFocusMinutes: number;
  currentSession: number;
  isBreak: boolean;
  timerActive: boolean;
  timeRemaining: number;
  timerEndTime: number | null;
  totalTimerDuration: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GameCornerSessionUpsertInput = {
  sessionLength: number;
  breakLength: number;
  longBreakLength: number;
  sessionCount: number;
  completedSessions: number;
  totalFocusMinutes: number;
  currentSession: number;
  isBreak: boolean;
  timerActive: boolean;
  timeRemaining: number;
  timerEndTime: number | null;
  totalTimerDuration: number;
};

// =============================================================================
// Normalizer
// =============================================================================

function normalize(row: GameCornerSessionRow): GameCornerSession {
  return {
    id: row.id,
    userId: row.user_id,
    sessionLength: row.session_length,
    breakLength: row.break_length,
    longBreakLength: row.long_break_length,
    sessionCount: row.session_count,
    completedSessions: row.completed_sessions,
    totalFocusMinutes: row.total_focus_minutes,
    currentSession: row.current_session,
    isBreak: row.is_break,
    timerActive: row.timer_active,
    timeRemaining: row.time_remaining,
    timerEndTime: row.timer_end_time ? Number(row.timer_end_time) : null,
    totalTimerDuration: row.total_timer_duration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Repository
// =============================================================================

export class GameCornerSessionRepository {
  async findByUserId(userId: string): Promise<GameCornerSession | null> {
    const row = await db.maybeOne<GameCornerSessionRow>(
      'SELECT * FROM game_corner_sessions WHERE user_id = $1',
      [userId],
    );
    return row ? normalize(row) : null;
  }

  async upsert(userId: string, input: GameCornerSessionUpsertInput): Promise<GameCornerSession> {
    const row = await db.one<GameCornerSessionRow>(
      `INSERT INTO game_corner_sessions (
        user_id, session_length, break_length, long_break_length, session_count,
        completed_sessions, total_focus_minutes, current_session, is_break,
        timer_active, time_remaining, timer_end_time, total_timer_duration,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        session_length = $2,
        break_length = $3,
        long_break_length = $4,
        session_count = $5,
        completed_sessions = $6,
        total_focus_minutes = $7,
        current_session = $8,
        is_break = $9,
        timer_active = $10,
        time_remaining = $11,
        timer_end_time = $12,
        total_timer_duration = $13,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        input.sessionLength,
        input.breakLength,
        input.longBreakLength,
        input.sessionCount,
        input.completedSessions,
        input.totalFocusMinutes,
        input.currentSession,
        input.isBreak,
        input.timerActive,
        input.timeRemaining,
        input.timerEndTime,
        input.totalTimerDuration,
      ],
    );
    return normalize(row);
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM game_corner_sessions WHERE user_id = $1',
      [userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
