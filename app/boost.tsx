import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../components/SubPage";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

const ELIGIBLE: { id: string; title: string; rate: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; color: string }[] = [
  { id: "blockpuzzle", title: "Block Puzzle Rush", rate: "12 → 24 CR / min", icon: "puzzle-outline", color: "#FFD7C2" },
  { id: "wordladder", title: "Word Ladder", rate: "8 → 16 CR / min", icon: "ladder", color: "#A9E5FF" },
  { id: "blackjack", title: "Vault Blackjack", rate: "1.5x payout", icon: "cards-outline", color: "#CDEFD8" },
];

const TIPS = [
  "Boosts only stack with daily streak credits, not with partner-game referral bonuses.",
  "If you close the app, the timer keeps running — don't waste your window.",
  "You can hold up to two boosts at a time. Activate the second from your inbox.",
];

export default function BoostPage() {
  const [active, setActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(90 * 60);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <SubPage
      title="2x Boost"
      subtitle="Double credits on eligible games"
      backTo="/home-tab"
    >
      <View style={[styles.heroCard, active && styles.heroCardActive]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [
                {
                  scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }),
                },
              ],
            },
          ]}
        />
        <View style={styles.heroIconWrap}>
          <Ionicons name="flash" size={36} color="#000000" />
        </View>
        <Text style={styles.heroLabel}>{active ? "Boost active" : "Activate now"}</Text>
        <Text style={styles.heroValue}>2x</Text>
        <Text style={styles.heroSub}>credits on every eligible round</Text>
        {active ? (
          <View style={styles.timerWrap}>
            <Ionicons name="timer-outline" size={14} color="#000000" />
            <Text style={styles.timerText}>
              {mins}m {String(secs).padStart(2, "0")}s left
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => setActive((v) => !v)}
          style={({ pressed }) => [
            styles.cta,
            active && styles.ctaActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <View pointerEvents="none" style={styles.ctaContent}>
            <Ionicons
              name={active ? "pause" : "flash"}
              size={15}
              color="#000000"
            />
            <Text style={styles.ctaText}>
              {active ? "Pause boost" : "Activate · 90 min"}
            </Text>
          </View>
        </Pressable>
      </View>

      <SectionTitle>Boosted right now</SectionTitle>
      <View style={{ gap: 10 }}>
        {ELIGIBLE.map((g, i) => (
          <MotiView
            key={g.id}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320, delay: 60 + i * 70 }}
          >
            <Pressable
              style={({ pressed }) => [
                styles.gameCard,
                pressed && { opacity: 0.9 },
              ]}
            >
              <View pointerEvents="none" style={styles.gameInner}>
                <View style={[styles.gameIcon, { backgroundColor: g.color }]}>
                  <MaterialCommunityIcons name={g.icon} size={22} color="#000000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameTitle}>{g.title}</Text>
                  <Text style={styles.gameRate}>{g.rate}</Text>
                </View>
                <View style={styles.boostBadge}>
                  <Text style={styles.boostBadgeText}>2x</Text>
                </View>
              </View>
            </Pressable>
          </MotiView>
        ))}
      </View>

      <SectionTitle>Things to know</SectionTitle>
      <CardSurface style={{ padding: 16, gap: 10 }}>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name="ellipse" size={6} color={GLASS.steelDeep} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </CardSurface>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#BAE6FD",
    overflow: "hidden",
  },
  heroCardActive: {
    backgroundColor: "#A9E5FF",
  },
  pulseRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "rgba(56,189,248,0.6)",
    top: 14,
  },
  heroIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    ...typography.bold,
    marginTop: 14,
    fontSize: 11,
    color: "#000000",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroValue: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 56,
    color: "#000000",
    letterSpacing: -2,
    lineHeight: 60,
  },
  heroSub: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 13,
    color: GLASS.inkSoft,
  },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  timerText: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
    letterSpacing: -0.2,
  },
  cta: {
    marginTop: 18,
    minWidth: 220,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  ctaActive: {
    backgroundColor: "#FDFBF6",
  },
  ctaContent: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  ctaText: {
    ...typography.bold,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.2,
  },
  gameCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gameInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gameIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  gameTitle: {
    ...typography.bold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  gameRate: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  boostBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "#FFD7C2",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  boostBadgeText: {
    ...typography.bold,
    fontSize: 10,
    color: "#000000",
    letterSpacing: -0.1,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 4,
  },
  tipText: {
    ...typography.regular,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: GLASS.inkSoft,
  },
});
