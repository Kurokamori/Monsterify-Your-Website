import { db } from '../database';

export type MoveRow = {
  MoveName: string;
  Type: string;
  Attribute: string | null;
  Power: number | null;
  Accuracy: number | null;
  PP: number | null;
  Priority: number | null;
  Effect: string | null;
  EffectChance: number | null;
  Target: string | null;
  MoveType: string | null;
  LearnLevel: number | null;
};

export type Move = {
  moveName: string;
  moveType: string;
  attribute: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number | null;
  description: string | null;
  effectChance: number | null;
  target: string | null;
  moveCategory: string | null;
  learnLevel: number | null;
};

const SELECT_MOVES = `
  SELECT
    "MoveName" as move_name,
    "Type" as move_type,
    "Attribute" as attribute,
    "Power" as power,
    "Accuracy" as accuracy,
    "PP" as pp,
    "Priority" as priority,
    "Effect" as description,
    "EffectChance" as effect_chance,
    "Target" as target,
    "MoveType" as move_category,
    "LearnLevel" as learn_level
  FROM moves
`;

type MoveQueryRow = {
  move_name: string;
  move_type: string;
  attribute: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number | null;
  description: string | null;
  effect_chance: number | null;
  target: string | null;
  move_category: string | null;
  learn_level: number | null;
};

const normalizeMove = (row: MoveQueryRow): Move => ({
  moveName: row.move_name,
  moveType: row.move_type,
  attribute: row.attribute,
  power: row.power,
  accuracy: row.accuracy,
  pp: row.pp,
  priority: row.priority,
  description: row.description,
  effectChance: row.effect_chance,
  target: row.target,
  moveCategory: row.move_category,
  learnLevel: row.learn_level,
});

export class MoveRepository {
  async findAll(): Promise<Move[]> {
    const result = await db.query<MoveQueryRow>(
      `${SELECT_MOVES} ORDER BY "MoveName"`
    );
    return result.rows.map(normalizeMove);
  }

  async findByName(moveName: string): Promise<Move | null> {
    const result = await db.query<MoveQueryRow>(
      `${SELECT_MOVES} WHERE LOWER("MoveName") = LOWER($1)`,
      [moveName]
    );
    const row = result.rows[0];
    return row ? normalizeMove(row) : null;
  }

  async findByNames(moveNames: string[]): Promise<Move[]> {
    if (!moveNames || moveNames.length === 0) {
      return [];
    }

    const placeholders = moveNames.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query<MoveQueryRow>(
      `${SELECT_MOVES} WHERE "MoveName" IN (${placeholders}) ORDER BY "MoveName"`,
      moveNames
    );
    return result.rows.map(normalizeMove);
  }

  async findByType(moveType: string): Promise<Move[]> {
    const result = await db.query<MoveQueryRow>(
      `${SELECT_MOVES} WHERE "Type" = $1 ORDER BY "MoveName"`,
      [moveType]
    );
    return result.rows.map(normalizeMove);
  }

  async findByAttribute(attribute: string): Promise<Move[]> {
    const result = await db.query<MoveQueryRow>(
      `${SELECT_MOVES} WHERE "Attribute" = $1 ORDER BY "MoveName"`,
      [attribute]
    );
    return result.rows.map(normalizeMove);
  }

  async findByCategory(category: string): Promise<Move[]> {
    const result = await db.query<MoveQueryRow>(
      `${SELECT_MOVES} WHERE "MoveType" = $1 ORDER BY "MoveName"`,
      [category]
    );
    return result.rows.map(normalizeMove);
  }
}
