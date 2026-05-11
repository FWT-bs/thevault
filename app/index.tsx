import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence, MotiText, MotiView } from "moti";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassSurface } from "../components/GlassSurface";
import { HeroGlassButton } from "../components/HeroGlassButton";
import { LiquidGlassCard } from "../components/LiquidGlassCard";
import { GLASS, V2 } from "../constants/glassPalette";
import { hasOnboarded } from "../constants/onboardingState";
import { typography } from "../constants/typography";

const COUNTRY_CODES = [
  { label: "United States", code: "+1", flag: "🇺🇸" },
  { label: "Canada", code: "+1", flag: "🇨🇦" },
  { label: "China", code: "+86", flag: "🇨🇳" },
  { label: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { label: "Austria", code: "+43", flag: "🇦🇹" },
  { label: "Germany", code: "+49", flag: "🇩🇪" },
  { label: "Ireland", code: "+353", flag: "🇮🇪" },
  { label: "India", code: "+91", flag: "🇮🇳" },
  { label: "Italy", code: "+39", flag: "🇮🇹" },
  { label: "Poland", code: "+48", flag: "🇵🇱" },
  { label: "Portugal", code: "+351", flag: "🇵🇹" },
  { label: "Romania", code: "+40", flag: "🇷🇴" },
  { label: "Spain", code: "+34", flag: "🇪🇸" },
  { label: "Sweden", code: "+46", flag: "🇸🇪" },
] as const;

type CountryCodeOption = (typeof COUNTRY_CODES)[number];

function formatPhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  }
  return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
}

