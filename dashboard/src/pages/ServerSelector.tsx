import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Guild } from '../types';
import ServerCard from '../components/common/ServerCard';
import { useAuthStore } from '../store/authStore';
import { Disc, LogOut, Loader2, ServerOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServerSelector() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    
    api
      .getGuilds()
      .then((res) => {
        setGuilds(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load server list');
        setIsLoading(false);
      });
  }, [fetchUser]);

  const handleSelectGuild = (guildId: string) => {
    navigate(`/dashboard/${guildId}/player`);
  };

  return (
    <div className="min-h-screen bg-discord-darkest flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-spotify-green/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-discord-blurple/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 glass-panel flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-spotify-green p-2 rounded-lg text-spotify-dark flex items-center justify-center">
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-spotify-green to-discord-blurple bg-clip-text text-transparent">
            DISCO XOXO
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={user?.username}
              className="w-8 h-8 rounded-full ring-1 ring-white/10"
            />
            <span className="text-sm font-bold text-white hidden sm:inline">{user?.username}</span>
          </div>

          <button
            onClick={logout}
            className="text-gray-400 hover:text-discord-red p-2 rounded-lg hover:bg-white/5 transition-all"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid Panel */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col gap-6">
        <div>
          <h1 className="font-extrabold text-3xl text-white tracking-tight">Select a Discord Server</h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose a server where you have Administrator permissions to start controlling music playback.
          </p>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
            <Loader2 className="w-10 h-10 text-spotify-green animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Scanning servers...</p>
          </div>
        ) : guilds.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center gap-4 py-20">
            <ServerOff className="w-12 h-12 text-gray-500" />
            <div>
              <h3 className="font-extrabold text-lg text-white">No Servers Found</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                You do not own or administer any Discord servers with the Disco XOXO bot invited.
              </p>
            </div>
            <a
              href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID || 'client-id'}&permissions=8&scope=bot%20applications.commands`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-discord-blurple hover:bg-[#4752C4] px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md mt-2"
            >
              Invite Bot to Server
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guilds.map((guild) => (
              <ServerCard key={guild.guildId} guild={guild} onSelect={handleSelectGuild} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
