import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { Colors } from "@/constants/theme";

import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { UndoBanner } from "@/components/music/UndoBanner";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: Colors[colorScheme ?? "dark"].background,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MusicPlayerProvider>
        <ThemeProvider value={navTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="now-playing"
              options={{
                presentation: "modal",
                headerShown: false,
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="playlist/[id]"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="queue"
              options={{
                presentation: "modal",
                headerShown: false,
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="smart-playlist/[type]"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="stats"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />
          </Stack>
          <StatusBar style="auto" />
          <UndoBanner />
        </ThemeProvider>
      </MusicPlayerProvider>
    </GestureHandlerRootView>
  );
}
