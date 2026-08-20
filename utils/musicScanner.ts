import { Song } from "@/types/types";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
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

    const batchSongs = await Promise.all(
      media.assets.map(async (asset) => {
        const artwork = await extractArtwork(asset.uri);
        return {
          id: asset.id,
          title: asset.filename.replace(/\.[^/.]+$/, ""), // Remove extension
          artist: "Artista desconocido",
          album: "Álbum desconocido",
          duration: asset.duration,
          artwork,
          audioUri: asset.uri,
        } as Song;
      }),
    );
    songs.push(...batchSongs);

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

    const songs = await Promise.all(
      result.assets.map(async (asset, index) => {
        const artwork = asset.uri ? await extractArtwork(asset.uri) : null;
        return {
          id: `picked_${Date.now()}_${index}`,
          title: asset.name?.replace(/\.[^/.]+$/, "") || `Canción ${index + 1}`,
          artist: "Artista desconocido",
          album: "Álbum desconocido",
          duration: 0, // Will be determined when playing
          artwork,
          audioUri: asset.uri,
        } as Song;
      }),
    );
    return songs;
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

// ============================================================================
// Embedded artwork extraction (ID3v2 / FLAC / MP4)
// ============================================================================

const B64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const MAX_ID3_TAG = 1024 * 1024; // 1MB
const MAX_PROBE = 8 * 1024; // 8KB
const MAX_FLAC = 512 * 1024; // 512KB
const MAX_MP4 = 4 * 1024 * 1024; // 4MB

function decodeBase64(input: string): Uint8Array {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, "").replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((clean.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (let i = 0; i < clean.length; i++) {
    const value = B64_CHARS.indexOf(clean[i]);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, index);
}

function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    result += B64_CHARS[(n >> 18) & 63];
    result += B64_CHARS[(n >> 12) & 63];
    result += i + 1 < bytes.length ? B64_CHARS[(n >> 6) & 63] : "=";
    result += i + 2 < bytes.length ? B64_CHARS[n & 63] : "=";
  }
  return result;
}

async function readBytes(
  uri: string,
  position: number,
  length: number,
): Promise<Uint8Array | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
      position,
      length,
    });
    return decodeBase64(base64);
  } catch {
    return null;
  }
}

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

function syncsafe(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 21) |
    (bytes[offset + 1] << 14) |
    (bytes[offset + 2] << 7) |
    bytes[offset + 3]
  );
}

function isAscii(bytes: Uint8Array, offset: number, str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (bytes[offset + i] !== str.charCodeAt(i)) return false;
  }
  return true;
}

