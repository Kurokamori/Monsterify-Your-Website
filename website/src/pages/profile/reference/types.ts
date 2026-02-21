import type { SpeciesImageMap } from '../../../services/speciesService';

/** A monster that needs a reference (no img_link) */
export interface UnreferencedMonster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  img_link?: string;
  species1_image?: string;
  species2_image?: string;
  species3_image?: string;
}

/** Trainer with their unreferenced monsters */
export interface TrainerWithMonsters {
  id: number;
  name: string;
  monsters: UnreferencedMonster[];
}

/** Trainer summary for the helper page dropdown */
export interface TrainerSummary {
  id: number;
  name: string;
  unreferencedCount: number;
  player_user_id?: string;
}

/** Image size presets */
export type ImageSize = 'small' | 'medium' | 'large' | 'max-width';

export const IMAGE_SIZES: ImageSize[] = ['small', 'medium', 'large', 'max-width'];

export const IMAGE_SIZE_LABELS: Record<ImageSize, string> = {
  'small': 'Small Images',
  'medium': 'Medium Images',
  'large': 'Large Images',
  'max-width': 'Max Width',
};

/** Check if an img_link value is empty/null/undefined */
export function isEmptyImgLink(imgLink: unknown): boolean {
  if (!imgLink) return true;
  const str = String(imgLink).trim();
  return str === '' || str === 'null' || str === 'NULL' || str === 'undefined';
}

/** Collect all unique species names from a list of monsters */
export function collectSpeciesNames(monsters: UnreferencedMonster[]): string[] {
  const species = new Set<string>();
  for (const monster of monsters) {
    if (monster.species1) species.add(monster.species1);
    if (monster.species2) species.add(monster.species2);
    if (monster.species3) species.add(monster.species3);
  }
  return Array.from(species);
}

/** Get species info entries for a monster */
export function getMonsterSpeciesInfo(
  monster: UnreferencedMonster,
  speciesImages: SpeciesImageMap,
): Array<{ name: string; image?: string }> {
  const entries: Array<{ name: string; image?: string }> = [];

  if (monster.species1) {
    entries.push({
      name: monster.species1,
      image: speciesImages[monster.species1]?.image_url || monster.species1_image,
    });
  }
  if (monster.species2) {
    entries.push({
      name: monster.species2,
      image: speciesImages[monster.species2]?.image_url || monster.species2_image,
    });
  }
  if (monster.species3) {
    entries.push({
      name: monster.species3,
      image: speciesImages[monster.species3]?.image_url || monster.species3_image,
    });
  }

  return entries;
}

/** Get all types from a monster as a list */
export function getMonsterTypes(monster: UnreferencedMonster): string[] {
  const types: string[] = [];
  if (monster.type1) types.push(monster.type1);
  if (monster.type2) types.push(monster.type2);
  if (monster.type3) types.push(monster.type3);
  if (monster.type4) types.push(monster.type4);
  if (monster.type5) types.push(monster.type5);
  return types;
}
