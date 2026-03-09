import { Song } from "@/types/types";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";

/**
 * Request permission to access the device's media library
 */
export async function requestMusicPermission(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.warn("Permission request failed:", e);
    return false;
  }
}

/**
 * Scan the device for audio files and return them as Song objects.
 * Fetches in batches to handle large libraries.
 */
export async function scanDeviceMusic(): Promise<Song[]> {
  const hasPermission = await requestMusicPermission();
  if (!hasPermission) {
    console.warn("Media library permission not granted");
    return [];
  }

  const songs: Song[] = [];
  let hasNextPage = true;
  let endCursor: string | undefined;

  while (hasNextPage) {
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 100,
      after: endCursor,
      sortBy: [MediaLibrary.SortBy.default],
    });

    for (const asset of media.assets) {
      songs.push({
        id: asset.id,
        title: asset.filename.replace(/\.[^/.]+$/, ""), // Remove extension
        artist: "Artista desconocido",
        album: "Álbum desconocido",
        duration: asset.duration,
        artwork: null,
        audioUri: asset.uri,
      });
    }

    hasNextPage = media.hasNextPage;
    endCursor = media.endCursor;
  }

  return songs;
}

/**
 * Let user manually pick audio files using document picker.
 * Works in Expo Go where MediaLibrary has limited access.
 */
export async function pickAudioFiles(): Promise<Song[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return [];
    }

    return result.assets.map((asset, index) => ({
      id: `picked_${Date.now()}_${index}`,
      title: asset.name?.replace(/\.[^/.]+$/, "") || `Canción ${index + 1}`,
      artist: "Artista desconocido",
      album: "Álbum desconocido",
      duration: 0, // Will be determined when playing
      artwork: null,
      audioUri: asset.uri,
    }));
  } catch (e) {
    console.warn("Document picker failed:", e);
    return [];
  }
}

/**
 * Format seconds into MM:SS string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
