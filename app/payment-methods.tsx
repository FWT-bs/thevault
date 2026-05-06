import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SectionTitle, SubPage } from "../components/SubPage";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

interface PaymentMethod {
  id: string;
  brand: string;
  detail: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  isDefault?: boolean;
}

const INITIAL_METHODS: PaymentMethod[] = [
  { id: "paypal", brand: "PayPal", detail: "alex@example.com", icon: "currency-usd", color: "#A9E5FF", isDefault: true },
  { id: "visa", brand: "Visa debit", detail: "•••• 4421", icon: "credit-card-outline", color: "#DED1FB" },
  { id: "btc", brand: "Bitcoin wallet", detail: "bc1q...x9p2", icon: "bitcoin", color: "#FFD7C2" },
];

const ADD_OPTIONS: { id: string; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; color: string }[] = [
  { id: "card", label: "Debit / credit card", icon: "credit-card-outline", color: "#A9E5FF" },
  { id: "paypal", label: "Add PayPal", icon: "currency-usd", color: "#CDEFD8" },
  { id: "bank", label: "Bank account", icon: "bank-outline", color: "#F6D98A" },
  { id: "crypto", label: "Crypto wallet", icon: "bitcoin", color: "#FFD7C2" },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);

  const setDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id })),
    );
  };
  const remove = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <SubPage
      title="Payment methods"
      subtitle="Where to send your cashouts"
      backTo="/profile-tab"
    >
      <SectionTitle>On file</SectionTitle>
      <View style={{ gap: 10 }}>
        {methods.map((m) => (
          <View key={m.id} style={styles.methodCard}>
            <View style={[styles.methodIcon, { backgroundColor: m.color }]}>
              <MaterialCommunityIcons name={m.icon} size={22} color="#000000" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.methodTopRow}>
                <Text style={styles.methodBrand}>{m.brand}</Text>
                {m.isDefault ? (
                  <View style={styles.defaultPill}>
                    <Ionicons name="checkmark" size={10} color="#000000" />
                    <Text style={styles.defaultPillText}>Default</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.methodDetail}>{m.detail}</Text>
              <View style={styles.methodActions}>
                {!m.isDefault ? (
                  <Pressable
                    onPress={() => setDefault(m.id)}
                    hitSlop={6}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                  >
                    <Text style={styles.actionLink}>Set as default</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => remove(m.id)}
                  hitSlop={6}
                  style={({ pressed }) => pressed && { opacity: 0.7 }}
                >
                  <Text style={[styles.actionLink, { color: GLASS.oxblood }]}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle>Add a method</SectionTitle>
      <View style={styles.addList}>
        {ADD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            style={({ pressed }) => [
              styles.addRow,
              pressed && { opacity: 0.78 },
            ]}
          >
            <View pointerEvents="none" style={styles.addRowContent}>
              <View style={[styles.addIcon, { backgroundColor: opt.color }]}>
                <MaterialCommunityIcons name={opt.icon} size={18} color="#000000" />
              </View>
              <Text style={styles.addLabel}>{opt.label}</Text>
              <Ionicons name="add-circle" size={20} color={GLASS.steelDeep} />
            </View>
          </Pressable>
        ))}
      </View>
    </SubPage>
  );
}

const styles = StyleSheet.create({
  methodCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  methodTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodBrand: {
    ...typography.bold,
    fontSize: 15,
    color: GLASS.ink,
    letterSpacing: -0.3,
  },
  methodDetail: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: -0.1,
  },
  defaultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#CDEFD8",
  },
  defaultPillText: {
    ...typography.bold,
    fontSize: 9,
    color: "#1F5E36",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  methodActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 14,
  },
  actionLink: {
    ...typography.bold,
    fontSize: 12,
    color: GLASS.steelDeep,
    letterSpacing: -0.1,
    textDecorationLine: "underline",
  },
  addList: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  addRow: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  addRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    ...typography.semibold,
    flex: 1,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
});
