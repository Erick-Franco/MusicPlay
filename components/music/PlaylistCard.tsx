import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onDelete?: () => void;
}

export function PlaylistCard({
  playlist,
  onPress,
  onDelete,
}: PlaylistCardProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.accent + "20" },
        ]}
      >
        <Ionicons name="musical-notes" size={28} color={colors.accent} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {playlist.songIds.length}{" "}
          {playlist.songIds.length === 1 ? "canción" : "canciones"}
        </Text>
      </View>

      {/* Delete */}
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      )}

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  count: {
    fontSize: 13,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
});
