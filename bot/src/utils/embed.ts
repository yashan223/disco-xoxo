import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Track } from '../structures/Track';
import { MusicPlayer } from '../structures/MusicPlayer';
import { Queue } from '../structures/Queue';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function createProgressBar(current: number, total: number, size = 15): string {
  const percentage = current / total;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;

  const progressText = '▬'.repeat(Math.max(0, progress));
  const emptyProgressText = '▬'.repeat(Math.max(0, emptyProgress));

  return `\`${formatDuration(current)}\` ┃${progressText}🔘${emptyProgressText}┃ \`${formatDuration(total)}\``;
}

export function createNowPlayingEmbed(track: Track, player: MusicPlayer): EmbedBuilder {
  // Get playback position from discord.js voice audio resource
  // Note: resource.playbackDuration is the total duration that has been played (in ms)
  const resource = (player.audioPlayer.state as any).resource;
  const position = resource ? resource.playbackDuration : 0;

  const embed = new EmbedBuilder()
    .setColor('#1DB954') // Spotify Green
    .setTitle(track.title)
    .setURL(track.uri)
    .setAuthor({ name: 'Now Playing', iconURL: 'https://i.scdn.co/image/ab67616d0000b273eb238b693246ebc0a876771e' })
    .setDescription(`by **${track.artist}**`)
    .addFields(
      { name: 'Album', value: track.album || 'Unknown', inline: true },
      { name: 'Requested By', value: `<@${track.requestedBy}>`, inline: true },
      { name: 'Queue Position', value: `${player.queue.currentIndex + 1} of ${player.queue.size}`, inline: true },
      { name: 'Progress', value: createProgressBar(position, track.duration) },
      {
        name: 'Settings',
        value: `Volume: \`${player.volume}%\` ┃ Loop: \`${player.queue.loopMode}\` ┃ Shuffled: \`${player.queue.currentIndex > 0 ? 'Yes' : 'No'}\``,
      }
    )
    .setImage(track.albumArt)
    .setTimestamp();

  return embed;
}

export function createQueueEmbed(queue: Queue): EmbedBuilder {
  const current = queue.currentTrack;
  const embed = new EmbedBuilder()
    .setColor('#1DB954')
    .setTitle(`Music Queue for Server`)
    .setTimestamp();

  if (current) {
    embed.setDescription(`**Now Playing:** [${current.title}](${current.uri}) - ${current.artist}\n\n**Up Next:**`);
  } else {
    embed.setDescription('No tracks currently playing.');
    return embed;
  }

  // Display next 10 tracks
  const startIndex = queue.currentIndex + 1;
  const upcoming = queue.tracks.slice(startIndex, startIndex + 10);

  if (upcoming.length === 0) {
    embed.setDescription((embed.data.description || '') + '\n*Queue is empty! Add songs using `/play`*');
  } else {
    const list = upcoming
      .map((t, idx) => `\`${startIndex + idx + 1}.\` [${t.title}](${t.uri}) - ${t.artist} (Requested by: <@${t.requestedBy}>)`)
      .join('\n');
    embed.setDescription((embed.data.description || '') + `\n${list}\n\n*And ${Math.max(0, queue.size - (startIndex + 10))} more songs...*`);
  }

  return embed;
}

export function createPlayerButtons(player: MusicPlayer): ActionRowBuilder<ButtonBuilder>[] {
  const isPlaying = !player.isPaused;

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_pause_resume')
      .setLabel(isPlaying ? 'Pause' : 'Resume')
      .setStyle(isPlaying ? ButtonStyle.Primary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_skip')
      .setLabel('Skip')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_stop')
      .setLabel('Stop')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('btn_shuffle')
      .setLabel('Shuffle')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_loop')
      .setLabel(`Loop: ${player.queue.loopMode}`)
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_queue')
      .setLabel('View Queue')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}
