import { Client, GatewayIntentBits, Events } from 'discord.js';
import mongoose from 'mongoose';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { playerManager } from './services/playerManager.service';
import { initRedisSubscriber } from './services/redis.service';
import { socketClient } from './services/socket.service';
import { handleInteraction } from './events/interactionCreate';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate';

async function bootstrap() {
  try {
    logger.info('Starting Disco XOXO Bot bootstrap...');

    // 1. Connect MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ MongoDB connected');

    // 2. Initialize Socket.IO Client
    logger.info('Connecting to API Socket.IO server...');
    socketClient.connect();

    // 3. Initialize Redis Subscriber
    logger.info('Initializing Redis pub/sub subscription...');
    await initRedisSubscriber();

    // 4. Initialize Discord Client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
      ],
    });

    playerManager.setClient(client);

    // ─── Discord Event Handlers ──────────────────────────────────────────────

    client.once(Events.ClientReady, (readyClient) => {
      logger.info(`✅ Discord Bot logged in as ${readyClient.user.tag}`);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      await handleInteraction(interaction);
    });

    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      handleVoiceStateUpdate(oldState, newState);
    });

    // 5. Discord Login
    await client.login(env.DISCORD_TOKEN);
  } catch (err) {
    logger.error('Fatal bootstrap error in Discord Bot:', err);
    process.exit(1);
  }
}

// Clean up player processes on terminate
function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Cleaning up bot player instances...`);
  try {
    // Destroy all active player processes
    const client = playerManager.getClient();
    if (client) {
      client.guilds.cache.forEach((guild) => {
        playerManager.deletePlayer(guild.id);
      });
    }
    logger.info('Cleanup complete. Exiting.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown cleanup:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

bootstrap();
