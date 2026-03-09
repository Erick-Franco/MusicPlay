import { AddToPlaylistModal } from "@/components/music/AddToPlaylistModal";
import { SearchBar } from "@/components/music/SearchBar";
import { SongItem } from "@/components/music/SongItem";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SortBy } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const {
    songs,
    currentSong,
    playSong,
    isLoadingLibrary,
    loadDeviceMusic,
    pickMusicFiles,
    toggleFavorite,
    isFavorite,
  } = useMusicPlayer();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SortBy.TITLE);
  const [addToPlaylistSongId, setAddToPlaylistSongId] = useState<string | null>(
    null,
  );
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Extract unique genres from songs
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    songs.forEach((s) => {
      if (s.genre) genreSet.add(s.genre);
    });
    return Array.from(genreSet).sort();
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let result = [...songs];
    // Genre filter
    if (selectedGenre) {
      result = result.filter((s) => s.genre === selectedGenre);
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q),
      );
    }
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case SortBy.TITLE:
          return a.title.localeCompare(b.title);
        case SortBy.ARTIST:
          return a.artist.localeCompare(b.artist);
        case SortBy.ALBUM:
          return a.album.localeCompare(b.album);
      }
    });
    return result;
  }, [songs, search, sortBy, selectedGenre]);

  const cycleSortBy = useCallback(() => {
    setSortBy((prev) => {
      switch (prev) {
        case SortBy.TITLE:
          return SortBy.ARTIST;
        case SortBy.ARTIST:
          return SortBy.ALBUM;
        case SortBy.ALBUM:
          return SortBy.TITLE;
      }
    });
  }, []);

  const getSortLabel = () => {
    switch (sortBy) {
      case SortBy.TITLE:
        return "Título";
      case SortBy.ARTIST:
        return "Artista";
      case SortBy.ALBUM:
        return "Álbum";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Biblioteca
        </Text>
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <TouchableOpacity onPress={pickMusicFiles} style={styles.scanBtn}>
            <Ionicons
              name="folder-open-outline"
              size={22}
              color={colors.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadDeviceMusic} style={styles.scanBtn}>
            {isLoadingLibrary ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={22}
                color={colors.accent}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* Genre chips */}
      {genres.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreScroll}
          contentContainerStyle={styles.genreContent}
        >
          <TouchableOpacity
            style={[
              styles.genreChip,
              { backgroundColor: !selectedGenre ? colors.accent : colors.card },
            ]}
            onPress={() => setSelectedGenre(null)}
          >
            <Text
              style={[
                styles.genreText,
                { color: !selectedGenre ? "#FFF" : colors.text },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreChip,
                {
                  backgroundColor:
                    selectedGenre === genre ? colors.accent : colors.card,
                },
              ]}
              onPress={() =>
                setSelectedGenre(selectedGenre === genre ? null : genre)
              }
            >
              <Text
                style={[
                  styles.genreText,
                  { color: selectedGenre === genre ? "#FFF" : colors.text },
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Sort controls */}
      <View style={styles.sortBar}>
        <Text style={[styles.songCount, { color: colors.textSecondary }]}>
          {filteredSongs.length} canciones
        </Text>
        <TouchableOpacity onPress={cycleSortBy} style={styles.sortBtn}>
          <Ionicons name="swap-vertical" size={16} color={colors.accent} />
          <Text style={[styles.sortLabel, { color: colors.accent }]}>
            {getSortLabel()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Song list */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongItem
            song={item}
            isActive={currentSong?.id === item.id}
            onPress={() => playSong(item, filteredSongs)}
            onLongPress={() => setAddToPlaylistSongId(item.id)}
            showFavorite
            isFavorite={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {addToPlaylistSongId && (
        <AddToPlaylistModal
          visible={!!addToPlaylistSongId}
          onClose={() => setAddToPlaylistSongId(null)}
          songId={addToPlaylistSongId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  scanBtn: { padding: Spacing.sm },
  genreScroll: { maxHeight: 44, marginBottom: Spacing.xs },
  genreContent: { paddingHorizontal: Spacing.lg, gap: Spacing.xs },
  genreChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
  },
  genreText: { fontSize: 13, fontWeight: "600" },
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  songCount: { fontSize: 13 },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: Spacing.xs,
  },
  sortLabel: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingBottom: 120 },
});
