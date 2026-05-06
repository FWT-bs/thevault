import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { AnimatePresence, MotiView } from "moti";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

const CHECKMARK_ANIMATION = require("../assets/checkmark.json");

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AdState = "preview" | "watching" | "confirmed";

const AD_DURATION_SECONDS = 5;

interface AdGateModalProps {
  visible: boolean;
  credits: number;
  onClose: () => void;
  onClaim?: (credits: number) => void;
  sourceLabel?: string;
}

export function AdGateModal({
  visible,
  credits,
  onClose,
  onClaim,
  sourceLabel = "Earned this session",
}: AdGateModalProps) {
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(Math.round(height * 0.66), 540);
  const [state, setState] = useState<AdState>("preview");

  // Reset whenever the sheet closes so the next open starts at preview.
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setState("preview"), 240);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const handleWatch = useCallback(() => {
    setState("watching");
  }, []);

  const handleAdComplete = useCallback(() => {
    setState("confirmed");
    onClaim?.(credits);
    // Hold the confirmed state for ~1.1s so the user sees the credit
    // confirmation, then dismiss.
    const t = setTimeout(() => onClose(), 1100);
    return () => clearTimeout(t);
  }, [credits, onClaim, onClose]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <AnimatePresence>
        {visible && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "timing", duration: 200 }}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={state === "watching" ? undefined : onClose}
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(18,20,24,0.55)" },
              ]}
            />
            <MotiView
              from={{ translateY: sheetHeight }}
              animate={{ translateY: 0 }}
              exit={{ translateY: sheetHeight }}
              transition={{ type: "timing", duration: 280 }}
              style={[styles.sheet, { height: sheetHeight }]}
            >
              <BlurView
                intensity={Platform.OS === "ios" ? 80 : 50}
                tint="light"
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={[StyleSheet.absoluteFillObject, { backgroundColor: "#FFFFFF" }]}
                pointerEvents="none"
              />

              <View style={styles.handleBarRow}>
                <View style={styles.handleBar} />
              </View>

              <View style={styles.bodyWrap}>
                {state === "preview" && (
                  <PreviewBody
                    credits={credits}
                    sourceLabel={sourceLabel}
                    onWatch={handleWatch}
                    onSkip={handleSkip}
                  />
                )}
                {state === "watching" && (
                  <WatchingBody
                    credits={credits}
                    durationSeconds={AD_DURATION_SECONDS}
                    onComplete={handleAdComplete}
                  />
                )}
                {state === "confirmed" && (
                  <ConfirmedBody credits={credits} />
                )}
              </View>
            </MotiView>
          </MotiView>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function PreviewBody({
  credits,
  sourceLabel,
  onWatch,
  onSkip,
}: {
  credits: number;
  sourceLabel: string;
  onWatch: () => void;
  onSkip: () => void;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 320 }}
      style={styles.bodyInner}
    >
      <View style={styles.creditPreviewBlock}>
        <View style={styles.coinBadge}>
          <Ionicons name="sparkles" size={18} color="#000000" />
        </View>
        <Text style={styles.creditAmount}>+ {credits.toLocaleString()} credits</Text>
        <Text style={styles.creditCaption}>{sourceLabel}</Text>
      </View>

      <View style={styles.adPlaceholderCard}>
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(125,211,252,0.32)" }]}
          pointerEvents="none"
        />
        <View style={styles.adPlaceholderInner}>
          <View style={styles.adPlayIconWrap}>
            <Ionicons name="play" size={26} color="#000000" />
          </View>
          <Text style={styles.adPlaceholderTitle}>Quick ad · {AD_DURATION_SECONDS}s</Text>
          <Text style={styles.adPlaceholderSub}>
            Watch a short clip to release your credits.
          </Text>
        </View>
      </View>

      <View style={styles.actionStack}>
        <View style={styles.primaryBorder}>
          <Pressable
            onPress={onWatch}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.94 },
            ]}
          >
            <View pointerEvents="none" style={styles.primaryContent}>
              <Ionicons name="play-circle" size={18} color="#000000" />
              <Text style={styles.primaryText}>Watch Ad & Claim</Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={onSkip}
          hitSlop={8}
          style={({ pressed }) => [
            styles.skipLink,
            pressed && { opacity: 0.55 },
          ]}
        >
          <Text style={styles.skipLinkText}>Skip (lose credits)</Text>
        </Pressable>
      </View>

      <View style={styles.boostStrip}>
        <View style={styles.boostIcon}>
          <Ionicons name="flash" size={13} color="#000000" />
        </View>
        <Text style={styles.boostText}>
          Watch 3 ads today → 2x credits for 1 hour
        </Text>
      </View>
    </MotiView>
  );
}

