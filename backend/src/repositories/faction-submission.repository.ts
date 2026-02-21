import { BaseRepository } from './base.repository';
import { db } from '../database';

export type TrainerStatus = 'alone' | 'with_others';
export type TaskSize = 'small' | 'medium' | 'large';

export type FactionSubmissionRow = {
  id: number;
  trainer_id: number;
  faction_id: number;
  submission_id: number | null;
  prompt_id: number | null;
  trainer_status: TrainerStatus;
  task_size: TaskSize;
  special_bonus: boolean;
  base_score: number;
  prompt_modifier: number;
  final_score: number;
  created_at: Date;
};

export type FactionSubmission = {
  id: number;
  trainerId: number;
  factionId: number;
  submissionId: number | null;
  promptId: number | null;
  trainerStatus: TrainerStatus;
  taskSize: TaskSize;
  specialBonus: boolean;
  baseScore: number;
  promptModifier: number;
  finalScore: number;
  createdAt: Date;
};

export type FactionSubmissionWithDetails = FactionSubmission & {
  factionName: string | null;
  factionColor: string | null;
  submissionTitle: string | null;
  contentType: string | null;
  promptName: string | null;
  promptDescription: string | null;
};

export type FactionSubmissionCreateInput = {
  trainerId: number;
  factionId: number;
  submissionId?: number | null;
  promptId?: number | null;
  trainerStatus: TrainerStatus;
  taskSize: TaskSize;
  specialBonus?: boolean;
  customScore?: number | null;
};

export type FactionSubmissionUpdateInput = Partial<FactionSubmissionCreateInput>;

const normalizeFactionSubmission = (row: FactionSubmissionRow): FactionSubmission => ({
  id: row.id,
  trainerId: row.trainer_id,
  factionId: row.faction_id,
  submissionId: row.submission_id,
  promptId: row.prompt_id,
  trainerStatus: row.trainer_status,
  taskSize: row.task_size,
  specialBonus: row.special_bonus,
  baseScore: row.base_score,
  promptModifier: row.prompt_modifier,
  finalScore: row.final_score,
  createdAt: row.created_at,
});

type FactionSubmissionWithDetailsRow = FactionSubmissionRow & {
  faction_name: string | null;
  faction_color: string | null;
  submission_title: string | null;
  content_type: string | null;
  prompt_name: string | null;
  prompt_description: string | null;
};

const normalizeFactionSubmissionWithDetails = (row: FactionSubmissionWithDetailsRow): FactionSubmissionWithDetails => ({
  ...normalizeFactionSubmission(row),
  factionName: row.faction_name,
  factionColor: row.faction_color,
  submissionTitle: row.submission_title,
  contentType: row.content_type,
  promptName: row.prompt_name,
  promptDescription: row.prompt_description,
});

export class FactionSubmissionRepository extends BaseRepository<
  FactionSubmission,
  FactionSubmissionCreateInput,
  FactionSubmissionUpdateInput
