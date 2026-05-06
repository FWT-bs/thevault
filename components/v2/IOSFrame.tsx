import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IOSFrameProps {
  children: React.ReactNode;
  dark?: boolean;
}

export function IOSFrame({ children, dark = false }: IOSFrameProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      {/* Status bar area */}
      <View
        style={[
          styles.statusBar,
          { height: Math.max(insets.top, 12) },
        ]}
      />
      {/* Top hardware button */}
      <View style={styles.topButton} />
      {/* Main content */}
      <View style={styles.content}>{children}</View>
      {/* Home indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
}

export function IOSStatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <View style={styles.statusBarFill}>
      {/* Status bar elements would go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  containerDark: {
    backgroundColor: "#1a1a1a",
  },
  statusBar: {
    position: "relative",
    width: "100%",
  },
  statusBarFill: {
    width: "100%",
    height: "100%",
  },
  topButton: {
    position: "absolute",
    top: 11,
    left: "50%",
    transform: [{ translateX: -50 }],
    width: 126,
    height: 37,
    borderRadius: 24,
    backgroundColor: "#000",
    zIndex: 50,
  },
  content: {
    flex: 1,
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    justifyContent: "center",
    pointerEvents: "none",
  },
  homeIndicatorFill: {
    width: 139,
    height: 5,
    borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
