import { SongItem } from "@/components/music/SongItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconButton } from "@/components/ui/GradientIconButton";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { songs, currentSong, playSong, favoriteIds, shufflePlay } =
    useMusicPlayer();

  const favoriteSongs = useMemo(() => {
    return songs.filter((s) => favoriteIds.has(s.id));
  }, [songs, favoriteIds]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Favoritos
          </Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {favoriteSongs.length}{" "}
            {favoriteSongs.length === 1 ? "canción" : "canciones"}
          </Text>
        </View>
        {favoriteSongs.length > 0 && (
          <GradientIconButton
            icon="shuffle"
            size={46}
            onPress={() => shufflePlay(favoriteSongs)}
            accessibilityLabel="Reproducir favoritos en aleatorio"
          />
        )}
      </View>

      <FlatList
        data={favoriteSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={
              index < 12
                ? FadeInDown.delay(index * 30).duration(280)
                : undefined
            }
            layout={LinearTransition.springify().damping(18)}
          >
            <SongItem
              song={item}
              isActive={currentSong?.id === item.id}
              onPress={() => playSong(item, favoriteSongs)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Sin favoritos"
            subtitle="Toca el corazón en cualquier canción para agregarla aquí."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  count: { fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: Spacing.lg, flexGrow: 1 },
});