> {
  constructor() {
    super('faction_submissions');
  }

  override async findById(id: number): Promise<FactionSubmissionWithDetails | null> {
    const result = await db.query<FactionSubmissionWithDetailsRow>(
      `
        SELECT fs.*, f.name as faction_name, f.color as faction_color,
               s.title as submission_title, s.content_type,
               fp.name as prompt_name, fp.description as prompt_description
        FROM faction_submissions fs
        JOIN factions f ON fs.faction_id = f.id
        LEFT JOIN submissions s ON fs.submission_id = s.id
        LEFT JOIN faction_prompts fp ON fs.prompt_id = fp.id
        WHERE fs.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeFactionSubmissionWithDetails(row) : null;
  }

  async findByTrainerId(trainerId: number, factionId?: number): Promise<FactionSubmissionWithDetails[]> {
    let query = `
      SELECT fs.*, f.name as faction_name, f.color as faction_color,
             s.title as submission_title, s.content_type,
             fp.name as prompt_name, fp.description as prompt_description
      FROM faction_submissions fs
      JOIN factions f ON fs.faction_id = f.id
      LEFT JOIN submissions s ON fs.submission_id = s.id
      LEFT JOIN faction_prompts fp ON fs.prompt_id = fp.id
      WHERE fs.trainer_id = $1
    `;
    const params: unknown[] = [trainerId];

    if (factionId !== undefined) {
      query += ' AND fs.faction_id = $2';
      params.push(factionId);
    }

    query += ' ORDER BY fs.created_at DESC';

    const result = await db.query<FactionSubmissionWithDetailsRow>(query, params);
    return result.rows.map(normalizeFactionSubmissionWithDetails);
  }

  async hasTrainerUsedSubmission(trainerId: number, submissionId: number): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM faction_submissions WHERE trainer_id = $1 AND submission_id = $2',
      [trainerId, submissionId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  private calculateBaseScore(trainerStatus: TrainerStatus, taskSize: TaskSize, specialBonus: boolean): number {
    let baseScore = 10;

    // Add trainer status bonus
    if (trainerStatus === 'alone') {
      baseScore += 10;
    } else if (trainerStatus === 'with_others') {
      baseScore += 20;
    }

    // Add task size bonus
    if (taskSize === 'medium') {
      baseScore += 10;
    } else if (taskSize === 'large') {
      baseScore += 20;
    }

    // Add special bonus
    if (specialBonus) {
      baseScore += 20;
    }

    return baseScore;
  }

  override async create(input: FactionSubmissionCreateInput): Promise<FactionSubmission> {
    // Calculate base score
    const baseScore = this.calculateBaseScore(
      input.trainerStatus,
      input.taskSize,
      input.specialBonus ?? false
    );

    // Get prompt modifier if applicable
    let promptModifier = 0;
    if (input.promptId) {
      const promptResult = await db.query<{ modifier: number }>(
        'SELECT modifier FROM faction_prompts WHERE id = $1',
        [input.promptId]
      );
      const promptRow = promptResult.rows[0];
      if (promptRow) {
        promptModifier = promptRow.modifier;
      }
    }

    const finalScore = input.customScore ?? baseScore + promptModifier;

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO faction_submissions (
          trainer_id, faction_id, submission_id, prompt_id,
          trainer_status, task_size, special_bonus,
          base_score, prompt_modifier, final_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        input.trainerId,
        input.factionId,
        input.submissionId ?? null,
        input.promptId ?? null,
        input.trainerStatus,
        input.taskSize,
        input.specialBonus ?? false,
        baseScore,
        promptModifier,
        finalScore,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction submission');
    }
    const submission = await this.findById(insertedRow.id);
    if (!submission) {
      throw new Error('Failed to create faction submission');
    }
    return submission;
  }

  override async update(id: number, _input: FactionSubmissionUpdateInput): Promise<FactionSubmission> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Faction submission not found');
    }
    // Faction submissions are generally immutable after creation
    return existing;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_submissions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getTrainerTotalScore(trainerId: number, factionId: number): Promise<number> {
    const result = await db.query<{ total: string | null }>(
      'SELECT SUM(final_score) as total FROM faction_submissions WHERE trainer_id = $1 AND faction_id = $2',
      [trainerId, factionId]
    );
    return parseInt(result.rows[0]?.total ?? '0', 10);
  }

  async getSubmissionStats(trainerId: number, factionId?: number): Promise<{
    totalSubmissions: number;
    totalScore: number;
    avgScore: number;
    largeTaskCount: number;
    withOthersCount: number;
  }> {
    let query = `
      SELECT
        COUNT(*) as total_submissions,
        COALESCE(SUM(final_score), 0) as total_score,
        COALESCE(AVG(final_score), 0) as avg_score,
        COUNT(CASE WHEN task_size = 'large' THEN 1 END) as large_task_count,
        COUNT(CASE WHEN trainer_status = 'with_others' THEN 1 END) as with_others_count
      FROM faction_submissions
      WHERE trainer_id = $1
    `;
    const params: unknown[] = [trainerId];

    if (factionId !== undefined) {
      query += ' AND faction_id = $2';
      params.push(factionId);
    }

    const result = await db.query<{
      total_submissions: string;
      total_score: string;
      avg_score: string;
      large_task_count: string;
      with_others_count: string;
    }>(query, params);

    const stats = result.rows[0];
    if (!stats) {
      return {
        totalSubmissions: 0,
        totalScore: 0,
        avgScore: 0,
        largeTaskCount: 0,
        withOthersCount: 0,
      };
    }
    return {
      totalSubmissions: parseInt(stats.total_submissions ?? '0', 10),
      totalScore: parseInt(stats.total_score ?? '0', 10),
      avgScore: parseFloat(stats.avg_score ?? '0'),
      largeTaskCount: parseInt(stats.large_task_count ?? '0', 10),
      withOthersCount: parseInt(stats.with_others_count ?? '0', 10),
    };
  }

  async getFactionRelationships(factionId: number): Promise<{ relatedFactionId: number; standingModifier: number }[]> {
    const result = await db.query<{ related_faction_id: number; standing_modifier: number }>(
      'SELECT related_faction_id, standing_modifier FROM faction_relationships WHERE faction_id = $1',
      [factionId]
    );
    return result.rows.map(row => ({
      relatedFactionId: row.related_faction_id,
      standingModifier: row.standing_modifier,
    }));
  }
}
