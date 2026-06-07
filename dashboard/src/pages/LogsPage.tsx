import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { LogEntry } from '../types';
import { Loader2, Database, User, Calendar, Terminal, ShieldAlert } from 'lucide-react';

export default function LogsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [activeTab, setActiveTab] = useState<'audit' | 'system'>('audit');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<{ api: string[]; bot: string[] }>({ api: [], bot: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!guildId) return;

    setIsLoading(true);
    if (activeTab === 'audit') {
      api
        .getLogs(guildId)
        .then((res) => {
          setLogs(res.data.logs || []);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      api
        .getSystemLogs(100)
        .then((res) => {
          setSystemLogs(res.data || { api: [], bot: [] });
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [guildId, activeTab]);

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
        <h2 className="font-extrabold text-2xl text-white tracking-tight">Logs & Diagnostics</h2>
        <p className="text-sm text-gray-400 mt-1">
          Historical timeline of player commands and system diagnostics.
        </p>
      </div>

      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-4 text-sm font-extrabold transition-colors flex items-center gap-2 ${
            activeTab === 'audit' ? 'text-spotify-green border-b-2 border-spotify-green' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-4 text-sm font-extrabold transition-colors flex items-center gap-2 ${
            activeTab === 'system' ? 'text-discord-red border-b-2 border-discord-red' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          System Errors
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-spotify-green animate-spin" />
        </div>
      ) : activeTab === 'audit' ? (
        logs.length === 0 ? (
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
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border uppercase ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {log.details?.query ? (
                          <>Requested play query: <span className="text-gray-400 font-bold truncate max-w-[200px] inline-block align-bottom">{log.details.query as string}</span></>
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
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-discord-red/5 border border-discord-red/20 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-discord-red shrink-0" />
            <div>
              <p className="text-sm font-bold text-discord-red">Global System Errors</p>
              <p className="text-xs text-discord-red/70 mt-0.5">
                These logs show the latest 100 error entries across the entire API and Bot infrastructure.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-white text-lg">Bot Process Logs</h3>
            <div className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/5 h-64 overflow-y-auto font-mono text-xs text-gray-300">
              {systemLogs.bot.length === 0 ? (
                <span className="text-spotify-green">No errors in the current bot log file.</span>
              ) : (
                systemLogs.bot.map((line, i) => (
                  <div key={i} className="mb-1 whitespace-pre-wrap break-all">{line}</div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-white text-lg">API Process Logs</h3>
            <div className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/5 h-64 overflow-y-auto font-mono text-xs text-gray-300">
              {systemLogs.api.length === 0 ? (
                <span className="text-spotify-green">No errors in the current api log file.</span>
              ) : (
                systemLogs.api.map((line, i) => (
                  <div key={i} className="mb-1 whitespace-pre-wrap break-all">{line}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
