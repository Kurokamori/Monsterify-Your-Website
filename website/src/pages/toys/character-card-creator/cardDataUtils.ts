import type { Trainer } from '@components/trainers/types/Trainer';
import type { Monster } from '@services/monsterService';
import type { CardField, StatValues } from './types';
import { getTrainerDefaultFields, getMonsterDefaultFields } from './types';

/** Extract types as comma-separated string from an object with type1..type5/type6 */
function extractTypesString(obj: Record<string, unknown>, max: number): string {
  const types: string[] = [];
  for (let i = 1; i <= max; i++) {
    const val = obj[`type${i}`];
    if (typeof val === 'string' && val) types.push(val);
  }
  return types.join(', ');
}

/** Extract species as slash-separated string */
function extractSpeciesString(obj: Record<string, unknown>): string {
  const species: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const val = obj[`species${i}`];
    if (typeof val === 'string' && val) species.push(val);
  }
  return species.join(' / ');
}

/** Build gender display string for trainer */
function buildTrainerGenderString(t: Trainer): string {
  const parts: string[] = [];
  if (t.gender) parts.push(t.gender);
  if (t.pronouns) parts.push(t.pronouns);
  if (t.sexuality) parts.push(t.sexuality);
  return parts.join(' / ');
}

/** Populate fields from trainer data */
export function populateTrainerFields(trainer: Trainer): CardField[] {
  const fields = getTrainerDefaultFields();
  const data: Record<string, string> = {
    name: trainer.name || '',
    faction: trainer.faction || '',
    species: extractSpeciesString(trainer as unknown as Record<string, unknown>),
    types: extractTypesString(trainer as unknown as Record<string, unknown>, 6),
    ability: (trainer.ability as string) || '',
    gender: buildTrainerGenderString(trainer),
    age: (trainer.age as string) || '',
    height: (trainer.height as string) || '',
    weight: (trainer.weight as string) || '',
    tldr: (trainer.tldr as string) || '',
  };

  return fields.map(f => ({ ...f, value: data[f.id] ?? '' }));
}

/** Populate fields from monster data */
export function populateMonsterFields(monster: Monster): CardField[] {
  const fields = getMonsterDefaultFields();
  const m = monster as Record<string, unknown>;
  const data: Record<string, string> = {
    name: (m.name as string) || '',
    species: extractSpeciesString(m),
    types: extractTypesString(m, 5),
    attribute: (m.attribute as string) || '',
    ability: (m.ability as string) || '',
    nature: (m.nature as string) || '',
    characteristic: (m.characteristic as string) || '',
    gender: (m.gender as string) || '',
    tldr: (m.tldr as string) || (m.biography as string) || '',
  };

  return fields.map(f => ({ ...f, value: data[f.id] ?? '' }));
}

/** Extract stat values from a monster */
export function extractMonsterStats(monster: Monster): StatValues | null {
  const m = monster as Record<string, unknown>;
  const hp = (m.hp_total as number) || 0;
  const atk = (m.atk_total as number) || 0;
  const def = (m.def_total as number) || 0;
  const spa = (m.spa_total as number) || 0;
  const spd = (m.spd_total as number) || 0;
  const spe = (m.spe_total as number) || 0;

  // If all are 0, monster has no stats set
  if (hp + atk + def + spa + spd + spe === 0) return null;

  return { hp, atk, def, spa, spd, spe };
}

/** Split a combined gender field into separate gender, pronouns, sexuality fields using source trainer data */
export function splitGenderField(fields: CardField[], sourceTrainer: Trainer | null): CardField[] {
  const genderIdx = fields.findIndex(f => f.kind === 'gender');
  if (genderIdx === -1) return fields;

  const genderField = fields[genderIdx];
  const genderVal = sourceTrainer?.gender || genderField.value || '';
  const pronounsVal = sourceTrainer?.pronouns || '';
  const sexualityVal = sourceTrainer?.sexuality || '';

  const newFields = [...fields];
  newFields.splice(genderIdx, 1,
    { ...genderField, label: 'Gender', value: genderVal },
    { id: 'pronouns', label: 'Pronouns', value: pronounsVal, visible: genderField.visible, isCustom: false, kind: 'pronouns' as const },
    { id: 'sexuality', label: 'Sexuality', value: sexualityVal, visible: genderField.visible, isCustom: false, kind: 'sexuality' as const },
  );
  return newFields;
}

/** Combine separate gender, pronouns, sexuality fields back into one */
export function combineGenderFields(fields: CardField[]): CardField[] {
  const genderField = fields.find(f => f.kind === 'gender');
  const pronounsField = fields.find(f => f.kind === 'pronouns');
  const sexualityField = fields.find(f => f.kind === 'sexuality');

  if (!genderField) return fields;

  const parts = [
    genderField.value,
    pronounsField?.value || '',
    sexualityField?.value || '',
  ].filter(Boolean);

  const combined: CardField = {
    ...genderField,
    label: 'Gender / Pronouns / Sexuality',
    value: parts.join(' / '),
  };

  return fields
    .filter(f => f.kind !== 'pronouns' && f.kind !== 'sexuality')
    .map(f => f.kind === 'gender' ? combined : f);
}

/** Available extra fields for trainers that aren't in the default set */
export const EXTRA_TRAINER_FIELDS: { id: string; label: string }[] = [
  { id: 'nickname', label: 'Nickname' },
  { id: 'full_name', label: 'Full Name' },
  { id: 'title', label: 'Title' },
  { id: 'level', label: 'Level' },
  { id: 'race', label: 'Race' },
  { id: 'nature', label: 'Nature' },
  { id: 'characteristic', label: 'Characteristic' },
  { id: 'occupation', label: 'Occupation' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'zodiac', label: 'Zodiac' },
  { id: 'birthplace', label: 'Birthplace' },
  { id: 'residence', label: 'Residence' },
  { id: 'quote', label: 'Quote' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'weaknesses', label: 'Weaknesses' },
  { id: 'likes', label: 'Likes' },
  { id: 'dislikes', label: 'Dislikes' },
  { id: 'flaws', label: 'Flaws' },
  { id: 'values', label: 'Values' },
  { id: 'quirks', label: 'Quirks' },
];

/** Available extra fields for monsters */
export const EXTRA_MONSTER_FIELDS: { id: string; label: string }[] = [
  { id: 'level', label: 'Level' },
  { id: 'friendship', label: 'Friendship' },
];

/** Get the value of an extra field from a trainer */
export function getTrainerFieldValue(trainer: Trainer, fieldId: string): string {
  const t = trainer as unknown as Record<string, unknown>;
  const val = t[fieldId];
  if (val === undefined || val === null) return '';
  return String(val);
}

/** Get the value of an extra field from a monster */
export function getMonsterFieldValue(monster: Monster, fieldId: string): string {
  const m = monster as Record<string, unknown>;
  const val = m[fieldId];
  if (val === undefined || val === null) return '';
  return String(val);
}
