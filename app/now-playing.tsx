import { PlayerControls } from "@/components/music/PlayerControls";
import { ProgressBar } from "@/components/music/ProgressBar";
import { SleepTimerModal } from "@/components/music/SleepTimerModal";
import { SongArtwork } from "@/components/music/SongArtwork";
import { SpeedControl } from "@/components/music/SpeedControl";
import { VolumeControl } from "@/components/music/VolumeControl";
import { AnimatedHeart } from "@/components/ui/AnimatedHeart";
import { PressableScale } from "@/components/ui/PressableScale";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SWIPE_X = 80;
const SWIPE_DOWN = 120;

export default function NowPlayingScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const {
    currentSong,
    isPlaying,
    next,
    previous,
    toggleFavorite,
    isFavorite,
    sleepTimerRemaining,
  } = useMusicPlayer();
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  const artworkSize = Math.min(screenWidth - Spacing.xxl * 2, 340);

  // Artwork "breathes": full size while playing, shrinks a bit when paused.
  const playScale = useSharedValue(isPlaying ? 1 : 0.86);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    playScale.value = withSpring(isPlaying ? 1 : 0.86, {
      damping: 14,
      stiffness: 120,
    });
  }, [isPlaying, playScale]);

  const close = () => router.back();
  const skip = (dir: "next" | "previous") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (dir === "next") next();
    else previous();
  };

  // Swipe the artwork sideways to change track, or down to close.
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = Math.max(e.translationY, 0);
    })
    .onEnd((e) => {
      if (e.translationY > SWIPE_DOWN && Math.abs(e.translationX) < SWIPE_X) {
        runOnJS(close)();
      } else if (e.translationX < -SWIPE_X) {
        runOnJS(skip)("next");
      } else if (e.translationX > SWIPE_X) {
        runOnJS(skip)("previous");
      }
      dragX.value = withSpring(0, { damping: 16 });
      dragY.value = withTiming(0, { duration: 200 });
    });

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value * 0.5 },
      { rotate: `${dragX.value / 40}deg` },
      { scale: playScale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + (0.4 * (playScale.value - 0.86)) / 0.14,
    transform: [{ scale: playScale.value * 1.05 }],
  }));

  if (!currentSong) {
    return (
      <ScreenBackground style={styles.empty}>
        <Ionicons
          name="musical-notes-outline"
          size={56}
          color={colors.textSecondary}
        />
        <Text style={[styles.noSong, { color: colors.textSecondary }]}>
          No hay canción reproduciéndose
        </Text>
      </ScreenBackground>
    );
  }

  const formatTimerRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fav = isFavorite(currentSong.id);

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      {/* Ambient light taken from the cover itself */}
      {currentSong.artwork && (
        <Image
          source={{ uri: currentSong.artwork }}
          blurRadius={60}
          style={[StyleSheet.absoluteFill, styles.ambient]}
        />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background + "99", "transparent", colors.background]}
        locations={[0, 0.3, 0.75]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <PressableScale
          onPress={close}
          style={[
            styles.headerBtn,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
          accessibilityLabel="Cerrar"
        >
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
            Reproduciendo
          </Text>
          {currentSong.album ? (
            <Text
              style={[styles.headerAlbum, { color: colors.text }]}
              numberOfLines={1}
            >
              {currentSong.album}
            </Text>
          ) : null}
        </View>
        <PressableScale
          onPress={() => router.push("/queue")}
          style={[
            styles.headerBtn,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
          accessibilityLabel="Cola de reproducción"
        >
          <Ionicons name="list" size={20} color={colors.text} />
        </PressableScale>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <GestureDetector gesture={pan}>
          <Animated.View style={artworkStyle}>
            {/* Neon halo behind the cover */}
            <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
              <LinearGradient
                colors={[colors.accentGradientStart, colors.accentGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.halo, { borderRadius: BorderRadius.xl + 8 }]}
              />
            </Animated.View>
            <Animated.View key={currentSong.id} entering={FadeIn.duration(350)}>
              <SongArtwork
                song={currentSong}
                size={artworkSize}
                borderRadius={BorderRadius.xl}
                iconSize={90}
                style={[styles.artwork, { borderColor: colors.glassBorder }]}
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Animated.View
          key={currentSong.id}
          entering={FadeInDown.duration(350)}
          style={{ flex: 1 }}
        >
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
        </Animated.View>
        <AnimatedHeart
          active={fav}
          onPress={() => toggleFavorite(currentSong.id)}
          size={28}
        />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar />
      </View>

      {/* Controls */}
      <PlayerControls size="large" />

      {/* Secondary row: speed, volume, sleep timer */}
      <View
        style={[
          styles.bottomRow,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
          },
        ]}
      >
        <View
          style={[
            styles.glassPanel,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
        >
          <SpeedControl />
          <View style={{ flex: 1 }}>
            <VolumeControl />
          </View>
          <PressableScale
            onPress={() => setShowSleepTimer(true)}
            haptic
            style={[
              styles.timerBtn,
              sleepTimerRemaining !== null && {
                backgroundColor: colors.accent + "26",
              },
            ]}
            accessibilityLabel="Temporizador de sueño"
          >
            <Ionicons
              name={sleepTimerRemaining !== null ? "moon" : "moon-outline"}
              size={18}
              color={
                sleepTimerRemaining !== null
                  ? colors.tabIconSelected
                  : colors.textSecondary
              }
            />
            {sleepTimerRemaining !== null && (
              <Text
                style={[styles.timerBadge, { color: colors.tabIconSelected }]}
              >
                {formatTimerRemaining(sleepTimerRemaining)}
              </Text>
            )}
          </PressableScale>
        </View>
      </View>

      <SleepTimerModal
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", gap: Spacing.md },
  noSong: { fontSize: 16 },
  ambient: { opacity: 0.55 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerAlbum: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  artworkContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: { flex: 1, margin: -8, opacity: 0.6 },
  artwork: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  songInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  songTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  songArtist: { fontSize: 16, marginTop: 4 },
  progressContainer: { paddingHorizontal: Spacing.sm },
  bottomRow: { paddingHorizontal: Spacing.lg },
  glassPanel: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  timerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  timerBadge: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
