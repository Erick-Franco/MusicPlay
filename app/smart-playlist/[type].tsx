import { MiniPlayer } from "@/components/music/MiniPlayer";
import { SongItem } from "@/components/music/SongItem";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SMART_PLAYLIST_META: Record<string, { icon: string; color: string }> = {
  recent: { icon: "time-outline", color: "#4ECDC4" },
  most_played: { icon: "trending-up-outline", color: "#FF6B6B" },
  favorites: { icon: "heart-outline", color: "#FF1744" },
  recent_added: { icon: "add-circle-outline", color: "#7C4DFF" },
};

export default function SmartPlaylistScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const {
    songs,
    recentSongIds,
    favoriteIds,
    currentSong,
    playSong,
    toggleShuffle,
    isShuffleOn,
  } = useMusicPlayer();

  const meta = SMART_PLAYLIST_META[type] || {
    icon: "musical-notes",
    color: colors.accent,
  };

  const { title, smartSongs } = useMemo(() => {
    let title = "";
    let songIds: string[] = [];

    switch (type) {
      case "recent":
        title = "Reproducidas recientemente";
        songIds = recentSongIds.slice(0, 25);
        break;
      case "most_played": {
        title = "Más escuchadas";
        const freq: Record<string, number> = {};
        recentSongIds.forEach((id) => {
          freq[id] = (freq[id] || 0) + 1;
        });
        songIds = Object.entries(freq)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20)
          .map(([id]) => id);
        break;
      }
      case "favorites":
        title = "Mis favoritas";
        songIds = Array.from(favoriteIds);
        break;
      case "recent_added":
        title = "Agregadas recientemente";
        songIds = songs
          .slice(-20)
          .reverse()
          .map((s) => s.id);
        break;
      default:
        title = "Playlist";
    }

    const smartSongs = songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => s !== undefined);

    return { title, smartSongs };
  }, [type, songs, recentSongIds, favoriteIds]);

  const handlePlayAll = () => {
    if (smartSongs.length > 0) playSong(smartSongs[0], smartSongs);
  };

  const handleShufflePlay = () => {
    if (smartSongs.length === 0) return;
    if (!isShuffleOn) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * smartSongs.length);
    playSong(smartSongs[randomIdx], smartSongs);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Ionicons name={meta.icon as any} size={22} color={meta.color} />
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {smartSongs.length}{" "}
            {smartSongs.length === 1 ? "canción" : "canciones"}
          </Text>
        </View>
      </View>

      {/* Playback controls */}
      {smartSongs.length > 0 && (
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.playAllBtn, { backgroundColor: meta.color }]}
            onPress={handlePlayAll}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.playAllText}>Reproducir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.shuffleBtn,
              { backgroundColor: colors.card, borderColor: meta.color },
            ]}
            onPress={handleShufflePlay}
          >
            <Ionicons name="shuffle" size={20} color={meta.color} />
            <Text style={[styles.shuffleText, { color: meta.color }]}>
              Aleatorio
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Songs */}
      <FlatList
        data={smartSongs}
        keyExtractor={(item, idx) => `${item.id}_${idx}`}
        renderItem={({ item }) => (
          <SongItem
            song={item}
            isActive={currentSong?.id === item.id}
            onPress={() => playSong(item, smartSongs)}
            showFavorite
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={meta.icon as any}
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay canciones aún
            </Text>
          </View>
        }
      />

      {/* MiniPlayer */}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.sm },
  headerInfo: { flex: 1, gap: 2 },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerCount: { fontSize: 13 },
  controlsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  playAllText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  shuffleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1.5,
  },
  shuffleText: { fontSize: 15, fontWeight: "600" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingTop: 100,
  },
  emptyText: { fontSize: 15 },
  listContent: { paddingBottom: 120 },
});
