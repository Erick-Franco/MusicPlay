import { GlassSheet } from "@/components/ui/GlassSheet";
import { PressableScale } from "@/components/ui/PressableScale";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PlaylistCover } from "./PlaylistCard";
import { SongArtwork } from "./SongArtwork";

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  songId: string;
}

export function AddToPlaylistModal({
  visible,
  onClose,
  songId,
}: AddToPlaylistModalProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { playlists, songs, addSongToPlaylist, createPlaylist, playNext } =
    useMusicPlayer();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const song = songs.find((s) => s.id === songId);

  const handleSelect = (playlistId: string) => {
    addSongToPlaylist(playlistId, songId);
    onClose();
  };

  const handleCreateAndAdd = () => {
    if (newName.trim()) {
      const id = createPlaylist(newName.trim());
      addSongToPlaylist(id, songId);
      setNewName("");
      setShowCreate(false);
      onClose();
    }
  };

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Agregar a playlist">
      {/* Song being added */}
      {song && (
        <View
          style={[
            styles.songCard,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
        >
          <SongArtwork song={song} size={44} borderRadius={BorderRadius.md} />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.songTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {song.title}
            </Text>
            <Text
              style={[styles.songArtist, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {song.artist}
            </Text>
          </View>
        </View>
      )}

      {showCreate ? (
        <View style={styles.createRow}>
          <TextInput
            style={[
              styles.createInput,
              {
                color: colors.text,
                backgroundColor: colors.glass,
                borderColor: colors.accent + "99",
              },
            ]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Nombre de la playlist"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.accent}
            onSubmitEditing={handleCreateAndAdd}
            returnKeyType="done"
            autoFocus
          />
          <Pressable
            onPress={handleCreateAndAdd}
            disabled={!newName.trim()}
            hitSlop={6}
          >
            <Ionicons
              name="checkmark-circle"
              size={34}
              color={
                newName.trim() ? colors.tabIconSelected : colors.textSecondary
              }
            />
          </Pressable>
          <Pressable
            hitSlop={6}
            onPress={() => {
              setShowCreate(false);
              setNewName("");
            }}
          >
            <Ionicons
              name="close-circle"
              size={34}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <PressableScale
            haptic
            style={[
              styles.action,
              {
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={() => setShowCreate(true)}
          >
            <LinearGradient colors={NeonGradient} style={styles.actionIcon}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Nueva playlist
            </Text>
          </PressableScale>
          {song && (
            <PressableScale
              haptic
              style={[
                styles.action,
                {
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                },
              ]}
              onPress={() => {
                playNext(song);
                onClose();
              }}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: colors.card }]}
              >
                <Ionicons
                  name="play-forward"
                  size={18}
                  color={colors.tabIconSelected}
                />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>
                Reproducir después
              </Text>
            </PressableScale>
          )}
        </View>
      )}

      {playlists.length === 0 && !showCreate ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Aún no tienes playlists. Crea la primera arriba.
        </Text>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const alreadyAdded = item.songIds.includes(songId);
            return (
              <PressableScale
                pressedScale={0.98}
                style={[styles.item, alreadyAdded && styles.itemDisabled]}
                onPress={() => !alreadyAdded && handleSelect(item.id)}
                disabled={alreadyAdded}
              >
                <PlaylistCover songIds={item.songIds} size={44} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.itemText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.itemSub, { color: colors.textSecondary }]}
                  >
                    {alreadyAdded
                      ? "Ya está en esta playlist"
                      : `${item.songIds.length} canciones`}
                  </Text>
                </View>
                <Ionicons
                  name={
                    alreadyAdded ? "checkmark-circle" : "add-circle-outline"
                  }
                  size={24}
                  color={
                    alreadyAdded ? colors.tabIconSelected : colors.textSecondary
                  }
                />
              </PressableScale>
            );
          }}
        />
      )}
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  songTitle: { fontSize: 15, fontWeight: "700" },
  songArtist: { fontSize: 13, marginTop: 2 },
  actions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  createInput: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  emptyText: { fontSize: 14, textAlign: "center", padding: Spacing.xl },
  list: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  itemDisabled: { opacity: 0.6 },
  itemText: { fontSize: 15, fontWeight: "600" },
  itemSub: { fontSize: 12, marginTop: 2 },
});
