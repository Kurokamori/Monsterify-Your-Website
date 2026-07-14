/**
 * Self-hosted Pal artwork lookup.
 *
 * Pal species art is uploaded to S3 under `species-images/pals/<slug>.png` and
 * served to browsers through the `/species-images/:franchise/:filename` proxy.
 * This module answers one question: which Pals do we already host our own full
 * artwork for, and at what public URL?
 *
 * It is the top tier of the image preference order used when refreshing Pal
 * images — self-hosted art always wins over the Palpedia CDN fallback that newly
 * imported Pals start out with.
 */

import { ListObjectsV2Command, type ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { s3 } from '../utils/s3';

/** Franchise folder inside the species-images prefix. */
const FRANCHISE = 'pals';

/** S3 key prefix holding every self-hosted Pal image. */
const IMAGE_PREFIX = `species-images/${FRANCHISE}/`;

/** Bucket the species images live in (mirrors `species-images.routes.ts`). */
const BUCKET = process.env.BUCKETEER_BUCKET_NAME ?? 'dusk-and-dawn-chats';

/**
 * Public origin that serves the species-image proxy. Overridable so a non-prod
 * deployment can point stored URLs at itself.
 */
const PUBLIC_API_BASE = (process.env.SPECIES_IMAGE_BASE_URL ?? 'https://duskanddawn.net/api').replace(
  /\/+$/,
  ''
);

/**
 * Converts a Pal's display name into the slug its artwork is filed under, e.g.
 * "Frostallion Noct" -> "frostallion-noct". This mirrors the slugs Palpedia uses,
 * so a Pal imported from Palpedia and a Pal whose art we host resolve to the same
 * key.
 */
export function slugifyPalName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Builds the public URL for a self-hosted species image key. */
function toPublicUrl(key: string): string {
  const filename = key.slice(IMAGE_PREFIX.length);
  return `${PUBLIC_API_BASE}/species-images/${FRANCHISE}/${filename}`;
}

/**
 * Lists every self-hosted Pal image, mapping slug to its public URL.
 *
 * Paginates the bucket rather than probing per-Pal, so the whole catalogue costs
 * a couple of API calls instead of one round trip per species.
 *
 * Throws when the bucket yields no images at all: that means the S3 credentials
 * or bucket name are wrong, and treating it as "we host no art" would wrongly
 * downgrade every Pal to its fallback image.
 */
export async function listSelfHostedPalImages(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();
  let continuationToken: string | undefined = undefined;

  do {
    const response: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: IMAGE_PREFIX,
        ContinuationToken: continuationToken,
      })
    );

    for (const object of response.Contents ?? []) {
      const key = object.Key;
      if (!key || key === IMAGE_PREFIX) {
        continue;
      }

      const filename = key.slice(IMAGE_PREFIX.length);
      const dot = filename.lastIndexOf('.');
      const slug = dot > 0 ? filename.slice(0, dot) : filename;
      if (!slug || filename.includes('/')) {
        continue;
      }

      bySlug.set(slug.toLowerCase(), toPublicUrl(key));
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  if (bySlug.size === 0) {
    throw new Error(
      `No self-hosted Pal images found under s3://${BUCKET}/${IMAGE_PREFIX} — refusing to continue, ` +
        'since this is far more likely to be a bucket/credential misconfiguration than a genuinely empty catalogue.'
    );
  }

  return bySlug;
}
