import { Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function VolumeControl() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { volume, setVolume, isMuted, toggleMute } = useMusicPlayer();

  const getVolumeIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isMuted || volume === 0) return "volume-mute";
    if (volume < 0.5) return "volume-low";
    return "volume-high";
  };

  const onValueChange = useCallback(
    (val: number) => {
      setVolume(val);
    },
    [setVolume],
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMute} style={styles.iconBtn}>
        <Ionicons
          name={getVolumeIcon()}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      <Slider
        style={styles.slider}
        value={isMuted ? 0 : volume}
        minimumValue={0}
        maximumValue={1}
        onSlidingComplete={onValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
      <Ionicons name="volume-high" size={20} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
