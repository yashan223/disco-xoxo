import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { usePlayerStore } from '../store/playerStore';
import { SpotifyTrack } from '../types';
import NowPlayingCard from '../components/player/NowPlayingCard';
import { SkeletonPlayer } from '../components/common/Skeleton';
import { Search, Loader2, Music, Plus, Disc } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlayerPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Socket.IO connection for this guild
  useSocket(guildId);

  const { fetchPlayerState, isLoading, playTrack } = usePlayerStore();

  useEffect(() => {
    if (guildId) {
      fetchPlayerState(guildId);
    }
  }, [guildId, fetchPlayerState]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.search(searchQuery);
      setSearchResults(res.data.tracks?.items || []);
    } catch (err: any) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayResult = async (track: SpotifyTrack) => {
    if (!guildId) return;
    try {
      await playTrack(guildId, track.uri);
      toast.success(`Requested: ${track.title}`);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      toast.error('Failed to request track');
    }
  };

  if (isLoading && !searchResults.length) {
    return <SkeletonPlayer />;
  }

  return (
    <div className="space-y-8">
      {/* Search Spotify Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div>
          <h2 className="font-extrabold text-xl text-white">Search Spotify Songs</h2>
          <p className="text-xs text-gray-400">Search for any track to add to the server queue instantly</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by song title, artist, album, or paste Spotify URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 hover:bg-black/30 focus:bg-black/40 border border-white/5 focus:border-spotify-green/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold text-white placeholder-gray-500 transition-all focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-spotify-green text-spotify-dark hover:scale-102 active:scale-98 disabled:opacity-50 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-spotify-green/10"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5 max-h-[300px] overflow-y-auto pr-2">
            {searchResults.map((track) => (
              <div
                key={track.spotifyId}
                className="glass-panel hover:bg-white/5 p-3 rounded-xl border border-white/3 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.albumArt || 'https://i.scdn.co/image/ab67616d0000b273eb238b693246ebc0a876771e'}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/5"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayResult(track)}
                  className="bg-white/5 hover:bg-spotify-green hover:text-spotify-dark p-2 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Music Player Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {guildId && <NowPlayingCard guildId={guildId} />}
        </div>

        {/* Server DJ Rules Card Info */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-white">How to Stream</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-white/5 p-2 rounded-xl text-spotify-green h-10 w-10 flex items-center justify-center shrink-0">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Join Voice Channel</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Make sure you are sitting in a Discord voice channel.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-white/5 p-2 rounded-xl text-discord-blurple h-10 w-10 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Play Songs</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Paste a Spotify link or search a song title. The bot will join your channel automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-xs text-gray-400 leading-relaxed mt-4">
            💡 **Premium Tip:** Users can queue tracks without permissions. Skipping or stopping requires DJ Role if configured in Server Settings.
          </div>
        </div>
      </div>
    </div>
  );
}
