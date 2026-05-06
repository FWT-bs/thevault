import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TabBarProps {
  active: "Home" | "Earn" | "Wallet" | "Profile";
  onNav: (tab: "Home" | "Earn" | "Wallet" | "Profile") => void;
}

export function TabBar({ active, onNav }: TabBarProps) {
  const tabs: Array<{
    id: TabBarProps["active"];
    icon: React.ComponentProps<typeof Ionicons>["name"];
    activeIcon: React.ComponentProps<typeof Ionicons>["name"];
  }> = [
    { id: "Home", icon: "home-outline", activeIcon: "home" },
    { id: "Earn", icon: "game-controller-outline", activeIcon: "game-controller" },
    { id: "Wallet", icon: "card-outline", activeIcon: "card" },
    { id: "Profile", icon: "person-outline", activeIcon: "person" },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onNav(tab.id as any)}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}
          >
            <View
              style={[
                styles.tabIconContainer,
                isActive && styles.tabIconContainerActive,
              ]}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? "#000000" : "#666666"}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    height: 83,
    zIndex: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 12 : 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tabIconContainerActive: {
    backgroundColor: "rgba(255,255,255,0.72)",
  },
});
