import { createElement } from 'react';
import { type FranchiseKey, FRANCHISE_CONFIG } from '@services/speciesService';
import { type ColumnDef } from '@components/admin/AdminTable';
import { type FieldSection } from '@components/admin/AdminForm';
import { EvolutionLineEditor, FakemonAutocompleteField } from '@components/admin/EvolutionLineEditor';
import { type EvolutionEntry } from '@services/fakemonService';

// ── Types ───────────────────────────────────────────────────────────

export interface Species {
  [key: string]: unknown;
}

export interface SpeciesAdminConfig {
  franchise: FranchiseKey;
  label: string;
  icon: string;
  columns: ColumnDef<Species>[];
  formSections: FieldSection[];
  defaultValues: Record<string, unknown>;
  validate: (values: Record<string, unknown>) => Record<string, string>;
  filterOptions?: Record<string, string[]>;
  hasMassAdd?: boolean;
}

// ── URL slug → FranchiseKey mapping ─────────────────────────────────

export const SLUG_TO_FRANCHISE: Record<string, FranchiseKey> = {
  'pokemon': 'pokemon',
  'digimon': 'digimon',
  'nexomon': 'nexomon',
  'yokai-watch': 'yokai',
  'pals': 'pals',
  'monster-hunter': 'monsterhunter',
  'final-fantasy': 'finalfantasy',
  'fakemon': 'fakemon',
};

// ── Option lists ────────────────────────────────────────────────────

const POKEMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy',
];

const EVOLUTION_STAGES = ['Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"];

const DIGIMON_RANKS = ['Fresh', 'In-Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Ultra', 'Armor'];
const DIGIMON_ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];

const NEXOMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Plant', 'Wind', 'Mineral',
  'Psychic', 'Ghost', 'Dark', 'Light', 'Dragon', 'Beast', 'Cosmic',
];

const YOKAI_TRIBES = ['Brave', 'Mysterious', 'Tough', 'Charming', 'Heartful', 'Shady', 'Eerie', 'Slippery', 'Wicked', 'Enma'];
const YOKAI_RANKS = ['E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank', 'SS-Rank'];

const MH_CLASSES = [
  'Flying Wyvern', 'Brute Wyvern', 'Fanged Wyvern', 'Bird Wyvern',
  'Piscine Wyvern', 'Leviathan', 'Elder Dragon', 'Fanged Beast',
  'Neopteron', 'Carapaceon', 'Amphibian', 'Snake Wyvern', 'Temnoceran',
];
const MH_ELEMENTS = ['Fire', 'Water', 'Thunder', 'Ice', 'Dragon', 'Poison', 'Sleep', 'Paralysis', 'Blast', 'None'];

const FF_CATEGORIES = ['Beast', 'Aerial', 'Aquatic', 'Undead', 'Mechanical', 'Demon', 'Dragon', 'Humanoid', 'Plant', 'Summon', 'Boss'];
const FF_ELEMENTS = ['Fire', 'Ice', 'Thunder', 'Water', 'Wind', 'Earth', 'Holy', 'Dark', 'Poison', 'None'];
const FF_GAMES = [
  'FF I', 'FF II', 'FF III', 'FF IV', 'FF V', 'FF VI',
  'FF VII', 'FF VIII', 'FF IX', 'FF X', 'FF XI', 'FF XII',
  'FF XIII', 'FF XIV', 'FF XV', 'FF XVI', 'FF Tactics', 'Other',
];

const FAKEMON_ATTRIBUTES = ['Virus', 'Vaccine', 'Data', 'Free', 'Variable'];


// ── Helpers ─────────────────────────────────────────────────────────

function toOptions(values: string[]) {
  return values.map(v => ({ value: v, label: v }));
}

function required(values: Record<string, unknown>, key: string, label: string, errors: Record<string, string>) {
  const v = values[key];
  if (v === undefined || v === null || v === '' || (typeof v === 'string' && !v.trim())) {
    errors[key] = `${label} is required`;
  }
}

// ── Render helpers for columns ──────────────────────────────────────

// ── Per-franchise configurations ────────────────────────────────────

