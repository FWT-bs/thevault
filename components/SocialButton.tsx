import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { COOLORS } from "../constants/coolors";
import { paletteStyles } from "../constants/paletteStyles";

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

function SocialIcon({ provider }: { provider: SocialProvider }) {
  const size = 22;
  switch (provider) {
    case "email":
      return (
        <Ionicons name="mail-outline" size={size} color={COOLORS.ink} />
      );
    case "apple":
      return <Ionicons name="logo-apple" size={size} color={COOLORS.ink} />;
    case "google":
      return (
        <Image
          source={require("../assets/google.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      );
    case "facebook":
      return (
        <Ionicons name="logo-facebook" size={size} color="#1877F2" />
      );
    default:
      return null;
  }
}

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="my-1.5 w-full flex-row items-center rounded-full border-2 border-black p-3"
    >
      <View className="w-8 items-center justify-center">
        <SocialIcon provider={provider} />
      </View>
      <Text
        className="flex-1 pl-2 text-center text-[17px] font-semibold tracking-tight"
        style={[paletteStyles.inkText, { letterSpacing: -0.4 }]}
      >
        Continue with {LABEL[provider]}
      </Text>
      <View className="w-8" />
    </TouchableOpacity>
  );
}
