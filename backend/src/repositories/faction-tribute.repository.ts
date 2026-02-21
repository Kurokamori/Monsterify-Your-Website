import { BaseRepository } from './base.repository';
import { db } from '../database';

export type SubmissionType = 'art' | 'writing';
export type TributeStatus = 'pending' | 'approved' | 'rejected';

export type FactionTributeRow = {
  id: number;
  title_id: number;
  trainer_id: number;
  submission_id: number | null;
  submission_type: SubmissionType;
  submission_url: string | null;
  submission_description: string | null;
  item_requirement: string | null;
  currency_requirement: number;
  status: TributeStatus;
  submitted_at: Date;
  reviewed_at: Date | null;
  reviewed_by: number | null;
};

export type FactionTribute = {
  id: number;
  titleId: number;
  trainerId: number;
  submissionId: number | null;
  submissionType: SubmissionType;
  submissionUrl: string | null;
  submissionDescription: string | null;
  itemRequirement: string | null;
  currencyRequirement: number;
  status: TributeStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: number | null;
};

export type FactionTributeWithDetails = FactionTribute & {
  titleName: string | null;
  titleDescription: string | null;
  factionId: number | null;
  factionName: string | null;
  factionColor: string | null;
  trainerName: string | null;
  reviewerName: string | null;
};

export type FactionTributeCreateInput = {
  titleId: number;
  trainerId: number;
  submissionId?: number | null;
  submissionType: SubmissionType;
  submissionUrl?: string | null;
  submissionDescription?: string | null;
  itemRequirement?: string | null;
  currencyRequirement?: number;
};

export type FactionTributeUpdateInput = {
  status?: TributeStatus;
  reviewedAt?: Date | null;
  reviewedBy?: number | null;
};

const normalizeFactionTribute = (row: FactionTributeRow): FactionTribute => ({
  id: row.id,
  titleId: row.title_id,
  trainerId: row.trainer_id,
  submissionId: row.submission_id,
  submissionType: row.submission_type,
  submissionUrl: row.submission_url,
  submissionDescription: row.submission_description,
  itemRequirement: row.item_requirement,
  currencyRequirement: row.currency_requirement,
  status: row.status,
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at,
  reviewedBy: row.reviewed_by,
});

type FactionTributeWithDetailsRow = FactionTributeRow & {
  title_name: string | null;
  title_description: string | null;
  faction_id: number | null;
  faction_name: string | null;
  faction_color: string | null;
  trainer_name: string | null;
  reviewer_name: string | null;
};

const normalizeFactionTributeWithDetails = (row: FactionTributeWithDetailsRow): FactionTributeWithDetails => ({
  ...normalizeFactionTribute(row),
  titleName: row.title_name,
  titleDescription: row.title_description,
  factionId: row.faction_id,
  factionName: row.faction_name,
  factionColor: row.faction_color,
  trainerName: row.trainer_name,
  reviewerName: row.reviewer_name,
});

export class FactionTributeRepository extends BaseRepository<
  FactionTribute,
  FactionTributeCreateInput,
  FactionTributeUpdateInput
