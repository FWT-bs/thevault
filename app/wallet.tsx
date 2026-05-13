import { Ionicons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { FlatCard } from "../components/FlatCard";
import { V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { useVaultLevel } from "../services/features/vaultLevel";
import { useWalletBalance, useWalletTransactions } from "../services/features/wallet";
import TabScreen from "../components/TabScreen";

export default function WalletTab() {
  const router = useRouter();
  const { data: wallet } = useWalletBalance();
  const { data: vaultLevel } = useVaultLevel();
  const { data: txItems } = useWalletTransactions();
  const usd = wallet?.availableUsd ?? wallet?.usdBalance ?? 0;
  const [wholeStr, fracStr = "00"] = usd.toFixed(2).split(".");
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? wallet?.currentShareBps ?? 3000);
  const tierLabel = vaultLevel?.currentTier.shortName ?? wallet?.currentTier ?? "Starter";
  const nextTierLabel = vaultLevel?.nextTier?.shortName ?? "Bronze";
  const nextShareLabel = vaultLevel?.nextTier ? formatSharePercent(vaultLevel.nextTier.revenueShareBps) : shareLabel;
  const progressPct = Math.round((vaultLevel?.progressToNext ?? 0) * 100);
  const rows =
    txItems?.slice(0, 4).map((tx) => ({
      title: tx.title,
      when: tx.detail || "Recent",
      amount: `${tx.kind === "out" ? "-" : "+"}${tx.currency === "CR" ? `${Math.abs(tx.amount)} CR` : `$${Math.abs(tx.amount).toFixed(2)}`}`,
      kind: tx.kind,
    })) ?? [];
  const hasBalanceActivity =
    usd > 0 ||
    (wallet?.pendingUsd ?? 0) > 0 ||
    (wallet?.lockedUsd ?? 0) > 0 ||
    (wallet?.lifetimeEarnedUsd ?? 0) > 0 ||
    rows.length > 0;
  const chartLinePath = hasBalanceActivity
    ? "M 0 72 C 42 56 48 36 82 44 C 118 52 126 20 164 28 C 202 36 212 62 248 48 C 282 35 292 22 320 18"
    : "M 0 70 C 64 70 96 70 128 70 C 178 70 216 70 256 70 C 284 70 302 70 320 70";
  const chartFillPath = `${chartLinePath} L 320 86 L 0 86 Z`;
  const chartEndY = hasBalanceActivity ? 18 : 70;

  return (
    <TabScreen
      title="Wallet"
      subtitle="Balance, cash outs, and rewards"
      backgroundColor={V2.bg}
      titleColor={V2.ink}
      subtitleColor={V2.muted}
      contentContainerStyle={{ paddingTop: 8 }}
    >
      <FlatCard radius={26} pad={20} style={{ marginBottom: 14 }}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>Available balance</Text>
          <View style={styles.tierPill}>
            <Ionicons name="diamond" size={11} color={V2.amber} />
            <Text style={styles.tierText}>{tierLabel} · {shareLabel}</Text>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.mainBalance}>{wholeStr}</Text>
          <Text style={styles.balanceFrac}>.{fracStr}</Text>
        </View>
        <Text style={styles.creditsLine}>{(wallet?.availableCredits ?? wallet?.credits ?? 0).toLocaleString()} CR · confirmed only</Text>

        <View style={styles.balanceSplitGrid}>
          <BalanceSplit label="Pending" value={`$${(wallet?.pendingUsd ?? 0).toFixed(2)}`} tone="cyan" />
          <BalanceSplit label="Locked" value={`$${(wallet?.lockedUsd ?? 0).toFixed(2)}`} tone="amber" />
          <BalanceSplit label="Generated" value={`$${(wallet?.lifetimeGeneratedUsd ?? 0).toFixed(2)}`} tone="plain" />
          <BalanceSplit label="Earned" value={`$${(wallet?.lifetimeEarnedUsd ?? 0).toFixed(2)}`} tone="plain" />
        </View>
        <Pressable onPress={() => router.push("/transactions")} style={styles.pendingLink}>
          <Ionicons name="time-outline" size={14} color={V2.cyan} />
          <Text style={styles.pendingLinkText}>View pending verification</Text>
        </Pressable>

        <View style={styles.chartWell}>
          <View style={styles.chartTop}>
            <View>
              <Text style={styles.chartLabel}>Balance activity</Text>
              <Text style={styles.chartValue}>Balance trend</Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>{hasBalanceActivity ? "Live" : "$0.00"}</Text>
            </View>
          </View>
          <Svg width="100%" height={86} viewBox="0 0 320 86">
            <Defs>
              <SvgLinearGradient id="walletLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={V2.blueDeep} stopOpacity={0.9} />
                <Stop offset="58%" stopColor={V2.blueDeep} stopOpacity={0.95} />
                <Stop offset="100%" stopColor={V2.blueDeep} stopOpacity={1} />
              </SvgLinearGradient>
              <SvgLinearGradient id="walletFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={V2.blueDeep} stopOpacity={0.34} />
                <Stop offset="100%" stopColor={V2.blueDeep} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={chartFillPath}
              fill="url(#walletFill)"
            />
            <Path
              d={chartLinePath}
              fill="none"
              stroke="url(#walletLine)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Circle cx="320" cy={chartEndY} r="5" fill="#FFFFFF" />
            <Circle cx="320" cy={chartEndY} r="3" fill={V2.blueDeep} />
          </Svg>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Next share tier</Text>
            <Text style={styles.progressValue}>{progressPct}% to {nextTierLabel}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            Unlock {nextShareLabel} share with more verified ads and clean activity.
          </Text>
        </View>

        <View style={styles.ctaRow}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push("/redeem")} style={styles.ghostButton}>
              <Ionicons name="arrow-down-circle" size={16} color="#FFFFFF" />
              <Text style={styles.ghostButtonText}>Cash out</Text>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push("/games-tab")} style={styles.primaryButton}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Earn more</Text>
            </Pressable>
          </View>
        </View>
      </FlatCard>

      <View style={styles.statsRow}>
        <FlatCard radius={18} pad={14} style={{ flex: 1 }}>
          <Text style={styles.statLabel}>This week</Text>
          <Text style={styles.statValue}>+${(wallet?.lifetimeEarnedUsd ?? 0).toFixed(2)}</Text>
        </FlatCard>
        <FlatCard radius={18} pad={14} style={[styles.bonusCard, { flex: 1 }]}>
          <Text style={styles.bonusLabel}>Vault share</Text>
          <Text style={styles.bonusValue}>{shareLabel}</Text>
        </FlatCard>
      </View>

      <FlatCard radius={20} pad={0}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Recent activity</Text>
          </View>
          <Pressable onPress={() => router.push("/transactions")}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>
        {rows.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>No wallet activity yet.</Text>
          </View>
        ) : rows.map((row, idx) => {
          const positive = row.amount.startsWith("+");
          return (
            <View key={row.title} style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}>
              <View style={[styles.rowIcon, row.kind === "bonus" ? styles.rowIconBonus : styles.rowIconDefault]}>
                <Ionicons
                  name={row.kind === "out" ? "arrow-up" : row.kind === "bonus" ? "flame" : "trending-up"}
                  size={15}
                  color={row.kind === "bonus" ? V2.amber : V2.cyan}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowWhen}>{row.when}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: positive ? "#0F7A2E" : V2.ink }]}>{row.amount}</Text>
            </View>
          );
        })}
      </FlatCard>
    </TabScreen>
  );
}

