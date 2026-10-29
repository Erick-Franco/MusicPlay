import { PressableScale } from "@/components/ui/PressableScale";
import { Colors, NeonGradient, Spacing, neonShadow } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { RepeatMode } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";

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
  const mainIconSize = isLarge ? 34 : 26;
  const sideIconSize = isLarge ? 30 : 22;
  const modeIconSize = isLarge ? 22 : 18;
  const playSize = isLarge ? 76 : 56;
  const repeatOn = repeatMode !== RepeatMode.OFF;

  // Toggles get a glowing dot underneath when on.
  const modeDot = (on: boolean) => (
    <View
      style={[
        styles.modeDot,
        { backgroundColor: on ? colors.tabIconSelected : "transparent" },
      ]}
    />
  );

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <PressableScale onPress={toggleShuffle} haptic style={styles.modeBtn}>
        <Ionicons
          name="shuffle"
          size={modeIconSize}
          color={isShuffleOn ? colors.tabIconSelected : colors.textSecondary}
        />
        {modeDot(isShuffleOn)}
      </PressableScale>

      <PressableScale
        onPress={previous}
        haptic
        pressedScale={0.85}
        style={styles.controlBtn}
      >
        <Ionicons
          name="play-skip-back"
          size={sideIconSize}
          color={colors.text}
        />
      </PressableScale>

      <PressableScale
        onPress={togglePlayPause}
        haptic
        pressedScale={0.9}
        style={[styles.playBtn, neonShadow(NeonGradient[1])]}
        accessibilityLabel={isPlaying ? "Pausar" : "Reproducir"}
      >
        <LinearGradient
          colors={NeonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.playFill,
            { width: playSize, height: playSize, borderRadius: playSize / 2 },
          ]}
        >
          {/* Keyed so the icon zooms between play and pause */}
          <Animated.View
            key={isPlaying ? "pause" : "play"}
            entering={ZoomIn.springify().damping(14)}
            exiting={ZoomOut.duration(120)}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={mainIconSize}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 4 } : undefined}
            />
          </Animated.View>
        </LinearGradient>
      </PressableScale>

      <PressableScale
        onPress={next}
        haptic
        pressedScale={0.85}
        style={styles.controlBtn}
      >
        <Ionicons
          name="play-skip-forward"
          size={sideIconSize}
          color={colors.text}
        />
      </PressableScale>

      <PressableScale onPress={cycleRepeatMode} haptic style={styles.modeBtn}>
        <View>
          <Ionicons
            name="repeat"
            size={modeIconSize}
            color={repeatOn ? colors.tabIconSelected : colors.textSecondary}
          />
          {repeatMode === RepeatMode.ONE && (
            <LinearGradient colors={NeonGradient} style={styles.repeatOneBadge}>
              <Text style={styles.repeatOneText}>1</Text>
            </LinearGradient>
          )}
        </View>
        {modeDot(repeatOn)}
      </PressableScale>
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
    alignItems: "center",
  },
  modeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  controlBtn: {
    padding: Spacing.sm,
  },
  playBtn: {
    borderRadius: 999,
  },
  playFill: {
    alignItems: "center",
    justifyContent: "center",
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
