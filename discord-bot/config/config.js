require('dotenv').config();

module.exports = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID, // Optional for global commands
  },
  api: {
    baseUrl: process.env.NODE_ENV === 'production'
      ? 'https://duskanddawn.net/api'
      : (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://localhost:4890/api'),
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
  },
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  channels: {
    defaultAdventure: process.env.DEFAULT_ADVENTURE_CHANNEL_ID,
  },
};