function BalanceSplit({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "plain";
}) {
  const backgroundColor = tone === "cyan" ? V2.cyanSoft : tone === "amber" ? V2.amberSoft : "#FFFFFF";
  const color = tone === "amber" ? V2.amberInk : tone === "cyan" ? V2.cyanInk : V2.ink;
  return (
    <View style={[styles.balanceSplit, { backgroundColor }]}>
      <Text style={[styles.balanceSplitValue, { color }]}>{value}</Text>
      <Text style={styles.balanceSplitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    ...typography.semibold,
    fontSize: 13,
    color: V2.muted,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: V2.amberSoft,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tierText: {
    ...typography.bold,
    fontSize: 11,
    color: V2.amberInk,
  },
  balanceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  currency: {
    ...typography.bold,
    fontSize: 32,
    color: V2.muted,
    marginBottom: 14,
  },
  mainBalance: {
    ...typography.bold,
    fontSize: 64,
    lineHeight: 68,
    color: V2.ink,
    letterSpacing: -2.3,
  },
  balanceFrac: {
    ...typography.bold,
    fontSize: 28,
    color: V2.muted,
    marginBottom: 8,
  },
  creditsLine: {
    ...typography.semibold,
    fontSize: 13,
    color: V2.muted,
  },
  balanceSplitGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  balanceSplit: {
    width: "48%",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V2.hairlineStrong,
    padding: 10,
  },
  balanceSplitValue: {
    ...typography.bold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  balanceSplitLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingLink: {
    marginTop: 10,
    minHeight: 34,
    borderRadius: 17,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V2.hairlineStrong,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingLinkText: {
    ...typography.bold,
    fontSize: 12,
    color: V2.cyan,
  },
  chartWell: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    backgroundColor: V2.cyanSoft,
  },
  chartTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartLabel: {
    ...typography.semibold,
    fontSize: 12,
    color: V2.cyanInk,
  },
  chartValue: {
    ...typography.bold,
    fontSize: 18,
    color: V2.ink,
    marginTop: 2,
  },
  chartBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chartBadgeText: {
    ...typography.bold,
    fontSize: 11,
    color: V2.cyan,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    ...typography.semibold,
    fontSize: 13,
    color: V2.muted,
  },
  progressValue: {
    ...typography.bold,
    fontSize: 13,
    color: V2.ink,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  progressFill: {
    width: "76%",
    height: "100%",
    backgroundColor: V2.blueDeep,
  },
  progressHint: {
    ...typography.semibold,
    marginTop: 6,
    fontSize: 12,
    color: V2.muted,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  ghostButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#000000",
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ghostButtonText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: V2.blueDeep,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  statsRow: {
    marginBottom: 14,
    flexDirection: "row",
    gap: 10,
  },
  statLabel: {
    ...typography.bold,
    fontSize: 12,
    color: V2.muted,
  },
  statValue: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 22,
    color: V2.ink,
    letterSpacing: -0.5,
  },
  bonusCard: {
    backgroundColor: V2.amberSoft,
  },
  bonusLabel: {
    ...typography.semibold,
    fontSize: 12,
    color: V2.amberInk,
  },
  bonusValue: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 22,
    color: V2.amberInk,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: V2.hairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: V2.cyan,
  },
  sectionTitle: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
  },
  sectionAction: {
    ...typography.bold,
    fontSize: 13,
    color: V2.cyan,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: V2.hairline,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDefault: {
    backgroundColor: V2.cyanSoft,
  },
  rowIconBonus: {
    backgroundColor: V2.amberSoft,
  },
  rowTitle: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
  },
  rowWhen: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    color: V2.muted,
  },
  rowAmount: {
    ...typography.bold,
    fontSize: 15,
  },
  emptyActivity: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyActivityText: {
    ...typography.semibold,
    fontSize: 13,
    color: V2.muted,
  },
});
