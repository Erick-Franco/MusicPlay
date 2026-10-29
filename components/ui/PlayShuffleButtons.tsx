import {
  BorderRadius,
  Colors,
  NeonGradient,
  Spacing,
  neonShadow,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "./PressableScale";

interface GradientPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  /** Gradient colors; defaults to the neon violet→pink. */
  gradient?: readonly [string, string];
}

// Primary neon pill button.
export function GradientPill({
  icon,
  label,
  onPress,
  gradient = NeonGradient,
}: GradientPillProps) {
  return (
    <PressableScale
      haptic
      style={[styles.wrap, neonShadow(gradient[1])]}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        <Ionicons name={icon} size={18} color="#FFFFFF" />
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

interface PlayShuffleButtonsProps {
  onPlay: () => void;
  onShuffle: () => void;
  gradient?: readonly [string, string];
}

// "Reproducir" (neon) + "Aleatorio" (glass) pair used on playlist headers.
export function PlayShuffleButtons({
  onPlay,
  onShuffle,
  gradient,
}: PlayShuffleButtonsProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.row}>
      <GradientPill
        icon="play"
        label="Reproducir"
        onPress={onPlay}
        gradient={gradient}
      />
      <PressableScale
        haptic
        style={[
          styles.wrap,
          styles.pill,
          styles.glass,
          { backgroundColor: colors.glass, borderColor: colors.glassBorder },
        ]}
        onPress={onShuffle}
      >
        <Ionicons
          name="shuffle"
          size={18}
          color={gradient?.[0] ?? colors.tabIconSelected}
        />
        <Text style={[styles.secondaryText, { color: colors.text }]}>
          Aleatorio
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.md },
  wrap: { borderRadius: BorderRadius.full },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    minWidth: 140,
  },
  glass: { borderWidth: 1 },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondaryText: { fontSize: 15, fontWeight: "700" },
});
