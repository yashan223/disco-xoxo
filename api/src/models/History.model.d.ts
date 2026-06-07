import mongoose, { Document } from 'mongoose';
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
export declare const History: mongoose.Model<IHistory, {}, {}, {}, mongoose.Document<unknown, {}, IHistory, {}, {}> & IHistory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=History.model.d.ts.map