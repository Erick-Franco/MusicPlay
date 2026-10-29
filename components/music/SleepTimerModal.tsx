import { GlassSheet } from "@/components/ui/GlassSheet";
import { PressableScale } from "@/components/ui/PressableScale";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const TIMER_OPTIONS = [
  { label: "5", unit: "min", minutes: 5 },
  { label: "10", unit: "min", minutes: 10 },
  { label: "15", unit: "min", minutes: 15 },
  { label: "30", unit: "min", minutes: 30 },
  { label: "45", unit: "min", minutes: 45 },
  { label: "1", unit: "hora", minutes: 60 },
  { label: "1.5", unit: "horas", minutes: 90 },
  { label: "2", unit: "horas", minutes: 120 },
];

export function SleepTimerModal({ visible, onClose }: SleepTimerModalProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { sleepTimerRemaining, setSleepTimer, cancelSleepTimer } =
    useMusicPlayer();

  const isActive = sleepTimerRemaining !== null && sleepTimerRemaining > 0;

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <GlassSheet
      visible={visible}
      onClose={onClose}
      title="Temporizador de sueño"
      icon="moon"
    >
      {isActive && (
        <LinearGradient
          colors={[NeonGradient[0] + "33", NeonGradient[1] + "22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.activeTimer, { borderColor: colors.glassBorder }]}
        >
          <Text style={[styles.activeLabel, { color: colors.textSecondary }]}>
            La música se detendrá en
          </Text>
          <Text style={[styles.activeTime, { color: colors.text }]}>
            {formatRemaining(sleepTimerRemaining!)}
          </Text>
          <Pressable
            style={[styles.cancelBtn, { borderColor: colors.danger + "80" }]}
            onPress={() => {
              cancelSleepTimer();
              onClose();
            }}
          >
            <Text style={[styles.cancelText, { color: colors.danger }]}>
              Cancelar temporizador
            </Text>
          </Pressable>
        </LinearGradient>
      )}

      <View style={styles.grid}>
        {TIMER_OPTIONS.map((option) => (
          <PressableScale
            key={option.minutes}
            haptic
            style={[
              styles.option,
              {
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={() => {
              setSleepTimer(option.minutes);
              onClose();
            }}
          >
            <Text style={[styles.optionValue, { color: colors.text }]}>
              {option.label}
            </Text>
            <Text style={[styles.optionUnit, { color: colors.textSecondary }]}>
              {option.unit}
            </Text>
          </PressableScale>
        ))}
      </View>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  activeTimer: {
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  activeLabel: { fontSize: 13, fontWeight: "600" },
  activeTime: {
    fontSize: 44,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    marginTop: Spacing.xs,
  },
  cancelText: { fontSize: 13, fontWeight: "700" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  option: {
    width: "23%",
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  optionValue: { fontSize: 22, fontWeight: "800" },
  optionUnit: { fontSize: 12, marginTop: 2 },
});
