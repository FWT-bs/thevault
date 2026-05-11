import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FlatCard } from "../components/FlatCard";
import { V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { useMe } from "../services/features/auth";
import { usePaymentMethods } from "../services/features/paymentMethods";
import { useVaultLevel } from "../services/features/vaultLevel";
import TabScreen from "./_tab-screen";

const ACCOUNT_ROWS = [
  { label: "Personal info", icon: "account-circle-outline", route: "/personal-info" },
  { label: "Verification", icon: "shield-check", detail: "Level 2", route: "/verification" },
] as const;

const PREF_ROWS = [
  { label: "Notifications", icon: "bell-outline", detail: "On", route: "/notification-settings" },
  { label: "Security", icon: "lock-outline", route: "/security" },
  { label: "Language", icon: "translate", detail: "English", route: "/appearance" },
] as const;

export default function ProfileTab() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: paymentMethods } = usePaymentMethods();
  const { data: vaultLevel } = useVaultLevel();
  const tierName = vaultLevel?.currentTier.shortName ?? "Starter";
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? 3000);
  const progressPct = Math.round((vaultLevel?.progressToNext ?? 0) * 100);
  const displayName = me?.displayName ?? "Player";
  const accountRows = [
    ...ACCOUNT_ROWS,
    { label: "Payment methods", icon: "credit-card-outline", detail: `${paymentMethods?.length ?? 0}`, route: "/payment-methods" },
    { label: "Vault Level", icon: "trophy-outline", detail: `${tierName} · ${shareLabel}`, route: "/vault-level" },
  ] as const;

  return (
    <TabScreen
      title="Profile"
      subtitle="Account, preferences, and security"
      backgroundColor={V2.bg}
      titleColor={V2.ink}
      subtitleColor={V2.muted}
    >
      <FlatCard radius={24} pad={18} style={{ marginBottom: 14 }}>
        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLetter}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.meta}>{me?.email ?? "Vault account"} · {tierName} · {shareLabel} share</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={V2.faint} />
        </View>
        <View style={styles.tierBlock}>
          <View style={styles.tierTop}>
            <Text style={styles.tierLabel}>Vault Level progress</Text>
            <Text style={styles.tierLabel}>{progressPct}% to {vaultLevel?.nextTier?.shortName ?? "Bronze"}</Text>
          </View>
          <View style={styles.tierTrack}>
            <View style={[styles.tierFill, { width: `${progressPct}%` }]} />
          </View>
        </View>
      </FlatCard>

      <View style={styles.statsRow}>
        <StatTile label="Verified ads" value={`${vaultLevel?.lifetimeVerifiedAds ?? 0}`} icon="play-circle-outline" tint={V2.cyanSoft} iconColor={V2.cyan} />
        <StatTile label="Trust" value={`${vaultLevel?.trustScore ?? 50}`} icon="shield-checkmark-outline" tint={V2.amberSoft} iconColor={V2.amber} />
        <StatTile label="Share" value={shareLabel} icon="trending-up" tint={V2.cyanSoft} iconColor={V2.cyan} />
      </View>

      <SectionHeader title="Account" color={V2.cyan} />
      <FlatCard radius={20} pad={0} style={{ marginBottom: 14 }}>
        {accountRows.map((row, i) => (
          <MenuRow
            key={row.label}
            label={row.label}
            icon={row.icon}
            detail={"detail" in row ? row.detail : undefined}
            bg={V2.cyanSoft}
            color={V2.cyan}
            isLast={i === accountRows.length - 1}
            onPress={() => router.push(row.route)}
          />
        ))}
      </FlatCard>

      <SectionHeader title="Preferences" color={V2.amber} />
      <FlatCard radius={20} pad={0}>
        {PREF_ROWS.map((row, i) => (
          <MenuRow
            key={row.label}
            label={row.label}
            icon={row.icon}
            detail={"detail" in row ? row.detail : undefined}
            bg={V2.amberSoft}
            color={V2.amber}
            isLast={i === PREF_ROWS.length - 1}
            onPress={() => router.push(row.route)}
          />
        ))}
      </FlatCard>
    </TabScreen>
  );
}

function StatTile({
  label,
  value,
  icon,
  tint,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tint: string;
  iconColor: string;
}) {
  return (
    <FlatCard radius={18} pad={14} style={{ flex: 1 }}>
      <View style={styles.statTop}>
        <Text style={styles.statValue}>{value}</Text>
        <View style={[styles.statIconWrap, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </FlatCard>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function MenuRow({
  label,
  icon,
  detail,
  bg,
  color,
  isLast,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  detail?: string;
  bg: string;
  color: string;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
      <View style={[styles.menuRow, !isLast && styles.menuBorder]}>
        <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        {detail ? <Text style={styles.menuDetail}>{detail}</Text> : null}
        <Ionicons name="chevron-forward" size={15} color={V2.faint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: V2.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: V2.cyan,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  avatarLetter: {
    ...typography.bold,
    fontSize: 26,
    color: "#FFFFFF",
  },
  name: {
    ...typography.bold,
    fontSize: 22,
    color: V2.ink,
  },
  meta: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 13,
    color: V2.muted,
  },
  tierBlock: {
    marginTop: 14,
    backgroundColor: V2.amberSoft,
    borderRadius: 14,
    padding: 12,
  },
  tierTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierLabel: {
    ...typography.bold,
    fontSize: 12,
    color: V2.amberInk,
  },
  tierTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(122,63,0,0.12)",
    overflow: "hidden",
  },
  tierFill: {
    width: "68%",
    height: "100%",
    backgroundColor: V2.amber,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: {
    ...typography.bold,
    fontSize: 22,
    color: V2.ink,
    letterSpacing: -0.5,
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 12,
    color: V2.muted,
  },
  sectionHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    ...typography.bold,
    fontSize: 15,
    color: V2.ink,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: V2.hairline,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    ...typography.bold,
    flex: 1,
    fontSize: 15,
    color: V2.ink,
  },
  menuDetail: {
    ...typography.semibold,
    fontSize: 13,
    color: V2.muted,
  },
});
