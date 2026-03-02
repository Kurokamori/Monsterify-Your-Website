import { post, del, type BaseResponse } from './api-client.js';
import { withAuth } from './api-client.js';

// ============================================================================
// Response shapes
// ============================================================================

interface CompleteTaskResponse extends BaseResponse {
  data?: {
    task: { id: number; title: string; status: string };
    rewards?: { levels: number; coins: number; trainerName: string };
  };
}

interface TrackHabitResponse extends BaseResponse {
  data?: {
    habit: { id: number; title: string; streak: number; best_streak: number };
    streakChange: number;
    rewards?: { levels: number; coins: number; trainerName: string };
  };
}

interface CompleteRoutineItemResponse extends BaseResponse {
  data?: {
    success: boolean;
    item: { id: number; title: string };
    rewards?: { levels: number; coins: number; trainerName: string };
  };
}

// ============================================================================
// Service methods
// ============================================================================

/**
 * Complete a task on behalf of a user (via Discord ID auth).
 */
export async function completeTask(
  discordId: string,
  taskId: number,
): Promise<CompleteTaskResponse> {
  return post<CompleteTaskResponse>(
    `/schedule/tasks/${taskId}/complete`,
    {},
    withAuth(discordId),
  );
}

/**
 * Track a habit (increment streak) on behalf of a user.
 */
export async function trackHabit(
  discordId: string,
  habitId: number,
): Promise<TrackHabitResponse> {
  return post<TrackHabitResponse>(
    `/schedule/habits/${habitId}/track`,
    {},
    withAuth(discordId),
  );
}

/**
 * Complete a routine item on behalf of a user.
 */
export async function completeRoutineItem(
  discordId: string,
  itemId: number,
): Promise<CompleteRoutineItemResponse> {
  return post<CompleteRoutineItemResponse>(
    `/schedule/routines/items/${itemId}/complete`,
    {},
    withAuth(discordId),
  );
}

/**
 * Delete a task on behalf of a user.
 */
export async function deleteTask(
  discordId: string,
  taskId: number,
): Promise<BaseResponse> {
  return del<BaseResponse>(
    `/schedule/tasks/${taskId}`,
    withAuth(discordId),
  );
}

/**
 * Delete a habit on behalf of a user.
 */
export async function deleteHabit(
  discordId: string,
  habitId: number,
): Promise<BaseResponse> {
  return del<BaseResponse>(
    `/schedule/habits/${habitId}`,
    withAuth(discordId),
  );
}

/**
 * Delete a routine item on behalf of a user.
 */
export async function deleteRoutineItem(
  discordId: string,
  itemId: number,
): Promise<BaseResponse> {
  return del<BaseResponse>(
    `/schedule/routines/items/${itemId}`,
    withAuth(discordId),
  );
}
