import { Tabs } from "expo-router";

import { GlassTabBar } from "@/components/ui/GlassTabBar";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <ScreenBackground>
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Biblioteca",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="musical-notes" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recents"
          options={{
            title: "Recientes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favoritos",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ScreenBackground>
  );
}
