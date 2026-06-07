import { io, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { PlayerState, QueueState } from '../types/shared';

class SocketClientService {
  private socket: Socket | null = null;

  public connect(): void {
    try {
      // 1. Generate local JWT to authenticate with the Socket.IO server
      const token = jwt.sign(
        { userId: 'bot', discordId: 'bot', username: 'Bot' },
        env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      this.socket = io(env.API_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        logger.info('✅ Connected to API Socket.IO server');
      });

      this.socket.on('disconnect', () => {
        logger.warn('Disconnected from API Socket.IO server');
      });

      this.socket.on('connect_error', (err) => {
        logger.error(`Socket connection error: ${err.message}`);
      });
    } catch (err) {
      logger.error(`Failed to initialize socket client: ${(err as Error).message}`);
    }
  }

  public emitPlayerUpdate(guildId: string, state: PlayerState): void {
    if (!this.socket?.connected) return;
    this.socket.emit('player:update:client', { guildId, state });
  }

  public emitQueueUpdate(guildId: string, state: QueueState): void {
    if (!this.socket?.connected) return;
    this.socket.emit('queue:update:client', { guildId, state });
  }

  public emitTrackStart(guildId: string, track: any): void {
    if (!this.socket?.connected) return;
    this.socket.emit('track:start:client', { guildId, track });
  }

  public emitTrackEnd(guildId: string, track: any): void {
    if (!this.socket?.connected) return;
    this.socket.emit('track:end:client', { guildId, track });
  }

  public emitError(guildId: string, message: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('player:error:client', { guildId, message });
  }

  public joinGuild(guildId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('join:guild', { guildId });
  }

  public leaveGuild(guildId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('leave:guild', { guildId });
  }
}

export const socketClient = new SocketClientService();
