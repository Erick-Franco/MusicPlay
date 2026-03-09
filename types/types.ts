export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artwork: string | null;
  audioUri: string | null;
  genre?: string;
  year?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
}

export enum RepeatMode {
  OFF = "OFF",
  ONE = "ONE",
  ALL = "ALL",
}

export enum SortBy {
  TITLE = "TITLE",
  ARTIST = "ARTIST",
  ALBUM = "ALBUM",
}
