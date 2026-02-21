import { Request, Response } from 'express';
import { MissionService } from '../../services/mission.service';
import type { MissionQueryOptions, MissionCreateInput, MissionUpdateInput, UserMissionUpdateInput } from '../../repositories';

const missionService = new MissionService();

// ============================================================================
// Public Endpoints
// ============================================================================

export async function getAllMissions(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '10',
      difficulty,
      status = 'active',
    } = req.query as {
      page?: string;
      limit?: string;
      difficulty?: string;
      status?: string;
    };

    const options: MissionQueryOptions = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      difficulty,
      status: status === 'all' ? undefined : status,
    };

    const result = await missionService.getAllMissions(options);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get missions';
    console.error('Error getting missions:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getMissionById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid mission ID' });
      return;
    }

    const mission = await missionService.getMissionById(id);
    if (!mission) {
      res.status(404).json({ success: false, message: 'Mission not found' });
      return;
    }

    res.json({ success: true, data: mission });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get mission';
    console.error('Error getting mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Protected Endpoints
// ============================================================================

export async function getAvailableMissions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id ?? (req.params.userId as string | undefined);

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await missionService.getAvailableMissions(userId);

    res.json({
      success: true,
      data: result.availableMissions,
      hasActiveMission: result.hasActiveMission,
      activeMissions: result.activeMissions,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get available missions';
    console.error('Error getting available missions:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getActiveMissions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id ?? (req.params.userId as string | undefined);

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const missions = await missionService.getActiveMissions(userId);
    res.json({ success: true, data: missions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get active missions';
    console.error('Error getting active missions:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getEligibleMonsters(req: Request, res: Response): Promise<void> {
  try {
    const missionId = parseInt(req.params.missionId as string, 10);
    if (isNaN(missionId)) {
      res.status(400).json({ success: false, message: 'Invalid mission ID' });
      return;
    }

    const userId = req.user?.discord_id ?? (req.query.userId as string | undefined);
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const monsters = await missionService.getEligibleMonsters(userId, missionId);
    res.json({ success: true, data: monsters });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get eligible monsters';
    console.error('Error getting eligible monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function startMission(req: Request, res: Response): Promise<void> {
  try {
    const missionId = parseInt(req.params.missionId as string, 10);
    if (isNaN(missionId)) {
      res.status(400).json({ success: false, message: 'Invalid mission ID' });
      return;
    }

    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User authentication required' });
      return;
    }

    const { monsterIds = [] } = req.body as { monsterIds?: number[] };
    const result = await missionService.startMission(userId, missionId, monsterIds);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to start mission';
    console.error('Error starting mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function claimMissionRewards(req: Request, res: Response): Promise<void> {
  try {
    const missionId = parseInt(req.params.missionId as string, 10);
    if (isNaN(missionId)) {
      res.status(400).json({ success: false, message: 'Invalid mission ID' });
      return;
    }

    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User authentication required' });
      return;
    }

    const result = await missionService.claimRewards(missionId, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to claim mission rewards';
    console.error('Error claiming mission rewards:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Admin Endpoints
// ============================================================================

export async function createMission(req: Request, res: Response): Promise<void> {
  try {
    const missionData = req.body as MissionCreateInput;
    const mission = await missionService.createMission(missionData);

    res.status(201).json({
      success: true,
      data: mission,
      message: 'Mission created successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create mission';
    console.error('Error creating mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateMission(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid mission ID' });
      return;
    }

    const missionData = req.body as MissionUpdateInput;
    const mission = await missionService.updateMission(id, missionData);

    res.json({
      success: true,
      data: mission,
      message: 'Mission updated successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update mission';
    console.error('Error updating mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteMission(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid mission ID' });
      return;
    }

    const deleted = await missionService.deleteMission(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Mission not found' });
      return;
    }

    res.json({ success: true, message: 'Mission deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete mission';
    console.error('Error deleting mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getDifficulties(_req: Request, res: Response): Promise<void> {
  try {
    const difficulties = await missionService.getDifficulties();
    res.json({ success: true, data: difficulties });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get difficulties';
    console.error('Error getting difficulties:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Admin – User Mission Endpoints
// ============================================================================

export async function adminGetUserMissions(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      status,
      missionId,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string | undefined>;

    const result = await missionService.adminGetUserMissions({
      page: parseInt(page ?? '1', 10),
      limit: parseInt(limit ?? '20', 10),
      search: search ?? undefined,
      status: status ?? undefined,
      missionId: missionId ? parseInt(missionId, 10) : undefined,
      sortBy: sortBy ?? undefined,
      sortOrder: (sortOrder as 'asc' | 'desc') ?? undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get user missions';
    console.error('Error getting user missions:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminUpdateUserMission(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid user mission ID' });
      return;
    }

    const data = req.body as UserMissionUpdateInput;
    const mission = await missionService.adminUpdateUserMission(id, data);

    res.json({ success: true, data: mission, message: 'User mission updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update user mission';
    console.error('Error updating user mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminCompleteMission(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid user mission ID' });
      return;
    }

    const mission = await missionService.adminCompleteMission(id);
    res.json({ success: true, data: mission, message: 'Mission completed successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to complete mission';
    console.error('Error completing mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminDeleteUserMission(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid user mission ID' });
      return;
    }

    const deleted = await missionService.adminDeleteUserMission(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'User mission not found' });
      return;
    }

    res.json({ success: true, message: 'User mission deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete user mission';
    console.error('Error deleting user mission:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
