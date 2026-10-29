import { sampleSongs } from "@/data/songs";
import { Playlist, RepeatMode, Song } from "@/types/types";
import {
  migrateArtworkToFiles,
  pickAudioFiles,
  scanDeviceMusic,
} from "@/utils/musicScanner";
import {
  loadFavorites,
  loadLibraryCache,
  loadPlayCounts,
  loadPlaylists,
  loadRecents,
  loadSettings,
  saveFavorites,
  saveLibraryCache,
  savePlayCounts,
  savePlaylists,
  saveRecents,
  saveSettings,
} from "@/utils/storage";
import {
  AudioModule,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import type { AudioStatus } from "expo-audio";
import * as MediaLibrary from "expo-media-library/legacy";
import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MusicPlayerState {
  songs: Song[];
  isLoadingLibrary: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  volume: number;
  isMuted: boolean;
  isShuffleOn: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  favoriteIds: Set<string>;
  playlists: Playlist[];
  playCounts: Record<string, number>;
  sleepTimerRemaining: number | null;
  recentSongIds: string[];
  undoMessage: string | null;
}

interface MusicPlayerActions {
  loadDeviceMusic: () => Promise<void>;
  pickMusicFiles: () => Promise<void>;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  shufflePlay: (list: Song[]) => Promise<void>;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  createPlaylist: (name: string) => string;
  deletePlaylist: (playlistId: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylistSong: (
    playlistId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  playPlaylist: (playlist: Playlist) => Promise<void>;
  deleteSongFromDevice: (songId: string) => Promise<void>;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  undoLast: () => void;
  dismissUndo: () => void;
}

type MusicPlayerContextType = MusicPlayerState & MusicPlayerActions;

interface PlaybackStatus {
  position: number;
  duration: number;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);
const PlaybackStatusContext = createContext<PlaybackStatus | null>(null);

export function useMusicPlayer(): MusicPlayerContextType {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return context;
}

export function usePlaybackStatus(): PlaybackStatus {
  const status = useContext(PlaybackStatusContext);
  if (!status) {
    throw new Error(
      "usePlaybackStatus must be used within MusicPlayerProvider",
    );
  }
  return status;
}

function PlaybackStatusProvider({
  player,
  currentSong,
  onStatusChange,
  onDidJustFinish,
  children,
}: {
  player: ReturnType<typeof useAudioPlayer>;
  currentSong: Song | null;
  onStatusChange: (status: AudioStatus) => void;
  onDidJustFinish: () => void;
  children: React.ReactNode;
}) {
  const status = useAudioPlayerStatus(player);
  const handledRef = useRef(false);

  useEffect(() => {
    onStatusChange(status);
    if (status.didJustFinish) {
      if (!handledRef.current) {
        handledRef.current = true;
        onDidJustFinish();
      }
    } else {
      handledRef.current = false;
    }
  }, [status, onStatusChange, onDidJustFinish]);

  const position = status.currentTime ?? 0;
  const duration = currentSong ? (status.duration ?? currentSong.duration) : 0;

  return (
    <PlaybackStatusContext.Provider value={{ position, duration }}>
      {children}
    </PlaybackStatusContext.Provider>
  );
}

function MusicPlayerInner({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);

  // Core state
  const [songs, setSongs] = useState<Song[]>(sampleSongs);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [volume, setVolumeState] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.OFF);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(
    null,
  );
  const [recentSongIds, setRecentSongIds] = useState<string[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  // Refs
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  // Original (non-shuffled) order of the current playback context. Used to
  // restore a deterministic order when shuffle is toggled off.
  const baseQueueRef = useRef<Song[]>([]);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleOnRef = useRef(isShuffleOn);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Wall-clock deadline (ms) of the sleep timer. JS intervals are throttled
  // while the app is in the background, so the remaining time is always
  // derived from this instead of counting ticks.
  const sleepEndRef = useRef<number | null>(null);
  const statusRef = useRef<AudioStatus | null>(null);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const isPlayingRef = useRef(isPlaying);
  const currentSongRef = useRef<Song | null>(null);
  const rateRef = useRef(playbackRate);
  const lastSavedPositionRef = useRef(0);
  const undoHandlerRef = useRef<(() => void) | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockScreenActiveRef = useRef(false);
  const favoriteIdsRef = useRef(favoriteIds);
  favoriteIdsRef.current = favoriteIds;
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;
  repeatModeRef.current = repeatMode;
  isShuffleOnRef.current = isShuffleOn;
  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  isPlayingRef.current = isPlaying;
  currentSongRef.current = currentSong;
  rateRef.current = playbackRate;

  // === Persistence helpers ===
  const saveCurrentState = useCallback((position?: number) => {
    saveSettings({
      volume: volumeRef.current,
      lastSongId: currentSongRef.current?.id ?? null,
      lastPosition: position ?? statusRef.current?.currentTime ?? 0,
      playbackRate: rateRef.current,
    });
  }, []);

  const setPlayingState = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    setIsPlaying(playing);
  }, []);

  // === Lock screen / notification ===
  // Rebuilding the media session on every track change (via
  // setActiveForLockScreen) makes the notification lose its buttons, so
  // activate once and then only update the metadata for subsequent tracks.
  const updateLockScreen = useCallback(
    (song: Song) => {
      const metadata = {
        title: song.title,
        artist: song.artist,
        albumTitle: song.album || "MusicPlay",
        // Local file:// URI of the extracted cover; the native service loads it.
        artworkUrl: song.artwork ?? undefined,
        isFavorite: favoriteIdsRef.current.has(song.id),
      };
      if (!lockScreenActiveRef.current) {
        player.setActiveForLockScreen(true, metadata);
        lockScreenActiveRef.current = true;
      } else {
        player.updateLockScreenMetadata(metadata);
      }
    },
    [player],
  );

  // === Sleep timer ===
  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    sleepEndRef.current = null;
    setSleepTimerRemaining(null);
  }, []);

  // Recomputes the remaining time; pauses playback once the deadline passed.
  const checkSleepTimer = useCallback(() => {
    const end = sleepEndRef.current;
    if (end === null) return;
    const remaining = Math.ceil((end - Date.now()) / 1000);
    if (remaining > 0) {
      setSleepTimerRemaining(remaining);
      return;
    }
    clearSleepTimer();
    player.pause();
    setPlayingState(false);
    saveCurrentState();
  }, [player, clearSleepTimer, setPlayingState, saveCurrentState]);

  // === Undo ===
  const runWithUndo = useCallback((message: string, handler: () => void) => {
    undoHandlerRef.current = handler;
    setUndoMessage(message);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      undoHandlerRef.current = null;
      setUndoMessage(null);
    }, 4000);
  }, []);

  const undoLast = useCallback(() => {
    const handler = undoHandlerRef.current;
    undoHandlerRef.current = null;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoMessage(null);
    handler?.();
  }, []);

  const dismissUndo = useCallback(() => {
    undoHandlerRef.current = null;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoMessage(null);
  }, []);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        // Request notification permission for Android 13+
        if (Platform.OS === "android" && Platform.Version >= 33) {
          try {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );
          } catch (permErr) {
            console.warn("Failed to request notification permission:", permErr);
          }
        }

        await AudioModule.setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionModeAndroid: "duckOthers",
          shouldRouteThroughEarpiece: false,
        });

        const [
          savedPlaylists,
          savedFavorites,
          savedSettings,
          savedRecents,
          savedPlayCounts,
        ] = await Promise.all([
          loadPlaylists(),
          loadFavorites(),
          loadSettings(),
          loadRecents(),
          loadPlayCounts(),
        ]);
        setPlaylists(savedPlaylists);
        setFavoriteIds(new Set(savedFavorites));
        setVolumeState(savedSettings.volume);
        volumeRef.current = savedSettings.volume;
        setRecentSongIds(savedRecents);
        setPlayCounts(savedPlayCounts);
        if (savedSettings.playbackRate !== undefined) {
          setPlaybackRateState(savedSettings.playbackRate);
          rateRef.current = savedSettings.playbackRate;
        }

        // Show the cached library immediately so the app is usable right away.
        const cachedLibrary = await loadLibraryCache();
        let initialLibrary =
          cachedLibrary && cachedLibrary.length > 0 ? cachedLibrary : null;
        if (initialLibrary) setSongs(initialLibrary);

        // One-time migration: older versions stored artwork as embedded base64
        // data URIs in the cache, which makes every list decode megabytes of
        // images on mount. Convert them to real image files on the first
        // launch of this version, then persist the tiny file references.
        if (initialLibrary) {
          const migrated = await migrateArtworkToFiles(initialLibrary);
          if (migrated !== initialLibrary) {
            initialLibrary = migrated;
            setSongs(migrated);
            await saveLibraryCache(migrated);
          }
        }

        // Background refresh: re-scan the device reusing cached artwork, so
        // unchanged songs don't pay the expensive art-extraction cost.
        setIsLoadingLibrary(true);
        let deviceSongs: Song[] = [];
        try {
          deviceSongs = await scanDeviceMusic(initialLibrary ?? undefined);
          if (deviceSongs.length > 0) {
            setSongs(deviceSongs);
            await saveLibraryCache(deviceSongs);
          }
        } catch (scanErr) {
          console.warn("Failed to auto-scan device music:", scanErr);
        } finally {
          setIsLoadingLibrary(false);
        }

        // Restore last played song (paused, at its saved position)
        const lastId = savedSettings.lastSongId;
        if (lastId) {
          const library =
            deviceSongs.length > 0 ? deviceSongs : initialLibrary ?? sampleSongs;
          const restored =
            library.find((s) => s.id === lastId) ??
            songs.find((s) => s.id === lastId);
          if (restored?.audioUri) {
            try {
              player.replace({ uri: restored.audioUri });
              player.setPlaybackRate(rateRef.current);
              player.volume = savedSettings.volume;
              const lastPosition = savedSettings.lastPosition ?? 0;
              if (lastPosition > 0) player.seekTo(lastPosition);
              lastSavedPositionRef.current = lastPosition;
              currentSongRef.current = restored;
              setCurrentSong(restored);
              // Without this, resuming the restored song shows no
              // notification controls until the next track change.
              updateLockScreen(restored);
              setQueue([restored]);
              setQueueIndex(0);
              setPlayingState(false);
            } catch (e) {
              console.warn("Failed to restore last song:", e);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load saved data:", e);
      }
    })();
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // Periodically persist playback position while playing
  useEffect(() => {
    const interval = setInterval(() => {
      const pos = statusRef.current?.currentTime ?? 0;
      if (
        isPlayingRef.current &&
        Math.abs(pos - lastSavedPositionRef.current) >= 5
      ) {
        lastSavedPositionRef.current = pos;
        saveCurrentState(pos);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [saveCurrentState]);

  // === Library ===
  const loadDeviceMusic = useCallback(async () => {
    setIsLoadingLibrary(true);
    try {
      const deviceSongs = await scanDeviceMusic(songs);
      if (deviceSongs.length > 0) {
        setSongs(deviceSongs);
        await saveLibraryCache(deviceSongs);
      }
    } catch (e) {
      console.warn("Failed to scan device music:", e);
      Alert.alert("Error", "No se pudo escanear la música del dispositivo.");
    } finally {
      setIsLoadingLibrary(false);
    }
  }, [songs]);

  const pickMusicFiles = useCallback(async () => {
    try {
      const pickedSongs = await pickAudioFiles();
      if (pickedSongs.length > 0) {
        setSongs((prev) => {
          const realSongs = prev.filter((s) => s.audioUri);
          return [...realSongs, ...pickedSongs];
        });
      }
    } catch (e) {
      console.warn("Failed to pick audio files:", e);
      Alert.alert("Error", "No se pudieron importar los archivos seleccionados.");
    }
  }, []);

  // === Recents & play counts ===
  const addToRecents = useCallback((songId: string) => {
    setRecentSongIds((prev) => {
      const filtered = prev.filter((id) => id !== songId);
      const updated = [songId, ...filtered].slice(0, 50);
      saveRecents(updated);
      return updated;
    });
    setPlayCounts((prev) => {
      const next = { ...prev, [songId]: (prev[songId] || 0) + 1 };
      savePlayCounts(next);
      return next;
    });
  }, []);

  // === Playback ===
  const loadAndPlay = useCallback(
    async (song: Song) => {
      try {
        currentSongRef.current = song;
        setCurrentSong(song);
        addToRecents(song.id);
        lastSavedPositionRef.current = 0;
        saveCurrentState(0);

        if (!song.audioUri) {
          setPlayingState(false);
          return;
        }

        player.replace({ uri: song.audioUri });

        updateLockScreen(song);
        player.volume = isMutedRef.current ? 0 : volumeRef.current;
        player.setPlaybackRate(rateRef.current);
        player.play();
        setPlayingState(true);
      } catch (e) {
        console.warn("Failed to load song:", e);
        setPlayingState(false);
      }
    },
    [player, addToRecents, saveCurrentState, setPlayingState, updateLockScreen],
  );

  // Sync isPlaying with the real player state (covers OS interruptions:
  // calls, other apps taking audio focus, etc.)
  const onStatusChange = useCallback(
    (next: AudioStatus) => {
      statusRef.current = next;
      // Native status updates keep arriving in the background while playing,
      // so they also drive the sleep timer when JS intervals are throttled.
      checkSleepTimer();
      if (isPlayingRef.current !== next.playing) {
        isPlayingRef.current = next.playing;
        setIsPlaying(next.playing);
      }
    },
    [checkSleepTimer],
  );

  // Advance one step through the queue. With shuffle on, the queue is
  // already a shuffled order (every song plays once); at the end it only
  // restarts if repeat ALL is enabled, otherwise playback stops.
  const advanceSong = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const currentIndex = queueIndexRef.current;
    const shuffleOn = isShuffleOnRef.current;
    const repeat = repeatModeRef.current;

    if (currentIndex >= q.length - 1) {
      if (repeat === RepeatMode.ALL) {
        const nextOrder = shuffleOn ? shuffleArray(q) : q;
        queueRef.current = nextOrder;
        queueIndexRef.current = 0;
        setQueue(nextOrder);
        setQueueIndex(0);
        await loadAndPlay(nextOrder[0]);
      } else {
        setPlayingState(false);
        saveCurrentState();
      }
    } else {
      queueIndexRef.current = currentIndex + 1;
      setQueueIndex(currentIndex + 1);
      await loadAndPlay(q[currentIndex + 1]);
    }
  }, [loadAndPlay, setPlayingState, saveCurrentState]);

  // Handle song completion
  const onDidJustFinish = useCallback(() => {
    if (repeatModeRef.current === RepeatMode.ONE) {
      player.seekTo(0);
      player.play();
      setPlayingState(true);
      return;
    }
    advanceSong();
  }, [player, setPlayingState, advanceSong]);

  const playSong = useCallback(
    async (song: Song, newQueue?: Song[]) => {
      const songQueue = newQueue || songs;
      baseQueueRef.current = songQueue;
      const index = songQueue.findIndex((s) => s.id === song.id);
      if (isShuffleOnRef.current && songQueue.length > 1) {
        // Shuffle: the tapped song plays first, the rest in a shuffled
        // order where every song plays exactly once.
        const remaining = songQueue.filter((_, i) => i !== index);
        const order = [song, ...shuffleArray(remaining)];
        queueRef.current = order;
        queueIndexRef.current = 0;
        setQueue(order);
        setQueueIndex(0);
      } else {
        queueRef.current = songQueue;
        queueIndexRef.current = index >= 0 ? index : 0;
        setQueue(songQueue);
        setQueueIndex(index >= 0 ? index : 0);
      }
      await loadAndPlay(song);
    },
    [songs, loadAndPlay],
  );

  const shufflePlay = useCallback(
    async (list: Song[]) => {
      if (list.length === 0) return;
      baseQueueRef.current = list;
      if (!isShuffleOnRef.current) {
        isShuffleOnRef.current = true;
        setIsShuffleOn(true);
      }
      const first = list[Math.floor(Math.random() * list.length)];
      const remaining = list.filter((s) => s.id !== first.id);
      const order = [first, ...shuffleArray(remaining)];
      queueRef.current = order;
      queueIndexRef.current = 0;
      setQueue(order);
      setQueueIndex(0);
      await loadAndPlay(first);
    },
    [loadAndPlay],
  );

  const playNext = useCallback((song: Song) => {
    setQueue((prev) => {
      const next = [...prev];
      next.splice(queueIndexRef.current + 1, 0, song);
      return next;
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!currentSongRef.current) return;
    if (isPlayingRef.current) {
      player.pause();
      setPlayingState(false);
      saveCurrentState();
    } else {
      player.play();
      setPlayingState(true);
    }
  }, [player, setPlayingState, saveCurrentState]);

  const pause = useCallback(() => {
    if (isPlayingRef.current) {
      player.pause();
      setPlayingState(false);
      saveCurrentState();
    }
  }, [player, setPlayingState, saveCurrentState]);

  const resume = useCallback(() => {
    if (!isPlayingRef.current && currentSongRef.current) {
      player.play();
      setPlayingState(true);
    }
  }, [player, setPlayingState]);

  const seekTo = useCallback(
    (seconds: number) => {
      player.seekTo(seconds);
      lastSavedPositionRef.current = seconds;
      saveCurrentState(seconds);
    },
    [player, saveCurrentState],
  );

  const next = useCallback(async () => {
    await advanceSong();
  }, [advanceSong]);

  const previous = useCallback(async () => {
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) return;
    if ((statusRef.current?.currentTime ?? 0) > 3) {
      seekTo(0);
      return;
    }
    const currentIdx = queueIndexRef.current;
    const prevIdx = currentIdx === 0 ? currentQueue.length - 1 : currentIdx - 1;
    queueIndexRef.current = prevIdx;
    setQueueIndex(prevIdx);
    await loadAndPlay(currentQueue[prevIdx]);
  }, [loadAndPlay, seekTo]);

  // Forward Android lock-screen / notification track commands to the app.
  // Emitted natively by expo-audio's playback service via "lockScreenCommand".
  // (also "favorite", from the heart button added by the same patch)
  const nextRef = useRef(next);
  const previousRef = useRef(previous);
  nextRef.current = next;
  previousRef.current = previous;

  useEffect(() => {
    const playerWithLockScreenEvents = player as unknown as {
      addListener: (
        eventName: string,
        listener: (command: string) => void,
      ) => { remove: () => void };
    };
    const subscription = playerWithLockScreenEvents.addListener(
      "lockScreenCommand",
      (command) => {
        if (command === "next") {
          nextRef.current();
        } else if (command === "previous") {
          previousRef.current();
        } else if (command === "favorite" && currentSongRef.current) {
          toggleFavoriteRef.current(currentSongRef.current.id);
        }
      },
    );
    return () => subscription.remove();
  }, [player]);

  const removeFromQueue = useCallback(
    (index: number) => {
      const prev = queueRef.current;
      if (index < 0 || index >= prev.length) return;
      const currentIdx = queueIndexRef.current;
      const next = prev.filter((_, i) => i !== index);

      if (next.length === 0) {
        player.pause();
        setPlayingState(false);
        currentSongRef.current = null;
        setCurrentSong(null);
        setQueueIndex(0);
        setQueue([]);
        return;
      }
      if (index === currentIdx) {
        const newIndex = Math.min(index, next.length - 1);
        setQueueIndex(newIndex);
        setQueue(next);
        loadAndPlay(next[newIndex]);
        return;
      }
      if (index < currentIdx) {
        setQueueIndex(currentIdx - 1);
      }
      setQueue(next);
    },
    [player, setPlayingState, loadAndPlay],
  );

  const clearQueue = useCallback(() => {
    const current = currentSongRef.current;
    if (!current) {
      setQueue([]);
      setQueueIndex(0);
      return;
    }
    setQueue([current]);
    setQueueIndex(0);
  }, []);

  // === Volume ===
  const setVolume = useCallback(
    (vol: number) => {
      volumeRef.current = vol;
      setVolumeState(vol);
      isMutedRef.current = false;
      setIsMuted(false);
      player.volume = vol;
      saveCurrentState();
    },
    [player, saveCurrentState],
  );

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMuted(newMuted);
    player.volume = newMuted ? 0 : volumeRef.current;
  }, [player]);

  // === Modes ===
  const toggleShuffle = useCallback(() => {
    const nextValue = !isShuffleOnRef.current;
    isShuffleOnRef.current = nextValue;
    setIsShuffleOn(nextValue);

    const current = currentSongRef.current;
    if (!current || queueRef.current.length === 0) return;

    if (nextValue) {
      // ON: keep the current song first and shuffle only what hasn't played
      // yet, so every song still plays exactly once.
      const upcoming = queueRef.current.slice(queueIndexRef.current + 1);
      setQueue([current, ...shuffleArray(upcoming)]);
      setQueueIndex(0);
    } else {
      // OFF: restore the deterministic (original) order for the songs that
      // remain, keeping what already played in place and matching the current.
      const played = queueRef.current.slice(0, queueIndexRef.current);
      const upcoming = queueRef.current.slice(queueIndexRef.current + 1);
      const upcomingIds = new Set(upcoming.map((s) => s.id));
      const orderedUpcoming = baseQueueRef.current.filter((s) =>
        upcomingIds.has(s.id),
      );
      setQueue([...played, current, ...orderedUpcoming]);
      setQueueIndex(played.length);
    }
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      switch (prev) {
        case RepeatMode.OFF:
          return RepeatMode.ALL;
        case RepeatMode.ALL:
          return RepeatMode.ONE;
        case RepeatMode.ONE:
          return RepeatMode.OFF;
      }
    });
  }, []);

  const setPlaybackRate = useCallback(
    (rate: number) => {
      rateRef.current = rate;
      setPlaybackRateState(rate);
      player.setPlaybackRate(rate);
      saveCurrentState();
    },
    [player, saveCurrentState],
  );

  // === Favorites ===
  const toggleFavorite = useCallback(
    (songId: string) => {
      const wasFavorite = favoriteIds.has(songId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(songId)) next.delete(songId);
        else next.add(songId);
        saveFavorites(Array.from(next));
        return next;
      });
      if (wasFavorite) {
        runWithUndo("Eliminado de favoritos", () => {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.add(songId);
            saveFavorites(Array.from(next));
            return next;
          });
        });
      }
    },
    [favoriteIds, runWithUndo],
  );

  const toggleFavoriteRef = useRef(toggleFavorite);
  toggleFavoriteRef.current = toggleFavorite;

  // Keep the notification's heart icon in sync, whichever screen changed it.
  useEffect(() => {
    if (lockScreenActiveRef.current && currentSongRef.current) {
      updateLockScreen(currentSongRef.current);
    }
  }, [favoriteIds, updateLockScreen]);

  const isFavorite = useCallback(
    (songId: string) => favoriteIds.has(songId),
    [favoriteIds],
  );

  // === Playlists ===
  const createPlaylist = useCallback((name: string): string => {
    const id = Date.now().toString();
    setPlaylists((prev) => {
      const newPlaylist: Playlist = {
        id,
        name,
        songIds: [],
        createdAt: Date.now(),
      };
      const updated = [...prev, newPlaylist];
      savePlaylists(updated);
      return updated;
    });
    return id;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== playlistId);
      savePlaylists(updated);
      return updated;
    });
  }, []);

  const addSongToPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId && !p.songIds.includes(songId)) {
          return { ...p, songIds: [...p.songIds, songId] };
        }
        return p;
      });
      savePlaylists(updated);
      return updated;
    });
  }, []);

  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId)
            return { ...p, songIds: p.songIds.filter((id) => id !== songId) };
          return p;
        });
        savePlaylists(updated);
        return updated;
      });
      runWithUndo("Canción quitada de la playlist", () => {
        setPlaylists((prev) => {
          const updated = prev.map((p) => {
            if (p.id === playlistId && !p.songIds.includes(songId)) {
              return { ...p, songIds: [...p.songIds, songId] };
            }
            return p;
          });
          savePlaylists(updated);
          return updated;
        });
      });
    },
    [runWithUndo],
  );

  const reorderPlaylistSong = useCallback(
    (playlistId: string, fromIndex: number, toIndex: number) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== playlistId) return p;
          const newSongIds = [...p.songIds];
          const [moved] = newSongIds.splice(fromIndex, 1);
          newSongIds.splice(toIndex, 0, moved);
          return { ...p, songIds: newSongIds };
        });
        savePlaylists(updated);
        return updated;
      });
    },
    [],
  );

  const playPlaylist = useCallback(
    async (playlist: Playlist) => {
      const playlistSongs = playlist.songIds
        .map((id) => songs.find((s) => s.id === id))
        .filter((s): s is Song => s !== undefined);
      if (playlistSongs.length > 0)
        await playSong(playlistSongs[0], playlistSongs);
    },
    [songs, playSong],
  );

  const deleteSongFromDevice = useCallback(
    async (songId: string) => {
      const song = songs.find((s) => s.id === songId);
      if (!song) return;
      try {
        // Stop playback if this song is playing
        if (currentSongRef.current?.id === songId) {
          player.pause();
          setPlayingState(false);
          currentSongRef.current = null;
          setCurrentSong(null);
        }
        // Only MediaLibrary assets can be deleted from the device.
        // Songs picked manually live in the app cache and are only removed from the library.
        if (!song.id.startsWith("picked_")) {
          try {
            await MediaLibrary.deleteAssetsAsync([songId]);
          } catch (deleteErr) {
            console.warn(
              "MediaLibrary delete failed, removing from app only:",
              deleteErr,
            );
          }
        }
        // Remove from songs list
        setSongs((prev) => {
          const remaining = prev.filter((s) => s.id !== songId);
          saveLibraryCache(remaining);
          return remaining;
        });
        // Remove the song's artwork file (if it was persisted to disk)
        if (song.artwork && song.artwork.startsWith(FileSystem.documentDirectory ?? "")) {
          try {
            await FileSystem.deleteAsync(song.artwork, { idempotent: true });
          } catch (deleteArtErr) {
            console.warn("Failed to delete artwork file:", deleteArtErr);
          }
        }
        // Remove from all playlists
        setPlaylists((prev) => {
          const updated = prev.map((p) => ({
            ...p,
            songIds: p.songIds.filter((id) => id !== songId),
          }));
          savePlaylists(updated);
          return updated;
        });
        // Remove from favorites
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(songId);
          saveFavorites(Array.from(next));
          return next;
        });
        // Remove from recents and play counts
        setRecentSongIds((prev) => {
          const updated = prev.filter((id) => id !== songId);
          saveRecents(updated);
          return updated;
        });
        setPlayCounts((prev) => {
          const next = { ...prev };
          delete next[songId];
          savePlayCounts(next);
          return next;
        });
      } catch (e) {
        console.warn("Failed to delete song:", e);
        Alert.alert("Error", "No se pudo eliminar la canción.");
      }
    },
    [songs, player, setPlayingState],
  );

  // === Sleep Timer ===
  const setSleepTimer = useCallback(
    (minutes: number) => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      sleepEndRef.current = Date.now() + minutes * 60 * 1000;
      setSleepTimerRemaining(minutes * 60);
      sleepTimerRef.current = setInterval(checkSleepTimer, 1000);
    },
    [checkSleepTimer],
  );

  const cancelSleepTimer = clearSleepTimer;

  const value = useMemo<MusicPlayerContextType>(
    () => ({
      songs,
      isLoadingLibrary,
      currentSong,
      isPlaying,
      queue,
      queueIndex,
      volume,
      isMuted,
      isShuffleOn,
      repeatMode,
      playbackRate,
      favoriteIds,
      playlists,
      playCounts,
      sleepTimerRemaining,
      recentSongIds,
      undoMessage,
      loadDeviceMusic,
      pickMusicFiles,
      playSong,
      shufflePlay,
      togglePlayPause,
      pause,
      resume,
      next,
      previous,
      seekTo,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeatMode,
      setPlaybackRate,
      playNext,
      removeFromQueue,
      clearQueue,
      toggleFavorite,
      isFavorite,
      createPlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      reorderPlaylistSong,
      playPlaylist,
      deleteSongFromDevice,
      setSleepTimer,
      cancelSleepTimer,
      undoLast,
      dismissUndo,
    }),
    [
      songs,
      isLoadingLibrary,
      currentSong,
      isPlaying,
      queue,
      queueIndex,
      volume,
      isMuted,
      isShuffleOn,
      repeatMode,
      playbackRate,
      favoriteIds,
      playlists,
      playCounts,
      sleepTimerRemaining,
      recentSongIds,
      undoMessage,
      loadDeviceMusic,
      pickMusicFiles,
      playSong,
      shufflePlay,
      togglePlayPause,
      pause,
      resume,
      next,
      previous,
      seekTo,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeatMode,
      setPlaybackRate,
      playNext,
      removeFromQueue,
      clearQueue,
      toggleFavorite,
      isFavorite,
      createPlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      reorderPlaylistSong,
      playPlaylist,
      deleteSongFromDevice,
      setSleepTimer,
      cancelSleepTimer,
      undoLast,
      dismissUndo,
    ],
  );


  return (
    <MusicPlayerContext.Provider value={value}>
      <PlaybackStatusProvider
        player={player}
        currentSong={currentSong}
        onStatusChange={onStatusChange}
        onDidJustFinish={onDidJustFinish}
      >
        {children}
      </PlaybackStatusProvider>
    </MusicPlayerContext.Provider>
  );
}

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MusicPlayerInner>{children}</MusicPlayerInner>;
}