> {
  constructor() {
    super('faction_tributes');
  }

  override async findById(id: number): Promise<FactionTributeWithDetails | null> {
    const result = await db.query<FactionTributeWithDetailsRow>(
      `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               fti.faction_id, f.name as faction_name, f.color as faction_color,
               t.name as trainer_name, u.username as reviewer_name
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        JOIN trainers t ON ft.trainer_id = t.id
        LEFT JOIN users u ON ft.reviewed_by = u.id
        WHERE ft.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeFactionTributeWithDetails(row) : null;
  }

  async findByTrainerId(trainerId: number): Promise<FactionTributeWithDetails[]> {
    const result = await db.query<FactionTributeWithDetailsRow>(
      `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               fti.faction_id, f.name as faction_name, f.color as faction_color,
               t.name as trainer_name, u.username as reviewer_name
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        JOIN trainers t ON ft.trainer_id = t.id
        LEFT JOIN users u ON ft.reviewed_by = u.id
        WHERE ft.trainer_id = $1
        ORDER BY ft.submitted_at DESC
      `,
      [trainerId]
    );
    return result.rows.map(normalizeFactionTributeWithDetails);
  }

  async findByTrainerAndFaction(trainerId: number, factionId: number): Promise<FactionTributeWithDetails[]> {
    const result = await db.query<FactionTributeWithDetailsRow>(
      `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               fti.faction_id, f.name as faction_name, f.color as faction_color,
               t.name as trainer_name, u.username as reviewer_name
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        JOIN trainers t ON ft.trainer_id = t.id
        LEFT JOIN users u ON ft.reviewed_by = u.id
        WHERE ft.trainer_id = $1 AND fti.faction_id = $2
        ORDER BY ft.submitted_at DESC
      `,
      [trainerId, factionId]
    );
    return result.rows.map(normalizeFactionTributeWithDetails);
  }

  async findPending(): Promise<FactionTributeWithDetails[]> {
    const result = await db.query<FactionTributeWithDetailsRow>(
      `
        SELECT ft.*, fti.name as title_name, fti.description as title_description,
               fti.faction_id, f.name as faction_name, f.color as faction_color,
               t.name as trainer_name, u.username as reviewer_name
        FROM faction_tributes ft
        JOIN faction_titles fti ON ft.title_id = fti.id
        JOIN factions f ON fti.faction_id = f.id
        JOIN trainers t ON ft.trainer_id = t.id
        LEFT JOIN users u ON ft.reviewed_by = u.id
        WHERE ft.status = 'pending'
        ORDER BY ft.submitted_at ASC
      `
    );
    return result.rows.map(normalizeFactionTributeWithDetails);
  }

  override async create(input: FactionTributeCreateInput): Promise<FactionTribute> {
    // Validate submission type
    if (!['art', 'writing'].includes(input.submissionType)) {
      throw new Error('Invalid submission type. Must be "art" or "writing".');
    }

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO faction_tributes (
          title_id, trainer_id, submission_id, submission_type,
          submission_url, submission_description,
          item_requirement, currency_requirement, status, submitted_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [
        input.titleId,
        input.trainerId,
        input.submissionId ?? null,
        input.submissionType,
        input.submissionUrl ?? null,
        input.submissionDescription ?? null,
        input.itemRequirement ?? null,
        input.currencyRequirement ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction tribute');
    }
    const tribute = await this.findById(insertedRow.id);
    if (!tribute) {
      throw new Error('Failed to create faction tribute');
    }
    return tribute;
  }

  override async update(id: number, input: FactionTributeUpdateInput): Promise<FactionTribute> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.reviewedAt !== undefined) {
      values.push(input.reviewedAt);
      updates.push(`reviewed_at = $${values.length}`);
    }
    if (input.reviewedBy !== undefined) {
      values.push(input.reviewedBy);
      updates.push(`reviewed_by = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Faction tribute not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE faction_tributes SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Faction tribute not found after update');
    }
    return updated;
  }

  async review(id: number, status: 'approved' | 'rejected', reviewerId: number): Promise<FactionTribute> {
    const tribute = await this.findById(id);
    if (!tribute) {
      throw new Error('Tribute not found');
    }

    if (tribute.status !== 'pending') {
      throw new Error('Tribute has already been reviewed');
    }

    return this.update(id, {
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    });
  }

  async hasSubmissionBeenUsed(submissionId: number): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM faction_tributes WHERE submission_id = $1',
      [submissionId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  async getTitleDetails(titleId: number): Promise<{
    id: number;
    factionId: number;
    name: string;
    standingRequirement: number;
  } | null> {
    const result = await db.query<{
      id: number;
      faction_id: number;
      name: string;
      standing_requirement: number;
    }>(
      'SELECT id, faction_id, name, standing_requirement FROM faction_titles WHERE id = $1',
      [titleId]
    );
    const row = result.rows[0];
    if (!row) {return null;}
    return {
      id: row.id,
      factionId: row.faction_id,
      name: row.name,
      standingRequirement: row.standing_requirement,
    };
  }

  async getApprovedTributesCount(trainerId: number, factionId?: number): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM faction_tributes ft
      JOIN faction_titles fti ON ft.title_id = fti.id
      WHERE ft.trainer_id = $1 AND ft.status = 'approved'
    `;
    const params: unknown[] = [trainerId];

    if (factionId !== undefined) {
      query += ' AND fti.faction_id = $2';
      params.push(factionId);
    }

    const result = await db.query<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_tributes WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
