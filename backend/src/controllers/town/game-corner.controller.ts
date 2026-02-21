import { Request, Response } from 'express';
import { GameCornerService, type RewardType } from '../../services/game-corner.service';
import { TrainerRepository } from '../../repositories';

type MonsterRewardData = Record<string, unknown>;

const gameCornerService = new GameCornerService();
const trainerRepository = new TrainerRepository();

// =============================================================================
// Generate Rewards
// =============================================================================

export async function generateGameCornerRewards(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user?.discord_id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { completedSessions, totalFocusMinutes, productivityScore, forceMonsterRoll } = req.body as {
      completedSessions?: number;
      totalFocusMinutes?: number;
      productivityScore?: number;
      forceMonsterRoll?: boolean;
    };

    if (
      completedSessions === undefined ||
      totalFocusMinutes === undefined ||
      productivityScore === undefined
    ) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: completedSessions, totalFocusMinutes, productivityScore',
      });
      return;
    }

    const result = await gameCornerService.generateRewards(
      {
        completedSessions,
        totalFocusMinutes,
        productivityScore,
        forceMonsterRoll: forceMonsterRoll ?? false,
      },
      user.discord_id,
      user,
    );

    res.json({
      success: true,
      sessionId: result.sessionId,
      rewards: result.rewards,
      trainers: result.trainers,
      stats: result.stats,
    });
  } catch (error) {
    console.error('Error generating Game Corner rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to generate rewards' });
  }
}

// =============================================================================
// Claim Reward
// =============================================================================

export async function claimGameCornerReward(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user?.discord_id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { rewardId, trainerId, rewardData } = req.body as {
      rewardId?: string;
      trainerId?: number;
      rewardData?: {
        type: RewardType;
        reward_data: Record<string, unknown>;
      };
    };

    if (!rewardId || !trainerId || !rewardData) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: rewardId, trainerId, rewardData',
      });
      return;
    }

    // Verify the trainer belongs to the user
    const trainer = await trainerRepository.findById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    if (trainer.player_user_id !== user.discord_id) {
      res.status(403).json({ success: false, message: 'Not authorized to assign rewards to this trainer' });
      return;
    }

    await gameCornerService.claimReward(
      trainerId,
      rewardData.type,
      rewardData.reward_data as Parameters<GameCornerService['claimReward']>[2],
      user.discord_id,
    );

    res.json({
      success: true,
      message: 'Reward claimed successfully',
      reward: {
        ...rewardData,
        claimed: true,
        claimed_by: trainerId,
        claimed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error claiming Game Corner reward:', error);
    res.status(500).json({ success: false, message: 'Failed to claim reward' });
  }
}

// =============================================================================
// Forfeit Monster Reward (send to bazar)
// =============================================================================

export async function forfeitGameCornerReward(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user?.discord_id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { rewardData, monsterName } = req.body as {
      rewardData?: { reward_data: MonsterRewardData };
      monsterName?: string;
    };

    if (!rewardData?.reward_data) {
      res.status(400).json({
        success: false,
        message: 'Missing required field: rewardData with reward_data',
      });
      return;
    }

    const result = await gameCornerService.forfeitMonsterReward(
      rewardData.reward_data as Parameters<GameCornerService['forfeitMonsterReward']>[0],
      user.discord_id,
      monsterName,
    );

    res.json({
      success: true,
      message: 'Monster successfully forfeited to the Bazar!',
      bazarMonsterId: result.bazarMonsterId,
    });
  } catch (error) {
    console.error('Error forfeiting Game Corner reward:', error);
    res.status(500).json({ success: false, message: 'Failed to forfeit monster to bazar' });
  }
}
