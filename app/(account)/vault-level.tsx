import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent, VAULT_TIERS } from "@thevault/domain";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { V2 } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useVaultLevel } from "../../services/features/vaultLevel";
import { useWalletBalance } from "../../services/features/wallet";

const TIER_COLORS = {
  starter: "#E5E7EB",
  bronze: "#FFD7C2",
  silver: "#D9F2FF",
  gold: "#F6D98A",
  platinum: "#DED1FB",
  diamond: "#1A1A1F",
} as const;

export default function VaultLevelPage() {
  const { data: vaultLevel } = useVaultLevel();
  const { data: wallet } = useWalletBalance();
  const currentTier = vaultLevel?.currentTier;
  const nextTier = vaultLevel?.nextTier;
  const progressPct = Math.round((vaultLevel?.progressToNext ?? 0) * 100);
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? 3000);
  const nextShareLabel = nextTier ? formatSharePercent(nextTier.revenueShareBps) : shareLabel;
  const tierId = currentTier?.id ?? "starter";

  return (
    <SubPage
      title="Vault Level"
      subtitle="Your verified ad revenue share"
      backTo="/profile-tab"
      backLabel="Profile"
    >
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420 }}
        style={[styles.heroCard, { backgroundColor: TIER_COLORS[tierId] }]}
      >
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroKicker}>Current tier</Text>
            <Text style={styles.heroTier}>{currentTier?.name ?? "Starter"}</Text>
            <Text style={styles.heroSub}>
              {shareLabel} of verified eligible ad revenue
            </Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name={tierId === "platinum" ? "crown-outline" : tierId === "gold" ? "trophy-variant" : "shield-check-outline"}
              size={34}
              color="#000000"
            />
          </View>
        </View>

        <View style={styles.heroMetrics}>
          <Metric label="Daily cap" value={`$${(vaultLevel?.dailyEarningCapUsd ?? 0.5).toFixed(2)}`} />
          <Metric label="Ads today" value={`${vaultLevel?.adsWatchedToday ?? 0}/${vaultLevel?.dailyRewardedAdLimit ?? 20}`} />
          <Metric label="Trust" value={`${vaultLevel?.trustScore ?? 50}`} />
        </View>

        <View style={styles.progressTop}>
          <Text style={styles.progressText}>{progressPct}% to {nextTier?.shortName ?? "maximum share"}</Text>
          <Text style={styles.progressText}>{nextShareLabel}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      </MotiView>

      <SectionTitle>Revenue share math</SectionTitle>
      <CardSurface style={styles.mathCard}>
        <View style={styles.mathRow}>
          <MathStep label="Estimated ad revenue" value="$0.0220" />
          <Ionicons name="close" size={14} color={V2.muted} />
          <MathStep label={`${currentTier?.shortName ?? "Starter"} share`} value={shareLabel} />
          <Ionicons name="arrow-forward" size={14} color={V2.muted} />
          <MathStep label="Pending reward" value={`$${((0.022 * (vaultLevel?.revenueShareBps ?? 3000)) / 10000).toFixed(4)}`} />
        </View>
        <Text style={styles.mathNote}>
          Rewards move from estimated to pending, then become available after ad-network verification.
        </Text>
      </CardSurface>

      <SectionTitle>Progress requirements</SectionTitle>
      <CardSurface style={{ padding: 6 }}>
        {(vaultLevel?.requirements ?? fallbackRequirements).map((item, index, arr) => (
          <View key={item.id} style={[styles.requirementRow, index < arr.length - 1 && styles.requirementBorder]}>
            <View style={[styles.requirementIcon, item.complete ? styles.requirementIconDone : styles.requirementIconOpen]}>
              <Ionicons name={item.complete ? "checkmark" : "ellipse-outline"} size={14} color={item.complete ? "#1F5E36" : V2.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.requirementLabel}>{item.label}</Text>
              {item.current !== null && item.target !== null ? (
                <Text style={styles.requirementMeta}>{item.current.toLocaleString()} / {item.target.toLocaleString()}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </CardSurface>

      <SectionTitle>Wallet transparency</SectionTitle>
      <View style={styles.walletGrid}>
        <WalletStat label="Available" value={`$${(wallet?.availableUsd ?? 0).toFixed(2)}`} tint={V2.cyanSoft} />
        <WalletStat label="Pending" value={`$${(wallet?.pendingUsd ?? 0).toFixed(2)}`} tint={V2.amberSoft} />
        <WalletStat label="Locked" value={`$${(wallet?.lockedUsd ?? 0).toFixed(2)}`} tint="#F5F5F7" />
        <WalletStat label="Generated" value={`$${(wallet?.lifetimeGeneratedUsd ?? 0).toFixed(2)}`} tint="#FFFFFF" />
      </View>

      <SectionTitle>Tier table</SectionTitle>
      <View style={{ gap: 10 }}>
        {VAULT_TIERS.map((tier) => {
          const active = tier.id === tierId;
          return (
            <View key={tier.id} style={[styles.tierRow, active && styles.tierRowActive]}>
              <View style={[styles.tierSwatch, { backgroundColor: TIER_COLORS[tier.id] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierMeta}>
                  {formatSharePercent(tier.revenueShareBps)} share · ${tier.dailyEarningCapUsd.toFixed(2)}/day cap
                </Text>
              </View>
              {tier.temporary ? (
                <View style={styles.tempPill}>
                  <Text style={styles.tempPillText}>Boost</Text>
                </View>
              ) : active ? (
                <Ionicons name="checkmark-circle" size={18} color={V2.cyan} />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.bottomButton}>
        <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" />
        <Text style={styles.bottomButtonText}>Trust status: {vaultLevel?.trustState ?? "building"}</Text>
      </View>
    </SubPage>
  );
}

const fallbackRequirements = [
  { id: "account", label: "Account created", complete: true, current: null, target: null },
  { id: "active-days", label: "3 active earning days", complete: false, current: 0, target: 3 },
  { id: "verified-ads", label: "25 verified rewarded ads", complete: false, current: 0, target: 25 },
  { id: "clean-activity", label: "3 clean activity days", complete: false, current: 0, target: 3 },
  { id: "redemption", label: "Reach Bronze", complete: false, current: 0, target: 0 },
];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MathStep({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mathStep}>
      <Text style={styles.mathValue}>{value}</Text>
      <Text style={styles.mathLabel}>{label}</Text>
    </View>
  );
}

function WalletStat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={[styles.walletStat, { backgroundColor: tint }]}>
      <Text style={styles.walletValue}>{value}</Text>
      <Text style={styles.walletLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    marginBottom: 4,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroKicker: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTier: {
    ...typography.bold,
    marginTop: 5,
    fontSize: 25,
    lineHeight: 29,
    color: "#000000",
    letterSpacing: -0.8,
  },
  heroSub: {
    ...typography.semibold,
    marginTop: 5,
    fontSize: 13,
    color: V2.muted,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroMetrics: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.1)",
  },
  metricValue: {
    ...typography.bold,
    fontSize: 16,
    color: "#000000",
  },
  metricLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    color: V2.muted,
  },
  progressTop: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    ...typography.bold,
    fontSize: 12,
    color: V2.muted,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#000000",
  },
  mathCard: {
    padding: 14,
  },
  mathRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mathStep: {
    flex: 1,
    minWidth: 0,
  },
  mathValue: {
    ...typography.bold,
    fontSize: 14,
    color: "#000000",
  },
  mathLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 9,
    color: V2.muted,
  },
  mathNote: {
    ...typography.semibold,
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: V2.muted,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  requirementBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  requirementIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  requirementIconDone: {
    backgroundColor: "#CDEFD8",
  },
  requirementIconOpen: {
    backgroundColor: "#F5F5F7",
  },
  requirementLabel: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
  },
  requirementMeta: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  walletGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  walletStat: {
    width: "48%",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
    padding: 14,
  },
  walletValue: {
    ...typography.bold,
    fontSize: 19,
    color: V2.ink,
    letterSpacing: -0.4,
  },
  walletLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  tierRow: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tierRowActive: {
    borderColor: V2.cyan,
    borderWidth: 2,
  },
  tierSwatch: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
  },
  tierName: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
  },
  tierMeta: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  tempPill: {
    borderRadius: 999,
    backgroundColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tempPillText: {
    ...typography.bold,
    fontSize: 10,
    color: "#FFFFFF",
  },
  bottomButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  bottomButtonText: {
    ...typography.bold,
    color: "#FFFFFF",
    fontSize: 14,
    textTransform: "capitalize",
  },
});
