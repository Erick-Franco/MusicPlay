import { MiniPlayer } from "@/components/music/MiniPlayer";
import { SongItem } from "@/components/music/SongItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { PlayShuffleButtons } from "@/components/ui/PlayShuffleButtons";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { BorderRadius, Colors, Spacing, neonShadow } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SMART_PLAYLIST_META: Record<string, { icon: string; color: string }> = {
  recent: { icon: "time-outline", color: "#06B6D4" },
  most_played: { icon: "trending-up-outline", color: "#EC4899" },
  favorites: { icon: "heart-outline", color: "#F472B6" },
  recent_added: { icon: "add-circle-outline", color: "#8B5CF6" },
};

export default function SmartPlaylistScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const {
    songs,
    recentSongIds,
    favoriteIds,
    playCounts,
    currentSong,
    playSong,
    toggleShuffle,
    isShuffleOn,
  } = useMusicPlayer();

  const meta = SMART_PLAYLIST_META[type] || {
    icon: "musical-notes",
    color: colors.accent,
  };

  const { title, smartSongs } = useMemo(() => {
    let title = "";
    let songIds: string[] = [];

    switch (type) {
      case "recent":
        title = "Reproducidas recientemente";
        songIds = recentSongIds.slice(0, 25);
        break;
      case "most_played": {
        title = "Más escuchadas";
        songIds = Object.entries(playCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20)
          .map(([id]) => id);
        break;
      }
      case "favorites":
        title = "Mis favoritas";
        songIds = Array.from(favoriteIds);
        break;
      case "recent_added":
        title = "Agregadas recientemente";
        songIds = songs
          .slice(-20)
          .reverse()
          .map((s) => s.id);
        break;
      default:
        title = "Playlist";
    }

    const smartSongs = songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => s !== undefined);

    return { title, smartSongs };
  }, [type, songs, recentSongIds, favoriteIds, playCounts]);

  const handlePlayAll = () => {
    if (smartSongs.length > 0) playSong(smartSongs[0], smartSongs);
  };

  const handleShufflePlay = () => {
    if (smartSongs.length === 0) return;
    if (!isShuffleOn) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * smartSongs.length);
    playSong(smartSongs[randomIdx], smartSongs);
  };

  const listHeader = (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
      <LinearGradient
        colors={[meta.color, meta.color + "55"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroIcon, neonShadow(meta.color)]}
      >
        <Ionicons name={meta.icon as any} size={64} color="#FFFFFF" />
      </LinearGradient>
      <Text
        style={[styles.heroTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text style={[styles.heroCount, { color: colors.textSecondary }]}>
        {smartSongs.length} {smartSongs.length === 1 ? "canción" : "canciones"}
      </Text>
      {smartSongs.length > 0 && (
        <View style={styles.controlsRow}>
          <PlayShuffleButtons
            onPlay={handlePlayAll}
            onShuffle={handleShufflePlay}
            gradient={[meta.color, meta.color + "AA"]}
          />
        </View>
      )}
    </Animated.View>
  );

  return (
    <ScreenBackground
      style={{ paddingTop: insets.top }}
      glowColor={meta.color + "40"}
    >
      <View style={styles.header}>
        <GlassIconButton
          icon="arrow-back"
          onPress={() => router.back()}
          accessibilityLabel="Volver"
        />
      </View>

      <FlatList
        data={smartSongs}
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
              onPress={() => playSong(item, smartSongs)}
              showFavorite
            />
          </Animated.View>
        )}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon={meta.icon as any} title="No hay canciones aún" />
        }
      />

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
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  heroIcon: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
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
  listContent: { paddingBottom: Spacing.lg },
  miniPlayer: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
});
