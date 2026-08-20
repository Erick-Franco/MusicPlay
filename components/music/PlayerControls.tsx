import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { RepeatMode } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PlayerControlsProps {
  size?: "small" | "large";
}

export function PlayerControls({ size = "large" }: PlayerControlsProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const {
    isPlaying,
    togglePlayPause,
    next,
    previous,
    isShuffleOn,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode,
  } = useMusicPlayer();

  const isLarge = size === "large";
  const mainIconSize = isLarge ? 38 : 28;
  const sideIconSize = isLarge ? 28 : 22;
  const modeIconSize = isLarge ? 22 : 18;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      {/* Shuffle */}
      <TouchableOpacity onPress={toggleShuffle} style={styles.modeBtn}>
        <Ionicons
          name="shuffle"
          size={modeIconSize}
          color={isShuffleOn ? colors.accent : colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Previous */}
      <TouchableOpacity onPress={previous} style={styles.controlBtn}>
        <Ionicons
          name="play-skip-back"
          size={sideIconSize}
          color={colors.text}
        />
      </TouchableOpacity>

      {/* Play/Pause */}
      <TouchableOpacity
        onPress={togglePlayPause}
        style={[styles.playBtn, { backgroundColor: colors.accent }]}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={mainIconSize}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 3 } : undefined}
        />
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity onPress={next} style={styles.controlBtn}>
        <Ionicons
          name="play-skip-forward"
          size={sideIconSize}
          color={colors.text}
        />
      </TouchableOpacity>

      {/* Repeat */}
      <TouchableOpacity onPress={cycleRepeatMode} style={styles.modeBtn}>
        <View>
          <Ionicons
            name="repeat"
            size={modeIconSize}
            color={
              repeatMode !== RepeatMode.OFF
                ? colors.accent
                : colors.textSecondary
            }
          />
          {repeatMode === RepeatMode.ONE && (
            <View
              style={[
                styles.repeatOneBadge,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.repeatOneText}>1</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  containerLarge: {
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  modeBtn: {
    padding: Spacing.sm,
  },
  controlBtn: {
    padding: Spacing.sm,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  repeatOneBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatOneText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
});
