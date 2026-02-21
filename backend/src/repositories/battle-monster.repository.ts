import { BaseRepository } from './base.repository';
import { db } from '../database';

export type BattleMonsterRow = {
  id: number;
  battle_id: number;
  participant_id: number;
  monster_id: number;
  monster_data: string | object | null;
  current_hp: number;
  max_hp: number;
  status_effects: string | object | null;
  position_index: number;
  is_active: boolean;
  is_fainted: boolean;
  created_at: Date;
};

export type BattleMonster = {
  id: number;
  battleId: number;
  participantId: number;
  monsterId: number;
  monsterData: Record<string, unknown>;
  currentHp: number;
  maxHp: number;
  statusEffects: StatusEffect[];
  positionIndex: number;
  isActive: boolean;
  isFainted: boolean;
  createdAt: Date;
};

export type BattleMonsterWithDetails = BattleMonster & {
  trainerName: string | null;
  teamSide: string | null;
  originalName: string | null;
};

export type StatusEffect = {
  type: string;
  appliedAt: string;
  duration?: number;
  [key: string]: unknown;
};

export type BattleMonsterCreateInput = {
  battleId: number;
  participantId: number;
  monsterId: number;
  monsterData: Record<string, unknown>;
  currentHp: number;
  maxHp: number;
  positionIndex?: number;
  isActive?: boolean;
};

