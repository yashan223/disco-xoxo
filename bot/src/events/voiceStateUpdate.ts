import { VoiceState } from 'discord.js';
import { playerManager } from '../services/playerManager.service';
import { logger } from '../utils/logger';

// Timeout Map to track empty channel timers
const timeouts = new Map<string, NodeJS.Timeout>();

export function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
  const guildId = oldState.guild.id;
  const player = playerManager.getPlayer(guildId);

  if (!player) return;

  const botMember = oldState.guild.members.me;
  if (!botMember || !botMember.voice.channelId) {
    // Bot was disconnected from voice channel outside command flow (e.g., kicked or guild deleted)
    if (player.connection) {
      logger.info(`Bot was disconnected from channel in guild: ${guildId}. Cleaning up player.`);
      playerManager.deletePlayer(guildId);
    }
    return;
  }

  const botChannelId = botMember.voice.channelId;
  const channel = oldState.guild.channels.cache.get(botChannelId) as any;

  if (channel) {
    // Count human users in the voice channel
    const humanCount = channel.members.filter((member: any) => !member.user.bot).size;

    if (humanCount === 0) {
      logger.info(`Voice channel ${channel.name} is empty in guild: ${guildId}. Starting 60s timeout.`);
      
      if (!timeouts.has(guildId)) {
        const timeout = setTimeout(() => {
          const checkPlayer = playerManager.getPlayer(guildId);
          if (checkPlayer && checkPlayer.connection) {
            const checkChannel = oldState.guild.channels.cache.get(botChannelId) as any;
            const checkHumans = checkChannel?.members.filter((m: any) => !m.user.bot).size ?? 0;
            
            if (checkHumans === 0) {
              logger.info(`Disconnecting from empty voice channel in guild: ${guildId}`);
              checkPlayer.textChannel?.send('🚪 Left the voice channel because it was empty.');
              playerManager.deletePlayer(guildId);
            }
          }
          timeouts.delete(guildId);
        }, 60 * 1000); // 60 seconds idle timeout
        
        timeouts.set(guildId, timeout);
      }
    } else {
      // Humans are in the channel, clear timeout if one was active
      const activeTimeout = timeouts.get(guildId);
      if (activeTimeout) {
        logger.info(`Users returned to voice channel in guild: ${guildId}. Cancelling timeout.`);
        clearTimeout(activeTimeout);
        timeouts.delete(guildId);
      }
    }
  }
}
