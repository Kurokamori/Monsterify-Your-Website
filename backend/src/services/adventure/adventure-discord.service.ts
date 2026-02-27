import axios, { AxiosError } from 'axios';
import {
  AdventureThreadRepository,
  AdventureThread,
} from '../../repositories/adventure-thread.repository';
import { AdventureRepository, Adventure } from '../../repositories/adventure.repository';
import type { WelcomeMessages } from '../../utils/contents/area-configurations';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// Types
// ============================================================================

export type ThreadCreationResult = {
  success: boolean;
  threadId?: string;
  threadName?: string;
  channelId?: string;
  threadUrl?: string;
  message?: string;
  error?: string;
};

export type MessageSendResult = {
  success: boolean;
  message?: string;
};

export type ArchiveResult = {
  success: boolean;
  message: string;
};

export type DiscordConfig = {
  botToken?: string;
  defaultChannelId?: string;
  guildId?: string;
  websiteUrl?: string;
};

// ============================================================================
// Constants
// ============================================================================

const DISCORD_API_BASE = 'https://discord.com/api/v10';

const DEFAULT_CONFIG: DiscordConfig = {
  websiteUrl: 'http://localhost:4888',
};

const DEFAULT_WELCOME_MESSAGE = (adventureTitle: string): string =>
  `**Welcome to ${adventureTitle}!**\n\n` +
  `This is your adventure thread! Here's how it works:\n\n` +
  `Every message you send counts toward your word count\n` +
  `Use \`/encounter\` to roll random encounters\n` +
  `Use \`/capture [trainer] [pokeball]\` to catch wild monsters\n` +
  `Use \`/result\` to resolve battle encounters\n` +
  `Use \`/end\` to complete the adventure and claim rewards\n\n` +
  `**Maximum encounters:** 3 per adventure\n` +
  `**Rewards:** 50 words = 1 level, 1 word = 1 coin, every 1,000 words = 1 item\n\n` +
  `Good luck, adventurers!`;

// ============================================================================
// Service
// ============================================================================

/**
 * Service for Discord thread management for adventures.
 * Calls the Discord REST API directly using the bot token,
 * so it works regardless of whether the backend and bot are co-located.
 */
export class AdventureDiscordService {
  private config: DiscordConfig;
  private adventureThreadRepository: AdventureThreadRepository;
  private adventureRepository: AdventureRepository;

  constructor(
    adventureThreadRepository?: AdventureThreadRepository,
    adventureRepository?: AdventureRepository,
    config?: Partial<DiscordConfig>
  ) {
    this.adventureThreadRepository =
      adventureThreadRepository ?? new AdventureThreadRepository();
    this.adventureRepository = adventureRepository ?? new AdventureRepository();

    this.config = {
      ...DEFAULT_CONFIG,
      botToken: process.env.DISCORD_BOT_TOKEN,
      defaultChannelId: process.env.DEFAULT_ADVENTURE_CHANNEL_ID,
      guildId: process.env.DISCORD_GUILD_ID,
      websiteUrl: process.env.WEBSITE_URL ?? DEFAULT_CONFIG.websiteUrl,
      ...config,
    };
  }

