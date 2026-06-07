import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  discordId: string;
  spotifyId?: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiry?: Date;
  spotifyDisplayName?: string;
  favorites: string[];           // Spotify track IDs
  savedPlaylists: string[];      // local Playlist document IDs
  isPremium: boolean;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    spotifyId: { type: String, index: true, sparse: true },
    username: { type: String, required: true },
    discriminator: { type: String, default: '0' },
    avatar: { type: String },
    email: { type: String },
    spotifyAccessToken: { type: String },
    spotifyRefreshToken: { type: String },
    spotifyTokenExpiry: { type: Date },
    spotifyDisplayName: { type: String },
    favorites: [{ type: String }],
    savedPlaylists: [{ type: Schema.Types.ObjectId, ref: 'Playlist' }],
    isPremium: { type: Boolean, default: false },
    locale: { type: String, default: 'en-US' },
  },
  { timestamps: true }
);

UserSchema.index({ discordId: 1 });
UserSchema.index({ spotifyId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
