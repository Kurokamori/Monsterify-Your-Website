import { BaseRepository } from './base.repository';
import { db } from '../database';

// =============================================================================
// Row / Domain Types
// =============================================================================

export type EventRow = {
  id: number;
  event_id: string;
  title: string;
  start_date: Date;
  end_date: Date;
  description: string;
  image_url: string | null;
  content: string;
  is_multi_part: boolean;
  color: string | null;
  created_at: Date;
  updated_at: Date;
};

export type GameEvent = {
  id: number;
  eventId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  imageUrl: string | null;
  content: string;
  isMultiPart: boolean;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventPartRow = {
  id: number;
  event_id: number;
  part_id: string;
  title: string;
  content: string;
  sort_order: number;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type EventPart = {
  id: number;
  eventId: number;
  partId: string;
  title: string;
  content: string;
  sortOrder: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventCreateInput = {
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  imageUrl?: string | null;
  content?: string;
  isMultiPart?: boolean;
  color?: string | null;
};

export type EventUpdateInput = {
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  imageUrl?: string | null;
  content?: string;
  color?: string | null;
};

export type EventPartCreateInput = {
  eventId: number;
  partId: string;
  title: string;
  content: string;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type EventPartUpdateInput = {
  title?: string;
  content?: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type GameEventWithParts = GameEvent & {
  parts: EventPart[];
};

// =============================================================================
// Normalizers
// =============================================================================

const normalizeEvent = (row: EventRow): GameEvent => ({
  id: row.id,
  eventId: row.event_id,
  title: row.title,
  startDate: row.start_date,
  endDate: row.end_date,
  description: row.description,
  imageUrl: row.image_url,
  content: row.content,
  isMultiPart: row.is_multi_part,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizePart = (row: EventPartRow): EventPart => ({
  id: row.id,
  eventId: row.event_id,
  partId: row.part_id,
  title: row.title,
  content: row.content,
  sortOrder: row.sort_order,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// =============================================================================
// Repository
// =============================================================================

export class EventRepository extends BaseRepository<
  GameEvent,
  EventCreateInput,
  EventUpdateInput
> {
  constructor() {
    super('events');
  }

  // ===========================================================================
  // Event CRUD
  // ===========================================================================

  override async findById(id: number): Promise<GameEvent | null> {
    const row = await db.maybeOne<EventRow>(
      'SELECT * FROM events WHERE id = $1',
      [id],
    );
    return row ? normalizeEvent(row) : null;
  }

  async findByEventId(eventId: string): Promise<GameEvent | null> {
    const row = await db.maybeOne<EventRow>(
      'SELECT * FROM events WHERE event_id = $1',
      [eventId],
    );
    return row ? normalizeEvent(row) : null;
  }

  async findAll(): Promise<GameEvent[]> {
    const rows = await db.many<EventRow>(
      'SELECT * FROM events ORDER BY start_date DESC',
    );
    return rows.map(normalizeEvent);
  }

  async findAllWithParts(): Promise<GameEventWithParts[]> {
    const events = await this.findAll();
    const results: GameEventWithParts[] = [];
    for (const event of events) {
      const parts = event.isMultiPart ? await this.getPartsByEventId(event.id) : [];
      results.push({ ...event, parts });
    }
    return results;
  }

  async findByEventIdWithParts(eventId: string): Promise<GameEventWithParts | null> {
    const event = await this.findByEventId(eventId);
    if (!event) { return null; }

    const parts = event.isMultiPart ? await this.getPartsByEventId(event.id) : [];
    return { ...event, parts };
  }

  override async create(input: EventCreateInput): Promise<GameEvent> {
    const row = await db.one<EventRow>(
      `INSERT INTO events (event_id, title, start_date, end_date, description, image_url, content, is_multi_part, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.eventId,
        input.title,
        input.startDate,
        input.endDate,
        input.description ?? '',
        input.imageUrl ?? null,
        input.content ?? '',
        input.isMultiPart ?? false,
        input.color ?? null,
      ],
    );
    return normalizeEvent(row);
  }

  override async update(id: number, input: EventUpdateInput): Promise<GameEvent> {
    const updates: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.startDate !== undefined) {
      values.push(input.startDate);
      updates.push(`start_date = $${values.length}`);
    }
    if (input.endDate !== undefined) {
      values.push(input.endDate);
      updates.push(`end_date = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.imageUrl !== undefined) {
      values.push(input.imageUrl);
      updates.push(`image_url = $${values.length}`);
    }
    if (input.content !== undefined) {
      values.push(input.content);
      updates.push(`content = $${values.length}`);
    }
    if (input.color !== undefined) {
      values.push(input.color);
      updates.push(`color = $${values.length}`);
    }

    values.push(id);
    const row = await db.one<EventRow>(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return normalizeEvent(row);
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===========================================================================
  // Parts
  // ===========================================================================

  async getPartsByEventId(eventId: number): Promise<EventPart[]> {
    const rows = await db.many<EventPartRow>(
      'SELECT * FROM event_parts WHERE event_id = $1 ORDER BY sort_order',
      [eventId],
    );
    return rows.map(normalizePart);
  }

  async getPartByPartId(eventId: number, partId: string): Promise<EventPart | null> {
    const row = await db.maybeOne<EventPartRow>(
      'SELECT * FROM event_parts WHERE event_id = $1 AND part_id = $2',
      [eventId, partId],
    );
    return row ? normalizePart(row) : null;
  }

  async createPart(input: EventPartCreateInput): Promise<EventPart> {
    const row = await db.one<EventPartRow>(
      `INSERT INTO event_parts (event_id, part_id, title, content, sort_order, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [input.eventId, input.partId, input.title, input.content, input.sortOrder, input.startDate ?? null, input.endDate ?? null],
    );
    return normalizePart(row);
  }

  async updatePart(id: number, input: EventPartUpdateInput): Promise<EventPart> {
    const updates: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.content !== undefined) {
      values.push(input.content);
      updates.push(`content = $${values.length}`);
    }
    if (input.startDate !== undefined) {
      values.push(input.startDate);
      updates.push(`start_date = $${values.length}`);
    }
    if (input.endDate !== undefined) {
      values.push(input.endDate);
      updates.push(`end_date = $${values.length}`);
    }

    values.push(id);
    const row = await db.one<EventPartRow>(
      `UPDATE event_parts SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return normalizePart(row);
  }

  async deletePart(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM event_parts WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getMaxPartOrder(eventId: number): Promise<number> {
    const row = await db.maybeOne<{ max_order: number | null }>(
      'SELECT MAX(sort_order) as max_order FROM event_parts WHERE event_id = $1',
      [eventId],
    );
    return row?.max_order ?? 0;
  }
}
