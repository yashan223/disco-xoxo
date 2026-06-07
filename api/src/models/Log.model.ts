import mongoose, { Document, Schema } from 'mongoose';

export type LogAction =
  | 'PLAY' | 'SKIP' | 'STOP' | 'PAUSE' | 'RESUME'
  | 'SHUFFLE' | 'LOOP' | 'VOLUME' | 'REMOVE' | 'CLEAR'
  | 'DISCONNECT' | 'LOGIN' | 'LOGOUT' | 'SPOTIFY_LINK' | 'SPOTIFY_UNLINK'
  | 'SETTINGS_CHANGE' | 'COMMAND_ERROR';

export interface ILog extends Document {
  guildId: string;
  userId: string;
  username?: string;
  action: LogAction;
  details?: Record<string, unknown>;
  timestamp: Date;
}

const LogSchema = new Schema<ILog>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String },
    action: {
      type: String,
      required: true,
      enum: [
        'PLAY', 'SKIP', 'STOP', 'PAUSE', 'RESUME',
        'SHUFFLE', 'LOOP', 'VOLUME', 'REMOVE', 'CLEAR',
        'DISCONNECT', 'LOGIN', 'LOGOUT', 'SPOTIFY_LINK', 'SPOTIFY_UNLINK',
        'SETTINGS_CHANGE', 'COMMAND_ERROR',
      ],
    },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// TTL index — auto-delete logs older than 30 days
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Log = mongoose.model<ILog>('Log', LogSchema);
