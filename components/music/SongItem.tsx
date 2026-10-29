import { AnimatedHeart } from "@/components/ui/AnimatedHeart";
import { EqualizerBars } from "@/components/ui/EqualizerBars";
import { PressableScale } from "@/components/ui/PressableScale";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { formatDuration } from "@/utils/musicScanner";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SongArtwork } from "./SongArtwork";

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
    <PressableScale
      pressedScale={0.97}
      style={[
        styles.container,
        isActive && {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Neon edge on the playing row */}
      {isActive && (
        <LinearGradient
          colors={NeonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.activeEdge}
        />
      )}

      <View>
        <SongArtwork song={song} size={50} borderRadius={BorderRadius.md} />
        {isActive && (
          <View style={styles.artworkOverlay}>
            <EqualizerBars playing={ctx.isPlaying} color="#FFFFFF" size={16} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: isActive ? colors.tabIconSelected : colors.text },
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

      <Text style={[styles.duration, { color: colors.textSecondary }]}>
        {formatDuration(song.duration)}
      </Text>

      {showFavorite && (
        <AnimatedHeart
          active={fav}
          onPress={handleFavorite}
          size={20}
          style={styles.favoriteBtn}
        />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "transparent",
    gap: Spacing.md,
    overflow: "hidden",
  },
  activeEdge: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: "600" },
  artist: { fontSize: 13 },
  duration: { fontSize: 12, fontVariant: ["tabular-nums"] },
  favoriteBtn: { padding: Spacing.xs },
});
