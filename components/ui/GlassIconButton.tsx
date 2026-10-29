import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { PressableScale } from "./PressableScale";

interface GlassIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// Round translucent button for headers (back, settings, refresh...).
// Pass children to replace the icon (e.g. a spinner).
export function GlassIconButton({
  icon,
  onPress,
  size = 40,
  color,
  accessibilityLabel,
  style,
  children,
}: GlassIconButtonProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.9}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
    >
      {children ?? (
        <Ionicons name={icon} size={size * 0.48} color={color ?? colors.text} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
