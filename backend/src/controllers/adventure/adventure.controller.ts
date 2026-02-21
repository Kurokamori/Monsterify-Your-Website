import { Request, Response } from 'express';
import { AdventureService } from '../../services/adventure.service';
import type { AdminAdventureQueryOptions } from '../../services/adventure.service';
import type { AdventureQueryOptions, AdventureUpdateInput, AdventureStatus } from '../../repositories';

const adventureService = new AdventureService();

// =============================================================================
// Read Endpoints
// =============================================================================

export async function getAllAdventures(req: Request, res: Response): Promise<void> {
  try {
    const options: AdventureQueryOptions = {
      status: (req.query.status as AdventureQueryOptions['status']) ?? null,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as AdventureQueryOptions['sort']) ?? 'newest',
    };

    const result = await adventureService.getAllAdventures(options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting adventures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get adventures',
    });
  }
}

export async function getAdventureById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const adventure = await adventureService.getAdventureById(id);
    if (!adventure) {
      res.status(404).json({ success: false, message: 'Adventure not found' });
      return;
    }

    res.json({ success: true, adventure });
  } catch (error) {
    console.error('Error getting adventure:', error);
    res.status(500).json({ success: false, message: 'Failed to get adventure' });
  }
}

export async function getTrainerAdventures(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt((req.params.trainerId ?? req.params.id) as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const options: AdventureQueryOptions = {
      status: (req.query.status as AdventureQueryOptions['status']) ?? null,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as AdventureQueryOptions['sort']) ?? 'newest',
    };

    const result = await adventureService.getTrainerAdventures(trainerId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting trainer adventures:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer adventures' });
  }
}

// =============================================================================
// Regions
// =============================================================================

export async function getAvailableRegions(_req: Request, res: Response): Promise<void> {
  try {
    const regionInfo = await adventureService.getAvailableRegions();

    res.json({
      success: true,
      ...regionInfo,
    });
  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({ success: false, message: 'Failed to get regions' });
  }
}

// =============================================================================
// Create Adventure
// =============================================================================

export async function createAdventure(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      title,
      description,
      threadEmoji,
      adventureType,
      region,
      area,
      landmass,
      selectedTrainer,
    } = req.body as {
      title?: string;
      description?: string;
      threadEmoji?: string;
      adventureType?: 'prebuilt' | 'custom';
      region?: string;
      area?: string;
      landmass?: string;
      selectedTrainer?: string;
    };

    const result = await adventureService.createAdventure({
      creatorId: req.user.id,
      title: title ?? '',
      description,
      threadEmoji,
      adventureType,
      region,
      area,
      landmass,
      selectedTrainer,
      discordUserId: req.user.discord_id ?? undefined,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating adventure:', error);
    res.status(500).json({ success: false, message: 'Failed to create adventure' });
  }
}

// =============================================================================
// Update Adventure
// =============================================================================

export async function updateAdventure(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const updateData = req.body as AdventureUpdateInput;
    const result = await adventureService.updateAdventure(
      id,
      req.user.id,
      req.user.is_admin ?? false,
      updateData,
    );

    if (!result.success) {
      const statusCode = result.message === 'Adventure not found' ? 404 : 403;
      res.status(statusCode).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating adventure:', error);
    res.status(500).json({ success: false, message: 'Failed to update adventure' });
  }
}

// =============================================================================
// Delete Adventure
// =============================================================================

export async function deleteAdventure(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const result = await adventureService.deleteAdventure(
      id,
      req.user.id,
      req.user.is_admin ?? false,
    );

    if (!result.success) {
      const statusCode = result.message === 'Adventure not found' ? 404 : 403;
      res.status(statusCode).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting adventure:', error);
    res.status(500).json({ success: false, message: 'Failed to delete adventure' });
  }
}

// =============================================================================
// Complete Adventure
// =============================================================================

export async function completeAdventure(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const result = await adventureService.completeAdventure(
      id,
      req.user.id,
      req.user.is_admin ?? false,
    );

    if (!result.success) {
      const statusCode = result.message === 'Adventure not found' ? 404 : 403;
      res.status(statusCode).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing adventure:', error);
    res.status(500).json({ success: false, message: 'Failed to complete adventure' });
  }
}

// =============================================================================
// Claim Rewards
// =============================================================================

export async function claimRewards(req: Request, res: Response): Promise<void> {
  try {
    const {
      adventureLogId,
      userId,
      levelAllocations,
      coinAllocations,
      itemAllocations,
    } = req.body as {
      adventureLogId?: number;
      userId?: number;
      levelAllocations?: { entityType: 'trainer' | 'monster'; entityId: number; levels: number }[];
      coinAllocations?: { trainerId: number; coins: number }[];
      itemAllocations?: { trainerId: number; item: string }[];
    };

    if (!adventureLogId || !userId) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    const result = await adventureService.claimRewards({
      adventureLogId,
      userId,
      levelAllocations,
      coinAllocations,
      itemAllocations,
    });

    if (!result.success) {
      const statusCode =
        result.message === 'Adventure log not found' ? 404 :
        result.message === 'You can only claim your own rewards' ? 403 :
        400;
      res.status(statusCode).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to claim rewards' });
  }
}

// =============================================================================
// Admin Endpoints
// =============================================================================

export async function adminGetAllAdventures(req: Request, res: Response): Promise<void> {
  try {
    const options: AdminAdventureQueryOptions = {
      status: (req.query.status as AdventureStatus) || null,
      search: (req.query.search as string) || null,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await adventureService.adminGetAllAdventures(options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting admin adventures:', error);
    res.status(500).json({ success: false, message: 'Failed to get adventures' });
  }
}

export async function adminGetParticipants(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const participants = await adventureService.adminGetParticipants(id);

    res.json({ success: true, participants });
  } catch (error) {
    console.error('Error getting adventure participants:', error);
    res.status(500).json({ success: false, message: 'Failed to get participants' });
  }
}

export async function adminSendMessage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const { message } = req.body as { message?: string };
    if (!message?.trim()) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const result = await adventureService.adminSendMessage(id, message.trim());

    if (!result.success) {
      const statusCode = result.message === 'Adventure not found' ? 404 : 400;
      res.status(statusCode).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}
