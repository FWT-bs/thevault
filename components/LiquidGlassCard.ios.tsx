import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Host, Spacer, VStack } from "@expo/ui/swift-ui";
import {
  clipShape,
  glassEffect,
} from "@expo/ui/swift-ui/modifiers";

import { LIQUID_GLASS_RIM } from "../constants/glassPalette";

export type LiquidGlassVariant = "regular" | "clear";

export interface LiquidGlassCardProps {
  children?: React.ReactNode;
  variant?: LiquidGlassVariant;
  /** SwiftUI Color string. Hex (#RRGGBB) works. */
  tint?: string;
  /** Reacts to touch with the iOS 26 interactive glass deformation. */
  interactive?: boolean;
  /** Corner radius of the glass surface. Default 24. */
  cornerRadius?: number;
  /** Inner padding applied to the RN content layer. Default 16. */
  innerPadding?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Tab-bar-style border, frost wash, specular lines, and shadow so the
   * surface reads above the page (SwiftUI glass alone can blend into a flat canvas).
   */
  showChrome?: boolean;
}

/**
 * iOS 26+ Liquid Glass surface, backed by SwiftUI's `.glassEffect()` via @expo/ui.
 *
 * Implementation: a SwiftUI `Host` renders the glass shape as an absolute
 * background layer; RN children render in a sibling layer on top. We do this
 * (rather than nest RN inside SwiftUI) because @expo/ui beta does not export
 * `RNHostView` — the absolute-layer pattern is what the Liquid Glass tab bar
 * uses too and it composes cleanly with RN gestures and animation.
 *
 * Requires a dev build with iOS 26 deployment target. Will not render in Expo Go.
 */
export function LiquidGlassCard({
  children,
  variant = "regular",
  tint,
  interactive = true,
  cornerRadius = 24,
  innerPadding = 16,
  style,
  showChrome = true,
}: LiquidGlassCardProps) {
  const inset = Math.max(10, Math.round(cornerRadius * 0.28));

  return (
    <View
      style={[
        { borderRadius: cornerRadius },
        showChrome && Platform.OS === "ios" && {
          shadowColor: LIQUID_GLASS_RIM.shadowColor,
          shadowOpacity: LIQUID_GLASS_RIM.shadowOpacity,
          shadowRadius: LIQUID_GLASS_RIM.shadowRadius,
          shadowOffset: LIQUID_GLASS_RIM.shadowOffset,
        },
        showChrome && Platform.OS === "android" && {
          elevation: LIQUID_GLASS_RIM.elevation,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: cornerRadius,
            overflow: "hidden",
          },
        ]}
      >
        <Host style={styles.host}>
          <VStack
            modifiers={[
              glassEffect({
                glass: {
                  variant,
                  interactive,
                  ...(tint ? { tint } : {}),
                },
                shape: "rectangle",
              }),
              clipShape("roundedRectangle", cornerRadius),
            ]}
          >
            <Spacer />
          </VStack>
        </Host>
        {showChrome ? (
          <>
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: LIQUID_GLASS_RIM.frost,
                  borderRadius: cornerRadius,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: cornerRadius,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: LIQUID_GLASS_RIM.border,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: inset,
                right: inset,
                top: StyleSheet.hairlineWidth,
                height: StyleSheet.hairlineWidth * 2,
                borderRadius: 1,
                backgroundColor: LIQUID_GLASS_RIM.topHighlight,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: inset,
                right: inset,
                bottom: 0,
                height: StyleSheet.hairlineWidth * 2,
                backgroundColor: LIQUID_GLASS_RIM.bottomEdge,
              }}
            />
          </>
        ) : null}
      </View>

      <View style={{ padding: innerPadding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
