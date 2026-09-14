import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

    return { topSongs, topArtists, topAlbums, totalPlays, playedSongs: entries.length };
  }, [songs, playCounts]);

  const renderBar = (
    label: string,
    value: number,
    max: number,
  ) => (
    <View style={styles.barRow}>
      <Text
        style={[styles.barLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={[styles.barTrack, { backgroundColor: colors.card }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(5, (value / max) * 100)}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>
      <Text style={[styles.barValue, { color: colors.textSecondary }]}>
        {value}
      </Text>
    </View>
  );

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
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Summary cards */}
        <View style={styles.cards}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardValue, { color: colors.accent }]}>
              {stats.totalPlays}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Reproducciones
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardValue, { color: colors.accent }]}>
              {stats.playedSongs}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Canciones
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardValue, { color: colors.accent }]}>
              {favoriteIds.size}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Favoritas
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardValue, { color: colors.accent }]}>
              {playlists.length}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Playlists
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Canciones más escuchadas
        </Text>
        {stats.topSongs.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Aún no hay reproducciones
          </Text>
        ) : (
          stats.topSongs.map(({ song, count }) =>
            renderBar(song.title, count, stats.topSongs[0].count),
          )
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Artistas más escuchados
        </Text>
        {stats.topArtists.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Aún no hay datos
          </Text>
        ) : (
          stats.topArtists.map(([name, count]) =>
            renderBar(name, count, stats.topArtists[0][1]),
          )
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Álbumes más escuchados
        </Text>
        {stats.topAlbums.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Aún no hay datos
          </Text>
        ) : (
          stats.topAlbums.map(([name, count]) =>
            renderBar(name, count, stats.topAlbums[0][1]),
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  cards: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  cardLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    fontSize: 13,
    marginLeft: Spacing.lg,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  barLabel: {
    width: 130,
    fontSize: 13,
    fontWeight: "600",
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginHorizontal: Spacing.sm,
  },
  barFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  barValue: {
    width: 32,
    fontSize: 13,
    textAlign: "right",
  },
});
