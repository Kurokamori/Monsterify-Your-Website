import {
  ActionRowBuilder,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { EmbedColor } from '../constants/colors.js';
import type { Adventure, Encounter, CaptureResult, EndAdventureResult } from '../services/adventure.service.js';
import {
  createEmbed,
  formatSpecies,
  formatTypes,
  truncateText,
} from './base.presenter.js';
import { paginationButtons, getPaginationInfo } from './components/pagination.js';

// ============================================================================
// Pagination prefixes
// ============================================================================

export const ADVENTURE_PAGE = 'adventure_page';

// ============================================================================
// Encounter data shapes (parsed from the backend's encounter_data JSON)
// ============================================================================

interface WildMonsterGroup {
  count?: number;
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  activity?: string | null;
}

interface BattleTrainer {
  name?: string;
  level?: number;
}

interface BattleMonster {
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  level?: number;
  health?: number;
  maxHealth?: number;
  targetIndex?: number;
  isWild?: boolean;
}

interface ItemEncounterData {
  itemName?: string;
  itemDescription?: string;
}

interface SpecialEncounterData {
  type?: string;
  description?: string;
}

// ============================================================================
// Weather & terrain display names
// ============================================================================

const WEATHER_NAMES: Record<string, string> = {
  clear: '☀️ Clear Skies',
  sunny: '🌞 Harsh Sunlight',
  rain: '🌧️ Heavy Rain',
  sandstorm: '🏜️ Sandstorm',
  hail: '🧊 Hailstorm',
  fog: '🌫️ Dense Fog',
  snow: '❄️ Snowfall',
  thunderstorm: '⛈️ Thunderstorm',
  wind: '💨 Strong Winds',
};

const TERRAIN_NAMES: Record<string, string> = {
  normal: '🟫 Normal Ground',
  electric: '⚡ Electric Terrain',
  grassy: '🌿 Grassy Terrain',
  psychic: '🔮 Psychic Terrain',
  misty: '🌸 Misty Terrain',
};

export function formatWeatherName(weather: string): string {
  return WEATHER_NAMES[weather] ?? weather;
}

export function formatTerrainName(terrain: string): string {
  return TERRAIN_NAMES[terrain] ?? terrain;
}

// ============================================================================
// Adventure summary embed
// ============================================================================

function statusEmoji(status: string): string {
  switch (status) {
    case 'active':
      return '🟢';
    case 'completed':
      return '✅';
    case 'cancelled':
      return '❌';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}

/** Compact summary embed for an adventure. */
export function adventureSummaryEmbed(adventure: Adventure): EmbedBuilder {
  const lines: string[] = [
    `${statusEmoji(adventure.status)} **Status:** ${adventure.status}`,
    `**Type:** ${adventure.adventureType}`,
  ];
  if (adventure.region) {
    lines.push(`**Region:** ${adventure.region}`);
  }
  if (adventure.landmass) {
    lines.push(`**Landmass:** ${adventure.landmass}`);
  }
  if (adventure.maxParticipants) {
    lines.push(`**Max Participants:** ${adventure.maxParticipants}`);
  }
  if (adventure.description) {
    lines.push(`\n${truncateText(adventure.description, 300)}`);
  }

  return createEmbed(EmbedColor.ADVENTURE)
    .setTitle(`🗡️ ${adventure.title}`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Adventure ID: ${adventure.id}` });
}

// ============================================================================
// Adventure detail embed
// ============================================================================

/** Full detail embed for an adventure. */
export function adventureDetailEmbed(adventure: Adventure): EmbedBuilder {
  const embed = createEmbed(EmbedColor.ADVENTURE)
    .setTitle(`🗡️ ${adventure.title}`)
    .setDescription(
      adventure.description
        ? truncateText(adventure.description, 1024)
        : 'No description provided.',
    );

  embed.addFields({
    name: '📋 Details',
    value: [
      `${statusEmoji(adventure.status)} **Status:** ${adventure.status}`,
      `**Type:** ${adventure.adventureType}`,
      adventure.region ? `**Region:** ${adventure.region}` : null,
      adventure.landmass ? `**Landmass:** ${adventure.landmass}` : null,
      adventure.areaId ? `**Area:** ${adventure.areaId}` : null,
      adventure.maxParticipants
        ? `**Max Participants:** ${adventure.maxParticipants}`
        : null,
    ]
      .filter(Boolean)
      .join('\n'),
    inline: true,
  });

  embed.addFields({
    name: '🆔 Metadata',
    value: [
      `**Adventure ID:** ${adventure.id}`,
      adventure.discordThreadId
        ? `**Thread:** <#${adventure.discordThreadId}>`
        : null,
    ]
      .filter(Boolean)
      .join('\n'),
    inline: true,
  });

  embed.setFooter({ text: `Adventure ID: ${adventure.id}` });

  return embed;
}

