import { MiniPlayer } from "@/components/music/MiniPlayer";
import { BorderRadius, Colors, NeonGradient, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Floating glass pill with a neon indicator that slides to the active tab.
// The mini player lives here too, so it always sits right above the tabs.
export function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / state.routes.length;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, {
      damping: 18,
      stiffness: 180,
    });
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
      ]}
      pointerEvents="box-none"
    >
      <MiniPlayer />
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.glassStrong,
            borderColor: colors.glassBorder,
          },
        ]}
        onLayout={(e) =>
          setBarWidth(e.nativeEvent.layout.width - 2 * BAR_PADDING)
        }
      >
        {tabWidth > 0 && (
          <Animated.View
            style={[styles.indicator, { width: tabWidth }, indicatorStyle]}
          >
            <LinearGradient
              colors={[NeonGradient[0] + "40", NeonGradient[1] + "30"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.indicatorFill,
                { borderColor: NeonGradient[0] + "66" },
              ]}
            />
          </Animated.View>
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused
            ? colors.tabIconSelected
            : colors.tabIconDefault;
          const label =
            typeof options.title === "string" ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const BAR_PADDING = 6;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  bar: {
    flexDirection: "row",
    padding: BAR_PADDING,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  indicator: {
    position: "absolute",
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
  },
  indicatorFill: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  label: { fontSize: 11, fontWeight: "600" },
});
