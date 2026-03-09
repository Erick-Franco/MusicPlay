import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={[styles.title, { color: colors.text }]}>
                Nueva Playlist
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la playlist"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.card }]}
                  onPress={onClose}
                >
                  <Text
                    style={[styles.buttonText, { color: colors.textSecondary }]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.accent }]}
                  onPress={handleCreate}
                  disabled={!name.trim()}
                >
                  <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                    Crear
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
