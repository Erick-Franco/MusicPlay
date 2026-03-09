/**
 * MusicPlay Theme - Premium dark music player aesthetic
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    background: "#F8F9FA",
    surface: "#FFFFFF",
    card: "#F0F2F5",
    tint: "#8B5CF6",
    accent: "#A855F7",
    accentGradientStart: "#8B5CF6",
    accentGradientEnd: "#EC4899",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: "#8B5CF6",
    border: "#E5E7EB",
    playerBackground: "#FFFFFF",
    miniPlayerBackground: "#F8F9FA",
    danger: "#EF4444",
    favorite: "#EF4444",
  },
  dark: {
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    background: "#0F0F1A",
    surface: "#1A1A2E",
    card: "#16213E",
    tint: "#A855F7",
    accent: "#A855F7",
    accentGradientStart: "#8B5CF6",
    accentGradientEnd: "#EC4899",
    icon: "#94A3B8",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#A855F7",
    border: "#2D2D44",
    playerBackground: "#1A1A2E",
    miniPlayerBackground: "#16213E",
    danger: "#EF4444",
    favorite: "#EF4444",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
