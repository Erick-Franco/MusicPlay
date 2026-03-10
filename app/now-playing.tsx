import { PlayerControls } from "@/components/music/PlayerControls";
import { ProgressBar } from "@/components/music/ProgressBar";
import { SleepTimerModal } from "@/components/music/SleepTimerModal";
import { VolumeControl } from "@/components/music/VolumeControl";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NowPlayingScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentSong, toggleFavorite, isFavorite, sleepTimerRemaining } =
    useMusicPlayer();
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  if (!currentSong) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.noSong, { color: colors.textSecondary }]}>
          No hay canción reproduciéndose
        </Text>
      </View>
    );
  }

  const formatTimerRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Reproduciendo
        </Text>
        <View style={styles.headerActions}>
          {/* Sleep timer indicator */}
          {sleepTimerRemaining !== null && (
            <TouchableOpacity
              onPress={() => setShowSleepTimer(true)}
              style={styles.headerBtn}
            >
              <Text style={[styles.timerBadge, { color: colors.accent }]}>
                {formatTimerRemaining(sleepTimerRemaining)}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push("/queue" as any)}
            style={styles.headerBtn}
          >
            <Ionicons name="list" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/equalizer" as any)}
            style={styles.headerBtn}
          >
            <Ionicons name="options-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        {currentSong.artwork ? (
          <Image
            source={{ uri: currentSong.artwork }}
            style={[styles.artwork, { backgroundColor: colors.card }]}
          />
        ) : (
          <View style={[styles.artwork, { backgroundColor: colors.card }]}>
            <Ionicons name="musical-notes" size={80} color={colors.accent} />
          </View>
        )}
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.songTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {currentSong.title}
            </Text>
            <Text
              style={[styles.songArtist, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {currentSong.artist}
            </Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity onPress={() => toggleFavorite(currentSong.id)}>
              <Ionicons
                name={isFavorite(currentSong.id) ? "heart" : "heart-outline"}
                size={26}
                color={
                  isFavorite(currentSong.id)
                    ? colors.danger
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSleepTimer(true)}>
              <Ionicons
                name="moon-outline"
                size={22}
                color={
                  sleepTimerRemaining !== null
                    ? colors.accent
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Volume */}
      <View style={styles.volumeContainer}>
        <VolumeControl />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar />
      </View>

      {/* Controls */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <PlayerControls size="large" />
      </View>

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  noSong: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  headerBtn: { padding: Spacing.xs },
  headerTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerActions: { flexDirection: "row", gap: Spacing.sm },
  timerBadge: { fontSize: 12, fontWeight: "700" },
  artworkContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  songInfo: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  songTitle: { fontSize: 22, fontWeight: "800" },
  songArtist: { fontSize: 15, marginTop: 4 },
  actionBtns: { flexDirection: "row", gap: Spacing.md, alignItems: "center" },
  progressContainer: { paddingHorizontal: Spacing.xl },
  volumeContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
});
