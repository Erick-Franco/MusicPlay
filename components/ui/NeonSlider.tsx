import { Colors, NeonGradient } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface NeonSliderProps {
  value: number;
  maximumValue: number;
  onSlidingComplete: (value: number) => void;
  /** Called on every move while dragging (e.g. to show the scrub time). */
  onScrub?: (value: number | null) => void;
  style?: StyleProp<ViewStyle>;
}

const TRACK = 4;
const TRACK_ACTIVE = 8;
const THUMB = 14;

// Gradient progress/volume bar. It thickens and grows its thumb while being
// dragged; tap anywhere to jump.
export function NeonSlider({
  value,
  maximumValue,
  onSlidingComplete,
  onScrub,
  style,
}: NeonSliderProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const width = useSharedValue(0);
  const progress = useSharedValue(0);
  const dragging = useSharedValue(0);

  const max = maximumValue > 0 ? maximumValue : 1;

  useEffect(() => {
    if (dragging.value === 0) {
      progress.value = withTiming(Math.min(Math.max(value / max, 0), 1), {
        duration: 250,
      });
    }
  }, [value, max, progress, dragging]);

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
  };

  const emitScrub = (p: number | null) =>
    onScrub?.(p === null ? null : p * max);
  const complete = (p: number) => {
    onScrub?.(null);
    onSlidingComplete(p * max);
  };

  const clamp = (x: number) => {
    "worklet";
    return width.value > 0 ? Math.min(Math.max(x / width.value, 0), 1) : 0;
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      dragging.value = withSpring(1);
      progress.value = clamp(e.x);
      runOnJS(emitScrub)(progress.value);
    })
    .onUpdate((e) => {
      progress.value = clamp(e.x);
      runOnJS(emitScrub)(progress.value);
    })
    .onEnd(() => {
      runOnJS(complete)(progress.value);
    })
    .onFinalize(() => {
      dragging.value = withSpring(0);
    });

  const trackStyle = useAnimatedStyle(() => {
    const h = TRACK + (TRACK_ACTIVE - TRACK) * dragging.value;
    return { height: h, borderRadius: h / 2 };
  });
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * width.value - THUMB / 2 },
      { scale: 1 + 0.5 * dragging.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.hitArea, style]} onLayout={onLayout}>
        <Animated.View
          style={[styles.track, { backgroundColor: colors.border }, trackStyle]}
        >
          <Animated.View style={[styles.fill, fillStyle]}>
            <LinearGradient
              colors={NeonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hitArea: { height: 32, justifyContent: "center" },
  track: { width: "100%", overflow: "hidden" },
  fill: { height: "100%", overflow: "hidden" },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#EC4899",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
