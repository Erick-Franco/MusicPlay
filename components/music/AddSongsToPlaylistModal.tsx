import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration } from "@/utils/musicScanner";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Agregar canciones
          </Text>
          <TouchableOpacity
            onPress={handleAdd}
            disabled={selectedIds.size === 0}
          >
            <Text
              style={[
                styles.addBtn,
                {
                  color:
                    selectedIds.size > 0 ? colors.accent : colors.textSecondary,
                },
              ]}
            >
              Agregar ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar canciones..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Song list */}
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const alreadyIn = existingSongIds.has(item.id);
            const isSelected = selectedIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.songRow, { borderBottomColor: colors.border }]}
                onPress={() => !alreadyIn && toggleSelect(item.id)}
                disabled={alreadyIn}
                activeOpacity={0.7}
              >
                {/* Checkbox */}
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: alreadyIn
                        ? colors.textSecondary
                        : isSelected
                          ? colors.accent
                          : colors.border,
                      backgroundColor: isSelected
                        ? colors.accent
                        : alreadyIn
                          ? colors.card
                          : "transparent",
                    },
                  ]}
                >
                  {(isSelected || alreadyIn) && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={alreadyIn ? colors.textSecondary : "#FFF"}
                    />
                  )}
                </View>

                {/* Artwork placeholder */}
                <View
                  style={[styles.artwork, { backgroundColor: colors.card }]}
                >
                  <Ionicons
                    name="musical-note"
                    size={16}
                    color={colors.accent}
                  />
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text
                    style={[
                      styles.songTitle,
                      { color: alreadyIn ? colors.textSecondary : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.songArtist, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.artist}
                  </Text>
                </View>

                <Text
                  style={[styles.duration, { color: colors.textSecondary }]}
                >
                  {formatDuration(item.duration)}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  addBtn: {
    fontSize: 15,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    height: 40,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  songArtist: {
    fontSize: 12,
  },
  duration: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
});
