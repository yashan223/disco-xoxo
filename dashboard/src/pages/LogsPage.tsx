import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { LogEntry } from '../types';
import { Loader2, Database, User, Calendar } from 'lucide-react';

export default function LogsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!guildId) return;

    api
      .getLogs(guildId)
      .then((res) => {
        setLogs(res.data.logs || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [guildId]);

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'PLAY':
        return 'text-spotify-green bg-spotify-green/5 border-spotify-green/10';
      case 'STOP':
      case 'DISCONNECT':
        return 'text-discord-red bg-discord-red/5 border-discord-red/10';
      case 'PAUSE':
      case 'RESUME':
        return 'text-discord-yellow bg-discord-yellow/5 border-discord-yellow/10';
      default:
        return 'text-discord-blurple bg-discord-blurple/5 border-discord-blurple/10';
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
        <h2 className="font-extrabold text-2xl text-white tracking-tight">Audit Logs</h2>
        <p className="text-sm text-gray-400 mt-1">
          Historical timeline of player commands and configuration modifications.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center gap-3">
          <Database className="w-10 h-10 text-gray-500" />
          <p className="text-gray-400 font-medium">No actions logged on this server yet.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Action Badge */}
                  <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border uppercase ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>

                  {/* Log description */}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {log.details?.query ? (
                        <>
                          Requested play query: <span className="text-gray-400 font-bold truncate max-w-[200px] inline-block align-bottom">{log.details.query as string}</span>
                        </>
                      ) : log.details?.volume !== undefined ? (
                        `Adjusted volume to ${log.details.volume}%`
                      ) : log.details?.mode ? (
                        `Set loop mode to ${log.details.mode}`
                      ) : (
                        `Executed player control action`
                      )}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                      <User className="w-3 h-3" />
                      <span>By: {log.username || log.userId}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
