import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { gzipSync, gunzipSync } from 'node:zlib';

const BUCKET = process.env.BUCKETEER_BUCKET_NAME ?? 'dusk-and-dawn-chats';

export const s3 = new S3Client({
  region: process.env.BUCKETEER_AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY ?? '',
  },
});

/**
 * Get a gzipped JSON object from S3 (Bucketeer).
 * Returns `null` if the key does not exist.
 */
export async function getObject<T>(key: string): Promise<T | null> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes || bytes.length === 0) {return null;}

    // Try to decompress (gzipped) — fall back to raw JSON for legacy data
    let json: string;
    try {
      json = gunzipSync(Buffer.from(bytes)).toString('utf-8');
    } catch {
      json = new TextDecoder().decode(bytes);
    }

    return JSON.parse(json) as T;
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === 'NoSuchKey' || code === 'NotFound') {return null;}
    throw err;
  }
}

/**
 * Put a JSON object into S3 (Bucketeer), gzip-compressed.
 */
export async function putObject(key: string, data: unknown): Promise<void> {
  const compressed = gzipSync(JSON.stringify(data), { level: 9 });

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: compressed,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
    }),
  );
}
