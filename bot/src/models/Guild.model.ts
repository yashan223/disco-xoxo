import mongoose, { Document, Schema } from 'mongoose';
import { LoopMode } from '../types/shared';

export interface IGuildSettings {
  guildId: string;
  defaultVolume: number;
  djRoles: string[];
  musicChannel?: string;
  autoplay: boolean;
  loopMode: LoopMode;
  locale: string;
  maxQueueSize: number;
  allowDuplicates: boolean;
  announce: boolean;
}

export interface IGuild extends Document {
  guildId: string;
  name: string;
  icon?: string;
  ownerId: string;
  settings: IGuildSettings;
  createdAt: Date;
  updatedAt: Date;
}

const GuildSettingsSchema = new Schema<IGuildSettings>(
  {
    guildId: { type: String, required: true },
    defaultVolume: { type: Number, default: 80, min: 0, max: 100 },
    djRoles: [{ type: String }],
    musicChannel: { type: String },
    autoplay: { type: Boolean, default: false },
    loopMode: { type: String, enum: ['off', 'track', 'queue'], default: 'off' },
    locale: { type: String, default: 'en-US' },
    maxQueueSize: { type: Number, default: 1000 },
    allowDuplicates: { type: Boolean, default: true },
    announce: { type: Boolean, default: true },
  },
  { _id: false }
);

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    icon: { type: String },
    ownerId: { type: String, required: true },
    settings: { type: GuildSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Guild = mongoose.model<IGuild>('Guild', GuildSchema);
