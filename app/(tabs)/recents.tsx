import { AddToPlaylistModal } from "@/components/music/AddToPlaylistModal";
import { SongItem } from "@/components/music/SongItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Recientes
        </Text>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {recentSongs.length} canciones
        </Text>
      </View>

      <FlatList
        data={recentSongs}
        keyExtractor={(item, idx) => `${item.id}_${idx}`}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={
              index < 12
                ? FadeInDown.delay(index * 30).duration(280)
                : undefined
            }
          >
            <SongItem
              song={item}
              isActive={currentSong?.id === item.id}
              onPress={() => playSong(item)}
              onLongPress={() => setAddToPlaylistSongId(item.id)}
              showFavorite
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="Nada por aquí todavía"
            subtitle="Las canciones que reproduzcas aparecerán aquí."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  headerCount: { fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: Spacing.lg, flexGrow: 1 },
});
