import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { playlists, addSongToPlaylist, createPlaylist } = useMusicPlayer();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSelect = (playlistId: string) => {
    addSongToPlaylist(playlistId, songId);
    onClose();
  };

  const handleCreateAndAdd = () => {
    if (newName.trim()) {
      const id = Date.now().toString();
      createPlaylist(newName.trim());
      // Find newly created playlist and add song
      setTimeout(() => {
        addSongToPlaylist(id, songId);
      }, 100);
      setNewName("");
      setShowCreate(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Agregar a Playlist
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Create new playlist inline */}
          {showCreate ? (
            <View
              style={[styles.createRow, { borderBottomColor: colors.border }]}
            >
              <TextInput
                style={[
                  styles.createInput,
                  { color: colors.text, backgroundColor: colors.card },
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Nombre de la playlist"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleCreateAndAdd}
                disabled={!newName.trim()}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={30}
                  color={newName.trim() ? colors.accent : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowCreate(false);
                  setNewName("");
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={30}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.createBtn, { borderBottomColor: colors.border }]}
              onPress={() => setShowCreate(true)}
            >
              <View
                style={[styles.createIcon, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.createText, { color: colors.accent }]}>
                Crear nueva playlist
              </Text>
            </TouchableOpacity>
          )}

          {playlists.length === 0 && !showCreate ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Crea tu primera playlist arriba
              </Text>
            </View>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const alreadyAdded = item.songIds.includes(songId);
                return (
                  <TouchableOpacity
                    style={[styles.item, { borderBottomColor: colors.border }]}
                    onPress={() => !alreadyAdded && handleSelect(item.id)}
                    disabled={alreadyAdded}
                  >
                    <Ionicons
                      name="musical-notes"
                      size={22}
                      color={
                        alreadyAdded ? colors.textSecondary : colors.accent
                      }
                    />
                    <Text
                      style={[
                        styles.itemText,
                        {
                          color: alreadyAdded
                            ? colors.textSecondary
                            : colors.text,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {alreadyAdded && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: "65%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: "700" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  createIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  createText: { fontSize: 15, fontWeight: "600" },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  createInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  empty: { alignItems: "center", padding: Spacing.xxl },
  emptyText: { fontSize: 15 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  itemText: { flex: 1, fontSize: 15, fontWeight: "500" },
});
