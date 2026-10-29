import { AddSongsToPlaylistModal } from "@/components/music/AddSongsToPlaylistModal";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { PlaylistCover } from "@/components/music/PlaylistCard";
import { SongArtwork } from "@/components/music/SongArtwork";
import { AnimatedHeart } from "@/components/ui/AnimatedHeart";
import { EmptyState } from "@/components/ui/EmptyState";
import { EqualizerBars } from "@/components/ui/EqualizerBars";
import { GlassIconButton } from "@/components/ui/GlassIconButton";
import {
  GradientPill,
  PlayShuffleButtons,
} from "@/components/ui/PlayShuffleButtons";
import { PressableScale } from "@/components/ui/PressableScale";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import {
  BorderRadius,
  Colors,
  NeonGradient,
  Spacing,
  neonShadow,
} from "@/constants/theme";
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
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
  isPlaying: boolean;
  isFavoriteSong: boolean;
  onPress: (song: Song) => void;
  onLongPress: (songId: string, songTitle: string) => void;
  onToggleFavorite: (songId: string) => void;
}

const PlaylistSongRow = memo(function PlaylistSongRow({
  item,
  index,
  isCurrentPlaying,
  isPlaying,
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
    <PressableScale
      pressedScale={0.98}
      style={[
        styles.songRow,
        (isActive || isCurrentPlaying) && {
          backgroundColor: isActive ? colors.glassStrong : colors.glass,
          borderColor: isActive ? colors.accent + "80" : colors.glassBorder,
        },
        isActive && neonShadow(colors.accent),
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id, item.title)}
      delayLongPress={250}
    >
      <View>
        <SongArtwork song={item} size={46} borderRadius={BorderRadius.md} />
        {isCurrentPlaying && (
          <View style={styles.artworkOverlay}>
            <EqualizerBars playing={isPlaying} color="#FFFFFF" size={14} />
          </View>
        )}
      </View>
      <View style={styles.songInfo}>
        <Text
          style={[
            styles.songTitle,
            { color: isCurrentPlaying ? colors.tabIconSelected : colors.text },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.songArtist, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {index + 1} · {item.artist} · {formatDuration(item.duration)}
        </Text>
      </View>
      <AnimatedHeart
        active={isFavoriteSong}
        onPress={() => onToggleFavorite(item.id)}
        size={20}
        style={styles.actionBtn}
      />
      <Pressable
        onPress={() => onLongPress(item.id, item.title)}
        hitSlop={6}
        style={styles.actionBtn}
        accessibilityLabel="Opciones"
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
      <Pressable
        onPressIn={drag}
        style={styles.dragHandle}
        accessibilityLabel="Reordenar"
      >
        <Ionicons
          name="reorder-three"
          size={24}
          color={isActive ? colors.tabIconSelected : colors.textSecondary}
        />
      </Pressable>
    </PressableScale>
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
    isPlaying,
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
        isPlaying={isPlaying}
        isFavoriteSong={isFavorite(item.id)}
        onPress={handlePlay}
        onLongPress={handleSongMenu}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [
      currentSong,
      isPlaying,
      isFavorite,
      handlePlay,
      handleSongMenu,
      handleToggleFavorite,
    ],
  );

  if (!playlist) {
    return (
      <ScreenBackground style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Playlist no encontrada"
        />
      </ScreenBackground>
    );
  }

  const listHeader = (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
      <View style={neonShadow(NeonGradient[0])}>
        <PlaylistCover songIds={playlist.songIds} size={170} />
      </View>
      <Text
        style={[styles.heroTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {playlist.name}
      </Text>
      <Text style={[styles.heroCount, { color: colors.textSecondary }]}>
        {playlistSongs.length}{" "}
        {playlistSongs.length === 1 ? "canción" : "canciones"}
      </Text>

      {playlistSongs.length > 0 && (
        <View style={styles.controlsRow}>
          <PlayShuffleButtons
            onPlay={() => playPlaylist(playlist)}
            onShuffle={handleShufflePlay}
          />
        </View>
      )}
    </Animated.View>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <GlassIconButton
          icon="arrow-back"
          onPress={() => router.back()}
          accessibilityLabel="Volver"
        />
        <GlassIconButton
          icon="add"
          onPress={() => setShowAddSongs(true)}
          accessibilityLabel="Agregar canciones"
        />
      </View>

      {playlistSongs.length === 0 ? (
        <>
          {listHeader}
          <EmptyState
            icon="musical-notes-outline"
            title="Esta playlist está vacía"
            subtitle="Agrega canciones de tu biblioteca."
          >
            <GradientPill
              icon="add"
              label="Agregar canciones"
              onPress={() => setShowAddSongs(true)}
            />
          </EmptyState>
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <ReorderableList
            data={playlistSongs}
            keyExtractor={keyExtractor}
            renderItem={renderSongItem}
            onReorder={handleReorder}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            shouldUpdateActiveItem
          />
        </View>
      )}

      {currentSong && (
        <View
          style={[
            styles.miniPlayer,
            { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
          ]}
        >
          <MiniPlayer />
        </View>
      )}

      <AddSongsToPlaylistModal
        visible={showAddSongs}
        onClose={() => setShowAddSongs(false)}
        playlistId={playlist.id}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  heroCount: { fontSize: 14, marginTop: 4 },
  controlsRow: { marginTop: Spacing.lg },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "transparent",
    gap: Spacing.sm,
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    paddingLeft: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  songInfo: { flex: 1, gap: 3, marginLeft: Spacing.xs },
  songTitle: { fontSize: 15, fontWeight: "600" },
  songArtist: { fontSize: 12 },
  actionBtn: { padding: 4 },
  listContent: { paddingBottom: Spacing.lg },
  miniPlayer: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
});
