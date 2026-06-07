import mongoose, { Document } from 'mongoose';
export interface IStatistics extends Document {
    guildId: string;
    songsPlayed: number;
    commandsUsed: number;
    totalPlaytimeMs: number;
    activePlayersToday: number;
    topTracks: Array<{
        spotifyId: string;
        title: string;
        artist: string;
        count: number;
    }>;
    topRequesters: Array<{
        userId: string;
        username: string;
        count: number;
    }>;
    dailyPlays: Array<{
        date: string;
        count: number;
    }>;
    updatedAt: Date;
}
export declare const Statistics: mongoose.Model<IStatistics, {}, {}, {}, mongoose.Document<unknown, {}, IStatistics, {}, {}> & IStatistics & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Statistics.model.d.ts.map