import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface EqualizerBarsProps {
  playing: boolean;
  color: string;
  size?: number;
}

const BAR_DURATIONS = [420, 560, 360];

function Bar({
  playing,
  color,
  height,
  index,
}: {
  playing: boolean;
  color: string;
  height: number;
  index: number;
}) {
  const level = useSharedValue(0.35);

  useEffect(() => {
    if (playing) {
      const d = BAR_DURATIONS[index];
      level.value = withDelay(
        index * 90,
        withRepeat(
          withSequence(
            withTiming(1, { duration: d }),
            withTiming(0.25, { duration: d }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(level);
      level.value = withTiming(0.35, { duration: 200 });
    }
  }, [playing, index, level]);

  const style = useAnimatedStyle(() => ({ height: height * level.value }));

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color, width: height / 5 }, style]}
    />
  );
}

// Animated "now playing" indicator for the active row.
export function EqualizerBars({
  playing,
  color,
  size = 16,
}: EqualizerBarsProps) {
  return (
    <View style={[styles.container, { height: size, gap: size / 8 }]}>
      {BAR_DURATIONS.map((_, i) => (
        <Bar key={i} index={i} playing={playing} color={color} height={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end" },
  bar: { borderRadius: 2 },
});
