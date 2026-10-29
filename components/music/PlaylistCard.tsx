import { PressableScale } from "@/components/ui/PressableScale";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onDelete?: () => void;
}

const COVER = 60;

// Cover built from up to four song artworks; falls back to a neon tile.
export function PlaylistCover({
  songIds,
  size = COVER,
}: {
  songIds: string[];
  size?: number;
}) {
  const { songs } = useMusicPlayer();
  const artworks = useMemo(() => {
    const byId = new Map(songs.map((s) => [s.id, s.artwork]));
    const list: string[] = [];
    for (const id of songIds) {
      const art = byId.get(id);
      if (art && !list.includes(art)) list.push(art);
      if (list.length === 4) break;
    }
    return list;
  }, [songs, songIds]);

  if (artworks.length === 0) {
    return (
      <LinearGradient
        colors={NeonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cover, { width: size, height: size }]}
      >
        <Ionicons name="musical-notes" size={size * 0.42} color="#FFFFFF" />
      </LinearGradient>
    );
  }

  if (artworks.length < 4) {
    return (
      <Image
        source={{ uri: artworks[0] }}
        style={[styles.cover, { width: size, height: size }]}
      />
    );
  }

  const half = size / 2;
  return (
    <View style={[styles.cover, styles.mosaic, { width: size, height: size }]}>
      {artworks.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: half, height: half }}
        />
      ))}
    </View>
  );
}

export function PlaylistCard({
  playlist,
  onPress,
  onDelete,
}: PlaylistCardProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <PressableScale
      style={[
        styles.container,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
      ]}
      onPress={onPress}
      onLongPress={onDelete}
    >
      <PlaylistCover songIds={playlist.songIds} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {playlist.songIds.length}{" "}
          {playlist.songIds.length === 1 ? "canción" : "canciones"}
        </Text>
      </View>

      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons
            name="trash-outline"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      )}

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  cover: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mosaic: { flexDirection: "row", flexWrap: "wrap" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "700" },
  count: { fontSize: 13 },
  deleteBtn: { padding: Spacing.xs },
});
