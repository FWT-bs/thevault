import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";

import { GlassSurface } from "./GlassSurface";

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
 * Non-iOS fallback. The real Liquid Glass surface lives in
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
  return (
    <GlassSurface
      tone={variant === "clear" ? "light" : "deep"}
      radius={cornerRadius}
      surfaceTint={surfaceTint}
      style={style}
      contentStyle={{ padding: innerPadding }}
    >
      {children}
    </GlassSurface>
  );
}
