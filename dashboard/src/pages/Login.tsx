import React from 'react';
import { LogIn, Disc, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/discord`;
  };

  const getErrorMessage = () => {
    switch (error) {
      case 'discord_denied':
        return 'Login was cancelled or denied on Discord.';
      case 'invalid_state':
        return 'Invalid CSRF state. Please try logging in again.';
      case 'auth_failed':
        return 'Authentication failed. Please check your credentials.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-spotify-green/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-discord-blurple/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-10 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-8 shadow-2xl">
          {/* Logo Animation */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-spotify-green to-discord-blurple rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-glow" />
            <div className="relative bg-spotify-dark p-6 rounded-full flex items-center justify-center">
              <Disc className="w-12 h-12 text-spotify-green animate-spin-slow" />
            </div>
          </div>

          <div>
            <h1 className="font-extrabold text-3xl text-white tracking-tight bg-gradient-to-r from-spotify-green to-discord-blurple bg-clip-text text-transparent">
              DISCO XOXO
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Production-Ready Spotify-Only Discord Music Player
            </p>
          </div>

          {error && (
            <div className="w-full p-4 bg-discord-red/5 border border-discord-red/10 rounded-2xl flex items-center gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-discord-red shrink-0" />
              <span className="text-xs text-gray-300 font-medium">{getErrorMessage()}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-discord-blurple text-white hover:scale-102 active:scale-98 py-4 px-6 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-3 shadow-lg shadow-discord-blurple/20 group hover:bg-[#4752C4]"
          >
            <LogIn className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            Login with Discord
          </button>

          <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
            By logging in, you authorize access to your Discord username, avatar, and server listings.
          </p>
        </div>
      </div>
    </div>
  );
}
