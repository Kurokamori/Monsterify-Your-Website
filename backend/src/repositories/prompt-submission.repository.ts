import { BaseRepository } from './base.repository';
import { db } from '../database';

export type PromptSubmissionStatus = 'pending' | 'approved' | 'rejected';

export type PromptSubmissionRow = {
  id: number;
  prompt_id: number;
  submission_id: number;
  trainer_id: number;
  status: PromptSubmissionStatus;
  reviewed_by: string | null;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type PromptSubmissionRawRow = {
  id: number;
  prompt_id: number;
  trainer_id: number;
  submission_content: string | null;
  rewards_granted: string | null;
  [key: string]: unknown;
};

export type FullPromptSubmissionCreateInput = {
  promptId: number;
  trainerId: number;
  submissionContent: string | null;
  submissionNotes: string | null;
  status: string;
  submissionId?: number | null;
  rewardsGranted?: string | null;
};

export type PromptSubmissionWithDetails = PromptSubmissionRow & {
  prompt_title: string;
  prompt_type: string;
  prompt_category: string;
  submission_title: string;
  content_type: string;
  submission_description: string | null;
  trainer_name: string;
};

export type PromptSubmission = {
  id: number;
  promptId: number;
  submissionId: number;
  trainerId: number;
  status: PromptSubmissionStatus;
  reviewedBy: string | null;
  promptTitle: string;
  promptType: string;
  promptCategory: string;
  submissionTitle: string;
  contentType: string;
  submissionDescription: string | null;
  trainerName: string;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PromptSubmissionCreateInput = {
  promptId: number;
  submissionId: number;
  trainerId: number;
  status?: PromptSubmissionStatus;
  submittedAt?: Date | null;
};

export type PromptSubmissionUpdateInput = {
  status?: PromptSubmissionStatus;
  reviewedBy?: string | null;
};

export type PromptSubmissionQueryOptions = {
  promptId?: number;
  trainerId?: number;
  status?: PromptSubmissionStatus;
  promptType?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type PromptStats = {
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  uniqueTrainers: number;
  recentSubmissions: PromptSubmission[];
};

const normalizePromptSubmission = (row: PromptSubmissionWithDetails): PromptSubmission => ({
  id: row.id,
  promptId: row.prompt_id,
  submissionId: row.submission_id,
  trainerId: row.trainer_id,
  status: row.status,
  reviewedBy: row.reviewed_by,
  promptTitle: row.prompt_title,
  promptType: row.prompt_type,
  promptCategory: row.prompt_category,
  submissionTitle: row.submission_title,
  contentType: row.content_type,
  submissionDescription: row.submission_description,
  trainerName: row.trainer_name,
  submittedAt: row.submitted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const BASE_SELECT = `
  SELECT ps.*,
         p.title as prompt_title, p.type as prompt_type, p.category as prompt_category,
         s.title as submission_title, s.content_type, s.description as submission_description,
         t.name as trainer_name
  FROM prompt_submissions ps
  JOIN prompts p ON ps.prompt_id = p.id
  JOIN submissions s ON ps.submission_id = s.id
  JOIN trainers t ON ps.trainer_id = t.id
`;

export class PromptSubmissionRepository extends BaseRepository<
  PromptSubmission,
  PromptSubmissionCreateInput,
  PromptSubmissionUpdateInput
> {
  constructor() {
    super('prompt_submissions');
  }

  override async findById(id: number): Promise<PromptSubmission | null> {
    const result = await db.query<PromptSubmissionWithDetails>(
      `${BASE_SELECT} WHERE ps.id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizePromptSubmission(row) : null;
  }

  async findByPromptId(
    promptId: number,
    options: PromptSubmissionQueryOptions = {}
  ): Promise<PromptSubmission[]> {
    const conditions: string[] = ['ps.prompt_id = $1'];
    const params: unknown[] = [promptId];

    if (options.status) {
      params.push(options.status);
      conditions.push(`ps.status = $${params.length}`);
    }

    if (options.trainerId) {
      params.push(options.trainerId);
      conditions.push(`ps.trainer_id = $${params.length}`);
    }

    const result = await db.query<PromptSubmissionWithDetails>(
      `
        ${BASE_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY COALESCE(ps.submitted_at, ps.created_at) DESC
      `,
      params
    );

    return result.rows.map(normalizePromptSubmission);
  }

  async findByTrainerId(
    trainerId: number,
    options: PromptSubmissionQueryOptions = {}
  ): Promise<PromptSubmission[]> {
    const conditions: string[] = ['ps.trainer_id = $1'];
    const params: unknown[] = [trainerId];

    if (options.status) {
      params.push(options.status);
      conditions.push(`ps.status = $${params.length}`);
    }

    if (options.promptType) {
      params.push(options.promptType);
      conditions.push(`p.type = $${params.length}`);
    }

    if (options.category) {
      params.push(options.category);
      conditions.push(`p.category = $${params.length}`);
    }

    const result = await db.query<PromptSubmissionWithDetails>(
      `
        ${BASE_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY COALESCE(ps.submitted_at, ps.created_at) DESC
      `,
      params
    );

    return result.rows.map(normalizePromptSubmission);
  }

  override async create(input: PromptSubmissionCreateInput): Promise<PromptSubmission> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO prompt_submissions (prompt_id, submission_id, trainer_id, status, submitted_at, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [
        input.promptId,
        input.submissionId,
        input.trainerId,
        input.status ?? 'pending',
        input.submittedAt ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert prompt submission');
    }
    const promptSubmission = await this.findById(insertedRow.id);
    if (!promptSubmission) {
      throw new Error('Failed to create prompt submission');
    }
    return promptSubmission;
  }

  override async update(id: number, input: PromptSubmissionUpdateInput): Promise<PromptSubmission> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.reviewedBy !== undefined) {
      values.push(input.reviewedBy);
      updates.push(`reviewed_by = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Prompt submission not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE prompt_submissions SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Prompt submission not found after update');
    }
    return updated;
  }

  async updateStatus(
    id: number,
    status: PromptSubmissionStatus,
    reviewedBy?: string
  ): Promise<PromptSubmission> {
    return this.update(id, { status, reviewedBy });
  }

  async hasTrainerSubmitted(trainerId: number, promptId: number): Promise<boolean> {
    const result = await db.query<{ id: number }>(
      'SELECT id FROM prompt_submissions WHERE trainer_id = $1 AND prompt_id = $2',
      [trainerId, promptId]
    );
    return result.rows.length > 0;
  }

  async getTrainerMonthlySubmissionCount(trainerId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `
        SELECT COUNT(*) as count
        FROM prompt_submissions ps
        JOIN prompts p ON ps.prompt_id = p.id
        WHERE ps.trainer_id = $1
          AND p.type = 'monthly'
          AND EXTRACT(YEAR FROM COALESCE(ps.submitted_at, ps.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM COALESCE(ps.submitted_at, ps.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE)
      `,
      [trainerId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async getPromptStats(promptId: number): Promise<PromptStats> {
    const statsResult = await db.query<{
      total_submissions: string;
      approved_submissions: string;
      rejected_submissions: string;
      pending_submissions: string;
      unique_trainers: string;
    }>(
      `
        SELECT
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
          COUNT(DISTINCT trainer_id) as unique_trainers
        FROM prompt_submissions
        WHERE prompt_id = $1
      `,
      [promptId]
    );

    const stats = statsResult.rows[0];

    const recentResult = await db.query<PromptSubmissionWithDetails>(
      `
        ${BASE_SELECT}
        WHERE ps.prompt_id = $1
        ORDER BY COALESCE(ps.submitted_at, ps.created_at) DESC
        LIMIT 5
      `,
      [promptId]
    );

    if (!stats) {
      return {
        totalSubmissions: 0,
        approvedSubmissions: 0,
        rejectedSubmissions: 0,
        pendingSubmissions: 0,
        uniqueTrainers: 0,
        recentSubmissions: recentResult.rows.map(normalizePromptSubmission),
      };
    }

    return {
      totalSubmissions: parseInt(stats.total_submissions ?? '0', 10),
      approvedSubmissions: parseInt(stats.approved_submissions ?? '0', 10),
      rejectedSubmissions: parseInt(stats.rejected_submissions ?? '0', 10),
      pendingSubmissions: parseInt(stats.pending_submissions ?? '0', 10),
      uniqueTrainers: parseInt(stats.unique_trainers ?? '0', 10),
      recentSubmissions: recentResult.rows.map(normalizePromptSubmission),
    };
  }

  async getTrainerCompletedPrompts(
    trainerId: number
  ): Promise<{ promptId: number; completedAt: Date; title: string; description: string | null }[]> {
    const result = await db.query<{
      prompt_id: number;
      completed_at: Date;
      title: string;
      description: string | null;
    }>(
      `
        SELECT tps.prompt_id, tps.completed_at, p.title, p.description
        FROM trainer_prompt_submissions tps
        JOIN prompts p ON tps.prompt_id = p.id
        WHERE tps.trainer_id = $1
        ORDER BY tps.completed_at DESC
      `,
      [trainerId]
    );

    return result.rows.map((row) => ({
      promptId: row.prompt_id,
      completedAt: row.completed_at,
      title: row.title,
      description: row.description,
    }));
  }

  async markProgressCompleted(
    trainerId: number,
    promptId: number,
    promptSubmissionId: number
  ): Promise<void> {
    await db.query(
      `
        INSERT INTO trainer_prompt_submissions (trainer_id, prompt_id, prompt_submission_id, completed_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `,
      [trainerId, promptId, promptSubmissionId]
    );
  }

  // ===========================================================================
  // Raw access (for reward management flows)
  // ===========================================================================

  async findRawById(id: number): Promise<PromptSubmissionRawRow | null> {
    const result = await db.query<PromptSubmissionRawRow>(
      'SELECT * FROM prompt_submissions WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async createPromptSubmission(input: FullPromptSubmissionCreateInput): Promise<{ id: number }> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO prompt_submissions (
        prompt_id, trainer_id, submission_content, submission_notes,
        status, submitted_at, approved_at, submission_id, rewards_granted
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6, $7) RETURNING id`,
      [
        input.promptId,
        input.trainerId,
        input.submissionContent,
        input.submissionNotes,
        input.status,
        input.submissionId ?? null,
        input.rewardsGranted ?? null,
      ]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create prompt submission'); }
    return row;
  }

  async updateRewardsGranted(id: number, rewardsGranted: string): Promise<void> {
    await db.query(
      'UPDATE prompt_submissions SET rewards_granted = $1 WHERE id = $2',
      [rewardsGranted, id]
    );
  }
}
