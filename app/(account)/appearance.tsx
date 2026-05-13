import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";

const THEMES = [
  { id: "auto", label: "Auto", icon: "contrast" as const, hint: "Match system" },
  { id: "light", label: "Light", icon: "sunny" as const, hint: "Always bright" },
  { id: "dark", label: "Dark", icon: "moon" as const, hint: "Always dim" },
];

const ACCENTS = [
  { id: "cobalt", label: "Cobalt", color: "#7DD3FC" },
  { id: "mint", label: "Mint", color: "#9FE2B5" },
  { id: "copper", label: "Copper", color: "#FFB389" },
  { id: "lilac", label: "Lilac", color: "#BFA8F0" },
  { id: "sun", label: "Sun", color: "#F6D98A" },
  { id: "rose", label: "Rose", color: "#F4A4A4" },
];

const TEXT_SIZES = ["S", "M", "L", "XL"] as const;

export default function AppearancePage() {
  const [theme, setTheme] = useState("auto");
  const [accent, setAccent] = useState("cobalt");
  const [text, setText] = useState<(typeof TEXT_SIZES)[number]>("M");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <SubPage
      title="Appearance"
      subtitle="Make the vault feel like yours"
      backTo="/profile-tab"
    >
      <SectionTitle>Theme</SectionTitle>
      <View style={styles.themeRow}>
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTheme(t.id)}
              style={({ pressed }) => [
                styles.themeCard,
                active && styles.themeCardActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View pointerEvents="none" style={{ alignItems: "center" }}>
                <View
                  style={[
                    styles.themeIconWrap,
                    active && { backgroundColor: "#A9E5FF" },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={20}
                    color={active ? "#000000" : GLASS.steelDeep}
                  />
                </View>
                <Text style={[styles.themeLabel, active && { color: "#000000" }]}>
                  {t.label}
                </Text>
                <Text style={styles.themeHint}>{t.hint}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Accent color</SectionTitle>
      <CardSurface style={{ padding: 14 }}>
        <View style={styles.swatchRow}>
          {ACCENTS.map((a) => {
            const active = accent === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setAccent(a.id)}
                style={({ pressed }) => [
                  styles.swatchOuter,
                  active && styles.swatchOuterActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[styles.swatchInner, { backgroundColor: a.color }]}
                  pointerEvents="none"
                >
                  {active ? <Ionicons name="checkmark" size={16} color="#000000" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.accentName}>
          {ACCENTS.find((a) => a.id === accent)?.label}
        </Text>
      </CardSurface>

      <SectionTitle>Text size</SectionTitle>
      <CardSurface style={{ padding: 12 }}>
        <View style={styles.textSizeRow}>
          {TEXT_SIZES.map((s) => {
            const active = text === s;
            return (
              <Pressable
                key={s}
                onPress={() => setText(s)}
                style={({ pressed }) => [
                  styles.textSizeBtn,
                  active && styles.textSizeBtnActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.textSizeText,
                    s === "S" && { fontSize: 12 },
                    s === "M" && { fontSize: 14 },
                    s === "L" && { fontSize: 16 },
                    s === "XL" && { fontSize: 18 },
                    active && { color: "#000000" },
                  ]}
                >
                  Aa
                </Text>
              </Pressable>
            );
          })}
        </View>
      </CardSurface>

      <SectionTitle>Accessibility</SectionTitle>
      <CardSurface>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={[styles.icon, { backgroundColor: "rgba(56,189,248,0.14)" }]}>
            <Ionicons name="walk-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.rowLabel}>Reduce motion</Text>
            <Text style={styles.rowHint}>Quieter animations across the app</Text>
          </View>
          <Switch
            value={reducedMotion}
            onValueChange={setReducedMotion}
            trackColor={{ true: "#7DD3FC", false: "rgba(0,0,0,0.16)" }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: "rgba(56,189,248,0.14)" }]}>
            <Ionicons name="contrast-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.rowLabel}>Increase contrast</Text>
            <Text style={styles.rowHint}>Bolder borders and stronger ink</Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ true: "#7DD3FC", false: "rgba(0,0,0,0.16)" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </CardSurface>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: "row",
    gap: 10,
  },
  themeCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  themeCardActive: {
    borderColor: "#000000",
    borderWidth: 2,
  },
  themeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(56,189,248,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  themeLabel: {
    ...typography.bold,
    fontSize: 13,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  themeHint: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    color: GLASS.inkMuted,
    letterSpacing: 0.2,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  swatchOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  swatchOuterActive: {
    borderColor: "#000000",
  },
  swatchInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  accentName: {
    ...typography.bold,
    marginTop: 12,
    paddingHorizontal: 4,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  textSizeRow: {
    flexDirection: "row",
    gap: 8,
  },
  textSizeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },
  textSizeBtnActive: {
    backgroundColor: "#A9E5FF",
  },
  textSizeText: {
    ...typography.bold,
    color: GLASS.inkMuted,
    letterSpacing: -0.2,
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
  rowLabel: {
    ...typography.semibold,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  rowHint: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
});
