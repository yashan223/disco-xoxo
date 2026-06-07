import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePlayerStore } from '../store/playerStore';
import { useQueueStore } from '../store/queueStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket(guildId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const setPlayerState = usePlayerStore((s) => s.setPlayerState);
  const setQueueState = useQueueStore((s) => s.setQueueState);

  useEffect(() => {
    if (!guildId) return;

    const token = localStorage.getItem('token');
    
    // Connect to Socket.IO Server
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Subscribe to guild updates
      socket.emit('join:guild', { guildId });
    });

    socket.on('player:update', (state) => {
      setPlayerState(state);
    });

    socket.on('queue:update', (state) => {
      setQueueState(state);
    });

    socket.on('track:start', (track) => {
      toast.success(`🎶 Now playing: ${track.title} by ${track.artist}`);
    });

    socket.on('player:error', (data) => {
      toast.error(`Playback Error: ${data.message}`);
    });

    return () => {
      socket.emit('leave:guild', { guildId });
      socket.disconnect();
    };
  }, [guildId, setPlayerState, setQueueState]);

  return socketRef.current;
}
