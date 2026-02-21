import { BaseRepository } from './base.repository';
import { db } from '../database';

export type TeamSide = 'players' | 'opponents';
export type ParticipantType = 'player' | 'npc' | 'wild';

export type BattleParticipantRow = {
  id: number;
  battle_id: number;
  participant_type: ParticipantType;
  discord_user_id: string | null;
  trainer_id: number | null;
  trainer_name: string;
  team_side: TeamSide;
  turn_order: number;
  is_active: boolean;
  message_count: number;
  word_count: number;
  created_at: Date;
};

export type BattleParticipant = {
  id: number;
  battleId: number;
  participantType: ParticipantType;
  discordUserId: string | null;
  trainerId: number | null;
  trainerName: string;
  teamSide: TeamSide;
  turnOrder: number;
  isActive: boolean;
  messageCount: number;
  wordCount: number;
  createdAt: Date;
};

export type BattleParticipantWithDetails = BattleParticipant & {
  trainerFullName: string | null;
  trainerImage: string | null;
};

export type BattleParticipantCreateInput = {
  battleId: number;
  participantType: ParticipantType;
  discordUserId?: string | null;
  trainerId?: number | null;
  trainerName: string;
  teamSide: TeamSide;
  turnOrder?: number;
};

export type BattleParticipantUpdateInput = {
  isActive?: boolean;
  turnOrder?: number;
  messageCount?: number;
  wordCount?: number;
  trainerId?: number;
  trainerName?: string;
};

const normalizeBattleParticipant = (row: BattleParticipantRow): BattleParticipant => ({
  id: row.id,
  battleId: row.battle_id,
  participantType: row.participant_type,
  discordUserId: row.discord_user_id,
  trainerId: row.trainer_id,
  trainerName: row.trainer_name,
  teamSide: row.team_side,
  turnOrder: row.turn_order,
  isActive: row.is_active,
  messageCount: row.message_count,
  wordCount: row.word_count,
  createdAt: row.created_at,
});

type BattleParticipantWithDetailsRow = BattleParticipantRow & {
  trainer_full_name: string | null;
  trainer_image: string | null;
};

const normalizeBattleParticipantWithDetails = (row: BattleParticipantWithDetailsRow): BattleParticipantWithDetails => ({
  ...normalizeBattleParticipant(row),
  trainerFullName: row.trainer_full_name,
  trainerImage: row.trainer_image,
});

export class BattleParticipantRepository extends BaseRepository<
  BattleParticipant,
  BattleParticipantCreateInput,
  BattleParticipantUpdateInput
> {
  constructor() {
    super('battle_participants');
  }

  override async findById(id: number): Promise<BattleParticipantWithDetails | null> {
    const result = await db.query<BattleParticipantWithDetailsRow>(
      `
        SELECT bp.*, t.name as trainer_full_name, t.main_ref as trainer_image
        FROM battle_participants bp
        LEFT JOIN trainers t ON bp.trainer_id = t.id
        WHERE bp.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBattleParticipantWithDetails(row) : null;
  }

  async findByBattleId(
    battleId: number,
    options: { teamSide?: TeamSide; isActive?: boolean } = {}
  ): Promise<BattleParticipantWithDetails[]> {
    const conditions: string[] = ['bp.battle_id = $1'];
    const params: unknown[] = [battleId];

    if (options.teamSide) {
      params.push(options.teamSide);
      conditions.push(`bp.team_side = $${params.length}`);
    }

    if (options.isActive !== undefined) {
      params.push(options.isActive);
      conditions.push(`bp.is_active = $${params.length}`);
    }

    const result = await db.query<BattleParticipantWithDetailsRow>(
      `
        SELECT bp.*, t.name as trainer_full_name, t.main_ref as trainer_image
        FROM battle_participants bp
        LEFT JOIN trainers t ON bp.trainer_id = t.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY bp.turn_order, bp.created_at
      `,
      params
    );

    return result.rows.map(normalizeBattleParticipantWithDetails);
  }

  async findByBattleAndUser(battleId: number, discordUserId: string): Promise<BattleParticipantWithDetails | null> {
    const result = await db.query<BattleParticipantWithDetailsRow>(
      `
        SELECT bp.*, t.name as trainer_full_name, t.main_ref as trainer_image
        FROM battle_participants bp
        LEFT JOIN trainers t ON bp.trainer_id = t.id
        WHERE bp.battle_id = $1 AND bp.discord_user_id = $2
      `,
      [battleId, discordUserId]
    );
    const row = result.rows[0];
    return row ? normalizeBattleParticipantWithDetails(row) : null;
  }

  async findActiveByBattleId(battleId: number): Promise<BattleParticipantWithDetails[]> {
    return this.findByBattleId(battleId, { isActive: true });
  }

  async findByTeamSide(battleId: number, teamSide: TeamSide): Promise<BattleParticipantWithDetails[]> {
    return this.findByBattleId(battleId, { teamSide });
  }

  override async create(input: BattleParticipantCreateInput): Promise<BattleParticipant> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO battle_participants (
          battle_id, participant_type, discord_user_id,
          trainer_id, trainer_name, team_side, turn_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.battleId,
        input.participantType,
        input.discordUserId ?? null,
        input.trainerId ?? null,
        input.trainerName,
        input.teamSide,
        input.turnOrder ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert battle participant');
    }
    const participant = await this.findById(insertedRow.id);
    if (!participant) {
      throw new Error('Failed to create battle participant');
    }
    return participant;
  }

  override async update(id: number, input: BattleParticipantUpdateInput): Promise<BattleParticipant> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.isActive !== undefined) {
      values.push(input.isActive);
      updates.push(`is_active = $${values.length}`);
    }
    if (input.turnOrder !== undefined) {
      values.push(input.turnOrder);
      updates.push(`turn_order = $${values.length}`);
    }
    if (input.messageCount !== undefined) {
      values.push(input.messageCount);
      updates.push(`message_count = $${values.length}`);
    }
    if (input.wordCount !== undefined) {
      values.push(input.wordCount);
      updates.push(`word_count = $${values.length}`);
    }
    if (input.trainerId !== undefined) {
      values.push(input.trainerId);
      updates.push(`trainer_id = $${values.length}`);
    }
    if (input.trainerName !== undefined) {
      values.push(input.trainerName);
      updates.push(`trainer_name = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Battle participant not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE battle_participants SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Battle participant not found after update');
    }
    return updated;
  }

  async addMessage(id: number, wordCount = 0): Promise<BattleParticipant> {
    const participant = await this.findById(id);
    if (!participant) {
      throw new Error(`Participant ${id} not found`);
    }

    return this.update(id, {
      messageCount: participant.messageCount + 1,
      wordCount: participant.wordCount + wordCount,
    });
  }

  async setInactive(id: number): Promise<BattleParticipant> {
    return this.update(id, { isActive: false });
  }

  async getNextInTurnOrder(battleId: number, currentIndex: number): Promise<BattleParticipantWithDetails | null> {
    const participants = await this.findActiveByBattleId(battleId);

    if (participants.length === 0) {
      return null;
    }

    const nextIndex = (currentIndex + 1) % participants.length;
    return participants[nextIndex] ?? null;
  }
}
