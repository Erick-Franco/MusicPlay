import { NeonGradient, neonShadow } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { PressableScale } from "./PressableScale";

interface GradientIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// Round neon call-to-action (create playlist, play all...).
export function GradientIconButton({
  icon,
  onPress,
  size = 40,
  accessibilityLabel,
  style,
}: GradientIconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      haptic
      pressedScale={0.9}
      accessibilityLabel={accessibilityLabel}
      style={[{ borderRadius: size / 2 }, neonShadow(NeonGradient[0]), style]}
    >
      <LinearGradient
        colors={NeonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.fill,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Ionicons name={icon} size={size * 0.5} color="#FFFFFF" />
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { alignItems: "center", justifyContent: "center" },
});
