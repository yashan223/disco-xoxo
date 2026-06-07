import React from 'react';
import { Guild } from '../../types';
import { Server, ArrowRight } from 'lucide-react';

interface ServerCardProps {
  guild: Guild;
  onSelect: (guildId: string) => void;
}

export default function ServerCard({ guild, onSelect }: ServerCardProps) {
  const initials = guild.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        {/* Guild icon or fallback initials */}
        {guild.icon ? (
          <img
            src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.icon}.png`}
            alt={guild.name}
            className="w-14 h-14 rounded-xl ring-2 ring-white/5 object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-discord-blurple to-indigo-900 flex items-center justify-center text-lg font-bold text-white tracking-wider">
            {initials}
          </div>
        )}

        <div>
          <h3 className="font-extrabold text-lg text-white group-hover:text-spotify-green transition-colors">
            {guild.name}
          </h3>
          <p className="text-xs text-gray-400">Settings: Volume {guild.settings?.defaultVolume}%</p>
        </div>
      </div>

      <button
        onClick={() => onSelect(guild.guildId)}
        className="bg-white/5 hover:bg-spotify-green hover:text-spotify-dark p-3 rounded-xl transition-all flex items-center justify-center text-gray-400 group-hover:translate-x-1"
      >
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
