import { AddToPlaylistModal } from "@/components/music/AddToPlaylistModal";
import { SearchBar } from "@/components/music/SearchBar";
import { SongItem } from "@/components/music/SongItem";
import { SongArtwork } from "@/components/music/SongArtwork";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { PressableScale } from "@/components/ui/PressableScale";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SortBy, type Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
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
    () => (q ? albums.filter((a) => a.name.toLowerCase().includes(q)) : albums),
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

  // Only the first screenful animates in; deeper rows render instantly.
  const enterFor = (index: number) =>
    index < 12 ? FadeInDown.delay(index * 30).duration(280) : undefined;

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <Animated.View entering={enterFor(index)}>
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
    </Animated.View>
  );

  const renderGroupItem = ({
    item,
    index,
  }: {
    item: GroupEntry;
    index: number;
  }) => {
    const cover = item.items.find((s) => s.artwork);
    return (
      <Animated.View entering={enterFor(index)}>
        <PressableScale
          style={[
            styles.groupRow,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
          onPress={() => setSelectedGroup(item.name)}
        >
          {cover ? (
            <SongArtwork
              song={cover}
              size={48}
              borderRadius={viewMode === "artists" ? 24 : BorderRadius.md}
            />
          ) : (
            <View
              style={[
                styles.groupIcon,
                { backgroundColor: colors.card },
                viewMode === "artists" && { borderRadius: 24 },
              ]}
            >
              <Ionicons
                name={viewMode === "albums" ? "disc-outline" : "person-outline"}
                size={22}
                color={colors.tabIconSelected}
              />
            </View>
          )}
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
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </PressableScale>
      </Animated.View>
    );
  };

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
          <GlassIconButton
            icon="bar-chart"
            size={38}
            onPress={() => router.push("/stats")}
            accessibilityLabel="Estadísticas"
          />
          <GlassIconButton
            icon="folder-open-outline"
            size={38}
            onPress={pickMusicFiles}
            accessibilityLabel="Importar archivos"
          />
          <GlassIconButton
            icon="refresh-outline"
            size={38}
            onPress={loadDeviceMusic}
            accessibilityLabel="Escanear música"
          >
            {isLoadingLibrary ? (
              <ActivityIndicator size="small" color={colors.tabIconSelected} />
            ) : undefined}
          </GlassIconButton>
        </View>
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* View mode segmented control */}
      <SegmentedControl
        style={styles.segment}
        value={viewMode}
        onChange={handleSwitchMode}
        options={
          [
            { key: "songs", label: "Canciones" },
            { key: "albums", label: "Álbumes" },
            { key: "artists", label: "Artistas" },
          ] as const
        }
      />

      {/* Group detail header */}
      {selectedGroup ? (
        <Animated.View entering={FadeIn} style={styles.groupBack}>
          <GlassIconButton
            icon="arrow-back"
            size={36}
            onPress={() => {
              setSelectedGroup(null);
              setSearch("");
            }}
            accessibilityLabel="Volver"
          />
          <Text
            style={[styles.groupBackText, { color: colors.text }]}
            numberOfLines={1}
          >
            {selectedGroup}
          </Text>
        </Animated.View>
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
              <Chip
                label="Todos"
                selected={!selectedGenre}
                onPress={() => setSelectedGenre(null)}
              />
              {genres.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  selected={selectedGenre === genre}
                  onPress={() =>
                    setSelectedGenre(selectedGenre === genre ? null : genre)
                  }
                />
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
                <Chip
                  label="Aleatorio"
                  icon="shuffle"
                  onPress={handleShuffleAll}
                />
                <Chip
                  label={getSortLabel()}
                  icon="swap-vertical"
                  onPress={cycleSortBy}
                />
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  const listContentStyle = styles.listContent;

  const emptyLibrary = (
    <EmptyState
      icon={q ? "search-outline" : "musical-notes-outline"}
      title={q ? "Sin resultados" : "Tu biblioteca está vacía"}
      subtitle={
        q
          ? `No hay nada que coincida con "${search.trim()}".`
          : "Escanea tu dispositivo o importa archivos de audio."
      }
    >
      {!q && (
        <Chip
          label="Escanear música"
          icon="refresh"
          selected
          onPress={loadDeviceMusic}
        />
      )}
    </EmptyState>
  );

  return (
    <View style={styles.container}>
      {header}
      {selectedGroup ? (
        <FlatList
          data={selectedGroupSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={listContentStyle}
          ListEmptyComponent={emptyLibrary}
          showsVerticalScrollIndicator={false}
        />
      ) : viewMode === "songs" ? (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={listContentStyle}
          ListEmptyComponent={emptyLibrary}
          showsVerticalScrollIndicator={false}
        />
      ) : viewMode === "albums" ? (
        <FlatList
          data={filteredAlbums}
          keyExtractor={(item) => item.name}
          renderItem={renderGroupItem}
          contentContainerStyle={listContentStyle}
          ListEmptyComponent={emptyLibrary}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredArtists}
          keyExtractor={(item) => item.name}
          renderItem={renderGroupItem}
          contentContainerStyle={listContentStyle}
          ListEmptyComponent={emptyLibrary}
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
  logo: { width: 34, height: 34, borderRadius: 10 },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: Spacing.sm },
  iconBtn: { padding: Spacing.sm },
  segment: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  groupBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  groupBackText: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
  genreScroll: { maxHeight: 44, marginBottom: Spacing.xs },
  genreContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  songCount: { fontSize: 13 },
  sortActions: { flexDirection: "row", gap: Spacing.sm },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: "600" },
  groupCount: { fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: Spacing.lg, flexGrow: 1 },
});
