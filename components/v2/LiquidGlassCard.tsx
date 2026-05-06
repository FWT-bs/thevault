import React from "react";
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

/** Converts `#RRGGBB` to a soft rgba wash for the blur fallback. */
function hexToGlassWash(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) {
    return `rgba(186,230,253,${alpha})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return `rgba(186,230,253,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

export type LiquidGlassVariant = "regular" | "clear";

export interface LiquidGlassCardProps {
  children?: React.ReactNode;
  variant?: LiquidGlassVariant;
  tint?: string;
  interactive?: boolean;
  cornerRadius?: number;
  innerPadding?: number;
  style?: StyleProp<ViewStyle>;
  matchContents?: boolean;
  /** iOS: tab-bar-style rim (see `LiquidGlassCard.ios.tsx`). Inert on this fallback. */
  showChrome?: boolean;
}

/**
 * Non-iOS fallback for Liquid Glass v2. The real Liquid Glass surface lives in
 * `LiquidGlassCard.ios.tsx`; here we render the existing BlurView-based
 * approximation so screens can import a single name on every platform.
 */
export function LiquidGlassCard({
  children,
  variant = "regular",
  tint,
  cornerRadius = 24,
  innerPadding = 16,
  style,
  showChrome: _showChrome,
}: LiquidGlassCardProps) {
  const surfaceTint = tint ? hexToGlassWash(tint, 0.26) : undefined;
  const isBlur = Platform.OS === "ios";

  return (
    <View
      style={[
        styles.container,
        { borderRadius: cornerRadius },
        style as ViewStyle,
      ]}
    >
      {/* Glass surface layer */}
      <BlurView
        intensity={isBlur ? 70 : 45}
        tint="light"
        style={[StyleSheet.absoluteFillObject, { borderRadius: cornerRadius }]}
      />
      {/* Tint layer */}
      {surfaceTint && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: surfaceTint, opacity: 0.26 },
            { borderRadius: cornerRadius },
          ]}
        />
      )}
      {/* Specular highlight */}
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          { borderRadius: cornerRadius },
        ]}
      />
      {/* Content container */}
      <View style={[styles.content, { padding: innerPadding }]}>
        {children}
      </View>
      {/* Bottom edge */}
      <View
        pointerEvents="none"
        style={[
          styles.bottomEdge,
          { borderRadius: cornerRadius },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.22)",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(255,255,255,0.68)",
    overflow: "hidden",
  },
  bottomEdge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(60,55,68,0.1)",
    overflow: "hidden",
  },
  content: {
    position: "relative",
  },
});
