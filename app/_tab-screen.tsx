import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React from "react";
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { LiquidGlassCard } from "../components/LiquidGlassCard";
import { APP_PALETTE } from "../constants/appPalette";
import { typography } from "../constants/typography";

export default function TabScreen({
  title,
  subtitle,
  children,
  titleAccessory,
  headerLeading,
  headerAccessory,
  background,
  backgroundColor = "#FFFFFF",
  titleColor = APP_PALETTE.eggplant,
  subtitleColor = APP_PALETTE.royal,
  statusBarStyle = "dark",
  contentContainerStyle,
  scrollEnabled = true,
  overlay,
  glassHeader = false,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  titleAccessory?: React.ReactNode;
  headerLeading?: React.ReactNode;
  headerAccessory?: React.ReactNode;
  background?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  statusBarStyle?: "light" | "dark";
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  overlay?: React.ReactNode;
  /** When true, title block sits on a `LiquidGlassCard` like the tab bar. */
  glassHeader?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]} edges={["top"]}>
      <StatusBar style={statusBarStyle} />
      {background ? (
        <View pointerEvents="none" style={styles.backgroundLayer}>
          {background}
        </View>
      ) : null}

      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 260 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            {
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 16) + 32,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          bounces={scrollEnabled}
          alwaysBounceVertical={scrollEnabled}
          overScrollMode={scrollEnabled ? "auto" : "never"}
          scrollEventThrottle={16}
        >
          {(() => {
            const headerInner = (
              <>
                {headerLeading ? <View style={styles.headerLeading}>{headerLeading}</View> : null}
                <View style={styles.headerTextBlock}>
                  <View style={styles.titleLine}>
                    <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                    {titleAccessory ? <View style={styles.titleAccessory}>{titleAccessory}</View> : null}
                  </View>
                  {subtitle ? (
                    <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
                  ) : (
                    <View style={styles.subtitleSpacer} />
                  )}
                </View>
                {headerAccessory ? <View style={styles.headerAccessory}>{headerAccessory}</View> : null}
              </>
            );
            return glassHeader ? (
              <LiquidGlassCard cornerRadius={22} innerPadding={14} style={{ marginBottom: 24 }}>
                <View style={[styles.headerRow, { marginBottom: 0 }]}>{headerInner}</View>
              </LiquidGlassCard>
            ) : (
              <View style={styles.headerRow}>{headerInner}</View>
            );
          })()}

          {children}
        </ScrollView>
      </MotiView>

      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flex: 1,
  },
  headerRow: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleAccessory: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeading: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerAccessory: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 3,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.9,
    ...typography.bold,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
    color: "#000000",
    letterSpacing: -0.15,
    ...typography.semibold,
  },
  subtitleSpacer: {
    height: 19,
  },
});
