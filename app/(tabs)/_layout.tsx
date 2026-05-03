import { Tabs } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { palette } from "@/src/shared/theme/design-tokens";

export default function TabLayout() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background }}
      edges={["top", "bottom"]}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textSubtle,
          headerShown: false,
          headerStyle: {
            backgroundColor: palette.surface,
          },
          headerTintColor: palette.text,
          headerTitleStyle: {
            fontWeight: "800",
          },
          tabBarButton: HapticTab,
          tabBarLabelPosition: "below-icon",
          tabBarStyle: {
            borderTopWidth: 0.5,
            borderTopColor: palette.border,
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
            backgroundColor: palette.surface,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="plus.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="tag.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="chart.pie.fill" color={color} />
            ),
          }}
        />

        {/* Hidden tabs - accessible via navigation but not shown in main tab bar */}
        <Tabs.Screen
          name="transactions"
          options={{
            href: null,
            title: "History",
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            href: null,
            title: "Search",
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            href: null,
            title: "Budgets",
          }}
        />
        <Tabs.Screen
          name="recurring"
          options={{
            href: null,
            title: "Recurring",
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
