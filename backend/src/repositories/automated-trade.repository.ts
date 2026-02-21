import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AutomatedTradeRow = {
  id: number;
  from_trainer_id: number;
  to_trainer_id: number;
  from_items: string | object | null;
  to_items: string | object | null;
  from_monsters: string | object | null;
  to_monsters: string | object | null;
  executed_at: Date;
};

export type AutomatedTrade = {
  id: number;
  fromTrainerId: number;
  toTrainerId: number;
  fromItems: Record<string, Record<string, number>>;
  toItems: Record<string, Record<string, number>>;
  fromMonsters: number[];
  toMonsters: number[];
  executedAt: Date;
};

export type AutomatedTradeWithDetails = AutomatedTrade & {
  fromTrainerName: string | null;
  toTrainerName: string | null;
};

export type AutomatedTradeCreateInput = {
  fromTrainerId: number;
  toTrainerId: number;
  fromItems?: Record<string, Record<string, number>>;
  toItems?: Record<string, Record<string, number>>;
  fromMonsters?: number[];
  toMonsters?: number[];
};

export type AutomatedTradeUpdateInput = Partial<AutomatedTradeCreateInput>;

export type PaginatedAutomatedTrades = {
  data: AutomatedTradeWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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

const normalizeAutomatedTrade = (row: AutomatedTradeRow): AutomatedTrade => ({
  id: row.id,
  fromTrainerId: row.from_trainer_id,
  toTrainerId: row.to_trainer_id,
  fromItems: parseJsonField(row.from_items, {}),
  toItems: parseJsonField(row.to_items, {}),
  fromMonsters: parseJsonField(row.from_monsters, []),
  toMonsters: parseJsonField(row.to_monsters, []),
  executedAt: row.executed_at,
});

type AutomatedTradeWithDetailsRow = AutomatedTradeRow & {
  from_trainer_name: string | null;
  to_trainer_name: string | null;
};

const normalizeAutomatedTradeWithDetails = (row: AutomatedTradeWithDetailsRow): AutomatedTradeWithDetails => ({
  ...normalizeAutomatedTrade(row),
  fromTrainerName: row.from_trainer_name,
  toTrainerName: row.to_trainer_name,
});

export class AutomatedTradeRepository extends BaseRepository<
  AutomatedTrade,
  AutomatedTradeCreateInput,
  AutomatedTradeUpdateInput
> {
  constructor() {
    super('automated_trades');
  }

  override async findById(id: number): Promise<AutomatedTradeWithDetails | null> {
    const result = await db.query<AutomatedTradeWithDetailsRow>(
      `
        SELECT at.*, ft.name as from_trainer_name, tt.name as to_trainer_name
        FROM automated_trades at
        JOIN trainers ft ON at.from_trainer_id = ft.id
        JOIN trainers tt ON at.to_trainer_id = tt.id
        WHERE at.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAutomatedTradeWithDetails(row) : null;
  }

  async findByTrainerId(trainerId: number, options: { page?: number; limit?: number } = {}): Promise<PaginatedAutomatedTrades> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query<{ total: string }>(
      `
        SELECT COUNT(*) as total FROM automated_trades
        WHERE from_trainer_id = $1 OR to_trainer_id = $1
      `,
      [trainerId]
    );
    const countRow = countResult.rows[0];
    const total = parseInt(countRow?.total ?? '0', 10);

    // Get trades
    const result = await db.query<AutomatedTradeWithDetailsRow>(
      `
        SELECT at.*, ft.name as from_trainer_name, tt.name as to_trainer_name
        FROM automated_trades at
        JOIN trainers ft ON at.from_trainer_id = ft.id
        JOIN trainers tt ON at.to_trainer_id = tt.id
        WHERE at.from_trainer_id = $1 OR at.to_trainer_id = $1
        ORDER BY at.executed_at DESC
        LIMIT $2 OFFSET $3
      `,
      [trainerId, limit, offset]
    );

    return {
      data: result.rows.map(normalizeAutomatedTradeWithDetails),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async create(input: AutomatedTradeCreateInput): Promise<AutomatedTrade> {
    const fromItemsJson = JSON.stringify(input.fromItems ?? {});
    const toItemsJson = JSON.stringify(input.toItems ?? {});
    const fromMonstersJson = JSON.stringify(input.fromMonsters ?? []);
    const toMonstersJson = JSON.stringify(input.toMonsters ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO automated_trades (
          from_trainer_id, to_trainer_id,
          from_items, to_items,
          from_monsters, to_monsters,
          executed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [
        input.fromTrainerId,
        input.toTrainerId,
        fromItemsJson,
        toItemsJson,
        fromMonstersJson,
        toMonstersJson,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert automated trade');
    }
    const trade = await this.findById(insertedRow.id);
    if (!trade) {
      throw new Error('Failed to create automated trade');
    }
    return trade;
  }

  override async update(id: number, _input: AutomatedTradeUpdateInput): Promise<AutomatedTrade> {
    // Trades are generally immutable after creation
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Automated trade not found');
    }
    return existing;
  }

  async getRecentTrades(limit = 10): Promise<AutomatedTradeWithDetails[]> {
    const result = await db.query<AutomatedTradeWithDetailsRow>(
      `
        SELECT at.*, ft.name as from_trainer_name, tt.name as to_trainer_name
        FROM automated_trades at
        JOIN trainers ft ON at.from_trainer_id = ft.id
        JOIN trainers tt ON at.to_trainer_id = tt.id
        ORDER BY at.executed_at DESC
        LIMIT $1
      `,
      [limit]
    );
    return result.rows.map(normalizeAutomatedTradeWithDetails);
  }

  async getTradesBetweenTrainers(trainerId1: number, trainerId2: number): Promise<AutomatedTradeWithDetails[]> {
    const result = await db.query<AutomatedTradeWithDetailsRow>(
      `
        SELECT at.*, ft.name as from_trainer_name, tt.name as to_trainer_name
        FROM automated_trades at
        JOIN trainers ft ON at.from_trainer_id = ft.id
        JOIN trainers tt ON at.to_trainer_id = tt.id
        WHERE (at.from_trainer_id = $1 AND at.to_trainer_id = $2)
           OR (at.from_trainer_id = $2 AND at.to_trainer_id = $1)
        ORDER BY at.executed_at DESC
      `,
      [trainerId1, trainerId2]
    );
    return result.rows.map(normalizeAutomatedTradeWithDetails);
  }
}
