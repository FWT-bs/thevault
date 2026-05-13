import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";

const QUICK: { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; bg: string; tint: string }[] = [
  { id: "cashout", label: "Cashout help", icon: "wallet-outline", bg: "#A9E5FF", tint: GLASS.steelDeep },
  { id: "credits", label: "Missing credits", icon: "sparkles-outline", bg: "#FFD7C2", tint: GLASS.copper },
  { id: "account", label: "Account access", icon: "key-outline", bg: "#F6D98A", tint: GLASS.mustard },
  { id: "fairplay", label: "Fair play", icon: "shield-checkmark-outline", bg: "#CDEFD8", tint: GLASS.moss },
];

const FAQ: { question: string; answer: string }[] = [
  {
    question: "How long do PayPal cashouts take?",
    answer: "Most PayPal cashouts land in your account within 1–3 business days. Larger payouts above $50 can take up to 5 business days while we run extra fraud checks.",
  },
  {
    question: "Why are my credits pending?",
    answer: "Some partner games and surveys hold credits in pending while the partner verifies the activity — usually under 24 hours, sometimes up to 7 days for surveys.",
  },
  {
    question: "How do daily streak rewards work?",
    answer: "Open the app and play any game once per day to keep your streak alive. Each consecutive day adds a bigger bonus, capped at 10 days.",
  },
  {
    question: "Can I have more than one account?",
    answer: "No — one account per person. Multiple accounts trigger automatic suspension of all linked accounts and forfeit pending credits.",
  },
  {
    question: "How do I delete my account?",
    answer: "Cash out any remaining balance, then tap Personal Info → Delete account. Your data is purged within 30 days as required by law.",
  },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [openQ, setOpenQ] = useState<number | null>(0);

  const filtered = FAQ.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SubPage
      title="Help center"
      subtitle="Search articles or talk to a human"
      backTo="/profile-tab"
    >
      <View style={styles.searchOuter}>
        <Ionicons name="search" size={16} color={GLASS.inkMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search the help center"
          placeholderTextColor={GLASS.inkFaint}
          style={styles.searchInput}
        />
      </View>

      <SectionTitle>Quick topics</SectionTitle>
      <View style={styles.quickGrid}>
        {QUICK.map((q) => (
          <Pressable
            key={q.id}
            style={({ pressed }) => [
              styles.quickCard,
              pressed && { opacity: 0.85 },
            ]}
          >
            <View pointerEvents="none">
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={18} color={q.tint} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
              <View style={styles.quickGoRow}>
                <Text style={styles.quickGoText}>Read</Text>
                <Ionicons name="arrow-forward" size={11} color="#000000" />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Frequently asked</SectionTitle>
      <CardSurface>
        {filtered.map((item, i) => {
          const isOpen = openQ === i;
          const isLast = i === filtered.length - 1;
          return (
            <Pressable
              key={item.question}
              onPress={() => setOpenQ(isOpen ? null : i)}
              style={[
                styles.faqRow,
                !isLast && styles.faqRowBorder,
              ]}
            >
              <View pointerEvents="none">
                <View style={styles.faqQRow}>
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={GLASS.inkMuted}
                  />
                </View>
                {isOpen ? <Text style={styles.faqA}>{item.answer}</Text> : null}
              </View>
            </Pressable>
          );
        })}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No matches. Try messaging support below.</Text>
        ) : null}
      </CardSurface>

      <SectionTitle>Talk to support</SectionTitle>
      <View style={{ gap: 10 }}>
        <ContactRow
          icon="chatbubbles-outline"
          color="#A9E5FF"
          tint={GLASS.steelDeep}
          label="Live chat"
          hint="Replies in under 5 minutes · 24/7"
        />
        <ContactRow
          icon="mail-outline"
          color="#CDEFD8"
          tint={GLASS.moss}
          label="Email support"
          hint="support@thevault.app · 1 business day"
        />
        <ContactRow
          icon="call-outline"
          color="#FFD7C2"
          tint={GLASS.copper}
          label="Phone support"
          hint="Gold and Platinum members · M-F 9-5 PT"
        />
      </View>
    </SubPage>
  );
}

function ContactRow({
  icon,
  color,
  tint,
  label,
  hint,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  tint: string;
  label: string;
  hint: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactCard,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View pointerEvents="none" style={styles.contactInner}>
        <View style={[styles.contactIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactLabel}>{label}</Text>
          <Text style={styles.contactHint}>{hint}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={GLASS.inkFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchOuter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    ...typography.semibold,
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 110,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  quickLabel: {
    ...typography.bold,
    marginTop: 12,
    fontSize: 13,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  quickGoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  quickGoText: {
    ...typography.bold,
    fontSize: 11,
    color: "#000000",
    letterSpacing: -0.1,
    textDecorationLine: "underline",
  },
  faqRow: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  faqRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  faqQRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQ: {
    ...typography.semibold,
    flex: 1,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  faqA: {
    ...typography.regular,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: GLASS.inkMuted,
  },
  empty: {
    ...typography.semibold,
    padding: 16,
    fontSize: 13,
    color: GLASS.inkMuted,
    textAlign: "center",
  },
  contactCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contactInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    ...typography.bold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  contactHint: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
});
