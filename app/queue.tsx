import { SongItem } from "@/components/music/SongItem";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QueueScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { queue, queueIndex, currentSong, playSong, isShuffleOn } =
    useMusicPlayer();

  // Get upcoming songs - if shuffle is on, show all remaining songs (order is random)
  const upcomingSongs = queue.filter((_, idx) => idx !== queueIndex);
  const nextInOrder = queue.slice(queueIndex + 1);

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
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Cola de reproducción
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {queue.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="list-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            La cola está vacía
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Now playing */}
          {currentSong && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Reproduciendo ahora
              </Text>
              <SongItem
                song={currentSong}
                isActive={true}
                onPress={() => {}}
                showFavorite={false}
              />
            </View>
          )}

          {/* Up next */}
          {isShuffleOn
            ? // Shuffle mode: show all remaining songs with shuffle indicator
              upcomingSongs.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Modo aleatorio ({upcomingSongs.length} canciones)
                    </Text>
                    <Ionicons name="shuffle" size={16} color={colors.accent} />
                  </View>
                  {upcomingSongs.map((song) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      isActive={false}
                      onPress={() => playSong(song, queue)}
                      showFavorite={false}
                    />
                  ))}
                </View>
              )
            : // Normal mode: show remaining songs in order
              nextInOrder.length > 0 && (
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Siguiente ({nextInOrder.length} canciones)
                  </Text>
                  {nextInOrder.map((song) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      isActive={false}
                      onPress={() => playSong(song, queue)}
                      showFavorite={false}
                    />
                  ))}
                </View>
              )}
        </ScrollView>
      )}
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
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  title: { fontSize: 17, fontWeight: "700" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingBottom: 100,
  },
  emptyText: { fontSize: 16 },
  listContent: { paddingBottom: 100 },
  section: { marginTop: Spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
