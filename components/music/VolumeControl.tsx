import { NeonSlider } from "@/components/ui/NeonSlider";
import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function VolumeControl() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { volume, setVolume, isMuted, toggleMute } = useMusicPlayer();

  const getVolumeIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isMuted || volume === 0) return "volume-mute";
    if (volume < 0.5) return "volume-low";
    return "volume-medium";
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleMute} hitSlop={8} style={styles.iconBtn}>
        <Ionicons
          name={getVolumeIcon()}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
      <NeonSlider
        style={styles.slider}
        value={isMuted ? 0 : volume}
        maximumValue={1}
        onSlidingComplete={setVolume}
      />
      <Ionicons name="volume-high" size={18} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  slider: {
    flex: 1,
  },
});