// ============================================================================
// Paginated adventure view
// ============================================================================

export interface AdventureViewResult {
  embed: EmbedBuilder;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

/** Paginated adventure view — one adventure per page. */
export function adventureView(
  adventures: Adventure[],
  page = 1,
  prefix = ADVENTURE_PAGE,
): AdventureViewResult {
  const info = getPaginationInfo(page, adventures.length, 1);
  const adventure = adventures[info.startIndex];

  if (!adventure) {
    return {
      embed: createEmbed(EmbedColor.ADVENTURE)
        .setTitle('🗡️ No Adventures Found')
        .setDescription('There are no adventures to display.'),
      components: [],
    };
  }

  const embed = adventureDetailEmbed(adventure);
  if (info.totalPages > 1) {
    embed.setFooter({
      text: `Adventure ${info.currentPage} of ${info.totalPages} | ID: ${adventure.id}`,
    });
  }

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  if (info.totalPages > 1) {
    components.push(paginationButtons(info, prefix));
  }

  return { embed, components };
}

// ============================================================================
// Welcome message for new adventure threads
// ============================================================================

/** Build the welcome embed sent when a new adventure thread is created. */
export function adventureWelcomeEmbed(adventure: Adventure): EmbedBuilder {
  const lines: string[] = [
    `Welcome to **${adventure.title}**!`,
    '',
  ];

  if (adventure.description) {
    lines.push(adventure.description, '');
  }

  lines.push(
    '**📜 How Adventures Work:**',
    '- Write roleplay messages in this thread to earn rewards',
    '- **50 words** = 1 level | **1 word** = 1 coin | **1,000 words** = 1 item',
    '',
    '**⚔️ Commands:**',
    '`/adventure encounter` — Generate a random encounter',
    '`/adventure capture trainer:[name] pokeball:[type]` — Attempt to capture a monster',
    '`/adventure end` — End the adventure and calculate rewards',
  );

  if (adventure.region) {
    lines.push('', `**📍 Region:** ${adventure.region}`);
  }

  return createEmbed(EmbedColor.ADVENTURE)
    .setTitle(`🗡️ ${adventure.title}`)
    .setDescription(lines.join('\n'));
}

// ============================================================================
// Encounter embeds
// ============================================================================

/**
 * Route an encounter to the appropriate embed builder based on type.
 *
 * The encounter's `encounterData` field is a JSON blob whose shape
 * varies by `encounterType`. This function safely reads it.
 */
export function encounterEmbed(encounter: Encounter): EmbedBuilder {
  switch (encounter.encounterType) {
    case 'wild':
      return wildEncounterEmbed(encounter);
    case 'battle':
      return battleEncounterEmbed(encounter);
    case 'item':
      return itemEncounterEmbed(encounter);
    case 'special':
      return specialEncounterEmbed(encounter);
    default:
      return createEmbed(EmbedColor.ENCOUNTER)
        .setTitle('❓ Unknown Encounter')
        .setDescription('An unrecognized encounter type was generated.');
  }
}

// -- Wild encounter ----------------------------------------------------------

function parseWildGroups(data: Record<string, unknown>): WildMonsterGroup[] {
  const groups = data['groups'];
  if (!Array.isArray(groups)) {
    return [];
  }
  return groups as WildMonsterGroup[];
}

/** Wild monster encounter — shows monster groups with species, types, activity. */
export function wildEncounterEmbed(encounter: Encounter): EmbedBuilder {
  const groups = parseWildGroups(encounter.encounterData);

  const lines: string[] = [];

  for (const group of groups) {
    const species = formatSpecies(
      group.species1 ?? 'Unknown',
      group.species2,
      group.species3,
    );
    const types = formatTypes(
      group.type1,
      group.type2,
      group.type3,
      group.type4,
      group.type5,
    );
    const count = group.count ?? 1;
    const activity = group.activity ? ` — *${group.activity}*` : '';
    const attr = group.attribute ? ` [${group.attribute}]` : '';

    lines.push(
      `**${count}x ${species}** (${types})${attr}${activity}`,
    );
  }

  if (lines.length === 0) {
    lines.push('No monsters encountered.');
  }

  lines.push(
    '',
    '🎯 Use `/adventure capture trainer:[name] pokeball:[type]` to attempt a capture!',
  );

  return createEmbed(EmbedColor.ENCOUNTER)
    .setTitle('🌿 Wild Encounter!')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Encounter ID: ${encounter.id}` });
}

// -- Battle encounter --------------------------------------------------------

function parseBattleData(data: Record<string, unknown>): {
  trainers: BattleTrainer[];
  monsters: BattleMonster[];
  weather?: string;
  terrain?: string;
} {
  return {
    trainers: Array.isArray(data['trainers'])
      ? (data['trainers'] as BattleTrainer[])
      : [],
    monsters: Array.isArray(data['monsters'])
      ? (data['monsters'] as BattleMonster[])
      : [],
    weather: typeof data['weather'] === 'string' ? data['weather'] : undefined,
    terrain: typeof data['terrain'] === 'string' ? data['terrain'] : undefined,
  };
}

/** Battle encounter — shows enemy trainers, monsters with HP, and environment. */
export function battleEncounterEmbed(encounter: Encounter): EmbedBuilder {
  const { trainers, monsters, weather, terrain } = parseBattleData(
    encounter.encounterData,
  );

  const lines: string[] = [];

  // Environment
  if (weather || terrain) {
    lines.push('**Environmental Conditions:**');
    if (weather) {
      lines.push(`${formatWeatherName(weather)}`);
    }
    if (terrain) {
      lines.push(`${formatTerrainName(terrain)}`);
    }
    lines.push('');
  }

  // Enemy trainers
  if (trainers.length > 0) {
    lines.push('**Enemy Trainers:**');
    for (const t of trainers) {
      lines.push(`• ${t.name ?? 'Unknown'} (Level ${t.level ?? '?'})`);
    }
    lines.push('');
  }

  // Enemy monsters
  if (monsters.length > 0) {
    lines.push('**Enemy Monsters:**');
    for (const m of monsters) {
      const species = formatSpecies(
        m.species1 ?? 'Unknown',
        m.species2,
        m.species3,
      );
      const types = formatTypes(m.type1, m.type2, m.type3, m.type4, m.type5);
      const hp =
        m.health !== undefined && m.maxHealth !== undefined
          ? ` (${m.health}/${m.maxHealth} HP)`
          : '';
      const wild = m.isWild ? ' 🌿' : '';
      const idx = m.targetIndex !== undefined ? `**${m.targetIndex}.** ` : '';

      lines.push(`${idx}${species} (${types}) — Lv. ${m.level ?? '?'}${hp}${wild}`);
    }
  }

  lines.push(
    '',
    '**⚔️ Battle Commands:**',
    '`/battle start trainer:[name]` — Join or start the battle',
    '`/battle attack monster:[name] attack:[move]` — Attack',
    '`/battle status` — View battle status',
  );

  return createEmbed(EmbedColor.BATTLE)
    .setTitle('⚔️ Battle Encounter!')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Encounter ID: ${encounter.id}` });
}