function readLatin1(bytes: Uint8Array, start: number, end: number): string {
  let s = "";
  for (let i = start; i < end; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function detectMime(bytes: Uint8Array): string {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (isAscii(bytes, 0, "GIF")) return "image/gif";
  if (bytes.length >= 12 && isAscii(bytes, 0, "RIFF") && isAscii(bytes, 8, "WEBP"))
    return "image/webp";
  if (isAscii(bytes, 0, "BM")) return "image/bmp";
  return "image/jpeg";
}

// --- ID3v2 (MP3) ---

function parseId3Picture(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 10 || !isAscii(bytes, 0, "ID3")) return null;
  const version = bytes[3];
  const tagSize = syncsafe(bytes, 6);
  const end = Math.min(bytes.length, 10 + tagSize);
  let offset = 10;
  while (offset + 10 <= end) {
    const id = readLatin1(bytes, offset, offset + 4);
    if (id === "\u0000\u0000\u0000\u0000") break;
    const size =
      version === 4 ? syncsafe(bytes, offset + 4) : readUInt32BE(bytes, offset + 4);
    if (size <= 0) break;
    const dataStart = offset + 10;
    const dataEnd = Math.min(dataStart + size, end);
    if (id === "APIC" && dataEnd > dataStart + 8) {
      const pic = parseApic(bytes.subarray(dataStart, dataEnd));
      if (pic) return pic;
    }
    offset = dataStart + size;
  }
  return null;
}

function parseApic(data: Uint8Array): Uint8Array | null {
  if (data.length < 4) return null;
  const encoding = data[0];
  let p = 1;
  while (p < data.length && data[p] !== 0) p++;
  if (p >= data.length - 1) return null;
  p++; // MIME terminator
  p++; // picture type
  if (p >= data.length) return null;
  if (encoding === 1 || encoding === 2) {
    while (p + 1 < data.length && !(data[p] === 0 && data[p + 1] === 0)) p += 2;
    p = Math.min(p + 2, data.length);
  } else {
    while (p < data.length && data[p] !== 0) p++;
    p++;
  }
  if (p >= data.length) return null;
  return data.subarray(p);
}

// --- FLAC ---

function parseFlacPicture(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 4 || !isAscii(bytes, 0, "fLaC")) return null;
  let offset = 4;
  while (offset + 4 <= bytes.length) {
    const header = bytes[offset];
    const isLast = (header & 0x80) !== 0;
    const type = header & 0x7f;
    const len =
      (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 4;
    if (offset + len > bytes.length) break;
    if (type === 6) {
      const block = bytes.subarray(offset, offset + len);
      let p = 4; // picture type
      const mimeLen = readUInt32BE(block, p);
      p += 4 + mimeLen;
      const descLen = readUInt32BE(block, p);
      p += 4 + descLen;
      p += 16; // width(4) height(4) depth(4) colors(4)
      const dataLen = readUInt32BE(block, p);
      p += 4;
      if (p + dataLen <= block.length) return block.subarray(p, p + dataLen);
      return null;
    }
    offset += len;
    if (isLast) break;
  }
  return null;
}

// --- MP4 (m4a) ---

interface Atom {
  type: string;
  size: number;
  dataStart: number;
}

function readAtoms(bytes: Uint8Array, start: number, end: number): Atom[] {
  const atoms: Atom[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    const sizeRaw = readUInt32BE(bytes, offset);
    const type = readLatin1(bytes, offset + 4, offset + 8);
    let headerLen = 8;
    let size = sizeRaw;
    if (sizeRaw === 1) {
      if (offset + 16 > end) break;
      const high = readUInt32BE(bytes, offset + 8);
      const low = readUInt32BE(bytes, offset + 12);
      size = high * 0x100000000 + low;
      headerLen = 16;
    } else if (sizeRaw === 0) {
      size = end - offset;
    }
    if (size < headerLen) break;
    atoms.push({ type, size, dataStart: offset + headerLen });
    offset += size;
  }
  return atoms;
}

function findAtom(atoms: Atom[], type: string): Atom | undefined {
  return atoms.find((a) => a.type === type);
}

function parseMp4Picture(bytes: Uint8Array): Uint8Array | null {
  const top = readAtoms(bytes, 0, bytes.length);
  const moov = findAtom(top, "moov");
  if (!moov) return null;
  const moovChildren = readAtoms(bytes, moov.dataStart, moov.dataStart + moov.size);
  const udta = findAtom(moovChildren, "udta");
  if (!udta) return null;
  const udtaChildren = readAtoms(bytes, udta.dataStart, udta.dataStart + udta.size);
  const meta = findAtom(udtaChildren, "meta");
  if (!meta) return null;
  // "meta" is a fullbox: skip the 4-byte version/flags header
  const metaBodyStart = meta.dataStart + 4;
  const metaBodyEnd = meta.dataStart + meta.size;
  const metaChildren = readAtoms(bytes, metaBodyStart, metaBodyEnd);
  const ilst = findAtom(metaChildren, "ilst");
  if (!ilst) return null;
  const ilstChildren = readAtoms(bytes, ilst.dataStart, ilst.dataStart + ilst.size);
  const covr = findAtom(ilstChildren, "covr");
  if (!covr) return null;
  const covrChildren = readAtoms(bytes, covr.dataStart, covr.dataStart + covr.size);
  const data = findAtom(covrChildren, "data");
  if (!data) return null;
  // data payload: 4-byte type + 4-byte locale + image bytes
  const imageStart = data.dataStart + 8;
  if (data.dataStart + data.size <= imageStart) return null;
  return bytes.subarray(imageStart, data.dataStart + data.size);
}

function toDataUri(imageBytes: Uint8Array): string {
  const mime = detectMime(imageBytes);
  return `data:${mime};base64,${bytesToBase64(imageBytes)}`;
}

/**
 * Try to read the embedded cover art from an audio file and return it as a
 * `data:` URI. Returns null if the file has no readable artwork.
 */
export async function extractArtwork(uri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    const size = "size" in info ? info.size : undefined;
    if (!info.exists || !size || size <= 0) return null;

    // ID3v2 tag sits at the very start of MP3 files
    const header = await readBytes(uri, 0, 10);
    if (header && header.length >= 10 && isAscii(header, 0, "ID3")) {
      const tagSize = syncsafe(header, 6);
      const toRead = Math.min(10 + tagSize, size, MAX_ID3_TAG);
      const bytes = await readBytes(uri, 0, toRead);
      if (bytes) {
        const pic = parseId3Picture(bytes);
        if (pic) return toDataUri(pic);
      }
    }

    // Probe the start of the file to detect FLAC / MP4
    const probe = await readBytes(uri, 0, Math.min(MAX_PROBE, size));
    if (probe && probe.length > 4) {
      if (isAscii(probe, 0, "fLaC")) {
        const bytes = await readBytes(uri, 0, Math.min(MAX_FLAC, size));
        if (bytes) {
          const pic = parseFlacPicture(bytes);
          if (pic) return toDataUri(pic);
        }
      } else if (isAscii(probe, 4, "ftyp")) {
        const bytes = await readBytes(uri, 0, Math.min(MAX_MP4, size));
        if (bytes) {
          const pic = parseMp4Picture(bytes);
          if (pic) return toDataUri(pic);
        }
      }
    }
  } catch {
    // No readable artwork
  }
  return null;
}
