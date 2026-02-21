import 'dotenv/config';

// ============================================================================
// Config shape
// ============================================================================

export interface Config {
  discord: {
    token: string;
    clientId: string;
    guildId: string | undefined;
  };
  api: {
    baseUrl: string;
    timeout: number;
    botSecret: string;
  };
  bridge: {
    port: number;
  };
  environment: string;
  channels: {
    defaultAdventure: string | undefined;
  };
}

// ============================================================================
// Validation helpers
// ============================================================================

class EnvValidationError extends Error {
  constructor(missing: string[]) {
    const list = missing.map((k) => `  - ${k}`).join('\n');
    super(`Missing required environment variables:\n${list}`);
    this.name = 'EnvValidationError';
  }
}

function loadConfig(): Config {
  const missing: string[] = [];

  function require(key: string): string {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
      return '';
    }
    return value;
  }

  function optional(key: string, fallback: string): string {
    return process.env[key] ?? fallback;
  }

  function optionalInt(key: string, fallback: number): number {
    const raw = process.env[key];
    if (!raw) {
      return fallback;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      console.warn(`Invalid integer for ${key}="${raw}", using default ${fallback}`);
      return fallback;
    }
    return parsed;
  }

  const token = require('DISCORD_BOT_TOKEN');
  const clientId = require('DISCORD_CLIENT_ID');

  if (missing.length > 0) {
    throw new EnvValidationError(missing);
  }

  const env = optional('NODE_ENV', 'development');

  return {
    discord: {
      token,
      clientId,
      guildId: process.env['DISCORD_GUILD_ID'],
    },
    api: {
      baseUrl:
        env === 'production'
          ? 'https://duskanddawn.net/api'
          : process.env['BACKEND_URL']
            ? `${process.env['BACKEND_URL']}/api`
            : 'http://localhost:4888/api',
      timeout: optionalInt('API_TIMEOUT', 30_000),
      botSecret: optional('BOT_API_SECRET', ''),
    },
    bridge: {
      port: optionalInt('DISCORD_BOT_HTTP_PORT', 3001),
    },
    environment: env,
    channels: {
      defaultAdventure: process.env['DEFAULT_ADVENTURE_CHANNEL_ID'],
    },
  };
}

// ============================================================================
// Singleton — validated once at import time.
// ============================================================================

export const config: Config = loadConfig();
