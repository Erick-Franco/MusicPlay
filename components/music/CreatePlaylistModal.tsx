import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCreate(name.trim());
    setName("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom + Spacing.xl,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Nueva playlist
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeBtn}
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Dale un nombre a tu playlist
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la playlist"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                maxLength={60}
              />

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.card }]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.buttonText, { color: colors.textSecondary }]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.accent },
                    !name.trim() && styles.buttonDisabled,
                  ]}
                  onPress={handleCreate}
                  disabled={!name.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                    Crear
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});