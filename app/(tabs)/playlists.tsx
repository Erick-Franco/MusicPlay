import { CreatePlaylistModal } from "@/components/music/CreatePlaylistModal";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconButton } from "@/components/ui/GradientIconButton";
import { PressableScale } from "@/components/ui/PressableScale";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlaylistsScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    playlists,
    songs,
    recentSongIds,
    playCounts,
    createPlaylist,
    deletePlaylist,
  } = useMusicPlayer();
  const [showCreate, setShowCreate] = useState(false);

  // Smart playlists
  const smartPlaylists = useMemo(() => {
    const smart: {
      id: string;
      name: string;
      icon: string;
      songIds: string[];
      color: string;
    }[] = [];

    // Recently played
    if (recentSongIds.length > 0) {
      smart.push({
        id: "recent",
        name: "Reproducidas recientemente",
        icon: "time-outline",
        songIds: recentSongIds.slice(0, 25),
        color: "#06B6D4",
      });
    }

    // Most played  (based on persistent play counts)
    if (Object.keys(playCounts).length > 0) {
      const mostPlayed = Object.entries(playCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => id);
      smart.push({
        id: "most_played",
        name: "Más escuchadas",
        icon: "trending-up-outline",
        songIds: mostPlayed,
        color: "#EC4899",
      });
    }

    // Recently added (last 20 songs in library)
    if (songs.length > 0) {
      smart.push({
        id: "recent_added",
        name: "Agregadas recientemente",
        icon: "add-circle-outline",
        songIds: songs
          .slice(-20)
          .reverse()
          .map((s) => s.id),
        color: "#8B5CF6",
      });
    }

    return smart;
  }, [recentSongIds, playCounts, songs]);

  const handleOpenSmart = (smartPlaylist: (typeof smartPlaylists)[0]) => {
    router.push(`/smart-playlist/${smartPlaylist.id}` as any);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      "Eliminar playlist",
      `¿Seguro que quieres eliminar "${playlist.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deletePlaylist(playlist.id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Playlists
        </Text>
        <GradientIconButton
          icon="add"
          size={38}
          onPress={() => setShowCreate(true)}
          accessibilityLabel="Crear playlist"
        />
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
            <PlaylistCard
              playlist={item}
              onPress={() => router.push(`/playlist/${item.id}`)}
              onDelete={() => handleDeletePlaylist(item)}
            />
          </Animated.View>
        )}
        ListHeaderComponent={
          <>
            {/* Smart Playlists */}
            {smartPlaylists.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Para ti
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.smartRow}
                >
                  {smartPlaylists.map((sp, i) => (
                    <Animated.View
                      key={sp.id}
                      entering={FadeInRight.delay(i * 70)
                        .springify()
                        .damping(16)}
                    >
                      <PressableScale
                        onPress={() => handleOpenSmart(sp)}
                        style={styles.smartCard}
                      >
                        <LinearGradient
                          colors={[sp.color, sp.color + "55"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.smartFill}
                        >
                          <View style={styles.smartIcon}>
                            <Ionicons
                              name={sp.icon as any}
                              size={22}
                              color="#FFFFFF"
                            />
                          </View>
                          <View>
                            <Text style={styles.smartName} numberOfLines={2}>
                              {sp.name}
                            </Text>
                            <Text style={styles.smartCount}>
                              {sp.songIds.length}{" "}
                              {sp.songIds.length === 1
                                ? "canción"
                                : "canciones"}
                            </Text>
                          </View>
                        </LinearGradient>
                      </PressableScale>
                    </Animated.View>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Mis Playlists
            </Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="Crea tu primera playlist"
            subtitle="Agrupa tus canciones favoritas como quieras."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <CreatePlaylistModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(name) => {
          createPlaylist(name);
          setShowCreate(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  smartRow: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  smartCard: { borderRadius: BorderRadius.lg },
  smartFill: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  smartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  smartName: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  smartCount: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  listContent: { paddingBottom: Spacing.lg },
});
