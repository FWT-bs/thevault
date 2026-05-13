import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";

const SPEND_LIMITS = ["$10", "$25", "$50", "$100", "Off"] as const;
const TIME_LIMITS = ["30 min", "1 hr", "2 hr", "Off"] as const;

const RESOURCES: { id: string; label: string; hint: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "ncpg", label: "National Council on Problem Gambling", hint: "1-800-522-4700 · 24/7 helpline", icon: "call-outline" },
  { id: "gamtalk", label: "GamTalk peer support", hint: "Anonymous community forum", icon: "chatbubbles-outline" },
  { id: "selfhelp", label: "Self-assessment quiz", hint: "Quick 9-question screen", icon: "clipboard-outline" },
];

export default function ResponsiblePlayPage() {
  const [dailySpend, setDailySpend] = useState<string>("$25");
  const [sessionTime, setSessionTime] = useState<string>("1 hr");
  const [breakReminders, setBreakReminders] = useState(true);
  const [hideWinnings, setHideWinnings] = useState(false);

  return (
    <SubPage
      title="Responsible play"
      subtitle="Stay in control of your time and spend"
      backTo="/profile-tab"
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="heart" size={26} color={GLASS.oxblood} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Play feels best when it stays fun.</Text>
          <Text style={styles.heroBody}>
            Set limits that fit your life. We'll quietly enforce them — and you can always pause anything for as long as you need.
          </Text>
        </View>
      </View>

      <SectionTitle>Daily spend cap</SectionTitle>
      <CardSurface style={{ padding: 14 }}>
        <View style={styles.pillRow}>
          {SPEND_LIMITS.map((limit) => {
            const active = dailySpend === limit;
            return (
              <Pressable
                key={limit}
                onPress={() => setDailySpend(limit)}
                style={({ pressed }) => [
                  styles.pill,
                  active && styles.pillActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.pillText, active && { color: "#000000" }]}>
                  {limit}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </CardSurface>

      <SectionTitle>Session time cap</SectionTitle>
      <CardSurface style={{ padding: 14 }}>
        <View style={styles.pillRow}>
          {TIME_LIMITS.map((limit) => {
            const active = sessionTime === limit;
            return (
              <Pressable
                key={limit}
                onPress={() => setSessionTime(limit)}
                style={({ pressed }) => [
                  styles.pill,
                  active && styles.pillActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.pillText, active && { color: "#000000" }]}>
                  {limit}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </CardSurface>

      <SectionTitle>Reminders</SectionTitle>
      <CardSurface>
        <View style={[styles.toggleRow, styles.rowBorder]}>
          <View style={[styles.toggleIcon, { backgroundColor: "rgba(56,189,248,0.16)" }]}>
            <Ionicons name="alarm-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.toggleLabel}>Break reminders</Text>
            <Text style={styles.toggleHint}>Nudge me every 30 minutes of play</Text>
          </View>
          <Switch
            value={breakReminders}
            onValueChange={setBreakReminders}
            trackColor={{ true: "#7DD3FC", false: "rgba(0,0,0,0.16)" }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={[styles.toggleIcon, { backgroundColor: "rgba(56,189,248,0.16)" }]}>
            <Ionicons name="eye-off-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.toggleLabel}>Hide balances</Text>
            <Text style={styles.toggleHint}>Blur winnings on the home screen</Text>
          </View>
          <Switch
            value={hideWinnings}
            onValueChange={setHideWinnings}
            trackColor={{ true: "#7DD3FC", false: "rgba(0,0,0,0.16)" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </CardSurface>

      <SectionTitle>Take a break</SectionTitle>
      <CardSurface style={{ padding: 6 }}>
        <Pressable
          style={({ pressed }) => [
            styles.breakRow,
            styles.rowBorder,
            pressed && { opacity: 0.78 },
          ]}
        >
          <View pointerEvents="none" style={styles.breakInner}>
            <View style={[styles.breakIcon, { backgroundColor: "rgba(201,162,39,0.18)" }]}>
              <Ionicons name="pause-circle-outline" size={18} color={GLASS.mustard} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Cool-off · 24 hours</Text>
              <Text style={styles.toggleHint}>Lock yourself out for one day</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={GLASS.inkFaint} />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.breakRow,
            pressed && { opacity: 0.78 },
          ]}
        >
          <View pointerEvents="none" style={styles.breakInner}>
            <View style={[styles.breakIcon, { backgroundColor: "rgba(122,30,44,0.16)" }]}>
              <Ionicons name="lock-closed-outline" size={18} color={GLASS.oxblood} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: GLASS.oxblood }]}>Self-exclude</Text>
              <Text style={styles.toggleHint}>Permanent · requires support to reverse</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={GLASS.inkFaint} />
          </View>
        </Pressable>
      </CardSurface>

      <SectionTitle>Get support</SectionTitle>
      <CardSurface>
        {RESOURCES.map((r, i) => (
          <Pressable
            key={r.id}
            style={({ pressed }) => [
              styles.resourceRow,
              i !== RESOURCES.length - 1 && styles.rowBorder,
              pressed && { opacity: 0.78 },
            ]}
          >
            <View pointerEvents="none" style={styles.resourceInner}>
              <View style={styles.resourceIcon}>
                <Ionicons name={r.icon} size={16} color={GLASS.steelDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>{r.label}</Text>
                <Text style={styles.toggleHint}>{r.hint}</Text>
              </View>
              <Ionicons name="open-outline" size={15} color={GLASS.inkFaint} />
            </View>
          </Pressable>
        ))}
      </CardSurface>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(122,30,44,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    ...typography.bold,
    fontSize: 15,
    color: GLASS.ink,
    letterSpacing: -0.3,
  },
  heroBody: {
    ...typography.regular,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: GLASS.inkMuted,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  pillActive: {
    backgroundColor: "#A9E5FF",
  },
  pillText: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: -0.1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  toggleLabel: {
    ...typography.semibold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  toggleHint: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  breakRow: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  breakInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  breakIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resourceRow: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  resourceInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(56,189,248,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
