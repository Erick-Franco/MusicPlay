import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

interface AnimatedHeartProps {
  active: boolean;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// Favorite toggle that "pops" when it becomes active.
export function AnimatedHeart({
  active,
  onPress,
  size = 22,
  style,
}: AnimatedHeartProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) {
      scale.value = withSequence(
        withSpring(1.35, { damping: 6, stiffness: 500 }),
        withSpring(1, { damping: 10, stiffness: 300 }),
      );
    }
    wasActive.current = active;
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={10}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={active ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={active ? "heart" : "heart-outline"}
          size={size}
          color={active ? colors.favorite : colors.textSecondary}
        />
      </Animated.View>
    </Pressable>
  );
}
