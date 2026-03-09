import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const TIMER_OPTIONS = [
  { label: "5 minutos", minutes: 5 },
  { label: "10 minutos", minutes: 10 },
  { label: "15 minutos", minutes: 15 },
  { label: "30 minutos", minutes: 30 },
  { label: "45 minutos", minutes: 45 },
  { label: "1 hora", minutes: 60 },
  { label: "2 horas", minutes: 120 },
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
            <Ionicons name="moon-outline" size={24} color={colors.accent} />
            <Text style={[styles.title, { color: colors.text }]}>
              Temporizador de sueño
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isActive && (
            <View
              style={[
                styles.activeTimer,
                { backgroundColor: colors.accent + "15" },
              ]}
            >
              <Text style={[styles.activeLabel, { color: colors.accent }]}>
                Temporizador activo
              </Text>
              <Text style={[styles.activeTime, { color: colors.accent }]}>
                {formatRemaining(sleepTimerRemaining!)}
              </Text>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.danger }]}
                onPress={() => {
                  cancelSleepTimer();
                  onClose();
                }}
              >
                <Text style={[styles.cancelText, { color: colors.danger }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView>
            {TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSleepTimer(option.minutes);
                  onClose();
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "700" },
  activeTimer: {
    alignItems: "center",
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  activeLabel: { fontSize: 14, fontWeight: "600" },
  activeTime: { fontSize: 36, fontWeight: "800" },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cancelText: { fontSize: 14, fontWeight: "600" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  optionText: { fontSize: 16, fontWeight: "500" },
});
