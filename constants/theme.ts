import { Platform } from "react-native";

// "Glass oscuro con neón": deep backgrounds, translucent glass surfaces and
// violet→pink neon accents. `card` is translucent so every chip, search bar
// and placeholder picks up the glass look over the glow background.
export const Colors = {
  light: {
    text: "#14111F",
    textSecondary: "#6B6880",
    background: "#F4F2FA",
    surface: "#FFFFFF",
    card: "rgba(20, 10, 60, 0.05)",
    tint: "#8B5CF6",
    accent: "#8B5CF6",
    accentGradientStart: "#8B5CF6",
    accentGradientEnd: "#EC4899",
    icon: "#6B6880",
    tabIconDefault: "#8A879C",
    tabIconSelected: "#8B5CF6",
    border: "rgba(20, 10, 60, 0.08)",
    playerBackground: "#FFFFFF",
    miniPlayerBackground: "rgba(255, 255, 255, 0.85)",
    danger: "#EF4444",
    favorite: "#EC4899",
    glass: "rgba(255, 255, 255, 0.65)",
    glassStrong: "rgba(255, 255, 255, 0.9)",
    glassBorder: "rgba(20, 10, 60, 0.08)",
    glowPrimary: "rgba(139, 92, 246, 0.22)",
    glowSecondary: "rgba(236, 72, 153, 0.16)",
  },
  dark: {
    text: "#F5F3FF",
    textSecondary: "#9A97B0",
    background: "#07070D",
    surface: "#13121F",
    card: "rgba(255, 255, 255, 0.06)",
    tint: "#A855F7",
    accent: "#A855F7",
    accentGradientStart: "#8B5CF6",
    accentGradientEnd: "#EC4899",
    icon: "#9A97B0",
    tabIconDefault: "#6E6B85",
    tabIconSelected: "#C084FC",
    border: "rgba(255, 255, 255, 0.08)",
    playerBackground: "#13121F",
    miniPlayerBackground: "rgba(24, 22, 38, 0.92)",
    danger: "#F43F5E",
    favorite: "#F472B6",
    glass: "rgba(255, 255, 255, 0.06)",
    glassStrong: "rgba(30, 28, 48, 0.92)",
    glassBorder: "rgba(255, 255, 255, 0.10)",
    glowPrimary: "rgba(139, 92, 246, 0.30)",
    glowSecondary: "rgba(236, 72, 153, 0.20)",
  },
};

export type ThemeColors = (typeof Colors)["dark"];

export const NeonGradient = ["#8B5CF6", "#EC4899"] as const;

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

// Soft neon glow for highlighted elements (play button, active items).
export const neonShadow = (color = "#A855F7") => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.55,
  shadowRadius: 16,
  elevation: 12,
});

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
