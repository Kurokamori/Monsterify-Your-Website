import { BaseRepository } from './base.repository';
import { db } from '../database';

export type ActionType = 'attack' | 'item' | 'switch' | 'flee' | 'skip';

export type BattleTurnRow = {
  id: number;
  battle_id: number;
  turn_number: number;
  participant_id: number | null;
  monster_id: number | null;
  action_type: ActionType;
  action_data: string | object | null;
  result_data: string | object | null;
  damage_dealt: number;
  message_content: string | null;
  word_count: number;
  created_at: Date;
};

export type BattleTurn = {
  id: number;
  battleId: number;
  turnNumber: number;
  participantId: number | null;
  monsterId: number | null;
  actionType: ActionType;
  actionData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  damageDealt: number;
  messageContent: string | null;
  wordCount: number;
  createdAt: Date;
};

export type BattleTurnWithDetails = BattleTurn & {
  trainerName: string | null;
  teamSide: string | null;
  monsterData: Record<string, unknown>;
};

export type BattleTurnCreateInput = {
  battleId: number;
  turnNumber: number;
  participantId?: number | null;
  monsterId?: number | null;
  actionType: ActionType;
  actionData?: Record<string, unknown>;
  resultData?: Record<string, unknown>;
  damageDealt?: number;
  messageContent?: string;
  wordCount?: number;
};

export type BattleTurnUpdateInput = {
  resultData?: Record<string, unknown>;
  damageDealt?: number;
  messageContent?: string;
  wordCount?: number;
};

export type BattleTurnQueryOptions = {
  turnNumber?: number;
  participantId?: number;
  actionType?: ActionType;
  limit?: number;
  offset?: number;
};

export type BattleStatistics = {
  totalTurns: number;
  attackTurns: number;
  itemTurns: number;
  switchTurns: number;
  totalDamage: number;
  totalWords: number;
  avgWordsPerTurn: number;
};

