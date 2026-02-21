import { Request, Response } from 'express';
import { StatisticsService } from '../../services/statistics.service';

const statisticsService = new StatisticsService();

// =============================================================================
// Overall Stats
// =============================================================================

export async function getOverallStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statisticsService.getOverallStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting overall statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get overall statistics' });
  }
}

// =============================================================================
// Monster Stats
// =============================================================================

export async function getMonsterStats(req: Request, res: Response): Promise<void> {
  try {
    const type = (req.query.type as string) || 'all';
    const sort = (req.query.sort as string) || 'level';
    const order = (req.query.order as string) || 'desc';

    const stats = await statisticsService.getMonsterStats(type, sort, order);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting monster statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get monster statistics' });
  }
}

// =============================================================================
// Trainer Stats
// =============================================================================

export async function getTrainerStats(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const stats = await statisticsService.getTrainerStats(trainerId);
    if (!stats) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting trainer statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer statistics' });
  }
}

// =============================================================================
// Trainer Comparison Stats
// =============================================================================

export async function getTrainerComparisonStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statisticsService.getTrainerComparisonStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting trainer comparison statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer comparison statistics' });
  }
}

// =============================================================================
// Leaderboard Stats
// =============================================================================

export async function getLeaderboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statisticsService.getLeaderboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting leaderboard statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard statistics' });
  }
}

// =============================================================================
// Player Leaderboard Stats
// =============================================================================

export async function getPlayerLeaderboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statisticsService.getPlayerLeaderboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting player leaderboard statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get player leaderboard statistics' });
  }
}

// =============================================================================
// Achievement Stats
// =============================================================================

export async function getAchievementStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statisticsService.getAchievementStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting achievement statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get achievement statistics' });
  }
}

// =============================================================================
// Admin Dashboard Stats
// =============================================================================

export async function getAdminDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statisticsService.getAdminDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting admin dashboard statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin dashboard statistics' });
  }
}
