import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { GLASS } from "../constants/glassPalette";

export type LiquidGlassChipShape = "circle" | "capsule";

export interface LiquidGlassChipProps {
  /** SF Symbol name on iOS; mapped to the closest Ionicons name on Android. */
  systemImage: string;
  /** Optional explicit Ionicons override for the fallback. */
  fallbackIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  shape?: LiquidGlassChipShape;
  size?: number;
  iconColor?: string;
  glassTint?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Non-iOS fallback. Approximates Liquid Glass with a BlurView under a soft
 * tint. The real SwiftUI version lives in `LiquidGlassChip.ios.tsx`.
 */
export function LiquidGlassChip({
  systemImage,
  fallbackIcon,
  onPress,
  shape = "circle",
  size = 40,
  iconColor = GLASS.ink,
  accessibilityLabel,
  style,
}: LiquidGlassChipProps) {
  const [pressed, setPressed] = useState(false);
  const radius = shape === "circle" ? size / 2 : size / 2;
  const ionicon: React.ComponentProps<typeof Ionicons>["name"] =
    fallbackIcon ?? guessIonicon(systemImage);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: radius,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(0,0,0,0.12)",
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 28 : 20}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(255,255,255,0.32)" },
          ]}
        />
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={ionicon} size={Math.round(size * 0.45)} color={iconColor} />
      </View>
    </Pressable>
  );
}

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
  return "ellipse-outline";
}
