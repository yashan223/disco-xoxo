import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Music,
  ListMusic,
  Settings,
  BarChart3,
  Database,
  User as UserIcon,
  Server,
  LogOut,
  Sliders,
  Disc,
  Menu,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Music Player', icon: Music, path: `/dashboard/${guildId}/player` },
    { name: 'Queue Manager', icon: ListMusic, path: `/dashboard/${guildId}/queue` },
    { name: 'Spotify Account', icon: Disc, path: `/dashboard/${guildId}/spotify` },
    { name: 'Server Statistics', icon: BarChart3, path: `/dashboard/${guildId}/stats` },
    { name: 'Audit Logs', icon: Database, path: `/dashboard/${guildId}/logs` },
    { name: 'Settings', icon: Sliders, path: `/dashboard/${guildId}/admin` },
  ];

  return (
    <div className="flex h-screen bg-discord-darkest text-gray-200 overflow-hidden font-sans">
      {/* ─── SIDEBAR (DESKTOP) ────────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-64 glass-panel border-r border-white/5">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-spotify-green p-2 rounded-xl flex items-center justify-center glow-green">
              <Disc className="w-5 h-5 text-spotify-dark animate-spin-slow" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-spotify-green to-discord-blurple bg-clip-text text-transparent">
              DISCO XOXO
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Link
            to="/servers"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-4"
          >
            <Server className="w-5 h-5 text-discord-blurple" />
            Server Selector
          </Link>

          <div className="text-xs uppercase font-extrabold text-white/20 px-4 mb-2 tracking-wider">
            Player Controls
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-spotify-green text-spotify-dark shadow-lg shadow-spotify-green/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <img
              src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt="Avatar"
              className="w-10 h-10 rounded-full ring-2 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">
                {user?.spotifyLinked ? 'Spotify Connected' : 'Spotify Disconnected'}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-discord-red p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between h-16 px-6 glass-panel border-b border-white/5 z-20">
          <span className="font-extrabold text-lg bg-gradient-to-r from-spotify-green to-discord-blurple bg-clip-text text-transparent">
            DISCO XOXO
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white p-2 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Slide-out Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-10 bg-discord-darkest/95 flex flex-col pt-20 px-6 space-y-4">
            <Link
              to="/servers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-base font-semibold rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Server className="w-5 h-5 text-discord-blurple" />
              Server Selector
            </Link>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-semibold rounded-xl transition-all ${
                    isActive ? 'bg-spotify-green text-spotify-dark shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-4 py-3 text-base font-semibold rounded-xl text-discord-red hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        )}

        {/* Main scrollable body */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-6 md:p-8 bg-gradient-to-b from-discord-dark to-discord-darkest">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
