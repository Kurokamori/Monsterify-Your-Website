/**
 * Pal image refresh.
 *
 * Re-points every stored Pal at the best image currently available, in this
 * preference order:
 *
 *   1. Self-hosted artwork — `species-images/pals/<slug>.png` in our own bucket.
 *   2. The Palpedia CDN image, which newly imported Pals start out with.
 *
 * Newly imported Pals begin on the Palpedia fallback because we have no artwork
 * for them yet. Re-running this refresh after uploading their real art promotes
 * them to the self-hosted URL automatically, so the fallback is only ever
 * temporary. It also repairs rows whose self-hosted file has since disappeared by
 * dropping them back to the Palpedia image.
 *
 * A Pal's image is never cleared: if nothing resolves, whatever is stored is left
 * alone and reported as unresolved.
 */

import { PalsSpeciesRepository } from '../repositories';
import { listSelfHostedPalImages, slugifyPalName } from './pals-image.service';
import {
  fetchPalsFromWiki,
  verifyPalImage,
  PALS_WIKI_SOURCE,
  type ProgressLogger,
  type WikiPalEntry,
} from './pals-wiki.service';

/** Which source an image came from. */
export type PalImageSource = 'self-hosted' | 'palpedia';

/** A Pal whose stored image will be, or was, changed. */
export interface PalImageChange {
  id: number;
  name: string;
  /** Image URL currently stored (null when the Pal had none). */
  from: string | null;
  /** Image URL the refresh resolved as best. */
  to: string;
  /** Where the new image came from. */
  source: PalImageSource;
}

/** Outcome of a refresh run. */
export interface PalsImageRefreshSummary {
  /** URL the fallback images were resolved from. */
  source: string;
  /** Whether the run was a dry run (no writes performed). */
  dryRun: boolean;
  /** Number of stored Pals examined. */
  checked: number;
  /** Number of Pals whose stored image is already the best available. */
  unchanged: number;
  /** Pals whose image changed — applied, unless this was a dry run. */
  updated: PalImageChange[];
  /** Pals for which no image could be resolved at all; their stored value is untouched. */
  unresolved: string[];
  /** Names that failed to update, with the error message. */
  failed: Array<{ name: string; error: string }>;
}

export interface RefreshPalImagesOptions {
  /** When true, compute and report the diff without writing. */
  dryRun?: boolean;
  /** Optional progress logger (defaults to no-op). */
  log?: ProgressLogger;
}

/** A stored Pal, reduced to what the image decision depends on. */
export interface StoredPalImage {
  id: number;
  name: string;
  imageUrl: string | null;
}

/** The decision for every stored Pal, before any network verification. */
export interface PalImagePlan {
  /** Pals whose best image differs from what is stored. */
  changes: PalImageChange[];
  /** Pals already pointing at the best image available. */
  unchanged: number;
  /** Pals with no image from any source; their stored value must be left alone. */
  unresolved: string[];
}

/**
 * Decides the best image for every stored Pal.
 *
 * Pure: given the self-hosted artwork we have, the Pals scraped from Palpedia and
 * the rows currently stored, it returns what would change. Kept free of I/O so the
 * preference order is directly testable.
 *
 * Matching between a stored Pal and its artwork is by slug — the Palpedia slug
 * when the Pal is listed there, and a slugified display name otherwise.
 */
export function planPalImageUpdates(
  stored: StoredPalImage[],
  scraped: WikiPalEntry[],
  selfHosted: Map<string, string>
): PalImagePlan {
  const scrapedByName = new Map<string, WikiPalEntry>(
    scraped.map((entry) => [entry.name.trim().toLowerCase(), entry])
  );

  const changes: PalImageChange[] = [];
  const unresolved: string[] = [];
  let unchanged = 0;

  for (const pal of stored) {
    const entry = scrapedByName.get(pal.name.trim().toLowerCase());
    const slug = entry?.slug ?? slugifyPalName(pal.name);

    const selfHostedUrl = selfHosted.get(slug);
    const preferred = selfHostedUrl ?? entry?.imageUrl ?? null;

    if (!preferred) {
      unresolved.push(pal.name);
      continue;
    }

    if (preferred === pal.imageUrl) {
      unchanged += 1;
      continue;
    }

    changes.push({
      id: pal.id,
      name: pal.name,
      from: pal.imageUrl,
      to: preferred,
      source: selfHostedUrl ? 'self-hosted' : 'palpedia',
    });
  }

  return { changes, unchanged, unresolved };
}

/**
 * Refreshes the stored image of every Pal to the best source available.
 *
 * Matching between a stored Pal and its artwork is by slug: the Palpedia slug
 * when the Pal is listed there, and a slugified display name otherwise — the two
 * agree for every Pal whose art we host.
 */
export async function refreshPalImages(
  options: RefreshPalImagesOptions = {}
): Promise<PalsImageRefreshSummary> {
  const { dryRun = false, log = () => {} } = options;

  const selfHosted = await listSelfHostedPalImages();
  log(`Found ${selfHosted.size} self-hosted Pal image(s).`);

  const scraped: WikiPalEntry[] = await fetchPalsFromWiki(log);

  const repo = new PalsSpeciesRepository();
  const stored = await repo.getAllWithImages();

  const plan = planPalImageUpdates(stored, scraped, selfHosted);
  const unresolved: string[] = [...plan.unresolved];
  let unchanged = plan.unchanged;

  log(
    `${stored.length} stored, ${unchanged} already current, ${plan.changes.length} to update` +
      (dryRun ? ' (dry run — nothing will be written).' : '.')
  );

  const changes: PalImageChange[] = [];
  for (const candidate of plan.changes) {
    if (candidate.source === 'palpedia') {
      const verified = await verifyPalImage(candidate.to);
      if (!verified) {
        log(`  ? ${candidate.name}: candidate image did not resolve (${candidate.to}) — keeping current.`);
        if (!candidate.from) {
          unresolved.push(candidate.name);
        } else {
          unchanged += 1;
        }
        continue;
      }
    }
    changes.push(candidate);
  }

  const updated: PalImageChange[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  for (const change of changes) {
    if (dryRun) {
      updated.push(change);
      continue;
    }

    try {
      await repo.update(change.id, { imageUrl: change.to });
      updated.push(change);
      log(`  ↑ ${change.name} → ${change.source}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ name: change.name, error: message });
      log(`  ! Failed to update ${change.name}: ${message}`);
    }
  }

  return {
    source: PALS_WIKI_SOURCE,
    dryRun,
    checked: stored.length,
    unchanged,
    updated,
    unresolved,
    failed,
  };
}
