import { BaseRepository } from './base.repository';
import { db } from '../database';

export type HolidayDateRow = {
  id: number;
  holiday: string;
  year: number;
  start_date: string;
  end_date: string;
  created_at: Date;
  updated_at: Date;
};

export type HolidayDate = {
  id: number;
  holiday: string;
  year: number;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HolidayDateCreateInput = {
  holiday: string;
  year: number;
  startDate: string;
  endDate: string;
};

export type HolidayDateUpdateInput = Partial<HolidayDateCreateInput>;

const normalize = (row: HolidayDateRow): HolidayDate => ({
  id: row.id,
  holiday: row.holiday,
  year: row.year,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class HolidayDateRepository extends BaseRepository<
  HolidayDate,
  HolidayDateCreateInput,
  HolidayDateUpdateInput
> {
  constructor() {
    super('holiday_dates');
  }

  override async findById(id: number): Promise<HolidayDate | null> {
    const result = await db.query<HolidayDateRow>(
      'SELECT * FROM holiday_dates WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findAll(): Promise<HolidayDate[]> {
    const result = await db.query<HolidayDateRow>(
      'SELECT * FROM holiday_dates ORDER BY year DESC, holiday ASC'
    );
    return result.rows.map(normalize);
  }

  async findByYear(year: number): Promise<HolidayDate[]> {
    const result = await db.query<HolidayDateRow>(
      'SELECT * FROM holiday_dates WHERE year = $1 ORDER BY start_date ASC',
      [year]
    );
    return result.rows.map(normalize);
  }

  async findByHolidayAndYear(holiday: string, year: number): Promise<HolidayDate | null> {
    const result = await db.query<HolidayDateRow>(
      'SELECT * FROM holiday_dates WHERE holiday = $1 AND year = $2',
      [holiday, year]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  override async create(input: HolidayDateCreateInput): Promise<HolidayDate> {
    const result = await db.query<HolidayDateRow>(
      `INSERT INTO holiday_dates (holiday, year, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.holiday, input.year, input.startDate, input.endDate]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create holiday date'); }
    return normalize(row);
  }

  override async update(id: number, input: HolidayDateUpdateInput): Promise<HolidayDate> {
    const existing = await this.findById(id);
    if (!existing) { throw new Error('Holiday date not found'); }

    const result = await db.query<HolidayDateRow>(
      `UPDATE holiday_dates
       SET holiday = $1, year = $2, start_date = $3, end_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        input.holiday ?? existing.holiday,
        input.year ?? existing.year,
        input.startDate ?? existing.startDate,
        input.endDate ?? existing.endDate,
        id,
      ]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to update holiday date'); }
    return normalize(row);
  }

  async upsert(input: HolidayDateCreateInput): Promise<HolidayDate> {
    const result = await db.query<HolidayDateRow>(
      `INSERT INTO holiday_dates (holiday, year, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (holiday, year) DO UPDATE SET
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         updated_at = NOW()
       RETURNING *`,
      [input.holiday, input.year, input.startDate, input.endDate]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to upsert holiday date'); }
    return normalize(row);
  }
}
