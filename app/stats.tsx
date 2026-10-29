import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatsScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { songs, playCounts, favoriteIds, playlists } = useMusicPlayer();

  const stats = useMemo(() => {
    const entries = Object.entries(playCounts).sort(([, a], [, b]) => b - a);

    const topSongs = entries
      .map(([id, count]) => ({
        song: songs.find((s) => s.id === id),
        count,
      }))
      .filter(
        (x): x is { song: (typeof songs)[number]; count: number } =>
          x.song !== undefined,
      )
      .slice(0, 10);

    const artistTotals = new Map<string, number>();
    const albumTotals = new Map<string, number>();
    entries.forEach(([id, count]) => {
      const song = songs.find((s) => s.id === id);
      if (!song) return;
      artistTotals.set(
        song.artist,
        (artistTotals.get(song.artist) || 0) + count,
      );
      const albumKey = song.album || "Álbum desconocido";
      albumTotals.set(albumKey, (albumTotals.get(albumKey) || 0) + count);
    });

    const topArtists = Array.from(artistTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const topAlbums = Array.from(albumTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const totalPlays = entries.reduce((sum, [, count]) => sum + count, 0);

    return {
      topSongs,
      topArtists,
      topAlbums,
      totalPlays,
      playedSongs: entries.length,
    };
  }, [songs, playCounts]);

  const summary: {
    value: number;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { value: stats.totalPlays, label: "Reproducciones", icon: "play" },
    { value: stats.playedSongs, label: "Canciones", icon: "musical-note" },
    { value: favoriteIds.size, label: "Favoritas", icon: "heart" },
    { value: playlists.length, label: "Playlists", icon: "albums" },
  ];

  const section = (
    title: string,
    rows: { key: string; label: string; value: number }[],
    emptyText: string,
    delay: number,
  ) => (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.panel,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {emptyText}
        </Text>
      ) : (
        rows.map((row, i) => (
          <StatBar
            key={row.key}
            rank={i + 1}
            label={row.label}
            value={row.value}
            max={rows[0].value}
            delay={delay + i * 60}
          />
        ))
      )}
    </Animated.View>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <GlassIconButton
          icon="chevron-back"
          onPress={() => router.back()}
          accessibilityLabel="Volver"
        />
        <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cards}>
          {summary.map((item, i) => (
            <Animated.View
              key={item.label}
              entering={FadeInDown.delay(i * 70)
                .springify()
                .damping(16)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <LinearGradient
                colors={NeonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIcon}
              >
                <Ionicons name={item.icon} size={14} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {item.value}
              </Text>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
            </Animated.View>
          ))}
        </View>

        {section(
          "Canciones más escuchadas",
          stats.topSongs.map(({ song, count }) => ({
            key: song.id,
            label: song.title,
            value: count,
          })),
          "Aún no hay reproducciones",
          200,
        )}
        {section(
          "Artistas más escuchados",
          stats.topArtists.map(([name, count]) => ({
            key: name,
            label: name,
            value: count,
          })),
          "Aún no hay datos",
          300,
        )}
        {section(
          "Álbumes más escuchados",
          stats.topAlbums.map(([name, count]) => ({
            key: name,
            label: name,
            value: count,
          })),
          "Aún no hay datos",
          400,
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

// Ranked row whose neon bar grows in from zero.
function StatBar({
  rank,
  label,
  value,
  max,
  delay,
}: {
  rank: number;
  label: string;
  value: number;
  max: number;
  delay: number;
}) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(Math.max(0.05, value / max), { duration: 700 }),
    );
  }, [value, max, delay, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View style={styles.barRow}>
      <Text
        style={[
          styles.rank,
          { color: rank === 1 ? colors.tabIconSelected : colors.textSecondary },
        ]}
      >
        {rank}
      </Text>
      <View style={styles.barBody}>
        <View style={styles.barTop}>
          <Text
            style={[styles.barLabel, { color: colors.text }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text style={[styles.barValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.barFill, fillStyle]}>
            <LinearGradient
              colors={NeonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
    </View>
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
  title: { fontSize: 18, fontWeight: "800" },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  card: {
    width: "48%",
    flexGrow: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  cardValue: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  cardLabel: { fontSize: 12, marginTop: 2 },
  panel: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  empty: { fontSize: 13 },
  barRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  rank: { width: 18, fontSize: 15, fontWeight: "800", textAlign: "center" },
  barBody: { flex: 1, gap: 6 },
  barTop: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  barLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  barValue: { fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3, overflow: "hidden" },
});
