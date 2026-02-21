import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AdventureStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type AdventureRow = {
  id: number;
  creator_id: number;
  title: string;
  description: string | null;
  status: AdventureStatus;
  landmass_id: string | null;
  landmass_name: string | null;
  region_id: string | null;
  region_name: string | null;
  area_id: string | null;
  area_name: string | null;
  area_config: string | null;
  encounter_count: number;
  max_encounters: number | null;
  discord_thread_id: string | null;
  discord_channel_id: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
};

export type AdventureWithCreator = AdventureRow & {
  creator_username: string | null;
};

export type Adventure = {
  id: number;
  creatorId: number;
  title: string;
  description: string | null;
  status: AdventureStatus;
  landmassId: string | null;
  landmassName: string | null;
  regionId: string | null;
  regionName: string | null;
  areaId: string | null;
  areaName: string | null;
  areaConfig: object | null;
  encounterCount: number;
  maxEncounters: number | null;
  discordThreadId: string | null;
  discordChannelId: string | null;
  creator: { name: string };
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export type AdventureCreateInput = {
  creatorId: number;
  title: string;
  description?: string | null;
  status?: AdventureStatus;
  landmassId?: string | null;
  landmassName?: string | null;
  regionId?: string | null;
  regionName?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  areaConfig?: object | null;
};

export type AdventureUpdateInput = {
  title?: string;
  description?: string | null;
  status?: AdventureStatus;
  encounterCount?: number;
  maxEncounters?: number | null;
  discordThreadId?: string | null;
  discordChannelId?: string | null;
  landmassId?: string | null;
  landmassName?: string | null;
  regionId?: string | null;
  regionName?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  areaConfig?: object | null;
  completedAt?: Date | null;
};

export type AdventureQueryOptions = {
  status?: AdventureStatus | 'all' | null;
  creatorId?: number | null;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'title' | 'encounters';
};

export type PaginatedAdventures = {
  adventures: Adventure[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdventureEncounterRow = {
  id: number;
  adventure_id: number;
  encounter_type: string;
  encounter_data: string | null;
  created_by_discord_user_id: string | null;
  is_resolved: boolean;
  resolved_at: Date | null;
  created_at: Date;
};

const parseAreaConfig = (value: string | null): object | null => {
  if (!value) {return null;}
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeAdventure = (row: AdventureWithCreator): Adventure => ({
  id: row.id,
  creatorId: row.creator_id,
  title: row.title,
  description: row.description,
  status: row.status,
  landmassId: row.landmass_id,
  landmassName: row.landmass_name,
  regionId: row.region_id,
  regionName: row.region_name,
  areaId: row.area_id,
  areaName: row.area_name,
  areaConfig: parseAreaConfig(row.area_config),
  encounterCount: row.encounter_count,
  maxEncounters: row.max_encounters,
  discordThreadId: row.discord_thread_id,
  discordChannelId: row.discord_channel_id,
  creator: { name: row.creator_username ?? 'Unknown' },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at,
});

const BASE_SELECT = `
  SELECT a.*, u.username as creator_username
  FROM adventures a
  LEFT JOIN users u ON a.creator_id = u.id
`;

export class AdventureRepository extends BaseRepository<Adventure, AdventureCreateInput, AdventureUpdateInput> {
  constructor() {
    super('adventures');
  }

  async findAll(options: AdventureQueryOptions = {}): Promise<PaginatedAdventures> {
    const { status = null, creatorId = null, page = 1, limit = 10, sort = 'newest' } = options;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }

    if (creatorId) {
      params.push(creatorId);
      conditions.push(`a.creator_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    let orderBy: string;
    switch (sort) {
      case 'oldest':
        orderBy = 'a.created_at ASC';
        break;
      case 'title':
        orderBy = 'a.title ASC';
        break;
      case 'encounters':
        orderBy = 'a.encounter_count DESC';
        break;
      default:
        orderBy = 'a.created_at DESC';
    }

    // Count total
    const countResult = await db.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM adventures a WHERE ${whereClause}`,
      params
    );
    const countRow = countResult.rows[0];
    const total = parseInt(countRow?.total ?? '0', 10);

    // Get paginated data
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const dataResult = await db.query<AdventureWithCreator>(
      `
        ${BASE_SELECT}
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      adventures: dataResult.rows.map(normalizeAdventure),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  override async findById(id: number): Promise<Adventure | null> {
    const result = await db.query<AdventureWithCreator>(
      `${BASE_SELECT} WHERE a.id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAdventure(row) : null;
  }

  async findByCreatorId(creatorId: number, options: AdventureQueryOptions = {}): Promise<PaginatedAdventures> {
    return this.findAll({ ...options, creatorId });
  }

  override async create(input: AdventureCreateInput): Promise<Adventure> {
    const currentTime = new Date().toISOString();

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO adventures (
          creator_id, title, description, status,
          landmass_id, landmass_name, region_id, region_name,
          area_id, area_name, area_config, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        input.creatorId,
        input.title,
        input.description ?? null,
        input.status ?? 'active',
        input.landmassId ?? null,
        input.landmassName ?? null,
        input.regionId ?? null,
        input.regionName ?? null,
        input.areaId ?? null,
        input.areaName ?? null,
        input.areaConfig ? JSON.stringify(input.areaConfig) : '{}',
        currentTime,
        currentTime,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert adventure');
    }
    const adventure = await this.findById(insertedRow.id);
    if (!adventure) {
      throw new Error('Failed to create adventure');
    }
    return adventure;
  }

  override async update(id: number, input: AdventureUpdateInput): Promise<Adventure> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      encounterCount: 'encounter_count',
      maxEncounters: 'max_encounters',
      discordThreadId: 'discord_thread_id',
      discordChannelId: 'discord_channel_id',
      landmassId: 'landmass_id',
      landmassName: 'landmass_name',
      regionId: 'region_id',
      regionName: 'region_name',
      areaId: 'area_id',
      areaName: 'area_name',
      completedAt: 'completed_at',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
      }
    }

    if (input.areaConfig !== undefined) {
      values.push(JSON.stringify(input.areaConfig));
      updates.push(`area_config = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Adventure not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE adventures SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Adventure not found after update');
    }
    return updated;
  }

  async incrementEncounterCount(id: number): Promise<Adventure> {
    await db.query(
      'UPDATE adventures SET encounter_count = encounter_count + 1 WHERE id = $1',
      [id]
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Adventure not found');
    }
    return updated;
  }

  async complete(id: number): Promise<Adventure> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  // Encounters
  async getEncounters(adventureId: number): Promise<AdventureEncounterRow[]> {
    const result = await db.query<AdventureEncounterRow>(
      'SELECT * FROM adventure_encounters WHERE adventure_id = $1 ORDER BY created_at DESC',
      [adventureId]
    );
    return result.rows;
  }

  async addEncounter(
    adventureId: number,
    encounterData: {
      encounterType: string;
      encounterData?: object | null;
      createdByDiscordUserId?: string | null;
    }
  ): Promise<AdventureEncounterRow> {
    const result = await db.query<AdventureEncounterRow>(
      `
        INSERT INTO adventure_encounters (
          adventure_id, encounter_type, encounter_data, created_by_discord_user_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        adventureId,
        encounterData.encounterType,
        encounterData.encounterData ? JSON.stringify(encounterData.encounterData) : null,
        encounterData.createdByDiscordUserId ?? null,
      ]
    );
    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert encounter');
    }
    return insertedRow;
  }

  async updateEncounter(
    encounterId: number,
    updates: {
      encounterData?: object | null;
      isResolved?: boolean;
    }
  ): Promise<AdventureEncounterRow> {
    const updateParts: string[] = [];
    const values: unknown[] = [];

    if (updates.encounterData !== undefined) {
      values.push(updates.encounterData ? JSON.stringify(updates.encounterData) : null);
      updateParts.push(`encounter_data = $${values.length}`);
    }
    if (updates.isResolved !== undefined) {
      values.push(updates.isResolved);
      updateParts.push(`is_resolved = $${values.length}`);
      if (updates.isResolved) {
        updateParts.push('resolved_at = CURRENT_TIMESTAMP');
      }
    }

    if (updateParts.length === 0) {
      const result = await db.query<AdventureEncounterRow>(
        'SELECT * FROM adventure_encounters WHERE id = $1',
        [encounterId]
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Encounter not found');
      }
      return row;
    }

    values.push(encounterId);

    const result = await db.query<AdventureEncounterRow>(
      `UPDATE adventure_encounters SET ${updateParts.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    const updatedRow = result.rows[0];
    if (!updatedRow) {
      throw new Error('Failed to update encounter');
    }
    return updatedRow;
  }
}
