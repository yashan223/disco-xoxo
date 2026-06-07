import { SpotifyTrack, QueueTrack } from '../types/shared';

export class Track implements QueueTrack {
  public readonly spotifyId: string;
  public readonly title: string;
  public readonly artist: string;
  public readonly artists: string[];
  public readonly album: string;
  public readonly albumArt: string;
  public readonly duration: number;
  public readonly uri: string;
  public readonly previewUrl?: string | null;
  public readonly explicit: boolean;
  public readonly popularity: number;
  public readonly queueId: string;
  public readonly requestedBy: string;
  public readonly addedAt: Date;

  constructor(data: SpotifyTrack, requestedBy: string) {
    this.spotifyId = data.spotifyId;
    this.title = data.title;
    this.artist = data.artist;
    this.artists = data.artists;
    this.album = data.album;
    this.albumArt = data.albumArt;
    this.duration = data.duration;
    this.uri = data.uri;
    this.previewUrl = data.previewUrl;
    this.explicit = data.explicit;
    this.popularity = data.popularity;
    this.queueId = `${data.spotifyId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.requestedBy = requestedBy;
    this.addedAt = new Date();
  }

  public toJSON(): QueueTrack {
    return {
      spotifyId: this.spotifyId,
      title: this.title,
      artist: this.artist,
      artists: this.artists,
      album: this.album,
      albumArt: this.albumArt,
      duration: this.duration,
      uri: this.uri,
      previewUrl: this.previewUrl,
      explicit: this.explicit,
      popularity: this.popularity,
      queueId: this.queueId,
      requestedBy: this.requestedBy,
      addedAt: this.addedAt,
    };
  }
}
