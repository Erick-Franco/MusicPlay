import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration } from "@/utils/musicScanner";
import Slider from "@react-native-community/slider";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

export function ProgressBar() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { position, duration, seekTo } = useMusicPlayer();

  const onSlidingComplete = useCallback(
    (value: number) => {
      seekTo(value);
    },
    [seekTo],
  );

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        value={position}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
      <View style={styles.timeContainer}>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {formatDuration(position)}
        </Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -Spacing.sm,
  },
  time: {
    fontSize: 12,
  },
});
