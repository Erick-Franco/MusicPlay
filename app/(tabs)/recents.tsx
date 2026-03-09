import { AddToPlaylistModal } from "@/components/music/AddToPlaylistModal";
import { SongItem } from "@/components/music/SongItem";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecentsScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const {
    songs,
    recentSongIds,
    currentSong,
    playSong,
    toggleFavorite,
    isFavorite,
  } = useMusicPlayer();
  const [addToPlaylistSongId, setAddToPlaylistSongId] = React.useState<
    string | null
  >(null);

  const recentSongs = useMemo(() => {
    return recentSongIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [recentSongIds, songs]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Recientes
        </Text>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {recentSongs.length} canciones
        </Text>
      </View>

      {recentSongs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="time-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aún no has reproducido canciones
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentSongs}
          keyExtractor={(item, idx) => `${item.id}_${idx}`}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              isActive={currentSong?.id === item.id}
              onPress={() => playSong(item)}
              onLongPress={() => setAddToPlaylistSongId(item.id)}
              showFavorite
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {addToPlaylistSongId && (
        <AddToPlaylistModal
          visible={!!addToPlaylistSongId}
          onClose={() => setAddToPlaylistSongId(null)}
          songId={addToPlaylistSongId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  headerCount: { fontSize: 13, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingBottom: 100,
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  listContent: { paddingBottom: 120 },
});
