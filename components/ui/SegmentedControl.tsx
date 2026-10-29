import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SegmentedControlProps<K extends string> {
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}

const PAD = 4;

// Glass track with a neon pill that slides under the selected option.
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<K>) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const [width, setWidth] = useState(0);
  const segment = width / options.length;
  const index = Math.max(
    options.findIndex((o) => o.key === value),
    0,
  );
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(index * segment, { damping: 18, stiffness: 200 });
  }, [index, segment, x]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
        style,
      ]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - PAD * 2 - 2)}
    >
      {segment > 0 && (
        <Animated.View style={[styles.pill, { width: segment }, pillStyle]}>
          <LinearGradient
            colors={NeonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillFill}
          />
        </Animated.View>
      )}
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            style={styles.option}
            onPress={() => {
              if (!selected) {
                Haptics.selectionAsync();
                onChange(o.key);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? "#FFFFFF" : colors.textSecondary },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: PAD,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  pill: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    left: PAD,
  },
  pillFill: { flex: 1, borderRadius: BorderRadius.md },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  label: { fontSize: 14, fontWeight: "700" },
});
