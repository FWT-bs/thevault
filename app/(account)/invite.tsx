import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";

const REFERRAL_CODE = "ALEX-VAULT";

interface ChannelButton {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}

const CHANNELS: ChannelButton[] = [
  { id: "imessage", label: "Messages", icon: "message-text-outline", color: "#9FE2B5" },
  { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", color: "#CDEFD8" },
  { id: "email", label: "Email", icon: "email-outline", color: "#A9E5FF" },
  { id: "twitter", label: "X / Twitter", icon: "twitter", color: "#DED1FB" },
  { id: "instagram", label: "Instagram", icon: "instagram", color: "#FFD7C2" },
  { id: "more", label: "More", icon: "share-variant", color: "#F6D98A" },
];

const STEPS: { step: number; label: string; hint: string }[] = [
  { step: 1, label: "Share your code", hint: "Send the link to friends and family" },
  { step: 2, label: "They sign up", hint: "Create an account with your code applied" },
  { step: 3, label: "Both earn 250 CR", hint: "After they finish their first activity" },
];

export default function InvitePage() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SubPage
      title="Invite a friend"
      subtitle="Both of you earn 250 credits"
      backTo="/home-tab"
    >
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420 }}
        style={styles.heroCard}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="people" size={28} color="#000000" />
        </View>
        <Text style={styles.heroNumber}>250 CR</Text>
        <Text style={styles.heroLabel}>For each friend who joins</Text>
        <Text style={styles.heroBody}>
          Your friend gets 250 credits when they sign up. You get 250 more once they finish their first activity.
        </Text>
      </MotiView>

      <SectionTitle>Your referral code</SectionTitle>
      <CardSurface style={{ padding: 16 }}>
        <View style={styles.codeRow}>
          <View>
            <Text style={styles.codeLabel}>Code</Text>
            <Text style={styles.codeValue}>{REFERRAL_CODE}</Text>
          </View>
          <Pressable
            onPress={copy}
            style={({ pressed }) => [
              styles.copyBtn,
              copied && styles.copyBtnDone,
              pressed && { opacity: 0.85 },
            ]}
          >
            <View pointerEvents="none" style={styles.copyContent}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color="#000000"
              />
              <Text style={styles.copyText}>{copied ? "Copied" : "Copy"}</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.linkBox}>
          <Ionicons name="link" size={13} color={GLASS.inkMuted} />
          <Text style={styles.linkText}>thevault.app/join/{REFERRAL_CODE.toLowerCase()}</Text>
        </View>
      </CardSurface>

      <SectionTitle>Share via</SectionTitle>
      <View style={styles.channelGrid}>
        {CHANNELS.map((c) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [
              styles.channelBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View pointerEvents="none" style={{ alignItems: "center" }}>
              <View style={[styles.channelIcon, { backgroundColor: c.color }]}>
                <MaterialCommunityIcons name={c.icon} size={22} color="#000000" />
              </View>
              <Text style={styles.channelLabel}>{c.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <SectionTitle>How it works</SectionTitle>
      <CardSurface style={{ padding: 16, gap: 14 }}>
        {STEPS.map((s) => (
          <View key={s.step} style={styles.stepRow}>
            <View style={styles.stepBubble}>
              <Text style={styles.stepNum}>{s.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>{s.label}</Text>
              <Text style={styles.stepHint}>{s.hint}</Text>
            </View>
          </View>
        ))}
      </CardSurface>

      <SectionTitle>Your referrals</SectionTitle>
      <CardSurface style={{ padding: 16 }}>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>+1,000 CR</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </CardSurface>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFD7C2",
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroNumber: {
    ...typography.bold,
    fontSize: 38,
    color: "#000000",
    letterSpacing: -1.2,
  },
  heroLabel: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroBody: {
    ...typography.regular,
    marginTop: 12,
    paddingHorizontal: 8,
    fontSize: 13,
    lineHeight: 18,
    color: GLASS.inkSoft,
    textAlign: "center",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  codeLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  codeValue: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 22,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  copyBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#A9E5FF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  copyBtnDone: {
    backgroundColor: "#CDEFD8",
  },
  copyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyText: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
    letterSpacing: -0.2,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  linkText: {
    ...typography.semibold,
    fontSize: 12,
    color: GLASS.inkSoft,
    letterSpacing: -0.1,
  },
  channelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  channelBtn: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  channelLabel: {
    ...typography.bold,
    fontSize: 11,
    color: GLASS.ink,
    letterSpacing: -0.1,
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  stepBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A9E5FF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  stepNum: {
    ...typography.bold,
    fontSize: 15,
    color: "#000000",
  },
  stepLabel: {
    ...typography.bold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  stepHint: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBlock: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  statValue: {
    ...typography.bold,
    fontSize: 18,
    color: GLASS.ink,
    letterSpacing: -0.4,
  },
  statLabel: {
    ...typography.bold,
    marginTop: 2,
    fontSize: 9,
    color: GLASS.inkMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
