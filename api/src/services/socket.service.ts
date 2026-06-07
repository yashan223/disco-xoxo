import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../utils/env';
import { jwtService } from './jwt.service';
import { logger } from '../utils/logger';
import type { PlayerState, QueueState, QueueTrack } from '../types/shared';

let io: SocketIOServer;

// In-memory player states per guild (shared between API and Socket.IO)
const playerStates = new Map<string, PlayerState>();
const queueStates = new Map<string, QueueState>();

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.DASHBOARD_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('UNAUTHORIZED'));
    try {
      const payload = jwtService.verify(token);
      (socket as Socket & { user: typeof payload }).user = payload;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('join:guild', ({ guildId }: { guildId: string }) => {
      socket.join(`guild:${guildId}`);
      // Send current state immediately
      const player = playerStates.get(guildId);
      const queue = queueStates.get(guildId);
      if (player) socket.emit('player:update', player);
      if (queue) socket.emit('queue:update', queue);
    });

    socket.on('leave:guild', ({ guildId }: { guildId: string }) => {
      socket.leave(`guild:${guildId}`);
    });

    // Handle updates from Bot client and forward/broadcast to Guild room
    socket.on('player:update:client', ({ guildId, state }: { guildId: string; state: PlayerState }) => {
      playerStates.set(guildId, state);
      io.to(`guild:${guildId}`).emit('player:update', state);
    });

    socket.on('queue:update:client', ({ guildId, state }: { guildId: string; state: QueueState }) => {
      queueStates.set(guildId, state);
      io.to(`guild:${guildId}`).emit('queue:update', state);
    });

    socket.on('track:start:client', ({ guildId, track }: { guildId: string; track: any }) => {
      io.to(`guild:${guildId}`).emit('track:start', track);
    });

    socket.on('track:end:client', ({ guildId, track }: { guildId: string; track: any }) => {
      io.to(`guild:${guildId}`).emit('track:end', track);
    });

    socket.on('player:error:client', ({ guildId, message }: { guildId: string; message: string }) => {
      io.to(`guild:${guildId}`).emit('player:error', { guildId, message });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export const socketService = {
  emitPlayerUpdate(guildId: string, state: PlayerState) {
    playerStates.set(guildId, state);
    io?.to(`guild:${guildId}`).emit('player:update', state);
  },

  emitQueueUpdate(guildId: string, state: QueueState) {
    queueStates.set(guildId, state);
    io?.to(`guild:${guildId}`).emit('queue:update', state);
  },

  emitTrackStart(guildId: string, track: QueueTrack) {
    io?.to(`guild:${guildId}`).emit('track:start', track);
  },

  emitTrackEnd(guildId: string, track: QueueTrack) {
    io?.to(`guild:${guildId}`).emit('track:end', track);
  },

  emitError(guildId: string, message: string) {
    io?.to(`guild:${guildId}`).emit('player:error', { guildId, message });
  },

  getPlayerState(guildId: string): PlayerState | undefined {
    return playerStates.get(guildId);
  },

  getQueueState(guildId: string): QueueState | undefined {
    return queueStates.get(guildId);
  },

  setPlayerState(guildId: string, state: PlayerState) {
    playerStates.set(guildId, state);
  },

  setQueueState(guildId: string, state: QueueState) {
    queueStates.set(guildId, state);
  },

  deleteGuildState(guildId: string) {
    playerStates.delete(guildId);
    queueStates.delete(guildId);
  },
};
