import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SubPage } from "../../components/SubPage";
import { GLASS, GLASS_SURFACE } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useWalletTransactions } from "../../services/features/wallet";

type TxStatus = "completed" | "pending" | "processing" | "review" | "reversed";
type TxKind = "in" | "out" | "bonus";

interface Tx {
  id: string;
  title: string;
  kind: TxKind;
  when: string;
  amount: string;
  status: TxStatus;
  detail: string;
}

const STATUS_META: Record<TxStatus, { label: string; bg: string; tint: string }> = {
  completed: { label: "Done", bg: "#CDEFD8", tint: "#1F5E36" },
  pending: { label: "Pending", bg: "#F6D98A", tint: "#7A5F0A" },
  processing: { label: "Processing", bg: "#E5E7EB", tint: "#5B5F6A" },
  review: { label: "Review", bg: "#FFD7C2", tint: "#7A1E2C" },
  reversed: { label: "Reversed", bg: "#F4A4A4", tint: "#7A1E2C" },
};

const KIND_META: Record<TxKind, { icon: React.ComponentProps<typeof Ionicons>["name"]; tint: string; bg: string }> = {
  in: { icon: "arrow-down", tint: GLASS.moss, bg: "rgba(74,107,92,0.16)" },
  out: { icon: "arrow-up", tint: GLASS.oxblood, bg: "rgba(122,30,44,0.14)" },
  bonus: { icon: "sparkles", tint: GLASS.mustard, bg: "rgba(201,162,39,0.18)" },
};

const FILTERS = ["All", "Pending", "Completed", "Cash out", "Review"] as const;

export default function TransactionsPage() {
  const { data: walletTransactions } = useWalletTransactions();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const source: Tx[] =
    walletTransactions?.map((tx) => ({
      id: tx.id,
      title: tx.title,
      kind: tx.kind as TxKind,
      when: tx.occurredAt,
      amount: `${tx.kind === "out" ? "−" : "+"}${tx.currency === "CR" ? `${Math.abs(tx.amount)} CR` : `$${Math.abs(tx.amount).toFixed(2)}`}`,
      status: (tx.status === "failed" ? "review" : tx.status) as TxStatus,
      detail: tx.detail,
    })) ?? [];

  const visible = source.filter((tx) => {
    if (filter === "Pending") return tx.status === "pending" || tx.status === "processing";
    if (filter === "Completed") return tx.status === "completed";
    if (filter === "Cash out") return tx.kind === "out";
    if (filter === "Review") return tx.status === "review" || tx.status === "reversed";
    return true;
  });

  return (
    <SubPage
      title="Transactions"
      subtitle="Every credit and dollar in one place"
      backTo="/wallet-tab"
      headerAccessory={
        <Pressable
          hitSlop={8}
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="download-outline" size={14} color="#000000" />
          <Text style={styles.exportText}>Export</Text>
        </Pressable>
      }
    >
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

      <View style={styles.list}>
        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>Credits, pending rewards, and cash outs will appear here once this account has activity.</Text>
          </View>
        ) : visible.map((tx, i) => {
          const meta = KIND_META[tx.kind];
          const status = STATUS_META[tx.status];
          const positive = tx.kind !== "out";
          const isLast = i === visible.length - 1;
          const isOpen = expanded === tx.id;
          return (
            <Pressable
              key={tx.id}
              onPress={() => setExpanded(isOpen ? null : tx.id)}
              style={[styles.txRow, !isLast && styles.txRowBorder]}
            >
              <View pointerEvents="none">
                <View style={styles.txTop}>
                  <View style={[styles.txIcon, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={16} color={meta.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <View style={styles.txMeta}>
                      <Text style={styles.txWhen}>{tx.when}</Text>
                      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.tint }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: positive ? GLASS.moss : GLASS.oxblood },
                    ]}
                  >
                    {tx.amount}
                  </Text>
                </View>
                {isOpen ? (
                  <View style={styles.expanded}>
                    <Text style={styles.expandedDetail}>{tx.detail}</Text>
                    <View style={styles.expandedActions}>
                      <Text style={styles.expandedAction}>View receipt</Text>
                      {tx.kind === "out" ? (
                        <Text style={styles.expandedAction}>Get help</Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  exportText: {
    ...typography.bold,
    fontSize: 11,
    color: "#000000",
    letterSpacing: -0.1,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  filterPillActive: { backgroundColor: "#A9E5FF" },
  filterText: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: -0.1,
  },
  list: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 8,
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
  txRow: {
    paddingVertical: 14,
  },
  txRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS_SURFACE.edgeInk,
  },
  txTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    ...typography.semibold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  txMeta: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txWhen: {
    ...typography.regular,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  statusPill: {
    paddingVertical: 1,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  statusText: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  txAmount: {
    ...typography.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  expanded: {
    marginTop: 12,
    marginLeft: 50,
  },
  expandedDetail: {
    ...typography.semibold,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  expandedActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  expandedAction: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.steelDeep,
    letterSpacing: -0.1,
    textDecorationLine: "underline",
  },
});
