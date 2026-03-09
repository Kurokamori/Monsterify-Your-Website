import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification.service';

const notificationService = new NotificationService();

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const summary = await notificationService.getSummary(req.user.id, req.user.discord_id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting notification summary:', error);
    res.status(500).json({ success: false, message: 'Error getting notification summary' });
  }
}

export async function getMissedChats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const chats = await notificationService.getMissedChats(req.user.discord_id);
    res.json({ success: true, data: chats });
  } catch (error) {
    console.error('Error getting missed chats:', error);
    res.status(500).json({ success: false, message: 'Error getting missed chats' });
  }
}

export async function getPendingApprovals(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const approvals = await notificationService.getPendingDesignApprovals(req.user.id);
    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ success: false, message: 'Error getting pending approvals' });
  }
}

export async function acceptApproval(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid approval ID' });
      return;
    }
    await notificationService.acceptApproval(id, req.user.id);
    res.json({ success: true, message: 'Approval accepted' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error accepting approval';
    console.error('Error accepting approval:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function rejectApproval(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid approval ID' });
      return;
    }
    await notificationService.rejectApproval(id, req.user.id);
    res.json({ success: true, message: 'Approval rejected' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rejecting approval';
    console.error('Error rejecting approval:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function acceptAll(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const count = await notificationService.acceptAllApprovals(req.user.id);
    res.json({ success: true, message: `Accepted ${count} approval(s)`, count });
  } catch (error) {
    console.error('Error accepting all approvals:', error);
    res.status(500).json({ success: false, message: 'Error accepting approvals' });
  }
}

export async function rejectAll(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const count = await notificationService.rejectAllApprovals(req.user.id);
    res.json({ success: true, message: `Rejected ${count} approval(s)`, count });
  } catch (error) {
    console.error('Error rejecting all approvals:', error);
    res.status(500).json({ success: false, message: 'Error rejecting approvals' });
  }
}

export async function getRewardsSummary(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const summary = await notificationService.getRewardsSummary(req.user.id, req.user.discord_id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting rewards summary:', error);
    res.status(500).json({ success: false, message: 'Error getting rewards summary' });
  }
}

export async function claimGiftRewards(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const result = await notificationService.claimGiftRewards(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error claiming gift rewards';
    console.error('Error claiming gift rewards:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getUnclaimedBossRewards(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const rewards = await notificationService.getUnclaimedBossRewards(req.user.id);
    res.json({ success: true, data: rewards });
  } catch (error) {
    console.error('Error getting unclaimed boss rewards:', error);
    res.status(500).json({ success: false, message: 'Error getting boss rewards' });
  }
}

export async function getUnclaimedMissions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const missions = await notificationService.getUnclaimedMissions(req.user.discord_id);
    res.json({ success: true, data: missions });
  } catch (error) {
    console.error('Error getting unclaimed missions:', error);
    res.status(500).json({ success: false, message: 'Error getting missions' });
  }
}
