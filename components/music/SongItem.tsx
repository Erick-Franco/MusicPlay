import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { formatDuration } from "@/utils/musicScanner";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SongItemProps {
  song: Song;
  onPress: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function SongItem({
  song,
  onPress,
  onLongPress,
  isActive,
  showFavorite = true,
  isFavorite: isFavoriteProp,
  onToggleFavorite,
}: SongItemProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const ctx = useMusicPlayer();

  const fav =
    isFavoriteProp !== undefined ? isFavoriteProp : ctx.isFavorite(song.id);
  const handleFavorite =
    onToggleFavorite || (() => ctx.toggleFavorite(song.id));

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isActive ? colors.accent + "15" : "transparent",
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Artwork */}
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={[styles.artwork, { backgroundColor: colors.card }]}
        />
      ) : (
        <View style={[styles.artwork, { backgroundColor: colors.card }]}>
          <Ionicons name="musical-note" size={20} color={colors.accent} />
        </View>
      )}

      {/* Song info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: isActive ? colors.accent : colors.text },
          ]}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text
          style={[styles.artist, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {song.artist}
        </Text>
      </View>

      {/* Duration */}
      <Text style={[styles.duration, { color: colors.textSecondary }]}>
        {formatDuration(song.duration)}
      </Text>

      {/* Favorite */}
      {showFavorite && (
        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteBtn}>
          <Ionicons
            name={fav ? "heart" : "heart-outline"}
            size={22}
            color={fav ? colors.favorite : colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600" },
  artist: { fontSize: 13 },
  duration: { fontSize: 13, marginRight: Spacing.xs },
  favoriteBtn: { padding: Spacing.xs },
});
