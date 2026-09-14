import { SongArtwork } from "@/components/music/SongArtwork";
import { SongItem } from "@/components/music/SongItem";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
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
  const {
    queue,
    queueIndex,
    currentSong,
    playSong,
    isShuffleOn,
    removeFromQueue,
    clearQueue,
  } = useMusicPlayer();

  // Upcoming songs: everything in the queue except the one playing now.
  // In shuffle mode the order shown is the current (randomized) queue order.
  const upcoming = queue
    .map((song, index) => ({ song, index }))
    .filter(({ index }) => index !== queueIndex);

  const handleClearQueue = () => {
    Alert.alert(
      "Vaciar cola",
      "Se eliminarán todas las canciones en espera. La canción actual seguirá sonando.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Vaciar",
          style: "destructive",
          onPress: clearQueue,
        },
      ],
    );
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
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Cola de reproducción
        </Text>
        {upcoming.length > 0 ? (
          <TouchableOpacity onPress={handleClearQueue} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.danger }]}>
              Vaciar
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 360 }} />
        )}
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
                isActive
                onPress={() => {}}
                showFavorite={false}
              />
            </View>
          )}

          {/* Up next */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                {isShuffleOn
                  ? `Modo aleatorio (${upcoming.length} canciones)`
                  : `Siguiente (${upcoming.length} canciones)`}
              </Text>
              {isShuffleOn && (
                <Ionicons name="shuffle" size={16} color={colors.accent} />
              )}
            </View>
            {upcoming.length === 0 ? (
              <Text
                style={[
                  styles.emptyUpcoming,
                  { color: colors.textSecondary },
                ]}
              >
                No hay más canciones en la cola
              </Text>
            ) : (
              upcoming.map(({ song, index }) => (
                <View
                  key={`${song.id}-${index}`}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.rowMain}
                    onPress={() => playSong(song, queue)}
                    activeOpacity={0.7}
                  >
                    <SongArtwork song={song} size={40} />
                    <View style={styles.rowInfo}>
                      <Text
                        style={[styles.rowTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {song.title}
                      </Text>
                      <Text
                        style={[styles.rowSub, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {song.artist}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeFromQueue(index)}
                    style={styles.removeBtn}
                    hitSlop={10}
                    accessibilityLabel="Quitar de la cola"
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
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
  clearBtn: { padding: Spacing.sm },
  clearText: { fontSize: 14, fontWeight: "600" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingBottom: 100,
  },
  emptyText: { fontSize: 16 },
  emptyUpcoming: {
    fontSize: 13,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingRight: Spacing.md },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13, marginTop: 2 },
  removeBtn: { padding: Spacing.xs },
});
