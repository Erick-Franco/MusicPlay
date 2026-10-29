import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tint of the top glow; defaults to the theme's violet. */
  glowColor?: string;
}

// Deep background with two soft neon glows. Glass surfaces placed on top get
// their color from these glows, which is what sells the "glass" effect
// without a (costly, unreliable on Android) real blur.
export function ScreenBackground({
  children,
  style,
  glowColor,
}: ScreenBackgroundProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }, style]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[glowColor ?? colors.glowPrimary, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", colors.glowSecondary]}
        start={{ x: 0.2, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