function GoogleGMulticolor({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

function GoogleBrandIcon() {
  return <GoogleGMulticolor size={20} />;
}

export default function Page() {
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const inputRef = useRef<import("react-native").TextInput>(null);
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const sheetHeight = Math.round(windowHeight * 0.62);

  const phoneDigits = phone.replace(/\D/g, "");
  const canContinue = phoneDigits.length >= 9;

  const heightScale = Math.min(Math.max(windowHeight / 844, 0.72), 1.15);
  const sp = (n: number) => Math.round(n * heightScale);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: sp(8),
            paddingBottom: sp(14),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 520 }}
            style={{ alignItems: "center", marginBottom: sp(8) }}
          >
            <Image
              source={require("../assets/vault-icon.png")}
              style={{
                width: 110,
                height: 110,
                borderRadius: 26,
                marginBottom: sp(12),
              }}
              resizeMode="cover"
            />
            <Text
              style={{
                ...typography.bold,
                fontSize: 36,
                letterSpacing: -0.7,
                color: "#000000",
              }}
            >
              The Vault
            </Text>
          </MotiView>

          {/* Phone field */}
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 560, delay: 80 }}
            style={{ marginBottom: sp(12) }}
          >
            {/* Floating label */}
            <MotiText
              animate={{
                translateY: isFocused || phone.length > 0 ? 0 : 20,
                opacity: isFocused || phone.length > 0 ? 1 : 0,
              }}
              transition={{ type: "timing", duration: 180 }}
              style={{
                ...typography.semibold,
                fontSize: isFocused || phone.length > 0 ? 11 : 14,
                color: isFocused ? "#007AFF" : "rgba(0,0,0,0.45)",
                letterSpacing: 0.1,
                marginBottom: 6,
                marginLeft: 6,
              }}
            >
              Phone number
            </MotiText>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setIsCountryModalVisible(true)}
                style={{ minWidth: 88 }}
              >
                <LiquidGlassCard
                  cornerRadius={20}
                  innerPadding={0}
                  style={{
                    height: 54,
                    borderWidth: 1.5,
                    borderColor: isFocused ? "rgba(0,122,255,0.35)" : "transparent",
                  }}
                >
                  {/* height: 54 matches card so alignItems:"center" actually centers */}
                  <View style={{ height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, gap: 8 }}>
                    <Text style={{ fontSize: 18 }}>{selectedCountry.flag}</Text>
                    <Text style={{ ...typography.bold, fontSize: 14, color: "#000000", letterSpacing: -0.2 }}>
                      {selectedCountry.code}
                    </Text>
                    <MotiView
                      animate={{ rotate: isCountryModalVisible ? "180deg" : "0deg" }}
                      transition={{ type: "timing", duration: 200 }}
                    >
                      <AntDesign name="caret-down" size={9} color={GLASS.steelDeep} />
                    </MotiView>
                  </View>
                </LiquidGlassCard>
              </Pressable>

              <Pressable style={{ flex: 1 }} onPress={() => inputRef.current?.focus()}>
                <LiquidGlassCard
                  cornerRadius={20}
                  innerPadding={0}
                  style={{
                    height: 54,
                    borderWidth: 1.5,
                    borderColor: isFocused ? "rgba(0,122,255,0.45)" : "transparent",
                  }}
                >
                  {/* height: 54 matches card so justifyContent:"center" actually centers */}
                  <View style={{ height: 54, justifyContent: "center", paddingHorizontal: 18 }}>
                    <TextInput
                      ref={inputRef}
                      placeholder="123-456-7890"
                      placeholderTextColor={GLASS.inkFaint}
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      value={phone}
                      onChangeText={(value) => setPhone(formatPhoneNumber(value))}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      style={{
                        ...typography.semibold,
                        fontSize: 16,
                        color: "#000000",
                        letterSpacing: 0.3,
                        padding: 0,
                        margin: 0,
                      }}
                    />
                  </View>
                </LiquidGlassCard>
              </Pressable>
            </View>

            <Text
              style={{
                ...typography.regular,
                marginTop: 8,
                marginLeft: 6,
                fontSize: 11,
                lineHeight: 14,
                color: "#000000",
              }}
            >
              Calls from The Vault are free; carrier rates may still apply.
            </Text>
          </MotiView>

          {/* Continue CTA — Liquid Glass (see THE_VAULT_UI_GUIDE.md) */}
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 560, delay: 140 }}
            style={{ marginBottom: sp(14) }}
          >
            <HeroGlassButton
              label="Continue"
              icon="arrow-forward"
              tint={canContinue ? V2.blueDeep : "#E5E7EB"}
              tintOpacity={canContinue ? 0.9 : 0.62}
              size="large"
              disabled={!canContinue}
              onPress={() => {
                router.push(hasOnboarded() ? "/home-tab" : "/onboarding");
              }}
            />
          </MotiView>

          <OrDivider style={{ marginTop: sp(2), marginBottom: sp(2) }} />

          <View style={{ flex: 1, minHeight: 0 }} />

          {/* Social providers */}
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 620, delay: 200 }}
            style={{ gap: 12 }}
          >
            <LiquidGlassSocialButton
              label={isSignUpMode ? "Sign up with Apple" : "Continue with Apple"}
              variant="apple"
              icon={<Ionicons name="logo-apple" size={20} color="#FFFFFF" />}
            />
            <LiquidGlassSocialButton
              label={isSignUpMode ? "Sign up with Google" : "Continue with Google"}
              variant="google"
              icon={<GoogleBrandIcon />}
              wrapIcon={false}
            />
            <LiquidGlassSocialButton
              label={isSignUpMode ? "Sign up with email" : "Log in with email"}
              variant="email"
              icon={<MaterialCommunityIcons name="email-outline" size={20} color="#FFFFFF" />}
            />
            <LiquidGlassSocialButton
              label={isSignUpMode ? "Sign up with Facebook" : "Continue with Facebook"}
              variant="facebook"
              icon={<Ionicons name="logo-facebook" size={20} color="#FFFFFF" />}
            />
          </MotiView>

          <Pressable
            onPress={() => setIsSignUpMode((prev) => !prev)}
            style={{ alignSelf: "center", marginTop: sp(10) }}
          >
            <Text
              style={{
                ...typography.bold,
                fontSize: 15,
                color: "#000000",
                textDecorationLine: "underline",
              }}
            >
              {isSignUpMode ? "Already have an account? Log in" : "New to the Vault? Sign Up"}
            </Text>
          </Pressable>

          {/* Disclaimer */}
          <View style={{ paddingHorizontal: 4 }}>
            <Text
              style={{
                ...typography.regular,
                fontSize: 10,
                lineHeight: 14,
                color: "#000000",
                textAlign: "center",
              }}
            >
              By proceeding, you consent to get calls, WhatsApp, or SMS/RCS messages, including by
              automated dialer, from The Vault and affiliates to the number provided. Text "stop"
              to opt out.{" "}
              <Text style={{ color: "#000000", textDecorationLine: "underline" }}>
                Privacy Policy
              </Text>{" "}
              ·{" "}
              <Text style={{ color: "#000000", textDecorationLine: "underline" }}>
                Terms of Service
              </Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isCountryModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <AnimatePresence>
          {isCountryModalVisible && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 180 }}
              style={{ flex: 1 }}
            >
              <TouchableOpacity
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: "rgba(26,26,31,0.5)",
                }}
                activeOpacity={1}
                onPress={() => setIsCountryModalVisible(false)}
              />
              <MotiView
                from={{ translateY: sheetHeight }}
                animate={{ translateY: 0 }}
                exit={{ translateY: sheetHeight }}
                transition={{ type: "timing", duration: 240 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: sheetHeight,
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                  overflow: "hidden",
                }}
              >
                <BlurView
                  intensity={Platform.OS === "ios" ? 80 : 50}
                  tint="light"
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(239,248,255,0.96)" }]} pointerEvents="none" />
                <View
                  style={{
                    alignItems: "center",
                    paddingTop: 10,
                    paddingBottom: 2,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "rgba(26,26,31,0.2)",
                    }}
                  />
                </View>
                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      ...typography.bold,
                      fontSize: 20,
                      letterSpacing: -0.3,
                      color: "#000000",
                    }}
                  >
                    Select country
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsCountryModalVisible(false)}
                    hitSlop={10}
                  >
                    <Ionicons name="close" size={22} color={GLASS.inkSoft} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                >
                  {COUNTRY_CODES.map((item) => {
                    const isSelected =
                      item.code === selectedCountry.code && item.label === selectedCountry.label;
                    return (
                      <Pressable
                        key={`${item.label}-${item.code}`}
                        onPress={() => {
                          setSelectedCountry(item);
                          setIsCountryModalVisible(false);
                        }}
                        style={{ marginBottom: 8 }}
                      >
                        <GlassSurface
                          tone={isSelected ? "oceanic" : "light"}
                          radius={18}
                          intensity={30}
                          contentStyle={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                          <Text
                            style={{
                              ...typography.semibold,
                              flex: 1,
                              fontSize: 15,
                              color: "#000000",
                              letterSpacing: -0.2,
                            }}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={{
                              ...typography.bold,
                              fontSize: 13,
                              color: "#000000",
                            }}
                          >
                            {item.code}
                          </Text>
                          {isSelected ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={GLASS.steelDeep}
                              style={{ marginLeft: 8 }}
                            />
                          ) : null}
                        </GlassSurface>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </MotiView>
            </MotiView>
          )}
        </AnimatePresence>
      </Modal>
    </View>
  );
}

