import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { liquidGlassControlHeightPt } from "../constants/liquidGlassLayout";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

export type GlassButtonTone =
  | "primary"
  | "cobalt"
  | "oceanic"
  | "sunset"
  | "ghost"
  | "ink"
  | "ivory"
  | "orange";

type Size = "xs" | "sm" | "md" | "lg";

interface ToneSpec {
  colors: [string, string, string];
  textColor: string;
  border: string;
  shadow: string;
  iconTint: string;
}

/**
 * All tones use a single-hue gradient (light → base → deep within one
 * color family). Keeps buttons chromatically consistent.
 */
const TONE: Record<GlassButtonTone, ToneSpec> = {
  // Very light tutorial-style blue primary.
  primary: {
    colors: ["#EFF8FF", "#E8F7FF", "#DDF3FF"],
    textColor: GLASS.ink,
    border: "rgba(56,189,248,0.2)",
    shadow: "rgba(56,189,248,0.28)",
    iconTint: GLASS.steelDeep,
  },
  // Translucent cobalt — glass CTA on light surfaces.
  cobalt: {
    colors: [
      "rgba(186,230,253,0.4)",
      "rgba(167,222,251,0.38)",
      "rgba(140,214,250,0.36)",
    ],
    textColor: GLASS.ink,
    border: "rgba(56,189,248,0.28)",
    shadow: "rgba(56,189,248,0.44)",
    iconTint: GLASS.steelDeep,
  },
  // Oceanic = cool steel.
  oceanic: {
    colors: [
      "rgba(186,230,253,0.46)",
      "rgba(162,220,251,0.42)",
      "rgba(125,211,252,0.4)",
    ],
    textColor: GLASS.ink,
    border: "rgba(2,132,199,0.3)",
    shadow: "rgba(2,132,199,0.46)",
    iconTint: GLASS.steelDeep,
  },
  // Sunset alias = lighter sky blur.
  sunset: {
    colors: [
      "rgba(186,230,253,0.46)",
      "rgba(167,222,251,0.42)",
      "rgba(125,211,252,0.4)",
    ],
    textColor: GLASS.ink,
    border: "rgba(56,189,248,0.32)",
    shadow: "rgba(56,189,248,0.48)",
    iconTint: GLASS.steelDeep,
  },
  ghost: {
    colors: [
      "rgba(240,249,255,0.72)",
      "rgba(235,246,255,0.62)",
      "rgba(230,243,255,0.54)",
    ],
    textColor: GLASS.ink,
    border: "rgba(26,26,31,0.1)",
    shadow: "rgba(28,30,34,0.2)",
    iconTint: GLASS.ink,
  },
  // Solid charcoal — heavy dark CTA.
  ink: {
    colors: ["#2A2D34", "#1C1E22", "#121418"],
    textColor: "#FDFBF6",
    border: "rgba(18,20,24,0.3)",
    shadow: "rgba(28,30,34,0.6)",
    iconTint: "#FDFBF6",
  },
  // Crisp ivory — pops against the cobalt canvas without any blue tint.
  ivory: {
    colors: ["#FFFFFF", "#FDFDFD", "#F5F5F7"],
    textColor: GLASS.ink,
    border: "rgba(26,26,31,0.14)",
    shadow: "rgba(28,30,34,0.32)",
    iconTint: GLASS.ink,
  },
  // Flat orange CTA for the earn-more action, without the old glow.
  orange: {
    colors: ["#FF7A00", "#FF7A00", "#FF7A00"],
    textColor: "#FFFFFF",
    border: "rgba(26,26,31,0.22)",
    shadow: "rgba(28,30,34,0.18)",
    iconTint: "#FFFFFF",
  },
};

function glassButtonDims(fontSize: number, paddingX: number) {
  const height = liquidGlassControlHeightPt(fontSize);
  return {
    height,
    radius: height / 2,
    paddingX,
    fontSize,
  };
}

/** Matches Swift liquid-glass rhythm (67% vertical inset + label). */
const SIZE: Record<Size, { height: number; radius: number; paddingX: number; fontSize: number }> = {
  xs: glassButtonDims(12, 11),
  sm: glassButtonDims(13, 12),
  md: glassButtonDims(17, 16),
  lg: glassButtonDims(21, 20),
};

export interface GlassButtonProps {
  label: string;
  onPress?: () => void;
  tone?: GlassButtonTone;
  size?: Size;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  /** When set, replaces the tone's mid-layer fill (e.g. custom prominent tint). */
  tintBackgroundOverride?: string;
}

export function GlassButton({
  label,
  onPress,
  tone = "primary",
  size = "md",
  icon,
  rightIcon,
  disabled,
  style,
  textStyle,
  fullWidth,
  tintBackgroundOverride,
}: GlassButtonProps) {
  const [pressed, setPressed] = useState(false);
  const spec = TONE[tone];
  const fillColor = tintBackgroundOverride ?? spec.colors[1];
  const dims = SIZE[size];
  const isDark = tone === "ink";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[fullWidth ? { alignSelf: "stretch" } : undefined, style]}
    >
      {/**
       * Two stacked shadow layers give the button its lift without faking
       * a light source on top: a tight, dark "contact" shadow that sharpens
       * the edge against the canvas, plus a soft, tone-matched "halo" that
       * tints the surface below. No top-highlight gradient, no glare strip.
       */}
      <View
        style={{
          borderRadius: dims.radius,
          shadowColor: spec.shadow,
          shadowOpacity: 0.6,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: 4,
        }}
      >
        <MotiView
          animate={{ scale: pressed ? 0.965 : 1, opacity: disabled ? 0.45 : 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 320 }}
          style={{
            borderRadius: dims.radius,
            shadowColor: GLASS.charcoal,
            shadowOpacity: 0.1,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
          }}
        >
          <View
            style={{
              minHeight: dims.height,
              borderRadius: dims.radius,
              overflow: "hidden",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: spec.border,
            }}
          >
            <BlurView
              intensity={Platform.OS === "ios" ? 30 : 22}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: fillColor },
              ]}
              pointerEvents="none"
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: dims.paddingX,
                paddingVertical: Math.max(8, Math.round(dims.fontSize * 0.45)),
                gap: 10,
                minHeight: dims.height,
              }}
            >
              {icon ? <View>{icon}</View> : null}
              <View
                style={{
                  flex: fullWidth ? 1 : undefined,
                  flexShrink: 1,
                  minWidth: 0,
                  alignSelf: "stretch",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={[
                    typography.bold,
                    {
                      fontSize: dims.fontSize,
                      color: spec.textColor,
                      letterSpacing: -0.3,
                    },
                    textStyle,
                  ]}
                >
                  {label}
                </Text>
              </View>
              {rightIcon ? <View>{rightIcon}</View> : null}
            </View>
          </View>
        </MotiView>
      </View>
    </Pressable>
  );
}