// -- Item encounter ----------------------------------------------------------

function parseItemData(data: Record<string, unknown>): ItemEncounterData {
  return {
    itemName: typeof data['itemName'] === 'string' ? data['itemName'] : undefined,
    itemDescription:
      typeof data['itemDescription'] === 'string'
        ? data['itemDescription']
        : undefined,
  };
}

/** Item encounter — a discovered item. */
export function itemEncounterEmbed(encounter: Encounter): EmbedBuilder {
  const item = parseItemData(encounter.encounterData);

  const lines: string[] = [
    `You discovered **${item.itemName ?? 'an item'}**!`,
  ];

  if (item.itemDescription) {
    lines.push('', `*${item.itemDescription}*`);
  }

  lines.push('', '📦 This item has been added to the adventure log.');

  return createEmbed(EmbedColor.MARKET)
    .setTitle('🎁 Item Found!')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Encounter ID: ${encounter.id}` });
}

// -- Special encounter -------------------------------------------------------

const SPECIAL_ENCOUNTER_EMOJIS: Record<string, string> = {
  legendary_guardian: '🐉',
  champion_battle: '🏆',
  rare_item: '💎',
  community_festival: '🎉',
  fire_trial: '🔥',
  divine_blessing: '✨',
  phoenix_sighting: '🦅',
  frost_giant_challenge: '🧊',
  sea_palace_audience: '🌊',
  crystal_dome_mystery: '🔮',
};

function parseSpecialData(data: Record<string, unknown>): SpecialEncounterData {
  return {
    type: typeof data['type'] === 'string' ? data['type'] : undefined,
    description:
      typeof data['description'] === 'string' ? data['description'] : undefined,
  };
}

function formatSpecialType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Special area-specific encounter. */
export function specialEncounterEmbed(encounter: Encounter): EmbedBuilder {
  const special = parseSpecialData(encounter.encounterData);
  const emoji = SPECIAL_ENCOUNTER_EMOJIS[special.type ?? ''] ?? '⭐';
  const typeName = special.type
    ? formatSpecialType(special.type)
    : 'Special Event';

  const lines: string[] = [
    `**${emoji} ${typeName}**`,
    '',
    special.description ?? 'Something extraordinary is happening!',
  ];

  return createEmbed(EmbedColor.ENCOUNTER)
    .setTitle(`${emoji} Special Encounter!`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Encounter ID: ${encounter.id}` });
}