function OrDivider({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>
      <View
        style={{
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: "rgba(30,27,75,0.16)",
        }}
      />
      <Text
        style={{
          ...typography.semibold,
          marginHorizontal: 14,
          fontSize: 11,
          letterSpacing: 2,
          color: "#000000",
        }}
      >
        or
      </Text>
      <View
        style={{
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: "rgba(30,27,75,0.16)",
        }}
      />
    </View>
  );
}

function LiquidGlassSocialButton({
  label,
  icon,
  variant,
  wrapIcon = true,
  backgroundColor: backgroundColorOverride,
  onPress,
  centerLabelAndChevron = false,
  chevronName = "chevron-forward",
  disabled,
}: {
  label: string;
  icon?: React.ReactNode;
  variant: "continue" | "google" | "apple" | "facebook" | "email";
  wrapIcon?: boolean;
  backgroundColor?: string;
  onPress?: () => void;
  centerLabelAndChevron?: boolean;
  chevronName?: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
}) {
  const isGoogle = variant === "google";
  const defaultBackgroundColor = isGoogle
    ? "#FFFFFF"
    : variant === "apple"
      ? "#000000"
      : variant === "facebook"
        ? "#1877F2"
        : variant === "email"
          ? "#F26457"
          : "#8FD9FB";
  const backgroundColor = backgroundColorOverride ?? defaultBackgroundColor;
  const textAndChevronColor = isGoogle || variant === "continue" ? "#111111" : "#FFFFFF";
  const brandFillOpacity = isGoogle ? 0 : variant === "continue" ? 0.55 : 0.84;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [pressed && { opacity: 0.86 }]}
      onPress={onPress ?? (() => {})}
    >
      <LiquidGlassCard
        cornerRadius={28}
        innerPadding={0}
        tint={backgroundColor}
        style={{
          borderWidth: 1,
          borderColor: isGoogle ? "#111111" : "transparent",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <View
          style={{
            height: 54,
            position: "relative",
            paddingHorizontal: 22,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 28,
              backgroundColor,
              opacity: brandFillOpacity,
            }}
          />
          {icon ? (
            wrapIcon ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isGoogle ? "#FFFFFF" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </View>
            ) : (
              <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                {icon}
              </View>
            )
          ) : null}
          {centerLabelAndChevron ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Text
                style={{
                  ...typography.semibold,
                  fontSize: 16,
                  color: textAndChevronColor,
                  letterSpacing: -0.3,
                }}
              >
                {label}
              </Text>
              <Ionicons name={chevronName} size={16} color={textAndChevronColor} />
            </View>
          ) : (
            <>
              <Text
                style={{
                  ...typography.semibold,
                  flex: 1,
                  fontSize: 16,
                  color: textAndChevronColor,
                  letterSpacing: -0.3,
                }}
              >
                {label}
              </Text>
              <Ionicons name={chevronName} size={16} color={textAndChevronColor} />
            </>
          )}
        </View>
      </LiquidGlassCard>
    </Pressable>
  );
}
