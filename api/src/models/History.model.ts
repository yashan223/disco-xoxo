import mongoose, { Document, Schema } from 'mongoose';

export interface IHistoryEntry {
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  requestedBy: string;
  playedAt: Date;
}

export interface IHistory extends Document {
  guildId: string;
  tracks: IHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const HistoryEntrySchema = new Schema<IHistoryEntry>(
  {
    spotifyId: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    albumArt: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    requestedBy: { type: String, required: true },
    playedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HistorySchema = new Schema<IHistory>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    tracks: {
      type: [HistoryEntrySchema],
      default: [],
      validate: {
        validator: (v: IHistoryEntry[]) => v.length <= 500,
        message: 'History cannot exceed 500 tracks',
      },
    },
  },
  { timestamps: true }
);

export const History = mongoose.model<IHistory>('History', HistorySchema);
