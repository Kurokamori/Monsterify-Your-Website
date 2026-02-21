import { Request, Response } from 'express';
import { PromptService } from '../../services/prompt.service';
import type { PromptQueryOptions } from '../../repositories';

const promptService = new PromptService();

// =============================================================================
// Get All Prompts
// =============================================================================

export async function getAllPrompts(req: Request, res: Response): Promise<void> {
  try {
    const {
      page,
      limit,
      type,
      category,
      difficulty,
      active_only,
      available_only,
      trainer_id,
    } = req.query as Record<string, string | undefined>;

    const options: PromptQueryOptions = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type: type as PromptQueryOptions['type'],
      category,
      difficulty: difficulty as PromptQueryOptions['difficulty'],
      activeOnly: active_only !== 'false',
      availableOnly: available_only === 'true',
      trainerId: trainer_id ? parseInt(trainer_id, 10) : undefined,
    };

    const prompts = await promptService.getAllPrompts(options);

    res.json({
      success: true,
      prompts,
      pagination: {
        page: options.page ?? 1,
        limit: options.limit ?? 20,
        total: prompts.length,
      },
    });
  } catch (error) {
    console.error('Error getting prompts:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get prompts';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Prompt By ID
// =============================================================================

export async function getPromptById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const prompt = await promptService.getPromptById(id);

    if (!prompt) {
      res.status(404).json({ success: false, message: 'Prompt not found' });
      return;
    }

    res.json({ success: true, prompt });
  } catch (error) {
    console.error('Error getting prompt:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get prompt';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Create Prompt (Admin)
// =============================================================================

export async function createPrompt(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.title || !body.description) {
      res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
      return;
    }

    // Validate reward config if provided
    if (body.rewards) {
      const validation = promptService.validateRewardConfig(body.rewards);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'Invalid reward configuration',
          errors: validation.errors,
        });
        return;
      }
    }

    const prompt = await promptService.createPrompt({
      title: body.title as string,
      description: body.description as string,
      type: body.type as 'general' | 'monthly' | 'event' | 'progress' | undefined,
      category: body.category as string | undefined,
      difficulty: body.difficulty as 'easy' | 'medium' | 'hard' | 'expert' | undefined,
      isActive: body.is_active as boolean | undefined,
      priority: body.priority as number | undefined,
      maxSubmissions: body.max_submissions as number | null | undefined,
      maxSubmissionsPerTrainer: body.max_submissions_per_trainer as number | null | undefined,
      requiresApproval: body.requires_approval as boolean | undefined,
      activeMonths: body.active_months as string | null | undefined,
      startDate: body.start_date ? new Date(body.start_date as string) : undefined,
      endDate: body.end_date ? new Date(body.end_date as string) : undefined,
      rewards: body.rewards as object | null | undefined,
      requirements: body.requirements as object | null | undefined,
      tags: body.tags as string[] | null | undefined,
      minTrainerLevel: body.min_trainer_level as number | null | undefined,
      maxTrainerLevel: body.max_trainer_level as number | null | undefined,
      requiredFactions: body.required_factions as string[] | null | undefined,
    });

    res.status(201).json({
      success: true,
      prompt,
      message: 'Prompt created successfully',
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create prompt';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Update Prompt (Admin)
// =============================================================================

export async function updatePrompt(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const body = req.body as Record<string, unknown>;

    // Validate reward config if provided
    if (body.rewards) {
      const validation = promptService.validateRewardConfig(body.rewards);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'Invalid reward configuration',
          errors: validation.errors,
        });
        return;
      }
    }

    const prompt = await promptService.updatePrompt(id, {
      title: body.title as string | undefined,
      description: body.description as string | undefined,
      type: body.type as 'general' | 'monthly' | 'event' | 'progress' | undefined,
      category: body.category as string | undefined,
      difficulty: body.difficulty as 'easy' | 'medium' | 'hard' | 'expert' | undefined,
      isActive: body.is_active as boolean | undefined,
      priority: body.priority as number | undefined,
      maxSubmissions: body.max_submissions as number | null | undefined,
      maxSubmissionsPerTrainer: body.max_submissions_per_trainer as number | null | undefined,
      requiresApproval: body.requires_approval as boolean | undefined,
      activeMonths: body.active_months as string | null | undefined,
      startDate: body.start_date ? new Date(body.start_date as string) : undefined,
      endDate: body.end_date ? new Date(body.end_date as string) : undefined,
      rewards: body.rewards as object | null | undefined,
      requirements: body.requirements as object | null | undefined,
      tags: body.tags as string[] | null | undefined,
      minTrainerLevel: body.min_trainer_level as number | null | undefined,
      maxTrainerLevel: body.max_trainer_level as number | null | undefined,
      requiredFactions: body.required_factions as string[] | null | undefined,
    });

    res.json({
      success: true,
      prompt,
      message: 'Prompt updated successfully',
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update prompt';
    if (msg === 'Prompt not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Delete Prompt (Admin)
// =============================================================================

export async function deletePrompt(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    await promptService.deletePrompt(id);
    res.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete prompt';
    if (msg === 'Prompt not found') {
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
// Get Monthly Prompts
// =============================================================================

export async function getMonthlyPrompts(req: Request, res: Response): Promise<void> {
  try {
    const { month, year } = req.query as Record<string, string | undefined>;
    const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const prompts = await promptService.getMonthlyPrompts(targetMonth);

    res.json({
      success: true,
      prompts,
      month: targetMonth,
      year: targetYear,
    });
  } catch (error) {
    console.error('Error getting monthly prompts:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get monthly prompts';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Event Prompts
// =============================================================================

export async function getEventPrompts(_req: Request, res: Response): Promise<void> {
  try {
    const prompts = await promptService.getEventPrompts();
    res.json({ success: true, prompts });
  } catch (error) {
    console.error('Error getting event prompts:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get event prompts';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Check Prompt Availability
// =============================================================================

export async function checkPromptAvailability(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.params.id as string, 10);
    const trainerId = parseInt(req.params.trainerId as string, 10);

    const result = await promptService.checkPromptAvailability(promptId, trainerId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error checking prompt availability:', error);
    const msg = error instanceof Error ? error.message : 'Failed to check availability';
    if (msg === 'Prompt not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Available Prompts
// =============================================================================

export async function getAvailablePrompts(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string, 10);
    const { category, type } = req.query as Record<string, string | undefined>;

    const prompts = await promptService.getAvailablePrompts(trainerId, category, type);
    res.json({ success: true, prompts });
  } catch (error) {
    console.error('Error getting available prompts:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get available prompts';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Submit To Prompt
// =============================================================================

export async function submitToPrompt(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.params.id as string, 10);
    const { trainer_id, submission_id } = req.body as {
      trainer_id?: number;
      submission_id?: number;
    };

    if (!trainer_id || !submission_id) {
      res.status(400).json({
        success: false,
        message: 'trainer_id and submission_id are required',
      });
      return;
    }

    const result = await promptService.submitToPrompt(promptId, trainer_id, submission_id);

    res.status(201).json({
      success: true,
      submission: result.submission,
      message: 'Submission approved and rewards applied!',
    });
  } catch (error) {
    console.error('Error submitting to prompt:', error);
    const msg = error instanceof Error ? error.message : 'Failed to submit to prompt';
    if (msg === 'Prompt not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not available') || msg.includes('already submitted')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Review Submission (Admin)
// =============================================================================

export async function reviewSubmission(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = parseInt(req.params.submissionId as string, 10);
    const { status, quality_score, bonus_applied } = req.body as {
      status?: string;
      quality_score?: number;
      bonus_applied?: boolean;
    };

    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const reviewedBy = req.user?.discord_id ?? 'admin';

    const result = await promptService.reviewSubmission(
      submissionId,
      status,
      reviewedBy,
      quality_score,
      bonus_applied
    );

    res.json({
      success: true,
      submission: result.submission,
      message: 'Submission reviewed successfully',
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    const msg = error instanceof Error ? error.message : 'Failed to review submission';
    if (msg === 'Submission not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg === 'Invalid status') {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Trainer Progress
// =============================================================================

export async function getTrainerProgress(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string, 10);
    const { type, completed_only } = req.query as Record<string, string | undefined>;

    const progress = await promptService.getTrainerProgress(
      trainerId,
      type,
      completed_only === 'true'
    );

    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error getting trainer progress:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get trainer progress';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Prompt Statistics (Admin)
// =============================================================================

export async function getPromptStatistics(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.params.id as string, 10);
    const { start_date, end_date } = req.query as Record<string, string | undefined>;

    const result = await promptService.getPromptStatistics(promptId, start_date, end_date);

    res.json({
      success: true,
      statistics: result.statistics,
      overall: result.overall,
    });
  } catch (error) {
    console.error('Error getting prompt statistics:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get prompt statistics';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Categories (Meta)
// =============================================================================

export async function getPromptCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await promptService.getCategories();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get categories';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Difficulties (Meta)
// =============================================================================

export function getPromptDifficulties(_req: Request, res: Response): void {
  res.json({ success: true, difficulties: promptService.getDifficulties() });
}

// =============================================================================
// Get Types (Meta)
// =============================================================================

export function getPromptTypes(_req: Request, res: Response): void {
  res.json({ success: true, types: promptService.getTypes() });
}

// =============================================================================
// Search Prompts
// =============================================================================

export async function searchPrompts(req: Request, res: Response): Promise<void> {
  try {
    const searchTerm = req.params.searchTerm as string;
    const { type, category, active_only } = req.query as Record<string, string | undefined>;

    const prompts = await promptService.searchPrompts(searchTerm, {
      type: type as PromptQueryOptions['type'],
      category,
      activeOnly: active_only === 'true',
    });

    res.json({ success: true, prompts, searchTerm });
  } catch (error) {
    console.error('Error searching prompts:', error);
    const msg = error instanceof Error ? error.message : 'Failed to search prompts';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Reroll Monster
// =============================================================================

export async function rerollMonster(req: Request, res: Response): Promise<void> {
  try {
    const { trainer_id, monster_id, original_params } = req.body as {
      trainer_id?: number;
      monster_id?: number;
      original_params?: Record<string, unknown>;
    };

    if (!trainer_id || !monster_id) {
      res.status(400).json({
        success: false,
        message: 'Trainer ID and Monster ID are required',
      });
      return;
    }

    const result = await promptService.rerollMonster(
      trainer_id,
      monster_id,
      original_params ?? {}
    );

    res.json({
      success: true,
      data: result,
      message: 'Monster rerolled successfully',
    });
  } catch (error) {
    console.error('Error rerolling monster:', error);
    const msg = error instanceof Error ? error.message : 'Failed to reroll monster';
    res.status(500).json({ success: false, message: msg });
  }
}
