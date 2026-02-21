import express, { type Request, type Response } from 'express';
import { ChannelType, type TextChannel, type ThreadChannel } from 'discord.js';
import type { DuskClient } from '../client.js';
import { config } from '../config/index.js';

// ============================================================================
// Request / Response shapes (incoming from the backend)
// ============================================================================

interface SendMessageBody {
  threadId: string;
  message: string;
}

interface CreateThreadBody {
  adventureId: number;
  adventureName: string;
  channelId: string;
  emoji?: string;
}

interface ArchiveThreadBody {
  threadId: string;
  reason?: string;
}

interface BridgeSuccess {
  success: true;
  [key: string]: unknown;
}

interface BridgeError {
  success: false;
  message: string;
}

type BridgeResponse = BridgeSuccess | BridgeError;

// ============================================================================
// Helpers
// ============================================================================

function error(res: Response, status: number, message: string): void {
  const body: BridgeError = { success: false, message };
  res.status(status).json(body);
}

function isTextBased(
  channel: unknown,
): channel is TextChannel | ThreadChannel {
  const ch = channel as { isTextBased?: () => boolean };
  return typeof ch?.isTextBased === 'function' && ch.isTextBased();
}

// ============================================================================
// Bridge server factory
// ============================================================================

export function startBridgeServer(client: DuskClient): void {
  const app = express();
  app.use(express.json());

  // -- Health ----------------------------------------------------------------

  app.get('/health', (_req: Request, res: Response) => {
    const body: BridgeResponse = {
      success: true,
      status: 'ok',
      uptime: process.uptime(),
    };
    res.json(body);
  });

  // -- Send message to a Discord thread -------------------------------------

  app.post('/send-message', async (req: Request, res: Response) => {
    const { threadId, message } = req.body as SendMessageBody;

    if (!threadId || !message) {
      error(res, 400, 'threadId and message are required');
      return;
    }

    try {
      const channel = await client.channels.fetch(threadId);

      if (!channel || !isTextBased(channel)) {
        error(res, 404, `Thread ${threadId} not found or is not text-based`);
        return;
      }

      const sent = await channel.send(message);

      const body: BridgeResponse = { success: true, messageId: sent.id };
      res.json(body);
    } catch (err) {
      console.error(`Bridge: failed to send message to ${threadId}:`, err);
      error(res, 500, err instanceof Error ? err.message : 'Unknown error');
    }
  });

  // -- Create a thread for an adventure -------------------------------------

  app.post('/api/create-thread', async (req: Request, res: Response) => {
    const { adventureId, adventureName, channelId, emoji = '\u2694\uFE0F' } =
      req.body as CreateThreadBody;

    if (!adventureId || !adventureName || !channelId) {
      error(res, 400, 'adventureId, adventureName, and channelId are required');
      return;
    }

    try {
      const channel = await client.channels.fetch(channelId);

      if (channel?.type !== ChannelType.GuildText) {
        error(res, 404, `Channel ${channelId} not found or is not a text channel`);
        return;
      }

      const threadName = `${emoji} ${adventureName}`.slice(0, 100);

      const thread = await (channel as TextChannel).threads.create({
        name: threadName,
        autoArchiveDuration: 10080, // 7 days
        reason: `Adventure #${adventureId}: ${adventureName}`,
      });

      const body: BridgeResponse = {
        success: true,
        threadId: thread.id,
        threadName: thread.name,
        channelId,
        threadUrl: thread.url,
      };
      res.json(body);
    } catch (err) {
      console.error(`Bridge: failed to create thread in ${channelId}:`, err);
      error(res, 500, err instanceof Error ? err.message : 'Unknown error');
    }
  });

  // -- Archive (lock + archive) a thread ------------------------------------

  app.post('/archive-thread', async (req: Request, res: Response) => {
    const { threadId, reason } = req.body as ArchiveThreadBody;

    if (!threadId) {
      error(res, 400, 'threadId is required');
      return;
    }

    try {
      const channel = await client.channels.fetch(threadId);

      if (!channel?.isThread()) {
        error(res, 404, `Thread ${threadId} not found`);
        return;
      }

      await channel.setLocked(true, reason ?? 'Adventure completed');
      await channel.setArchived(true, reason ?? 'Adventure completed');

      const body: BridgeResponse = {
        success: true,
        message: `Thread ${threadId} archived`,
      };
      res.json(body);
    } catch (err) {
      console.error(`Bridge: failed to archive thread ${threadId}:`, err);
      error(res, 500, err instanceof Error ? err.message : 'Unknown error');
    }
  });

  // -- Start listening -------------------------------------------------------

  app.listen(config.bridge.port, () => {
    console.log(`Bridge HTTP server running on port ${config.bridge.port}`);
  });
}