const parseJsonField = (value: string | object | null): Record<string, unknown> => {
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

const normalizeBattleTurn = (row: BattleTurnRow): BattleTurn => ({
  id: row.id,
  battleId: row.battle_id,
  turnNumber: row.turn_number,
  participantId: row.participant_id,
  monsterId: row.monster_id,
  actionType: row.action_type,
  actionData: parseJsonField(row.action_data),
  resultData: parseJsonField(row.result_data),
  damageDealt: row.damage_dealt,
  messageContent: row.message_content,
  wordCount: row.word_count,
  createdAt: row.created_at,
});

type BattleTurnWithDetailsRow = BattleTurnRow & {
  trainer_name: string | null;
  team_side: string | null;
  monster_data: string | object | null;
};

const normalizeBattleTurnWithDetails = (row: BattleTurnWithDetailsRow): BattleTurnWithDetails => ({
  ...normalizeBattleTurn(row),
  trainerName: row.trainer_name,
  teamSide: row.team_side,
  monsterData: parseJsonField(row.monster_data),
});

export class BattleTurnRepository extends BaseRepository<
  BattleTurn,
  BattleTurnCreateInput,
  BattleTurnUpdateInput
> {
  constructor() {
    super('battle_turns');
  }

  override async findById(id: number): Promise<BattleTurnWithDetails | null> {
    const result = await db.query<BattleTurnWithDetailsRow>(
      `
        SELECT bt.*, bp.trainer_name, bp.team_side, bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBattleTurnWithDetails(row) : null;
  }

  async findByBattleId(battleId: number, options: BattleTurnQueryOptions = {}): Promise<BattleTurnWithDetails[]> {
    const { turnNumber, participantId, actionType, limit, offset = 0 } = options;

    const conditions: string[] = ['bt.battle_id = $1'];
    const params: unknown[] = [battleId];

    if (turnNumber !== undefined) {
      params.push(turnNumber);
      conditions.push(`bt.turn_number = $${params.length}`);
    }

    if (participantId) {
      params.push(participantId);
      conditions.push(`bt.participant_id = $${params.length}`);
    }

    if (actionType) {
      params.push(actionType);
      conditions.push(`bt.action_type = $${params.length}`);
    }

    let query = `
      SELECT bt.*, bp.trainer_name, bp.team_side, bm.monster_data
      FROM battle_turns bt
      LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
      LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY bt.turn_number, bt.created_at
    `;

    if (limit) {
      params.push(limit, offset);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await db.query<BattleTurnWithDetailsRow>(query, params);
    return result.rows.map(normalizeBattleTurnWithDetails);
  }

  async findLatestByBattleId(battleId: number): Promise<BattleTurnWithDetails | null> {
    const result = await db.query<BattleTurnWithDetailsRow>(
      `
        SELECT bt.*, bp.trainer_name, bp.team_side, bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.battle_id = $1
        ORDER BY bt.turn_number DESC, bt.created_at DESC
        LIMIT 1
      `,
      [battleId]
    );
    const row = result.rows[0];
    return row ? normalizeBattleTurnWithDetails(row) : null;
  }

  async findByParticipant(participantId: number): Promise<BattleTurnWithDetails[]> {
    const result = await db.query<BattleTurnWithDetailsRow>(
      `
        SELECT bt.*, bp.trainer_name, bp.team_side, bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.participant_id = $1
        ORDER BY bt.turn_number, bt.created_at
      `,
      [participantId]
    );
    return result.rows.map(normalizeBattleTurnWithDetails);
  }

  override async create(input: BattleTurnCreateInput): Promise<BattleTurn> {
    const actionDataJson = input.actionData ? JSON.stringify(input.actionData) : '{}';
    const resultDataJson = input.resultData ? JSON.stringify(input.resultData) : '{}';

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO battle_turns (
          battle_id, turn_number, participant_id, monster_id,
          action_type, action_data, result_data, damage_dealt,
          message_content, word_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        input.battleId,
        input.turnNumber,
        input.participantId ?? null,
        input.monsterId ?? null,
        input.actionType,
        actionDataJson,
        resultDataJson,
        input.damageDealt ?? 0,
        input.messageContent ?? '',
        input.wordCount ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert battle turn');
    }
    const turn = await this.findById(insertedRow.id);
    if (!turn) {
      throw new Error('Failed to create battle turn');
    }
    return turn;
  }

  override async update(id: number, input: BattleTurnUpdateInput): Promise<BattleTurn> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.resultData !== undefined) {
      values.push(JSON.stringify(input.resultData));
      updates.push(`result_data = $${values.length}`);
    }
    if (input.damageDealt !== undefined) {
      values.push(input.damageDealt);
      updates.push(`damage_dealt = $${values.length}`);
    }
    if (input.messageContent !== undefined) {
      values.push(input.messageContent);
      updates.push(`message_content = $${values.length}`);
    }
    if (input.wordCount !== undefined) {
      values.push(input.wordCount);
      updates.push(`word_count = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Battle turn not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE battle_turns SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Battle turn not found after update');
    }
    return updated;
  }

  async getBattleStatistics(battleId: number): Promise<BattleStatistics> {
    const result = await db.query<{
      total_turns: string;
      attack_turns: string;
      item_turns: string;
      switch_turns: string;
      total_damage: string | null;
      total_words: string | null;
      avg_words_per_turn: string | null;
    }>(
      `
        SELECT
          COUNT(*) as total_turns,
          COUNT(CASE WHEN action_type = 'attack' THEN 1 END) as attack_turns,
          COUNT(CASE WHEN action_type = 'item' THEN 1 END) as item_turns,
          COUNT(CASE WHEN action_type = 'switch' THEN 1 END) as switch_turns,
          SUM(damage_dealt) as total_damage,
          SUM(word_count) as total_words,
          AVG(word_count) as avg_words_per_turn
        FROM battle_turns
        WHERE battle_id = $1
      `,
      [battleId]
    );

    const stats = result.rows[0];
    if (!stats) {
      return {
        totalTurns: 0,
        attackTurns: 0,
        switchTurns: 0,
        itemTurns: 0,
        totalDamage: 0,
        totalWords: 0,
        avgWordsPerTurn: 0,
      };
    }
    return {
      totalTurns: parseInt(stats.total_turns, 10),
      attackTurns: parseInt(stats.attack_turns, 10),
      itemTurns: parseInt(stats.item_turns, 10),
      switchTurns: parseInt(stats.switch_turns, 10),
      totalDamage: parseInt(stats.total_damage ?? '0', 10),
      totalWords: parseInt(stats.total_words ?? '0', 10),
      avgWordsPerTurn: parseFloat(stats.avg_words_per_turn ?? '0'),
    };
  }
}
