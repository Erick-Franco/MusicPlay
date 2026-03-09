import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MiniPlayer() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, togglePlayPause, next, position, duration } =
    useMusicPlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayerBackground,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
        },
      ]}
      onPress={() => router.push("/now-playing")}
      activeOpacity={0.9}
    >
      {/* Progress bar at top */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Artwork */}
        <View style={[styles.artwork, { backgroundColor: colors.card }]}>
          <Ionicons name="musical-note" size={18} color={colors.accent} />
        </View>

        {/* Song info */}
        <View style={styles.info}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {currentSong.title}
          </Text>
          <Text
            style={[styles.artist, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {currentSong.artist}
          </Text>
        </View>

        {/* Controls */}
        <TouchableOpacity onPress={togglePlayPause} style={styles.controlBtn}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={26}
            color={colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.controlBtn}>
          <Ionicons name="play-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  progressTrack: {
    height: 2,
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  artwork: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  artist: {
    fontSize: 12,
  },
  controlBtn: {
    padding: Spacing.xs,
  },
});
