import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useMe } from "../../services/features/auth";

interface ToggleRow {
  key: string;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  iconTint: string;
  initial: boolean;
}

const SECTIONS: { title: string; rows: ToggleRow[] }[] = [
  {
    title: "Earnings",
    rows: [
      { key: "streak", label: "Daily streak reminders", hint: "We ping you 1 hour before your streak resets", icon: "flame", iconBg: "rgba(255,179,71,0.18)", iconTint: GLASS.copper, initial: true },
      { key: "boost", label: "Boost windows", hint: "When 2x credit boosts go live", icon: "flash", iconBg: "rgba(56,189,248,0.16)", iconTint: GLASS.steelDeep, initial: true },
      { key: "surveys", label: "New surveys", hint: "High-paying surveys matched to you", icon: "clipboard-outline", iconBg: "rgba(159,226,181,0.34)", iconTint: GLASS.moss, initial: false },
    ],
  },
  {
    title: "Wallet",
    rows: [
      { key: "cashout", label: "Cashout updates", hint: "When your redemption ships or clears", icon: "wallet-outline", iconBg: "rgba(56,189,248,0.16)", iconTint: GLASS.steelDeep, initial: true },
      { key: "wins", label: "Big wins", hint: "Anything over 1,000 CR in a single round", icon: "trophy-outline", iconBg: "rgba(201,162,39,0.18)", iconTint: GLASS.mustard, initial: true },
    ],
  },
  {
    title: "Channels",
    rows: [
      { key: "push", label: "Push notifications", hint: "On this device", icon: "phone-portrait-outline", iconBg: "rgba(56,189,248,0.14)", iconTint: GLASS.steelDeep, initial: true },
      { key: "email", label: "Email", hint: "Not added", icon: "mail-outline", iconBg: "rgba(56,189,248,0.14)", iconTint: GLASS.steelDeep, initial: true },
      { key: "sms", label: "SMS", hint: "Only for high-value cashouts", icon: "chatbox-outline", iconBg: "rgba(56,189,248,0.14)", iconTint: GLASS.steelDeep, initial: false },
    ],
  },
];

const QUIET_PRESETS = ["Off", "10 PM – 7 AM", "11 PM – 8 AM", "Custom"] as const;

export default function NotificationSettingsPage() {
  const { data: me } = useMe();
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    SECTIONS.forEach((s) => s.rows.forEach((r) => (out[r.key] = r.initial)));
    return out;
  });
  const [quiet, setQuiet] = useState<string>("10 PM – 7 AM");
  const emailHint = me?.email ?? "Not added";

  return (
    <SubPage
      title="Notifications"
      subtitle="Pick what we ping you about"
      backTo="/profile-tab"
    >
      {SECTIONS.map((section) => (
        <View key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <CardSurface>
            {section.rows.map((row, i) => (
              <View
                key={row.key}
                style={[
                  styles.row,
                  i !== section.rows.length - 1 && styles.rowBorder,
                ]}
              >
                <View style={[styles.icon, { backgroundColor: row.iconBg }]}>
                  <Ionicons name={row.icon} size={16} color={row.iconTint} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{row.label}</Text>
                  <Text style={styles.hint}>{row.key === "email" ? emailHint : row.hint}</Text>
                </View>
                <Switch
                  value={values[row.key]}
                  onValueChange={(v) =>
                    setValues((prev) => ({ ...prev, [row.key]: v }))
                  }
                  trackColor={{ true: "#7DD3FC", false: "rgba(0,0,0,0.16)" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </CardSurface>
        </View>
      ))}

      <SectionTitle>Quiet hours</SectionTitle>
      <CardSurface style={{ padding: 14 }}>
        <Text style={styles.quietHeader}>We'll hold non-critical pings during this window.</Text>
        <View style={styles.quietRow}>
          {QUIET_PRESETS.map((preset) => {
            const active = quiet === preset;
            return (
              <Pressable
                key={preset}
                onPress={() => setQuiet(preset)}
                style={({ pressed }) => [
                  styles.quietPill,
                  active && styles.quietPillActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.quietPillText, active && styles.quietPillTextActive]}>
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </CardSurface>
    </SubPage>
  );
}

const styles = StyleSheet.create({
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
    letterSpacing: -0.1,
  },
  quietHeader: {
    ...typography.semibold,
    marginBottom: 12,
    paddingHorizontal: 6,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  quietRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quietPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  quietPillActive: {
    backgroundColor: "#A9E5FF",
  },
  quietPillText: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: -0.1,
  },
  quietPillTextActive: {
    color: "#000000",
  },
});
