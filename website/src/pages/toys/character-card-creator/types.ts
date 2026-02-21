// --- Character Card Creator Types ---

export type CardSubject = 'trainer' | 'monster' | 'custom';
export type TypeDisplayMode = 'badges' | 'text';
export type GenderDisplayMode = 'word' | 'symbol';
export type GenderSymbolColor = 'text' | 'gendered';
export type ContentLayoutMode = 'simple' | 'two-column' | 'panelled' | 'compact' | 'two-column-panelled' | 'two-column-combined';
export type ImageObjectFit = 'cover' | 'contain';
export type GenderFieldMode = 'combined' | 'split';

export interface CardField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  isCustom: boolean;
  /** For special rendering (types, stats, gender, attribute, pronouns, sexuality) */
  kind: 'text' | 'types' | 'stats' | 'gender' | 'attribute' | 'species' | 'pronouns' | 'sexuality';
}

export interface StatValues {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface CardLayout {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  borderColor: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  borderRadius: number;
}

export interface CardCustomization {
  layout: CardLayout;
  headingFontSize: number;
  paragraphFontSize: number;
  useHeadingColor: boolean;
  imageSize: number;
  aspectRatio: string;
  typeDisplay: TypeDisplayMode;
  genderDisplay: GenderDisplayMode;
  genderSymbolColor: GenderSymbolColor;
  showStatBars: boolean;
  imageObjectFit: ImageObjectFit;
  imageScale: number;
  imagePositionX: number;
  imagePositionY: number;
  contentPadding: number;
  contentLayout: ContentLayoutMode;
  contentGap: number;
  panelBorderColor: string;
  genderFieldMode: GenderFieldMode;
}

export interface CardData {
  subject: CardSubject;
  sourceId: number | null;
  name: string;
  image: string | null;
  imageFile: File | null;
  fields: CardField[];
  stats: StatValues | null;
  customization: CardCustomization;
}

// --- Layout Presets ---

export const LAYOUT_PRESETS: CardLayout[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    primaryColor: '#1e2532',
    secondaryColor: '#2b3645',
    borderColor: '#4b5d76',
    textColor: '#eee2e2',
    headingColor: '#cda00f',
    accentColor: '#cda00f',
    borderRadius: 12,
  },
  {
    id: 'dawn',
    name: 'Dawn',
    primaryColor: '#faf6f0',
    secondaryColor: '#f0e8dc',
    borderColor: '#d4c4a8',
    textColor: '#2d2318',
    headingColor: '#8b6914',
    accentColor: '#b8860b',
    borderRadius: 12,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    primaryColor: '#0d1b2a',
    secondaryColor: '#1b2838',
    borderColor: '#34508a',
    textColor: '#c8d8e8',
    headingColor: '#5a9fd0',
    accentColor: '#405ea7',
    borderRadius: 8,
  },
  {
    id: 'ember',
    name: 'Ember',
    primaryColor: '#1a0f0f',
    secondaryColor: '#2a1515',
    borderColor: '#6b2020',
    textColor: '#f0d0c0',
    headingColor: '#e07030',
    accentColor: '#c85a10',
    borderRadius: 8,
  },
  {
    id: 'forest',
    name: 'Forest',
    primaryColor: '#0f1a10',
    secondaryColor: '#1a2a1b',
    borderColor: '#3a5a2e',
    textColor: '#d0e8c8',
    headingColor: '#6aaa40',
    accentColor: '#468028',
    borderRadius: 8,
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    primaryColor: '#18101e',
    secondaryColor: '#261830',
    borderColor: '#5a3878',
    textColor: '#e0d0f0',
    headingColor: '#b060d0',
    accentColor: '#7e4086',
    borderRadius: 16,
  },
  {
    id: 'clean',
    name: 'Clean White',
    primaryColor: '#ffffff',
    secondaryColor: '#f5f5f5',
    borderColor: '#dddddd',
    textColor: '#333333',
    headingColor: '#111111',
    accentColor: '#555555',
    borderRadius: 4,
  },
  {
    id: 'retro',
    name: 'Retro',
    primaryColor: '#2b2120',
    secondaryColor: '#3a302e',
    borderColor: '#c8a050',
    textColor: '#e8d8b0',
    headingColor: '#f0c848',
    accentColor: '#c8a050',
    borderRadius: 0,
  },
];

// --- Default Field Templates ---

export function getTrainerDefaultFields(): CardField[] {
  return [
    { id: 'name', label: 'Name', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'faction', label: 'Faction', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'species', label: 'Species', value: '', visible: true, isCustom: false, kind: 'species' },
    { id: 'types', label: 'Types', value: '', visible: true, isCustom: false, kind: 'types' },
    { id: 'ability', label: 'Ability', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'gender', label: 'Gender / Pronouns / Sexuality', value: '', visible: true, isCustom: false, kind: 'gender' },
    { id: 'age', label: 'Age', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'height', label: 'Height', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'weight', label: 'Weight', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'tldr', label: 'Bio', value: '', visible: true, isCustom: false, kind: 'text' },
  ];
}

export function getMonsterDefaultFields(): CardField[] {
  return [
    { id: 'name', label: 'Name', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'species', label: 'Species', value: '', visible: true, isCustom: false, kind: 'species' },
    { id: 'types', label: 'Types', value: '', visible: true, isCustom: false, kind: 'types' },
    { id: 'attribute', label: 'Attribute', value: '', visible: true, isCustom: false, kind: 'attribute' },
    { id: 'ability', label: 'Ability', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'nature', label: 'Nature', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'characteristic', label: 'Characteristic', value: '', visible: true, isCustom: false, kind: 'text' },
    { id: 'gender', label: 'Gender', value: '', visible: true, isCustom: false, kind: 'gender' },
    { id: 'tldr', label: 'Bio', value: '', visible: true, isCustom: false, kind: 'text' },
  ];
}

export function getDefaultCustomization(): CardCustomization {
  return {
    layout: LAYOUT_PRESETS[0],
    headingFontSize: 14,
    paragraphFontSize: 12,
    useHeadingColor: true,
    imageSize: 40,
    aspectRatio: '16:9',
    typeDisplay: 'badges',
    genderDisplay: 'symbol',
    genderSymbolColor: 'gendered',
    showStatBars: true,
    imageObjectFit: 'cover',
    imageScale: 100,
    imagePositionX: 50,
    imagePositionY: 50,
    contentPadding: 16,
    contentLayout: 'simple',
    contentGap: 4,
    panelBorderColor: '#4b5d76',
    genderFieldMode: 'combined',
  };
}

export function getDefaultCardData(): CardData {
  return {
    subject: 'trainer',
    sourceId: null,
    name: '',
    image: null,
    imageFile: null,
    fields: getTrainerDefaultFields(),
    stats: null,
    customization: getDefaultCustomization(),
  };
}

// --- Aspect ratio helpers ---

export const ASPECT_RATIOS: { label: string; value: string; width: number; height: number }[] = [
  { label: '16:9 (Landscape)', value: '16:9', width: 800, height: 450 },
  { label: '4:3 (Classic)', value: '4:3', width: 800, height: 600 },
  { label: '1:1 (Square)', value: '1:1', width: 600, height: 600 },
  { label: '3:4 (Portrait)', value: '3:4', width: 600, height: 800 },
  { label: '9:16 (Tall)', value: '9:16', width: 450, height: 800 },
  { label: '2:1 (Wide)', value: '2:1', width: 800, height: 400 },
];

export function getAspectDimensions(ratio: string): { width: number; height: number } {
  const found = ASPECT_RATIOS.find(r => r.value === ratio);
  return found ?? { width: 800, height: 450 };
}
