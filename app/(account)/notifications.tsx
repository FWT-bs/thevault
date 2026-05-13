import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";

type NotifKind = "earn" | "streak" | "cashout" | "system" | "boost";

interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  when: string;
  unread: boolean;
}

const NOTIFS: Notif[] = [
  { id: "n1", kind: "boost", title: "2x boost is live!", body: "Earn double on Block Puzzle Rush for the next 90 minutes.", when: "Just now", unread: true },
  { id: "n2", kind: "earn", title: "+220 CR from Brand Pulse", body: "Survey complete. Credits added to your wallet.", when: "12 min ago", unread: true },
  { id: "n3", kind: "streak", title: "Day 5 streak claimed", body: "Keep it going — Day 6 unlocks +60 CR.", when: "1 hr ago", unread: false },
  { id: "n4", kind: "cashout", title: "PayPal cashout sent", body: "$10.00 will land within 1–3 business days.", when: "Yesterday", unread: false },
  { id: "n5", kind: "system", title: "New verification level available", body: "Upload your address to unlock bank wires.", when: "2 days ago", unread: false },
  { id: "n6", kind: "earn", title: "+1,240 CR from Roulette", body: "Big win on a 5-round streak.", when: "3 days ago", unread: false },
];

const KIND_META: Record<NotifKind, { icon: React.ComponentProps<typeof Ionicons>["name"]; bg: string; tint: string }> = {
  earn: { icon: "sparkles", bg: "#CDEFD8", tint: "#1F5E36" },
  streak: { icon: "flame", bg: "#F6D98A", tint: "#7A5F0A" },
  cashout: { icon: "wallet", bg: "#A9E5FF", tint: GLASS.steelDeep },
  system: { icon: "information-circle", bg: "#DED1FB", tint: "#5B3FB8" },
  boost: { icon: "flash", bg: "#FFD7C2", tint: GLASS.copper },
};

const FILTERS = ["All", "Unread", "Earnings", "Cashouts"] as const;

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>(NOTIFS);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const visible = items.filter((n) => {
    if (filter === "Unread") return n.unread;
    if (filter === "Earnings") return n.kind === "earn" || n.kind === "boost";
    if (filter === "Cashouts") return n.kind === "cashout";
    return true;
  });

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <SubPage
      title="Notifications"
      subtitle="What's been happening in your vault"
      backTo="/home-tab"
      headerAccessory={
        <Pressable
          onPress={markAllRead}
          hitSlop={8}
          style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.markAllText}>Mark all read</Text>
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

      <View style={{ marginTop: 16, gap: 10 }}>
        {visible.map((n, i) => {
          const meta = KIND_META[n.kind];
          return (
            <MotiView
              key={n.id}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 280, delay: i * 50 }}
            >
              <Pressable
                onPress={() => markRead(n.id)}
                style={({ pressed }) => [
                  styles.card,
                  n.unread && styles.cardUnread,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View pointerEvents="none" style={styles.cardInner}>
                  <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={16} color={meta.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
                      {n.unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
                    <Text style={styles.when}>{n.when}</Text>
                  </View>
                </View>
              </Pressable>
            </MotiView>
          );
        })}
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle" size={36} color={GLASS.inkFaint} />
            <Text style={styles.emptyText}>You're all caught up.</Text>
          </View>
        ) : null}
      </View>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  markAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  markAllText: {
    ...typography.bold,
    fontSize: 11,
    color: "#000000",
    letterSpacing: -0.1,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardUnread: {
    borderColor: "rgba(56,189,248,0.5)",
    backgroundColor: "rgba(186,230,253,0.18)",
  },
  cardInner: {
    flexDirection: "row",
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...typography.bold,
    flex: 1,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GLASS.steelDeep,
  },
  body: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: GLASS.inkSoft,
  },
  when: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 10,
    color: GLASS.inkFaint,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  empty: {
    paddingVertical: 50,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    ...typography.semibold,
    fontSize: 13,
    color: GLASS.inkMuted,
  },
});
