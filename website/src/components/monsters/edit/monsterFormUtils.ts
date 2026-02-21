import type { Monster } from '@services/monsterService';

// --- Form types ---

export interface MonsterFormData {
  name: string;
  level: number;
  nature: string;
  characteristic: string;
  gender: string;
  pronouns: string;
  height: string;
  weight: string;
  where_met: string;
  date_met: string;
  shiny: boolean;
  alpha: boolean;
  shadow: boolean;
  paradox: boolean;
  pokerus: boolean;
  held_item: string;
  seal: string;
  mark: string;
  tldr: string;
  bio: string;
  img_link: string;
  likes: string;
  dislikes: string;
  lore: string;
  // Mega evolution
  has_mega_stone: boolean;
  mega_stone_name: string;
  mega_species1: string;
  mega_species2: string;
  mega_species3: string;
  mega_type1: string;
  mega_type2: string;
  mega_ability: string;
  mega_stat_bonus: string;
  mega_stone_img: string;
  mega_image: string;
}

export interface FormFunFact {
  id: number;
  title: string;
  content: string;
}

export interface FormMonsterRelation {
  id: number;
  related_type: string;
  related_id: string;
  trainer_id: string;
  name: string;
  elaboration: string;
}

// --- Converters ---

export function monsterToFormData(monster: Monster): MonsterFormData {
  const str = (v: unknown): string => (v !== null && v !== undefined ? String(v) : '');
  const dateMet = monster.date_met
    ? String(monster.date_met).slice(0, 10)
    : '';

  return {
    name: str(monster.name),
    level: (monster.level as number) ?? 1,
    nature: str(monster.nature),
    characteristic: str(monster[`characteristic`]),
    gender: str(monster.gender),
    pronouns: str(monster[`pronouns`]),
    height: str(monster[`height`]),
    weight: str(monster[`weight`]),
    where_met: str(monster[`where_met`]),
    date_met: dateMet,
    shiny: !!monster[`shiny`],
    alpha: !!monster[`alpha`],
    shadow: !!monster[`shadow`],
    paradox: !!monster[`paradox`],
    pokerus: !!monster[`pokerus`],
    held_item: str(monster[`held_item`]),
    seal: str(monster[`seal`]),
    mark: str(monster[`mark`]),
    tldr: str(monster[`tldr`]),
    bio: str(monster[`bio`]),
    img_link: str(monster.img_link),
    likes: str(monster[`likes`]),
    dislikes: str(monster[`dislikes`]),
    lore: str(monster[`lore`]),
    has_mega_stone: !!monster[`has_mega_stone`],
    mega_stone_name: str(monster[`mega_stone_name`]),
    mega_species1: str(monster[`mega_species1`]),
    mega_species2: str(monster[`mega_species2`]),
    mega_species3: str(monster[`mega_species3`]),
    mega_type1: str(monster[`mega_type1`]),
    mega_type2: str(monster[`mega_type2`]),
    mega_ability: str(monster[`mega_ability`]),
    mega_stat_bonus: str(monster[`mega_stat_bonus`] ?? ''),
    mega_stone_img: str(monster[`mega_stone_img`]),
    mega_image: str(monster[`mega_img_link`]),
  };
}

export function parseMonsterFunFacts(monster: Monster): FormFunFact[] {
  const raw = monster[`fun_facts`];
  if (!raw) return [];
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) return [];
    return data.map((fact: Record<string, unknown>) => ({
      id: (fact.id as number) || Date.now() + Math.floor(Math.random() * 1000),
      title: String(fact.title ?? ''),
      content: String(fact.content ?? ''),
    }));
  } catch {
    return [];
  }
}

export function parseMonsterRelations(monster: Monster): FormMonsterRelation[] {
  const raw = monster[`relations`];
  if (!raw) return [];
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) return [];
    return data.map((rel: Record<string, unknown>) => ({
      id: (rel.id as number) || Date.now() + Math.floor(Math.random() * 1000),
      related_type: String(rel.related_type ?? 'trainer'),
      related_id: String(rel.related_id ?? ''),
      trainer_id: String(rel.trainer_id ?? ''),
      name: String(rel.name ?? ''),
      elaboration: String(rel.elaboration ?? ''),
    }));
  } catch {
    return [];
  }
}

export function buildMonsterSubmitData(
  formData: MonsterFormData,
  funFacts: FormFunFact[],
  relations: FormMonsterRelation[],
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...formData };

  // Level is read-only, don't send it
  delete data.level;
  // Mega images are saved separately via API, don't include in main update
  delete data.mega_stone_img;
  delete data.mega_image;

  // Stringify JSON fields
  data.fun_facts = JSON.stringify(funFacts);
  data.relations = JSON.stringify(relations);

  return data;
}
