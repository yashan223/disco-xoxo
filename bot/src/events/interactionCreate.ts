import { Interaction, GuildMember, ButtonInteraction, TextChannel } from 'discord.js';
import { commands } from '../commands/music.commands';
import { playerManager } from '../services/playerManager.service';
import { spotifyService } from '../services/spotify.service';
import { Track } from '../structures/Track';
import { createNowPlayingEmbed, createPlayerButtons } from '../utils/embed';
import { logger } from '../utils/logger';
import { LoopMode } from '../types/shared';
import { Log } from '../models/Log.model';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  // ─── Chat Input Commands ───────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const cmd = commands.find((c) => c.data.name === interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);

      // Log command usage
      await Log.create({
        guildId,
        userId: interaction.user.id,
        username: interaction.user.username,
        action: 'SETTINGS_CHANGE', // default fallback for log action
        details: { command: interaction.commandName },
        timestamp: new Date(),
      }).catch(() => {});
    } catch (err) {
      logger.error(`Error executing command ${interaction.commandName}: ${(err as Error).message}`);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(`❌ An error occurred: ${(err as Error).message}`);
      } else {
        await interaction.reply({ content: `❌ An error occurred: ${(err as Error).message}`, ephemeral: true });
      }
    }
  }

  // ─── Button Interactions ───────────────────────────────────────────────────
  if (interaction.isButton()) {
    const btnInteraction = interaction as ButtonInteraction;
    const player = playerManager.getPlayer(guildId);

    // 1. Handle Search Select Buttons (search_select_[spotifyId])
    if (btnInteraction.customId.startsWith('search_select_')) {
      await btnInteraction.deferReply();
      const spotifyId = btnInteraction.customId.replace('search_select_', '');
      const member = btnInteraction.member as GuildMember;
      const channel = member.voice.channel;

      if (!channel) {
        await btnInteraction.editReply('❌ You must be in a voice channel to select a track!');
        return;
      }

      try {
        const spotifyTrack = await spotifyService.getTrack(spotifyId);
        const player = playerManager.getOrCreatePlayer(guildId);
        player.textChannel = btnInteraction.channel as TextChannel;

        if (!player.connection) {
          await player.join(channel);
        }

        const track = new Track(spotifyTrack, btnInteraction.user.id);
        const wasEmpty = player.queue.size === 0;

        player.queue.add(track);

        if (wasEmpty) {
          await btnInteraction.editReply(`🎶 Loading selected track: **${track.title}**`);
          await player.play(track);
        } else {
          player.emitState();
          await btnInteraction.editReply(`📥 Added to queue: **${track.title}**`);
        }
      } catch (err) {
        await btnInteraction.editReply(`❌ Error: ${(err as Error).message}`);
      }
      return;
    }

    // 2. Handle Player Controls Buttons
    if (!player) {
      await btnInteraction.reply({ content: '❌ There is no active player in this server.', ephemeral: true });
      return;
    }

    const member = btnInteraction.member as GuildMember;
    if (member.voice.channelId !== member.guild.members.me?.voice.channelId) {
      await btnInteraction.reply({ content: '❌ You must be in the same voice channel as the bot to use controls.', ephemeral: true });
      return;
    }

    switch (btnInteraction.customId) {
      case 'btn_pause_resume':
        if (player.isPaused) {
          await player.resume();
          await btnInteraction.reply({ content: '▶️ Resumed.', ephemeral: true });
        } else {
          await player.pause();
          await btnInteraction.reply({ content: '⏸️ Paused.', ephemeral: true });
        }
        break;

      case 'btn_skip':
        await player.skip();
        await btnInteraction.reply({ content: '⏭️ Skipped!', ephemeral: true });
        break;

      case 'btn_stop':
        player.stop();
        await btnInteraction.reply({ content: '🛑 Stopped and queue cleared.', ephemeral: true });
        break;

      case 'btn_shuffle':
        if (player.queue.size <= 1) {
          await btnInteraction.reply({ content: '❌ Not enough tracks to shuffle.', ephemeral: true });
        } else {
          player.shuffle();
          await btnInteraction.reply({ content: '🔀 Shuffled!', ephemeral: true });
        }
        break;

      case 'btn_loop': {
        const modes: LoopMode[] = ['off', 'track', 'queue'];
        const currentIdx = modes.indexOf(player.queue.loopMode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        player.setLoopMode(nextMode);
        await btnInteraction.reply({ content: `🔁 Loop mode set to: **${nextMode}**`, ephemeral: true });
        break;
      }

      case 'btn_queue':
        if (player.queue.size === 0) {
          await btnInteraction.reply({ content: '❌ Queue is empty.', ephemeral: true });
        } else {
          const list = player.queue.tracks
            .slice(player.queue.currentIndex + 1, player.queue.currentIndex + 11)
            .map((t, idx) => `**${idx + 1}.** [${t.title}](${t.uri}) - ${t.artist}`)
            .join('\n');
          await btnInteraction.reply({
            content: `**Up Next:**\n${list || '*End of queue*'}\n\nTotal tracks in queue: \`${player.queue.size}\``,
            ephemeral: true,
          });
        }
        break;

      default:
        break;
    }

    // Update the message showing nowplaying if it exists
    if (btnInteraction.message && btnInteraction.message.embeds.length > 0) {
      try {
        const currentTrack = player.queue.currentTrack;
        if (currentTrack) {
          const embed = createNowPlayingEmbed(currentTrack, player);
          const buttons = createPlayerButtons(player);
          await btnInteraction.message.edit({ embeds: [embed], components: buttons });
        }
      } catch (err) {
        logger.error(`Error updating message: ${(err as Error).message}`);
      }
    }
  }
}
