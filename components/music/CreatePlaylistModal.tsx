import { GlassSheet } from "@/components/ui/GlassSheet";
import { GradientPill } from "@/components/ui/PlayShuffleButtons";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreatePlaylistModal({
  visible,
  onClose,
  onCreate,
}: CreatePlaylistModalProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const canCreate = name.trim().length > 0;

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleCreate = () => {
    if (!canCreate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCreate(name.trim());
    setName("");
    onClose();
  };

  return (
    <GlassSheet
      visible={visible}
      onClose={handleClose}
      title="Nueva playlist"
      icon="add"
    >
      <View style={styles.body}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.glass,
              borderColor: focused ? colors.accent + "99" : colors.glassBorder,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Nombre de la playlist"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={60}
        />

        <View style={styles.buttons}>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancelar
            </Text>
          </Pressable>
          <View
            style={!canCreate && styles.disabled}
            pointerEvents={canCreate ? "auto" : "none"}
          >
            <GradientPill
              icon="checkmark"
              label="Crear"
              onPress={handleCreate}
            />
          </View>
        </View>
      </View>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.xl },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.md,
  },
  cancelBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  cancelText: { fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.4 },
});
