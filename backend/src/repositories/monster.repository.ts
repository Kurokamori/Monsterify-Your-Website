import { BaseRepository } from './base.repository';
import { db } from '../database';

// Row type as stored in database
export type MonsterRow = {
  id: number;
  trainer_id: number;
  player_user_id: string;
  name: string;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  hp_total: number;
  hp_iv: number;
  hp_ev: number;
  atk_total: number;
  atk_iv: number;
  atk_ev: number;
  def_total: number;
  def_iv: number;
  def_ev: number;
  spa_total: number;
  spa_iv: number;
  spa_ev: number;
  spd_total: number;
  spd_iv: number;
  spd_ev: number;
  spe_total: number;
  spe_iv: number;
  spe_ev: number;
  nature: string | null;
  characteristic: string | null;
  gender: string | null;
  friendship: number;
  ability1: string | null;
  ability2: string | null;
  moveset: string | null;
  img_link: string | null;
  date_met: Date | null;
  where_met: string | null;
  box_number: number | null;
  trainer_index: number | null;
  shiny: boolean;
  alpha: boolean;
  shadow: boolean;
  paradox: boolean;
  pokerus: boolean;
  pronouns: string | null;
  height: string | null;
  weight: string | null;
  held_item: string | null;
  seal: string | null;
  mark: string | null;
  tldr: string | null;
  bio: string | null;
  likes: string | null;
  dislikes: string | null;
  lore: string | null;
  fun_facts: string | null;
  relations: string | null;
  ability: string | null;
  age: string | null;
  acquired: string | null;
  ball: string | null;
  main_ref: string | null;
  biography: string | null;
  mega_species1: string | null;
  mega_species2: string | null;
  mega_species3: string | null;
  mega_type1: string | null;
  mega_type2: string | null;
  mega_ability: string | null;
  mega_stat_bonus: number | null;
  mega_stone_name: string | null;
  has_mega_stone: boolean;
  mega_img_link: string | null;
  mega_stone_img: string | null;
  is_starter_template: boolean;
  created_at: Date;
  updated_at: Date;
};

export type MonsterWithTrainer = MonsterRow & {
  trainer_name: string;
};

export type MonsterCreateInput = {
  trainerId: number;
  playerUserId?: string;
  name: string;
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level?: number;
  hpTotal?: number;
  hpIv?: number;
  hpEv?: number;
  atkTotal?: number;
  atkIv?: number;
  atkEv?: number;
  defTotal?: number;
  defIv?: number;
  defEv?: number;
  spaTotal?: number;
  spaIv?: number;
  spaEv?: number;
  spdTotal?: number;
  spdIv?: number;
  spdEv?: number;
  speTotal?: number;
  speIv?: number;
  speEv?: number;
  nature?: string | null;
  characteristic?: string | null;
  gender?: string | null;
  friendship?: number;
  ability1?: string | null;
  ability2?: string | null;
  moveset?: string[];
  imgLink?: string | null;
  dateMet?: Date | null;
  whereMet?: string | null;
  boxNumber?: number | null;
  trainerIndex?: number | null;
  shiny?: boolean;
  alpha?: boolean;
  shadow?: boolean;
  paradox?: boolean;
  pokerus?: boolean;
};

export type MonsterUpdateInput = {
  name?: string;
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level?: number;
  hpTotal?: number;
  hpIv?: number;
  hpEv?: number;
  atkTotal?: number;
  atkIv?: number;
  atkEv?: number;
  defTotal?: number;
  defIv?: number;
  defEv?: number;
  spaTotal?: number;
  spaIv?: number;
  spaEv?: number;
  spdTotal?: number;
  spdIv?: number;
  spdEv?: number;
  speTotal?: number;
  speIv?: number;
  speEv?: number;
  nature?: string | null;
  characteristic?: string | null;
  gender?: string | null;
  friendship?: number;
  ability1?: string | null;
  ability2?: string | null;
  moveset?: string[];
  imgLink?: string | null;
  dateMet?: Date | null;
  whereMet?: string | null;
  boxNumber?: number | null;
  trainerIndex?: number | null;
  shiny?: boolean;
  alpha?: boolean;
  shadow?: boolean;
  paradox?: boolean;
  pokerus?: boolean;
  pronouns?: string | null;
  height?: string | null;
  weight?: string | null;
  heldItem?: string | null;
  seal?: string | null;
  mark?: string | null;
  tldr?: string | null;
  bio?: string | null;
  likes?: string | null;
  dislikes?: string | null;
  lore?: string | null;
  funFacts?: string | null;
  relations?: string | null;
  ability?: string | null;
  age?: string | null;
  acquired?: string | null;
  ball?: string | null;
  mainRef?: string | null;
  biography?: string | null;
  megaSpecies1?: string | null;
  megaSpecies2?: string | null;
  megaSpecies3?: string | null;
  megaType1?: string | null;
  megaType2?: string | null;
  megaAbility?: string | null;
  megaStatBonus?: number | null;
  megaStoneName?: string | null;
  hasMegaStone?: boolean;
  megaImgLink?: string | null;
  megaStoneImg?: string | null;
};

