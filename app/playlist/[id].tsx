import { AddSongsToPlaylistModal } from "@/components/music/AddSongsToPlaylistModal";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { SongItem } from "@/components/music/SongItem";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlaylistDetailScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    playlists,
    songs,
    currentSong,
    playSong,
    playPlaylist,
    removeSongFromPlaylist,
    toggleShuffle,
    isShuffleOn,
  } = useMusicPlayer();
  const [showAddSongs, setShowAddSongs] = useState(false);

  const playlist = playlists.find((p) => p.id === id);

  const playlistSongs = useMemo(() => {
    if (!playlist) return [];
    return playlist.songIds
      .map((songId) => songs.find((s) => s.id === songId))
      .filter((s): s is Song => s !== undefined);
  }, [playlist, songs]);

  // Shuffle play
  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return;
    if (!isShuffleOn) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * playlistSongs.length);
    playSong(playlistSongs[randomIdx], playlistSongs);
  };

  if (!playlist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>
          Playlist no encontrada
        </Text>
      </View>
    );
  }

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
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {playlist.name}
          </Text>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {playlistSongs.length}{" "}
            {playlistSongs.length === 1 ? "canción" : "canciones"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddSongs(true)}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Playback controls */}
      {playlistSongs.length > 0 && (
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.playAllBtn, { backgroundColor: colors.accent }]}
            onPress={() => playPlaylist(playlist)}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.playAllText}>Reproducir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.shuffleBtn,
              { backgroundColor: colors.card, borderColor: colors.accent },
            ]}
            onPress={handleShufflePlay}
          >
            <Ionicons name="shuffle" size={20} color={colors.accent} />
            <Text style={[styles.shuffleText, { color: colors.accent }]}>
              Aleatorio
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Songs */}
      {playlistSongs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="musical-notes-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Esta playlist está vacía
          </Text>
          <TouchableOpacity
            style={[styles.addSongsBtn, { backgroundColor: colors.accent }]}
            onPress={() => setShowAddSongs(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addSongsBtnText}>Agregar canciones</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlistSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              isActive={currentSong?.id === item.id}
              onPress={() => playSong(item, playlistSongs)}
              onLongPress={() => removeSongFromPlaylist(playlist.id, item.id)}
              showFavorite
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MiniPlayer */}
      <MiniPlayer />

      {/* Add Songs Modal */}
      <AddSongsToPlaylistModal
        visible={showAddSongs}
        onClose={() => setShowAddSongs(false)}
        playlistId={playlist.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.sm },
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerCount: { fontSize: 13 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
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
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 100,
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  addSongsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addSongsBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  listContent: { paddingBottom: 120 },
});
