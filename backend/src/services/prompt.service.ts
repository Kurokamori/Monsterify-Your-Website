import { db } from '../database';
import {
  PromptRepository,
  PromptSubmissionRepository,
  TrainerRepository,
  type Prompt,
  type PromptCreateInput,
  type PromptUpdateInput,
  type PromptQueryOptions,
  type PromptSubmissionCreateInput,
} from '../repositories';
import { ImmediateRewardService, type AppliedRewards } from './immediate-reward.service';

// ============================================================================
// Types
// ============================================================================

export type RewardValidationResult = {
  valid: boolean;
  errors: string[];
};

export type AvailabilityResult = {
  available: boolean;
  reason?: string;
};

export type DailyStatEntry = {
  date: string;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  uniqueParticipants: number;
  avgQualityScore: number | null;
};

export type OverallStats = {
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  uniqueParticipants: number;
  avgQualityScore: number | null;
};

export type PromptStatisticsResult = {
  statistics: DailyStatEntry[];
  overall: OverallStats;
};

export type TrainerProgressEntry = {
  id: number;
  trainerId: number;
  promptId: number;
  isCompleted: boolean;
  completedAt: Date | null;
  startedAt: Date | null;
  progressData: unknown;
  promptTitle: string;
  promptType: string;
  promptCategory: string;
  difficulty: string;
  submissionCount: number;
  approvedCount: number;
};

export type SubmitResult = {
  submission: {
    id: number;
    promptId: number;
    trainerId: number;
    status: string;
    appliedRewards: AppliedRewards | null;
  };
};

export type ReviewResult = {
  submission: {
    id: number;
    promptId: number;
    trainerId: number;
    status: string;
    reviewedBy: string | null;
    appliedRewards: AppliedRewards | null;
  };
};

export type DifficultyInfo = {
  value: string;
  label: string;
  description: string;
};

export type TypeInfo = {
  value: string;
  label: string;
  description: string;
};

// ============================================================================
// Service
// ============================================================================

export class PromptService {
  private promptRepository: PromptRepository;
  private submissionRepository: PromptSubmissionRepository;
  private trainerRepository: TrainerRepository;
  private immediateRewardService: ImmediateRewardService;

  constructor(
    promptRepository?: PromptRepository,
    submissionRepository?: PromptSubmissionRepository,
    trainerRepository?: TrainerRepository,
    immediateRewardService?: ImmediateRewardService
  ) {
    this.promptRepository = promptRepository ?? new PromptRepository();
    this.submissionRepository = submissionRepository ?? new PromptSubmissionRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.immediateRewardService = immediateRewardService ?? new ImmediateRewardService();
  }

  // ==========================================================================
  // Prompt CRUD
  // ==========================================================================

  async getAllPrompts(options: PromptQueryOptions = {}): Promise<Prompt[]> {
    return this.promptRepository.findAll(options);
  }

  async getPromptById(id: number): Promise<Prompt | null> {
    return this.promptRepository.findById(id);
  }

  async createPrompt(input: PromptCreateInput): Promise<Prompt> {
    return this.promptRepository.create(input);
  }

  async updatePrompt(id: number, input: PromptUpdateInput): Promise<Prompt> {
    const existing = await this.promptRepository.findById(id);
    if (!existing) {
      throw new Error('Prompt not found');
    }
    return this.promptRepository.update(id, input);
  }

  async deletePrompt(id: number): Promise<void> {
    const existing = await this.promptRepository.findById(id);
    if (!existing) {
      throw new Error('Prompt not found');
    }

    // Check if prompt has submissions
    const submissions = await this.submissionRepository.findByPromptId(id);
    if (submissions.length > 0) {
      throw new Error('Cannot delete prompt with existing submissions');
    }

    await this.promptRepository.delete(id);
  }

  // ==========================================================================
  // Prompt Queries
  // ==========================================================================

  async getMonthlyPrompts(month?: number): Promise<Prompt[]> {
    const targetMonth = month ?? new Date().getMonth() + 1;
    return this.promptRepository.findMonthlyPrompts(targetMonth);
  }

