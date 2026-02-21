import { BaseRepository } from './base.repository';
import { db } from '../database';

export type BattleLogType = 'action' | 'damage' | 'status' | 'system' | 'message';

export type BattleLogRow = {
  id: number;
  battle_id: number;
  log_type: BattleLogType;
  message: string;
  participant_id: number | null;
  turn_number: number | null;
  log_data: string | object | null;
  created_at: Date;
};

export type BattleLog = {
  id: number;
  battleId: number;
  logType: BattleLogType;
  message: string;
  participantId: number | null;
  turnNumber: number | null;
  logData: Record<string, unknown>;
  createdAt: Date;
};

export type BattleLogWithDetails = BattleLog & {
  trainerName: string | null;
  teamSide: string | null;
};

export type BattleLogCreateInput = {
  battleId: number;
  logType: BattleLogType;
  message: string;
  participantId?: number | null;
  turnNumber?: number | null;
  logData?: Record<string, unknown>;
};

export type BattleLogUpdateInput = Partial<BattleLogCreateInput>;

export type BattleLogQueryOptions = {
  logType?: BattleLogType;
  participantId?: number;
  turnNumber?: number;
  limit?: number;
  offset?: number;
  orderBy?: string;
};

const parseLogData = (value: string | object | null): Record<string, unknown> => {
  if (!value) {return {};}
  if (typeof value === 'object') {return value as Record<string, unknown>;}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return {};
    }
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizeBattleLog = (row: BattleLogRow): BattleLog => ({
  id: row.id,
  battleId: row.battle_id,
  logType: row.log_type,
  message: row.message,
  participantId: row.participant_id,
  turnNumber: row.turn_number,
  logData: parseLogData(row.log_data),
  createdAt: row.created_at,
});

type BattleLogWithDetailsRow = BattleLogRow & {
  trainer_name: string | null;
  team_side: string | null;
};

const normalizeBattleLogWithDetails = (row: BattleLogWithDetailsRow): BattleLogWithDetails => ({
  ...normalizeBattleLog(row),
  trainerName: row.trainer_name,
  teamSide: row.team_side,
});

export class BattleLogRepository extends BaseRepository<
  BattleLog,
  BattleLogCreateInput,
  BattleLogUpdateInput
> {
  constructor() {
    super('battle_logs');
  }

  override async findById(id: number): Promise<BattleLogWithDetails | null> {
    const result = await db.query<BattleLogWithDetailsRow>(
      `
        SELECT bl.*, bp.trainer_name, bp.team_side
        FROM battle_logs bl
        LEFT JOIN battle_participants bp ON bl.participant_id = bp.id
        WHERE bl.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBattleLogWithDetails(row) : null;
  }

  async findByBattleId(battleId: number, options: BattleLogQueryOptions = {}): Promise<BattleLogWithDetails[]> {
    const { logType, participantId, turnNumber, limit = 100, offset = 0, orderBy = 'created_at' } = options;

    const conditions: string[] = ['bl.battle_id = $1'];
    const params: unknown[] = [battleId];

    if (logType) {
      params.push(logType);
      conditions.push(`bl.log_type = $${params.length}`);
    }

    if (participantId) {
      params.push(participantId);
      conditions.push(`bl.participant_id = $${params.length}`);
    }

    if (turnNumber !== undefined) {
      params.push(turnNumber);
      conditions.push(`bl.turn_number = $${params.length}`);
    }

    params.push(limit, offset);

    const result = await db.query<BattleLogWithDetailsRow>(
      `
        SELECT bl.*, bp.trainer_name, bp.team_side
        FROM battle_logs bl
        LEFT JOIN battle_participants bp ON bl.participant_id = bp.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY bl.${orderBy}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return result.rows.map(normalizeBattleLogWithDetails);
  }

  async findRecentByBattleId(battleId: number, limit = 20): Promise<BattleLogWithDetails[]> {
    return this.findByBattleId(battleId, { limit, orderBy: 'created_at DESC' });
  }

  async findByTurn(battleId: number, turnNumber: number): Promise<BattleLogWithDetails[]> {
    return this.findByBattleId(battleId, { turnNumber, orderBy: 'created_at' });
  }

  async findByParticipant(battleId: number, participantId: number): Promise<BattleLogWithDetails[]> {
    return this.findByBattleId(battleId, { participantId, orderBy: 'created_at' });
  }

  override async create(input: BattleLogCreateInput): Promise<BattleLog> {
    const logDataJson = input.logData ? JSON.stringify(input.logData) : '{}';

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO battle_logs (battle_id, log_type, message, participant_id, turn_number, log_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.battleId,
        input.logType,
        input.message,
        input.participantId ?? null,
        input.turnNumber ?? null,
        logDataJson,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert battle log');
    }
    const log = await this.findById(insertedRow.id);
    if (!log) {
      throw new Error('Failed to create battle log');
    }
    return log;
  }

  override async update(id: number, _input: BattleLogUpdateInput): Promise<BattleLog> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Battle log not found');
    }
    // Battle logs are generally immutable after creation
    return existing;
  }

  // Convenience methods for logging specific types
  async logAction(battleId: number, message: string, options: Partial<BattleLogCreateInput> = {}): Promise<BattleLog> {
    return this.create({ battleId, logType: 'action', message, ...options });
  }

  async logDamage(
    battleId: number,
    message: string,
    damageData: Record<string, unknown>,
    options: Partial<BattleLogCreateInput> = {}
  ): Promise<BattleLog> {
    return this.create({ battleId, logType: 'damage', message, logData: damageData, ...options });
  }

  async logStatus(
    battleId: number,
    message: string,
    statusData: Record<string, unknown>,
    options: Partial<BattleLogCreateInput> = {}
  ): Promise<BattleLog> {
    return this.create({ battleId, logType: 'status', message, logData: statusData, ...options });
  }

  async logSystem(battleId: number, message: string, options: Partial<BattleLogCreateInput> = {}): Promise<BattleLog> {
    return this.create({ battleId, logType: 'system', message, ...options });
  }

  async logMessage(
    battleId: number,
    message: string,
    participantId: number,
    options: Partial<BattleLogCreateInput> = {}
  ): Promise<BattleLog> {
    return this.create({ battleId, logType: 'message', message, participantId, ...options });
  }

  async deleteByBattleId(battleId: number): Promise<number> {
    const result = await db.query('DELETE FROM battle_logs WHERE battle_id = $1', [battleId]);
    return result.rowCount ?? 0;
  }

  async clearOldLogs(battleId: number, keepCount = 100): Promise<number> {
    const result = await db.query(
      `
        DELETE FROM battle_logs
        WHERE battle_id = $1
        AND id NOT IN (
          SELECT id FROM battle_logs
          WHERE battle_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        )
      `,
      [battleId, keepCount]
    );
    return result.rowCount ?? 0;
  }
}
