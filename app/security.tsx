import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../components/SubPage";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

interface Session {
  id: string;
  device: string;
  detail: string;
  current: boolean;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

const SESSIONS: Session[] = [
  { id: "current", device: "iPhone 15 Pro", detail: "San Francisco · This device", current: true, icon: "phone-portrait-outline" },
  { id: "ipad", device: "iPad Air", detail: "San Francisco · 2 days ago", current: false, icon: "tablet-portrait-outline" },
  { id: "web", device: "Safari · MacBook", detail: "San Francisco · 5 days ago", current: false, icon: "laptop-outline" },
];

export default function SecurityPage() {
  const [biometric, setBiometric] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const [withdrawalLock, setWithdrawalLock] = useState(false);

  return (
    <SubPage
      title="Security"
      subtitle="Lock down your vault"
      backTo="/profile-tab"
    >
      <CardSurface style={{ padding: 16 }}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBadge}>
            <Ionicons name="shield-checkmark" size={22} color={GLASS.moss} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreLabel}>Account health</Text>
            <Text style={styles.scoreValue}>Strong</Text>
            <Text style={styles.scoreHint}>2 of 3 hardening steps complete.</Text>
          </View>
        </View>
      </CardSurface>

      <SectionTitle>Sign-in</SectionTitle>
      <CardSurface>
        <ToggleRow
          icon="finger-print"
          iconBg="rgba(56,189,248,0.16)"
          iconTint={GLASS.steelDeep}
          label="Face ID / Touch ID"
          hint="Unlock the app with biometrics"
          value={biometric}
          onChange={setBiometric}
        />
        <ToggleRow
          icon="key"
          iconBg="rgba(201,162,39,0.18)"
          iconTint={GLASS.mustard}
          label="Two-factor auth"
          hint="6-digit code from your authenticator"
          value={twoFA}
          onChange={setTwoFA}
        />
        <View style={[styles.row, styles.rowBorder]}>
          <View style={[styles.icon, { backgroundColor: "rgba(56,189,248,0.14)" }]}>
            <Ionicons name="lock-closed" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Change password</Text>
            <Text style={styles.hint}>Last changed 3 months ago</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={GLASS.inkFaint} />
        </View>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: "rgba(56,189,248,0.14)" }]}>
            <Ionicons name="mail-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Recovery email</Text>
            <Text style={styles.hint}>a••••@example.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={GLASS.inkFaint} />
        </View>
      </CardSurface>

      <SectionTitle>Cashout protection</SectionTitle>
      <CardSurface>
        <ToggleRow
          icon="snow-outline"
          iconBg="rgba(56,189,248,0.16)"
          iconTint={GLASS.steelDeep}
          label="Withdrawal lock"
          hint="Require 24-hour delay on new payouts"
          value={withdrawalLock}
          onChange={setWithdrawalLock}
          isLast
        />
      </CardSurface>

      <SectionTitle>Active sessions</SectionTitle>
      <CardSurface>
        {SESSIONS.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.row,
              i !== SESSIONS.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={[styles.icon, { backgroundColor: "rgba(56,189,248,0.14)" }]}>
              <Ionicons name={s.icon} size={16} color={GLASS.steelDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.deviceRow}>
                <Text style={styles.label}>{s.device}</Text>
                {s.current ? (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentPillText}>This device</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>{s.detail}</Text>
            </View>
            {!s.current ? (
              <Pressable hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Text style={styles.signOut}>Sign out</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </CardSurface>
    </SubPage>
  );
}

function ToggleRow({
  icon,
  iconBg,
  iconTint,
  label,
  hint,
  value,
  onChange,
  isLast,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  iconTint: string;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconTint} />
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#7DD3FC", false: "rgba(0,0,0,0.16)" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(74,107,92,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  scoreValue: {
    ...typography.bold,
    marginTop: 2,
    fontSize: 22,
    color: GLASS.ink,
    letterSpacing: -0.5,
  },
  scoreHint: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    ...typography.semibold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  hint: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.18)",
  },
  currentPillText: {
    ...typography.bold,
    fontSize: 9,
    color: GLASS.steelDeep,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  signOut: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.oxblood,
    letterSpacing: -0.1,
    textDecorationLine: "underline",
  },
});
