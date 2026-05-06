import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";
import { Host, Image, VStack } from "@expo/ui/swift-ui";
import {
  frame,
  glassEffect,
  onTapGesture,
} from "@expo/ui/swift-ui/modifiers";

import { GLASS } from "../constants/glassPalette";

export type LiquidGlassChipShape = "circle" | "capsule";

export interface LiquidGlassChipProps {
  systemImage: SFSymbol;
  onPress?: () => void;
  shape?: LiquidGlassChipShape;
  size?: number;
  iconColor?: string;
  /** Optional tint applied to the glass material itself. */
  glassTint?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small icon-only Liquid Glass surface — for back buttons, close buttons,
 * floating actions. The whole chip is interactive SwiftUI: tapping deforms
 * the glass natively and fires `onPress`.
 */
export function LiquidGlassChip({
  systemImage,
  onPress,
  shape = "circle",
  size = 40,
  iconColor = GLASS.ink,
  glassTint,
  accessibilityLabel,
  style,
}: LiquidGlassChipProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Host style={styles.host}>
        <VStack
          modifiers={[
            frame({ width: size, height: size, alignment: "center" }),
            glassEffect({
              glass: {
                variant: "regular",
                interactive: true,
                ...(glassTint ? { tint: glassTint } : {}),
              },
              shape,
            }),
            ...(onPress ? [onTapGesture(onPress)] : []),
          ]}
        >
          <Image
            systemName={systemImage}
            size={Math.round(size * 0.45)}
            color={iconColor}
          />
        </VStack>
      </Host>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