  /** Shared headers for Discord API calls */
  private get discordHeaders() {
    return {
      Authorization: `Bot ${this.config.botToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a Discord thread for an adventure via the Discord REST API
   */
  async createAdventureThread(
    adventure: Adventure,
    emoji: string = '🗡️',
    channelId?: string
  ): Promise<ThreadCreationResult> {
    const targetChannelId = channelId ?? this.config.defaultChannelId;

    if (!targetChannelId) {
      console.warn('No Discord channel ID provided for adventure thread creation');
      return {
        success: false,
        message: 'No Discord channel configured',
      };
    }

    try {
      const threadName = `${emoji} ${adventure.title}`.slice(0, 100);

      // Create a public thread via Discord REST API
      const response = await axios.post(
        `${DISCORD_API_BASE}/channels/${targetChannelId}/threads`,
        {
          name: threadName,
          auto_archive_duration: 10080, // 7 days
          type: 11, // PUBLIC_THREAD
        },
        {
          timeout: 15000,
          headers: this.discordHeaders,
        }
      );

      const thread = response.data as { id: string; name: string };

      // Store thread information in database
      await this.adventureThreadRepository.create({
        adventureId: adventure.id,
        discordThreadId: thread.id,
        discordChannelId: targetChannelId,
        threadName: thread.name,
      });

      // Update adventure with Discord thread info
      await this.adventureRepository.update(adventure.id, {
        discordThreadId: thread.id,
        discordChannelId: targetChannelId,
      });

      // Send welcome message
      const welcomeMessage = await this.generateWelcomeMessage(adventure);
      await this.sendMessageToThread(thread.id, welcomeMessage);

      const guildId = this.config.guildId ?? '@me';
      const threadUrl = `https://discord.com/channels/${guildId}/${thread.id}`;

      console.log(
        `Discord thread created for adventure "${adventure.title}": ${thread.id}`
      );

      return {
        success: true,
        threadId: thread.id,
        threadName: thread.name,
        channelId: targetChannelId,
        threadUrl,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error creating Discord thread:', axiosError.message);

      return {
        success: false,
        message: axiosError.message,
        error: axiosError.toString(),
      };
    }
  }

  /**
   * Generate area-specific welcome message for an adventure
   */
  async generateWelcomeMessage(adventure: Adventure): Promise<string> {
    try {
      // Check if adventure has area configuration
      if (adventure.areaConfig && adventure.areaId) {
        let areaConfig = adventure.areaConfig;

        // Parse area_config if it's a string
        if (typeof areaConfig === 'string') {
          areaConfig = JSON.parse(areaConfig) as object;
        }

        const config = areaConfig as { welcomeMessages?: WelcomeMessages };

        // Use area-specific welcome message if available
        if (config.welcomeMessages) {
          // Randomly select from variations or use base message
          const variations = config.welcomeMessages.variations ?? [];
          if (variations.length > 0) {
            const randomIndex = Math.floor(Math.random() * variations.length);
            const selectedVariation = variations[randomIndex];
            if (selectedVariation) {
              return selectedVariation;
            }
          }
          if (config.welcomeMessages.base) {
            return config.welcomeMessages.base;
          }
        }
      }

      // Fallback to default welcome message
      return DEFAULT_WELCOME_MESSAGE(adventure.title);
    } catch (error) {
      console.error('Error generating welcome message:', error);
      return DEFAULT_WELCOME_MESSAGE(adventure.title);
    }
  }

  /**
   * Check if Discord integration is available
   */
  isDiscordAvailable(): boolean {
    return !!(this.config.botToken && this.config.defaultChannelId);
  }

  /**
   * Get Discord thread URL for an adventure
   */
  getThreadUrl(adventure: Adventure, guildId?: string): string | null {
    if (!adventure.discordThreadId) {
      return null;
    }

    const targetGuildId = guildId ?? this.config.guildId ?? '@me';
    return `https://discord.com/channels/${targetGuildId}/${adventure.discordThreadId}`;
  }

  /**
   * Send message to adventure thread via Discord REST API
   */
  async sendMessageToThread(threadId: string, message: string): Promise<MessageSendResult> {
    try {
      await axios.post(
        `${DISCORD_API_BASE}/channels/${threadId}/messages`,
        { content: message },
        {
          timeout: 10000,
          headers: this.discordHeaders,
        }
      );

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error sending message to Discord thread:', axiosError.message);

      return {
        success: false,
        message: axiosError.message,
      };
    }
  }

  /**
   * Archive adventure thread via Discord REST API
   */
  async archiveThread(threadId: string): Promise<ArchiveResult> {
    try {
      // Lock and archive the thread
      await axios.patch(
        `${DISCORD_API_BASE}/channels/${threadId}`,
        {
          locked: true,
          archived: true,
        },
        {
          timeout: 10000,
          headers: this.discordHeaders,
        }
      );

      return {
        success: true,
        message: `Thread ${threadId} archived`,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error archiving Discord thread:', axiosError.message);

      return {
        success: false,
        message: axiosError.message,
      };
    }
  }

  /**
   * Get thread by adventure ID
   */
  async getThreadByAdventureId(adventureId: number): Promise<AdventureThread | null> {
    return this.adventureThreadRepository.findByAdventureId(adventureId);
  }

  /**
   * Get thread by Discord thread ID
   */
  async getThreadByDiscordId(discordThreadId: string): Promise<AdventureThread | null> {
    return this.adventureThreadRepository.findByDiscordThreadId(discordThreadId);
  }

  /**
   * Get all active adventure threads
   */
  async getActiveThreads(): Promise<AdventureThread[]> {
    return this.adventureThreadRepository.findActiveThreads();
  }

  /**
   * Complete adventure and archive thread
   */
  async completeAdventureThread(adventureId: number): Promise<ArchiveResult> {
    const thread = await this.adventureThreadRepository.findByAdventureId(adventureId);

    if (!thread) {
      return {
        success: false,
        message: 'No thread found for this adventure',
      };
    }

    // Send completion message
    await this.sendMessageToThread(
      thread.discordThreadId,
      `**Adventure Complete!**\n\nThis adventure has ended. Thanks for participating!`
    );

    // Archive the thread
    return this.archiveThread(thread.discordThreadId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DiscordConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<DiscordConfig, 'botToken'> {
    const { botToken: _botToken, ...safeConfig } = this.config;
    return safeConfig;
  }
}
