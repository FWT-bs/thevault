import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { LiquidGlassButton } from "../components/LiquidGlassButton";

import { CardSurface, SectionTitle, SubPage } from "../components/SubPage";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

interface Tier {
  level: number;
  name: string;
  status: "done" | "current" | "locked";
  description: string;
  perks: string[];
}

const TIERS: Tier[] = [
  {
    level: 1,
    name: "Email + phone",
    status: "done",
    description: "Verified the basics so you can earn and play.",
    perks: ["Earn up to 500 CR / day", "Daily streak bonuses", "Play in-app games"],
  },
  {
    level: 2,
    name: "Identity",
    status: "current",
    description: "Government ID confirmed. You can cash out.",
    perks: ["Cash out via PayPal", "Higher daily caps", "Partner game payouts"],
  },
  {
    level: 3,
    name: "Address",
    status: "locked",
    description: "Verify your home address to unlock VIP tiers.",
    perks: ["Bank wire cash out", "Crypto payouts", "Vault Platinum access"],
  },
];

export default function VerificationPage() {
  return (
    <SubPage
      title="Verification"
      subtitle="Unlock higher payouts and tiers"
      backTo="/profile-tab"
    >
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Current level</Text>
          <Text style={styles.headerLevel}>Level 2</Text>
          <Text style={styles.headerHint}>One more step to reach Level 3</Text>
        </View>
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark" size={36} color={GLASS.moss} />
        </View>
      </View>

      <SectionTitle>Verification path</SectionTitle>
      {TIERS.map((tier, i) => (
        <MotiView
          key={tier.level}
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 80 + i * 90 }}
          style={{ marginBottom: 12 }}
        >
          <TierCard tier={tier} />
        </MotiView>
      ))}
    </SubPage>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  const meta =
    tier.status === "done"
      ? { bg: "rgba(74,107,92,0.16)", icon: "checkmark-circle" as const, tint: GLASS.moss, label: "Verified" }
      : tier.status === "current"
        ? { bg: "rgba(56,189,248,0.16)", icon: "ellipse" as const, tint: GLASS.steelDeep, label: "Active" }
        : { bg: "rgba(26,26,31,0.08)", icon: "lock-closed" as const, tint: GLASS.inkMuted, label: "Locked" };
  return (
    <CardSurface style={{ padding: 16 }}>
      <View style={styles.tierTop}>
        <View style={[styles.tierBadge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={13} color={meta.tint} />
          <Text style={[styles.tierBadgeText, { color: meta.tint }]}>{meta.label}</Text>
        </View>
        <Text style={styles.tierLevel}>Level {tier.level}</Text>
      </View>
      <Text style={styles.tierName}>{tier.name}</Text>
      <Text style={styles.tierDesc}>{tier.description}</Text>
      <View style={styles.perksList}>
        {tier.perks.map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Ionicons name="sparkles-outline" size={11} color={GLASS.inkMuted} />
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>
      {tier.status === "locked" ? (
        <View style={{ marginTop: 14 }}>
          <LiquidGlassButton
            label="Start verification"
            systemImage="arrow.forward"
            size="small"
            tone="cobalt"
            variant="glassProminent"
            fullWidth
          />
        </View>
      ) : null}
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  headerLeft: { flex: 1 },
  headerLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  headerLevel: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 28,
    color: GLASS.ink,
    letterSpacing: -0.6,
  },
  headerHint: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  shieldWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(74,107,92,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  tierTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  tierBadgeText: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tierLevel: {
    ...typography.bold,
    fontSize: 11,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tierName: {
    ...typography.bold,
    fontSize: 17,
    color: GLASS.ink,
    letterSpacing: -0.4,
  },
  tierDesc: {
    ...typography.regular,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: GLASS.inkMuted,
  },
  perksList: {
    marginTop: 12,
    gap: 6,
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
});
