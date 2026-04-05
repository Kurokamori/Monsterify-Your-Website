import { BaseRepository } from './base.repository';
import { db } from '../database';

export type CalendarEntryRow = {
  id: number;
  title: string;
  details: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: Date;
  updated_at: Date;
};

export type CalendarEntry = {
  id: number;
  title: string;
  details: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CalendarEntryCreateInput = {
  title: string;
  details?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type CalendarEntryUpdateInput = Partial<CalendarEntryCreateInput>;

const normalize = (row: CalendarEntryRow): CalendarEntry => ({
  id: row.id,
  title: row.title,
  details: row.details,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class CalendarEntryRepository extends BaseRepository<
  CalendarEntry,
  CalendarEntryCreateInput,
  CalendarEntryUpdateInput
> {
  constructor() {
    super('calendar_entries');
  }

  override async findById(id: number): Promise<CalendarEntry | null> {
    const result = await db.query<CalendarEntryRow>(
      'SELECT * FROM calendar_entries WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findAll(): Promise<CalendarEntry[]> {
    const result = await db.query<CalendarEntryRow>(
      'SELECT * FROM calendar_entries ORDER BY start_date ASC NULLS LAST, title ASC'
    );
    return result.rows.map(normalize);
  }

  override async create(input: CalendarEntryCreateInput): Promise<CalendarEntry> {
    const result = await db.query<CalendarEntryRow>(
      `INSERT INTO calendar_entries (title, details, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.title, input.details ?? null, input.startDate ?? null, input.endDate ?? null]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create calendar entry');
    }
    return normalize(row);
  }

  override async update(id: number, input: CalendarEntryUpdateInput): Promise<CalendarEntry> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Calendar entry not found');
    }

    const result = await db.query<CalendarEntryRow>(
      `UPDATE calendar_entries
       SET title = $1, details = $2, start_date = $3, end_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        input.title ?? existing.title,
        input.details !== undefined ? input.details : existing.details,
        input.startDate !== undefined ? input.startDate : existing.startDate,
        input.endDate !== undefined ? input.endDate : existing.endDate,
        id,
      ]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to update calendar entry');
    }
    return normalize(row);
  }
}
