import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import SpotifyLinker from '../components/spotify/SpotifyLinker';
import { SpotifyTrack } from '../types';
import { ListMusic, Music, Heart, Disc, Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SpotifyPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'albums'>('playlists');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.spotifyLinked) return;

    setIsLoading(true);
    if (activeTab === 'playlists') {
      api
        .getPlaylists()
        .then((res) => {
          setPlaylists(res.data.playlists || []);
          setIsLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load Spotify playlists');
          setIsLoading(false);
        });
    } else if (activeTab === 'liked') {
      api
        .getLikedSongs()
        .then((res) => {
          setLikedSongs(res.data.songs || []);
          setIsLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load liked songs');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [user?.spotifyLinked, activeTab]);

  const handlePlayCollection = async (uri: string, name: string) => {
    if (!guildId) {
      toast.error('Select a Discord server first!');
      return;
    }

    try {
      await api.play(guildId, uri);
      toast.success(`Playing collection: ${name}`);
    } catch (err: any) {
      toast.error('Failed to play collection');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-extrabold text-2xl text-white tracking-tight">Spotify settings & Library</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage your account credentials and control playback directly from your Spotify library.
        </p>
      </div>

      <SpotifyLinker />

      {/* Library Tabs (only if connected) */}
      {user?.spotifyLinked && (
        <div className="space-y-6">
          <div className="flex border-b border-white/5 gap-6">
            <button
              onClick={() => setActiveTab('playlists')}
              className={`pb-4 text-sm font-extrabold transition-colors flex items-center gap-2 ${
                activeTab === 'playlists' ? 'text-spotify-green border-b-2 border-spotify-green' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              Playlists
            </button>

            <button
              onClick={() => setActiveTab('liked')}
              className={`pb-4 text-sm font-extrabold transition-colors flex items-center gap-2 ${
                activeTab === 'liked' ? 'text-spotify-green border-b-2 border-spotify-green' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              Liked Songs
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-spotify-green animate-spin" />
            </div>
          ) : activeTab === 'playlists' ? (
            playlists.length === 0 ? (
              <p className="text-sm text-gray-400">No playlists found on your Spotify account.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={pl.images?.[0]?.url || 'https://i.scdn.co/image/ab67616d0000b273eb238b693246ebc0a876771e'}
                        alt={pl.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/5"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-white">{pl.name}</h4>
                        <p className="text-xs text-gray-400">Tracks: {pl.tracks?.total || 0}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlayCollection(pl.uri, pl.name)}
                      className="bg-white/5 hover:bg-spotify-green hover:text-spotify-dark p-2.5 rounded-xl transition-all"
                      title="Play Playlist"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : likedSongs.length === 0 ? (
            <p className="text-sm text-gray-400">No liked songs found on your Spotify account.</p>
          ) : (
            <div className="space-y-2">
              {likedSongs.map((song) => (
                <div
                  key={song.spotifyId}
                  className="glass-panel p-3 rounded-xl border border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={song.albumArt || 'https://i.scdn.co/image/ab67616d0000b273eb238b693246ebc0a876771e'}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/5"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{song.title}</h4>
                      <p className="text-xs text-gray-400">{song.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayCollection(song.uri, song.title)}
                    className="bg-white/5 hover:bg-spotify-green hover:text-spotify-dark p-2 rounded-lg transition-all"
                    title="Play Song"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
