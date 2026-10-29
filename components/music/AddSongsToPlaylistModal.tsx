import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { GradientPill } from "@/components/ui/PlayShuffleButtons";
import { PressableScale } from "@/components/ui/PressableScale";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration } from "@/utils/musicScanner";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchBar } from "./SearchBar";
import { SongArtwork } from "./SongArtwork";

interface AddSongsToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  playlistId: string;
}

export function AddSongsToPlaylistModal({
  visible,
  onClose,
  playlistId,
}: AddSongsToPlaylistModalProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { songs, playlists, addSongToPlaylist } = useMusicPlayer();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const playlist = playlists.find((p) => p.id === playlistId);
  const existingSongIds = new Set(playlist?.songIds || []);

  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
    );
  }, [songs, search]);

  const toggleSelect = (songId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const handleAdd = () => {
    selectedIds.forEach((songId) => {
      addSongToPlaylist(playlistId, songId);
    });
    setSelectedIds(new Set());
    setSearch("");
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearch("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <ScreenBackground style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <GlassIconButton
            icon="close"
            onPress={handleClose}
            accessibilityLabel="Cerrar"
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.text }]}>
              Agregar canciones
            </Text>
            {playlist && (
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                a {playlist.name}
              </Text>
            )}
          </View>
        </View>

        <SearchBar value={search} onChangeText={setSearch} />

        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const alreadyIn = existingSongIds.has(item.id);
            const isSelected = selectedIds.has(item.id);
            return (
              <PressableScale
                pressedScale={0.98}
                style={[
                  styles.songRow,
                  isSelected && {
                    backgroundColor: colors.glass,
                    borderColor: colors.accent + "66",
                  },
                  alreadyIn && styles.disabled,
                ]}
                onPress={() => !alreadyIn && toggleSelect(item.id)}
                disabled={alreadyIn}
              >
                {isSelected || alreadyIn ? (
                  <Animated.View entering={ZoomIn.springify().damping(12)}>
                    <LinearGradient
                      colors={
                        alreadyIn ? [colors.card, colors.card] : NeonGradient
                      }
                      style={styles.checkbox}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={alreadyIn ? colors.textSecondary : "#FFFFFF"}
                      />
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  <View
                    style={[
                      styles.checkbox,
                      styles.checkboxEmpty,
                      { borderColor: colors.textSecondary },
                    ]}
                  />
                )}

                <SongArtwork
                  song={item}
                  size={44}
                  borderRadius={BorderRadius.md}
                />

                <View style={styles.info}>
                  <Text
                    style={[styles.songTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.songArtist, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {alreadyIn ? "Ya está en la playlist" : item.artist}
                  </Text>
                </View>

                <Text
                  style={[styles.duration, { color: colors.textSecondary }]}
                >
                  {formatDuration(item.duration)}
                </Text>
              </PressableScale>
            );
          }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Floating confirm button appears once something is selected */}
        {selectedIds.size > 0 && (
          <Animated.View
            entering={FadeInDown.springify().damping(16)}
            exiting={FadeOutDown.duration(150)}
            style={[styles.confirm, { bottom: insets.bottom + Spacing.lg }]}
          >
            <GradientPill
              icon="add"
              label={`Agregar ${selectedIds.size} ${selectedIds.size === 1 ? "canción" : "canciones"}`}
              onPress={handleAdd}
            />
          </Animated.View>
        )}
      </ScreenBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  headerInfo: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 2 },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "transparent",
    gap: Spacing.md,
  },
  disabled: { opacity: 0.5 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxEmpty: { borderWidth: 2 },
  info: { flex: 1, gap: 2 },
  songTitle: { fontSize: 15, fontWeight: "600" },
  songArtist: { fontSize: 12 },
  duration: { fontSize: 12, fontVariant: ["tabular-nums"] },
  confirm: { position: "absolute", alignSelf: "center" },
});
