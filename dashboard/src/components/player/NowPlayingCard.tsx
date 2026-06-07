import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { formatDuration } from '../../utils/embed';
import { api } from '../../services/api';
import {
  Play,
  Pause,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NowPlayingCardProps {
  guildId: string;
}

export default function NowPlayingCard({ guildId }: NowPlayingCardProps) {
  const { player, togglePlay, skipTrack, stopPlayer, changeVolume, setLoopMode } = usePlayerStore();
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);

  const currentTrack = player?.currentTrack;

  // Sync volume state with store
  useEffect(() => {
    if (player) {
      setVolume(player.volume);
    }
  }, [player?.volume]);

  // Handle local progress ticker
  useEffect(() => {
    if (!player || !player.isPlaying || player.isPaused || !currentTrack) return;

    setProgress(player.position || 0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= currentTrack.duration) {
          clearInterval(interval);
          return currentTrack.duration;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [player?.isPlaying, player?.isPaused, player?.position, currentTrack?.spotifyId]);

  if (!player || !currentTrack) {
    return (
      <div className="glass-panel p-10 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
        <div className="bg-white/5 p-4 rounded-full text-gray-400">
          <Music className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-extrabold text-xl text-white">No Music Playing</h3>
          <p className="text-sm text-gray-400 mt-1">Start playing Spotify tracks using `/play` or the search bar</p>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min(100, (progress / currentTrack.duration) * 100);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    setVolume(vol);
    setIsMuted(vol === 0);
    changeVolume(guildId, vol);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
      changeVolume(guildId, prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
      changeVolume(guildId, 0);
    }
  };

  const cycleLoopMode = () => {
    const modes: ('off' | 'track' | 'queue')[] = ['off', 'track', 'queue'];
    const currentIdx = modes.indexOf(player.loopMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setLoopMode(guildId, nextMode);
    toast.success(`Loop mode: ${nextMode.toUpperCase()}`);
  };

  return (
    <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col items-center gap-6 relative overflow-hidden">
      {/* Background Album Art Blur */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 blur-2xl scale-125"
        style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
      />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        {/* Album Artwork */}
        <img
          src={currentTrack.albumArt || 'https://i.scdn.co/image/ab67616d0000b273eb238b693246ebc0a876771e'}
          alt={currentTrack.title}
          className="w-56 h-56 md:w-64 md:h-64 rounded-2xl shadow-2xl object-cover ring-4 ring-white/5"
        />

        {/* Song Info */}
        <div className="text-center">
          <h2 className="font-extrabold text-2xl text-white tracking-tight leading-snug">
            {currentTrack.title}
          </h2>
          <p className="text-spotify-green font-medium text-sm mt-1">
            {currentTrack.artist}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Album: {currentTrack.album}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-spotify-green rounded-full shadow-[0_0_8px_#1DB954]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>{formatDuration(progress)}</span>
            <span>{formatDuration(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between w-full max-w-sm mt-2">
          {/* Shuffle */}
          <button
            onClick={() => {
              api.shuffle(guildId);
              toast.success('Queue Shuffled');
            }}
            className="text-gray-400 hover:text-white p-3 rounded-full hover:bg-white/5 transition-all"
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Stop */}
          <button
            onClick={() => stopPlayer(guildId)}
            className="text-gray-400 hover:text-discord-red p-3 rounded-full hover:bg-white/5 transition-all"
            title="Stop Player"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => togglePlay(guildId)}
            className="bg-spotify-green text-spotify-dark p-5 rounded-full shadow-lg shadow-spotify-green/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            title={player.isPaused ? 'Resume' : 'Pause'}
          >
            {player.isPaused ? (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            ) : (
              <Pause className="w-6 h-6 fill-current" />
            )}
          </button>

          {/* Skip */}
          <button
            onClick={() => skipTrack(guildId)}
            className="text-gray-400 hover:text-white p-3 rounded-full hover:bg-white/5 transition-all"
            title="Skip Track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Loop Mode */}
          <button
            onClick={cycleLoopMode}
            className={`p-3 rounded-full hover:bg-white/5 transition-all relative ${
              player.loopMode !== 'off' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'
            }`}
            title={`Loop Mode: ${player.loopMode}`}
          >
            <Repeat className="w-5 h-5" />
            {player.loopMode === 'track' && (
              <span className="absolute top-1 right-1 bg-spotify-green text-spotify-dark text-[9px] font-extrabold w-3 h-3 rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-3 w-full max-w-xs mt-4">
          <button
            onClick={handleMuteToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 accent-spotify-green bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-400 font-bold w-8 text-right">{volume}%</span>
        </div>
      </div>
    </div>
  );
}
