/**
 * Monster Attributes Constants
 * Defines evolution stages, special attributes, Digimon ranks, and monster grades
 */

// Evolution stages (primarily for Pokemon-style monsters)
export const EvolutionStage = {
  BASE_STAGE: 'Base Stage',
  MIDDLE_STAGE: 'Middle Stage',
  FINAL_STAGE: 'Final Stage',
} as const;

export type EvolutionStageValue = (typeof EvolutionStage)[keyof typeof EvolutionStage];

export const EVOLUTION_STAGES: EvolutionStageValue[] = Object.values(EvolutionStage);

// Special attributes that can be applied to any monster
export const SpecialAttribute = {
  SHINY: 'Shiny',
  ALPHA: 'Alpha',
  SHADOW: 'Shadow',
  PARADOX: 'Paradox',
  POKERUS: 'Pokerus',
} as const;

export type SpecialAttributeValue = (typeof SpecialAttribute)[keyof typeof SpecialAttribute];

export const SPECIAL_ATTRIBUTES: SpecialAttributeValue[] = Object.values(SpecialAttribute);

// Digimon-specific ranks/stages
export const DigimonRank = {
  BABY_I: 'Baby I',
  BABY_II: 'Baby II',
  CHILD: 'Child',
  ADULT: 'Adult',
  PERFECT: 'Perfect',
  ULTIMATE: 'Ultimate',
} as const;

export type DigimonRankValue = (typeof DigimonRank)[keyof typeof DigimonRank];

export const DIGIMON_RANKS: DigimonRankValue[] = Object.values(DigimonRank);

// Digimon rank order for comparison (lower index = lower rank)
export const DIGIMON_RANK_ORDER: DigimonRankValue[] = [
  DigimonRank.BABY_I,
  DigimonRank.BABY_II,
  DigimonRank.CHILD,
  DigimonRank.ADULT,
  DigimonRank.PERFECT,
  DigimonRank.ULTIMATE,
];

// Digimon attributes (type-like classification)
export const DigimonAttribute = {
  DATA: 'Data',
  VIRUS: 'Virus',
  VACCINE: 'Vaccine',
  FREE: 'Free',
  VARIABLE: 'Variable',
} as const;

export type DigimonAttributeValue = (typeof DigimonAttribute)[keyof typeof DigimonAttribute];

export const DIGIMON_ATTRIBUTES: DigimonAttributeValue[] = Object.values(DigimonAttribute);

// Monster grades (used for ranking/rarity)
export const MonsterGrade = {
  D: 'D',
  E: 'E',
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
} as const;

export type MonsterGradeValue = (typeof MonsterGrade)[keyof typeof MonsterGrade];

export const MONSTER_GRADES: MonsterGradeValue[] = Object.values(MonsterGrade);

// Monster grade order for comparison (lower index = lower grade)
export const MONSTER_GRADE_ORDER: MonsterGradeValue[] = [
  MonsterGrade.E,
  MonsterGrade.D,
  MonsterGrade.C,
  MonsterGrade.B,
  MonsterGrade.A,
  MonsterGrade.S,
];

// Combined attribute type for any monster attribute
export type MonsterAttributeValue =
  | EvolutionStageValue
  | SpecialAttributeValue
  | DigimonRankValue
  | MonsterGradeValue;

// All possible attributes combined
export const ALL_MONSTER_ATTRIBUTES: MonsterAttributeValue[] = [
  ...EVOLUTION_STAGES,
  ...SPECIAL_ATTRIBUTES,
  ...DIGIMON_RANKS,
  ...MONSTER_GRADES,
];

/**
 * Get the rank/order value for a Digimon rank
 * @param rank - The Digimon rank
 * @returns The order index (0-5) or -1 if invalid
 */
export function getDigimonRankOrder(rank: DigimonRankValue): number {
  return DIGIMON_RANK_ORDER.indexOf(rank);
}

/**
 * Compare two Digimon ranks
 * @param rank1 - First rank
 * @param rank2 - Second rank
 * @returns Negative if rank1 < rank2, positive if rank1 > rank2, 0 if equal
 */
export function compareDigimonRanks(rank1: DigimonRankValue, rank2: DigimonRankValue): number {
  return getDigimonRankOrder(rank1) - getDigimonRankOrder(rank2);
}

/**
 * Get the order value for a monster grade
 * @param grade - The monster grade
 * @returns The order index (0-5) or -1 if invalid
 */
export function getMonsterGradeOrder(grade: MonsterGradeValue): number {
  return MONSTER_GRADE_ORDER.indexOf(grade);
}

/**
 * Compare two monster grades
 * @param grade1 - First grade
 * @param grade2 - Second grade
 * @returns Negative if grade1 < grade2, positive if grade1 > grade2, 0 if equal
 */
export function compareMonsterGrades(grade1: MonsterGradeValue, grade2: MonsterGradeValue): number {
  return getMonsterGradeOrder(grade1) - getMonsterGradeOrder(grade2);
}

/**
 * Check if a value is a valid evolution stage
 */
export function isEvolutionStage(value: string): value is EvolutionStageValue {
  return EVOLUTION_STAGES.includes(value as EvolutionStageValue);
}

/**
 * Check if a value is a valid special attribute
 */
export function isSpecialAttribute(value: string): value is SpecialAttributeValue {
  return SPECIAL_ATTRIBUTES.includes(value as SpecialAttributeValue);
}

/**
 * Check if a value is a valid Digimon rank
 */
export function isDigimonRank(value: string): value is DigimonRankValue {
  return DIGIMON_RANKS.includes(value as DigimonRankValue);
}

/**
 * Check if a value is a valid monster grade
 */
export function isMonsterGrade(value: string): value is MonsterGradeValue {
  return MONSTER_GRADES.includes(value as MonsterGradeValue);
}

/**
 * Check if a value is any valid monster attribute
 */
export function isValidMonsterAttribute(value: string): value is MonsterAttributeValue {
  return ALL_MONSTER_ATTRIBUTES.includes(value as MonsterAttributeValue);
}

/**
 * Map Digimon ranks to approximate Pokemon evolution stages
 */
export const DIGIMON_RANK_TO_EVOLUTION_STAGE: Record<DigimonRankValue, EvolutionStageValue> = {
  [DigimonRank.BABY_I]: EvolutionStage.BASE_STAGE,
  [DigimonRank.BABY_II]: EvolutionStage.BASE_STAGE,
  [DigimonRank.CHILD]: EvolutionStage.MIDDLE_STAGE,
  [DigimonRank.ADULT]: EvolutionStage.MIDDLE_STAGE,
  [DigimonRank.PERFECT]: EvolutionStage.FINAL_STAGE,
  [DigimonRank.ULTIMATE]: EvolutionStage.FINAL_STAGE,
};

/**
 * Map monster grades to approximate Pokemon evolution stages
 */
export const MONSTER_GRADE_TO_EVOLUTION_STAGE: Record<MonsterGradeValue, EvolutionStageValue> = {
  [MonsterGrade.E]: EvolutionStage.BASE_STAGE,
  [MonsterGrade.D]: EvolutionStage.BASE_STAGE,
  [MonsterGrade.C]: EvolutionStage.MIDDLE_STAGE,
  [MonsterGrade.B]: EvolutionStage.MIDDLE_STAGE,
  [MonsterGrade.A]: EvolutionStage.FINAL_STAGE,
  [MonsterGrade.S]: EvolutionStage.FINAL_STAGE,
};
