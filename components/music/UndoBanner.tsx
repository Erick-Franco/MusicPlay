import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function UndoBanner() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { undoMessage, undoLast, dismissUndo } = useMusicPlayer();

  if (!undoMessage) return null;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 76,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={1}>
        {undoMessage}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={undoLast}
          style={styles.undoBtn}
          hitSlop={8}
        >
          <Text style={[styles.undoText, { color: colors.accent }]}>
            Deshacer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={dismissUndo} style={styles.closeBtn} hitSlop={8}>
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 100,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    marginRight: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  undoBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.xs },
  undoText: { fontSize: 14, fontWeight: "700" },
  closeBtn: { padding: Spacing.xs },
  closeText: { fontSize: 14 },
});