  async getEventPrompts(): Promise<Prompt[]> {
    return this.promptRepository.findEventPrompts();
  }

  async getAvailablePrompts(
    trainerId: number,
    category?: string,
    type?: string
  ): Promise<Prompt[]> {
    const options: PromptQueryOptions = {
      availableOnly: true,
      trainerId,
    };
    if (category) {
      options.category = category;
    }
    if (type) {
      options.type = type as PromptQueryOptions['type'];
    }
    return this.promptRepository.findAll(options);
  }

  async searchPrompts(
    searchTerm: string,
    options: PromptQueryOptions = {}
  ): Promise<Prompt[]> {
    return this.promptRepository.search(searchTerm, options);
  }

  // ==========================================================================
  // Availability Check
  // ==========================================================================

  async checkPromptAvailability(
    promptId: number,
    trainerId: number
  ): Promise<AvailabilityResult> {
    const prompt = await this.promptRepository.findById(promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Check if prompt is active/available
    if (!prompt.isCurrentlyAvailable) {
      return { available: false, reason: 'Prompt is not currently available' };
    }

    // Check max submissions
    if (prompt.maxSubmissions !== null) {
      const count = await this.promptRepository.getSubmissionCount(promptId);
      if (count >= prompt.maxSubmissions) {
        return { available: false, reason: 'Maximum submissions reached for this prompt' };
      }
    }

    // Check max submissions per trainer
    if (prompt.maxSubmissionsPerTrainer !== null) {
      const hasSubmitted = await this.submissionRepository.hasTrainerSubmitted(trainerId, promptId);
      if (hasSubmitted) {
        return { available: false, reason: 'You have already submitted to this prompt' };
      }
    }

    // Check trainer level requirements
    if (prompt.minTrainerLevel !== null || prompt.maxTrainerLevel !== null) {
      const trainer = await this.trainerRepository.findById(trainerId);
      if (trainer) {
        if (prompt.minTrainerLevel !== null && trainer.level < prompt.minTrainerLevel) {
          return {
            available: false,
            reason: `Requires trainer level ${prompt.minTrainerLevel} or higher`,
          };
        }
        if (prompt.maxTrainerLevel !== null && trainer.level > prompt.maxTrainerLevel) {
          return {
            available: false,
            reason: `Requires trainer level ${prompt.maxTrainerLevel} or lower`,
          };
        }
      }
    }

    return { available: true };
  }

  // ==========================================================================
  // Submission
  // ==========================================================================

  async submitToPrompt(
    promptId: number,
    trainerId: number,
    submissionId: number
  ): Promise<SubmitResult> {
    const prompt = await this.promptRepository.findById(promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Check availability
    const availability = await this.checkPromptAvailability(promptId, trainerId);
    if (!availability.available) {
      throw new Error(availability.reason ?? 'Prompt not available');
    }

    // Create submission - auto approved
    const submissionInput: PromptSubmissionCreateInput = {
      promptId,
      submissionId,
      trainerId,
      status: 'approved',
      submittedAt: new Date(),
    };

    const submission = await this.submissionRepository.create(submissionInput);

    // Calculate and apply rewards immediately
    let appliedRewards: AppliedRewards | null = null;
    if (prompt.rewards) {
      appliedRewards = await this.immediateRewardService.calculateAndApplyRewards(
        { rewards: prompt.rewards as Record<string, unknown> },
        { trainer_id: trainerId },
        7, // Default quality score
        false
      );
    }

    // Update progress for progress-type prompts
    if (prompt.type === 'progress') {
      await this.updateTrainerProgress(trainerId, promptId, {
        submitted: true,
      });
    }

    return {
      submission: {
        id: submission.id,
        promptId: submission.promptId,
        trainerId: submission.trainerId,
        status: submission.status,
        appliedRewards,
      },
    };
  }

  // ==========================================================================
  // Review
  // ==========================================================================

  async reviewSubmission(
    submissionId: number,
    status: string,
    reviewedBy: string,
    qualityScore?: number,
    bonusApplied?: boolean
  ): Promise<ReviewResult> {
    if (!['approved', 'rejected', 'under_review'].includes(status)) {
      throw new Error('Invalid status');
    }

    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Update submission status
    const updated = await this.submissionRepository.updateStatus(
      submissionId,
      status as 'approved' | 'rejected',
      reviewedBy
    );

    // Distribute rewards if approved
    let appliedRewards: AppliedRewards | null = null;
    if (status === 'approved') {
      const prompt = await this.promptRepository.findById(submission.promptId);
      if (prompt?.rewards) {
        appliedRewards = await this.immediateRewardService.calculateAndApplyRewards(
          { rewards: prompt.rewards as Record<string, unknown> },
          { trainer_id: submission.trainerId },
          qualityScore ?? 5,
          bonusApplied ?? false
        );
      }

      // Mark progress for progress-type prompts
      if (prompt?.type === 'progress') {
        await this.updateTrainerProgress(submission.trainerId, submission.promptId, {
          completed: true,
          completedAt: new Date().toISOString(),
        });
      }
    }

    return {
      submission: {
        id: updated.id,
        promptId: updated.promptId,
        trainerId: updated.trainerId,
        status: updated.status,
        reviewedBy: updated.reviewedBy,
        appliedRewards,
      },
    };
  }

  // ==========================================================================
  // Progress
  // ==========================================================================

  async getTrainerProgress(
    trainerId: number,
    type?: string,
    completedOnly?: boolean
  ): Promise<TrainerProgressEntry[]> {
    const conditions: string[] = ['tpp.trainer_id = $1'];
    const params: unknown[] = [trainerId];

    if (type) {
      params.push(type);
      conditions.push(`p.type = $${params.length}`);
    }

    if (completedOnly) {
      conditions.push('tpp.is_completed = true');
    }

    const query = `
      SELECT
        tpp.id, tpp.trainer_id, tpp.prompt_id, tpp.is_completed,
        tpp.completed_at, tpp.started_at, tpp.progress_data,
        p.title as prompt_title, p.type as prompt_type,
        p.category as prompt_category, p.difficulty,
        COUNT(ps.id) as submission_count,
        COUNT(CASE WHEN ps.status = 'approved' THEN 1 END) as approved_count
      FROM trainer_prompt_progress tpp
      JOIN prompts p ON tpp.prompt_id = p.id
      LEFT JOIN prompt_submissions ps ON tpp.trainer_id = ps.trainer_id AND tpp.prompt_id = ps.prompt_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY tpp.id, p.title, p.type, p.category, p.difficulty
      ORDER BY tpp.started_at DESC
    `;

    const result = await db.query<{
      id: number;
      trainer_id: number;
      prompt_id: number;
      is_completed: boolean;
      completed_at: Date | null;
      started_at: Date | null;
      progress_data: unknown;
      prompt_title: string;
      prompt_type: string;
      prompt_category: string;
      difficulty: string;
      submission_count: string;
      approved_count: string;
    }>(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      trainerId: row.trainer_id,
      promptId: row.prompt_id,
      isCompleted: row.is_completed,
      completedAt: row.completed_at,
      startedAt: row.started_at,
      progressData: row.progress_data,
      promptTitle: row.prompt_title,
      promptType: row.prompt_type,
      promptCategory: row.prompt_category,
      difficulty: row.difficulty,
      submissionCount: parseInt(row.submission_count, 10),
      approvedCount: parseInt(row.approved_count, 10),
    }));
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  async getPromptStatistics(
    promptId: number,
    startDate?: string,
    endDate?: string
  ): Promise<PromptStatisticsResult> {
    const conditions: string[] = ['ps.prompt_id = $1'];
    const params: unknown[] = [promptId];

    if (startDate) {
      params.push(startDate);
      conditions.push(`ps.submitted_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`ps.submitted_at <= $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Daily stats
    const dailyResult = await db.query<{
      date: string;
      total_submissions: string;
      approved_submissions: string;
      rejected_submissions: string;
      pending_submissions: string;
      unique_participants: string;
      avg_quality_score: string | null;
    }>(
      `SELECT
        DATE(ps.submitted_at) as date,
        COUNT(*)::text as total_submissions,
        COUNT(CASE WHEN ps.status = 'approved' THEN 1 END)::text as approved_submissions,
        COUNT(CASE WHEN ps.status = 'rejected' THEN 1 END)::text as rejected_submissions,
        COUNT(CASE WHEN ps.status = 'pending' THEN 1 END)::text as pending_submissions,
        COUNT(DISTINCT ps.trainer_id)::text as unique_participants,
        AVG(ps.quality_score)::text as avg_quality_score
      FROM prompt_submissions ps
      WHERE ${whereClause}
      GROUP BY DATE(ps.submitted_at)
      ORDER BY date DESC`,
      params
    );

    // Overall stats
    const overallResult = await db.query<{
      total_submissions: string;
      approved_submissions: string;
      rejected_submissions: string;
      pending_submissions: string;
      unique_participants: string;
      avg_quality_score: string | null;
    }>(
      `SELECT
        COUNT(*)::text as total_submissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::text as approved_submissions,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::text as rejected_submissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::text as pending_submissions,
        COUNT(DISTINCT trainer_id)::text as unique_participants,
        AVG(quality_score)::text as avg_quality_score
      FROM prompt_submissions
      WHERE prompt_id = $1`,
      [promptId]
    );

    const overall = overallResult.rows[0];

    return {
      statistics: dailyResult.rows.map((row) => ({
        date: row.date,
        totalSubmissions: parseInt(row.total_submissions, 10),
        approvedSubmissions: parseInt(row.approved_submissions, 10),
        rejectedSubmissions: parseInt(row.rejected_submissions, 10),
        pendingSubmissions: parseInt(row.pending_submissions, 10),
        uniqueParticipants: parseInt(row.unique_participants, 10),
        avgQualityScore: row.avg_quality_score ? parseFloat(row.avg_quality_score) : null,
      })),
      overall: {
        totalSubmissions: overall ? parseInt(overall.total_submissions, 10) : 0,
        approvedSubmissions: overall ? parseInt(overall.approved_submissions, 10) : 0,
        rejectedSubmissions: overall ? parseInt(overall.rejected_submissions, 10) : 0,
        pendingSubmissions: overall ? parseInt(overall.pending_submissions, 10) : 0,
        uniqueParticipants: overall ? parseInt(overall.unique_participants, 10) : 0,
        avgQualityScore: overall?.avg_quality_score
          ? parseFloat(overall.avg_quality_score)
          : null,
      },
    };
  }

  // ==========================================================================
  // Metadata
  // ==========================================================================

  async getCategories(): Promise<{ category: string; promptCount: number }[]> {
    return this.promptRepository.getCategories();
  }

  getDifficulties(): DifficultyInfo[] {
    return [
      { value: 'easy', label: 'Easy', description: 'Simple prompts suitable for beginners' },
      { value: 'medium', label: 'Medium', description: 'Standard difficulty prompts' },
      { value: 'hard', label: 'Hard', description: 'Challenging prompts requiring skill' },
      { value: 'expert', label: 'Expert', description: 'Advanced prompts for experienced users' },
    ];
  }

  getTypes(): TypeInfo[] {
    return [
      {
        value: 'general',
        label: 'General',
        description: 'Standard prompts available anytime with no completion limit',
      },
      {
        value: 'monthly',
        label: 'Monthly',
        description: 'Special prompts available only during specific months',
      },
      {
        value: 'progress',
        label: 'Progress',
        description: 'One-time completion prompts that track trainer progress',
      },
      {
        value: 'event',
        label: 'Event',
        description: 'Time-limited prompts available during special events',
      },
    ];
  }

  // ==========================================================================
  // Reward Validation
  // ==========================================================================

  validateRewardConfig(rewards: unknown): RewardValidationResult {
    const errors: string[] = [];

    if (rewards === null || rewards === undefined) {
      return { valid: true, errors: [] };
    }

    if (typeof rewards !== 'object' || Array.isArray(rewards)) {
      errors.push('Rewards must be an object');
      return { valid: false, errors };
    }

    const r = rewards as Record<string, unknown>;

    // Validate levels
    if (r.levels !== undefined) {
      if (!Number.isInteger(r.levels) || (r.levels as number) < 0) {
        errors.push('Levels must be a non-negative integer');
      }
    }

    // Validate coins
    if (r.coins !== undefined) {
      if (!Number.isInteger(r.coins) || (r.coins as number) < 0) {
        errors.push('Coins must be a non-negative integer');
      }
    }

    // Validate items
    if (r.items !== undefined) {
      if (!Array.isArray(r.items)) {
        errors.push('Items must be an array');
      } else {
        (r.items as Record<string, unknown>[]).forEach((item, index) => {
          const isRandomFromCategory = item.is_random_from_category && item.category;
          const isRandomFromSet =
            item.is_random_from_set &&
            Array.isArray(item.random_set_items) &&
            (item.random_set_items as unknown[]).length > 0;
          const isSpecificItem = item.item_id ?? item.item_name;

          if (!isSpecificItem && !isRandomFromCategory && !isRandomFromSet) {
            errors.push(
              `Item ${index + 1} must have either item_id/item_name, a category for random selection, or a set of items`
            );
          }

          if (!Number.isInteger(item.quantity) || (item.quantity as number) <= 0) {
            errors.push(`Item ${index + 1} quantity must be a positive integer`);
          }

          if (
            item.chance !== undefined &&
            (!Number.isInteger(item.chance) ||
              (item.chance as number) < 1 ||
              (item.chance as number) > 100)
          ) {
            errors.push(`Item ${index + 1} chance must be an integer between 1 and 100`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ==========================================================================
  // Reroll Monster
  // ==========================================================================

  async rerollMonster(
    trainerId: number,
    monsterId: number,
    originalParams: Record<string, unknown> = {}
  ): Promise<unknown> {
    return this.immediateRewardService.rerollMonsterWithForgetMeNot(
      trainerId,
      monsterId,
      originalParams
    );
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private async updateTrainerProgress(
    trainerId: number,
    promptId: number,
    progressData: {
      submitted?: boolean;
      completed?: boolean;
      completedAt?: string;
      progressData?: unknown;
    }
  ): Promise<void> {
    const existingResult = await db.query<{ id: number }>(
      'SELECT id FROM trainer_prompt_progress WHERE trainer_id = $1 AND prompt_id = $2',
      [trainerId, promptId]
    );

    const existing = existingResult.rows[0];

    if (existing) {
      const updates: string[] = [];
      const params: unknown[] = [];

      if (progressData.completed !== undefined) {
        params.push(progressData.completed);
        updates.push(`is_completed = $${params.length}`);
      }

      if (progressData.completedAt) {
        params.push(progressData.completedAt);
        updates.push(`completed_at = $${params.length}`);
      }

      if (progressData.progressData) {
        params.push(JSON.stringify(progressData.progressData));
        updates.push(`progress_data = $${params.length}`);
      }

      if (updates.length > 0) {
        params.push(trainerId, promptId);
        await db.query(
          `UPDATE trainer_prompt_progress SET ${updates.join(', ')} WHERE trainer_id = $${params.length - 1} AND prompt_id = $${params.length}`,
          params
        );
      }
    } else {
      await db.query(
        `INSERT INTO trainer_prompt_progress (trainer_id, prompt_id, is_completed, completed_at, progress_data, started_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          trainerId,
          promptId,
          progressData.completed ?? false,
          progressData.completedAt ?? null,
          progressData.progressData ? JSON.stringify(progressData.progressData) : null,
        ]
      );
    }
  }
}
