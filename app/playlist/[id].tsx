import { AddSongsToPlaylistModal } from "@/components/music/AddSongsToPlaylistModal";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { SongArtwork } from "@/components/music/SongArtwork";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { formatDuration } from "@/utils/musicScanner";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  Alert,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReorderableList, {
  ReorderableListReorderEvent,
  useIsActive,
  useReorderableDrag,
} from "react-native-reorderable-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PlaylistSongRowProps {
  item: Song;
  index: number;
  isCurrentPlaying: boolean;
  isFavoriteSong: boolean;
  onPress: (song: Song) => void;
  onLongPress: (songId: string, songTitle: string) => void;
  onToggleFavorite: (songId: string) => void;
}

const PlaylistSongRow = memo(function PlaylistSongRow({
  item,
  index,
  isCurrentPlaying,
  isFavoriteSong,
  onPress,
  onLongPress,
  onToggleFavorite,
}: PlaylistSongRowProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const drag = useReorderableDrag();
  const isActive = useIsActive();

  return (
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
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id, item.title)}
      delayLongPress={250}
      activeOpacity={0.7}
    >
      {/* Artwork */}
      <SongArtwork song={item} size={44} />
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
      <Text style={[styles.songDuration, { color: colors.textSecondary }]}>
        {formatDuration(item.duration)}
      </Text>
      {/* Index */}
      <Text
        style={[
          styles.indexLabel,
          {
            color: isCurrentPlaying ? colors.accent : colors.textSecondary,
          },
        ]}
      >
        {index + 1}
      </Text>
      {/* Favorite */}
      <TouchableOpacity
        onPress={() => onToggleFavorite(item.id)}
        style={styles.actionBtn}
      >
        <Ionicons
          name={isFavoriteSong ? "heart" : "heart-outline"}
          size={20}
          color={isFavoriteSong ? colors.favorite : colors.textSecondary}
        />
      </TouchableOpacity>
      {/* Menu */}
      <TouchableOpacity
        onPress={() => onLongPress(item.id, item.title)}
        style={styles.actionBtn}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {/* Drag handle */}
      <TouchableOpacity
        onPressIn={drag}
        style={styles.dragHandle}
        accessibilityLabel="Reordenar"
      >
        <Ionicons name="reorder-three" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

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

  const keyExtractor = useCallback((item: Song) => item.id, []);

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return;
    if (!isShuffleOn) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * playlistSongs.length);
    playSong(playlistSongs[randomIdx], playlistSongs);
  };

  const handleSongMenu = useCallback(
    (songId: string, songTitle: string) => {
      Alert.alert(songTitle, "Opciones", [
        {
          text: "Quitar de la playlist",
          onPress: () => removeSongFromPlaylist(playlist!.id, songId),
        },
        {
          text: "Eliminar de la biblioteca",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Eliminar de la biblioteca",
              `Se quitará "${songTitle}" de la biblioteca, playlists, favoritos y recientes. Si la canción fue agregada manualmente, el archivo original permanecerá en tu dispositivo.`,
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
    },
    [playlist, removeSongFromPlaylist, deleteSongFromDevice],
  );

  const handleReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      if (from !== to && playlist) {
        reorderPlaylistSong(playlist.id, from, to);
      }
    },
    [playlist, reorderPlaylistSong],
  );

  const handlePlay = useCallback(
    (song: Song) => playSong(song, playlistSongs),
    [playSong, playlistSongs],
  );

  const handleToggleFavorite = useCallback(
    (songId: string) => toggleFavorite(songId),
    [toggleFavorite],
  );

  const renderSongItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Song>) => (
      <PlaylistSongRow
        item={item}
        index={index}
        isCurrentPlaying={currentSong?.id === item.id}
        isFavoriteSong={isFavorite(item.id)}
        onPress={handlePlay}
        onLongPress={handleSongMenu}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [
      currentSong,
      isFavorite,
      handlePlay,
      handleSongMenu,
      handleToggleFavorite,
    ],
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
          <View style={{ flex: 1 }}>
            <ReorderableList
              data={playlistSongs}
              keyExtractor={keyExtractor}
              renderItem={renderSongItem}
              onReorder={handleReorder}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom - 45 },
              ]}
              showsVerticalScrollIndicator={false}
              shouldUpdateActiveItem
            />
          </View>
        )}

        {/* MiniPlayer - Fixed at bottom */}
        {currentSong && <MiniPlayer />}

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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  dragHandle: {
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
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
  listContent: { paddingBottom: 20 },
});
