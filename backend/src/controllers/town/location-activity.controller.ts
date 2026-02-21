import { Request, Response } from 'express';
import { LocationActivityService } from '../../services/location-activity.service';
import { LocationActivityAdminService } from '../../services/location-activity-admin.service';

const service = new LocationActivityService();
const adminService = new LocationActivityAdminService();

// =============================================================================
// Start Activity
// =============================================================================

export async function startActivity(req: Request, res: Response): Promise<void> {
  try {
    const { location, activity } = req.body;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!location || !activity) {
      res.status(400).json({ success: false, message: 'Location and activity are required' });
      return;
    }

    const result = await service.startActivity(userId, location, activity);

    res.json({
      success: true,
      session_id: result.session_id,
      redirect: result.redirect,
    });
  } catch (error) {
    console.error('Error starting location activity:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start activity',
    });
  }
}

// =============================================================================
// Get Session
// =============================================================================

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    const result = await service.getSession(sessionId, userId);

    res.json({
      success: true,
      session: result.session,
      prompt: result.prompt,
      flavor: result.flavor,
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    const message = error instanceof Error ? error.message : 'Failed to get session details';
    const status = message === 'Session not found' ? 404 : message.includes('Not authorized') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
}

// =============================================================================
// Complete Activity
// =============================================================================

export async function completeActivity(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.discord_id;

    if (!userId || !req.user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    const result = await service.completeActivity(sessionId, userId, req.user);

    res.json({
      success: true,
      session: result.session,
      rewards: result.rewards,
    });
  } catch (error) {
    console.error('Error completing activity:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete activity';
    const status = message === 'Session not found' ? 404
      : message.includes('Not authorized') ? 403
      : message === 'Session already completed' ? 400
      : 500;
    res.status(status).json({ success: false, message });
  }
}

// =============================================================================
// Claim Reward
// =============================================================================

export async function claimReward(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, rewardId, trainerId, monsterName } = req.body;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!sessionId || !rewardId || !trainerId) {
      res.status(400).json({
        success: false,
        message: 'Session ID, reward ID, and trainer ID are required',
      });
      return;
    }

    const result = await service.claimReward(sessionId, rewardId, trainerId, userId, monsterName);

    res.json({
      success: true,
      reward: result.reward,
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    const message = error instanceof Error ? error.message : 'Failed to claim reward';
    const status = message === 'Session not found' || message === 'Reward not found' ? 404
      : message.includes('Not authorized') ? 403
      : message === 'Reward already claimed' || message.includes('Cannot claim') ? 400
      : 500;
    res.status(status).json({ success: false, message });
  }
}

// =============================================================================
// Forfeit Reward (send monster to bazar)
// =============================================================================

export async function forfeitReward(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, rewardId, monsterName } = req.body;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!sessionId || !rewardId) {
      res.status(400).json({
        success: false,
        message: 'Session ID and reward ID are required',
      });
      return;
    }

    const result = await service.forfeitReward(sessionId, rewardId, userId, monsterName);

    res.json({
      success: true,
      message: 'Monster successfully forfeited to the Bazar!',
      bazarMonsterId: result.bazarMonsterId,
    });
  } catch (error) {
    console.error('Error forfeiting reward:', error);
    const message = error instanceof Error ? error.message : 'Failed to forfeit reward';
    const status = message === 'Session not found' || message === 'Reward not found' ? 404
      : message.includes('Not authorized') ? 403
      : message === 'Reward already claimed' || message.includes('Only monster') || message.includes('Cannot forfeit') ? 400
      : 500;
    res.status(status).json({ success: false, message });
  }
}

// =============================================================================
// Clear Session
// =============================================================================

export async function clearSession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    await service.clearSession(sessionId, userId);

    res.json({
      success: true,
      message: 'Session cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing session:', error);
    const message = error instanceof Error ? error.message : 'Failed to clear session';
    const status = message === 'Session not found' ? 404 : message.includes('Not authorized') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
}

// =============================================================================
// Get Location Status
// =============================================================================

export async function getLocationStatus(req: Request, res: Response): Promise<void> {
  try {
    const location = req.params.location as string;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!location) {
      res.status(400).json({ success: false, message: 'Location is required' });
      return;
    }

    const result = await service.getLocationStatus(userId, location);

    res.json({
      success: true,
      active_session: result.active_session,
    });
  } catch (error) {
    console.error('Error getting location status:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get location status',
    });
  }
}

