import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";
import { Button, HStack, Host, Image, Text } from "@expo/ui/swift-ui";
import { buttonStyle, frame, tint as tintModifier } from "@expo/ui/swift-ui/modifiers";

import { liquidGlassControlHeightPt } from "../constants/liquidGlassLayout";
import { GLASS } from "../constants/glassPalette";

export type LiquidGlassButtonVariant = "glassProminent" | "glass";
export type LiquidGlassButtonTone =
  | "primary"
  | "cobalt"
  | "ink"
  | "copper"
  | "neutral";
export type LiquidGlassButtonSize = "compact" | "small" | "regular" | "large";

/** SwiftUI `tint` is applied to the Liquid Glass background for `glassProminent`. */
const TONE_TINTS: Record<LiquidGlassButtonTone, string | undefined> = {
  primary: "#DDF3FF",
  cobalt: "#DDF3FF",
  ink: "#DDF3FF",
  copper: "#DDF3FF",
  neutral: undefined,
};

const FONT_SIZES: Record<LiquidGlassButtonSize, number> = {
  compact: 12,
  small: 13,
  regular: 17,
  large: 21,
};

/** One size up from the logical size so the glass pill has generous padding. */
const CONTROL_SIZES: Record<LiquidGlassButtonSize, "small" | "regular" | "large" | "extraLarge"> = {
  compact: "small",
  small: "regular",
  regular: "large",
  large: "extraLarge",
};

const LABEL_COLOR = "#000000";

export interface LiquidGlassButtonProps {
  label: string;
  onPress?: () => void;
  variant?: LiquidGlassButtonVariant;
  tone?: LiquidGlassButtonTone;
  size?: LiquidGlassButtonSize;
  systemImage?: SFSymbol;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  /**
   * Exact SwiftUI `tint` for `glassProminent` (overrides `TONE_TINTS[tone]`).
   * Use when you need a predictable light fill independent of tone defaults.
   */
  prominentTint?: string;
}

/**
 * iOS 26 Liquid Glass button.
 *
 * Uses native SwiftUI `Button` + `buttonStyle` with a custom label so we can
 * set `weight="bold"` on the Text. `controlSize` bumped one step up so the
 * glass pill has generous vertical padding without touching font size.
 */
export function LiquidGlassButton({
  label,
  onPress,
  variant = "glassProminent",
  tone = "primary",
  size = "regular",
  systemImage,
  disabled,
  style,
  fullWidth,
  prominentTint,
}: LiquidGlassButtonProps) {
  const fontSize = FONT_SIZES[size];
  const minHeight = liquidGlassControlHeightPt(fontSize);
  const isProminent = variant === "glassProminent";
  const tintForProminent =
    isProminent ? (prominentTint ?? TONE_TINTS[tone]) : undefined;
  const controlSize = CONTROL_SIZES[size];

  const handlePress = disabled ? () => {} : (onPress ?? (() => {}));

  const labelNode = systemImage ? (
    <HStack spacing={6} alignment="center">
      <Image systemName={systemImage} size={fontSize} color={LABEL_COLOR} />
      <Text weight="bold" size={fontSize} color={LABEL_COLOR}>{label}</Text>
    </HStack>
  ) : (
    <Text weight="bold" size={fontSize} color={LABEL_COLOR}>{label}</Text>
  );

  return (
    <View
      style={[
        fullWidth ? styles.fullWidth : styles.shrinkWrap,
        { minHeight, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Host matchContents style={fullWidth ? styles.hostFull : undefined}>
        <Button
          onPress={handlePress}
          disabled={disabled}
          controlSize={controlSize}
          modifiers={[
            frame({
              minHeight,
              ...(fullWidth ? { maxWidth: 4000 } : {}),
            }),
            ...(tintForProminent ? [tintModifier(tintForProminent)] : []),
            buttonStyle(isProminent ? "glassProminent" : "glass"),
          ]}
        >
          {labelNode}
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: "stretch",
  },
  shrinkWrap: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  hostFull: {
    flex: 1,
  },
});
