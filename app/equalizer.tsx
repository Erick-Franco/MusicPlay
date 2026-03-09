import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EQ_PRESETS = [
  { name: "Normal", icon: "remove-outline" as const, bands: [0, 0, 0, 0, 0] },
  { name: "Rock", icon: "flame-outline" as const, bands: [4, 2, -1, 2, 4] },
  { name: "Pop", icon: "sparkles-outline" as const, bands: [1, 3, 4, 3, 1] },
  { name: "Jazz", icon: "cafe-outline" as const, bands: [3, 1, -1, 1, 3] },
  {
    name: "Bass Boost",
    icon: "volume-high-outline" as const,
    bands: [6, 4, 1, 0, 0],
  },
  {
    name: "Electrónica",
    icon: "flash-outline" as const,
    bands: [4, 2, 0, 2, 5],
  },
  {
    name: "Clásica",
    icon: "musical-notes-outline" as const,
    bands: [3, 1, -1, 2, 4],
  },
  { name: "Vocal", icon: "mic-outline" as const, bands: [-1, 0, 4, 3, 1] },
];

const BAND_LABELS = ["60Hz", "230Hz", "910Hz", "3.6kHz", "14kHz"];

export default function EqualizerScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { equalizerPreset, setEqualizerPreset } = useMusicPlayer();

  const [selectedPreset, setSelectedPreset] = useState(
    equalizerPreset || "Normal",
  );
  const currentPreset =
    EQ_PRESETS.find((p) => p.name === selectedPreset) || EQ_PRESETS[0];
  const [bands, setBands] = useState(currentPreset.bands);

  const selectPreset = (preset: (typeof EQ_PRESETS)[0]) => {
    setSelectedPreset(preset.name);
    setBands([...preset.bands]);
    setEqualizerPreset(preset.name);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ecualizador</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info notice */}
        <View
          style={[styles.infoNotice, { backgroundColor: colors.accent + "12" }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.accent}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            El ecualizador visual muestra el perfil de sonido del preset
            seleccionado. Los efectos de audio reales requieren un build nativo
            con módulos de EQ.
          </Text>
        </View>

        {/* Visual EQ bands */}
        <View style={styles.eqContainer}>
          <View style={styles.bandsRow}>
            {bands.map((val, idx) => (
              <View key={idx} style={styles.bandCol}>
                <Text style={[styles.bandValue, { color: colors.accent }]}>
                  {val > 0 ? `+${val}` : val}
                </Text>
                <View
                  style={[styles.bandTrack, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.bandFill,
                      {
                        backgroundColor: colors.accent,
                        height: `${((val + 6) / 12) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.bandLabel, { color: colors.textSecondary }]}
                >
                  {BAND_LABELS[idx]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Presets */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Presets
        </Text>
        <View style={styles.presetGrid}>
          {EQ_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.presetCard,
                {
                  backgroundColor:
                    selectedPreset === preset.name
                      ? colors.accent + "20"
                      : colors.card,
                  borderColor:
                    selectedPreset === preset.name
                      ? colors.accent
                      : "transparent",
                },
              ]}
              onPress={() => selectPreset(preset)}
            >
              <Ionicons
                name={preset.icon}
                size={24}
                color={
                  selectedPreset === preset.name
                    ? colors.accent
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.presetName,
                  {
                    color:
                      selectedPreset === preset.name
                        ? colors.accent
                        : colors.text,
                  },
                ]}
              >
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  title: { fontSize: 17, fontWeight: "700" },
  scrollContent: { paddingBottom: 40 },
  infoNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 16 },
  eqContainer: { padding: Spacing.xl, paddingTop: Spacing.lg },
  bandsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
  },
  bandCol: { alignItems: "center", flex: 1, gap: Spacing.xs },
  bandValue: { fontSize: 12, fontWeight: "600" },
  bandTrack: {
    width: 24,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bandFill: { width: "100%", borderRadius: 12 },
  bandLabel: { fontSize: 10, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  presetCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  presetName: { fontSize: 14, fontWeight: "600" },
});
