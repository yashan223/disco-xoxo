import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { GuildMember, StageChannel, TextChannel, VoiceChannel } from 'discord.js';
import { Queue } from './Queue';
import { Track } from './Track';
import { AudioService } from '../services/audio.service';
import { spotifyPlayerService } from '../services/spotifyPlayer.service';
import { socketClient } from '../services/socket.service';
import { logger } from '../utils/logger';
import { History } from '../models/History.model';
import { Statistics } from '../models/Statistics.model';
import { LoopMode } from '../types/shared';

export class MusicPlayer {
  public readonly guildId: string;
  public readonly queue: Queue;
  public connection: VoiceConnection | null = null;
  public audioPlayer: AudioPlayer;
  public textChannel: TextChannel | null = null;
  public volume = 80;
  public isPaused = false;
  private pcmStream: any = null;
  private trackTimeout: NodeJS.Timeout | null = null;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.queue = new Queue(guildId);
    this.audioPlayer = createAudioPlayer();

    this.audioPlayer.on('stateChange', async (oldState, newState) => {
      if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
        logger.info(`Track finished in guild: ${this.guildId}`);
        await this.handleTrackEnd();
      }
    });

    this.audioPlayer.on('error', (error) => {
      logger.error(`Audio player error in guild ${this.guildId}: ${error.message}`);
      this.emitError(error.message);
      this.handleTrackEnd().catch(() => {});
    });
  }

  public async join(channel: VoiceChannel | StageChannel): Promise<void> {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as any,
      selfDeaf: true,
      selfMute: false,
    });

    this.connection.on('stateChange', async (oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        try {
          // Try to reconnect within 5 seconds
          await Promise.race([
            entersState(this.connection!, VoiceConnectionStatus.Signalling, 5000),
            entersState(this.connection!, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch (error) {
          logger.warn(`Voice connection lost in guild: ${this.guildId}. Disconnecting...`);
          this.destroy();
        }
      }
    });

    this.connection.subscribe(this.audioPlayer);
  }

  public async play(track: Track): Promise<void> {
    try {
      this.isPaused = false;
      this.queue.currentIndex = this.queue.tracks.indexOf(track);

      logger.info(`Playing track ${track.title} in guild ${this.guildId}`);

      // 1. Start the Librespot backend process
      this.pcmStream = await AudioService.startPlayer(this.guildId);

      // 2. Wrap PCM stream into discord.js audio resource
      const resource = AudioService.createResource(this.pcmStream);
      this.audioPlayer.play(resource);

      // 3. Send play command to Spotify Connect device
      // Give librespot process a moment to register on Spotify Connect
      await new Promise(r => setTimeout(r, 1000));
      await spotifyPlayerService.play(this.guildId, [track.uri]);
      await spotifyPlayerService.setVolume(this.guildId, this.volume);

      // 4. Record history & stats
      await this.saveHistory(track);
      await this.incrementStats(track);

      // 5. Emit state updates
      this.emitState();
      socketClient.emitTrackStart(this.guildId, track.toJSON());

      if (this.textChannel) {
        this.textChannel.send(`🎶 **Now Playing:** [${track.title}](${track.uri}) by **${track.artist}**`);
      }
    } catch (err) {
      logger.error(`Failed to play track: ${(err as Error).message}`);
      this.emitError(`Playback failed: ${(err as Error).message}`);
      this.textChannel?.send(`❌ Failed to play track: ${(err as Error).message}`);
    }
  }

  public async pause(): Promise<void> {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.audioPlayer.pause();
      await spotifyPlayerService.pause(this.guildId);
      this.isPaused = true;
      this.emitState();
    }
  }

  public async resume(): Promise<void> {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.audioPlayer.unpause();
      await spotifyPlayerService.resume(this.guildId);
      this.isPaused = false;
      this.emitState();
    }
  }

  public async setVolume(vol: number): Promise<void> {
    this.volume = vol;
    await spotifyPlayerService.setVolume(this.guildId, vol);
    this.emitState();
  }

  public async skip(): Promise<void> {
    logger.info(`Skipping track in guild: ${this.guildId}`);
    this.audioPlayer.stop(); // This triggers handleTrackEnd via stateChange event
  }

  public stop(): void {
    logger.info(`Stopping player in guild: ${this.guildId}`);
    this.queue.clear();
    this.audioPlayer.stop();
    AudioService.stopPlayer(this.guildId);
    this.emitState();
  }

  public setLoopMode(mode: LoopMode): void {
    this.queue.loopMode = mode;
    this.emitState();
  }

  public shuffle(): void {
    this.queue.shuffle();
    this.emitState();
  }

  public removeTrack(queueId: string): void {
    const success = this.queue.remove(queueId);
    if (success) {
      this.emitState();
    }
  }

  public moveTrack(fromIndex: number, toIndex: number): void {
    const success = this.queue.move(fromIndex, toIndex);
    if (success) {
      this.emitState();
    }
  }

  public clearQueue(): void {
    this.queue.clear();
    this.emitState();
  }

  public destroy(): void {
    this.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    socketClient.leaveGuild(this.guildId);
  }

  private async handleTrackEnd(): Promise<void> {
    const current = this.queue.currentTrack;
    if (current) {
      this.queue.addToHistory(current);
      socketClient.emitTrackEnd(this.guildId, current.toJSON());
    }

    AudioService.stopPlayer(this.guildId);

    const nextTrack = this.queue.next();
    if (nextTrack) {
      await this.play(nextTrack);
    } else {
      this.emitState();
      this.textChannel?.send('Queue finished! Add more songs using `/play`.');
    }
  }

  private async saveHistory(track: Track): Promise<void> {
    try {
      await History.findOneAndUpdate(
        { guildId: this.guildId },
        {
          $push: {
            tracks: {
              $each: [
                {
                  spotifyId: track.spotifyId,
                  title: track.title,
                  artist: track.artist,
                  albumArt: track.albumArt,
                  duration: track.duration,
                  requestedBy: track.requestedBy,
                  playedAt: new Date(),
                },
              ],
              $position: 0,
              $slice: 100, // Limit history to last 100 tracks
            },
          },
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error(`Error saving playback history: ${(err as Error).message}`);
    }
  }

  private async incrementStats(track: Track): Promise<void> {
    try {
      // Find today's date formatted as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      await Statistics.findOneAndUpdate(
        { guildId: this.guildId },
        {
          $inc: {
            songsPlayed: 1,
            totalPlaytimeMs: track.duration,
          },
          $setOnInsert: { guildId: this.guildId },
        },
        { upsert: true }
      );

      // Update Top Tracks counter
      await Statistics.updateOne(
        { guildId: this.guildId, 'topTracks.spotifyId': track.spotifyId },
        { $inc: { 'topTracks.$.count': 1 } }
      );

      // If topTrack counter wasn't updated (not exists), push it
      const hasTrack = await Statistics.findOne({
        guildId: this.guildId,
        'topTracks.spotifyId': track.spotifyId,
      });

      if (!hasTrack) {
        await Statistics.updateOne(
          { guildId: this.guildId },
          {
            $push: {
              topTracks: {
                $each: [{ spotifyId: track.spotifyId, title: track.title, artist: track.artist, count: 1 }],
                $sort: { count: -1 },
                $slice: 10,
              },
            },
          }
        );
      }

      // Update dailyPlays statistics
      const hasDaily = await Statistics.findOne({
        guildId: this.guildId,
        'dailyPlays.date': today,
      });

      if (hasDaily) {
        await Statistics.updateOne(
          { guildId: this.guildId, 'dailyPlays.date': today },
          { $inc: { 'dailyPlays.$.count': 1 } }
        );
      } else {
        await Statistics.updateOne(
          { guildId: this.guildId },
          {
            $push: {
              dailyPlays: {
                $each: [{ date: today, count: 1 }],
                $sort: { date: 1 },
                $slice: 30, // keep last 30 days
              },
            },
          }
        );
      }
    } catch (err) {
      logger.error(`Error updating stats: ${(err as Error).message}`);
    }
  }

  public emitState(): void {
    const playerState = {
      guildId: this.guildId,
      isPlaying: this.audioPlayer.state.status === AudioPlayerStatus.Playing,
      isPaused: this.isPaused,
      volume: this.volume,
      loopMode: this.queue.loopMode,
      currentTrack: this.queue.currentTrack ? this.queue.currentTrack.toJSON() : null,
      position: 0, // In standard librespot piping, the exact progress position is managed on spotify connect
      updatedAt: new Date(),
    };

    socketClient.emitPlayerUpdate(this.guildId, playerState);
    socketClient.emitQueueUpdate(this.guildId, this.queue.toJSON());
  }

  private emitError(message: string): void {
    socketClient.emitError(this.guildId, message);
  }
}
