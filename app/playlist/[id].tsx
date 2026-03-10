import { AddSongsToPlaylistModal } from "@/components/music/AddSongsToPlaylistModal";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { formatDuration } from "@/utils/musicScanner";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
    reorderPlaylistSong,
    deleteSongFromDevice,
    toggleShuffle,
    isShuffleOn,
    toggleFavorite,
    isFavorite,
  } = useMusicPlayer();
  const [showAddSongs, setShowAddSongs] = useState(false);

  const playlist = playlists.find((p) => p.id === id);

  const playlistSongs = useMemo(() => {
    if (!playlist) return [];
    return playlist.songIds
      .map((songId) => songs.find((s) => s.id === songId))
      .filter((s): s is Song => s !== undefined);
  }, [playlist, songs]);

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return;
    if (!isShuffleOn) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * playlistSongs.length);
    playSong(playlistSongs[randomIdx], playlistSongs);
  };

  const handleSongMenu = (songId: string, songTitle: string) => {
    Alert.alert(songTitle, "Opciones", [
      {
        text: "Quitar de la playlist",
        onPress: () => removeSongFromPlaylist(playlist!.id, songId),
      },
      {
        text: "Eliminar del dispositivo",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Eliminar del dispositivo",
            `¿Estás seguro de eliminar "${songTitle}" permanentemente? Esta acción no se puede deshacer.`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: () => deleteSongFromDevice(songId),
              },
            ],
          );
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleDragEnd = useCallback(
    ({ data, from, to }: { data: Song[]; from: number; to: number }) => {
      if (from !== to && playlist) {
        reorderPlaylistSong(playlist.id, from, to);
      }
    },
    [playlist, reorderPlaylistSong],
  );

  const renderSongItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Song>) => {
      const index = getIndex() ?? 0;
      const isCurrentPlaying = currentSong?.id === item.id;
      return (
        <ScaleDecorator>
          <TouchableOpacity
            style={[
              styles.songRow,
              {
                borderBottomColor: colors.border,
                backgroundColor: isActive
                  ? colors.accent + "25"
                  : isCurrentPlaying
                    ? colors.accent + "10"
                    : "transparent",
              },
            ]}
            onPress={() => playSong(item, playlistSongs)}
            onLongPress={() => handleSongMenu(item.id, item.title)}
            activeOpacity={0.7}
          >
            {/* Drag handle */}
            <TouchableOpacity
              onPressIn={drag}
              style={styles.dragHandle}
              delayLongPress={0}
            >
              <Ionicons
                name="reorder-three"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {/* Index */}
            <Text
              style={[
                styles.indexLabel,
                {
                  color: isCurrentPlaying
                    ? colors.accent
                    : colors.textSecondary,
                },
              ]}
            >
              {index + 1}
            </Text>
            {/* Info */}
            <View style={styles.songInfo}>
              <Text
                style={[
                  styles.songTitle,
                  { color: isCurrentPlaying ? colors.accent : colors.text },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.songArtist, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.artist}
              </Text>
            </View>
            {/* Duration */}
            <Text
              style={[styles.songDuration, { color: colors.textSecondary }]}
            >
              {formatDuration(item.duration)}
            </Text>
            {/* Favorite */}
            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              style={styles.actionBtn}
            >
              <Ionicons
                name={isFavorite(item.id) ? "heart" : "heart-outline"}
                size={20}
                color={
                  isFavorite(item.id) ? colors.favorite : colors.textSecondary
                }
              />
            </TouchableOpacity>
            {/* Menu */}
            <TouchableOpacity
              onPress={() => handleSongMenu(item.id, item.title)}
              style={styles.actionBtn}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [currentSong, colors, playlistSongs, isFavorite, toggleFavorite, playSong],
  );

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
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

        {/* Songs - Draggable */}
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
          <DraggableFlatList
            data={playlistSongs}
            keyExtractor={(item) => item.id}
            renderItem={renderSongItem}
            onDragEnd={handleDragEnd}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            activationDistance={10}
          />
        )}

        {/* MiniPlayer - Fixed at bottom */}
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer />
        </View>

        {/* Add Songs Modal */}
        <AddSongsToPlaylistModal
          visible={showAddSongs}
          onClose={() => setShowAddSongs(false)}
          playlistId={playlist.id}
        />
      </View>
    </GestureHandlerRootView>
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
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  dragHandle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  indexLabel: {
    fontSize: 13,
    fontWeight: "700",
    width: 22,
    textAlign: "center",
  },
  songInfo: { flex: 1, gap: 2 },
  songTitle: { fontSize: 14, fontWeight: "600" },
  songArtist: { fontSize: 12 },
  songDuration: { fontSize: 12, marginRight: 2 },
  actionBtn: { padding: 4 },
  listContent: { paddingBottom: 180 },
  miniPlayerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
