import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Disc, CheckCircle2, AlertTriangle, Link as LinkIcon, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SpotifyLinker() {
  const { user, fetchUser } = useAuthStore();

  const handleLink = async () => {
    try {
      const res = await api.linkSpotify();
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
    } catch (err: any) {
      toast.error('Failed to initiate Spotify linking');
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Spotify account?')) return;
    try {
      await api.unlinkSpotify();
      toast.success('Spotify account unlinked');
      fetchUser();
    } catch (err: any) {
      toast.error('Failed to unlink Spotify account');
    }
  };

  return (
    <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-spotify-green p-3 rounded-2xl flex items-center justify-center text-spotify-dark">
            <Disc className="w-8 h-8 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-white">Spotify Account Linking</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md">
              Link your Spotify account to import playlists, search your personal library, and customize your experience.
            </p>
          </div>
        </div>

        <div>
          {user?.spotifyLinked ? (
            <button
              onClick={handleUnlink}
              className="bg-discord-red/10 text-discord-red border border-discord-red/15 hover:bg-discord-red/20 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Unlink className="w-5 h-5" />
              Unlink Spotify
            </button>
          ) : (
            <button
              onClick={handleLink}
              className="bg-spotify-green text-spotify-dark hover:scale-105 active:scale-95 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-spotify-green/20"
            >
              <LinkIcon className="w-5 h-5" />
              Link Spotify Account
            </button>
          )}
        </div>
      </div>

      {/* Account Info Panel */}
      {user?.spotifyLinked ? (
        <div className="p-4 bg-spotify-green/5 border border-spotify-green/10 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-spotify-green" />
          <div>
            <p className="text-sm font-bold text-white">Linked Spotify Account</p>
            <p className="text-xs text-spotify-green font-medium mt-0.5">
              Display Name: <span className="font-bold text-white">{user.spotifyDisplayName}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-discord-yellow/5 border border-discord-yellow/10 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-discord-yellow" />
          <div>
            <p className="text-sm font-bold text-white">No Spotify Account Linked</p>
            <p className="text-xs text-gray-400 mt-0.5">
              To browse playlists or access private songs, you must authenticate with Spotify.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
