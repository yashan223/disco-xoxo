import mongoose, { Document } from 'mongoose';
export type LogAction = 'PLAY' | 'SKIP' | 'STOP' | 'PAUSE' | 'RESUME' | 'SHUFFLE' | 'LOOP' | 'VOLUME' | 'REMOVE' | 'CLEAR' | 'DISCONNECT' | 'LOGIN' | 'LOGOUT' | 'SPOTIFY_LINK' | 'SPOTIFY_UNLINK' | 'SETTINGS_CHANGE' | 'COMMAND_ERROR';
export interface ILog extends Document {
    guildId: string;
    userId: string;
    username?: string;
    action: LogAction;
    details?: Record<string, unknown>;
    timestamp: Date;
}
export declare const Log: mongoose.Model<ILog, {}, {}, {}, mongoose.Document<unknown, {}, ILog, {}, {}> & ILog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Log.model.d.ts.map