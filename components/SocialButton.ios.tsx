import Ionicons from "@expo/vector-icons/Ionicons";
import { Host, Spacer, VStack } from "@expo/ui/swift-ui";
import { glassEffect } from "@expo/ui/swift-ui/modifiers";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { liquidGlassControlHeightPt } from "../constants/liquidGlassLayout";

export type SocialProvider = "email" | "apple" | "google" | "facebook";

const LABEL: Record<SocialProvider, string> = {
  email: "Email",
  apple: "Apple",
  google: "Google",
  facebook: "Facebook",
};

export interface SocialButtonProps {
  provider: SocialProvider;
  onPress?: () => void;
}

const SOCIAL_LABEL_FONT = 12;
const SOCIAL_BUTTON_HEIGHT = liquidGlassControlHeightPt(SOCIAL_LABEL_FONT);

function SocialIcon({ provider }: { provider: SocialProvider }) {
  const size = SOCIAL_LABEL_FONT;
  switch (provider) {
    case "email":
      return <Ionicons name="mail-outline" size={size} color="#000000" />;
    case "apple":
      return <Ionicons name="logo-apple" size={size} color="#000000" />;
    case "google":
      return (
        <Image
          source={require("../assets/google.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      );
    case "facebook":
      return <Ionicons name="logo-facebook" size={size} color="#1877F2" />;
    default:
      return null;
  }
}

/**
 * iOS Liquid Glass social-sign-in button. The capsule glass surface comes
 * from a SwiftUI `glassEffect` Host rendered as the background layer; the
 * existing brand icons and label render on top via RN. We can't use a
 * SwiftUI `Button` here because Apple/Google/Facebook brand icons aren't
 * SF Symbols — Google in particular needs the bundled PNG.
 */
export function SocialButton({ provider, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.glassClip]}>
        <Host style={styles.host}>
          <VStack
            modifiers={[
              glassEffect({
                glass: { variant: "regular", interactive: true },
                shape: "capsule",
              }),
            ]}
          >
            <Spacer />
          </VStack>
        </Host>
      </View>

      <View pointerEvents="none" style={styles.row}>
        <View style={styles.iconSlot}>
          <SocialIcon provider={provider} />
        </View>
        <Text style={styles.label}>Continue with {LABEL[provider]}</Text>
        <View style={styles.iconSlot} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: SOCIAL_BUTTON_HEIGHT,
    marginVertical: 6,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: "#000000",
    overflow: "hidden",
  },
  glassClip: {
    borderRadius: 9999,
    overflow: "hidden",
  },
  host: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconSlot: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingLeft: 8,
    textAlign: "center",
    fontSize: SOCIAL_LABEL_FONT,
    fontWeight: "600",
    letterSpacing: -0.4,
    color: "#000000",
  },
});
