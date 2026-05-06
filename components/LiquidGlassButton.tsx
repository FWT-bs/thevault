import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";

import { GLASS } from "../constants/glassPalette";
import { GlassButton, type GlassButtonTone } from "./GlassButton";

export type LiquidGlassButtonVariant = "glassProminent" | "glass";
export type LiquidGlassButtonTone =
  | "primary"
  | "cobalt"
  | "ink"
  | "copper"
  | "neutral";
export type LiquidGlassButtonSize = "compact" | "small" | "regular" | "large";

export interface LiquidGlassButtonProps {
  label: string;
  onPress?: () => void;
  variant?: LiquidGlassButtonVariant;
  tone?: LiquidGlassButtonTone;
  size?: LiquidGlassButtonSize;
  systemImage?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  /**
   * Exact SwiftUI `tint` for `glassProminent` (overrides tone map). Use for a
   * predictable fill when system glass boosts saturation.
   */
  prominentTint?: string;
}

const TONE_MAP: Record<LiquidGlassButtonTone, GlassButtonTone> = {
  primary: "primary",
  cobalt: "primary",
  ink: "primary",
  copper: "primary",
  neutral: "ghost",
};

const SIZE_MAP: Record<LiquidGlassButtonSize, "xs" | "sm" | "md" | "lg"> = {
  compact: "xs",
  small: "sm",
  regular: "md",
  large: "lg",
};

// Icon tints mirror GlassButton's TONE spec so the icon matches the label.
const ICON_TINT: Record<LiquidGlassButtonTone, string> = {
  primary: GLASS.steelDeep,
  cobalt: GLASS.steelDeep,
  ink: GLASS.steelDeep,
  copper: GLASS.steelDeep,
  neutral: GLASS.ink,
};

const ICON_SIZE: Record<LiquidGlassButtonSize, number> = {
  compact: 12,
  small: 13,
  regular: 17,
  large: 21,
};

function guessIonicon(
  systemImage: string,
): React.ComponentProps<typeof Ionicons>["name"] {
  if (systemImage.startsWith("chevron.backward")) return "chevron-back";
  if (systemImage.startsWith("chevron.forward")) return "chevron-forward";
  if (systemImage.startsWith("chevron.left")) return "chevron-back";
  if (systemImage.startsWith("chevron.right")) return "chevron-forward";
  if (systemImage.startsWith("xmark")) return "close";
  if (systemImage.startsWith("plus")) return "add";
  if (systemImage.startsWith("checkmark")) return "checkmark";
  if (systemImage.startsWith("ellipsis")) return "ellipsis-horizontal";
  if (systemImage.startsWith("square.and.arrow.down")) return "download-outline";
  if (systemImage.startsWith("bolt")) return "flash";
  if (systemImage.startsWith("play")) return "play";
  if (systemImage.startsWith("square.grid")) return "grid-outline";
  return "ellipse-outline";
}

/**
 * Non-iOS fallback. The real Liquid Glass button is in
 * `LiquidGlassButton.ios.tsx`; on Android/web we delegate to the existing
 * BlurView-based `GlassButton`.
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
  const icon = systemImage ? (
    <Ionicons
      name={guessIonicon(systemImage)}
      size={ICON_SIZE[size]}
      color={ICON_TINT[tone]}
    />
  ) : undefined;

  return (
    <GlassButton
      label={label}
      onPress={onPress}
      tone={TONE_MAP[tone]}
      size={SIZE_MAP[size]}
      icon={icon}
      disabled={disabled}
      style={style}
      fullWidth={fullWidth}
      tintBackgroundOverride={
        variant === "glassProminent" ? prominentTint : undefined
      }
    />
  );
}
