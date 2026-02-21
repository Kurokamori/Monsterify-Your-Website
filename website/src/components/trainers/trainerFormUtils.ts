import type { TrainerFormData, Trainer, FormSecret, FormRelation, FormAdditionalRef, MegaFormData } from './types/Trainer';
import { parseTrainerTheme, parseVoiceClaim, combineTrainerTheme, combineVoiceClaim } from './types/Trainer';

// Convert Trainer to TrainerFormData
export function trainerToFormData(trainer: Partial<Trainer>): Partial<TrainerFormData> {
  const { display: themeDisplay, link: themeLink } = parseTrainerTheme(trainer.theme);
  const { display: vcDisplay, link: vcLink } = parseVoiceClaim(trainer.voice_claim);

  return {
    name: trainer.name || '',
    nickname: trainer.nickname,
    full_name: trainer.full_name,
    level: trainer.level,
    faction: trainer.faction,
    title: trainer.title,
    currency_amount: trainer.currency_amount,
    total_earned_currency: trainer.total_earned_currency,
    main_ref: trainer.main_ref,
    gender: trainer.gender,
    pronouns: trainer.pronouns,
    sexuality: trainer.sexuality,
    age: trainer.age,
    height: trainer.height,
    weight: trainer.weight,
    theme_display: themeDisplay,
    theme_link: themeLink,
    voice_claim_display: vcDisplay,
    voice_claim_link: vcLink,
    occupation: trainer.occupation,
    birthday: trainer.birthday,
    zodiac: trainer.zodiac,
    chinese_zodiac: trainer.chinese_zodiac,
    birthplace: trainer.birthplace,
    residence: trainer.residence,
    race: trainer.race,
    species1: trainer.species1,
    species2: trainer.species2,
    species3: trainer.species3,
    type1: trainer.type1,
    type2: trainer.type2,
    type3: trainer.type3,
    type4: trainer.type4,
    type5: trainer.type5,
    type6: trainer.type6,
    ability: trainer.ability,
    nature: trainer.nature,
    characteristic: trainer.characteristic,
    fav_type1: trainer.fav_type1,
    fav_type2: trainer.fav_type2,
    fav_type3: trainer.fav_type3,
    fav_type4: trainer.fav_type4,
    fav_type5: trainer.fav_type5,
    fav_type6: trainer.fav_type6,
    fav_berry: trainer.fav_berry,
    strengths: trainer.strengths,
    weaknesses: trainer.weaknesses,
    likes: trainer.likes,
    dislikes: trainer.dislikes,
    flaws: trainer.flaws,
    values: trainer.values,
    quirks: trainer.quirks,
    quote: trainer.quote,
    tldr: trainer.tldr,
    biography: trainer.biography,
  };
}

// Parse JSON field that may be a string or already-parsed object
function parseJsonField<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value as T;
}

// Extract secrets from trainer data
export function parseTrainerSecrets(trainer: Partial<Trainer>): FormSecret[] {
  const data = parseJsonField<Array<Record<string, unknown>>>(trainer.secrets);
  if (!Array.isArray(data)) return [];
  return data.map(s => ({
    id: (s.id as number) || Date.now() + Math.random() * 1000,
    title: (s.title as string) || '',
    description: (s.description as string) || '',
  }));
}

// Extract relations from trainer data
export function parseTrainerRelations(trainer: Partial<Trainer>): FormRelation[] {
  const data = parseJsonField<Array<Record<string, unknown>>>(trainer.relations);
  if (!Array.isArray(data)) return [];
  return data.map(r => ({
    id: (r.id as number) || Date.now() + Math.random() * 1000,
    type: (r.type as 'trainer' | 'monster') || (r.monster_id ? 'monster' : 'trainer'),
    trainer_id: String(r.trainer_id || ''),
    monster_id: String(r.monster_id || ''),
    name: (r.name as string) || '',
    elaboration: (r.elaboration as string) || '',
  }));
}

// Extract additional refs from trainer data
export function parseTrainerAdditionalRefs(trainer: Partial<Trainer>): FormAdditionalRef[] {
  const data = parseJsonField<Array<Record<string, unknown>>>(trainer.additional_refs);
  if (!Array.isArray(data)) return [];
  return data.map(r => ({
    id: (r.id as number) || Date.now() + Math.random() * 1000,
    title: (r.title as string) || '',
    description: (r.description as string) || '',
    image_url: (r.image_url as string) || (r.url as string) || '',
  }));
}

// Extract mega evolution data from trainer
export function parseTrainerMegaData(trainer: Partial<Trainer>): MegaFormData {
  const megaInfo = parseJsonField<Record<string, string>>(trainer.mega_info);
  return {
    mega_ref: megaInfo?.mega_ref || trainer.mega_ref || '',
    mega_artist: megaInfo?.mega_artist || trainer.mega_artist || '',
    mega_species1: megaInfo?.mega_species1 || trainer.mega_species1 || '',
    mega_species2: megaInfo?.mega_species2 || trainer.mega_species2 || '',
    mega_species3: megaInfo?.mega_species3 || trainer.mega_species3 || '',
    mega_type1: megaInfo?.mega_type1 || trainer.mega_type1 || '',
    mega_type2: megaInfo?.mega_type2 || trainer.mega_type2 || '',
    mega_type3: megaInfo?.mega_type3 || trainer.mega_type3 || '',
    mega_type4: megaInfo?.mega_type4 || trainer.mega_type4 || '',
    mega_type5: megaInfo?.mega_type5 || trainer.mega_type5 || '',
    mega_type6: megaInfo?.mega_type6 || trainer.mega_type6 || '',
    mega_ability: megaInfo?.mega_ability || trainer.mega_ability || '',
  };
}

// Build FormData for submission
export function buildTrainerSubmitFormData(
  formData: Partial<TrainerFormData>,
  secrets: FormSecret[],
  relations: FormRelation[],
  additionalRefs: FormAdditionalRef[],
  megaData: MegaFormData | null,
  mainRefFile: File | null,
  megaRefFile: File | null,
): FormData {
  const fd = new FormData();

  // Combine theme and voice claim fields
  const theme = combineTrainerTheme(formData.theme_display || '', formData.theme_link || '');
  const voiceClaim = combineVoiceClaim(formData.voice_claim_display || '', formData.voice_claim_link || '');

  // Append all simple form fields (skip theme/voice_claim display/link since we combine them)
  const skipFields = new Set(['theme_display', 'theme_link', 'voice_claim_display', 'voice_claim_link']);
  for (const [key, value] of Object.entries(formData)) {
    if (skipFields.has(key)) continue;
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, String(value));
    }
  }

  // Append combined fields
  fd.append('theme', theme);
  fd.append('voice_claim', voiceClaim);

  // Append JSON fields
  fd.append('secrets', JSON.stringify(secrets));
  fd.append('relations', JSON.stringify(relations));
  fd.append(
    'additional_refs',
    JSON.stringify(additionalRefs.map(r => ({ id: r.id, title: r.title, description: r.description, image_url: r.image_url })).filter(r => r.title || r.description || r.image_url))
  );

  // Mega info as JSON (edit mode)
  if (megaData) {
    fd.append('mega_info', JSON.stringify(megaData));
  }

  // File uploads (server expects single 'image' field)
  if (mainRefFile) {
    fd.append('image', mainRefFile);
    fd.append('uploadType', 'main_ref');
  } else if (megaRefFile) {
    fd.append('image', megaRefFile);
    fd.append('uploadType', 'mega_ref');
  }

  return fd;
}
