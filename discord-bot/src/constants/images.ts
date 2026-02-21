import { siteUrl } from '../presenters/base.presenter.js';

// ============================================================================
// Fallback image URLs for embeds
// ============================================================================

/**
 * Default fallback image for trainers without a main reference image.
 * Uses the site's default trainer avatar.
 */
export function trainerFallbackImage(): string {
  return `${siteUrl()}/content/defaults/trainer.png`;
}

/**
 * Default fallback image for monsters without an image link.
 * Uses the site's default monster avatar.
 */
export function monsterFallbackImage(): string {
  return `${siteUrl()}/content/defaults/monster.png`;
}

// ============================================================================
// Safe image helper
// ============================================================================

/**
 * Return a valid image URL or `undefined`.
 *
 * - If `url` is a valid HTTP(S) URL, returns it.
 * - Otherwise returns `fallback` if it's a valid HTTP(S) URL.
 * - Otherwise returns `undefined` (no thumbnail will be set).
 *
 * Discord gracefully handles broken image URLs (just hides the thumbnail),
 * so it's safe to pass URLs that may 404.
 */
export function safeImageUrl(
  url: string | null | undefined,
  fallback?: string,
): string | undefined {
  if (url && /^https?:\/\/.+/i.test(url)) {
    return url;
  }
  if (fallback && /^https?:\/\/.+/i.test(fallback)) {
    return fallback;
  }
  return undefined;
}