export type MonsterImageRow = {
  id: number;
  monster_id: number;
  image_url: string;
  image_type: string;
  order_index: number;
  created_at: Date;
};

export type MonsterEvolutionLineRow = {
  id: number;
  monster_id: number;
  evolution_data: string | object;
  created_at: Date;
  updated_at: Date;
};

export type BoxPosition = {
  box_number: number;
  trainer_index: number;
};

const normalizeType = (type: string | null): string | null => {
  if (!type) {return null;}
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const normalizeMonsterTypes = (monster: MonsterWithTrainer): MonsterWithTrainer => ({
  ...monster,
  type1: normalizeType(monster.type1) ?? monster.type1,
  type2: normalizeType(monster.type2),
  type3: normalizeType(monster.type3),
  type4: normalizeType(monster.type4),
  type5: normalizeType(monster.type5),
});

const parseMoveset = (moveset: string | null): string[] => {
  if (!moveset || moveset === 'null') {return [];}
  try {
    const parsed = JSON.parse(moveset);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const BASE_SELECT_WITH_TRAINER = `
  SELECT m.*, t.name as trainer_name
  FROM monsters m
  JOIN trainers t ON m.trainer_id = t.id
`;

export class MonsterRepository extends BaseRepository<MonsterWithTrainer, MonsterCreateInput, MonsterUpdateInput> {
  constructor() {
    super('monsters');
  }

  override async findById(id: number): Promise<MonsterWithTrainer | null> {
    const result = await db.query<MonsterWithTrainer>(
      `${BASE_SELECT_WITH_TRAINER} WHERE m.id = $1`,
      [id]
    );
    const monster = result.rows[0];
    return monster ? normalizeMonsterTypes(monster) : null;
  }

  async findAll(limit = 100, offset = 0): Promise<MonsterWithTrainer[]> {
    const result = await db.query<MonsterWithTrainer>(
      `${BASE_SELECT_WITH_TRAINER} ORDER BY m.name LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows.map(normalizeMonsterTypes);
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    trainerId?: number;
    type?: string;
    species?: string;
    attribute?: string;
  }): Promise<{ monsters: MonsterWithTrainer[]; total: number }> {
    const { page, limit, search, sortBy, sortOrder = 'desc', trainerId, type, species, attribute } = params;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      const likeTerm = `%${search}%`;
      conditions.push(`(
        m.name ILIKE $${paramIndex}
        OR m.species1 ILIKE $${paramIndex}
        OR m.species2 ILIKE $${paramIndex}
        OR m.species3 ILIKE $${paramIndex}
        OR t.name ILIKE $${paramIndex}
      )`);
      values.push(likeTerm);
      paramIndex++;
    }

    if (trainerId) {
      conditions.push(`m.trainer_id = $${paramIndex}`);
      values.push(trainerId);
      paramIndex++;
    }

    if (type) {
      conditions.push(`(
        m.type1 ILIKE $${paramIndex}
        OR m.type2 ILIKE $${paramIndex}
        OR m.type3 ILIKE $${paramIndex}
        OR m.type4 ILIKE $${paramIndex}
        OR m.type5 ILIKE $${paramIndex}
      )`);
      values.push(type);
      paramIndex++;
    }

    if (species) {
      const speciesLike = `%${species}%`;
      conditions.push(`(
        m.species1 ILIKE $${paramIndex}
        OR m.species2 ILIKE $${paramIndex}
        OR m.species3 ILIKE $${paramIndex}
      )`);
      values.push(speciesLike);
      paramIndex++;
    }

    if (attribute) {
      conditions.push(`m.attribute ILIKE $${paramIndex}`);
      values.push(attribute);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Whitelist sort fields to prevent SQL injection
    const allowedSortFields: Record<string, string> = {
      id: 'm.id',
      name: 'm.name',
      level: 'm.level',
      species1: 'm.species1',
      type1: 'm.type1',
      trainer_name: 't.name',
      attribute: 'm.attribute',
      created_at: 'm.created_at',
    };
    const sortColumn = allowedSortFields[sortBy ?? 'id'] ?? 'm.id';
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = paramIndex++;
    values.push(offset);
    const offsetParam = paramIndex;

    const sql = `
      SELECT m.*, t.name as trainer_name, COUNT(*) OVER() as total_count
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      ${whereClause}
      ORDER BY ${sortColumn} ${direction}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await db.query<MonsterWithTrainer & { total_count: string }>(sql, values);

    const firstRow = result.rows[0];
    const total = firstRow ? parseInt(firstRow.total_count, 10) : 0;
    const monsters = result.rows.map(row => {
      const { total_count: _total_count, ...monster } = row;
      return normalizeMonsterTypes(monster as unknown as MonsterWithTrainer);
    });

    return { monsters, total };
  }

  async findByTrainerId(trainerId: number): Promise<MonsterWithTrainer[]> {
    const result = await db.query<MonsterWithTrainer>(
      `${BASE_SELECT_WITH_TRAINER} WHERE m.trainer_id = $1 ORDER BY m.name ASC`,
      [trainerId]
    );
    return result.rows.map(normalizeMonsterTypes);
  }

  async findByUserId(userId: string): Promise<MonsterWithTrainer[]> {
    const result = await db.query<MonsterWithTrainer>(
      `${BASE_SELECT_WITH_TRAINER} WHERE m.player_user_id = $1 ORDER BY m.name`,
      [userId]
    );
    return result.rows.map(normalizeMonsterTypes);
  }

  async getBoxPositions(trainerId: number): Promise<BoxPosition[]> {
    const result = await db.query<BoxPosition>(
      `
        SELECT box_number, trainer_index
        FROM monsters
        WHERE trainer_id = $1 AND box_number IS NOT NULL AND trainer_index IS NOT NULL
        ORDER BY box_number ASC, trainer_index ASC
      `,
      [trainerId]
    );
    return result.rows;
  }

  override async create(input: MonsterCreateInput): Promise<MonsterWithTrainer> {
    const level = input.level ?? 1;
    const randomIv = () => Math.floor(Math.random() * 32);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO monsters (
          trainer_id, player_user_id, name, species1, species2, species3,
          type1, type2, type3, type4, type5, attribute, level,
          hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
          def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev,
          spd_total, spd_iv, spd_ev, spe_total, spe_iv, spe_ev,
          nature, characteristic, gender, friendship, ability1, ability2,
          moveset, img_link, date_met, where_met, box_number, trainer_index,
          shiny, alpha, shadow, paradox, pokerus
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
          $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48
        )
        RETURNING id
      `,
      [
        input.trainerId,
        input.playerUserId ?? null,
        input.name,
        input.species1,
        input.species2 ?? null,
        input.species3 ?? null,
        input.type1,
        input.type2 ?? null,
        input.type3 ?? null,
        input.type4 ?? null,
        input.type5 ?? null,
        input.attribute ?? null,
        level,
        input.hpTotal ?? 50,
        input.hpIv ?? randomIv(),
        input.hpEv ?? 0,
        input.atkTotal ?? 50,
        input.atkIv ?? randomIv(),
        input.atkEv ?? 0,
        input.defTotal ?? 50,
        input.defIv ?? randomIv(),
        input.defEv ?? 0,
        input.spaTotal ?? 50,
        input.spaIv ?? randomIv(),
        input.spaEv ?? 0,
        input.spdTotal ?? 50,
        input.spdIv ?? randomIv(),
        input.spdEv ?? 0,
        input.speTotal ?? 50,
        input.speIv ?? randomIv(),
        input.speEv ?? 0,
        input.nature ?? null,
        input.characteristic ?? null,
        input.gender ?? null,
        input.friendship ?? 70,
        input.ability1 ?? null,
        input.ability2 ?? null,
        input.moveset ? JSON.stringify(input.moveset) : '[]',
        input.imgLink ?? null,
        input.dateMet ?? null,
        input.whereMet ?? null,
        input.boxNumber ?? null,
        input.trainerIndex ?? null,
        (input.shiny ? 1 : 0),
        (input.alpha ? 1 : 0),
        (input.shadow ? 1 : 0),
        (input.paradox ? 1 : 0),
        (input.pokerus ? 1 : 0),
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert monster');
    }
    const monsterId = insertedRow.id;

    // Auto-assign box position if not provided
    if (input.boxNumber === null || input.boxNumber === undefined || input.trainerIndex === null || input.trainerIndex === undefined) {
      const occupied = await this.getBoxPositions(input.trainerId);
      const occupiedSet = new Set(occupied.map(p => `${p.box_number}-${p.trainer_index}`));
      const nextPos = this.findNextEmptyPosition(occupiedSet);
      if (nextPos) {
        await this.updateBoxPosition(monsterId, nextPos.boxNumber, nextPos.trainerIndex);
      }
    }

    const monster = await this.findById(monsterId);
    if (!monster) {
      throw new Error('Failed to retrieve newly created monster');
    }
    return monster;
  }

  override async update(id: number, input: MonsterUpdateInput): Promise<MonsterWithTrainer> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      species1: 'species1',
      species2: 'species2',
      species3: 'species3',
      type1: 'type1',
      type2: 'type2',
      type3: 'type3',
      type4: 'type4',
      type5: 'type5',
      attribute: 'attribute',
      level: 'level',
      hpTotal: 'hp_total',
      hpIv: 'hp_iv',
      hpEv: 'hp_ev',
      atkTotal: 'atk_total',
      atkIv: 'atk_iv',
      atkEv: 'atk_ev',
      defTotal: 'def_total',
      defIv: 'def_iv',
      defEv: 'def_ev',
      spaTotal: 'spa_total',
      spaIv: 'spa_iv',
      spaEv: 'spa_ev',
      spdTotal: 'spd_total',
      spdIv: 'spd_iv',
      spdEv: 'spd_ev',
      speTotal: 'spe_total',
      speIv: 'spe_iv',
      speEv: 'spe_ev',
      nature: 'nature',
      characteristic: 'characteristic',
      gender: 'gender',
      friendship: 'friendship',
      ability1: 'ability1',
      ability2: 'ability2',
      moveset: 'moveset',
      imgLink: 'img_link',
      dateMet: 'date_met',
      whereMet: 'where_met',
      boxNumber: 'box_number',
      trainerIndex: 'trainer_index',
      shiny: 'shiny',
      alpha: 'alpha',
      shadow: 'shadow',
      paradox: 'paradox',
      pokerus: 'pokerus',
      pronouns: 'pronouns',
      height: 'height',
      weight: 'weight',
      heldItem: 'held_item',
      seal: 'seal',
      mark: 'mark',
      tldr: 'tldr',
      bio: 'bio',
      likes: 'likes',
      dislikes: 'dislikes',
      lore: 'lore',
      funFacts: 'fun_facts',
      relations: 'relations',
      ability: 'ability',
      age: 'age',
      acquired: 'acquired',
      ball: 'ball',
      mainRef: 'main_ref',
      biography: 'biography',
      megaSpecies1: 'mega_species1',
      megaSpecies2: 'mega_species2',
      megaSpecies3: 'mega_species3',
      megaType1: 'mega_type1',
      megaType2: 'mega_type2',
      megaAbility: 'mega_ability',
      megaStatBonus: 'mega_stat_bonus',
      megaStoneName: 'mega_stone_name',
      hasMegaStone: 'has_mega_stone',
      megaImgLink: 'mega_img_link',
      megaStoneImg: 'mega_stone_img',
    };

    const booleanFields = new Set(['shiny', 'alpha', 'shadow', 'paradox', 'pokerus', 'hasMegaStone', 'isStarterTemplate']);

    for (const [key, column] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        updates.push(`${column} = $${values.length + 1}`);
        if (key === 'moveset' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else if (booleanFields.has(key)) {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Monster not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Monster not found after update');
    }
    return updated;
  }

  async transferToTrainer(monsterId: number, newTrainerId: number, newPlayerUserId: string): Promise<MonsterWithTrainer> {
    await db.query(
      `
        UPDATE monsters
        SET trainer_id = $1, player_user_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [newTrainerId, newPlayerUserId, monsterId]
    );

    const updated = await this.findById(monsterId);
    if (!updated) {
      throw new Error('Monster not found after transfer');
    }
    return updated;
  }

  async addLevels(monsterId: number, levels: number): Promise<MonsterWithTrainer> {
    await db.query(
      `
        UPDATE monsters
        SET level = level + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [levels, monsterId]
    );

    const updated = await this.findById(monsterId);
    if (!updated) {
      throw new Error('Monster not found after level update');
    }
    return updated;
  }

  // Monster Images
  async getImages(monsterId: number): Promise<MonsterImageRow[]> {
    const result = await db.query<MonsterImageRow>(
      `
        SELECT * FROM monster_images
        WHERE monster_id = $1
        ORDER BY image_type, order_index
      `,
      [monsterId]
    );
    return result.rows;
  }

  async addImage(monsterId: number, imageUrl: string, imageType: string, orderIndex = 0): Promise<MonsterImageRow> {
    const result = await db.query<MonsterImageRow>(
      `
        INSERT INTO monster_images (monster_id, image_url, image_type, order_index)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [monsterId, imageUrl, imageType, orderIndex]
    );
    const insertedImageRow = result.rows[0];
    if (!insertedImageRow) {
      throw new Error('Failed to insert monster image');
    }
    return insertedImageRow;
  }

  async getMegaImage(monsterId: number): Promise<MonsterImageRow | null> {
    const result = await db.query<MonsterImageRow>(
      `
        SELECT * FROM monster_images
        WHERE monster_id = $1 AND image_type = 'mega_image'
        ORDER BY order_index
        LIMIT 1
      `,
      [monsterId]
    );
    return result.rows[0] ?? null;
  }

  async getMegaStoneImage(monsterId: number): Promise<MonsterImageRow | null> {
    const result = await db.query<MonsterImageRow>(
      `
        SELECT * FROM monster_images
        WHERE monster_id = $1 AND image_type = 'mega_stone'
        ORDER BY order_index
        LIMIT 1
      `,
      [monsterId]
    );
    return result.rows[0] ?? null;
  }

  // Evolution Data
  async getEvolutionData(monsterId: number): Promise<MonsterEvolutionLineRow | null> {
    const result = await db.query<MonsterEvolutionLineRow>(
      'SELECT * FROM monster_evolution_lines WHERE monster_id = $1',
      [monsterId]
    );
    const row = result.rows[0];
    if (!row) {return null;}

    if (typeof row.evolution_data === 'string') {
      try {
        row.evolution_data = JSON.parse(row.evolution_data);
      } catch {
        // Keep as string if parsing fails
      }
    }
    return row;
  }

  async setEvolutionData(monsterId: number, evolutionData: object): Promise<MonsterEvolutionLineRow> {
    const evolutionDataStr = JSON.stringify(evolutionData);
    const existing = await this.getEvolutionData(monsterId);

    if (existing) {
      await db.query(
        'UPDATE monster_evolution_lines SET evolution_data = $1, updated_at = CURRENT_TIMESTAMP WHERE monster_id = $2',
        [evolutionDataStr, monsterId]
      );
    } else {
      await db.query(
        'INSERT INTO monster_evolution_lines (monster_id, evolution_data) VALUES ($1, $2)',
        [monsterId, evolutionDataStr]
      );
    }

    const updated = await this.getEvolutionData(monsterId);
    if (!updated) {
      throw new Error('Failed to retrieve evolution data after update');
    }
    return updated;
  }

  // Search
  async search(searchTerm: string, limit = 20): Promise<MonsterWithTrainer[]> {
    const likeTerm = `%${searchTerm}%`;
    const result = await db.query<MonsterWithTrainer>(
      `
        ${BASE_SELECT_WITH_TRAINER}
        WHERE
          LOWER(m.name) LIKE LOWER($1) OR
          LOWER(m.species1) LIKE LOWER($1) OR
          LOWER(m.species2) LIKE LOWER($1) OR
          LOWER(m.species3) LIKE LOWER($1) OR
          LOWER(t.name) LIKE LOWER($1)
        ORDER BY
          CASE
            WHEN LOWER(m.name) LIKE LOWER($1) THEN 1
            WHEN LOWER(t.name) LIKE LOWER($1) THEN 2
            ELSE 3
          END,
          m.name
        LIMIT $2
      `,
      [likeTerm, limit]
    );
    return result.rows.map(normalizeMonsterTypes);
  }

  // Get distinct type values from the actual monsters table
  async getDistinctTypes(): Promise<string[]> {
    const result = await db.query<{ type_value: string }>(
      `
        SELECT DISTINCT type_value FROM (
          SELECT type1 as type_value FROM monsters WHERE type1 IS NOT NULL
          UNION
          SELECT type2 FROM monsters WHERE type2 IS NOT NULL
          UNION
          SELECT type3 FROM monsters WHERE type3 IS NOT NULL
          UNION
          SELECT type4 FROM monsters WHERE type4 IS NOT NULL
          UNION
          SELECT type5 FROM monsters WHERE type5 IS NOT NULL
        ) types
        ORDER BY type_value
      `
    );
    return result.rows.map(r => r.type_value);
  }

  // Get distinct attribute values from the monsters table
  async getDistinctAttributes(): Promise<string[]> {
    const result = await db.query<{ attribute: string }>(
      `SELECT DISTINCT attribute FROM monsters WHERE attribute IS NOT NULL ORDER BY attribute`
    );
    return result.rows.map(r => r.attribute);
  }

  // Evolution Chain - find all monsters sharing the same species evolution line
  async getEvolutionChain(monsterId: number): Promise<MonsterWithTrainer[]> {
    const monster = await this.findById(monsterId);
    if (!monster) {return [];}

    // Find monsters that share the same species1 in their evolution data
    const result = await db.query<MonsterWithTrainer>(
      `
        ${BASE_SELECT_WITH_TRAINER}
        WHERE m.species1 = $1 OR m.species2 = $1 OR m.species3 = $1
        ORDER BY m.level ASC
      `,
      [monster.species1]
    );
    return result.rows.map(normalizeMonsterTypes);
  }

  // Gallery - submissions featuring this monster
  async getGallery(monsterId: number): Promise<{ id: number; image_url: string; title: string | null; created_at: Date }[]> {
    const result = await db.query<{ id: number; image_url: string; title: string | null; created_at: Date }>(
      `
        SELECT s.id,
          (SELECT si.image_url FROM submission_images si WHERE si.submission_id = s.id AND si.is_main::boolean = true LIMIT 1) as image_url,
          s.title, s.created_at
        FROM submissions s
        JOIN submission_monsters sm ON sm.submission_id = s.id
        WHERE sm.monster_id = $1
        ORDER BY s.created_at DESC
      `,
      [monsterId]
    );
    // Filter out entries without images
    return result.rows.filter(row => row.image_url !== null && row.image_url !== undefined);
  }

  // References - reference images for this monster
  async getReferences(monsterId: number): Promise<{ species: string; image_url: string | null }[]> {
    const monster = await this.findById(monsterId);
    if (!monster) {return [];}

    const species = [monster.species1, monster.species2, monster.species3].filter(Boolean) as string[];
    if (species.length === 0) {return [];}

    // Build dynamic query for multiple species
    const placeholders = species.map((_, i) => `$${i + 1}`).join(', ');
    const result = await db.query<{ name: string; image_url: string | null }>(
      `SELECT name, image_url FROM pokemon_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM digimon_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM nexomon_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM yokai_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM pals_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM fakemon_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM finalfantasy_species WHERE name IN (${placeholders})
       UNION ALL
       SELECT name, image_url FROM monsterhunter_species WHERE name IN (${placeholders})`,
      // Repeat species array for each UNION clause
      [...species, ...species, ...species, ...species, ...species, ...species, ...species, ...species]
    );

    return result.rows.map(row => ({ species: row.name, image_url: row.image_url }));
  }

  // Set Mega Image (upsert)
  async setMegaImage(monsterId: number, imageUrl: string): Promise<MonsterImageRow> {
    // Check if mega_image already exists
    const existing = await this.getMegaImage(monsterId);
    if (existing) {
      await db.query(
        `UPDATE monster_images SET image_url = $1 WHERE id = $2`,
        [imageUrl, existing.id]
      );
      return { ...existing, image_url: imageUrl };
    }
    return this.addImage(monsterId, imageUrl, 'mega_image');
  }

  // Set Mega Stone Image (upsert)
  async setMegaStoneImage(monsterId: number, imageUrl: string): Promise<MonsterImageRow> {
    // Check if mega_stone already exists
    const existing = await this.getMegaStoneImage(monsterId);
    if (existing) {
      await db.query(
        `UPDATE monster_images SET image_url = $1 WHERE id = $2`,
        [imageUrl, existing.id]
      );
      return { ...existing, image_url: imageUrl };
    }
    return this.addImage(monsterId, imageUrl, 'mega_stone');
  }

  async findByTrainerAndName(trainerId: number, name: string): Promise<{ id: number } | null> {
    const result = await db.query<{ id: number }>(
      'SELECT id FROM monsters WHERE trainer_id = $1 AND name = $2',
      [trainerId, name]
    );
    return result.rows[0] ?? null;
  }

  async addMegaImage(monsterId: number, imageUrl: string): Promise<void> {
    await db.query(
      `INSERT INTO monster_images (monster_id, image_url, image_type, is_primary)
       VALUES ($1, $2, 'mega', false)
       ON CONFLICT DO NOTHING`,
      [monsterId, imageUrl]
    );
  }

  // Moveset helper
  getMoveset(monster: MonsterWithTrainer): string[] {
    return parseMoveset(monster.moveset);
  }

  // ===========================================================================
  // Type Normalization & Box Position Cleanup
  // ===========================================================================

  /**
   * Normalize all type fields (type1-type5) to Title Case directly in the database.
   * Only updates rows where at least one type differs from its normalized form.
   */
  async normalizeTypesInDb(trainerId: number): Promise<void> {
    await db.query(
      `
        UPDATE monsters
        SET
          type1 = CONCAT(UPPER(LEFT(type1, 1)), LOWER(SUBSTRING(type1 FROM 2))),
          type2 = CASE WHEN type2 IS NOT NULL THEN CONCAT(UPPER(LEFT(type2, 1)), LOWER(SUBSTRING(type2 FROM 2))) ELSE NULL END,
          type3 = CASE WHEN type3 IS NOT NULL THEN CONCAT(UPPER(LEFT(type3, 1)), LOWER(SUBSTRING(type3 FROM 2))) ELSE NULL END,
          type4 = CASE WHEN type4 IS NOT NULL THEN CONCAT(UPPER(LEFT(type4, 1)), LOWER(SUBSTRING(type4 FROM 2))) ELSE NULL END,
          type5 = CASE WHEN type5 IS NOT NULL THEN CONCAT(UPPER(LEFT(type5, 1)), LOWER(SUBSTRING(type5 FROM 2))) ELSE NULL END
        WHERE trainer_id = $1
          AND (
            type1 IS DISTINCT FROM CONCAT(UPPER(LEFT(type1, 1)), LOWER(SUBSTRING(type1 FROM 2)))
            OR type2 IS DISTINCT FROM CASE WHEN type2 IS NOT NULL THEN CONCAT(UPPER(LEFT(type2, 1)), LOWER(SUBSTRING(type2 FROM 2))) ELSE NULL END
            OR type3 IS DISTINCT FROM CASE WHEN type3 IS NOT NULL THEN CONCAT(UPPER(LEFT(type3, 1)), LOWER(SUBSTRING(type3 FROM 2))) ELSE NULL END
            OR type4 IS DISTINCT FROM CASE WHEN type4 IS NOT NULL THEN CONCAT(UPPER(LEFT(type4, 1)), LOWER(SUBSTRING(type4 FROM 2))) ELSE NULL END
            OR type5 IS DISTINCT FROM CASE WHEN type5 IS NOT NULL THEN CONCAT(UPPER(LEFT(type5, 1)), LOWER(SUBSTRING(type5 FROM 2))) ELSE NULL END
          )
      `,
      [trainerId]
    );
  }

  /**
   * Lightweight update for box position only — avoids the overhead of the full update() method.
   */
  private async updateBoxPosition(id: number, boxNumber: number, trainerIndex: number): Promise<void> {
    await db.query(
      `UPDATE monsters SET box_number = $1, trainer_index = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [boxNumber, trainerIndex, id]
    );
  }

  /**
   * Find the next empty position in the box system.
   * Iterates box 0-99, position 0-29 (30 slots per box).
   */
  private findNextEmptyPosition(occupiedPositions: Set<string>): { boxNumber: number; trainerIndex: number } | null {
    for (let boxNumber = 0; boxNumber < 100; boxNumber++) {
      for (let trainerIndex = 0; trainerIndex < 30; trainerIndex++) {
        if (!occupiedPositions.has(`${boxNumber}-${trainerIndex}`)) {
          return { boxNumber, trainerIndex };
        }
      }
    }
    return null;
  }

  /**
   * Fix duplicate box positions — when two or more monsters share the same slot,
   * keep the first (lowest ID) and move the rest to the next empty slot.
   */
  async fixDuplicateBoxPositions(trainerId: number): Promise<void> {
    const result = await db.query<{ id: number; box_number: number | null; trainer_index: number | null }>(
      `SELECT id, box_number, trainer_index FROM monsters WHERE trainer_id = $1 ORDER BY id ASC`,
      [trainerId]
    );
    const allMonsters = result.rows;

    // Group monsters by their box position
    const positionGroups = new Map<string, { id: number; box_number: number; trainer_index: number }[]>();
    for (const monster of allMonsters) {
      if (monster.box_number !== null && monster.trainer_index !== null) {
        const key = `${monster.box_number}-${monster.trainer_index}`;
        const group = positionGroups.get(key);
        if (group) {
          group.push(monster as { id: number; box_number: number; trainer_index: number });
        } else {
          positionGroups.set(key, [monster as { id: number; box_number: number; trainer_index: number }]);
        }
      }
    }

    // Find positions with more than one monster
    const duplicates: { position: string; monsters: { id: number }[] }[] = [];
    for (const [position, monsters] of positionGroups) {
      if (monsters.length > 1) {
        duplicates.push({ position, monsters });
      }
    }

    if (duplicates.length === 0) {
      return;
    }

    // Build set of single-occupied positions
    const occupiedPositions = new Set<string>();
    for (const [position, monsters] of positionGroups) {
      if (monsters.length === 1) {
        occupiedPositions.add(position);
      }
    }

    // For each duplicate, keep the first monster and move the rest
    for (const { position, monsters } of duplicates) {
      occupiedPositions.add(position);
      const monstersToMove = monsters.slice(1);

      for (const monster of monstersToMove) {
        const newPos = this.findNextEmptyPosition(occupiedPositions);
        if (newPos) {
          await this.updateBoxPosition(monster.id, newPos.boxNumber, newPos.trainerIndex);
          occupiedPositions.add(`${newPos.boxNumber}-${newPos.trainerIndex}`);
        }
      }
    }
  }

  /**
   * Auto-assign box positions to monsters that don't have them.
   * Calls fixDuplicateBoxPositions first, then appends unassigned monsters
   * after the highest currently occupied position (preserveGaps behavior).
   */
  async autoAssignBoxPositions(trainerId: number): Promise<void> {
    await this.fixDuplicateBoxPositions(trainerId);

    // Re-fetch after fixing duplicates
    const result = await db.query<{ id: number; box_number: number | null; trainer_index: number | null }>(
      `SELECT id, box_number, trainer_index FROM monsters WHERE trainer_id = $1 ORDER BY id ASC`,
      [trainerId]
    );
    const allMonsters = result.rows;

    const unassigned = allMonsters.filter(m => m.box_number === null || m.trainer_index === null);
    if (unassigned.length === 0) {
      return;
    }

    // Find the highest occupied position to append after it
    let maxBox = 0;
    let maxPositionInHighestBox = -1;

    for (const m of allMonsters) {
      if (m.box_number !== null && m.trainer_index !== null) {
        if (m.box_number > maxBox) {
          maxBox = m.box_number;
          maxPositionInHighestBox = m.trainer_index;
        } else if (m.box_number === maxBox && m.trainer_index > maxPositionInHighestBox) {
          maxPositionInHighestBox = m.trainer_index;
        }
      }
    }

    let currentBox = maxBox;
    let currentPosition = maxPositionInHighestBox + 1;

    for (const monster of unassigned) {
      if (currentPosition >= 30) {
        currentPosition = 0;
        currentBox++;
      }
      await this.updateBoxPosition(monster.id, currentBox, currentPosition);
      currentPosition++;
    }
  }
}
