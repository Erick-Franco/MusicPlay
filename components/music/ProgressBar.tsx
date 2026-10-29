import { NeonSlider } from "@/components/ui/NeonSlider";
import { Colors, Spacing } from "@/constants/theme";
import {
  useMusicPlayer,
  usePlaybackStatus,
} from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration } from "@/utils/musicScanner";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function ProgressBar() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { seekTo } = useMusicPlayer();
  const { position, duration } = usePlaybackStatus();
  // While dragging, show the time under the finger instead of the playhead.
  const [scrub, setScrub] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <NeonSlider
        value={position}
        maximumValue={duration}
        onSlidingComplete={seekTo}
        onScrub={setScrub}
      />
      <View style={styles.timeContainer}>
        <Text
          style={[
            styles.time,
            {
              color:
                scrub !== null ? colors.tabIconSelected : colors.textSecondary,
            },
          ]}
        >
          {formatDuration(scrub ?? position)}
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
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -2,
  },
  time: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
