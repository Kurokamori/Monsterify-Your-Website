import { EmbedBuilder } from 'discord.js';
import { EmbedColor, type EmbedColorValue } from '../constants/colors.js';
import { config } from '../config/index.js';

// ============================================================================
// Embed factories
// ============================================================================

/** Create a base embed with a color and optional timestamp. */
export function createEmbed(
  color: EmbedColorValue = EmbedColor.PRIMARY,
): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setTimestamp();
}

/** Standard error embed. */
export function errorEmbed(message: string): EmbedBuilder {
  return createEmbed(EmbedColor.ERROR).setDescription(message);
}

/** Standard success embed. */
export function successEmbed(message: string): EmbedBuilder {
  return createEmbed(EmbedColor.SUCCESS).setDescription(message);
}

/** Standard info embed with a title. */
export function infoEmbed(title: string, message: string): EmbedBuilder {
  return createEmbed(EmbedColor.INFO).setTitle(title).setDescription(message);
}

/** Standard warning embed. */
export function warningEmbed(message: string): EmbedBuilder {
  return createEmbed(EmbedColor.WARNING).setDescription(message);
}

// ============================================================================
// Site URL helpers
// ============================================================================

/**
 * Base website URL (no trailing slash).
 *
 * In production this is `https://duskanddawn.net`.
 * In development it derives from the configured backend URL.
 */
export function siteUrl(): string {
  // api.baseUrl ends with `/api` — strip it to get the site root.
  return config.api.baseUrl.replace(/\/api\/?$/, '');
}

/** URL to a trainer's profile page on the website. */
export function trainerPageUrl(trainerId: number): string {
  return `${siteUrl()}/trainers/${trainerId}`;
}

/** URL to a monster's detail page on the website. */
export function monsterPageUrl(monsterId: number): string {
  return `${siteUrl()}/monsters/${monsterId}`;
}

// ============================================================================
// Formatting helpers
// ============================================================================

/** Join non-null species into a single display string. */
export function formatSpecies(
  species1: string,
  species2?: string | null,
  species3?: string | null,
): string {
  return [species1, species2, species3].filter(Boolean).join(' / ');
}

/** Join non-null type values into a display string. */
export function formatTypes(
  ...types: (string | null | undefined)[]
): string {
  const present = types.filter(Boolean) as string[];
  return present.length > 0 ? present.join(' / ') : 'None';
}

/**
 * Build an emoji indicator string for special monster traits.
 * Returns an empty string if no traits are active.
 */
export function specialIndicators(monster: {
  shiny?: boolean;
  alpha?: boolean;
  shadow?: boolean;
  paradox?: boolean;
  pokerus?: boolean;
}): string {
  const tags: string[] = [];
  if (monster.shiny) {
    tags.push('✨ Shiny');
  }
  if (monster.alpha) {
    tags.push('🔺 Alpha');
  }
  if (monster.shadow) {
    tags.push('🌑 Shadow');
  }
  if (monster.paradox) {
    tags.push('⚡ Paradox');
  }
  if (monster.pokerus) {
    tags.push('🦠 Pokerus');
  }
  return tags.join(' | ');
}

/** Compact indicators (emoji-only, for embed titles / select labels). */
export function specialIndicatorsCompact(monster: {
  shiny?: boolean;
  alpha?: boolean;
  shadow?: boolean;
  paradox?: boolean;
  pokerus?: boolean;
}): string {
  const tags: string[] = [];
  if (monster.shiny) {
    tags.push('✨');
  }
  if (monster.alpha) {
    tags.push('🔺');
  }
  if (monster.shadow) {
    tags.push('🌑');
  }
  if (monster.paradox) {
    tags.push('⚡');
  }
  if (monster.pokerus) {
    tags.push('🦠');
  }
  return tags.join('');
}

/**
 * Truncate a string to a maximum length, appending '...' if truncated.
 * Safe to call on null/undefined (returns fallback).
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
  fallback = '',
): string {
  if (!text) {
    return fallback;
  }
  return text.length <= maxLength ? text : text.slice(0, maxLength - 3) + '...';
}

/** Format a date string into a short localized date. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return 'Unknown';
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
