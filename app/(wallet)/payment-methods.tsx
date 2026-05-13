import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useAddPaymentMethod, usePaymentMethods } from "../../services/features/paymentMethods";

interface PaymentMethod {
  id: string;
  brand: string;
  detail: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  isDefault?: boolean;
}

const ADD_OPTIONS: { id: string; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; color: string }[] = [
  { id: "card", label: "Debit / credit card", icon: "credit-card-outline", color: "#A9E5FF" },
  { id: "paypal", label: "Add PayPal", icon: "currency-usd", color: "#CDEFD8" },
  { id: "bank", label: "Bank account", icon: "bank-outline", color: "#F6D98A" },
  { id: "crypto", label: "Crypto wallet", icon: "bitcoin", color: "#FFD7C2" },
];

export default function PaymentMethodsPage() {
  const apiMethodsQuery = usePaymentMethods();
  const addMethod = useAddPaymentMethod();
  const visibleMethods: PaymentMethod[] =
    apiMethodsQuery.data?.map((m) => ({
          id: m.id,
          brand: m.methodType,
          detail: m.destinationMasked,
          icon: m.methodType.includes("crypto") ? "bitcoin" : m.methodType.includes("card") ? "credit-card-outline" : "currency-usd",
          color: "#A9E5FF",
          isDefault: m.isDefault,
        })) ?? [];

  return (
    <SubPage
      title="Payment methods"
      subtitle="Where to send your cashouts"
      backTo="/profile-tab"
    >
      <SectionTitle>On file</SectionTitle>
      <View style={{ gap: 10 }}>
        {visibleMethods.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payment methods yet.</Text>
          </View>
        ) : visibleMethods.map((m) => (
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
            </View>
          </View>
        ))}
      </View>

      <SectionTitle>Add a method</SectionTitle>
      <View style={styles.addList}>
        {ADD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => {
              void addMethod.mutateAsync({
                methodType: opt.id,
                destinationMasked: opt.label,
              });
            }}
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
  emptyCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  emptyText: {
    ...typography.semibold,
    fontSize: 13,
    color: GLASS.inkMuted,
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
