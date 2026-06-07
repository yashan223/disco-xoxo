import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  VoiceChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { playerManager } from '../services/playerManager.service';
import { spotifyService } from '../services/spotify.service';
import { Track } from '../structures/Track';
import { createNowPlayingEmbed, createQueueEmbed, createPlayerButtons } from '../utils/embed';
import { LoopMode } from '../types/shared';
import { Log } from '../models/Log.model';

export const commands = [
  // ─── PLAY ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play a Spotify track, album, playlist or search')
      .addStringOption((opt) =>
        opt.setName('query').setDescription('Spotify URL or search terms').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply();
      const query = interaction.options.getString('query', true);
      const member = interaction.member as GuildMember;
      const channel = member.voice.channel;

      if (!channel) {
        return interaction.editReply('❌ You must be in a voice channel to play music!');
      }

      if (!spotifyService.isValidSpotifyUrl(query)) {
        if (query.startsWith('http://') || query.startsWith('https://')) {
          return interaction.editReply('❌ Only Spotify URLs or search terms are supported!');
        }
      }

      const player = playerManager.getOrCreatePlayer(interaction.guildId!);
      player.textChannel = interaction.channel as any;

      if (!player.connection) {
        await player.join(channel);
      }

      let tracksToPlay: any[] = [];
      let collectionName = '';

      try {
        if (spotifyService.isValidSpotifyUrl(query)) {
          const result = await spotifyService.resolveSpotifyUrl(query);
          tracksToPlay = result.tracks;
          collectionName = result.name || '';
        } else {
          // Perform search
          const results = await spotifyService.search(query, 1);
          if (results.length === 0) {
            return interaction.editReply(`❌ No search results found for: \`${query}\``);
          }
          tracksToPlay = [results[0]];
        }
      } catch (err) {
        return interaction.editReply(`❌ Error resolving track: ${(err as Error).message}`);
      }

      const mappedTracks = tracksToPlay.map((t) => new Track(t, interaction.user.id));
      const wasEmpty = player.queue.size === 0;

      player.queue.add(mappedTracks);

      if (wasEmpty) {
        const first = player.queue.tracks[0];
        await interaction.editReply(`🎶 Loading track: **${first.title}**`);
        await player.play(first);
      } else {
        player.emitState();
        if (mappedTracks.length > 1) {
          await interaction.editReply(`📥 Added **${mappedTracks.length}** songs from **${collectionName}** to the queue.`);
        } else {
          await interaction.editReply(`📥 Added to queue: **${mappedTracks[0].title}**`);
        }
      }
    },
  },

  // ─── SEARCH ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('search')
      .setDescription('Search Spotify for a song')
      .addStringOption((opt) =>
        opt.setName('query').setDescription('Search keywords').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply();
      const query = interaction.options.getString('query', true);
      const results = await spotifyService.search(query, 5);

      if (results.length === 0) {
        return interaction.editReply('❌ No search results found.');
      }

      const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle(`Search Results for: "${query}"`)
        .setDescription(
          results
            .map((t, idx) => `**${idx + 1}.** [${t.title}](${t.uri}) - ${t.artist}`)
            .join('\n')
        )
        .setFooter({ text: 'Select a song by clicking one of the buttons below' });

      const buttons = results.map((t, idx) =>
        new ButtonBuilder()
          .setCustomId(`search_select_${t.spotifyId}`)
          .setLabel((idx + 1).toString())
          .setStyle(ButtonStyle.Secondary)
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
      await interaction.editReply({ embeds: [embed], components: [row] });
    },
  },

  // ─── QUEUE ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the current music queue'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player || player.queue.size === 0) {
        return interaction.reply('❌ The queue is empty.');
      }

      const embed = createQueueEmbed(player.queue);
      return interaction.reply({ embeds: [embed] });
    },
  },

  // ─── SKIP ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player || !player.queue.currentTrack) {
        return interaction.reply('❌ No music is playing right now.');
      }
      await player.skip();
      return interaction.reply('⏭️ Skipped!');
    },
  },

  // ─── STOP ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop the player and clear queue'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player) return interaction.reply('❌ No active player in this server.');
      player.stop();
      return interaction.reply('🛑 Player stopped and queue cleared.');
    },
  },

  // ─── PAUSE ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause playback'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player || player.isPaused) {
        return interaction.reply('❌ Player is not playing.');
      }
      await player.pause();
      return interaction.reply('⏸️ Paused.');
    },
  },

  // ─── RESUME ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume playback'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player || !player.isPaused) {
        return interaction.reply('❌ Player is not paused.');
      }
      await player.resume();
      return interaction.reply('▶️ Resumed.');
    },
  },

  // ─── LOOP ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('loop')
      .setDescription('Set music loop mode')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Loop mode')
          .setRequired(true)
          .addChoices(
            { name: 'Off', value: 'off' },
            { name: 'Track', value: 'track' },
            { name: 'Queue', value: 'queue' }
          )
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const mode = interaction.options.getString('mode', true) as LoopMode;
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player) return interaction.reply('❌ No active player.');
      player.setLoopMode(mode);
      return interaction.reply(`🔁 Loop mode set to: **${mode}**`);
    },
  },

  // ─── SHUFFLE ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player || player.queue.size <= 1) {
        return interaction.reply('❌ Not enough songs in the queue to shuffle.');
      }
      player.shuffle();
      return interaction.reply('🔀 Queue shuffled!');
    },
  },

  // ─── REMOVE ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove a track from the queue')
      .addIntegerOption((opt) =>
        opt.setName('position').setDescription('Position of track to remove (1-indexed)').setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const position = interaction.options.getInteger('position', true);
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player) return interaction.reply('❌ No active player.');

      const index = position - 1;
      if (index < 0 || index >= player.queue.tracks.length) {
        return interaction.reply('❌ Invalid position.');
      }

      const track = player.queue.tracks[index];
      player.removeTrack(track.queueId);
      return interaction.reply(`🗑️ Removed: **${track.title}**`);
    },
  },

  // ─── CLEAR ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('clear').setDescription('Clear the queue'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player) return interaction.reply('❌ No active player.');
      player.clearQueue();
      return interaction.reply('🧹 Queue cleared.');
    },
  },

  // ─── VOLUME ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('volume')
      .setDescription('Set volume (0-100)')
      .addIntegerOption((opt) =>
        opt.setName('level').setDescription('Volume percentage').setRequired(true).setMinValue(0).setMaxValue(100)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const level = interaction.options.getInteger('level', true);
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player) return interaction.reply('❌ No active player.');
      await player.setVolume(level);
      return interaction.reply(`🔊 Volume set to: **${level}%**`);
    },
  },

  // ─── NOWPLAYING ────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the current playing song'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player || !player.queue.currentTrack) {
        return interaction.reply('❌ No music is playing right now.');
      }

      const embed = createNowPlayingEmbed(player.queue.currentTrack, player);
      const buttons = createPlayerButtons(player);

      return interaction.reply({ embeds: [embed], components: buttons });
    },
  },

  // ─── DISCONNECT ────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('disconnect').setDescription('Leave the voice channel'),
    async execute(interaction: ChatInputCommandInteraction) {
      const player = playerManager.getPlayer(interaction.guildId!);
      if (!player) return interaction.reply('❌ Bot is not in any voice channel.');
      playerManager.deletePlayer(interaction.guildId!);
      return interaction.reply('🚪 Disconnected from voice.');
    },
  },

  // ─── HELP ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('help').setDescription('List all commands'),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('Disco XOXO Music Bot Commands')
        .setDescription(
          `Here are all available commands:
          
          \`/play <query>\` — Play a Spotify track, album, playlist or search
          \`/search <query>\` — Search Spotify songs
          \`/queue\` — View the current queue
          \`/skip\` — Skip the current track
          \`/stop\` — Stop playback and clear the queue
          \`/pause\` — Pause playback
          \`/resume\` — Resume playback
          \`/loop <mode>\` — Cycle loop mode (off/track/queue)
          \`/shuffle\` — Shuffle the queue
          \`/remove <position>\` — Remove a song from queue
          \`/clear\` — Clear the queue
          \`/volume <0-100>\` — Adjust playback volume
          \`/nowplaying\` — Display current song details and interactive player controls
          \`/disconnect\` — Disconnect the bot from voice channel`
        );
      return interaction.reply({ embeds: [embed] });
    },
  },
];
