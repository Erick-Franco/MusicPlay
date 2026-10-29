import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar canciones...",
}: SearchBarProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.glass,
          borderColor: focused ? colors.accent + "99" : colors.glassBorder,
        },
        focused && styles.focused,
      ]}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused ? colors.tabIconSelected : colors.textSecondary}
      />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={colors.accent}
      />
      {value.length > 0 && (
        <Animated.View entering={ZoomIn} exiting={ZoomOut}>
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 46,
    gap: Spacing.sm,
  },
  focused: {
    shadowColor: "#A855F7",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
});
