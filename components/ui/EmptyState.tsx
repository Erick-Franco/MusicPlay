import { Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  children,
}: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      <LinearGradient
        colors={[NeonGradient[0] + "33", NeonGradient[1] + "22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconCircle, { borderColor: colors.glassBorder }]}
      >
        <Ionicons name={icon} size={36} color={colors.tabIconSelected} />
      </LinearGradient>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl * 1.5,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actions: { marginTop: Spacing.md },
});
