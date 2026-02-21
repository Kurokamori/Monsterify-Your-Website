import { Request, Response } from 'express';
import { BossService } from '../../services/boss.service';
import type { BossCreateInput, BossUpdateInput } from '../../repositories';

const bossService = new BossService();

// ============================================================================
// Public Endpoints
// ============================================================================

export async function getCurrentBoss(_req: Request, res: Response): Promise<void> {
  try {
    const boss = await bossService.getCurrentBoss();
    if (!boss) {
      res.status(404).json({ success: false, message: 'No active boss found' });
      return;
    }
    res.json({ success: true, data: boss });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get current boss';
    console.error('Error getting current boss:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getBossById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    const boss = await bossService.getBossById(id);
    if (!boss) {
      res.status(404).json({ success: false, message: 'Boss not found' });
      return;
    }
    res.json({ success: true, data: boss });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get boss';
    console.error('Error getting boss by ID:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getBossLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 10;
    const leaderboard = await bossService.getLeaderboard(id, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get boss leaderboard';
    console.error('Error getting boss leaderboard:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCurrentBossWithLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await bossService.getCurrentBossWithLeaderboard(limit);

    if (!result) {
      res.status(404).json({ success: false, message: 'No active boss found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get current boss with leaderboard';
    console.error('Error getting current boss with leaderboard:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getDefeatedBosses(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const bosses = await bossService.getDefeatedBosses(limit);
    res.json({ success: true, data: bosses });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get defeated bosses';
    console.error('Error getting defeated bosses:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getDefeatedBossById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    const userId = req.user?.id ?? (req.query.userId ? parseInt(req.query.userId as string, 10) : undefined);
    const bossData = await bossService.getDefeatedBossById(id, userId);

    if (!bossData) {
      res.status(404).json({ success: false, message: 'Defeated boss not found' });
      return;
    }
    res.json({ success: true, data: bossData });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get defeated boss';
    console.error('Error getting defeated boss by ID:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Protected Endpoints
// ============================================================================

export async function addBossDamage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    const { userId, damageAmount, submissionId } = req.body as {
      userId?: number;
      damageAmount?: number;
      submissionId?: number;
    };

    if (!userId || !damageAmount) {
      res.status(400).json({ success: false, message: 'User ID and damage amount are required' });
      return;
    }

    const result = await bossService.addDamage(id, userId, damageAmount, submissionId);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add boss damage';
    console.error('Error adding boss damage:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCurrentBossWithRewards(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id ?? (req.query.userId ? parseInt(req.query.userId as string, 10) : undefined);

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const data = await bossService.getCurrentBossWithRewards(userId);
    res.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get current boss with rewards';
    console.error('Error getting current boss with rewards:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getUnclaimedRewards(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id ?? (req.query.userId ? parseInt(req.query.userId as string, 10) : undefined);

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const rewards = await bossService.getUnclaimedRewards(userId);
    res.json({ success: true, data: rewards });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get unclaimed rewards';
    console.error('Error getting unclaimed rewards:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function claimBossReward(req: Request, res: Response): Promise<void> {
  try {
    const bossId = parseInt(req.params.bossId as string, 10);
    if (isNaN(bossId)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    const { userId, monsterName, trainerId } = req.body as {
      userId?: number;
      monsterName?: string;
      trainerId?: number;
    };

    if (!userId || !monsterName || !trainerId) {
      res.status(400).json({
        success: false,
        message: 'User ID, monster name, and trainer ID are required',
      });
      return;
    }

    const result = await bossService.claimReward(bossId, userId, monsterName, trainerId);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to claim boss reward';
    console.error('Error claiming boss reward:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Admin Endpoints
// ============================================================================

export async function getAllBosses(_req: Request, res: Response): Promise<void> {
  try {
    const bosses = await bossService.getAllBossesWithStats();
    res.json({ success: true, data: bosses });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get bosses';
    console.error('Error getting all bosses:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createBoss(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      description,
      image_url,
      total_hp,
      month,
      year,
      reward_monster_data,
      grunt_monster_data,
    } = req.body as {
      name?: string;
      description?: string;
      image_url?: string;
      total_hp?: number;
      month?: number;
      year?: number;
      reward_monster_data?: Record<string, unknown>;
      grunt_monster_data?: Record<string, unknown>;
    };

    if (!name || !total_hp || !month || !year) {
      res.status(400).json({
        success: false,
        message: 'Name, total HP, month, and year are required',
      });
      return;
    }

    const input: BossCreateInput = {
      name,
      description: description ?? null,
      imageUrl: image_url ?? null,
      totalHp: total_hp,
      month,
      year,
      rewardMonsterData: reward_monster_data ?? null,
      gruntMonsterData: grunt_monster_data ?? null,
    };

    const boss = await bossService.createBoss(input);
    res.json({ success: true, message: 'Boss created successfully', data: boss });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create boss';
    console.error('Error creating boss:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateBoss(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    const {
      name,
      description,
      image_url,
      total_hp,
      current_hp,
      month,
      year,
      status,
      reward_monster_data,
      grunt_monster_data,
    } = req.body as {
      name?: string;
      description?: string;
      image_url?: string;
      total_hp?: number;
      current_hp?: number;
      month?: number;
      year?: number;
      status?: string;
      reward_monster_data?: Record<string, unknown>;
      grunt_monster_data?: Record<string, unknown>;
    };

    const input: BossUpdateInput = {
      name,
      description,
      imageUrl: image_url,
      totalHp: total_hp,
      currentHp: current_hp,
      month,
      year,
      status,
      rewardMonsterData: reward_monster_data,
      gruntMonsterData: grunt_monster_data,
    };

    const boss = await bossService.updateBoss(id, input);
    res.json({ success: true, message: 'Boss updated successfully', data: boss });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update boss';
    console.error('Error updating boss:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteBoss(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid boss ID' });
      return;
    }

    await bossService.deleteBoss(id);
    res.json({ success: true, message: 'Boss deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete boss';
    console.error('Error deleting boss:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
