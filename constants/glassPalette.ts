/**
 * Liquid-glass design tokens — "Cobalt & Copper".
 *
 * A warm chalk canvas with a deep cobalt primary, burnished copper for
 * warm accents, mustard gold for highlights, oxblood for alerts, steel
 * for the cool secondary, and moss for success. Charcoal anchors the
 * darkest shadows. Layered in addition to APP_PALETTE (which the tab
 * bar still owns).
 *
 *   - GLASS         → solid colors (text, accents, icons)
 *   - GLASS_SURFACE → translucent cream layers to stack over a BlurView
 *
 * Gradient ranges live inside the components that use them so each stays
 * focused on a single hue family.
 */

export const GLASS = {
  ink: "#1A1A1F",
  inkSoft: "rgba(26,26,31,0.76)",
  inkMuted: "rgba(26,26,31,0.58)",
  inkFaint: "rgba(26,26,31,0.36)",

  canvas: "#EFF8FF",
  canvasDeep: "#E0F2FE",
  pearl: "#F7FCFF",

  // Hue families — each has a light / base / deep shade so gradients
  // can stay inside one color.
  cobaltLight: "#BAE6FD",
  cobalt: "#7DD3FC",
  cobaltDeep: "#38BDF8",

  copperLight: "#FFB347",
  copper: "#FF7A00",
  copperDeep: "#FF4D00",

  oxbloodLight: "#B14A52",
  oxblood: "#7A1E2C",
  oxbloodDeep: "#4D1019",

  steelLight: "#BAE6FD",
  steel: "#38BDF8",
  steelDeep: "#0EA5E9",

  mustardLight: "#E8C547",
  mustard: "#C9A227",
  mustardDeep: "#8E6E13",

  moss: "#4A6B5C",
  charcoal: "#1C1E22",
} as const;

/**
 * RN overlay on top of SwiftUI `glassEffect` (see `LiquidGlassCard.ios.tsx`)
 * so surfaces read off the canvas like the liquid tab bar: stroke + frost +
 * specular edge lines.
 */
export const LIQUID_GLASS_RIM = {
  border: "rgba(0,0,0,0.22)",
  /** Strong white wash so cards read as panels on a #fff canvas while keeping the stroke. */
  frost: "rgba(255,255,255,0.9)",
  topHighlight: "rgba(255,255,255,0.68)",
  bottomEdge: "rgba(60,55,68,0.1)",
  shadowColor: "#000000",
  shadowOpacity: 0.14,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;

export const GLASS_SURFACE = {
  frostLight: "rgba(253,251,246,0.38)",
  frost: "rgba(253,251,246,0.56)",
  frostDeep: "rgba(253,251,246,0.74)",

  highlight: "rgba(253,251,246,0.58)",
  highlightStrong: "rgba(253,251,246,0.9)",

  edge: "rgba(253,251,246,0.6)",
  edgeSoft: "rgba(253,251,246,0.32)",
  edgeInk: "rgba(26,26,31,0.1)",

  shadowInk: "rgba(28,30,34,0.22)",
  shadowSoft: "rgba(56,189,248,0.22)",
} as const;

/**
 * Design tokens from "Vault - Liquid Glass v2.html".
 * Used by the v2 restyle effort while keeping existing GLASS tokens intact.
 */
export const V2 = {
  bg: "#FAFAF7",
  card: "#FFFFFF",
  ink: "#0A0A0A",
  ink2: "#1C1C1E",
  muted: "#6B6B70",
  faint: "#A1A1A6",
  hairline: "rgba(0,0,0,0.06)",
  hairlineStrong: "rgba(0,0,0,0.10)",
  /** Saturated “indigo” blue for filled CTAs (distinct from `cyan` links / iOS blue). */
  blueDeep: "#2563EB",
  cyan: "#0A84FF",
  cyanSoft: "#E6F3FF",
  cyanInk: "#003A7A",
  amber: "#FF9F0A",
  amberSoft: "#FFF1DC",
  amberInk: "#7A3F00",
  green: "#30D158",
  red: "#FF453A",
} as const;
