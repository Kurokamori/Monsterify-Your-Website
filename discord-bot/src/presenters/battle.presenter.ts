import { EmbedBuilder } from 'discord.js';
import { EmbedColor, type EmbedColorValue } from '../constants/colors.js';
import type { BattleResult, BattleStatus } from '../services/battle.service.js';
import { createEmbed, formatSpecies, formatTypes } from './base.presenter.js';
import { formatWeatherName, formatTerrainName } from './adventure.presenter.js';

// ============================================================================
// Battle status data shapes (parsed from the backend's battle JSON)
// ============================================================================

interface StatusMonster {
  name?: string;
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  level?: number;
  currentHp?: number;
  current_hp?: number;
  maxHp?: number;
  max_hp?: number;
  isActive?: boolean;
  is_active?: boolean | number;
  isFainted?: boolean;
  is_fainted?: boolean | number;
  primaryStatus?: string | null;
  primary_status?: string | null;
}

interface StatusParticipant {
  trainerName?: string;
  trainer_name?: string;
  trainerId?: number;
  trainer_id?: number;
  isPlayer?: boolean;
  is_player?: boolean | number;
  monsters?: StatusMonster[];
}

// ============================================================================
// Helpers
// ============================================================================

function isTruthy(v: unknown): boolean {
  if (typeof v === 'boolean') {
    return v;
  }
  return v === 1 || v === '1' || v === 'true';
}

