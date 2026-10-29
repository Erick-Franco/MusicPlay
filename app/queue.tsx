import { SongArtwork } from "@/components/music/SongArtwork";
import { SongItem } from "@/components/music/SongItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { PressableScale } from "@/components/ui/PressableScale";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutLeft,
  LinearTransition,
} from "react-native-reanimated";
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
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <GlassIconButton
          icon="chevron-down"
          onPress={() => router.back()}
          accessibilityLabel="Cerrar"
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Cola de reproducción
        </Text>
        {upcoming.length > 0 ? (
          <GlassIconButton
            icon="trash-outline"
            color={colors.danger}
            onPress={handleClearQueue}
            accessibilityLabel="Vaciar cola"
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {queue.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="La cola está vacía"
          subtitle="Reproduce una canción o una playlist para llenarla."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
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
                onPress={() => router.back()}
                showFavorite={false}
              />
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  styles.sectionTitleInline,
                  { color: colors.textSecondary },
                ]}
              >
                {isShuffleOn ? "Aleatorio" : "Siguiente"} · {upcoming.length}
              </Text>
              {isShuffleOn && (
                <Ionicons
                  name="shuffle"
                  size={14}
                  color={colors.tabIconSelected}
                />
              )}
            </View>
            {upcoming.length === 0 ? (
              <Text
                style={[styles.emptyUpcoming, { color: colors.textSecondary }]}
              >
                No hay más canciones en la cola
              </Text>
            ) : (
              upcoming.map(({ song, index }, i) => (
                <Animated.View
                  key={`${song.id}-${index}`}
                  entering={
                    i < 12 ? FadeInDown.delay(i * 30).duration(260) : undefined
                  }
                  exiting={FadeOutLeft.duration(200)}
                  layout={LinearTransition.springify().damping(18)}
                >
                  <PressableScale
                    style={styles.row}
                    pressedScale={0.98}
                    onPress={() => playSong(song, queue)}
                  >
                    <SongArtwork
                      song={song}
                      size={44}
                      borderRadius={BorderRadius.md}
                    />
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
                    <Pressable
                      onPress={() => removeFromQueue(index)}
                      style={styles.removeBtn}
                      hitSlop={10}
                      accessibilityLabel="Quitar de la cola"
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </PressableScale>
                </Animated.View>
              ))
            )}
          </View>
        </ScrollView>
      )}
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
  headerSpacer: { width: 40 },
  title: { fontSize: 17, fontWeight: "700" },
  emptyUpcoming: {
    fontSize: 13,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  listContent: {},
  section: { marginTop: Spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitleInline: { paddingHorizontal: 0, paddingVertical: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13, marginTop: 2 },
  removeBtn: { padding: Spacing.xs },
});
