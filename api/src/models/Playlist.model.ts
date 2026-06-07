import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylistTrack {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  addedAt: Date;
}

export interface IPlaylist extends Document {
  ownerId: string;          // Discord user ID
  guildId?: string;         // if guild-specific
  playlistName: string;
  description?: string;
  spotifyPlaylistId?: string;
  tracks: IPlaylistTrack[];
  isPublic: boolean;
  coverArt?: string;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistTrackSchema = new Schema<IPlaylistTrack>(
  {
    spotifyId: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String, default: '' },
    albumArt: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PlaylistSchema = new Schema<IPlaylist>(
  {
    ownerId: { type: String, required: true, index: true },
    guildId: { type: String, index: true, sparse: true },
    playlistName: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    spotifyPlaylistId: { type: String },
    tracks: [PlaylistTrackSchema],
    isPublic: { type: Boolean, default: false },
    coverArt: { type: String },
    totalDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PlaylistSchema.index({ ownerId: 1 });
PlaylistSchema.index({ guildId: 1 });
PlaylistSchema.index({ isPublic: 1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
