import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import {
  sendEmailOtp,
  sendPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "../services/auth/providers";
import { isDevMegaPhone } from "../services/auth/devMega";
import { useSession } from "../services/auth/SessionProvider";

type Channel = "sms" | "email";

const RESEND_SECONDS = 30;
const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ channel?: string; target?: string }>();
  const channel: Channel = params.channel === "email" ? "email" : "sms";
  const target = params.target ?? "";
  const { activateDevMega } = useSession();

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof __DEV__ === "undefined" || !__DEV__) return;
    if (channel !== "sms" || !isDevMegaPhone(target)) return;
    let cancelled = false;
    void (async () => {
      await activateDevMega();
      if (!cancelled) {
        router.replace("/home-tab");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channel, target, activateDevMega, router]);

  const canResend = resendCountdown === 0 && !resending && !verifying;
  const canVerify = code.length === CODE_LENGTH && !verifying;

  const submit = async (token = code) => {
    if (token.length !== CODE_LENGTH || verifying) return;
    setVerifying(true);
    setError(null);
    const result =
      channel === "email"
        ? await verifyEmailOtp(target, token)
        : await verifyPhoneOtp(target, token);
    setVerifying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    // The session listener in SessionProvider will pick the new session up;
    // _layout's AuthRouter handles the redirect to /onboarding or /home-tab
    // depending on the user_metadata.has_onboarded flag.
    Keyboard.dismiss();
  };

  const handleResend = async () => {
    if (!canResend) return;
    if (
      typeof __DEV__ !== "undefined" &&
      __DEV__ &&
      channel === "sms" &&
      isDevMegaPhone(target)
    ) {
      setResendCountdown(RESEND_SECONDS);
      return;
    }
    setResending(true);
    setError(null);
    const result =
      channel === "email" ? await sendEmailOtp(target) : await sendPhoneOtp(target);
    setResending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setResendCountdown(RESEND_SECONDS);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#000000" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{channel === "email" ? "Email code" : "Phone code"}</Text>
          <Text style={styles.title}>
            Enter the {CODE_LENGTH}-digit code we sent to
          </Text>
          <Text style={styles.target}>{target || "your account"}</Text>

          <Pressable
            accessibilityLabel="Edit code"
            onPress={() => inputRef.current?.focus()}
            style={styles.codeRow}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, idx) => {
              const char = code[idx];
              const active = idx === code.length && !verifying;
              return (
                <View
                  key={idx}
                  style={[
                    styles.codeBox,
                    active && styles.codeBoxActive,
                    Boolean(char) && styles.codeBoxFilled,
                  ]}
                >
                  <Text style={styles.codeChar}>{char ?? ""}</Text>
                </View>
              );
            })}
          </Pressable>

          {/* Hidden, focused input that captures the actual digits. */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
              setCode(digits);
              if (digits.length === CODE_LENGTH) submit(digits);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            style={styles.hiddenInput}
            caretHidden
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canVerify}
            onPress={() => submit()}
            style={({ pressed }) => [
              styles.verifyBtn,
              !canVerify && styles.verifyBtnDisabled,
              pressed && canVerify && { opacity: 0.85 },
            ]}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!canResend}
            onPress={handleResend}
            style={({ pressed }) => [styles.resendBtn, pressed && canResend && { opacity: 0.7 }]}
          >
            {resending ? (
              <ActivityIndicator size="small" color={V2.cyanInk} />
            ) : (
              <Text
                style={[styles.resendText, !canResend && { color: V2.muted }]}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F4F2",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  eyebrow: {
    ...typography.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: V2.muted,
  },
  title: {
    ...typography.bold,
    marginTop: 6,
    fontSize: 24,
    color: "#000000",
    letterSpacing: -0.6,
  },
  target: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 15,
    color: V2.cyan,
  },
  codeRow: {
    marginTop: 24,
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
  },
  codeBox: {
    width: 44,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: V2.hairlineStrong,
    backgroundColor: "#FAFAF7",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBoxActive: {
    borderColor: V2.blueDeep,
    backgroundColor: "#FFFFFF",
  },
  codeBoxFilled: {
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
  },
  codeChar: {
    ...typography.bold,
    fontSize: 24,
    color: "#000000",
    letterSpacing: 0,
  },
  hiddenInput: {
    width: 1,
    height: 1,
    opacity: 0,
    position: "absolute",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 16,
  },
  verifyBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 27,
    backgroundColor: V2.blueDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  verifyBtnText: {
    ...typography.bold,
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  resendBtn: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendText: {
    ...typography.bold,
    fontSize: 14,
    color: V2.cyanInk,
  },
});