export type BattleMonsterUpdateInput = {
  currentHp?: number;
  maxHp?: number;
  statusEffects?: StatusEffect[];
  isActive?: boolean;
  isFainted?: boolean;
  positionIndex?: number;
  monsterData?: Record<string, unknown>;
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

const normalizeBattleMonster = (row: BattleMonsterRow): BattleMonster => ({
  id: row.id,
  battleId: row.battle_id,
  participantId: row.participant_id,
  monsterId: row.monster_id,
  monsterData: parseJsonField(row.monster_data, {}),
  currentHp: row.current_hp,
  maxHp: row.max_hp,
  statusEffects: parseJsonField(row.status_effects, []),
  positionIndex: row.position_index,
  isActive: row.is_active,
  isFainted: row.is_fainted,
  createdAt: row.created_at,
});

type BattleMonsterWithDetailsRow = BattleMonsterRow & {
  trainer_name: string | null;
  team_side: string | null;
  original_name: string | null;
};

const normalizeBattleMonsterWithDetails = (row: BattleMonsterWithDetailsRow): BattleMonsterWithDetails => ({
  ...normalizeBattleMonster(row),
  trainerName: row.trainer_name,
  teamSide: row.team_side,
  originalName: row.original_name,
});

export class BattleMonsterRepository extends BaseRepository<
  BattleMonster,
  BattleMonsterCreateInput,
  BattleMonsterUpdateInput
> {
  constructor() {
    super('battle_monsters');
  }

  override async findById(id: number): Promise<BattleMonsterWithDetails | null> {
    const result = await db.query<BattleMonsterWithDetailsRow>(
      `
        SELECT bm.*, bp.trainer_name, bp.team_side, m.name as original_name
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE bm.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBattleMonsterWithDetails(row) : null;
  }

  async findByBattleId(
    battleId: number,
    options: { participantId?: number; isActive?: boolean; teamSide?: string } = {}
  ): Promise<BattleMonsterWithDetails[]> {
    const conditions: string[] = ['bm.battle_id = $1'];
    const params: unknown[] = [battleId];

    if (options.participantId) {
      params.push(options.participantId);
      conditions.push(`bm.participant_id = $${params.length}`);
    }

    if (options.isActive !== undefined) {
      params.push(options.isActive);
      conditions.push(`bm.is_active = $${params.length}`);
    }

    if (options.teamSide) {
      params.push(options.teamSide);
      conditions.push(`bp.team_side = $${params.length}`);
    }

    const result = await db.query<BattleMonsterWithDetailsRow>(
      `
        SELECT bm.*, bp.trainer_name, bp.team_side, m.name as original_name
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY bp.team_side, bm.position_index, bm.created_at
      `,
      params
    );

    return result.rows.map(normalizeBattleMonsterWithDetails);
  }

  async findByBattleAndMonster(battleId: number, monsterId: number): Promise<BattleMonsterWithDetails | null> {
    const result = await db.query<BattleMonsterWithDetailsRow>(
      `
        SELECT bm.*, bp.trainer_name, bp.team_side, m.name as original_name
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE bm.battle_id = $1 AND bm.monster_id = $2
        LIMIT 1
      `,
      [battleId, monsterId]
    );
    const row = result.rows[0];
    return row ? normalizeBattleMonsterWithDetails(row) : null;
  }

  async findActiveByParticipant(participantId: number): Promise<BattleMonsterWithDetails[]> {
    const result = await db.query<BattleMonsterWithDetailsRow>(
      `
        SELECT bm.*, bp.trainer_name, bp.team_side, m.name as original_name
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE bm.participant_id = $1 AND bm.is_active::boolean = true AND bm.is_fainted::boolean = false
        ORDER BY bm.position_index
      `,
      [participantId]
    );
    return result.rows.map(normalizeBattleMonsterWithDetails);
  }

  override async create(input: BattleMonsterCreateInput): Promise<BattleMonster> {
    const monsterDataJson = JSON.stringify(input.monsterData);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO battle_monsters (
          battle_id, participant_id, monster_id, monster_data,
          current_hp, max_hp, position_index, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        input.battleId,
        input.participantId,
        input.monsterId,
        monsterDataJson,
        input.currentHp,
        input.maxHp,
        input.positionIndex ?? 0,
        input.isActive ?? false,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert battle monster');
    }
    const monster = await this.findById(insertedRow.id);
    if (!monster) {
      throw new Error('Failed to create battle monster');
    }
    return monster;
  }

  override async update(id: number, input: BattleMonsterUpdateInput): Promise<BattleMonster> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.currentHp !== undefined) {
      values.push(input.currentHp);
      updates.push(`current_hp = $${values.length}`);
    }
    if (input.maxHp !== undefined) {
      values.push(input.maxHp);
      updates.push(`max_hp = $${values.length}`);
    }
    if (input.statusEffects !== undefined) {
      values.push(JSON.stringify(input.statusEffects));
      updates.push(`status_effects = $${values.length}`);
    }
    if (input.isActive !== undefined) {
      values.push(input.isActive);
      updates.push(`is_active = $${values.length}`);
    }
    if (input.isFainted !== undefined) {
      values.push(input.isFainted);
      updates.push(`is_fainted = $${values.length}`);
    }
    if (input.positionIndex !== undefined) {
      values.push(input.positionIndex);
      updates.push(`position_index = $${values.length}`);
    }
    if (input.monsterData !== undefined) {
      values.push(JSON.stringify(input.monsterData));
      updates.push(`monster_data = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Battle monster not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE battle_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Battle monster not found after update');
    }
    return updated;
  }

  async dealDamage(id: number, damage: number): Promise<{ monster: BattleMonster; damageDealt: number; hpBefore: number; hpAfter: number; fainted: boolean }> {
    const monster = await this.findById(id);
    if (!monster) {
      throw new Error(`Battle monster ${id} not found`);
    }

    const hpBefore = monster.currentHp;
    const hpAfter = Math.max(0, hpBefore - damage);
    const fainted = hpAfter === 0;

    const updateData: BattleMonsterUpdateInput = {
      currentHp: hpAfter,
      isFainted: fainted,
    };

    if (fainted) {
      updateData.isActive = false;
    }

    const updatedMonster = await this.update(id, updateData);

    return {
      monster: updatedMonster,
      damageDealt: damage,
      hpBefore,
      hpAfter,
      fainted,
    };
  }

  async heal(id: number, healAmount: number): Promise<{ monster: BattleMonster; healAmount: number; hpBefore: number; hpAfter: number; revived: boolean }> {
    const monster = await this.findById(id);
    if (!monster) {
      throw new Error(`Battle monster ${id} not found`);
    }

    const hpBefore = monster.currentHp;
    const hpAfter = Math.min(monster.maxHp, hpBefore + healAmount);
    const actualHeal = hpAfter - hpBefore;
    const revived = monster.isFainted && hpAfter > 0;

    const updateData: BattleMonsterUpdateInput = {
      currentHp: hpAfter,
    };

    if (revived) {
      updateData.isFainted = false;
    }

    const updatedMonster = await this.update(id, updateData);

    return {
      monster: updatedMonster,
      healAmount: actualHeal,
      hpBefore,
      hpAfter,
      revived,
    };
  }

  async setActive(id: number): Promise<BattleMonster> {
    return this.update(id, { isActive: true });
  }

  async setInactive(id: number): Promise<BattleMonster> {
    return this.update(id, { isActive: false });
  }

  async addStatusEffect(id: number, statusEffect: Omit<StatusEffect, 'appliedAt'>): Promise<BattleMonster> {
    const monster = await this.findById(id);
    if (!monster) {
      throw new Error(`Battle monster ${id} not found`);
    }

    const newEffect = { ...statusEffect, appliedAt: new Date().toISOString() } as StatusEffect;
    const statusEffects: StatusEffect[] = [...monster.statusEffects, newEffect];
    return this.update(id, { statusEffects });
  }

  async removeStatusEffect(id: number, effectType: string): Promise<BattleMonster> {
    const monster = await this.findById(id);
    if (!monster) {
      throw new Error(`Battle monster ${id} not found`);
    }

    const statusEffects = monster.statusEffects.filter((effect) => effect.type !== effectType);
    return this.update(id, { statusEffects });
  }
}
