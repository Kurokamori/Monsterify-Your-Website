import { BaseRepository } from './base.repository';
import { db } from '../database';

export type BattleStatus = 'active' | 'completed' | 'cancelled';
export type BattleWinnerType = 'players' | 'opponents' | 'draw' | null;

export type BattleInstanceRow = {
  id: number;
  adventure_id: number | null;
  encounter_id: number | null;
  battle_type: string;
  status: BattleStatus;
  current_turn: number;
  current_participant_index: number;
  turn_time_limit: number | null;
  turn_started_at: Date | null;
  winner_type: BattleWinnerType;
  battle_data: string | object;
  created_by_discord_user_id: string | null;
  created_at: Date;
  completed_at: Date | null;
};

export type BattleInstanceWithDetails = BattleInstanceRow & {
  adventure_title: string | null;
  encounter_type: string | null;
};

export type BattleInstance = {
  id: number;
  adventureId: number | null;
  encounterId: number | null;
  battleType: string;
  status: BattleStatus;
  currentTurn: number;
  currentParticipantIndex: number;
  turnTimeLimit: number | null;
  turnStartedAt: Date | null;
  winnerType: BattleWinnerType;
  battleData: object;
  createdByDiscordUserId: string | null;
  adventureTitle: string | null;
  encounterType: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type BattleCreateInput = {
  adventureId?: number | null;
  encounterId?: number | null;
  battleType: string;
  createdByDiscordUserId?: string | null;
  battleData?: object;
};

export type BattleUpdateInput = {
  status?: BattleStatus;
  currentTurn?: number;
  currentParticipantIndex?: number;
  turnTimeLimit?: number | null;
  turnStartedAt?: Date | null;
  winnerType?: BattleWinnerType;
  battleData?: object;
  completedAt?: Date | null;
};

const parseBattleData = (value: string | object | null): object => {
  if (!value) {return {};}
  if (typeof value === 'object') {return value;}
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizeBattle = (row: BattleInstanceWithDetails): BattleInstance => ({
  id: row.id,
  adventureId: row.adventure_id,
  encounterId: row.encounter_id,
  battleType: row.battle_type,
  status: row.status,
  currentTurn: row.current_turn,
  currentParticipantIndex: row.current_participant_index,
  turnTimeLimit: row.turn_time_limit,
  turnStartedAt: row.turn_started_at,
  winnerType: row.winner_type,
  battleData: parseBattleData(row.battle_data),
  createdByDiscordUserId: row.created_by_discord_user_id,
  adventureTitle: row.adventure_title,
  encounterType: row.encounter_type,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

const BASE_SELECT = `
  SELECT
    bi.*,
    a.title as adventure_title,
    ae.encounter_type
  FROM battle_instances bi
  LEFT JOIN adventures a ON bi.adventure_id = a.id
  LEFT JOIN adventure_encounters ae ON bi.encounter_id = ae.id
`;

export class BattleRepository extends BaseRepository<BattleInstance, BattleCreateInput, BattleUpdateInput> {
  constructor() {
    super('battle_instances');
  }

  override async findById(id: number): Promise<BattleInstance | null> {
    const result = await db.query<BattleInstanceWithDetails>(
      `${BASE_SELECT} WHERE bi.id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBattle(row) : null;
  }

  async findActiveByAdventure(adventureId: number): Promise<BattleInstance | null> {
    const result = await db.query<BattleInstanceWithDetails>(
      `
        ${BASE_SELECT}
        WHERE bi.adventure_id = $1 AND bi.status = 'active'
        ORDER BY bi.created_at DESC
        LIMIT 1
      `,
      [adventureId]
    );
    const row = result.rows[0];
    return row ? normalizeBattle(row) : null;
  }

  async findActiveByEncounter(encounterId: number): Promise<BattleInstance | null> {
    const result = await db.query<BattleInstanceWithDetails>(
      `
        ${BASE_SELECT}
        WHERE bi.encounter_id = $1 AND bi.status = 'active'
        ORDER BY bi.created_at DESC
        LIMIT 1
      `,
      [encounterId]
    );
    const row = result.rows[0];
    return row ? normalizeBattle(row) : null;
  }

  async findByStatus(status: BattleStatus, limit = 50, offset = 0): Promise<BattleInstance[]> {
    const result = await db.query<BattleInstanceWithDetails>(
      `
        ${BASE_SELECT}
        WHERE bi.status = $1
        ORDER BY bi.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [status, limit, offset]
    );
    return result.rows.map(normalizeBattle);
  }

  override async create(input: BattleCreateInput): Promise<BattleInstance> {
    const battleDataJson = input.battleData ? JSON.stringify(input.battleData) : '{}';

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO battle_instances (
          adventure_id, encounter_id, battle_type,
          created_by_discord_user_id, battle_data
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        input.adventureId ?? null,
        input.encounterId ?? null,
        input.battleType,
        input.createdByDiscordUserId ?? null,
        battleDataJson,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert battle instance');
    }
    const battle = await this.findById(insertedRow.id);
    if (!battle) {
      throw new Error('Failed to create battle instance');
    }
    return battle;
  }

  override async update(id: number, input: BattleUpdateInput): Promise<BattleInstance> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.currentTurn !== undefined) {
      values.push(input.currentTurn);
      updates.push(`current_turn = $${values.length}`);
    }
    if (input.currentParticipantIndex !== undefined) {
      values.push(input.currentParticipantIndex);
      updates.push(`current_participant_index = $${values.length}`);
    }
    if (input.turnTimeLimit !== undefined) {
      values.push(input.turnTimeLimit);
      updates.push(`turn_time_limit = $${values.length}`);
    }
    if (input.turnStartedAt !== undefined) {
      values.push(input.turnStartedAt);
      updates.push(`turn_started_at = $${values.length}`);
    }
    if (input.winnerType !== undefined) {
      values.push(input.winnerType);
      updates.push(`winner_type = $${values.length}`);
    }
    if (input.battleData !== undefined) {
      values.push(JSON.stringify(input.battleData));
      updates.push(`battle_data = $${values.length}`);
    }
    if (input.completedAt !== undefined) {
      values.push(input.completedAt);
      updates.push(`completed_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Battle not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE battle_instances SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Battle not found after update');
    }
    return updated;
  }

  async complete(id: number, winnerType: BattleWinnerType): Promise<BattleInstance> {
    return this.update(id, {
      status: 'completed',
      winnerType,
      completedAt: new Date(),
    });
  }

  async cancel(id: number): Promise<BattleInstance> {
    return this.update(id, {
      status: 'cancelled',
      completedAt: new Date(),
    });
  }

  async startNextTurn(id: number, participantIndex: number): Promise<BattleInstance> {
    const battle = await this.findById(id);
    if (!battle) {
      throw new Error(`Battle ${id} not found`);
    }

    return this.update(id, {
      currentTurn: battle.currentTurn + 1,
      currentParticipantIndex: participantIndex,
      turnStartedAt: new Date(),
    });
  }
}
