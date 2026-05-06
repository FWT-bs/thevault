import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { GLASS, GLASS_SURFACE } from "../constants/glassPalette";

export type GlassTone = "light" | "deep" | "dark" | "cobalt" | "oceanic" | "sunset";

/**
 * Each tone is a translucent stack layered on top of a BlurView. Gradients
 * stay within a single hue family; fade through alpha, not across the
 * rainbow. "oceanic" is our cool secondary (steel), and "sunset" is now a
 * lighter sky variant (kept for backward compatibility with existing usage).
 */
const TONE_GRADIENTS: Record<
  GlassTone,
  { colors: [string, string, string]; locations: [number, number, number] }
> = {
  light: {
    colors: [
      "rgba(240,249,255,0.78)",
      "rgba(232,245,255,0.68)",
      "rgba(224,242,254,0.62)",
    ],
    locations: [0, 0.5, 1],
  },
  deep: {
    colors: [
      "rgba(224,242,254,0.78)",
      "rgba(214,236,252,0.7)",
      "rgba(203,232,251,0.64)",
    ],
    locations: [0, 0.55, 1],
  },
  // Cobalt-tinted frosted glass (single hue).
  cobalt: {
    colors: [
      "rgba(186,230,253,0.36)",
      "rgba(167,222,251,0.32)",
      "rgba(140,214,250,0.3)",
    ],
    locations: [0, 0.55, 1],
  },
  // Oceanic = cool steel blue.
  oceanic: {
    colors: [
      "rgba(186,230,253,0.38)",
      "rgba(167,222,251,0.34)",
      "rgba(125,211,252,0.32)",
    ],
    locations: [0, 0.55, 1],
  },
  // Sunset alias = lighter sky blur.
  sunset: {
    colors: [
      "rgba(186,230,253,0.38)",
      "rgba(167,222,251,0.34)",
      "rgba(125,211,252,0.32)",
    ],
    locations: [0, 0.55, 1],
  },
  // Dark = deep cobalt fading into charcoal.
  dark: {
    colors: [
      "rgba(42,45,52,0.9)",
      "rgba(28,30,34,0.88)",
      "rgba(18,20,24,0.84)",
    ],
    locations: [0, 0.55, 1],
  },
};

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  tone?: GlassTone;
  radius?: number;
  intensity?: number;
  /** Optional pastel wash (rgba) layered over the blur — used for category-tinted cards. */
  surfaceTint?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  hideHighlight?: boolean;
  hideBorder?: boolean;
  pointerEvents?: ViewStyle["pointerEvents"];
}

export function GlassSurface({
  children,
  tone = "light",
  radius = 24,
  intensity = 34,
  surfaceTint,
  style,
  contentStyle,
  onPress,
  hideHighlight,
  hideBorder,
  pointerEvents,
}: GlassSurfaceProps) {
  const [pressed, setPressed] = useState(false);
  const gradient = TONE_GRADIENTS[tone];
  const isDark = tone === "dark";

  const borderColor = isDark ? "rgba(253,251,246,0.18)" : GLASS_SURFACE.edge;

  const inner = (
    <MotiView
      animate={{ scale: pressed ? 0.975 : 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 320 }}
      style={[
        {
          borderRadius: radius,
          shadowColor: isDark ? GLASS.charcoal : GLASS_SURFACE.shadowInk,
          shadowOpacity: isDark ? 0.45 : 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 8,
        },
        style,
      ]}
      pointerEvents={pointerEvents}
    >
      <View
        style={{
          borderRadius: radius,
          overflow: "hidden",
          borderWidth: hideBorder ? 0 : StyleSheet.hairlineWidth,
          borderColor,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? intensity : Math.round(intensity * 0.7)}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: gradient.colors[1] }]}
          pointerEvents="none"
        />
        {surfaceTint ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: surfaceTint }]}
          />
        ) : null}
        {/* subtle vertical highlight intentionally simplified to a translucent fill */}
        {!hideHighlight && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: radius * 0.5,
              right: radius * 0.5,
              top: 3,
              height: 2,
              borderRadius: 2,
              backgroundColor: isDark
                ? "rgba(253,251,246,0.42)"
                : GLASS_SURFACE.highlightStrong,
              opacity: 0.72,
            }}
          />
        )}
        <View style={[{ padding: 18 }, contentStyle]}>{children}</View>
      </View>
    </MotiView>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