function WatchingBody({
  credits,
  durationSeconds,
  onComplete,
}: {
  credits: number;
  durationSeconds: number;
  onComplete: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: durationSeconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((v) => Math.max(0, v - 1));
    }, 1000);
    const finishTimer = setTimeout(onComplete, durationSeconds * 1000 + 60);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimer);
    };
  }, [progress, durationSeconds, onComplete]);

  // SVG ring math
  const size = 132;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 220 }}
      style={styles.bodyInner}
    >
      <View style={styles.watchingHero}>
        <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
          <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(26,26,31,0.12)"
              strokeWidth={stroke}
              fill="transparent"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#0EA5E9"
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <Text style={styles.countdownNumber}>{secondsLeft}</Text>
        </View>
        <Text style={styles.watchingTitle}>Ad playing…</Text>
        <Text style={styles.watchingSub}>
          Hold tight — your {credits.toLocaleString()} credits will land in a moment.
        </Text>
      </View>

      <View style={styles.adPlaceholderCardSmall}>
        <Text style={styles.adPlaceholderCaption}>Sponsor placement</Text>
      </View>
    </MotiView>
  );
}

function ConfirmedBody({ credits }: { credits: number }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 14, stiffness: 220 }}
      style={[styles.bodyInner, { alignItems: "center", justifyContent: "center" }]}
    >
      <View style={styles.confirmedIconCircle}>
        <LottieView
          source={CHECKMARK_ANIMATION}
          autoPlay
          loop={false}
          style={{ width: 110, height: 110 }}
        />
      </View>
      <Text style={styles.confirmedTitle}>Credits added!</Text>
      <View style={styles.confirmedAmountPill}>
        <Ionicons name="sparkles" size={14} color="#000000" />
        <Text style={styles.confirmedAmountText}>
          + {credits.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.confirmedCaption}>Available in your wallet now.</Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(0,0,0,0.12)",
  },
  handleBarRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(26,26,31,0.22)",
  },
  bodyWrap: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  bodyInner: {
    flex: 1,
  },
  creditPreviewBlock: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  coinBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#A9E5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  creditAmount: {
    ...typography.bold,
    fontSize: 28,
    letterSpacing: -0.7,
    color: "#000000",
  },
  creditCaption: {
    ...typography.medium,
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 0.2,
    color: GLASS.inkMuted,
  },
  adPlaceholderCard: {
    minHeight: 134,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    marginBottom: 16,
  },
  adPlaceholderInner: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  adPlayIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  adPlaceholderTitle: {
    ...typography.bold,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.3,
  },
  adPlaceholderSub: {
    ...typography.regular,
    marginTop: 4,
    fontSize: 12,
    color: GLASS.inkMuted,
    textAlign: "center",
  },
  actionStack: {
    marginTop: 4,
    alignItems: "center",
  },
  primaryBorder: {
    alignSelf: "stretch",
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    padding: 2,
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButton: {
    height: 50,
    borderRadius: 26,
    backgroundColor: "#A9E5FF",
  },
  primaryContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    ...typography.bold,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    letterSpacing: -0.3,
  },
  skipLink: {
    marginTop: 12,
    paddingVertical: 6,
  },
  skipLinkText: {
    ...typography.semibold,
    fontSize: 12,
    color: GLASS.inkMuted,
    textDecorationLine: "underline",
    letterSpacing: -0.1,
  },
  boostStrip: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  boostIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#F6D98A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  boostText: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: "#000000",
    letterSpacing: -0.15,
  },
  watchingHero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  countdownNumber: {
    ...typography.bold,
    fontSize: 38,
    letterSpacing: -1,
    color: "#000000",
  },
  watchingTitle: {
    ...typography.bold,
    marginTop: 18,
    fontSize: 18,
    letterSpacing: -0.4,
    color: "#000000",
  },
  watchingSub: {
    ...typography.regular,
    marginTop: 6,
    paddingHorizontal: 24,
    fontSize: 13,
    lineHeight: 18,
    color: GLASS.inkMuted,
    textAlign: "center",
  },
  adPlaceholderCardSmall: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
  },
  adPlaceholderCaption: {
    ...typography.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  confirmedIconCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#CDEFD8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confirmedTitle: {
    ...typography.bold,
    marginTop: 18,
    fontSize: 24,
    letterSpacing: -0.6,
    color: "#000000",
  },
  confirmedAmountPill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  confirmedAmountText: {
    ...typography.bold,
    fontSize: 16,
    color: "#000000",
    letterSpacing: -0.3,
  },
  confirmedCaption: {
    ...typography.regular,
    marginTop: 10,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
});
