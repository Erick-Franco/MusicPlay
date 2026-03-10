import { sampleSongs } from "@/data/songs";
import { Playlist, RepeatMode, Song } from "@/types/types";
import { pickAudioFiles, scanDeviceMusic } from "@/utils/musicScanner";
import {
  loadFavorites,
  loadPlaylists,
  loadRecents,
  loadSettings,
  saveFavorites,
  savePlaylists,
  saveRecents,
  saveSettings,
} from "@/utils/storage";
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as MediaLibrary from "expo-media-library";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PermissionsAndroid, Platform } from "react-native";

interface MusicPlayerState {
  songs: Song[];
  isLoadingLibrary: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Song[];
  queueIndex: number;
  volume: number;
  isMuted: boolean;
  isShuffleOn: boolean;
  repeatMode: RepeatMode;
  favoriteIds: Set<string>;
  playlists: Playlist[];
  // New features
  sleepTimerRemaining: number | null;
  equalizerPreset: string;
  recentSongIds: string[];
}

interface MusicPlayerActions {
  loadDeviceMusic: () => Promise<void>;
  pickMusicFiles: () => Promise<void>;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
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
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  createPlaylist: (name: string) => void;
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
  // New features
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  setEqualizerPreset: (preset: string) => void;
}

type MusicPlayerContextType = MusicPlayerState & MusicPlayerActions;

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function useMusicPlayer(): MusicPlayerContextType {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return context;
}

