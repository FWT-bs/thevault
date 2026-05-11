import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Host, Spacer, VStack } from "@expo/ui/swift-ui";
import { glassEffect } from "@expo/ui/swift-ui/modifiers";

import { typography } from "../constants/typography";

/** iOS 26 Liquid Glass pill via SwiftUI `glassEffect`. See `THE_VAULT_UI_GUIDE.md`. */

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
  tint?: string;
  tintBlend?: Animated.Value;
  inactiveTint?: string;
  activeTint?: string;
  tintOpacity?: number;
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

function GlassShell({ tint }: { tint?: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Host matchContents style={styles.host}>
        <VStack
          modifiers={[
            glassEffect({
              glass: {
                variant: "regular",
                interactive: true,
                ...(tint ? { tint } : {}),
              },
              shape: "capsule",
            }),
          ]}
        >
          <Spacer />
        </VStack>
      </Host>
    </View>
  );
}

function DualGlassBackdrop({
  blend,
  inactiveTint,
  activeTint,
}: {
  blend: Animated.Value;
  inactiveTint: string;
  activeTint: string;
}) {
  const oInactive = blend.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const oActive = blend.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: oInactive }]}>
        <GlassShell tint={inactiveTint} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: oActive }]}>
        <GlassShell tint={activeTint} />
      </Animated.View>
    </View>
  );
}

export function HeroGlassButton({
  label,
  icon,
  tint = "#7DD3FC",
  tintBlend,
  inactiveTint,
  activeTint,
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

  const iconOnlyMode = Boolean(iconOnly && icon && accessibilityLabel);
  const d = dimsFor(size, iconOnlyMode);
  const minHeight = d.minHeight;
  const radius = minHeight / 2;

  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (toValue: number) => {
    if (disabled || decorative) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      damping: 14,
      stiffness: 320,
      mass: 0.6,
    }).start();
  };

  const a11yLabel = iconOnlyMode ? accessibilityLabel! : label;

  const backdrop = blendTint ? (
    <DualGlassBackdrop
      blend={tintBlend!}
      inactiveTint={inactiveTint!}
      activeTint={activeTint!}
    />
  ) : (
    <GlassShell tint={tint} />
  );

  const body = (
    <>
      {backdrop}
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

  const shadowBase = [styles.shadowWrap, shrinkWrap ? { alignSelf: "flex-start" as const } : null];
  const dimWhenDisabled = disabled && !blendTint;

  if (decorative) {
    return (
      <View
        pointerEvents="none"
        style={[
          ...shadowBase,
          { minHeight, borderRadius: radius, opacity: dimWhenDisabled ? 0.52 : 1 },
          outerStyle,
        ]}
      >
        <View style={[styles.shell, { minHeight, borderRadius: radius }]}>{body}</View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        ...shadowBase,
        {
          minHeight,
          borderRadius: radius,
          transform: [{ scale }],
          opacity: dimWhenDisabled ? 0.52 : 1,
        },
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
        style={[styles.shell, { minHeight, borderRadius: radius }]}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0A1628",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  shell: {
    flex: 1,
    overflow: "hidden",
  },
  host: {
    flex: 1,
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
