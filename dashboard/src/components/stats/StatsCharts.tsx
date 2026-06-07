import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface StatsChartsProps {
  dailyPlays: Array<{ date: string; count: number }>;
  topTracks: Array<{ title: string; count: number }>;
}

export default function StatsCharts({ dailyPlays, topTracks }: StatsChartsProps) {
  // Fallback mock data if empty
  const playData = dailyPlays.length > 0 ? dailyPlays : [
    { date: 'Mon', count: 4 },
    { date: 'Tue', count: 8 },
    { date: 'Wed', count: 5 },
    { date: 'Thu', count: 12 },
    { date: 'Fri', count: 18 },
    { date: 'Sat', count: 10 },
    { date: 'Sun', count: 15 },
  ];

  const trackData = topTracks.length > 0 ? topTracks : [
    { title: 'Song A', count: 24 },
    { title: 'Song B', count: 18 },
    { title: 'Song C', count: 15 },
    { title: 'Song D', count: 10 },
    { title: 'Song E', count: 8 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Daily Plays Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div>
          <h3 className="font-extrabold text-lg text-white">Daily Songs Played</h3>
          <p className="text-xs text-gray-400">Activity monitor for the last 7 days</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={playData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#141517',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
              />
              <Area type="monotone" dataKey="count" stroke="#1DB954" strokeWidth={2} fillOpacity={1} fill="url(#colorPlays)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Tracks Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div>
          <h3 className="font-extrabold text-lg text-white">Top Tracks Played</h3>
          <p className="text-xs text-gray-400">Most requested tracks on this server</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trackData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="title" stroke="rgba(255,255,255,0.2)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#141517',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {trackData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#1DB954' : '#5865F2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
