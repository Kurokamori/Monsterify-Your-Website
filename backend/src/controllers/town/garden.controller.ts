import { Request, Response } from 'express';
import { GardenService } from '../../services/garden.service';
import { GardenPointRepository } from '../../repositories/garden-point.repository';

const gardenService = new GardenService();
const gardenPointRepository = new GardenPointRepository();

// =============================================================================
// Get Garden Points
// =============================================================================

export async function getGardenPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const data = await gardenService.getGardenPoints(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting garden points:', error);
    const msg = error instanceof Error ? error.message : 'Error getting garden points';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Harvest Garden
// =============================================================================

export async function harvestGarden(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const discordId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await gardenService.harvestGarden(userId, discordId ?? userId.toString());

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      session_id: result.sessionId,
      session: result.session,
      rewards: result.rewards,
    });
  } catch (error) {
    console.error('Error harvesting garden:', error);
    const msg = error instanceof Error ? error.message : 'Error harvesting garden';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Harvest Session
// =============================================================================

export async function getHarvestSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const session = await gardenService.getHarvestSession(sessionId, userId);

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.json({ success: true, session, rewards: session.rewards });
  } catch (error) {
    console.error('Error getting harvest session:', error);
    const msg = error instanceof Error ? error.message : 'Error getting harvest session';
    if (msg === 'Unauthorized') {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Active Session (for resuming)
// =============================================================================

export async function getActiveSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const session = await gardenService.getActiveSession(userId);

    if (!session) {
      res.json({ success: true, hasActiveSession: false });
      return;
    }

    res.json({
      success: true,
      hasActiveSession: true,
      sessionId: session.id,
      session,
      rewards: session.rewards,
    });
  } catch (error) {
    console.error('Error getting active session:', error);
    const msg = error instanceof Error ? error.message : 'Error getting active session';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Claim Reward
// =============================================================================

export async function claimReward(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, rewardId, trainerId, monsterName, ball } = req.body as {
      sessionId?: string;
      rewardId?: string;
      trainerId?: number;
      monsterName?: string;
      ball?: string;
    };
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!sessionId || !rewardId || !trainerId) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    const result = await gardenService.claimReward(sessionId, rewardId, trainerId, userId, monsterName, ball);

    res.json({
      success: true,
      message: 'Reward claimed successfully',
      reward: result.reward,
      claimResult: result.claimResult,
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    const msg = error instanceof Error ? error.message : 'Error claiming reward';
    if (msg === 'Session not found' || msg === 'Reward not found' || msg === 'Trainer not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Unauthorized') {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Reward already claimed') {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Forfeit Monster
// =============================================================================

export async function forfeitMonster(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, rewardId, monsterName } = req.body as {
      sessionId?: string;
      rewardId?: string;
      monsterName?: string;
    };
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!sessionId || !rewardId) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    const result = await gardenService.forfeitMonster(sessionId, rewardId, userId, monsterName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Monster successfully forfeited to the Bazar!',
        bazarMonsterId: result.bazarMonsterId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message ?? 'Failed to forfeit monster to bazar',
      });
    }
  } catch (error) {
    console.error('Error forfeiting garden monster:', error);
    const msg = error instanceof Error ? error.message : 'Error forfeiting monster to bazar';
    if (msg === 'Session not found' || msg === 'Reward not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Unauthorized') {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Reward already claimed' || msg === 'Only monster rewards can be forfeited') {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Bulk Claim Rewards
// =============================================================================

export async function claimBulk(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { sessionId, claims } = req.body as {
      sessionId?: string;
      claims?: { rewardId: string; trainerId: number; monsterName?: string; ball?: string }[];
    };

    if (!sessionId || !claims || !Array.isArray(claims) || claims.length === 0) {
      res.status(400).json({ success: false, message: 'Missing sessionId or claims array' });
      return;
    }

    const result = await gardenService.claimBulk(sessionId, claims, userId);

    const claimedCount = result.results.filter(r => r.success).length;
    const failedCount = result.results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Claimed ${claimedCount} reward(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      results: result.results,
    });
  } catch (error) {
    console.error('Error bulk claiming rewards:', error);
    const msg = error instanceof Error ? error.message : 'Error bulk claiming rewards';
    if (msg === 'Session not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Unauthorized') {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Bulk Forfeit Monsters
// =============================================================================

export async function forfeitBulk(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { sessionId, forfeits } = req.body as {
      sessionId?: string;
      forfeits?: { rewardId: string; monsterName?: string }[];
    };

    if (!sessionId || !forfeits || !Array.isArray(forfeits) || forfeits.length === 0) {
      res.status(400).json({ success: false, message: 'Missing sessionId or forfeits array' });
      return;
    }

    const result = await gardenService.forfeitBulk(sessionId, forfeits, userId);

    const forfeitedCount = result.results.filter(r => r.success).length;
    const failedCount = result.results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Forfeited ${forfeitedCount} monster(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      results: result.results,
    });
  } catch (error) {
    console.error('Error bulk forfeiting monsters:', error);
    const msg = error instanceof Error ? error.message : 'Error bulk forfeiting monsters';
    if (msg === 'Session not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Unauthorized') {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Get All Garden Points
// =============================================================================

export async function adminGetAllGardenPoints(req: Request, res: Response): Promise<void> {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query as {
      search?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const result = await gardenPointRepository.getAllWithUsers({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting all garden points:', error);
    const msg = error instanceof Error ? error.message : 'Error getting garden points';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Update Garden Points (set to specific value)
// =============================================================================

export async function adminUpdateGardenPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    const { points } = req.body as { points?: number };

    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }
    if (points === undefined || typeof points !== 'number') {
      res.status(400).json({ success: false, message: 'Points value is required' });
      return;
    }

    const result = await gardenPointRepository.setPoints(userId, Math.max(0, points));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating garden points:', error);
    const msg = error instanceof Error ? error.message : 'Error updating garden points';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Adjust Garden Points (add/subtract delta)
// =============================================================================

export async function adminAdjustGardenPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    const { amount } = req.body as { amount?: number };

    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }
    if (amount === undefined || typeof amount !== 'number') {
      res.status(400).json({ success: false, message: 'Amount is required' });
      return;
    }

    const current = await gardenPointRepository.findByUserId(userId);
    const currentPoints = current?.points ?? 0;
    const newPoints = Math.max(0, currentPoints + amount);
    const result = await gardenPointRepository.setPoints(userId, newPoints);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adjusting garden points:', error);
    const msg = error instanceof Error ? error.message : 'Error adjusting garden points';
    res.status(500).json({ success: false, message: msg });
  }
}
