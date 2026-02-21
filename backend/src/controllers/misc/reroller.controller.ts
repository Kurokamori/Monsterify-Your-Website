import { Request, Response } from 'express';
import { RerollerService, type ClaimInput } from '../../services/reroller.service';
import type { RerollSessionQueryOptions, RerollSessionUpdateInput } from '../../repositories';

const rerollerService = new RerollerService();

// =============================================================================
// Admin: Create Session
// =============================================================================

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;

    const result = await rerollerService.createSession({
      rollType: body.rollType as 'monster' | 'item' | 'combined' | 'gift' | 'birthday',
      targetUserId: body.targetUserId as number,
      monsterParams: body.monsterParams as Record<string, unknown> | null,
      itemParams: body.itemParams as Record<string, unknown> | null,
      giftLevels: body.giftLevels as number | undefined,
      monsterCount: body.monsterCount as number | undefined,
      itemCount: body.itemCount as number | undefined,
      monsterClaimLimit: body.monsterClaimLimit as number | null | undefined,
      itemClaimLimit: body.itemClaimLimit as number | null | undefined,
      notes: body.notes as string | null | undefined,
      createdBy: req.user?.id ?? 0,
    });

    res.status(201).json({
      success: true,
      data: result.session,
      claimUrl: result.claimUrl,
    });
  } catch (error) {
    console.error('Error creating reroller session:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create session';
    if (msg.includes('Invalid roll type') || msg.includes('is required') || msg.includes('must be')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: List Sessions
// =============================================================================

export async function listSessions(req: Request, res: Response): Promise<void> {
  try {
    const { status, page, limit } = req.query as Record<string, string | undefined>;

    const options: RerollSessionQueryOptions = {
      status: status as RerollSessionQueryOptions['status'],
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await rerollerService.listSessions(options);

    res.json({
      success: true,
      data: result.sessions,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error listing reroller sessions:', error);
    const msg = error instanceof Error ? error.message : 'Failed to list sessions';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Get Session
// =============================================================================

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = await rerollerService.getSession(id);

    res.json({
      success: true,
      data: {
        ...result.session,
        claims: result.claims,
      },
    });
  } catch (error) {
    console.error('Error getting reroller session:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get session';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Update Session
// =============================================================================

export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { monsterClaimLimit, itemClaimLimit, status, notes } = req.body as {
      monsterClaimLimit?: number | null;
      itemClaimLimit?: number | null;
      status?: string;
      notes?: string | null;
    };

    const input: RerollSessionUpdateInput = {};
    if (monsterClaimLimit !== undefined) {
      input.monsterClaimLimit = monsterClaimLimit;
    }
    if (itemClaimLimit !== undefined) {
      input.itemClaimLimit = itemClaimLimit;
    }
    if (status !== undefined) {
      input.status = status as RerollSessionUpdateInput['status'];
    }
    if (notes !== undefined) {
      input.notes = notes;
    }

    const session = await rerollerService.updateSession(id, input);

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error updating reroller session:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update session';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Delete Session
// =============================================================================

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    await rerollerService.deleteSession(id);
    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('Error deleting reroller session:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete session';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Update Result
// =============================================================================

export async function updateResult(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { type, index, data } = req.body as {
      type?: string;
      index?: number;
      data?: unknown;
    };

    if (!type || index === undefined || !data) {
      res.status(400).json({ success: false, message: 'Type, index, and data are required.' });
      return;
    }

    if (!['monster', 'item'].includes(type)) {
      res.status(400).json({ success: false, message: 'Type must be monster or item.' });
      return;
    }

    const session = await rerollerService.updateResult(id, type as 'monster' | 'item', index, data);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error updating reroller result:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update result';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot modify')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Delete Result
// =============================================================================

export async function deleteResult(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const type = req.params.type as string;
    const index = parseInt(req.params.index as string, 10);

    if (!['monster', 'item'].includes(type)) {
      res.status(400).json({ success: false, message: 'Type must be monster or item.' });
      return;
    }

    const session = await rerollerService.deleteResult(id, type as 'monster' | 'item', index);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error deleting reroller result:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete result';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot delete')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Reroll Single Result
// =============================================================================

export async function rerollResult(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { type, index } = req.body as { type?: string; index?: number };

    if (!type || index === undefined) {
      res.status(400).json({ success: false, message: 'Type and index are required.' });
      return;
    }

    const session = await rerollerService.rerollResult(id, type as 'monster' | 'item', index);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error rerolling result:', error);
    const msg = error instanceof Error ? error.message : 'Failed to reroll result';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot reroll') || msg.includes('Failed to generate')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin: Reroll All
// =============================================================================

export async function rerollAll(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const session = await rerollerService.rerollAll(id);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error rerolling all:', error);
    const msg = error instanceof Error ? error.message : 'Failed to reroll all';
    if (msg === 'Session not found.') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot reroll')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Player: Check Token (Public)
// =============================================================================

export async function checkToken(req: Request, res: Response): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await rerollerService.checkToken(token);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking token:', error);
    const msg = error instanceof Error ? error.message : 'Invalid token';
    if (msg.includes('Invalid') || msg.includes('expired')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('claim link is')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Player: Get Claim Session
// =============================================================================

export async function getClaimSession(req: Request, res: Response): Promise<void> {
  try {
    const token = req.params.token as string;
    const userId = req.user?.id;
    const discordId = req.user?.discord_id ?? req.user?.id?.toString() ?? '';

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const data = await rerollerService.getClaimSession(token, userId, discordId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting claim session:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get claim session';
    if (msg.includes('Invalid') || msg.includes('expired')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not for your account')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('claim link is')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Player: Submit Claims
// =============================================================================

export async function submitClaims(req: Request, res: Response): Promise<void> {
  try {
    const token = req.params.token as string;
    const userId = req.user?.id;
    const discordId = req.user?.discord_id ?? req.user?.id?.toString() ?? '';

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { claims } = req.body as { claims?: ClaimInput[] };

    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      res.status(400).json({ success: false, message: 'Claims array is required.' });
      return;
    }

    const result = await rerollerService.submitClaims(token, userId, discordId, claims);

    res.json({
      success: true,
      message: 'Claims processed successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Error submitting claims:', error);
    const msg = error instanceof Error ? error.message : 'Failed to submit claims';
    if (msg.includes('Invalid') || msg.includes('expired') || msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not for your account') || msg.includes('does not belong to you')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (
      msg.includes('claim link is') ||
      msg.includes('already been claimed') ||
      msg.includes('can only claim') ||
      msg.includes('Invalid') ||
      msg.includes('Claims array')
    ) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}
