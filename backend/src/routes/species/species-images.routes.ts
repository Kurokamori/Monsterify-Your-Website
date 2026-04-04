import { Router } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../utils/s3';

const router = Router();

const BUCKET = process.env.BUCKETEER_BUCKET_NAME ?? 'dusk-and-dawn-chats';

/**
 * GET /species-images/:franchise/:filename
 *
 * Proxies species images from S3 (Bucketeer) to the browser.
 * Cached aggressively since species images rarely change.
 */
router.get('/:franchise/:filename', async (req, res) => {
  const { franchise, filename } = req.params;

  // Basic validation
  if (!franchise || !filename || filename.includes('..') || franchise.includes('..')) {
    res.status(400).send('Bad request');
    return;
  }

  const key = `species-images/${franchise}/${filename}`;

  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));

    if (!result.Body) {
      res.status(404).send('Not found');
      return;
    }

    // Set cache headers — these images are essentially immutable
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Type', result.ContentType ?? 'image/png');

    if (result.ContentLength !== undefined) {
      res.set('Content-Length', String(result.ContentLength));
    }

    // Stream the S3 response body to the client
    const stream = result.Body as NodeJS.ReadableStream;
    stream.pipe(res);
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      res.status(404).send('Not found');
      return;
    }
    console.error(`Error serving species image ${key}:`, err);
    res.status(500).send('Internal server error');
  }
});

export default router;
