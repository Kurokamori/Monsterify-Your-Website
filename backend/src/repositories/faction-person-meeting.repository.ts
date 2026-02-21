import { BaseRepository } from './base.repository';
import { db } from '../database';

export type FactionPersonMeetingRow = {
  id: number;
  trainer_id: number;
  person_id: number;
  submission_id: number | null;
  met_at: Date;
};

export type FactionPersonMeeting = {
  id: number;
  trainerId: number;
  personId: number;
  submissionId: number | null;
  metAt: Date;
};

export type FactionPersonMeetingWithDetails = FactionPersonMeeting & {
  personName: string | null;
  personAlias: string | null;
  personRole: string | null;
  personImages: Record<string, string>;
  factionId: number | null;
  factionName: string | null;
};

export type FactionPersonMeetingCreateInput = {
  trainerId: number;
  personId: number;
  submissionId?: number | null;
};

export type FactionPersonMeetingUpdateInput = Partial<FactionPersonMeetingCreateInput>;

const parseJsonField = <T>(value: string | object | null, defaultValue: T): T => {
  if (!value) {return defaultValue;}
  if (typeof value === 'object') {return value as T;}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return defaultValue;
    }
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

const normalizeFactionPersonMeeting = (row: FactionPersonMeetingRow): FactionPersonMeeting => ({
  id: row.id,
  trainerId: row.trainer_id,
  personId: row.person_id,
  submissionId: row.submission_id,
  metAt: row.met_at,
});

type FactionPersonMeetingWithDetailsRow = FactionPersonMeetingRow & {
  person_name: string | null;
  person_alias: string | null;
  person_role: string | null;
  person_images: string | object | null;
  faction_id: number | null;
  faction_name: string | null;
};

const normalizeFactionPersonMeetingWithDetails = (row: FactionPersonMeetingWithDetailsRow): FactionPersonMeetingWithDetails => ({
  ...normalizeFactionPersonMeeting(row),
  personName: row.person_name,
  personAlias: row.person_alias,
  personRole: row.person_role,
  personImages: parseJsonField(row.person_images, {}),
  factionId: row.faction_id,
  factionName: row.faction_name,
});

export class FactionPersonMeetingRepository extends BaseRepository<
  FactionPersonMeeting,
  FactionPersonMeetingCreateInput,
  FactionPersonMeetingUpdateInput
