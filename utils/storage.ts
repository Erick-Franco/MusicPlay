import { Playlist } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PLAYLISTS: "@musicplay/playlists",
  FAVORITES: "@musicplay/favorites",
  SETTINGS: "@musicplay/settings",
  RECENTS: "@musicplay/recents",
};

interface Settings {
  volume: number;
  lastSongId: string | null;
  equalizerPreset?: string;
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
    : { volume: 1.0, lastSongId: null, equalizerPreset: "Normal" };
}

// Recents
export async function saveRecents(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.RECENTS, JSON.stringify(ids));
}

export async function loadRecents(): Promise<string[]> {
  const data = await AsyncStorage.getItem(KEYS.RECENTS);
  return data ? JSON.parse(data) : [];
}