const pokemonConfig: SpeciesAdminConfig = {
  franchise: 'pokemon',
  label: 'Pokemon',
  icon: 'fas fa-bolt',
  filterOptions: {
    type: POKEMON_TYPES,
    stage: EVOLUTION_STAGES,
  },
  columns: [
    { key: 'ndex', header: '#', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'typePrimary', header: 'Type 1' },
    { key: 'typeSecondary', header: 'Type 2' },
    { key: 'stage', header: 'Stage', sortable: true },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'ndex', label: 'Pokedex Number', type: 'number', required: true, min: 1 },
        { key: 'typePrimary', label: 'Primary Type', type: 'select', required: true, options: toOptions(POKEMON_TYPES) },
        { key: 'typeSecondary', label: 'Secondary Type', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(POKEMON_TYPES)] },
        { key: 'stage', label: 'Evolution Stage', type: 'select', required: true, options: toOptions(EVOLUTION_STAGES) },
      ],
    },
    {
      fields: [
        { key: 'evolvesFrom', label: 'Evolves From', type: 'text', helpText: 'Comma-separated names' },
        { key: 'evolvesTo', label: 'Evolves To', type: 'text', helpText: 'Comma-separated names' },
        { key: 'breedingResults', label: 'Breeding Results', type: 'text', helpText: 'Baby form from breeding' },
        { key: 'isLegendary', label: 'Legendary Pokemon', type: 'checkbox' },
        { key: 'isMythical', label: 'Mythical Pokemon', type: 'checkbox' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: {
    name: '', ndex: '', typePrimary: '', typeSecondary: '', stage: '',
    evolvesFrom: '', evolvesTo: '', breedingResults: '',
    isLegendary: false, isMythical: false, imageUrl: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    required(values, 'ndex', 'Pokedex Number', errors);
    required(values, 'typePrimary', 'Primary Type', errors);
    required(values, 'stage', 'Evolution Stage', errors);
    const ndex = values.ndex;
    if (ndex !== '' && ndex !== undefined && (isNaN(Number(ndex)) || Number(ndex) <= 0)) {
      errors.ndex = 'Must be a positive number';
    }
    return errors;
  },
};

const digimonConfig: SpeciesAdminConfig = {
  franchise: 'digimon',
  label: 'Digimon',
  icon: 'fas fa-microchip',
  filterOptions: {
    rank: DIGIMON_RANKS,
    attribute: DIGIMON_ATTRIBUTES,
  },
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'rank', header: 'Rank', sortable: true },
    { key: 'attribute', header: 'Attribute', sortable: true },
    { key: 'digimonType', header: 'Type' },
    { key: 'levelRequired', header: 'Level Req.' },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'rank', label: 'Rank', type: 'select', required: true, options: toOptions(DIGIMON_RANKS) },
        { key: 'attribute', label: 'Attribute', type: 'select', required: true, options: toOptions(DIGIMON_ATTRIBUTES) },
        { key: 'digimonType', label: 'Digimon Type', type: 'text', helpText: 'E.g., Holy Knight Digimon' },
        { key: 'levelRequired', label: 'Level Required', type: 'number', min: 0 },
      ],
    },
    {
      fields: [
        { key: 'families', label: 'Families', type: 'text', helpText: 'Comma-separated' },
        { key: 'naturalAttributes', label: 'Natural Attributes', type: 'text', helpText: 'Comma-separated' },
        { key: 'digivolvesFrom', label: 'Digivolves From', type: 'text', helpText: 'Comma-separated' },
        { key: 'digivolvesTo', label: 'Digivolves To', type: 'text', helpText: 'Comma-separated' },
        { key: 'breedingResults', label: 'Breeding Results', type: 'text' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: {
    name: '', rank: '', attribute: '', digimonType: '', levelRequired: '',
    families: '', naturalAttributes: '', digivolvesFrom: '', digivolvesTo: '',
    breedingResults: '', imageUrl: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    required(values, 'rank', 'Rank', errors);
    required(values, 'attribute', 'Attribute', errors);
    return errors;
  },
};

const nexomonConfig: SpeciesAdminConfig = {
  franchise: 'nexomon',
  label: 'Nexomon',
  icon: 'fas fa-star',
  filterOptions: {
    type: NEXOMON_TYPES,
  },
  columns: [
    { key: 'nr', header: '#', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'typePrimary', header: 'Type 1' },
    { key: 'typeSecondary', header: 'Type 2' },
    { key: 'stage', header: 'Stage' },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'nr', label: 'Nexomon Number', type: 'number', required: true, min: 1 },
        { key: 'typePrimary', label: 'Primary Type', type: 'select', required: true, options: toOptions(NEXOMON_TYPES) },
        { key: 'typeSecondary', label: 'Secondary Type', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(NEXOMON_TYPES)] },
        { key: 'stage', label: 'Stage', type: 'text' },
      ],
    },
    {
      fields: [
        { key: 'evolvesFrom', label: 'Evolves From', type: 'text', helpText: 'Comma-separated' },
        { key: 'evolvesTo', label: 'Evolves To', type: 'text', helpText: 'Comma-separated' },
        { key: 'breedingResults', label: 'Breeding Results', type: 'text' },
        { key: 'isLegendary', label: 'Legendary', type: 'checkbox' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: {
    name: '', nr: '', typePrimary: '', typeSecondary: '', stage: '',
    evolvesFrom: '', evolvesTo: '', breedingResults: '',
    isLegendary: false, imageUrl: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    required(values, 'nr', 'Number', errors);
    required(values, 'typePrimary', 'Primary Type', errors);
    return errors;
  },
};

const yokaiConfig: SpeciesAdminConfig = {
  franchise: 'yokai',
  label: 'Yokai Watch',
  icon: 'fas fa-ghost',
  filterOptions: {
    tribe: YOKAI_TRIBES,
    rank: YOKAI_RANKS,
  },
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'tribe', header: 'Tribe', sortable: true },
    { key: 'rank', header: 'Rank', sortable: true },
    { key: 'stage', header: 'Stage' },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'tribe', label: 'Tribe', type: 'select', required: true, options: toOptions(YOKAI_TRIBES) },
        { key: 'rank', label: 'Rank', type: 'select', required: true, options: toOptions(YOKAI_RANKS) },
        { key: 'stage', label: 'Stage', type: 'text' },
      ],
    },
    {
      fields: [
        { key: 'evolvesFrom', label: 'Evolves From', type: 'text', helpText: 'Comma-separated' },
        { key: 'evolvesTo', label: 'Evolves To', type: 'text', helpText: 'Comma-separated' },
        { key: 'breedingResults', label: 'Breeding Results', type: 'text' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: {
    name: '', tribe: '', rank: '', stage: '',
    evolvesFrom: '', evolvesTo: '', breedingResults: '', imageUrl: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    required(values, 'tribe', 'Tribe', errors);
    required(values, 'rank', 'Rank', errors);
    return errors;
  },
};

const palsConfig: SpeciesAdminConfig = {
  franchise: 'pals',
  label: 'Palworld',
  icon: 'fas fa-heart',
  columns: [
    { key: 'name', header: 'Name', sortable: true },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: { name: '', imageUrl: '' },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    return errors;
  },
};

const monsterhunterConfig: SpeciesAdminConfig = {
  franchise: 'monsterhunter',
  label: 'Monster Hunter',
  icon: 'fas fa-shield-alt',
  filterOptions: {
    rank: MH_CLASSES,
    element: MH_ELEMENTS,
  },
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'monsterClass', header: 'Class', sortable: true },
    { key: 'elementPrimary', header: 'Element' },
    { key: 'weaknesses', header: 'Weaknesses' },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'monsterClass', label: 'Monster Class', type: 'select', required: true, options: toOptions(MH_CLASSES) },
        { key: 'elementPrimary', label: 'Primary Element', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(MH_ELEMENTS)] },
        { key: 'elementSecondary', label: 'Secondary Element', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(MH_ELEMENTS)] },
      ],
    },
    {
      fields: [
        { key: 'weaknesses', label: 'Weaknesses', type: 'text', helpText: 'Comma-separated' },
        { key: 'habitat', label: 'Habitat', type: 'text', helpText: 'Where this monster can be found' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: {
    name: '', monsterClass: '', elementPrimary: '', elementSecondary: '',
    weaknesses: '', habitat: '', description: '', imageUrl: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    required(values, 'monsterClass', 'Monster Class', errors);
    return errors;
  },
};

const finalfantasyConfig: SpeciesAdminConfig = {
  franchise: 'finalfantasy',
  label: 'Final Fantasy',
  icon: 'fas fa-hat-wizard',
  filterOptions: {
    stage: FF_CATEGORIES,
  },
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'elementPrimary', header: 'Element' },
    { key: 'game', header: 'Game' },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'select', required: true, options: toOptions(FF_CATEGORIES) },
        { key: 'elementPrimary', label: 'Primary Element', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(FF_ELEMENTS)] },
        { key: 'elementSecondary', label: 'Secondary Element', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(FF_ELEMENTS)] },
        { key: 'game', label: 'Game', type: 'select', options: [{ value: '', label: 'Select Game' }, ...toOptions(FF_GAMES)] },
      ],
    },
    {
      fields: [
        { key: 'weaknesses', label: 'Weaknesses', type: 'text', helpText: 'Comma-separated' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
        { key: 'evolvesFrom', label: 'Evolves From', type: 'text', helpText: 'Comma-separated names' },
        { key: 'evolvesTo', label: 'Evolves To', type: 'text', helpText: 'Comma-separated names' },
        { key: 'breedingResults', label: 'Breeding Results', type: 'text', helpText: 'Result from breeding' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: {
    name: '', category: '', elementPrimary: '', elementSecondary: '',
    game: '', weaknesses: '', description: '',
    evolvesFrom: '', evolvesTo: '', breedingResults: '', imageUrl: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    required(values, 'category', 'Category', errors);
    return errors;
  },
};

const fakemonConfig: SpeciesAdminConfig = {
  franchise: 'fakemon',
  label: 'Fakemon',
  icon: 'fas fa-paint-brush',
  hasMassAdd: true,
  filterOptions: {
    type: NEXOMON_TYPES,
    category: FF_CATEGORIES,
    attribute: FAKEMON_ATTRIBUTES,
  },
  columns: [
    { key: 'number', header: '#', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'type1', header: 'Type 1' },
    { key: 'type2', header: 'Type 2' },
    { key: 'category', header: 'Category' },
    { key: 'attribute', header: 'Attribute' },
  ],
  formSections: [
    {
      title: 'Basic Info',
      fields: [
        { key: 'number', label: 'Dex Number', type: 'number', required: true, min: 1 },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true, helpText: 'Universe/group (e.g., Fakemon, Custom)' },
        { key: 'classification', label: 'Classification', type: 'text' },
        { key: 'type1', label: 'Type 1', type: 'text', required: true },
        { key: 'type2', label: 'Type 2', type: 'text' },
        { key: 'type3', label: 'Type 3', type: 'text' },
        { key: 'type4', label: 'Type 4', type: 'text' },
        { key: 'type5', label: 'Type 5', type: 'text' },
        { key: 'attribute', label: 'Attribute', type: 'select', options: [{ value: '', label: 'None' }, ...toOptions(FAKEMON_ATTRIBUTES)] },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
      ],
    },
    {
      title: 'Stats & Abilities',
      fields: [
        { key: 'ability1', label: 'Ability 1', type: 'text' },
        { key: 'ability2', label: 'Ability 2', type: 'text' },
        { key: 'hiddenAbility', label: 'Hidden Ability', type: 'text' },
        { key: 'hp', label: 'HP', type: 'number', min: 0 },
        { key: 'attack', label: 'Attack', type: 'number', min: 0 },
        { key: 'defense', label: 'Defense', type: 'number', min: 0 },
        { key: 'specialAttack', label: 'Sp. Attack', type: 'number', min: 0 },
        { key: 'specialDefense', label: 'Sp. Defense', type: 'number', min: 0 },
        { key: 'speed', label: 'Speed', type: 'number', min: 0 },
        { key: 'stage', label: 'Stage', type: 'text' },
        { key: 'isLegendary', label: 'Legendary', type: 'checkbox' },
        { key: 'isMythical', label: 'Mythical', type: 'checkbox' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
    {
      title: 'Evolution & Breeding',
      fields: [
        {
          key: 'evolvesFrom',
          label: 'Evolves From',
          type: 'custom',
          render: (value, onChange) =>
            createElement(FakemonAutocompleteField, {
              key: 'evolvesFrom',
              label: 'Evolves From',
              value: String(value ?? ''),
              onChange: (v: string) => onChange(v),
              helpText: 'Select the fakemon this evolves from',
            }),
        },
        {
          key: 'evolvesTo',
          label: 'Evolves To',
          type: 'custom',
          render: (value, onChange) =>
            createElement(FakemonAutocompleteField, {
              key: 'evolvesTo',
              label: 'Evolves To',
              value: String(value ?? ''),
              onChange: (v: string) => onChange(v),
              helpText: 'Select the fakemon this evolves into',
            }),
        },
        { key: 'breedingResults', label: 'Breeding Results', type: 'text', helpText: 'Baby form from breeding' },
        {
          key: 'evolutionLine',
          label: 'Evolution Line',
          type: 'custom',
          render: (value, onChange) =>
            createElement(EvolutionLineEditor, {
              key: 'evolutionLine',
              value: (Array.isArray(value) ? value : []) as EvolutionEntry[],
              onChange,
            }),
        },
      ],
    },
  ],
  defaultValues: {
    number: '', name: '', category: '', classification: '',
    type1: '', type2: '', type3: '', type4: '', type5: '',
    attribute: '', description: '',
    ability1: '', ability2: '', hiddenAbility: '',
    hp: '', attack: '', defense: '', specialAttack: '', specialDefense: '', speed: '',
    stage: '', isLegendary: false, isMythical: false, imageUrl: '',
    evolvesFrom: '', evolvesTo: '', breedingResults: '', evolutionLine: [],
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'number', 'Dex Number', errors);
    required(values, 'name', 'Name', errors);
    required(values, 'category', 'Category', errors);
    required(values, 'type1', 'Type 1', errors);
    return errors;
  },
};

const dragonquestConfig: SpeciesAdminConfig = {
  franchise: 'dragonquest',
  label: 'Dragon Quest',
  icon: 'fas fa-sword',
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'family', header: 'Family', sortable: true },
    { key: 'subfamily', header: 'Subfamily', sortable: true },
  ],
  formSections: [
    {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'family', label: 'Family', type: 'text' },
        { key: 'subfamily', label: 'Subfamily', type: 'text' },
        { key: 'imageUrl', label: 'Image', type: 'file' },
      ],
    },
  ],
  defaultValues: { name: '', family: '', subfamily: '', imageUrl: '' },
  validate: (values) => {
    const errors: Record<string, string> = {};
    required(values, 'name', 'Name', errors);
    return errors;
  },
};

// ── Export map ───────────────────────────────────────────────────────

export const SPECIES_ADMIN_CONFIGS: Record<FranchiseKey, SpeciesAdminConfig> = {
  pokemon: pokemonConfig,
  digimon: digimonConfig,
  nexomon: nexomonConfig,
  yokai: yokaiConfig,
  pals: palsConfig,
  monsterhunter: monsterhunterConfig,
  finalfantasy: finalfantasyConfig,
  fakemon: fakemonConfig,
  dragonquest: dragonquestConfig,
};

export function getSpeciesAdminConfig(franchise: FranchiseKey): SpeciesAdminConfig {
  return SPECIES_ADMIN_CONFIGS[franchise];
}

export function getIdField(franchise: FranchiseKey): string {
  return FRANCHISE_CONFIG[franchise].idField;
}

export function getImageField(franchise: FranchiseKey): string {
  return FRANCHISE_CONFIG[franchise].imageField;
}
