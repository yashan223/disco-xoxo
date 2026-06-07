import mongoose, { Document, Schema } from 'mongoose';

export interface IStatistics extends Document {
  guildId: string;
  songsPlayed: number;
  commandsUsed: number;
  totalPlaytimeMs: number;
  activePlayersToday: number;
  topTracks: Array<{ spotifyId: string; title: string; artist: string; count: number }>;
  topRequesters: Array<{ userId: string; username: string; count: number }>;
  dailyPlays: Array<{ date: string; count: number }>;
  updatedAt: Date;
}

const StatisticsSchema = new Schema<IStatistics>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    songsPlayed: { type: Number, default: 0 },
    commandsUsed: { type: Number, default: 0 },
    totalPlaytimeMs: { type: Number, default: 0 },
    activePlayersToday: { type: Number, default: 0 },
    topTracks: [
      {
        spotifyId: String,
        title: String,
        artist: String,
        count: { type: Number, default: 0 },
        _id: false,
      },
    ],
    topRequesters: [
      {
        userId: String,
        username: String,
        count: { type: Number, default: 0 },
        _id: false,
      },
    ],
    dailyPlays: [
      {
        date: String,   // 'YYYY-MM-DD'
        count: { type: Number, default: 0 },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

export const Statistics = mongoose.model<IStatistics>('Statistics', StatisticsSchema);
