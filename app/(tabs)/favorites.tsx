import { SongItem } from "@/components/music/SongItem";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { songs, currentSong, playSong, favoriteIds } = useMusicPlayer();

  const favoriteSongs = useMemo(() => {
    return songs.filter((s) => favoriteIds.has(s.id));
  }, [songs, favoriteIds]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Favoritos
        </Text>
        <Ionicons name="heart" size={24} color={colors.favorite} />
      </View>

      {favoriteSongs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="heart-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin favoritos
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Toca el corazón en cualquier canción para agregarla aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              isActive={currentSong?.id === item.id}
              onPress={() => playSong(item, favoriteSongs)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: Spacing.xxl,
  },
  listContent: {
    paddingBottom: 120,
  },
});
