import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Height of the floating tab bar + mini player, so the toast clears them.
const BOTTOM_CHROME = 150;

export function UndoBanner() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { undoMessage, undoLast, dismissUndo } = useMusicPlayer();

  if (!undoMessage) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutDown.duration(180)}
      style={[
        styles.container,
        {
          bottom: insets.bottom + BOTTOM_CHROME,
          backgroundColor: colors.glassStrong,
          borderColor: colors.glassBorder,
        },
      ]}
    >
      <Ionicons
        name="information-circle"
        size={20}
        color={colors.tabIconSelected}
      />
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={1}>
        {undoMessage}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={undoLast}
          style={[styles.undoBtn, { backgroundColor: colors.accent + "26" }]}
          hitSlop={8}
        >
          <Text style={[styles.undoText, { color: colors.tabIconSelected }]}>
            Deshacer
          </Text>
        </Pressable>
        <Pressable
          onPress={dismissUndo}
          hitSlop={8}
          accessibilityLabel="Cerrar"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
    zIndex: 100,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  undoBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  undoText: { fontSize: 13, fontWeight: "700" },
});
