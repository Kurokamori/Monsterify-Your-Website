import { config } from './config/index.js';
import { DuskClient } from './client.js';
import { execute as onReady } from './events/ready.js';
import { execute as onInteractionCreate } from './events/interaction-create.js';
import { execute as onMessageCreate } from './events/message-create.js';
import { execute as onThreadCreate } from './events/thread-create.js';
import { execute as onThreadDelete } from './events/thread-delete.js';
import { execute as onThreadLock } from './events/thread-lock.js';

const client = new DuskClient();

// -- Discord events ----------------------------------------------------------

client.once('ready', onReady);
client.on('interactionCreate', onInteractionCreate);
client.on('messageCreate', onMessageCreate);
client.on('threadCreate', onThreadCreate);
client.on('threadDelete', onThreadDelete);
client.on('threadUpdate', onThreadLock);

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

// -- Graceful shutdown -------------------------------------------------------

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  client.destroy();
  process.exit(0);
});

// -- Login -------------------------------------------------------------------

client.login(config.discord.token).catch((error: unknown) => {
  console.error('Failed to login to Discord:', error);
  process.exit(1);
});