> {
  constructor() {
    super('faction_person_meetings');
  }

  override async findById(id: number): Promise<FactionPersonMeetingWithDetails | null> {
    const result = await db.query<FactionPersonMeetingWithDetailsRow>(
      `
        SELECT fpm.*, fp.name as person_name, fp.alias as person_alias,
               fp.role as person_role, fp.images as person_images,
               fp.faction_id, f.name as faction_name
        FROM faction_person_meetings fpm
        JOIN faction_people fp ON fpm.person_id = fp.id
        LEFT JOIN factions f ON fp.faction_id = f.id
        WHERE fpm.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeFactionPersonMeetingWithDetails(row) : null;
  }

  async hasMet(trainerId: number, personId: number): Promise<FactionPersonMeeting | null> {
    const result = await db.query<FactionPersonMeetingRow>(
      `
        SELECT * FROM faction_person_meetings
        WHERE trainer_id = $1 AND person_id = $2
      `,
      [trainerId, personId]
    );
    const row = result.rows[0];
    return row ? normalizeFactionPersonMeeting(row) : null;
  }

  async getTrainerMetPeople(trainerId: number, factionId: number): Promise<FactionPersonMeetingWithDetails[]> {
    const result = await db.query<FactionPersonMeetingWithDetailsRow>(
      `
        SELECT fpm.*, fp.name as person_name, fp.alias as person_alias,
               fp.role as person_role, fp.images as person_images,
               fp.faction_id, f.name as faction_name
        FROM faction_person_meetings fpm
        JOIN faction_people fp ON fpm.person_id = fp.id
        LEFT JOIN factions f ON fp.faction_id = f.id
        WHERE fpm.trainer_id = $1 AND fp.faction_id = $2
        ORDER BY fpm.met_at DESC
      `,
      [trainerId, factionId]
    );
    return result.rows.map(normalizeFactionPersonMeetingWithDetails);
  }

  async getAllMetPeople(trainerId: number): Promise<FactionPersonMeetingWithDetails[]> {
    const result = await db.query<FactionPersonMeetingWithDetailsRow>(
      `
        SELECT fpm.*, fp.name as person_name, fp.alias as person_alias,
               fp.role as person_role, fp.images as person_images,
               fp.faction_id, f.name as faction_name
        FROM faction_person_meetings fpm
        JOIN faction_people fp ON fpm.person_id = fp.id
        LEFT JOIN factions f ON fp.faction_id = f.id
        WHERE fpm.trainer_id = $1
        ORDER BY fpm.met_at DESC
      `,
      [trainerId]
    );
    return result.rows.map(normalizeFactionPersonMeetingWithDetails);
  }

  override async create(input: FactionPersonMeetingCreateInput): Promise<FactionPersonMeeting> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO faction_person_meetings (trainer_id, person_id, submission_id, met_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [
        input.trainerId,
        input.personId,
        input.submissionId ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction person meeting');
    }
    const meeting = await this.findById(insertedRow.id);
    if (!meeting) {
      throw new Error('Failed to create faction person meeting');
    }
    return meeting;
  }

  override async update(id: number, _input: FactionPersonMeetingUpdateInput): Promise<FactionPersonMeeting> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Faction person meeting not found');
    }
    // Meetings are generally immutable
    return existing;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_person_meetings WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getAvailableSubmissionsForMeeting(trainerId: number): Promise<{ id: number; title: string; createdAt: Date }[]> {
    const result = await db.query<{ id: number; title: string; created_at: Date }>(
      `
        SELECT s.id, s.title, s.created_at
        FROM submissions s
        WHERE s.trainer_id = $1
        AND s.id NOT IN (
          SELECT fs.submission_id FROM faction_submissions fs
          WHERE fs.trainer_id = $1 AND fs.submission_id IS NOT NULL
        )
        AND s.id NOT IN (
          SELECT ft.submission_id FROM faction_tributes ft
          WHERE ft.trainer_id = $1 AND ft.submission_id IS NOT NULL
        )
        AND s.id NOT IN (
          SELECT fpm.submission_id FROM faction_person_meetings fpm
          WHERE fpm.trainer_id = $1 AND fpm.submission_id IS NOT NULL
        )
        ORDER BY s.created_at DESC
      `,
      [trainerId]
    );
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
    }));
  }

  async canMeet(trainerId: number, personId: number): Promise<boolean> {
    // Get person's standing requirement
    const person = await db.query<{ faction_id: number; standing_requirement: number }>(
      'SELECT faction_id, standing_requirement FROM faction_people WHERE id = $1',
      [personId]
    );

    if (person.rows.length === 0) {
      return false;
    }

    const personRow = person.rows[0];
    if (!personRow) {
      return false;
    }

    const { faction_id, standing_requirement } = personRow;

    // Get trainer's standing with the faction
    const standing = await db.query<{ current_standing: number }>(
      'SELECT current_standing FROM faction_standings WHERE trainer_id = $1 AND faction_id = $2',
      [trainerId, faction_id]
    );

    const standingRow = standing.rows[0];
    if (!standingRow) {
      return false;
    }

    // Check if absolute value of standing meets requirement
    return Math.abs(standingRow.current_standing) >= Math.abs(standing_requirement);
  }

  async getMetPeopleCount(trainerId: number, factionId?: number): Promise<number> {
    let query = `
      SELECT COUNT(DISTINCT fpm.person_id) as count
      FROM faction_person_meetings fpm
      JOIN faction_people fp ON fpm.person_id = fp.id
      WHERE fpm.trainer_id = $1
    `;
    const params: unknown[] = [trainerId];

    if (factionId !== undefined) {
      query += ' AND fp.faction_id = $2';
      params.push(factionId);
    }

    const result = await db.query<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
}
