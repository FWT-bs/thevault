import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../components/SubPage";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

interface Tier {
  id: string;
  label: string;
  threshold: string;
  color: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  perks: string[];
  unlocked: boolean;
}

const TIERS: Tier[] = [
  { id: "bronze", label: "Bronze", threshold: "Sign-up", color: "#FFD7C2", icon: "medal-outline", perks: ["Daily streak bonus", "Earn from all games"], unlocked: true },
  { id: "silver", label: "Silver", threshold: "1,000 lifetime CR", color: "#E5E7EB", icon: "medal", perks: ["+5% on streak bonuses", "Email support"], unlocked: true },
  { id: "gold", label: "Vault Gold", threshold: "5,000 lifetime CR", color: "#F6D98A", icon: "trophy-variant", perks: ["+10% boost", "Priority cashout queue", "Phone support"], unlocked: true },
  { id: "platinum", label: "Platinum", threshold: "20,000 lifetime CR", color: "#A9E5FF", icon: "crown-outline", perks: ["+25% boost", "VIP-only games", "Free wire transfers"], unlocked: false },
  { id: "obsidian", label: "Obsidian", threshold: "100,000 lifetime CR", color: "#1A1A1F", icon: "diamond-stone", perks: ["Personal vault host", "Same-day cashouts", "Exclusive partner offers"], unlocked: false },
];

export default function TierPage() {
  const lifetime = 14250;
  const nextThreshold = 20000;
  const progress = Math.min(1, lifetime / nextThreshold);

  return (
    <SubPage
      title="Loyalty tier"
      subtitle="Unlock more by playing more"
      backTo="/profile-tab"
    >
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Current tier</Text>
            <Text style={styles.heroTier}>Vault Gold</Text>
            <Text style={styles.heroLifetime}>{lifetime.toLocaleString()} lifetime CR</Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="trophy-variant" size={36} color="#000000" />
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {(nextThreshold - lifetime).toLocaleString()} more CR to reach Platinum
        </Text>
      </MotiView>

      <SectionTitle>All tiers</SectionTitle>
      <View style={{ gap: 10 }}>
        {TIERS.map((tier, i) => (
          <MotiView
            key={tier.id}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320, delay: 70 + i * 60 }}
          >
            <View
              style={[
                styles.tierCard,
                !tier.unlocked && styles.tierCardLocked,
              ]}
            >
              <View style={styles.tierTop}>
                <View style={[styles.tierIconWrap, { backgroundColor: tier.color }]}>
                  <MaterialCommunityIcons
                    name={tier.icon}
                    size={20}
                    color={tier.id === "obsidian" ? "#FFFFFF" : "#000000"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierLabel}>{tier.label}</Text>
                  <Text style={styles.tierThreshold}>{tier.threshold}</Text>
                </View>
                {tier.unlocked ? (
                  <View style={styles.unlockedPill}>
                    <Ionicons name="checkmark" size={10} color="#1F5E36" />
                    <Text style={styles.unlockedText}>Unlocked</Text>
                  </View>
                ) : (
                  <Ionicons name="lock-closed" size={14} color={GLASS.inkFaint} />
                )}
              </View>
              <View style={styles.perksList}>
                {tier.perks.map((p) => (
                  <View key={p} style={styles.perkRow}>
                    <Ionicons name="sparkles-outline" size={11} color={GLASS.inkMuted} />
                    <Text style={styles.perkText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          </MotiView>
        ))}
      </View>

      <SectionTitle>How tiers work</SectionTitle>
      <CardSurface style={{ padding: 16, gap: 10 }}>
        <Text style={styles.aboutText}>
          Lifetime credits never decrease — once you reach a tier, it's yours. We refresh tier perks every Monday so the math always works in your favor.
        </Text>
      </CardSurface>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  heroTier: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 26,
    color: GLASS.ink,
    letterSpacing: -0.6,
  },
  heroLifetime: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F6D98A",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    marginTop: 18,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(56,189,248,0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#7DD3FC",
  },
  progressHint: {
    ...typography.semibold,
    marginTop: 8,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  tierCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  tierCardLocked: {
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  tierTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tierLabel: {
    ...typography.bold,
    fontSize: 15,
    color: GLASS.ink,
    letterSpacing: -0.3,
  },
  tierThreshold: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  unlockedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#CDEFD8",
  },
  unlockedText: {
    ...typography.bold,
    fontSize: 9,
    color: "#1F5E36",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  perksList: {
    marginTop: 12,
    gap: 5,
    marginLeft: 4,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  perkText: {
    ...typography.semibold,
    fontSize: 12,
    color: GLASS.ink,
    letterSpacing: -0.1,
  },
  aboutText: {
    ...typography.regular,
    fontSize: 13,
    lineHeight: 18,
    color: GLASS.inkSoft,
  },
});
