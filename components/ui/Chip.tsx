import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "./PressableScale";

interface ChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

// Glass pill; turns neon when selected.
export function Chip({ label, onPress, selected = false, icon }: ChipProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const color = selected ? "#FFFFFF" : colors.text;

  const content = (
    <View style={styles.content}>
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? "#FFFFFF" : colors.tabIconSelected}
        />
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );

  return (
    <PressableScale onPress={onPress} haptic style={styles.wrapper}>
      {selected ? (
        <LinearGradient
          colors={NeonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.chip, styles.borderless]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.chip,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: BorderRadius.full },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  borderless: { borderColor: "transparent" },
  content: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: { fontSize: 13, fontWeight: "600" },
});