function MusicPlayerInner({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // New feature state
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(
    null,
  );
  const [equalizerPreset, setEqualizerPresetState] = useState("Normal");
  const [recentSongIds, setRecentSongIds] = useState<string[]>([]);

  // Refs
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleOnRef = useRef(isShuffleOn);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;
  repeatModeRef.current = repeatMode;
  isShuffleOnRef.current = isShuffleOn;

  // Derived
  const position = status.currentTime ?? 0;
  const duration = currentSong ? (status.duration ?? currentSong.duration) : 0;

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
          interruptionModeAndroid: "pauseOthers",
          shouldRouteThroughEarpiece: false,
        });

        const [savedPlaylists, savedFavorites, savedSettings, savedRecents] =
          await Promise.all([
            loadPlaylists(),
            loadFavorites(),
            loadSettings(),
            loadRecents(),
          ]);
        setPlaylists(savedPlaylists);
        setFavoriteIds(new Set(savedFavorites));
        setVolumeState(savedSettings.volume);
        if (savedSettings.equalizerPreset)
          setEqualizerPresetState(savedSettings.equalizerPreset);
        setRecentSongIds(savedRecents);

        // Auto-scan device music
        setIsLoadingLibrary(true);
        try {
          const deviceSongs = await scanDeviceMusic();
          if (deviceSongs.length > 0) setSongs(deviceSongs);
        } catch (scanErr) {
          console.warn("Failed to auto-scan device music:", scanErr);
        } finally {
          setIsLoadingLibrary(false);
        }
      } catch (e) {
        console.warn("Failed to load saved data:", e);
      }
    })();
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, []);

  // Set up remote control listeners (Note: Next/Prev are not natively supported by expo-audio)
  useEffect(() => {
    // We keep play/pause listeners just in case expo-audio adds support later,
    // though expo-audio currently manages play/pause natively without JS intervention.
  }, []);

  // Handle song completion
  useEffect(() => {
    if (status.didJustFinish) {
      const currentQueue = queueRef.current;
      const currentIndex = queueIndexRef.current;
      const currentRepeat = repeatModeRef.current;
      const currentShuffle = isShuffleOnRef.current;

      if (currentRepeat === RepeatMode.ONE) {
        player.seekTo(0);
        player.play();
      } else if (currentQueue.length > 0) {
        if (
          currentRepeat === RepeatMode.ALL ||
          currentIndex < currentQueue.length - 1
        ) {
          let nextIdx: number;
          if (currentShuffle) {
            nextIdx = Math.floor(Math.random() * currentQueue.length);
            if (currentQueue.length > 1) {
              while (nextIdx === currentIndex)
                nextIdx = Math.floor(Math.random() * currentQueue.length);
            }
          } else {
            nextIdx = (currentIndex + 1) % currentQueue.length;
          }
          setQueueIndex(nextIdx);
          loadAndPlay(currentQueue[nextIdx]);
        } else {
          setIsPlaying(false);
        }
      }
    }
  }, [status.didJustFinish, player, loadAndPlay]);

  // === Library ===
  const loadDeviceMusic = useCallback(async () => {
    setIsLoadingLibrary(true);
    try {
      const deviceSongs = await scanDeviceMusic();
      if (deviceSongs.length > 0) setSongs(deviceSongs);
    } catch (e) {
      console.warn("Failed to scan device music:", e);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

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
    }
  }, []);

  // === Playback ===
  const addToRecents = useCallback((songId: string) => {
    setRecentSongIds((prev) => {
      const filtered = prev.filter((id) => id !== songId);
      const updated = [songId, ...filtered].slice(0, 50);
      saveRecents(updated);
      return updated;
    });
  }, []);

  const loadAndPlay = useCallback(
    async (song: Song) => {
      try {
        setCurrentSong(song);
        addToRecents(song.id);

        if (!song.audioUri) {
          setIsPlaying(false);
          return;
        }

        player.replace({ uri: song.audioUri });

        // Setup lockscreen/notification controls
        player.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
          albumTitle: song.album || "MusicPlay",
        });
        player.volume = isMuted ? 0 : volume;
        player.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn("Failed to load song:", e);
        setIsPlaying(false);
      }
    },
    [player, volume, isMuted, addToRecents],
  );

  const playSong = useCallback(
    async (song: Song, newQueue?: Song[]) => {
      const songQueue = newQueue || songs;
      const index = songQueue.findIndex((s) => s.id === song.id);
      setQueue(songQueue);
      setQueueIndex(index >= 0 ? index : 0);
      await loadAndPlay(song);
    },
    [songs, loadAndPlay],
  );

  const togglePlayPause = useCallback(() => {
    if (!currentSong) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [player, currentSong, isPlaying]);

  const pause = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    }
  }, [player, isPlaying]);

  const resume = useCallback(() => {
    if (!isPlaying && currentSong) {
      player.play();
      setIsPlaying(true);
    }
  }, [player, isPlaying, currentSong]);

  const getNextIndex = useCallback(
    (curIdx: number, len: number): number => {
      if (isShuffleOn) {
        let r = Math.floor(Math.random() * len);
        if (len > 1) while (r === curIdx) r = Math.floor(Math.random() * len);
        return r;
      }
      return (curIdx + 1) % len;
    },
    [isShuffleOn],
  );

  const next = useCallback(async () => {
    if (queue.length === 0) return;
    const nextIdx = getNextIndex(queueIndex, queue.length);
    setQueueIndex(nextIdx);
    await loadAndPlay(queue[nextIdx]);
  }, [queue, queueIndex, getNextIndex, loadAndPlay]);

  const previous = useCallback(async () => {
    if (queue.length === 0) return;
    if (position > 3) {
      seekTo(0);
      return;
    }
    const prevIdx = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIdx);
    await loadAndPlay(queue[prevIdx]);
  }, [queue, queueIndex, position, loadAndPlay]);

  const seekTo = useCallback(
    (seconds: number) => {
      player.seekTo(seconds);
    },
    [player],
  );

  // === Volume ===
  const setVolume = useCallback(
    (vol: number) => {
      setVolumeState(vol);
      setIsMuted(false);
      player.volume = vol;
      saveSettings({
        volume: vol,
        lastSongId: currentSong?.id || null,
        equalizerPreset,
      });
    },
    [player, currentSong, equalizerPreset],
  );

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    player.volume = newMuted ? 0 : volume;
  }, [player, isMuted, volume]);

  // === Modes ===
  const toggleShuffle = useCallback(() => setIsShuffleOn((prev) => !prev), []);

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

  // === Favorites ===
  const toggleFavorite = useCallback((songId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      saveFavorites(Array.from(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (songId: string) => favoriteIds.has(songId),
    [favoriteIds],
  );

  // === Playlists ===
  const createPlaylist = useCallback((name: string) => {
    setPlaylists((prev) => {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name,
        songIds: [],
        createdAt: Date.now(),
      };
      const updated = [...prev, newPlaylist];
      savePlaylists(updated);
      return updated;
    });
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== playlistId);
      savePlaylists(updated);
      return updated;
    });
  }, []);

  const addSongToPlaylist = useCallback(
    (playlistId: string, songId: string) => {
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
    },
    [],
  );

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
    },
    [],
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
        if (currentSong?.id === songId) {
          player.pause();
          setIsPlaying(false);
          setCurrentSong(null);
        }
        // Try to delete the file via MediaLibrary
        try {
          await MediaLibrary.deleteAssetsAsync([songId]);
        } catch (deleteErr) {
          console.warn(
            "MediaLibrary delete failed, removing from app only:",
            deleteErr,
          );
        }
        // Remove from songs list
        setSongs((prev) => prev.filter((s) => s.id !== songId));
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
        // Remove from recents
        setRecentSongIds((prev) => {
          const updated = prev.filter((id) => id !== songId);
          saveRecents(updated);
          return updated;
        });
      } catch (e) {
        console.warn("Failed to delete song:", e);
      }
    },
    [songs, currentSong, player],
  );

  // === Sleep Timer ===
  const setSleepTimer = useCallback(
    (minutes: number) => {
      // Clear existing timer
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      const totalSeconds = minutes * 60;
      setSleepTimerRemaining(totalSeconds);

      sleepTimerRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Timer done - pause playback
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
            player.pause();
            setIsPlaying(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [player],
  );

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepTimerRemaining(null);
  }, []);

  // === Equalizer ===
  const setEqualizerPreset = useCallback(
    (preset: string) => {
      setEqualizerPresetState(preset);
      saveSettings({
        volume,
        lastSongId: currentSong?.id || null,
        equalizerPreset: preset,
      });
    },
    [volume, currentSong],
  );

  const value: MusicPlayerContextType = {
    songs,
    isLoadingLibrary,
    currentSong,
    isPlaying,
    position,
    duration,
    queue,
    queueIndex,
    volume,
    isMuted,
    isShuffleOn,
    repeatMode,
    favoriteIds,
    playlists,
    sleepTimerRemaining,
    equalizerPreset,
    recentSongIds,
    loadDeviceMusic,
    pickMusicFiles,
    playSong,
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
    setEqualizerPreset,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
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
