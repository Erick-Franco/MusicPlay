import { BorderRadius, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface SongArtworkProps {
  song: Pick<Song, "artwork">;
  size: number;
  borderRadius?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

export function SongArtwork({
  song,
  size,
  borderRadius = BorderRadius.sm,
  iconSize,
  style,
}: SongArtworkProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  const boxStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      width: size,
      height: size,
      borderRadius,
      backgroundColor: colors.card,
    },
    style,
  ];

  if (song.artwork) {
    return <Image source={{ uri: song.artwork }} style={boxStyle as StyleProp<ImageStyle>} />;
  }

  return (
    <View style={boxStyle}>
      <Ionicons
        name="musical-note"
        size={iconSize ?? Math.round(size * 0.42)}
        color={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});