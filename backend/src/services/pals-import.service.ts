/**
 * Palworld Pals import orchestration.
 *
 * Scrapes the wiki (see {@link fetchPalsFromWiki}), diffs the result against the
 * Pals already stored in `pals_monsters`, and inserts any that are missing.
 * A `dryRun` mode reports exactly what would be inserted without writing.
 *
 * Consumed by both the admin import endpoint and the CLI scraper
 * (`backend/scripts/scrape-pals.ts`), keeping the add-missing behaviour in one
 * place.
 */

import { PalsSpeciesRepository } from '../repositories';
import {
  fetchPalsFromWiki,
  verifyPalImages,
  PALS_WIKI_SOURCE,
  type ProgressLogger,
  type WikiPalEntry,
} from './pals-wiki.service';

/** A Pal that will be, or was, inserted. */
export interface ImportedPal {
  name: string;
  imageUrl: string | null;
  number: string | null;
}

/** Outcome of an import run. */
export interface PalsImportSummary {
  /** URL the data was scraped from. */
  source: string;
  /** Whether the run was a dry run (no writes performed). */
  dryRun: boolean;
  /** Number of unique Pals scraped from the wiki. */
  scraped: number;
  /** Number of Pals already present in the database before the run. */
  existing: number;
  /** Pals not already present — inserted, unless this was a dry run. */
  added: ImportedPal[];
  /** Missing Pals whose wiki row had no resolvable image (still imported). */
  missingImages: string[];
  /** Names that failed to insert, with the error message. */
  failed: Array<{ name: string; error: string }>;
}

export interface ImportPalsOptions {
  /** When true, compute and report the diff without inserting. */
  dryRun?: boolean;
  /** Optional progress logger (defaults to no-op). */
  log?: ProgressLogger;
}

/**
 * Imports every Pal from the wiki that is not already stored.
 *
 * Matching is case-insensitive on name. Existing rows are never modified, so the
 * run is safe to repeat as the wiki gains new Pals.
 */
export async function importPalsFromWiki(
  options: ImportPalsOptions = {}
): Promise<PalsImportSummary> {
  const { dryRun = false, log = () => {} } = options;

  const scraped: WikiPalEntry[] = await fetchPalsFromWiki(log);

  const repo = new PalsSpeciesRepository();
  const existingNames = await repo.getAllNames();
  const existingSet = new Set(existingNames.map((name) => name.trim().toLowerCase()));

  const candidates = scraped.filter((entry) => !existingSet.has(entry.name.trim().toLowerCase()));

  log(
    `${scraped.length} scraped, ${existingSet.size} already stored, ${candidates.length} missing` +
      (dryRun ? ' (dry run — nothing will be written).' : '.')
  );

  const missing: WikiPalEntry[] = await verifyPalImages(candidates, log);

  const added: ImportedPal[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  if (!dryRun) {
    for (const entry of missing) {
      try {
        await repo.create({ name: entry.name, imageUrl: entry.imageUrl });
        added.push({ name: entry.name, imageUrl: entry.imageUrl, number: entry.number });
        log(`  + ${entry.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ name: entry.name, error: message });
        log(`  ! Failed to insert ${entry.name}: ${message}`);
      }
    }
  } else {
    for (const entry of missing) {
      added.push({ name: entry.name, imageUrl: entry.imageUrl, number: entry.number });
    }
  }

  return {
    source: PALS_WIKI_SOURCE,
    dryRun,
    scraped: scraped.length,
    existing: existingSet.size,
    added,
    missingImages: missing.filter((entry) => !entry.imageUrl).map((entry) => entry.name),
    failed,
  };
}
