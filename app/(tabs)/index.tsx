import { AddToPlaylistModal } from "@/components/music/AddToPlaylistModal";
import { SearchBar } from "@/components/music/SearchBar";
import { SongItem } from "@/components/music/SongItem";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SortBy, type Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewMode = "songs" | "albums" | "artists";

interface GroupEntry {
  name: string;
  items: Song[];
}

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    songs,
    currentSong,
    playSong,
    isLoadingLibrary,
    loadDeviceMusic,
    pickMusicFiles,
    toggleFavorite,
    isFavorite,
    toggleShuffle,
    isShuffleOn,
  } = useMusicPlayer();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SortBy.TITLE);
  const [addToPlaylistSongId, setAddToPlaylistSongId] = useState<string | null>(
    null,
  );
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("songs");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const q = search.trim().toLowerCase();

  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    songs.forEach((s) => {
      if (s.genre) genreSet.add(s.genre);
    });
    return Array.from(genreSet).sort();
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let result = [...songs];
    if (selectedGenre) result = result.filter((s) => s.genre === selectedGenre);
    if (q) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q),
      );
    }
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
  }, [songs, q, sortBy, selectedGenre]);

  const groupBy = useCallback(
    (getKey: (s: Song) => string): GroupEntry[] => {
      const map = new Map<string, Song[]>();
      songs.forEach((s) => {
        const key = getKey(s);
        const arr = map.get(key) ?? [];
        arr.push(s);
        map.set(key, arr);
      });
      return Array.from(map.entries())
        .map(([name, items]) => ({ name, items }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    [songs],
  );

  const albums = useMemo(
    () => groupBy((s) => s.album || "Álbum desconocido"),
    [groupBy],
  );
  const artists = useMemo(
    () => groupBy((s) => s.artist || "Artista desconocido"),
    [groupBy],
  );

  const filteredAlbums = useMemo(
    () =>
      q ? albums.filter((a) => a.name.toLowerCase().includes(q)) : albums,
    [albums, q],
  );
  const filteredArtists = useMemo(
    () =>
      q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : artists,
    [artists, q],
  );

  const selectedGroupSongs = useMemo(() => {
    if (!selectedGroup) return [] as Song[];
    const source = viewMode === "albums" ? albums : artists;
    const group = source.find((g) => g.name === selectedGroup);
    if (!group) return [] as Song[];
    let result = [...group.items];
    if (q) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q),
      );
    }
    return result;
  }, [selectedGroup, viewMode, albums, artists, q]);

  const handleSwitchMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedGroup(null);
    setSelectedGenre(null);
  };

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

  const handleShuffleAll = () => {
    if (filteredSongs.length === 0) return;
    if (!isShuffleOn) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * filteredSongs.length);
    playSong(filteredSongs[randomIdx], filteredSongs);
  };

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

  const renderSongItem = ({ item }: { item: Song }) => (
    <SongItem
      song={item}
      isActive={currentSong?.id === item.id}
      onPress={() =>
        playSong(item, selectedGroup ? selectedGroupSongs : filteredSongs)
      }
      onLongPress={() => setAddToPlaylistSongId(item.id)}
      showFavorite
      isFavorite={isFavorite(item.id)}
      onToggleFavorite={() => toggleFavorite(item.id)}
    />
  );

  const renderGroupItem = ({ item }: { item: GroupEntry }) => (
    <TouchableOpacity
      style={[styles.groupRow, { borderBottomColor: colors.border }]}
      onPress={() => setSelectedGroup(item.name)}
      activeOpacity={0.7}
    >
      <View style={[styles.groupIcon, { backgroundColor: colors.card }]}>
        <Ionicons
          name={viewMode === "albums" ? "disc-outline" : "person-outline"}
          size={20}
          color={colors.accent}
        />
      </View>
      <View style={styles.groupInfo}>
        <Text
          style={[styles.groupName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.groupCount, { color: colors.textSecondary }]}>
          {item.items.length} canciones
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const header = (
    <View>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/logomusic.png")}
            style={styles.logo}
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            MusicPlay
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push("/stats")}
            style={styles.iconBtn}
            accessibilityLabel="Estadísticas"
          >
            <Ionicons name="bar-chart" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickMusicFiles} style={styles.iconBtn}>
            <Ionicons
              name="folder-open-outline"
              size={22}
              color={colors.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadDeviceMusic} style={styles.iconBtn}>
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

      {/* View mode segmented control */}
      <View style={styles.segmentRow}>
        {(
          [
            { key: "songs", label: "Canciones" },
            { key: "albums", label: "Álbumes" },
            { key: "artists", label: "Artistas" },
          ] as const
        ).map((mode) => (
          <TouchableOpacity
            key={mode.key}
            onPress={() => handleSwitchMode(mode.key)}
            style={[
              styles.segmentBtn,
              {
                backgroundColor:
                  viewMode === mode.key ? colors.accent : colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    viewMode === mode.key ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Group detail header */}
      {selectedGroup ? (
        <TouchableOpacity
          style={styles.groupBack}
          onPress={() => {
            setSelectedGroup(null);
            setSearch("");
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text
            style={[styles.groupBackText, { color: colors.text }]}
            numberOfLines={1}
          >
            {selectedGroup}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Genre chips */}
          {viewMode === "songs" && genres.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.genreScroll}
              contentContainerStyle={styles.genreContent}
            >
              <TouchableOpacity
                style={[
                  styles.genreChip,
                  {
                    backgroundColor: !selectedGenre
                      ? colors.accent
                      : colors.card,
                  },
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
                      {
                        color: selectedGenre === genre ? "#FFF" : colors.text,
                      },
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Sort + Shuffle controls (songs mode) */}
          {viewMode === "songs" && (
            <View style={styles.sortBar}>
              <Text style={[styles.songCount, { color: colors.textSecondary }]}>
                {filteredSongs.length} canciones
              </Text>
              <View style={styles.sortActions}>
                <TouchableOpacity
                  onPress={handleShuffleAll}
                  style={styles.shuffleAllBtn}
                >
                  <Ionicons name="shuffle" size={16} color={colors.accent} />
                  <Text style={[styles.sortLabel, { color: colors.accent }]}>
                    Aleatorio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cycleSortBy} style={styles.sortBtn}>
                  <Ionicons
                    name="swap-vertical"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={[styles.sortLabel, { color: colors.accent }]}>
                    {getSortLabel()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  const listContentStyle = [
    styles.listContent,
    { paddingBottom: insets.bottom + 100 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedGroup ? (
        <FlatList
          data={selectedGroupSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          ListHeaderComponent={header}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      ) : viewMode === "songs" ? (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          ListHeaderComponent={header}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      ) : viewMode === "albums" ? (
        <FlatList
          data={filteredAlbums}
          keyExtractor={(item) => item.name}
          renderItem={renderGroupItem}
          ListHeaderComponent={header}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredArtists}
          keyExtractor={(item) => item.name}
          renderItem={renderGroupItem}
          ListHeaderComponent={header}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      )}

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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  logo: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: Spacing.sm },
  iconBtn: { padding: Spacing.sm },
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  segmentText: { fontSize: 14, fontWeight: "600" },
  groupBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  groupBackText: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
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
  sortActions: { flexDirection: "row", gap: Spacing.md },
  shuffleAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: Spacing.xs,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: Spacing.xs,
  },
  sortLabel: { fontSize: 13, fontWeight: "600" },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: "600" },
  groupCount: { fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: 120 },
});
