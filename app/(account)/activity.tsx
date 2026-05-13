import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LiquidGlassCard } from "../../components/LiquidGlassCard";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useWalletTransactions } from "../../services/features/wallet";
import TabScreen from "../../components/TabScreen";

type ActivityKind = "earn" | "redeem" | "streak" | "survey" | "boost";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  text: string;
  detail: string;
  amount: string;
  group: "Today" | "This week" | "Earlier";
}

const META: Record<ActivityKind, { icon: React.ComponentProps<typeof Ionicons>["name"]; bg: string; tint: string }> = {
  earn: { icon: "game-controller", bg: "#A9E5FF", tint: GLASS.steelDeep },
  redeem: { icon: "wallet", bg: "#F4A4A4", tint: GLASS.oxblood },
  streak: { icon: "flame", bg: "#F6D98A", tint: GLASS.mustard },
  survey: { icon: "clipboard", bg: "#9FE2B5", tint: GLASS.moss },
  boost: { icon: "flash", bg: "#FFD7C2", tint: GLASS.copper },
};

const FILTERS = ["All", "Earn", "Redeem", "Bonus"] as const;

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function groupFor(value: string): ActivityItem["group"] {
  const date = new Date(value);
  const now = new Date();
  if (sameDay(date, now)) return "Today";
  return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000 ? "This week" : "Earlier";
}

export default function ActivityPage() {
  const { data: walletTransactions } = useWalletTransactions();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const source: ActivityItem[] =
    walletTransactions?.map((tx) => {
      const kind: ActivityKind = tx.kind === "out" ? "redeem" : tx.kind === "bonus" ? "boost" : "earn";
      return {
        id: tx.id,
        kind,
        text: tx.title,
        detail: tx.detail,
        amount: `${tx.kind === "out" ? "−" : "+"}${tx.currency === "CR" ? `${Math.abs(tx.amount).toLocaleString()} CR` : `$${Math.abs(tx.amount).toFixed(2)}`}`,
        group: groupFor(tx.occurredAt),
      };
    }) ?? [];
  const todayCredits =
    walletTransactions
      ?.filter((tx) => tx.kind !== "out" && groupFor(tx.occurredAt) === "Today")
      .reduce((sum, tx) => sum + (tx.currency === "CR" ? tx.amount : 0), 0) ?? 0;
  const weekCredits =
    walletTransactions
      ?.filter((tx) => tx.kind !== "out" && groupFor(tx.occurredAt) !== "Earlier")
      .reduce((sum, tx) => sum + (tx.currency === "CR" ? tx.amount : 0), 0) ?? 0;
  const cashedOutUsd =
    walletTransactions
      ?.filter((tx) => tx.kind === "out")
      .reduce((sum, tx) => sum + (tx.currency === "CR" ? tx.amount / 100 : tx.amount), 0) ?? 0;

  const visible = source.filter((a) => {
    if (filter === "Earn") return a.kind === "earn";
    if (filter === "Redeem") return a.kind === "redeem";
    if (filter === "Bonus") return a.kind === "streak" || a.kind === "boost" || a.kind === "survey";
    return true;
  });

  const grouped = visible.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <TabScreen
      title="Activity"
      subtitle="Every credit in, every credit out"
      backgroundColor="#FFFFFF"
      titleColor={GLASS.ink}
      subtitleColor={GLASS.inkMuted}
    >
      <LiquidGlassCard cornerRadius={22} innerPadding={0}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Today</Text>
            <Text style={styles.summaryValue}>+{todayCredits.toLocaleString()} CR</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>This week</Text>
            <Text style={styles.summaryValue}>+{weekCredits.toLocaleString()} CR</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Cashed out</Text>
            <Text style={styles.summaryValue}>${cashedOutUsd.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={({ pressed }) => [
                  styles.filterPill,
                  active && styles.filterPillActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.filterText, active && { color: "#000000" }]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
      </LiquidGlassCard>

      {visible.length === 0 ? (
        <View style={{ marginTop: 22 }}>
          <LiquidGlassCard cornerRadius={22} innerPadding={18}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>Wallet credits, bonuses, and redemptions will appear here after this account has activity.</Text>
          </LiquidGlassCard>
        </View>
      ) : null}

      {(["Today", "This week", "Earlier"] as const).map((group) => {
        const rows = grouped[group];
        if (!rows || rows.length === 0) return null;
        return (
          <View key={group} style={{ marginTop: 22 }}>
            <Text style={styles.groupTitle}>{group}</Text>
            <LiquidGlassCard cornerRadius={22} innerPadding={0}>
              {rows.map((item, i) => {
                const meta = META[item.kind];
                const isPositive = !item.amount.startsWith("−");
                const isLast = i === rows.length - 1;
                return (
                  <MotiView
                    key={item.id}
                    from={{ opacity: 0, translateY: 6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 240, delay: i * 35 }}
                  >
                    <View style={[styles.row, !isLast && styles.rowBorder]}>
                      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={15} color={meta.tint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.text}>{item.text}</Text>
                        <Text style={styles.detail}>{item.detail}</Text>
                      </View>
                      <Text
                        style={[
                          styles.amount,
                          { color: isPositive ? "#1F5E36" : "#7A1E2C" },
                          item.amount === "Boost" && { color: GLASS.copper },
                        ]}
                      >
                        {item.amount}
                      </Text>
                    </View>
                  </MotiView>
                );
              })}
            </LiquidGlassCard>
          </View>
        );
      })}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  summaryBlock: { flex: 1, alignItems: "flex-start" },
  summaryLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  summaryValue: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 15,
    color: GLASS.ink,
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  filterPillActive: {
    backgroundColor: "#A9E5FF",
  },
  filterText: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: -0.1,
  },
  emptyTitle: {
    ...typography.bold,
    fontSize: 14,
    color: GLASS.ink,
    textAlign: "center",
  },
  emptyText: {
    ...typography.semibold,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: GLASS.inkMuted,
    textAlign: "center",
  },
  groupTitle: {
    ...typography.bold,
    marginBottom: 8,
    marginLeft: 6,
    fontSize: 11,
    color: "#000000",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.semibold,
    fontSize: 13,
    color: "#000000",
    letterSpacing: -0.2,
  },
  detail: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  amount: {
    ...typography.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
