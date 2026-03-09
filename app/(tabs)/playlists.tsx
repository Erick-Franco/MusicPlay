import { CreatePlaylistModal } from "@/components/music/CreatePlaylistModal";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
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
    favoriteIds,
    createPlaylist,
    deletePlaylist,
    playSong,
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
        color: "#4ECDC4",
      });
    }

    // Most played  (based on frequency in recents)
    if (recentSongIds.length > 5) {
      const freq: Record<string, number> = {};
      recentSongIds.forEach((id) => {
        freq[id] = (freq[id] || 0) + 1;
      });
      const mostPlayed = Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => id);
      smart.push({
        id: "most_played",
        name: "Más escuchadas",
        icon: "trending-up-outline",
        songIds: mostPlayed,
        color: "#FF6B6B",
      });
    }

    // Favorites playlist
    if (favoriteIds.size > 0) {
      smart.push({
        id: "favorites",
        name: "Mis favoritas",
        icon: "heart-outline",
        songIds: Array.from(favoriteIds),
        color: "#FF1744",
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
        color: "#7C4DFF",
      });
    }

    return smart;
  }, [recentSongIds, favoriteIds, songs]);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Playlists
        </Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={[styles.createBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <>
            {/* Smart Playlists */}
            {smartPlaylists.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Playlists Inteligentes
                </Text>
                {smartPlaylists.map((sp) => (
                  <TouchableOpacity
                    key={sp.id}
                    style={[styles.smartCard, { backgroundColor: colors.card }]}
                    onPress={() => handleOpenSmart(sp)}
                  >
                    <View
                      style={[
                        styles.smartIcon,
                        { backgroundColor: sp.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={sp.icon as any}
                        size={22}
                        color={sp.color}
                      />
                    </View>
                    <View style={styles.smartInfo}>
                      <Text style={[styles.smartName, { color: colors.text }]}>
                        {sp.name}
                      </Text>
                      <Text
                        style={[
                          styles.smartCount,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {sp.songIds.length} canciones
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* User Playlists */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Mis Playlists
              </Text>
              {playlists.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons
                    name="musical-notes-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Crea tu primera playlist
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}
        ListFooterComponent={() => (
          <>
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => router.push(`/playlist/${playlist.id}`)}
                onDelete={() => handleDeletePlaylist(playlist)}
              />
            ))}
            <View style={{ height: 120 }} />
          </>
        )}
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
  headerTitle: { fontSize: 28, fontWeight: "800" },
  createBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  smartCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  smartIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  smartInfo: { flex: 1, gap: 2 },
  smartName: { fontSize: 15, fontWeight: "600" },
  smartCount: { fontSize: 12 },
  empty: {
    alignItems: "center",
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: { fontSize: 15 },
});