function hpBar(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0;
  const filled = Math.round(pct * 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let color: string;
  if (pct > 0.5) {
    color = '🟢';
  } else if (pct > 0.2) {
    color = '🟡';
  } else {
    color = '🔴';
  }

  return `${color} \`${bar}\` ${current}/${max}`;
}

const STATUS_EMOJIS: Record<string, string> = {
  poison: '☠️ PSN',
  burn: '🔥 BRN',
  freeze: '🧊 FRZ',
  paralysis: '⚡ PAR',
  sleep: '💤 SLP',
  toxic: '☠️ TOX',
};

function formatPrimaryStatus(status: string | null | undefined): string {
  if (!status) {
    return '';
  }
  return STATUS_EMOJIS[status] ?? status.toUpperCase();
}

// ============================================================================
// Battle status embed
// ============================================================================

/**
 * Build an embed showing the current battle state.
 *
 * Displays all participants and their monsters with HP bars,
 * status effects, weather, and terrain.
 */
export function battleStatusEmbed(status: BattleStatus): EmbedBuilder {
  const battle = (status.battle ?? {}) as Record<string, unknown>;
  const participants = (status.participants ?? []) as StatusParticipant[];

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('⚔️ Battle Status');

  // Environment info
  const weather = typeof battle['weather'] === 'string' ? battle['weather'] : null;
  const terrain = typeof battle['terrain'] === 'string' ? battle['terrain'] : null;
  const turn = typeof battle['currentTurn'] === 'number'
    ? battle['currentTurn']
    : typeof battle['current_turn'] === 'number'
      ? battle['current_turn']
      : null;

  const envLines: string[] = [];
  if (turn !== null) {
    envLines.push(`**Turn:** ${turn}`);
  }
  if (weather && weather !== 'clear') {
    envLines.push(`**Weather:** ${formatWeatherName(weather)}`);
  }
  if (terrain && terrain !== 'normal') {
    envLines.push(`**Terrain:** ${formatTerrainName(terrain)}`);
  }

  if (envLines.length > 0) {
    embed.setDescription(envLines.join('\n'));
  }

  // Participant fields
  for (const p of participants) {
    const trainerName = p.trainerName ?? p.trainer_name ?? 'Unknown';
    const isPlayer = isTruthy(p.isPlayer ?? p.is_player);
    const emoji = isPlayer ? '🟦' : '🟥';
    const monsters = p.monsters ?? [];

    const monsterLines: string[] = [];
    for (const m of monsters) {
      const name = m.name ?? formatSpecies(m.species1 ?? 'Unknown', m.species2, m.species3);
      const hp = m.currentHp ?? m.current_hp ?? 0;
      const maxHp = m.maxHp ?? m.max_hp ?? 0;
      const fainted = isTruthy(m.isFainted ?? m.is_fainted);
      const active = isTruthy(m.isActive ?? m.is_active);
      const pStatus = formatPrimaryStatus(m.primaryStatus ?? m.primary_status);

      if (fainted) {
        monsterLines.push(`💀 ~~${name}~~ — Fainted`);
      } else {
        const activeTag = active ? ' 🔹' : '';
        const statusTag = pStatus ? ` [${pStatus}]` : '';
        const types = formatTypes(m.type1, m.type2);
        const lvl = m.level !== undefined ? ` Lv.${m.level}` : '';
        monsterLines.push(`${name}${activeTag}${lvl} (${types})${statusTag}`);
        monsterLines.push(hpBar(hp, maxHp));
      }
    }

    embed.addFields({
      name: `${emoji} ${trainerName}`,
      value: monsterLines.length > 0 ? monsterLines.join('\n') : 'No monsters',
      inline: false,
    });
  }

  return embed;
}

// ============================================================================
// Battle action result embeds
// ============================================================================

/** Build an embed for a battle action result (attack, item use, etc.). */
export function battleActionEmbed(
  result: BattleResult,
  actionType: 'attack' | 'item' | 'release' | 'withdraw',
): EmbedBuilder {
  const titles: Record<string, string> = {
    attack: '⚔️ Attack',
    item: '🎒 Item Used',
    release: '📤 Monster Released',
    withdraw: '📥 Monster Withdrawn',
  };

  const color = result.success ? EmbedColor.BATTLE : EmbedColor.ERROR;

  return createEmbed(color)
    .setTitle(titles[actionType] ?? '⚔️ Battle Action')
    .setDescription(result.message ?? 'Action processed.');
}

// ============================================================================
// Battle resolution embeds
// ============================================================================

/**
 * Build an embed for when a battle ends (win, lose, draw, flee, forfeit).
 */
export function battleResolutionEmbed(
  result: BattleResult,
  outcome: 'victory' | 'defeat' | 'draw' | 'flee' | 'forfeit',
): EmbedBuilder {
  const outcomes: Record<string, { title: string; color: EmbedColorValue; emoji: string }> = {
    victory: { title: 'Victory!', color: EmbedColor.SUCCESS, emoji: '🏆' },
    defeat: { title: 'Defeat', color: EmbedColor.ERROR, emoji: '💀' },
    draw: { title: 'Draw', color: EmbedColor.WARNING, emoji: '🤝' },
    flee: { title: 'Fled!', color: EmbedColor.WARNING, emoji: '🏃' },
    forfeit: { title: 'Forfeit', color: EmbedColor.ERROR, emoji: '🏳️' },
  };

  const c = outcomes[outcome] ?? { title: 'Draw', color: EmbedColor.WARNING as EmbedColorValue, emoji: '🤝' };

  return createEmbed(c.color)
    .setTitle(`${c.emoji} ${c.title}`)
    .setDescription(result.message ?? `The battle ended in ${outcome}.`);
}

// ============================================================================
// Weather / terrain change embeds
// ============================================================================

/** Embed for when the battle weather changes. */
export function weatherChangeEmbed(weather: string): EmbedBuilder {
  return createEmbed(EmbedColor.INFO)
    .setTitle('🌤️ Weather Changed')
    .setDescription(`The weather shifted to **${formatWeatherName(weather)}**!`);
}

/** Embed for when the battle terrain changes. */
export function terrainChangeEmbed(terrain: string): EmbedBuilder {
  return createEmbed(EmbedColor.INFO)
    .setTitle('🗺️ Terrain Changed')
    .setDescription(`The terrain shifted to **${formatTerrainName(terrain)}**!`);
}

// ============================================================================
// Battle instructions embed
// ============================================================================

/** Reference embed listing all battle commands. */
export function battleInstructionsEmbed(): EmbedBuilder {
  return createEmbed(EmbedColor.INFO)
    .setTitle('⚔️ Battle Commands')
    .setDescription(
      [
        '`/attack [move] [target]` — Attack with a move',
        '`/release [monster]` — Send a monster to battle',
        '`/withdraw [monster]` — Recall a monster',
        '`/use-item [item] [target]` — Use an item',
        '`/battle-status` — View the current battle state',
        '`/capture [trainer] [pokeball]` — Capture a wild monster',
        '`/set-weather [type]` — Change the weather',
        '`/set-terrain [type]` — Change the terrain',
        '`/flee` — Attempt to flee',
        '`/forfeit` — Forfeit the battle',
        '`/result` — Resolve the battle',
      ].join('\n'),
    );
}