// ============================================================================
// Encounter instructions
// ============================================================================

/** Get contextual instructions for an encounter type. */
export function encounterInstructions(encounterType: string): string {
  switch (encounterType) {
    case 'wild':
      return [
        '**Wild Encounter Commands:**',
        '`/adventure capture trainer:[name] pokeball:[type]` — Attempt to capture',
        '`/adventure capture trainer:[name] pokeball:[type] index:[#] pokepuffs:[#]` — Advanced capture',
        'Different pokeballs have different capture rates.',
        'You can attempt multiple captures per encounter.',
      ].join('\n');

    case 'battle':
      return [
        '**Battle Encounter Commands:**',
        '`/battle start trainer:[name]` — Join or start the battle',
        '`/battle attack monster:[name] attack:[move]` — Attack with a monster',
        '`/battle use-item monster:[name] item:[item]` — Use an item on a monster',
        '`/battle release monster:[name]` — Send out a monster',
        '`/battle withdraw monster:[name]` — Recall a monster',
        '`/battle status` — View battle status and health bars',
        '`/battle flee` — Flee from the battle',
        '`/adventure capture trainer:[name] pokeball:[type]` — Capture wild monsters in battle',
      ].join('\n');

    case 'item':
      return 'Items are automatically added to the adventure log.';

    case 'special':
      return 'Interact with this special encounter as your character sees fit!';

    default:
      return 'Use the appropriate commands to interact with this encounter.';
  }
}

// ============================================================================
// Capture result embed
// ============================================================================

/** Build an embed showing the result of a capture attempt. */
export function captureResultEmbed(result: CaptureResult): EmbedBuilder {
  if (result.captured) {
    const m = result.monster;
    const lines: string[] = [
      result.message ?? 'You successfully captured the monster!',
    ];

    if (m) {
      lines.push('');
      const species = formatSpecies(
        m.species1 ?? m.species_name ?? 'Unknown',
        m.species2,
        m.species3,
      );
      const types = formatTypes(m.type1, m.type2, m.type3, m.type4, m.type5);

      lines.push(`**Species:** ${species}`);
      lines.push(`**Type:** ${types}`);
      if (m.attribute) {
        lines.push(`**Attribute:** ${m.attribute}`);
      }
      if (m.level) {
        lines.push(`**Level:** ${m.level}`);
      }
    }

    return createEmbed(EmbedColor.SUCCESS)
      .setTitle('✅ Capture Successful!')
      .setDescription(lines.join('\n'));
  }

  return createEmbed(EmbedColor.ERROR)
    .setTitle('❌ Capture Failed')
    .setDescription(
      result.message ?? 'The monster broke free! Try again or use a better ball.',
    );
}

// ============================================================================
// Adventure end / rewards embed
// ============================================================================

/** Build an embed showing adventure completion and rewards. */
export function adventureEndEmbed(
  adventure: Adventure,
  result: EndAdventureResult,
): EmbedBuilder {
  const lines: string[] = [
    `**${adventure.title}** has ended!`,
    '',
  ];

  // Participant rewards
  const participants = result.participants as
    | Array<Record<string, unknown>>
    | undefined;

  if (participants && participants.length > 0) {
    lines.push('**📊 Participant Rewards:**');
    for (const p of participants) {
      const name =
        typeof p['trainerName'] === 'string'
          ? p['trainerName']
          : typeof p['trainer_name'] === 'string'
            ? p['trainer_name']
            : 'Unknown';
      const words =
        typeof p['wordCount'] === 'number'
          ? p['wordCount']
          : typeof p['word_count'] === 'number'
            ? (p['word_count'] as number)
            : 0;
      const levels =
        typeof p['levelsEarned'] === 'number'
          ? p['levelsEarned']
          : typeof p['levels_earned'] === 'number'
            ? (p['levels_earned'] as number)
            : Math.floor(words / 50);
      const coins =
        typeof p['coinsEarned'] === 'number'
          ? p['coinsEarned']
          : typeof p['coins_earned'] === 'number'
            ? (p['coins_earned'] as number)
            : words;

      lines.push(
        `• **${name}** — ${words.toLocaleString()} words | ${levels} levels | ${coins.toLocaleString()} coins`,
      );
    }
  }

  if (result.message) {
    lines.push('', result.message);
  }

  lines.push(
    '',
    '🏁 Visit the website to claim your detailed rewards!',
  );

  return createEmbed(EmbedColor.SUCCESS)
    .setTitle('🏁 Adventure Complete!')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Adventure ID: ${adventure.id}` });
}
