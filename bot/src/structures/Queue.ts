import { Track } from './Track';
import { LoopMode, QueueState } from '../types/shared';

export class Queue {
  public readonly guildId: string;
  public tracks: Track[] = [];
  public history: Track[] = [];
  public currentIndex = -1;
  public loopMode: LoopMode = 'off';

  constructor(guildId: string) {
    this.guildId = guildId;
  }

  public get currentTrack(): Track | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length) {
      return this.tracks[this.currentIndex];
    }
    return null;
  }

  public get size(): number {
    return this.tracks.length;
  }

  public add(trackOrTracks: Track | Track[]): void {
    if (Array.isArray(trackOrTracks)) {
      this.tracks.push(...trackOrTracks);
    } else {
      this.tracks.push(trackOrTracks);
    }
  }

  public next(): Track | null {
    if (this.tracks.length === 0) return null;

    if (this.loopMode === 'track' && this.currentTrack) {
      return this.currentTrack;
    }

    if (this.loopMode === 'queue') {
      this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
      return this.currentTrack;
    }

    // LoopMode is 'off'
    if (this.currentIndex + 1 < this.tracks.length) {
      this.currentIndex++;
      return this.currentTrack;
    }

    return null;
  }

  public previous(): Track | null {
    if (this.tracks.length === 0) return null;

    if (this.currentIndex - 1 >= 0) {
      this.currentIndex--;
      return this.currentTrack;
    }

    return null;
  }

  public remove(queueId: string): boolean {
    const index = this.tracks.findIndex((t) => t.queueId === queueId);
    if (index === -1) return false;

    // If we're removing the current track, handle it
    if (index === this.currentIndex) {
      this.tracks.splice(index, 1);
      // Adjust index
      if (this.currentIndex >= this.tracks.length) {
        this.currentIndex = this.tracks.length - 1;
      }
    } else {
      this.tracks.splice(index, 1);
      if (index < this.currentIndex) {
        this.currentIndex--;
      }
    }
    return true;
  }

  public move(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.tracks.length ||
      toIndex < 0 ||
      toIndex >= this.tracks.length
    ) {
      return false;
    }

    const [movedTrack] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, movedTrack);

    // Adjust current index if it was affected
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    return true;
  }

  public shuffle(): void {
    if (this.tracks.length <= 1) return;

    const current = this.currentTrack;
    const itemsToShuffle = this.tracks.filter((_, idx) => idx !== this.currentIndex);

    // Fisher-Yates shuffle
    for (let i = itemsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemsToShuffle[i], itemsToShuffle[j]] = [itemsToShuffle[j], itemsToShuffle[i]];
    }

    if (current) {
      this.tracks = [current, ...itemsToShuffle];
      this.currentIndex = 0;
    } else {
      this.tracks = itemsToShuffle;
      this.currentIndex = -1;
    }
  }

  public clear(): void {
    this.tracks = [];
    this.history = [];
    this.currentIndex = -1;
  }

  public addToHistory(track: Track): void {
    this.history.unshift(track);
    if (this.history.length > 100) {
      this.history.pop();
    }
  }

  public toJSON(): QueueState {
    return {
      guildId: this.guildId,
      tracks: this.tracks.map((t) => t.toJSON()),
      history: this.history.map((t) => t.toJSON()),
      total: this.tracks.length,
      currentIndex: this.currentIndex,
    };
  }
}
