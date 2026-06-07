import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2, Save, Sliders, Volume2, Shield, Radio, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [defaultVolume, setDefaultVolume] = useState(80);
  const [loopMode, setLoopMode] = useState<'off' | 'track' | 'queue'>('off');
  const [autoplay, setAutoplay] = useState(false);
  const [announce, setAnnounce] = useState(true);
  const [djRoles, setDjRoles] = useState<string>('');
  const [musicChannel, setMusicChannel] = useState<string>('');

  useEffect(() => {
    if (!guildId) return;

    api
      .getGuilds()
      .then((res) => {
        const currentGuild = res.data.find((g: any) => g.guildId === guildId);
        if (currentGuild && currentGuild.settings) {
          const s = currentGuild.settings;
          setDefaultVolume(s.defaultVolume ?? 80);
          setLoopMode(s.loopMode ?? 'off');
          setAutoplay(s.autoplay ?? false);
          setAnnounce(s.announce ?? true);
          setDjRoles(s.djRoles?.join(', ') ?? '');
          setMusicChannel(s.musicChannel ?? '');
        }
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load server configuration');
        setIsLoading(false);
      });
  }, [guildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildId) return;

    setIsSaving(true);
    const rolesArray = djRoles
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      await api.updateGuildSettings(guildId, {
        defaultVolume,
        loopMode,
        autoplay,
        announce,
        djRoles: rolesArray,
        musicChannel: musicChannel.trim() || undefined,
      });
      toast.success('Configuration saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-spotify-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-extrabold text-2xl text-white tracking-tight">Server Settings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Adjust defaults, restrict DJ role commands, and manage playback options for the active server.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 max-w-2xl">
        {/* Default Volume slider */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <Volume2 className="w-4 h-4 text-spotify-green" />
            Default Playback Volume
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={defaultVolume}
              onChange={(e) => setDefaultVolume(parseInt(e.target.value, 10))}
              className="flex-1 accent-spotify-green bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-extrabold text-white w-8 text-right">{defaultVolume}%</span>
          </div>
          <p className="text-[11px] text-gray-400">Startup volume when a new player is instantiated.</p>
        </div>

        <hr className="border-white/5" />

        {/* Loop Mode Select */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-white">Default Loop Mode</label>
          <select
            value={loopMode}
            onChange={(e) => setLoopMode(e.target.value as any)}
            className="w-full bg-black/20 hover:bg-black/30 border border-white/5 rounded-2xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-spotify-green/20"
          >
            <option value="off">Off (No repeat)</option>
            <option value="track">Single Track</option>
            <option value="queue">Entire Queue</option>
          </select>
          <p className="text-[11px] text-gray-400">Startup loop behavior for music queues.</p>
        </div>

        <hr className="border-white/5" />

        {/* Toggles */}
        <div className="space-y-4">
          {/* Autoplay */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-sm font-bold text-white group-hover:text-spotify-green transition-colors">
                Autoplay Recommended Tracks
              </p>
              <p className="text-[11px] text-gray-400">
                Continue playing similar songs from Spotify recommendations when queue finishes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="accent-spotify-green w-5 h-5 rounded cursor-pointer"
            />
          </label>

          {/* Announce Tracks */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-sm font-bold text-white group-hover:text-spotify-green transition-colors">
                Announce Tracks In Discord
              </p>
              <p className="text-[11px] text-gray-400">
                Send a rich "Now Playing" embed card in the text channel when a new song starts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={announce}
              onChange={(e) => setAnnounce(e.target.checked)}
              className="accent-spotify-green w-5 h-5 rounded cursor-pointer"
            />
          </label>
        </div>

        <hr className="border-white/5" />

        {/* DJ Roles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="w-4 h-4 text-discord-blurple" />
            DJ Roles (comma separated IDs)
          </label>
          <input
            type="text"
            placeholder="e.g. 123456789012345678, 987654321098765432"
            value={djRoles}
            onChange={(e) => setDjRoles(e.target.value)}
            className="w-full bg-black/20 hover:bg-black/30 border border-white/5 rounded-2xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-spotify-green/20"
          />
          <p className="text-[11px] text-gray-400">
            If specified, only members with these roles (or Server Admins) can pause, skip, loop, or clear.
          </p>
        </div>

        <hr className="border-white/5" />

        {/* Music Channel Binding */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-white">
            <Radio className="w-4 h-4 text-spotify-green" />
            Bind to Text Channel ID
          </label>
          <input
            type="text"
            placeholder="e.g. 123456789012345678"
            value={musicChannel}
            onChange={(e) => setMusicChannel(e.target.value)}
            className="w-full bg-black/20 hover:bg-black/30 border border-white/5 rounded-2xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-spotify-green/20"
          />
          <p className="text-[11px] text-gray-400">
            Restrict slash commands and bot announcements to a single text channel.
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-spotify-green text-spotify-dark hover:scale-102 active:scale-98 disabled:opacity-50 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-md shadow-spotify-green/10"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