// =============================================================================
// Admin: Session Management
// =============================================================================

export async function getAllSessions(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminService.getAllSessions(page, limit);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting all sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions',
    });
  }
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    const session = await adminService.getSessionById(sessionId);

    res.json({ success: true, session });
  } catch (error) {
    console.error('Error getting session:', error);
    const message = error instanceof Error ? error.message : 'Failed to get session';
    res.status(message === 'Session not found' ? 404 : 500).json({ success: false, message });
  }
}

export async function forceCompleteSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    const session = await adminService.forceCompleteSession(sessionId);

    res.json({ success: true, session });
  } catch (error) {
    console.error('Error force-completing session:', error);
    const message = error instanceof Error ? error.message : 'Failed to force-complete session';
    const status = message === 'Session not found' ? 404 : message === 'Session already completed' ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    await adminService.deleteSession(sessionId);

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete session';
    res.status(message === 'Session not found' ? 404 : 500).json({ success: false, message });
  }
}

// =============================================================================
// Admin: Prompt CRUD
// =============================================================================

export async function getPrompts(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminService.getPrompts(page, limit);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting prompts:', error);
    res.status(500).json({ success: false, message: 'Failed to get prompts' });
  }
}

export async function getPromptById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid prompt ID' });
      return;
    }

    const prompt = await adminService.getPromptById(id);

    res.json({ success: true, prompt });
  } catch (error) {
    console.error('Error getting prompt:', error);
    const message = error instanceof Error ? error.message : 'Failed to get prompt';
    res.status(message === 'Prompt not found' ? 404 : 500).json({ success: false, message });
  }
}

export async function createPrompt(req: Request, res: Response): Promise<void> {
  try {
    const { location, activity, prompt_text, difficulty } = req.body;

    if (!location || !activity || !prompt_text) {
      res.status(400).json({
        success: false,
        message: 'Location, activity, and prompt_text are required',
      });
      return;
    }

    const prompt = await adminService.createPrompt({ location, activity, prompt_text, difficulty });

    res.status(201).json({ success: true, prompt });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ success: false, message: 'Failed to create prompt' });
  }
}

export async function updatePrompt(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid prompt ID' });
      return;
    }

    const { prompt_text, difficulty } = req.body;

    const prompt = await adminService.updatePrompt(id, { prompt_text, difficulty });

    res.json({ success: true, prompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    const message = error instanceof Error ? error.message : 'Failed to update prompt';
    res.status(message === 'Prompt not found' ? 404 : 500).json({ success: false, message });
  }
}

export async function deletePrompt(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid prompt ID' });
      return;
    }

    await adminService.deletePrompt(id);

    res.json({ success: true, message: 'Prompt deleted' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete prompt';
    res.status(message === 'Prompt not found' ? 404 : 500).json({ success: false, message });
  }
}

// =============================================================================
// Admin: Flavor CRUD
// =============================================================================

export async function getFlavors(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminService.getFlavors(page, limit);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting flavors:', error);
    res.status(500).json({ success: false, message: 'Failed to get flavors' });
  }
}

export async function createFlavor(req: Request, res: Response): Promise<void> {
  try {
    const { location, image_url, flavor_text } = req.body;

    if (!location) {
      res.status(400).json({ success: false, message: 'Location is required' });
      return;
    }

    const flavor = await adminService.createFlavor({ location, image_url, flavor_text });

    res.status(201).json({ success: true, flavor });
  } catch (error) {
    console.error('Error creating flavor:', error);
    res.status(500).json({ success: false, message: 'Failed to create flavor' });
  }
}

export async function updateFlavor(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid flavor ID' });
      return;
    }

    const { image_url, flavor_text } = req.body;

    const flavor = await adminService.updateFlavor(id, { image_url, flavor_text });

    res.json({ success: true, flavor });
  } catch (error) {
    console.error('Error updating flavor:', error);
    const message = error instanceof Error ? error.message : 'Failed to update flavor';
    res.status(message === 'Flavor not found' ? 404 : 500).json({ success: false, message });
  }
}

export async function deleteFlavor(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid flavor ID' });
      return;
    }

    await adminService.deleteFlavor(id);

    res.json({ success: true, message: 'Flavor deleted' });
  } catch (error) {
    console.error('Error deleting flavor:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete flavor';
    res.status(message === 'Flavor not found' ? 404 : 500).json({ success: false, message });
  }
}
