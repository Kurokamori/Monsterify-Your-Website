import { BaseRepository } from './base.repository';
import { db } from '../database';

export type TradeStatus = 'pending' | 'offered' | 'accepted' | 'completed' | 'cancelled' | 'rejected';

export type TradeRow = {
  id: number;
  title: string | null;
  initiator_trainer_id: number;
  recipient_trainer_id: number | null;
  initiator_monsters: string;
  recipient_monsters: string;
  initiator_items: string;
  recipient_items: string;
  notes: string | null;
  status: TradeStatus;
  created_at: Date;
  updated_at: Date;
};

export type TradeWithNames = TradeRow & {
  initiator_trainer_name: string;
  recipient_trainer_name: string | null;
};

export type Trade = {
  id: number;
  title: string | null;
  initiatorTrainerId: number;
  recipientTrainerId: number | null;
  initiatorMonsters: number[];
  recipientMonsters: number[];
  initiatorItems: Record<string, number>;
  recipientItems: Record<string, number>;
  notes: string | null;
  status: TradeStatus;
  initiatorTrainerName: string;
  recipientTrainerName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TradeCreateInput = {
  title?: string | null;
  initiatorTrainerId: number;
  recipientTrainerId?: number | null;
  initiatorMonsters?: number[];
  recipientMonsters?: number[];
  initiatorItems?: Record<string, number>;
  recipientItems?: Record<string, number>;
  notes?: string | null;
  status?: TradeStatus;
};

export type TradeUpdateInput = {
  title?: string | null;
  recipientTrainerId?: number | null;
  initiatorMonsters?: number[];
  recipientMonsters?: number[];
  initiatorItems?: Record<string, number>;
  recipientItems?: Record<string, number>;
  notes?: string | null;
  status?: TradeStatus;
};

export type TradeQueryOptions = {
  page?: number;
  limit?: number;
  status?: TradeStatus | 'all';
};

export type PaginatedTrades = {
  data: Trade[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const parseJsonField = <T>(value: string | null, defaultValue: T): T => {
  if (!value) {return defaultValue;}
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

const normalizeTrade = (row: TradeWithNames): Trade => ({
  id: row.id,
  title: row.title,
  initiatorTrainerId: row.initiator_trainer_id,
  recipientTrainerId: row.recipient_trainer_id,
  initiatorMonsters: parseJsonField<number[]>(row.initiator_monsters, []),
  recipientMonsters: parseJsonField<number[]>(row.recipient_monsters, []),
  initiatorItems: parseJsonField<Record<string, number>>(row.initiator_items, {}),
  recipientItems: parseJsonField<Record<string, number>>(row.recipient_items, {}),
  notes: row.notes,
  status: row.status,
  initiatorTrainerName: row.initiator_trainer_name,
  recipientTrainerName: row.recipient_trainer_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const BASE_SELECT = `
  SELECT t.*,
         it.name as initiator_trainer_name,
         rt.name as recipient_trainer_name
  FROM trades t
  JOIN trainers it ON t.initiator_trainer_id = it.id
  LEFT JOIN trainers rt ON t.recipient_trainer_id = rt.id
`;

export class TradeRepository extends BaseRepository<Trade, TradeCreateInput, TradeUpdateInput> {
  constructor() {
    super('trades');
  }

  async findAll(options: TradeQueryOptions = {}): Promise<PaginatedTrades> {
    const { page = 1, limit = 10, status = 'pending' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM trades t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get paginated data
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const dataResult = await db.query<TradeWithNames>(
      `
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      data: dataResult.rows.map(normalizeTrade),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async findById(id: number): Promise<Trade | null> {
    const result = await db.query<TradeWithNames>(
      `${BASE_SELECT} WHERE t.id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeTrade(row) : null;
  }

  async findByTrainerId(trainerId: number): Promise<Trade[]> {
    const result = await db.query<TradeWithNames>(
      `${BASE_SELECT} WHERE t.initiator_trainer_id = $1 OR t.recipient_trainer_id = $1 ORDER BY t.created_at DESC`,
      [trainerId]
    );
    return result.rows.map(normalizeTrade);
  }

  override async create(input: TradeCreateInput): Promise<Trade> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO trades (
          title, initiator_trainer_id, recipient_trainer_id,
          initiator_monsters, recipient_monsters,
          initiator_items, recipient_items,
          notes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        input.title ?? null,
        input.initiatorTrainerId,
        input.recipientTrainerId ?? null,
        JSON.stringify(input.initiatorMonsters ?? []),
        JSON.stringify(input.recipientMonsters ?? []),
        JSON.stringify(input.initiatorItems ?? {}),
        JSON.stringify(input.recipientItems ?? {}),
        input.notes ?? null,
        input.status ?? 'pending',
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create trade');
    }
    const trade = await this.findById(row.id);
    if (!trade) {
      throw new Error('Failed to retrieve newly created trade');
    }
    return trade;
  }

  override async update(id: number, input: TradeUpdateInput): Promise<Trade> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.recipientTrainerId !== undefined) {
      values.push(input.recipientTrainerId);
      updates.push(`recipient_trainer_id = $${values.length}`);
    }
    if (input.initiatorMonsters !== undefined) {
      values.push(JSON.stringify(input.initiatorMonsters));
      updates.push(`initiator_monsters = $${values.length}`);
    }
    if (input.recipientMonsters !== undefined) {
      values.push(JSON.stringify(input.recipientMonsters));
      updates.push(`recipient_monsters = $${values.length}`);
    }
    if (input.initiatorItems !== undefined) {
      values.push(JSON.stringify(input.initiatorItems));
      updates.push(`initiator_items = $${values.length}`);
    }
    if (input.recipientItems !== undefined) {
      values.push(JSON.stringify(input.recipientItems));
      updates.push(`recipient_items = $${values.length}`);
    }
    if (input.notes !== undefined) {
      values.push(input.notes);
      updates.push(`notes = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Trade not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE trades SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Trade not found after update');
    }
    return updated;
  }

  async updateStatus(id: number, status: TradeStatus): Promise<Trade> {
    return this.update(id, { status });
  }
}
