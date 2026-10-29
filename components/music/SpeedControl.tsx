import { PressableScale } from "@/components/ui/PressableScale";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { PLAYBACK_RATES, useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text } from "react-native";

function formatRate(rate: number): string {
  return rate % 1 === 0 ? `${rate}.0x` : `${rate}x`;
}

export function SpeedControl() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { playbackRate, setPlaybackRate } = useMusicPlayer();
  const isDefault = playbackRate === 1;

  const cycleRate = () => {
    const idx = PLAYBACK_RATES.indexOf(playbackRate);
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(next);
  };

  return (
    <PressableScale
      onPress={cycleRate}
      haptic
      accessibilityLabel="Velocidad de reproducción"
      style={[
        styles.pill,
        {
          backgroundColor: isDefault ? colors.glass : colors.accent + "26",
          borderColor: isDefault ? colors.glassBorder : colors.accent + "80",
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isDefault ? colors.textSecondary : colors.tabIconSelected },
        ]}
      >
        {formatRate(playbackRate)}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minWidth: 52,
    alignItems: "center",
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
});
