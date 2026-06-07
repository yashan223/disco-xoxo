import mongoose, { Document } from 'mongoose';
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
    favorites: string[];
    savedPlaylists: string[];
    isPremium: boolean;
    locale: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.model.d.ts.map