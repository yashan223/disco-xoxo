import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import StatsCharts from '../components/stats/StatsCharts';
import { Loader2, Play, Activity, Clock, Zap, Award } from 'lucide-react';
import { formatDuration } from '../utils/embed';

export default function StatsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!guildId) return;

    api
      .getStats(guildId)
      .then((res) => {
        setStats(res.data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [guildId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-spotify-green animate-spin" />
      </div>
    );
  }

  const dailyPlays = stats?.dailyPlays || [];
  const topTracks = (stats?.topTracks || []).map((t: any) => ({
    title: t.title,
    count: t.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-extrabold text-2xl text-white tracking-tight">Server Statistics</h2>
        <p className="text-sm text-gray-400 mt-1">
          Historical overview of music activity, commands used, and listener rankings.
        </p>
      </div>

      {/* Numerical Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Songs Played */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="bg-spotify-green/10 text-spotify-green p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Songs Played</p>
            <h3 className="font-extrabold text-2xl text-white mt-0.5">{stats?.songsPlayed || 0}</h3>
          </div>
        </div>

        {/* Total Playtime */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="bg-discord-blurple/10 text-discord-blurple p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Playtime</p>
            <h3 className="font-extrabold text-2xl text-white mt-0.5">
              {formatDuration(stats?.totalPlaytimeMs || 0)}
            </h3>
          </div>
        </div>

        {/* Commands Triggered */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="bg-discord-yellow/10 text-discord-yellow p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Commands Used</p>
            <h3 className="font-extrabold text-2xl text-white mt-0.5">{stats?.commandsUsed || 0}</h3>
          </div>
        </div>
      </div>

      {/* Area & Bar Charts */}
      <StatsCharts dailyPlays={dailyPlays} topTracks={topTracks} />

      {/* Top Requesters Ranking List */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div>
          <h3 className="font-extrabold text-lg text-white">Top Requesters</h3>
          <p className="text-xs text-gray-400">Listener rankings based on requests</p>
        </div>

        {stats?.topRequesters?.length === 0 ? (
          <p className="text-sm text-gray-400">No listener statistics gathered yet.</p>
        ) : (
          <div className="space-y-2.5">
            {stats?.topRequesters?.map((req: any, idx: number) => (
              <div
                key={req.userId}
                className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-spotify-green">
                    #{idx + 1}
                  </div>
                  <span className="font-bold text-sm text-white">{req.username}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                  <Award className="w-4 h-4 text-discord-yellow" />
                  {req.count} requests
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
