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
  botUrl?: string;
  botHttpPort?: number;
  defaultChannelId?: string;
  guildId?: string;
  websiteUrl?: string;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: DiscordConfig = {
  botUrl: 'http://localhost:3002',
  botHttpPort: 3001,
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
 * Service for Discord thread management for adventures
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
      botUrl: process.env.DISCORD_BOT_URL ?? DEFAULT_CONFIG.botUrl,
      botHttpPort: process.env.DISCORD_BOT_HTTP_PORT
        ? parseInt(process.env.DISCORD_BOT_HTTP_PORT, 10)
        : DEFAULT_CONFIG.botHttpPort,
      defaultChannelId: process.env.DEFAULT_ADVENTURE_CHANNEL_ID,
      guildId: process.env.DISCORD_GUILD_ID,
      websiteUrl: process.env.WEBSITE_URL ?? DEFAULT_CONFIG.websiteUrl,
      ...config,
    };
  }

  /**
   * Create a Discord thread for an adventure via HTTP request to Discord bot
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
      // Make HTTP request to Discord bot endpoint
      const response = await axios.post<ThreadCreationResult>(
        `${this.config.botUrl}/api/create-thread`,
        {
          adventureId: adventure.id,
          adventureName: adventure.title,
          channelId: targetChannelId,
          emoji,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.threadId) {
        // Store thread information in database
        await this.adventureThreadRepository.create({
          adventureId: adventure.id,
          discordThreadId: response.data.threadId,
          discordChannelId: targetChannelId,
          threadName: response.data.threadName ?? `${emoji} ${adventure.title}`,
        });

        // Update adventure with Discord thread info
        await this.adventureRepository.update(adventure.id, {
          discordThreadId: response.data.threadId,
          discordChannelId: targetChannelId,
        });

        // Send welcome message
        const welcomeMessage = await this.generateWelcomeMessage(adventure);
        await this.sendMessageToThread(response.data.threadId, welcomeMessage);

        console.log(
          `Discord thread created for adventure "${adventure.title}": ${response.data.threadId}`
        );

        return response.data;
      } else {
        throw new Error(response.data.message ?? 'Failed to create thread');
      }
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
   * Send message to adventure thread
   */
  async sendMessageToThread(threadId: string, message: string): Promise<MessageSendResult> {
    try {
      const discordBotUrl = `http://localhost:${this.config.botHttpPort}`;

      console.log(`Sending message to Discord bot at ${discordBotUrl}/send-message`);

      const response = await axios.post<MessageSendResult>(
        `${discordBotUrl}/send-message`,
        {
          threadId,
          message,
        },
        {
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error sending message to Discord thread:', axiosError.message);

      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Discord bot HTTP server is not running',
        };
      }

      return {
        success: false,
        message: axiosError.message,
      };
    }
  }

  /**
   * Archive adventure thread via Discord bot
   */
  async archiveThread(threadId: string): Promise<ArchiveResult> {
    try {
      const discordBotUrl = `http://localhost:${this.config.botHttpPort}`;

      const response = await axios.post<ArchiveResult>(
        `${discordBotUrl}/archive-thread`,
        {
          threadId,
          reason: 'Adventure completed',
        },
        {
          timeout: 10000,
        }
      );

      return response.data;
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
