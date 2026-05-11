import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { typography } from "../constants/typography";

/**
 * Non-iOS fallback for `HeroGlassButton`. iOS uses `HeroGlassButton.ios.tsx`.
 * See `THE_VAULT_UI_GUIDE.md`.
 */

type HeroSize = "compact" | "regular" | "large";

function dimsFor(size: HeroSize, iconOnly: boolean) {
  switch (size) {
    case "compact":
      return {
        minHeight: 40,
        fontSize: 12,
        iconSize: iconOnly ? 20 : 14,
        paddingH: iconOnly ? 12 : 14,
      };
    case "large":
      return { minHeight: 56, fontSize: 16, iconSize: 17, paddingH: 18 };
    default:
      return { minHeight: 48, fontSize: 14, iconSize: 15, paddingH: 18 };
  }
}

export interface HeroGlassButtonProps {
  /** Baseline tint (ignored when using `tintBlend` + inactive/active pair). */
  tint?: string;
  /** Crossfade 0→inactive glass, 1→active glass (smooth with `useNativeDriver: true`). */
  tintBlend?: Animated.Value;
  inactiveTint?: string;
  activeTint?: string;
  /** Tint opacity 0–1. Default 0.6. */
  tintOpacity?: number;
  /** Omit when `iconOnly` is true. */
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  size?: HeroSize;
  onPress?: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  decorative?: boolean;
  shrinkWrap?: boolean;
}

export function HeroGlassButton({
  label,
  icon,
  tint = "#7DD3FC",
  tintBlend,
  inactiveTint,
  activeTint,
  tintOpacity = 0.6,
  size = "regular",
  onPress,
  disabled = false,
  iconOnly = false,
  accessibilityLabel,
  style: outerStyle,
  decorative = false,
  shrinkWrap = false,
}: HeroGlassButtonProps) {
  const blendTint =
    tintBlend != null && inactiveTint != null && activeTint != null;
  const inactiveOpacity = tintBlend?.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const activeOpacity = tintBlend?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (iconOnly && (!icon || !accessibilityLabel)) {
    console.warn("HeroGlassButton: iconOnly requires `icon` and `accessibilityLabel`.");
  }
  if (!iconOnly && (label === undefined || label === "")) {
    console.warn("HeroGlassButton: provide `label` unless `iconOnly` is true.");
  }

  const iconOnlyMode = Boolean(iconOnly && icon && accessibilityLabel);
  const d = dimsFor(size, iconOnlyMode);
  const minHeight = d.minHeight;
  const radius = minHeight / 2;

  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (toValue: number) => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      damping: 14,
      stiffness: 320,
      mass: 0.6,
    }).start();
  };

  const a11yLabel = iconOnlyMode ? accessibilityLabel! : label;
  const pillBaseTint = blendTint ? inactiveTint! : tint;

  const pillLayout = [
    styles.pill,
    shrinkWrap ? { alignSelf: "flex-start" as const } : null,
    {
      minHeight,
      borderRadius: radius,
      backgroundColor: pillBaseTint,
    },
  ];

  const tintedFill = (tone: string) => (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: tone, opacity: tintOpacity },
      ]}
    />
  );

  const backdrop = (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius, overflow: "hidden" }]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 70 : 45}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        {blendTint && inactiveOpacity && activeOpacity ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity: inactiveOpacity,
                },
              ]}
            >
              {tintedFill(inactiveTint!)}
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity: activeOpacity,
                },
              ]}
            >
              {tintedFill(activeTint!)}
            </Animated.View>
          </>
        ) : (
          tintedFill(tint ?? pillBaseTint)
        )}
      </View>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.6)",
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.content,
          {
            minHeight,
            paddingHorizontal: d.paddingH,
            gap: iconOnlyMode ? 0 : 8,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={d.iconSize} color="#000000" /> : null}
        {!iconOnlyMode && label ? (
          <Text style={[styles.label, { fontSize: d.fontSize }]}>{label}</Text>
        ) : null}
      </View>
    </>
  );

  const dimWhenDisabled = disabled && !blendTint;

  if (decorative) {
    return (
      <View
        pointerEvents="none"
        style={[shrinkWrap ? { alignSelf: "flex-start" } : null, outerStyle]}
      >
        <View style={pillLayout}>{backdrop}</View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity: dimWhenDisabled ? 0.52 : 1 },
        shrinkWrap ? { alignSelf: "flex-start" } : null,
        outerStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={disabled ? undefined : onPress}
        onPressIn={() => animateTo(1.05)}
        onPressOut={() => animateTo(1)}
        style={pillLayout}
      >
        {backdrop}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "stretch",
    overflow: "visible",
    shadowColor: "#0A1628",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.bold,
    color: "#000000",
    letterSpacing: -0.2,
  },
});
