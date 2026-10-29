import { EqualizerBars } from "@/components/ui/EqualizerBars";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import {
  useMusicPlayer,
  usePlaybackStatus,
} from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { SongArtwork } from "./SongArtwork";

const SWIPE_THRESHOLD = 70;

// Floating glass card above the tab bar. Tap or swipe up to open the full
// player; swipe left/right to change track.
export function MiniPlayer() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { currentSong, isPlaying, togglePlayPause, next, previous } =
    useMusicPlayer();
  const { position, duration } = usePlaybackStatus();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const openPlayer = () => router.push("/now-playing");
  const skip = (dir: "next" | "previous") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (dir === "next") next();
    else previous();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = Math.min(e.translationY, 0) * 0.4;
    })
    .onEnd((e) => {
      if (
        e.translationY < -SWIPE_THRESHOLD / 2 &&
        Math.abs(e.translationX) < SWIPE_THRESHOLD
      ) {
        runOnJS(openPlayer)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(skip)("next");
      } else if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(skip)("previous");
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: 1 - Math.min(Math.abs(translateX.value) / 300, 0.4),
  }));

  if (!currentSong) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutDown}
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.miniPlayerBackground,
              borderColor: colors.glassBorder,
            },
            cardStyle,
          ]}
        >
          <Pressable style={styles.content} onPress={openPlayer}>
            <SongArtwork
              song={currentSong}
              size={44}
              borderRadius={BorderRadius.md}
            />

            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {currentSong.title}
                </Text>
              </View>
              <View style={styles.titleRow}>
                <EqualizerBars
                  playing={isPlaying}
                  color={colors.tabIconSelected}
                  size={10}
                />
                <Text
                  style={[styles.artist, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {currentSong.artist}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={togglePlayPause}
              hitSlop={8}
              style={styles.playBtn}
            >
              <LinearGradient
                colors={NeonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playBtnFill}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color="#FFFFFF"
                  style={!isPlaying ? { marginLeft: 2 } : undefined}
                />
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => skip("next")}
              hitSlop={8}
              style={styles.nextBtn}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={colors.text}
              />
            </Pressable>
          </Pressable>

          {/* Progress line along the bottom edge */}
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <LinearGradient
              colors={NeonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    gap: Spacing.md,
  },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  artist: { fontSize: 12, flexShrink: 1 },
  playBtn: { borderRadius: 20 },
  playBtnFill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: { padding: Spacing.xs },
  progressTrack: { height: 2, width: "100%" },
  progressFill: { height: "100%" },
});
