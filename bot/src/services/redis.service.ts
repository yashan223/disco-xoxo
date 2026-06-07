import Redis from 'ioredis';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { playerManager } from './playerManager.service';
import { spotifyService } from './spotify.service';
import { Track } from '../structures/Track';
import { GuildMember, VoiceChannel } from 'discord.js';

export const redisPub = new Redis(env.REDIS_URL);
export const redisSub = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  disableClientInfo: true,
});


redisPub.on('error', (err) => logger.error(`Redis Pub Error: ${err.message}`));
redisSub.on('error', (err) => logger.error(`Redis Sub Error: ${err.message}`));

export async function initRedisSubscriber(): Promise<void> {
  await redisSub.subscribe('bot:commands');
  logger.info('✅ Subscribed to bot:commands channel on Redis');

  redisSub.on('message', async (channel, message) => {
    if (channel !== 'bot:commands') return;

    try {
      const payload = JSON.parse(message);
      const { guildId, action, userId, data } = payload;
      logger.info(`Received command: ${action} for guild ${guildId} from user ${userId}`);

      const client = playerManager.getClient();
      if (!client) {
        logger.warn('Discord client not initialized in PlayerManager');
        return;
      }

      const player = playerManager.getOrCreatePlayer(guildId);

      switch (action) {
        case 'PLAY': {
          const { query } = data;
          if (!query) break;

          let tracksToPlay: any[] = [];
          let collectionName = '';

          try {
            if (spotifyService.isValidSpotifyUrl(query)) {
              const result = await spotifyService.resolveSpotifyUrl(query);
              tracksToPlay = result.tracks;
              collectionName = result.name || '';
            } else {
              // Perform a track search
              const results = await spotifyService.search(query, 1);
              if (results.length === 0) {
                player.textChannel?.send(`❌ No search results found for: \`${query}\``);
                break;
              }
              tracksToPlay = [results[0]];
            }
          } catch (err) {
            logger.error(`Error resolving query "${query}": ${(err as Error).message}`);
            break;
          }

          if (tracksToPlay.length === 0) break;

          // Connect to voice channel if not already connected
          if (!player.connection) {
            const guild = client.guilds.cache.get(guildId);
            const member = guild?.members.cache.get(userId) as GuildMember;
            const channel = member?.voice.channel;

            if (!channel) {
              logger.warn(`User ${userId} is not in a voice channel in guild ${guildId}`);
              break;
            }

            await player.join(channel);
          }

          // Map to internal Track class
          const mappedTracks = tracksToPlay.map((t) => new Track(t, userId));
          const wasEmpty = player.queue.size === 0;

          player.queue.add(mappedTracks);

          if (wasEmpty) {
            const first = player.queue.tracks[0];
            await player.play(first);
          } else {
            player.emitState();
            if (mappedTracks.length > 1) {
              player.textChannel?.send(`📥 Added **${mappedTracks.length}** songs from **${collectionName}** to the queue.`);
            } else {
              player.textChannel?.send(`📥 Added to queue: **${mappedTracks[0].title}**`);
            }
          }
          break;
        }

        case 'PAUSE':
          await player.pause();
          break;

        case 'RESUME':
          await player.resume();
          break;

        case 'SKIP':
          await player.skip();
          break;

        case 'STOP':
          player.stop();
          break;

        case 'SHUFFLE':
          player.shuffle();
          break;

        case 'LOOP':
          if (data?.mode) {
            player.setLoopMode(data.mode);
          }
          break;

        case 'VOLUME':
          if (data?.volume !== undefined) {
            await player.setVolume(data.volume);
          }
          break;

        case 'REMOVE':
          if (data?.trackId) {
            player.removeTrack(data.trackId);
          }
          break;

        case 'CLEAR':
          player.clearQueue();
          break;

        case 'MOVE':
          if (data?.fromIndex !== undefined && data?.toIndex !== undefined) {
            player.moveTrack(data.fromIndex, data.toIndex);
          }
          break;

        default:
          logger.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      logger.error(`Error processing Redis subscription message: ${(err as Error).message}`);
    }
  });
}
