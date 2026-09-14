import { Playlist, Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const KEYS = {
  PLAYLISTS: "@musicplay/playlists",
  FAVORITES: "@musicplay/favorites",
  SETTINGS: "@musicplay/settings",
  RECENTS: "@musicplay/recents",
  PLAY_COUNTS: "@musicplay/play-counts",
};

interface Settings {
  volume: number;
  lastSongId: string | null;
  lastPosition?: number;
  playbackRate?: number;
}

// Playlists
export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
}

export async function loadPlaylists(): Promise<Playlist[]> {
  const data = await AsyncStorage.getItem(KEYS.PLAYLISTS);
  return data ? JSON.parse(data) : [];
}

// Favorites
export async function saveFavorites(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(ids));
}

export async function loadFavorites(): Promise<string[]> {
  const data = await AsyncStorage.getItem(KEYS.FAVORITES);
  return data ? JSON.parse(data) : [];
}

// Settings
export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function loadSettings(): Promise<Settings> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  return data
    ? JSON.parse(data)
    : { volume: 1.0, lastSongId: null, lastPosition: 0, playbackRate: 1 };
}

// Play counts
export async function savePlayCounts(
  counts: Record<string, number>,
): Promise<void> {
  await AsyncStorage.setItem(KEYS.PLAY_COUNTS, JSON.stringify(counts));
}

export async function loadPlayCounts(): Promise<Record<string, number>> {
  const data = await AsyncStorage.getItem(KEYS.PLAY_COUNTS);
  return data ? JSON.parse(data) : {};
}

// Recents
export async function saveRecents(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.RECENTS, JSON.stringify(ids));
}

export async function loadRecents(): Promise<string[]> {
  const data = await AsyncStorage.getItem(KEYS.RECENTS);
  return data ? JSON.parse(data) : [];
}

// Library cache
// The scanned device library (including embedded artwork) is stored as a file
// (not AsyncStorage, which has a small size limit) so the app opens fast
// without re-reading every audio file on each launch.
const LIBRARY_CACHE_FILE = `${
  FileSystem.documentDirectory ?? ""
}library-cache.json`;

export async function saveLibraryCache(songs: Song[]): Promise<void> {
  try {
    const toCache = songs.filter((s) => !s.id.startsWith("picked_"));
    await FileSystem.writeAsStringAsync(
      LIBRARY_CACHE_FILE,
      JSON.stringify(toCache),
    );
  } catch (e) {
    console.warn("Failed to save library cache:", e);
  }
}

export async function loadLibraryCache(): Promise<Song[] | null> {
  try {
    const data = await FileSystem.readAsStringAsync(LIBRARY_CACHE_FILE);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as Song[]) : null;
  } catch {
    return null;
  }
}
